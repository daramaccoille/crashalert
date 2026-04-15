# Sync Secrets script for CrashAlert
# Usage:
# .\scripts\sync-secrets.ps1 -Type pages -File .\web\.env.local -Project crashalert
# .\scripts\sync-secrets.ps1 -Type worker -File .\worker\.dev.vars -Project crashalertworker

param (
    [Parameter(Mandatory=$true)]
    [ValidateSet("pages", "worker")]
    $Type,

    [Parameter(Mandatory=$true)]
    $File,

    [Parameter(Mandatory=$true)]
    $Project
)

if (-not (Test-Path $File)) {
    Write-Error "File not found: $File"
    exit 1
}

Write-Host "Reading ${File} and syncing to Cloudflare (${Type}: ${Project})..." -ForegroundColor Cyan

# Read file, ignoring comments and empty lines
Get-Content $File | Where-Object { $_ -match '=' -and $_ -notmatch '^#' } | ForEach-Object {
    $parts = $_.Split('=', 2)
    $key = $parts[0].Trim()
    $value = $parts[1].Trim().Trim('"').Trim("'")

    if ($key -ne "") {
        Write-Host "Syncing $key..." -ForegroundColor Yellow
        
        if ($Type -eq "pages") {
            # Pages requires setting variables via project config
            npx wrangler pages project config vars set "$key=$value" --project-name $Project
        } else {
            # Workers use secret put (interactive by default, using echo to pipe)
            $value | npx wrangler secret put $key --name $Project
        }
    }
}

Write-Host "Sync Complete!" -ForegroundColor Green
