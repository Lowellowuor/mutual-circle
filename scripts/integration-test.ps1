$root = "C:\Users\Administrator\Documents\mutual-circle"
$backendRoot = Join-Path $root "backend"
$baseUrl = "http://127.0.0.1:8010"

Write-Host "=== SETUP: kill old server, start fresh ===" -ForegroundColor Cyan
# Aggressive kill: port listener + any python from our venv
Get-NetTCPConnection -LocalPort 8010 -State Listen -ErrorAction SilentlyContinue | ForEach-Object {
    try { Stop-Process -Id $_.OwningProcess -Force -ErrorAction Stop } catch {}
}
Get-Process python* -ErrorAction SilentlyContinue | Where-Object {
    $_.Path -and $_.Path -like "*mutual-circle\backend\.venv\*"
} | ForEach-Object {
    try { Stop-Process -Id $_.Id -Force -ErrorAction Stop } catch {}
}

# Wait until port 8000 is truly free (up to 10s)
$waited = 0
while ($waited -lt 10) {
    $listener = Get-NetTCPConnection -LocalPort 8010 -State Listen -ErrorAction SilentlyContinue
    if (-not $listener) { break }
    Start-Sleep -Seconds 1
    $waited++
}
if (Get-NetTCPConnection -LocalPort 8010 -State Listen -ErrorAction SilentlyContinue) {
    throw "Port 8000 still occupied after aggressive kill - aborting test"
}

# Truncate startup logs so we can see THIS run's output
if (Test-Path "$backendRoot\.test.err") { Clear-Content "$backendRoot\.test.err" -ErrorAction SilentlyContinue }
if (Test-Path "$backendRoot\.test.log") { Clear-Content "$backendRoot\.test.log" -ErrorAction SilentlyContinue }

# PYTHONPATH is more reliable than --app-dir when spawning via Start-Process
$env:PYTHONPATH = "$backendRoot\src"
$proc = Start-Process -FilePath "$backendRoot\.venv\Scripts\python.exe" `
    -ArgumentList "-m","uvicorn","mtc.main:app","--host","127.0.0.1","--port","8010" `
    -WorkingDirectory $backendRoot -NoNewWindow -PassThru `
    -RedirectStandardOutput "$backendRoot\.test.log" `
    -RedirectStandardError "$backendRoot\.test.err"

Write-Host "  Started PID $($proc.Id), polling /health for readiness (up to 60s)..." -ForegroundColor Gray
$ready = $false
$start = [System.Diagnostics.Stopwatch]::StartNew()
1..60 | ForEach-Object {
    if (-not $ready) {
        Start-Sleep -Seconds 1
        try {
            $null = Invoke-RestMethod "$baseUrl/health" -TimeoutSec 2 -ErrorAction Stop
            $ready = $true
            Write-Host "  Backend healthy after $([int]$start.Elapsed.TotalSeconds)s" -ForegroundColor Green
        } catch {}
    }
}

if ($ready) {
    # Verify THIS process is the one listening (not a stale one that survived)
    $listener = Get-NetTCPConnection -LocalPort 8010 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($listener) {
        $listenerExe = try { (Get-Process -Id $listener.OwningProcess -ErrorAction Stop).Path } catch { "unknown" }
        if ($listenerExe -notlike "*mutual-circle\backend\.venv\*") {
            Write-Host "  WARN: port 8000 owned by $listenerExe (not our venv python)" -ForegroundColor Yellow
        }
    }
}

if (-not $ready) {
    Write-Host "  Backend failed to become healthy in 60s" -ForegroundColor Red
    Write-Host "  --- .test.err (last 40) ---" -ForegroundColor Yellow
    Get-Content "$backendRoot\.test.err" -Tail 40 -ErrorAction SilentlyContinue | ForEach-Object { Write-Host "    $_" }
    Write-Host "  --- .test.log (last 40) ---" -ForegroundColor Yellow
    Get-Content "$backendRoot\.test.log" -Tail 40 -ErrorAction SilentlyContinue | ForEach-Object { Write-Host "    $_" }
    Get-NetTCPConnection -LocalPort 8010 -State Listen -ErrorAction SilentlyContinue |
        ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
    Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    return
}

