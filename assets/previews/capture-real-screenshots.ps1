# Run with XAMPP Apache on, then replace preview JPGs with real project screenshots.
# Usage: powershell -ExecutionPolicy Bypass -File capture-real-screenshots.ps1

$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$out = Join-Path $PSScriptRoot "."
$shots = @{
    "afrispace.jpg" = "http://localhost/Afri_Space/"
    "nexpesa.jpg"    = "http://localhost/NexPesa/"
    "uniscope.jpg"   = "http://localhost/Uni_Scope1/login.php"
}

foreach ($name in $shots.Keys) {
    $url = $shots[$name]
    Write-Host "Capturing $name from $url ..."
    & $chrome --headless --disable-gpu --hide-scrollbars --window-size=1400,900 `
        --screenshot="$out\$name" $url 2>&1 | Out-Null
    if (Test-Path "$out\$name") { Write-Host "  OK" } else { Write-Host "  FAILED (is XAMPP running?)" }
}

Write-Host "Done. Refresh portfolio to see updated previews."
