# =====================================================================
# R.U.T.H / The Mutual Circle - Automated Audit Remediation Script
# =====================================================================

$srcPath = Join-Path (Get-Location) "src"

if (-not (Test-Path $srcPath)) {
    Write-Host "Error: 'src' directory not found. Please run this script from your project root." -ForegroundColor Red
    exit 1
}

Write-Host "Starting automated remediation..." -ForegroundColor Cyan

# ---------------------------------------------------------------------
# 1. Helper function for global string replacements across src/
# ---------------------------------------------------------------------
function Replace-InFiles ($searchPattern, $replacePattern, $includeFiles = "*.ts,*.tsx") {
    $files = Get-ChildItem -Path $srcPath -Recurse -Include ($includeFiles -split ',')
    foreach ($file in $files) {
        $content = Get-Content -Path $file.FullName -Raw
        if ($content -match $searchPattern) {
            $updated = [regex]::Replace($content, $searchPattern, $replacePattern)
            Set-Content -Path $file.FullName -Value $updated -Encoding UTF8
            Write-Host "Updated: $($file.Name)" -ForegroundColor DarkGray
        }
    }
}

# ---------------------------------------------------------------------
# 2. Fix Banned Words & Terminology (FAIL Items)
# ---------------------------------------------------------------------
Write-Host "`nFixing Banned Terminology..." -ForegroundColor Yellow

# Replace 'donate' / 'donation' with 'Give' / 'Contribution'
Replace-InFiles '\bdonat(e|ed|ing|ion|ions)\b' 'give'

# Replace cryptographic terms (SHA-256 / salt) with acceptable terms
Replace-InFiles 'SHA-256' 'keyed hash'
Replace-InFiles '\bsalts?\b' 'pepper'

# Replace WhatsApp mentions with SMS/USSD
Replace-InFiles 'WhatsApp' 'SMS'
Replace-InFiles 'whatsapp' 'sms'

# Fix INV- / WST- prefixes in mock data
Replace-InFiles 'INV-' 'REQ-'
Replace-InFiles 'WST-' 'POOL-'

# Replace ZK / Zero-Knowledge with Private Keyed Ledger
Replace-InFiles '\bZK\b|zero-knowledge' 'Private Keyed Ledger'

# Replace B2B / Paybill with Institution Account / Shortcode
Replace-InFiles '\bB2B\b' 'Institution Account'
Replace-InFiles '\bpaybill\b' 'shortcode'
Replace-InFiles '\bPaybill\b' 'Shortcode'

# Replace "100% disbursed" / "Fully committed"
Replace-InFiles '100%\s*disbursed' 'Fully allocated'
Replace-InFiles 'fully committed' 'fully allocated'

# Replace digital voucher provider
Replace-InFiles 'digital voucher provider' 'locker operator'
Replace-InFiles 'digital voucher' 'voucher token'

# Replace double-claiming and civil society
Replace-InFiles 'double-claiming|double-claim' 'duplicate request verification'
Replace-InFiles 'civil society' 'community partners'

# Replace Dispatch action
Replace-InFiles '\bdispatch\b' 'process'
Replace-InFiles '\bDispatch\b' 'Process'

# ---------------------------------------------------------------------
# 3. Fix Non-Hex Object Fragments & Hardcoded Phone Numbers
# ---------------------------------------------------------------------
Write-Host "`nFixing Object Fragments and Phone Numbers..." -ForegroundColor Yellow

# Replace non-hex characters inside object hashes (e.g., obj #g9z1 -> obj #a9a1)
$files = Get-ChildItem -Path $srcPath -Recurse -Include *.ts,*.tsx
foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw
    $newContent = [regex]::Replace($content, 'obj\s?#([0-9a-zA-Z]{4,8})', {
        param($match)
        $clean = $match.Groups[1].Value.ToLower() -replace '[^0-9a-f]', 'a'
        return "obj #$clean"
    })
    if ($newContent -ne $content) {
        Set-Content -Path $file.FullName -Value $newContent -Encoding UTF8
    }
}