# FIX 1: List[object] instead of fixed-size @()
$results = [System.Collections.Generic.List[object]]::new()

function Assert {
    param([string]$Name, [bool]$Pass, [string]$Detail = "")
    # FIX 2: .Add() mutation (works across scope) instead of += assignment
    $null = $results.Add([PSCustomObject]@{ Name = $Name; Pass = $Pass; Detail = $Detail })
    $color = if ($Pass) { "Green" } else { "Red" }
    $icon  = if ($Pass) { "PASS" }  else { "FAIL" }
    Write-Host "  [$icon] $Name" -ForegroundColor $color
    if ($Detail -and -not $Pass) { Write-Host "         $Detail" -ForegroundColor Yellow }
}

function Invoke-Post {
    param([string]$Path, [hashtable]$Headers = @{}, [string]$Body = "", [string]$ContentType = "application/json")
    try {
        $params = @{ Uri = "$baseUrl$Path"; Method = "Post"; Headers = $Headers; TimeoutSec = 10; ErrorAction = "Stop" }
        if ($Body) { $params["Body"] = $Body }
        if ($ContentType) { $params["ContentType"] = $ContentType }
        return Invoke-RestMethod @params
    } catch {
        $status = $null
        try { $status = $_.Exception.Response.StatusCode.value__ } catch {}
        return @{ __error = $true; __status = $status; __message = $_.Exception.Message }
    }
}

function Invoke-Get {
    param([string]$Path, [hashtable]$Headers = @{})
    try {
        return Invoke-RestMethod -Uri "$baseUrl$Path" -Method Get -Headers $Headers -TimeoutSec 10 -ErrorAction Stop
    } catch {
        $status = $null
        try { $status = $_.Exception.Response.StatusCode.value__ } catch {}
        return @{ __error = $true; __status = $status; __message = $_.Exception.Message }
    }
}

$runId = [int][double]::Parse((Get-Date -UFormat %s))
$tail = ($runId % 10000).ToString().PadLeft(4, '0')
$rand = (Get-Random -Minimum 0 -Maximum 100).ToString().PadLeft(2, '0')
$requesterPhone = "+254700" + $tail + $rand
$donorHash = "test-donor-" + $runId

Write-Host ""
Write-Host "  Run ID: $runId" -ForegroundColor Gray
Write-Host "  Test phone: $requesterPhone" -ForegroundColor Gray
Write-Host "  Test donor hash: $donorHash" -ForegroundColor Gray
Write-Host ""

$ledgerBefore = Invoke-Get "/ledger/public?limit=1"
$ledgerCountBefore = if ($ledgerBefore.__error) { -1 } else { $ledgerBefore.entry_count }

Write-Host "=== FLOW A: Pool request lifecycle ===" -ForegroundColor Cyan
$tokenResp = Invoke-Post "/tokens" -Body "{`"phone`":`"$requesterPhone`"}"
Assert "A1. POST /tokens" (-not $tokenResp.__error -and $tokenResp.token) $tokenResp.__message
$requesterToken = if ($tokenResp.token) { $tokenResp.token } else { "FAIL" }

$poolBody = '{"category":"hospital_invoice","hashed_object_id":"objhash-pipeline-test-' + $runId + '","amount_pence":1200000}'
$poolResp = Invoke-Post "/requests/pool" -Headers @{ "X-Token" = $requesterToken } -Body $poolBody
Assert "A2. POST /requests/pool (Tier 3)" (-not $poolResp.__error -and $poolResp.status -eq "pending_check") "Expected pending_check, got $($poolResp.status) / err=$($poolResp.__message)"
$poolRequestId = if ($poolResp.id) { $poolResp.id } else { "FAIL" }

$mineResp = Invoke-Get "/requests/mine" -Headers @{ "X-Token" = $requesterToken }
Assert "A3. GET /requests/mine shows it" (-not $mineResp.__error -and ($mineResp.requests | Where-Object { $_.id -eq $poolRequestId })) $mineResp.__message

$notif1 = Invoke-Get "/notifications/mine" -Headers @{ "X-Token" = $requesterToken }
$hasPendingNotif = -not $notif1.__error -and ($notif1.notifications | Where-Object { $_.template -eq "pool_pending" })
Assert "A4. Notification 'pool_pending' created" ([bool]$hasPendingNotif) $notif1.__message

