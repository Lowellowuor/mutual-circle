$root = "C:\Users\Administrator\Documents\mutual-circle"
$backendRoot = Join-Path $root "backend"
$baseUrl = "http://127.0.0.1:8000"

Write-Host "=== SETUP: kill old server, start fresh ===" -ForegroundColor Cyan
Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue | ForEach-Object {
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
}
Start-Sleep -Seconds 1

$proc = Start-Process -FilePath "$backendRoot\.venv\Scripts\python.exe" `
    -ArgumentList "-m","uvicorn","mtc.main:app","--host","127.0.0.1","--port","8000","--app-dir","$backendRoot\src" `
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

if (-not $ready) {
    Write-Host "  Backend failed to become healthy in 60s" -ForegroundColor Red
    Write-Host "  --- .test.err (last 40) ---" -ForegroundColor Yellow
    Get-Content "$backendRoot\.test.err" -Tail 40 -ErrorAction SilentlyContinue | ForEach-Object { Write-Host "    $_" }
    Write-Host "  --- .test.log (last 40) ---" -ForegroundColor Yellow
    Get-Content "$backendRoot\.test.log" -Tail 40 -ErrorAction SilentlyContinue | ForEach-Object { Write-Host "    $_" }
    Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue |
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
$requesterPhone = "+254700" + $runId.ToString().PadRight(6, '0').Substring(0, 6)
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

Write-Host ""
Write-Host "=== FLOW B: Swap request lifecycle ===" -ForegroundColor Cyan
$swapBody = '{"bundle_category":"Standard Pantry","locker_location":"Kibera Hub"}'
$swapResp = Invoke-Post "/requests/swap" -Headers @{ "X-Token" = $requesterToken } -Body $swapBody
Assert "B1. POST /requests/swap" (-not $swapResp.__error -and $swapResp.pin) $swapResp.__message
$swapRequestId = if ($swapResp.id) { $swapResp.id } else { "FAIL" }
$swapPin = if ($swapResp.pin) { $swapResp.pin } else { "????" }

$notif4 = Invoke-Get "/notifications/mine" -Headers @{ "X-Token" = $requesterToken }
$hasSwapNotif = -not $notif4.__error -and ($notif4.notifications | Where-Object { $_.template -eq "swap_submitted" -and $_.content -match $swapPin })
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
Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue |
    ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
Write-Host "  Stopped" -ForegroundColor Green
