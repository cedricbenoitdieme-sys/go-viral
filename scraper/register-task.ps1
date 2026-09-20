# One-time setup: registers a Windows scheduled task that runs run-all.ps1
# every 6 hours for the current user (only while logged on, so no password is
# stored). Missed runs (PC off/asleep) fire as soon as the machine is back.
#
#   Register:   powershell -ExecutionPolicy Bypass -File register-task.ps1
#   Run now:    Start-ScheduledTask -TaskName GoViral-Scraper
#   Remove:     Unregister-ScheduledTask -TaskName GoViral-Scraper -Confirm:$false

$taskName = "GoViral-Scraper"
$script = Join-Path $PSScriptRoot "run-all.ps1"

$action = New-ScheduledTaskAction `
  -Execute "powershell.exe" `
  -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$script`"" `
  -WorkingDirectory $PSScriptRoot

$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(2) `
  -RepetitionInterval (New-TimeSpan -Hours 6)

$settings = New-ScheduledTaskSettingsSet `
  -StartWhenAvailable `
  -WakeToRun `
  -RunOnlyIfNetworkAvailable `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -MultipleInstances IgnoreNew `
  -ExecutionTimeLimit (New-TimeSpan -Hours 5)

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings `
  -Description "Go Viral: YouTube + TikTok collectors, every 6h" -Force | Out-Null

Get-ScheduledTask -TaskName $taskName | Select-Object TaskName, State