$fulfLogin = Invoke-Post "/staff/login" -Body '{"role":"fulfilment","staff_id":"FULF-08","pin":"7355"}'
Assert "A5. POST /staff/login (Fulfilment)" (-not $fulfLogin.__error -and $fulfLogin.session_token) $fulfLogin.__message
$fulfJwt = if ($fulfLogin.session_token) { $fulfLogin.session_token } else { "FAIL" }

$queue = Invoke-Get "/fulfilment/queue" -Headers @{ "Authorization" = "Bearer $fulfJwt" }
$inQueue = -not $queue.__error -and ($queue.pool | Where-Object { $_.id -eq $poolRequestId })
Assert "A6. GET /fulfilment/queue shows request" ([bool]$inQueue) $queue.__message

$blockedDispatch = Invoke-Post "/fulfilment/requests/$poolRequestId/dispatch" -Headers @{ "Authorization" = "Bearer $fulfJwt" }
Assert "A7. Dispatch blocked (Tier 3 pending)" ($blockedDispatch.__error -and $blockedDispatch.__status -eq 409) "Expected 409, got $($blockedDispatch.__status)"

$auditLogin = Invoke-Post "/staff/login" -Body '{"role":"audit","staff_id":"AUDIT-02","pin":"9142"}'
Assert "A8. POST /staff/login (Audit)" (-not $auditLogin.__error -and $auditLogin.session_token) $auditLogin.__message
$auditJwt = if ($auditLogin.session_token) { $auditLogin.session_token } else { "FAIL" }

$ocrQueue = Invoke-Get "/audit/ocr-queue" -Headers @{ "Authorization" = "Bearer $auditJwt" }
$inOcr = -not $ocrQueue.__error -and ($ocrQueue.requests | Where-Object { $_.id -eq $poolRequestId })
Assert "A9. GET /audit/ocr-queue shows request" ([bool]$inOcr) $ocrQueue.__message

$ocrComplete = Invoke-Post "/audit/ocr/$poolRequestId/complete" -Headers @{ "Authorization" = "Bearer $auditJwt" }
Assert "A10. POST /audit/ocr/{id}/complete" (-not $ocrComplete.__error -and $ocrComplete.status -eq "verified") $ocrComplete.__message

$notif2 = Invoke-Get "/notifications/mine" -Headers @{ "X-Token" = $requesterToken }
$hasVerifiedNotif = -not $notif2.__error -and ($notif2.notifications | Where-Object { $_.template -eq "verified" })
Assert "A11. Notification 'verified' created" ([bool]$hasVerifiedNotif) $notif2.__message

$dispatchResp = Invoke-Post "/fulfilment/requests/$poolRequestId/dispatch" -Headers @{ "Authorization" = "Bearer $fulfJwt" }
Assert "A12. POST dispatch (verified)" (-not $dispatchResp.__error -and $dispatchResp.receipt) $dispatchResp.__message

$notif3 = Invoke-Get "/notifications/mine" -Headers @{ "X-Token" = $requesterToken }
$hasDispatchedNotif = -not $notif3.__error -and ($notif3.notifications | Where-Object { $_.template -eq "dispatched" })
Assert "A13. Notification 'dispatched' created" ([bool]$hasDispatchedNotif) $notif3.__message

$ledgerAfter = Invoke-Get "/ledger/public?limit=20"
$ledgerCountAfter = if ($ledgerAfter.__error) { -1 } else { $ledgerAfter.entry_count }
Assert "A14. Ledger entry count increased" ($ledgerCountAfter -eq ($ledgerCountBefore + 1)) "Before=$ledgerCountBefore After=$ledgerCountAfter"

Assert "A15. Ledger chain_ok after dispatch" ($ledgerAfter.chain_ok -eq $true) "chain_ok=$($ledgerAfter.chain_ok)"

$kplcRedemptions = Invoke-Get "/partners/me/redemptions" -Headers @{ "X-Partner-Key" = "kplc-demo-key-2026" }
$kplcSees = -not $kplcRedemptions.__error -and ($kplcRedemptions.redemptions | Where-Object { $_.id -eq $poolRequestId })
Assert "A16. KPLC sees dispatched request" ([bool]$kplcSees) $kplcRedemptions.__message

