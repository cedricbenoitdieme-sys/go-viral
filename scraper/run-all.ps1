# Runs both collectors back to back and keeps a timestamped log per run.
# Scheduled locally via Windows Task Scheduler (see scraper/register-task.ps1);
# no CI/GitHub dependency. Secrets come from scraper/.env (gitignored).

$ErrorActionPreference = "Continue"
Set-Location -LiteralPath $PSScriptRoot
New-Item -ItemType Directory -Force -Path "logs" | Out-Null

$stamp = Get-Date -Format "yyyyMMdd-HHmm"
$log = Join-Path "logs" "run-$stamp.log"

"=== Go Viral scrape started $(Get-Date -Format o) ===" | Tee-Object -FilePath $log

foreach ($entry in @("src/index.ts", "src/index-tiktok.ts")) {
  "--- $entry ---" | Tee-Object -FilePath $log -Append
  & npx.cmd tsx --env-file=.env $entry 2>&1 | Tee-Object -FilePath $log -Append
}

"=== finished $(Get-Date -Format o) ===" | Tee-Object -FilePath $log -Append

Get-ChildItem "logs" -Filter "run-*.log" |
  Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-14) } |
  Remove-Item -Force
