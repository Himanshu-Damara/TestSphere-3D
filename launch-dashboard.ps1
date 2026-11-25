$projectDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path
$dashboardUrl = 'http://localhost:3000/platform/'
$ready = $false
try {
  $response = Invoke-WebRequest -Uri $dashboardUrl -UseBasicParsing -TimeoutSec 2
  $ready = $response.StatusCode -eq 200
} catch {}
if (-not $ready) {
  Start-Process -FilePath 'node.exe' -ArgumentList 'server.js' -WorkingDirectory $projectDirectory -WindowStyle Hidden
  for ($attempt = 0; $attempt -lt 30; $attempt++) {
    Start-Sleep -Milliseconds 500
    try {
      $response = Invoke-WebRequest -Uri $dashboardUrl -UseBasicParsing -TimeoutSec 2
      if ($response.StatusCode -eq 200) { $ready = $true; break }
    } catch {}
  }
}
if (-not $ready) {
  Write-Error 'Dashboard did not start. Run npm install, then try again.'
  exit 1
}
Start-Process $dashboardUrl