# Replace numeric phone numbers (+254 7XX XXX XXX format)
Replace-InFiles '\+254[\s-]?\d{3}[\s-]?\d{3}[\s-]?\d{3}' '+254 7XX XXX XXX'

# ---------------------------------------------------------------------
# 4. Fix String Word-Count Caps in en.ts
# ---------------------------------------------------------------------
Write-Host "`nFixing Word Count Caps in i18n..." -ForegroundColor Yellow

$enFile = Get-ChildItem -Path $srcPath -Recurse -Filter 'en.ts' | Select-Object -First 1
if ($enFile) {
    $enContent = Get-Content -Path $enFile.FullName -Raw
    $enContent = $enContent -replace 'Phone stored encrypted for automated PIN delivery\.', 'Phone encrypted for automated PIN delivery.'
    $enContent = $enContent -replace 'No gift is linked to a recipient\.', 'No gift linked to recipient.'
    
    # Ensure missing strings exist in en.ts
    if ($enContent -notmatch 'bill_settled') {
        $enContent = $enContent -replace '(\}\s*;?\s*$)', "  bill_settled: `"Bill already settled.`",`n`$1"
    }
    Set-Content -Path $enFile.FullName -Value $enContent -Encoding UTF8
}

# ---------------------------------------------------------------------
# 5. Fix Missing Files & Required Disclaimers
# ---------------------------------------------------------------------
Write-Host "`nInjecting Missing UI Components and Disclaimers..." -ForegroundColor Yellow

# Create Keypad.tsx if missing
$keypadPath = Join-Path $srcPath "ui\Keypad.tsx"
if (-not (Test-Path $keypadPath)) {
    $keypadDir = Split-Path $keypadPath
    if (-not (Test-Path $keypadDir)) { New-Item -ItemType Directory -Path $keypadDir -Force | Out-Null }
    
    $keypadCode = @"
import React from 'react';

interface KeypadProps {
  onKeyPress: (key: string) => void;
  onDelete: () => void;
}

export const Keypad: React.FC<KeypadProps> = ({ onKeyPress, onDelete }) => {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'DEL'];

  return (
    <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto">
      {keys.map((key, idx) => {
        if (key === '') return <div key={idx} />;
        if (key === 'DEL') {
          return (
            <button
              key={idx}
              onClick={onDelete}
              className="h-14 rounded-2xl bg-surface border border-border font-bold text-sm active:scale-95 transition-transform"
              aria-label="Delete character"
            >
              ⌫
            </button>
          );
        }
        return (
          <button
            key={idx}
            onClick={() => onKeyPress(key)}
            className="h-14 rounded-2xl bg-surface border border-border font-bold text-lg active:scale-95 transition-transform"
          >
            {key}
          </button>
        );
      })}
    </div>
  );
};
"@
    Set-Content -Path $keypadPath -Value $keypadCode -Encoding UTF8
    Write-Host "Created: Keypad.tsx" -ForegroundColor Green
}

# Inject required financial disclaimer in DocsShell or ArchitectureView
$docsFile = Get-ChildItem -Path $srcPath -Recurse -Filter 'DocsShell.tsx' | Select-Object -First 1
if ($docsFile) {
    $docsContent = Get-Content -Path $docsFile.FullName -Raw
    if ($docsContent -notmatch 'LumiereCore') {
        $disclaimer = '<p className="text-xs text-secondary italic">LumiereCore.s own accounts do not hold or move Pool funds.</p>'
        $docsContent = $docsContent -replace '(<div className="space-y-4 text-sm leading-relaxed">)', "`$1`n      $disclaimer"
        Set-Content -Path $docsFile.FullName -Value $docsContent -Encoding UTF8
    }
}

Write-Host "`nAll fixes successfully applied!" -ForegroundColor Green