# ============================================================
# FLOW A2: Collection confirmation
# ============================================================
Write-Host ""
Write-Host "=== FLOW A2: Collection confirmation ===" -ForegroundColor Cyan

# Create a swap request (has PIN, unlike pool requests)
$collSwapBody = '{"bundle_category":"Standard Pantry","locker_location":"Kibera Hub"}'
$collSwapResp = Invoke-Post "/requests/swap" -Headers @{ "X-Token" = $requesterToken } -Body $collSwapBody
Assert "A17. Create swap for collection" (-not $collSwapResp.__error -and $collSwapResp.id -and $collSwapResp.pin) $collSwapResp.__message
$collSwapId = if ($collSwapResp.id) { $collSwapResp.id } else { "FAIL" }
$collPin = if ($collSwapResp.pin) { $collSwapResp.pin } else { "FAIL" }

# Wrong PIN -> 403
$collBad = Invoke-Post "/requests/$collSwapId/collect" -Headers @{ "X-Token" = $requesterToken } -Body '{"pin":"9999"}'
Assert "A18. Collect wrong PIN -> 403" ($collBad.__error -and $collBad.__status -eq 403) "Expected 403, got $($collBad.__status) / $($collBad.__message)"

# Correct PIN -> 200, status collected
$collOk = Invoke-Post "/requests/$collSwapId/collect" -Headers @{ "X-Token" = $requesterToken } -Body ('{"pin":"' + $collPin + '"}')
Assert "A19. Collect correct PIN -> collected" (-not $collOk.__error -and $collOk.status -eq "collected") "Expected collected, got $($collOk.status) / $($collOk.__message)"

# Duplicate collect -> 409
$collDup = Invoke-Post "/requests/$collSwapId/collect" -Headers @{ "X-Token" = $requesterToken } -Body ('{"pin":"' + $collPin + '"}')
Assert "A20. Duplicate collect -> 409" ($collDup.__error -and $collDup.__status -eq 409) "Expected 409, got $($collDup.__status)"

# Notification 'collected' created
$collNotif = Invoke-Get "/notifications/mine" -Headers @{ "X-Token" = $requesterToken }
$hasCollNotif = -not $collNotif.__error -and ($collNotif.notifications | Where-Object { $_.template -eq "collected" })
Assert "A21. Notification 'collected' created" ([bool]$hasCollNotif) $collNotif.__message

# ============================================================
# FLOW A3: PIN-only collection (SMS/USSD/WhatsApp)
# ============================================================
Write-Host ""
Write-Host "=== FLOW A3: PIN-only collection ===" -ForegroundColor Cyan

$pinSwap = Invoke-Post "/requests/swap" -Headers @{ "X-Token" = $requesterToken } -Body '{"bundle_category":"Standard Pantry","locker_location":"Kibera Hub"}'
Assert "A22. Create swap for PIN-only collect" (-not $pinSwap.__error -and $pinSwap.id -and $pinSwap.pin) $pinSwap.__message
$pinSwapPin = if ($pinSwap.pin) { $pinSwap.pin } else { "FAIL" }

$pinCollect = Invoke-Post "/requests/collect" -Headers @{ "X-Token" = $requesterToken } -Body ('{"pin":"' + $pinSwapPin + '"}')
Assert "A23. POST /requests/collect {pin} -> 200" (-not $pinCollect.__error -and $pinCollect.status -eq "collected") "Expected collected, got $($pinCollect.status) / $($pinCollect.__message)"

$pinDup = Invoke-Post "/requests/collect" -Headers @{ "X-Token" = $requesterToken } -Body ('{"pin":"' + $pinSwapPin + '"}')
Assert "A24. Second PIN-only collect -> 409" ($pinDup.__error -and $pinDup.__status -eq 409) "Expected 409, got $($pinDup.__status) / $($pinDup.__message)"

