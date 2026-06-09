param(
  [Parameter(Mandatory = $true)]
  [string]$BotToken,

  [Parameter(Mandatory = $true)]
  [string]$AppUrl
)

$cleanAppUrl = $AppUrl.TrimEnd("/")
$miniAppUrl = "$cleanAppUrl/telegram/workspace"
$body = @{
  menu_button = @{
    type = "web_app"
    text = "TaskGram"
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

Write-Host "Telegram TaskGram workspace menu button set to $miniAppUrl"
