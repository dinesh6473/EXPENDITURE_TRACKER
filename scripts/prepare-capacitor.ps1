$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$target = Join-Path $root "mobile-web"

if (Test-Path $target) {
    Remove-Item $target -Recurse -Force
}

New-Item -ItemType Directory -Path $target | Out-Null

$filesToCopy = @(
    "index.html",
    "login.html",
    "signup.html",
    "dashboard.html",
    "add-expense.html",
    "analytics.html",
    "auto-pay.html",
    "history.html",
    "profile.html",
    "savings.html"
)

foreach ($file in $filesToCopy) {
    Copy-Item (Join-Path $root $file) $target
}

Copy-Item (Join-Path $root "css") (Join-Path $target "css") -Recurse
Copy-Item (Join-Path $root "js") (Join-Path $target "js") -Recurse

Write-Host "Prepared Capacitor web assets in $target"