# A25: verify pin_hash is written for the fresh swap
$mineCheck = Invoke-Get "/requests/mine" -Headers @{ "X-Token" = $requesterToken }
$freshSwap = if (-not $mineCheck.__error) { $mineCheck.requests | Where-Object { $_.id -eq $pinSwap.id } | Select-Object -First 1 } else { $null }
$freshMd = @{}
if ($freshSwap -and $freshSwap.metadata) {
    $mdRaw = $freshSwap.metadata
    if ($mdRaw -is [string]) {
        try { $freshMd = $mdRaw | ConvertFrom-Json } catch { $freshMd = @{} }
    } else {
        $freshMd = $mdRaw
    }
}
$hashValue = if ($freshMd.pin_hash) { $freshMd.pin_hash } else { "" }
$hasPinHash = ($hashValue -is [string]) -and ($hashValue.Length -gt 20) -and $hashValue.StartsWith('$2b$')
Assert "A25. pin_hash written for fresh swap" ([bool]$hasPinHash) "Expected bcrypt hash, got type: $($freshMd.GetType().Name)"

# ============================================================
# A26-A28: Idempotency-Key support
# ============================================================
Write-Host ""
Write-Host "=== IDEMPOTENCY: duplicate POST protection ===" -ForegroundColor Cyan

# Create a fresh donor hash for this test (so we don't collide with C1-C5)
$idemDonorHash = "test-idem-" + $runId
$idemKey = [guid]::NewGuid().ToString()
$idemDonBody = '{"amount_pence":7777,"is_anonymous":true,"opt_in_ledger":false}'

$idemPost1 = Invoke-Post "/donations" -Headers @{ "X-Donor-Hash" = $idemDonorHash; "Idempotency-Key" = $idemKey } -Body $idemDonBody
$idemPost2 = Invoke-Post "/donations" -Headers @{ "X-Donor-Hash" = $idemDonorHash; "Idempotency-Key" = $idemKey } -Body $idemDonBody

Assert "A26. Same Idempotency-Key -> same response ID" (-not $idemPost1.__error -and -not $idemPost2.__error -and $idemPost1.id -and $idemPost1.id -eq $idemPost2.id) "id1=$($idemPost1.id) id2=$($idemPost2.id) err=$($idemPost1.__message)"

# Verify only one row created in DB (via /donations/mine)
Start-Sleep -Milliseconds 200
$idemMine = Invoke-Get "/donations/mine" -Headers @{ "X-Donor-Hash" = $idemDonorHash }
$idemCount = 0
if (-not $idemMine.__error -and $null -ne $idemMine.donations) {
    $idemCount = @($idemMine.donations | Where-Object { $_.amount_pence -eq 7777 }).Count
}
if ($null -eq $idemCount) { $idemCount = 0 }
Assert "A27. Same Idempotency-Key -> only 1 row in DB" ($idemCount -eq 1) "Found $idemCount rows"

# Different key -> two rows
$idemKey2 = [guid]::NewGuid().ToString()
$idemPost3 = Invoke-Post "/donations" -Headers @{ "X-Donor-Hash" = $idemDonorHash; "Idempotency-Key" = $idemKey2 } -Body $idemDonBody
Start-Sleep -Milliseconds 200
$idemMine2 = Invoke-Get "/donations/mine" -Headers @{ "X-Donor-Hash" = $idemDonorHash }
$idemMatches2 = if ($idemMine2.__error) { @() } else { @($idemMine2.donations | Where-Object { $_.amount_pence -eq 7777 }) }
Assert "A28. Different Idempotency-Key -> 2 rows" ($idemMatches2.Count -eq 2) "Found $($idemMatches2.Count) rows"

# ============================================================
# A29-A33: Pledge -> Request linkage + auto-settle on collect
# ============================================================
Write-Host ""
Write-Host "=== PLEDGE LINKAGE ===" -ForegroundColor Cyan

$plBody = '{"type":"goods","description":"Pipeline pledge ' + $runId + '","locality":"Nairobi County"}'
$plResp = Invoke-Post "/pledges" -Headers @{ "X-Donor-Hash" = $donorHash } -Body $plBody
Assert "A29. Create pledge" (-not $plResp.__error -and $plResp.id) $plResp.__message
$pledgeId = if ($plResp.id) { $plResp.id } else { "FAIL" }

