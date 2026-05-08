$ErrorActionPreference = "Stop"

$AppRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$Port = if ($env:PORT) { [int]$env:PORT } else { 4177 }
$Url = "http://127.0.0.1:$Port/index.html"

function Test-LocalPort {
  param([int]$PortNumber)
  $client = New-Object System.Net.Sockets.TcpClient
  try {
    $async = $client.BeginConnect("127.0.0.1", $PortNumber, $null, $null)
    if (-not $async.AsyncWaitHandle.WaitOne(300)) {
      return $false
    }
    $client.EndConnect($async)
    return $true
  } catch {
    return $false
  } finally {
    $client.Close()
  }
}

function Find-Python {
  $pyLauncher = Get-Command py -ErrorAction SilentlyContinue
  if ($pyLauncher) {
    return @{ File = $pyLauncher.Source; Args = @("-3") }
  }

  $python = Get-Command python -ErrorAction SilentlyContinue
  if ($python) {
    return @{ File = $python.Source; Args = @() }
  }

  return $null
}

$python = Find-Python
if (-not $python) {
  Write-Host "Python 3 is required to run Kids Schedule Studio." -ForegroundColor Yellow
  Write-Host "Opening the Python download page..."
  Start-Process "https://www.python.org/downloads/windows/"
  Read-Host "Install Python 3 with 'Add python.exe to PATH' checked, then press Enter to close"
  exit 1
}

Set-Location $AppRoot

if (Test-LocalPort -PortNumber $Port) {
  Write-Host "Kids Schedule Studio is already running at $Url"
  Start-Process $Url
  Read-Host "Press Enter to close this window"
  exit 0
}

Write-Host "Starting Kids Schedule Studio..."
Write-Host $Url
Start-Process $Url

$serverArgs = @($python.Args) + @("-m", "http.server", "$Port", "--bind", "127.0.0.1")
& $python.File @serverArgs
