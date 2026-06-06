param(
  [Parameter(Mandatory = $true)]
  [string]$BotToken,

  [Parameter(Mandatory = $true)]
  [string]$AppUrl
)

$cleanAppUrl = $AppUrl.TrimEnd("/")
$miniAppUrl = "$cleanAppUrl/telegram/add-task"
$body = @{
  menu_button = @{
    type = "web_app"
    text = "Add Task"
    web_app = @{
      url = $miniAppUrl
    }
  }
} | ConvertTo-Json -Depth 5

Invoke-RestMethod `
  -Method Post `
  -Uri "https://api.telegram.org/bot$BotToken/setChatMenuButton" `
  -ContentType "application/json" `
  -Body $body

Write-Host "Telegram Add Task menu button set to $miniAppUrl"