$plSwapBody = '{"bundle_category":"Standard Pantry","locker_location":"Kibera Hub"}'
$plSwap = Invoke-Post "/requests/swap" -Headers @{ "X-Token" = $requesterToken } -Body $plSwapBody
$plSwapId = if ($plSwap.id) { $plSwap.id } else { "FAIL" }
$plPin = if ($plSwap.pin) { $plSwap.pin } else { "FAIL" }

$matchBody = '{"request_id":"' + $plSwapId + '"}'
$matchResp = Invoke-Post "/fulfilment/pledges/$pledgeId/match" -Headers @{ "Authorization" = "Bearer $fulfJwt" } -Body $matchBody
Assert "A30. Match pledge -> request" (-not $matchResp.__error -and $matchResp.status -eq "matched") $matchResp.__message

Start-Sleep -Milliseconds 200
$plMine = Invoke-Get "/pledges/mine" -Headers @{ "X-Donor-Hash" = $donorHash }
$matchedPledge = $null
if (-not $plMine.__error -and $plMine.pledges) {
    $matchedPledge = @($plMine.pledges | Where-Object { $_.id -eq $pledgeId })[0]
}
$pStatus = if ($matchedPledge) { if ($matchedPledge.status) { $matchedPledge.status } else { $matchedPledge.Status } } else { "NONE" }
Assert "A31. Pledge status -> matched" ($pStatus -eq "matched") "pledgeId=$pledgeId status=$pStatus"

$collectBody = '{"pin":"' + $plPin + '"}'
$collectResp = Invoke-Post "/requests/$plSwapId/collect" -Headers @{ "X-Token" = $requesterToken } -Body $collectBody
Assert "A32. Collect linked request" (-not $collectResp.__error -and $collectResp.status -eq "collected") $collectResp.__message

Start-Sleep -Milliseconds 300
$plMine2 = Invoke-Get "/pledges/mine" -Headers @{ "X-Donor-Hash" = $donorHash }
$settledPledge = $null
if (-not $plMine2.__error -and $plMine2.pledges) {
    $settledPledge = @($plMine2.pledges | Where-Object { $_.id -eq $pledgeId })[0]
}
$pStatus2 = if ($settledPledge) { if ($settledPledge.status) { $settledPledge.status } else { $settledPledge.Status } } else { "NONE" }
Assert "A33. Pledge auto-settled after collect" ($pStatus2 -eq "settled") "status=$pStatus2"




Write-Host ""
Write-Host "=== FLOW B: Swap request lifecycle ===" -ForegroundColor Cyan
$swapBody = '{"bundle_category":"Standard Pantry","locker_location":"Kibera Hub"}'
$swapResp = Invoke-Post "/requests/swap" -Headers @{ "X-Token" = $requesterToken } -Body $swapBody
Assert "B1. POST /requests/swap" (-not $swapResp.__error -and $swapResp.pin) $swapResp.__message
$swapRequestId = if ($swapResp.id) { $swapResp.id } else { "FAIL" }
$swapPin = if ($swapResp.pin) { $swapResp.pin } else { "????" }

$notif4 = Invoke-Get "/notifications/mine" -Headers @{ "X-Token" = $requesterToken }
$hasSwapNotif = -not $notif4.__error -and ($notif4.notifications | Where-Object { $_.template -eq "swap_submitted" -and $_.content.Contains($swapPin) })
Assert "B2. Notification 'swap_submitted' with PIN" ([bool]$hasSwapNotif) $notif4.__message

$chuiRedemptions = Invoke-Get "/partners/me/redemptions" -Headers @{ "X-Partner-Key" = "chui-demo-key-2026" }
$chuiSees = -not $chuiRedemptions.__error -and ($chuiRedemptions.redemptions | Where-Object { $_.id -eq $swapRequestId })
Assert "B3. CHUI sees swap request" ([bool]$chuiSees) $chuiRedemptions.__message

Write-Host ""
Write-Host "=== FLOW C: Donor lifecycle ===" -ForegroundColor Cyan
$donationBody = '{"amount_pence":250000,"is_anonymous":true,"opt_in_ledger":true}'
$donationResp = Invoke-Post "/donations" -Headers @{ "X-Donor-Hash" = $donorHash } -Body $donationBody
Assert "C1. POST /donations" (-not $donationResp.__error -and $donationResp.id) $donationResp.__message

