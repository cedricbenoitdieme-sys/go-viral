# Runs both collectors back to back and keeps a timestamped log per run.
# Scheduled locally via Windows Task Scheduler (see scraper/register-task.ps1);
# no CI/GitHub dependency. Secrets come from scraper/.env (gitignored).

$ErrorActionPreference = "Continue"
Set-Location -LiteralPath $PSScriptRoot
New-Item -ItemType Directory -Force -Path "logs" | Out-Null

$stamp = Get-Date -Format "yyyyMMdd-HHmm"
$log = Join-Path "logs" "run-$stamp.log"

function Write-Log([string]$text) {
  Write-Host $text
  $text | Out-File -FilePath $log -Append -Encoding utf8
}

# Keep the machine from going idle-to-sleep while we run
# (ES_CONTINUOUS | ES_SYSTEM_REQUIRED). Cleared automatically when this process exits.
Add-Type -Namespace Win32 -Name Power -MemberDefinition '[DllImport("kernel32.dll")] public static extern uint SetThreadExecutionState(uint esFlags);'
[void][Win32.Power]::SetThreadExecutionState([uint32]2147483649)  # 0x80000001; a hex literal parses as negative Int32

Write-Log "=== Go Viral scrape started $(Get-Date -Format o) ==="

# A wake-from-sleep start can beat the wifi reconnecting: wait up to 10 min for the network.
$online = $false
for ($i = 0; $i -lt 40 -and -not $online; $i++) {
  try {
    Invoke-WebRequest -Uri "https://www.gstatic.com/generate_204" -UseBasicParsing -TimeoutSec 8 | Out-Null
    $online = $true
  } catch {
    if ($i -eq 0) { Write-Log "network not reachable yet, waiting..." }
    Start-Sleep -Seconds 15
  }
}
if (-not $online) {
  Write-Log "no network after 10 min, skipping this run (next scheduled run will retry)"
  exit 0
}

foreach ($entry in @("src/index.ts", "src/index-tiktok.ts")) {
  Write-Log "--- $entry ---"
  # cmd merges stderr into stdout itself, so PowerShell never wraps the
  # scraper's console.error lines into noisy NativeCommandError records.
  cmd.exe /c "npx.cmd tsx --env-file=.env $entry 2>&1" | ForEach-Object { Write-Log $_ }
}

Write-Log "=== finished $(Get-Date -Format o) ==="

Get-ChildItem "logs" -Filter "run-*.log" |
  Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-14) } |
  Remove-Item -Force
