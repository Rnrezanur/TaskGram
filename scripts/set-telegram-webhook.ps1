param(
  [Parameter(Mandatory = $true)]
  [string]$BotToken,

  [Parameter(Mandatory = $true)]
  [string]$AppUrl,

  [Parameter(Mandatory = $true)]
  [string]$WebhookSecret
)

$cleanAppUrl = $AppUrl.TrimEnd("/")
$webhookUrl = "$cleanAppUrl/api/telegram/webhook"
$body = @{
  url = $webhookUrl
  secret_token = $WebhookSecret
} | ConvertTo-Json

Invoke-RestMethod `
  -Method Post `
  -Uri "https://api.telegram.org/bot$BotToken/setWebhook" `
  -ContentType "application/json" `
  -Body $body

Write-Host "Telegram webhook set to $webhookUrl"