$donorMine = Invoke-Get "/donations/mine" -Headers @{ "X-Donor-Hash" = $donorHash }
$hasDonation = -not $donorMine.__error -and ($donorMine.donations | Where-Object { $_.amount_pence -eq 250000 })
Assert "C2. GET /donations/mine shows it" ([bool]$hasDonation) $donorMine.__message

$profileBody = '{"display_name":"Pipeline Test ' + $runId + '","opt_in_ledger":true}'
$profileResp = Invoke-Post "/donations/profile" -Headers @{ "X-Donor-Hash" = $donorHash } -Body $profileBody
Assert "C3. POST /donations/profile (join leaderboard)" (-not $profileResp.__error -and $profileResp.opt_in_ledger) $profileResp.__message

$leaderboard = Invoke-Get "/donations/leaderboard?limit=100"
$onBoard = -not $leaderboard.__error -and ($leaderboard.leaderboard | Where-Object { $_.display_name -eq "Pipeline Test $runId" })
Assert "C4. GET /donations/leaderboard shows name" ([bool]$onBoard) $leaderboard.__message

$publicPartners = Invoke-Get "/partners/public"
$hasThree = -not $publicPartners.__error -and ($publicPartners.partners.Count -ge 3)
Assert "C5. GET /partners/public (3+ partners)" ([bool]$hasThree) $publicPartners.__message

Write-Host ""
Write-Host "=== FLOW D: Household + public surfaces ===" -ForegroundColor Cyan
$hhResp = Invoke-Post "/requests/household" -Headers @{ "X-Token" = $requesterToken } -Body '{"household_size":5}'
Assert "D1. POST /requests/household (size 5)" (-not $hhResp.__error -and $hhResp.household_size -eq 5) $hhResp.__message

$hhGet = Invoke-Get "/requests/household" -Headers @{ "X-Token" = $requesterToken }
Assert "D2. GET /requests/household returns 5" (-not $hhGet.__error -and $hhGet.household_size -eq 5) $hhGet.__message

$helplines = Invoke-Get "/helplines"
$hasHelplines = -not $helplines.__error -and ($helplines.helplines.Count -ge 3)
Assert "D3. GET /helplines (3+ lines)" ([bool]$hasHelplines) $helplines.__message

$opps = Invoke-Get "/opportunities"
$hasOpps = -not $opps.__error -and ($opps.opportunities.Count -ge 3)
Assert "D4. GET /opportunities (3+ items)" ([bool]$hasOpps) $opps.__message

$stats = Invoke-Get "/stats/impact"
Assert "D5. GET /stats/impact returns numbers" (-not $stats.__error -and $stats.total_pooled_pence -ge 0) $stats.__message

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  SUMMARY" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

$passed = (@($results | Where-Object { $_.Pass })).Count
$total  = $results.Count
$failed = $total - $passed

foreach ($r in $results) {
    $icon = if ($r.Pass) { "PASS" } else { "FAIL" }
    $color = if ($r.Pass) { "Green" } else { "Red" }
    Write-Host "  [$icon] $($r.Name)" -ForegroundColor $color
}

Write-Host ""
Write-Host "  Total: $passed / $total passed" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })

if ($failed -gt 0) {
    Write-Host ""
    Write-Host "  FAILURES:" -ForegroundColor Red
    $results | Where-Object { -not $_.Pass } | ForEach-Object {
        Write-Host "    - $($_.Name)" -ForegroundColor Red
        Write-Host "      $($_.Detail)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "  Test artifacts for this run:" -ForegroundColor Gray
Write-Host "    Requester token: $requesterToken" -ForegroundColor Gray
Write-Host "    Pool request ID: $poolRequestId" -ForegroundColor Gray
Write-Host "    Swap request ID: $swapRequestId" -ForegroundColor Gray
Write-Host "    Swap PIN: $swapPin" -ForegroundColor Gray
Write-Host "    Donor hash: $donorHash" -ForegroundColor Gray

Write-Host ""
Write-Host "=== Stopping test server ===" -ForegroundColor Cyan
Get-NetTCPConnection -LocalPort 8010 -State Listen -ErrorAction SilentlyContinue |
    ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
Write-Host "  Stopped" -ForegroundColor Green
