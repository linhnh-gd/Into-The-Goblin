#requires -Version 5.1
<#
  deploy_vercel.ps1 -- deploy prototype/ len Vercel KHONG can Node/npm/vercel CLI.
  Dung Vercel REST API v13 (POST /v13/deployments) voi files inline base64.

  Vi sao lam the nay: may nay khong co Node nen khong cai duoc `vercel` CLI.
  Chi can mot Access Token.

  1) Lay token: https://vercel.com/account/tokens  -> Create Token (scope: Full Account)
  2) Chay:
        .\deploy_vercel.ps1 -Token "xxxxx"
     hoac dat bien moi truong roi chay khong can tham so:
        $env:VERCEL_TOKEN = "xxxxx"; .\deploy_vercel.ps1

  Tham so:
    -Token    Vercel access token (hoac dung $env:VERCEL_TOKEN)
    -Project  Ten project tren Vercel (mac dinh into-the-goblin)
    -Team     Team/org slug neu deploy vao team (khong bat buoc)
    -Prod     Deploy thang vao production (mac dinh la preview)
    -DryRun   Chi liet ke file se gui, khong goi API

  ASCII-only source: PowerShell 5.1 doc sai file .ps1 UTF-8.
#>
param(
  [string]$Token = $env:VERCEL_TOKEN,
  [string]$Project = 'into-the-goblin',
  [string]$Team = '',
  [switch]$Prod,
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$srcDir = Join-Path $rootDir 'prototype'
if (-not (Test-Path $srcDir)) { throw "khong thay thu muc prototype\ o $rootDir" }

# ---- gom file ----
$skip = @('.DS_Store', 'Thumbs.db')
$files = Get-ChildItem -Path $srcDir -Recurse -File |
  Where-Object { $skip -notcontains $_.Name }

$payloadFiles = @()
$totalBytes = 0
foreach ($f in $files) {
  $rel = $f.FullName.Substring($srcDir.Length + 1).Replace('\', '/')
  $bytes = [System.IO.File]::ReadAllBytes($f.FullName)
  $totalBytes += $bytes.Length
  $payloadFiles += @{
    file     = $rel
    data     = [System.Convert]::ToBase64String($bytes)
    encoding = 'base64'
  }
}

Write-Host ''
Write-Host 'DEPLOY VERCEL -- into the goblin prototype'
Write-Host ('-' * 60)
foreach ($p in $payloadFiles) {
  $sz = [Math]::Round(([System.Convert]::FromBase64String($p.data)).Length / 1024, 1)
  Write-Host ("  {0,-34} {1,8} KB" -f $p.file, $sz)
}
Write-Host ('-' * 60)
Write-Host ("{0} file, {1:N0} KB" -f $payloadFiles.Count, ($totalBytes / 1024))
Write-Host ("project: {0}   target: {1}" -f $Project, $(if ($Prod) { 'production' } else { 'preview' }))
Write-Host ''

if ($DryRun) { Write-Host 'DRY RUN -- khong goi API.'; exit 0 }

if ([string]::IsNullOrWhiteSpace($Token)) {
  Write-Host 'THIEU TOKEN.'
  Write-Host '  1. Mo https://vercel.com/account/tokens -> Create Token'
  Write-Host '  2. Chay lai:  .\deploy_vercel.ps1 -Token "<token>"'
  exit 1
}

$body = @{
  name             = $Project
  files            = $payloadFiles
  projectSettings  = @{
    framework       = $null
    buildCommand    = $null
    outputDirectory = $null
    installCommand  = $null
  }
  target           = $(if ($Prod) { 'production' } else { $null })
}
$json = $body | ConvertTo-Json -Depth 8 -Compress

$url = 'https://api.vercel.com/v13/deployments'
if ($Team) { $url = "$url?slug=$Team" }

Write-Host 'Dang gui...'
try {
  $res = Invoke-RestMethod -Uri $url -Method Post -ContentType 'application/json' `
    -Headers @{ Authorization = "Bearer $Token" } -Body ([System.Text.Encoding]::UTF8.GetBytes($json))
} catch {
  $msg = $_.Exception.Message
  $detail = ''
  try {
    $sr = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $detail = $sr.ReadToEnd()
  } catch { }
  Write-Host ("LOI: {0}" -f $msg)
  if ($detail) { Write-Host $detail }
  exit 1
}

$deployUrl = "https://$($res.url)"
Write-Host ''
Write-Host ('-' * 60)
Write-Host ("deployment id : {0}" -f $res.id)
Write-Host ("url           : {0}" -f $deployUrl)
Write-Host ("state         : {0}" -f $res.readyState)
Write-Host ('-' * 60)

# ---- doi build xong (static nen thuong vai giay) ----
$statusUrl = "https://api.vercel.com/v13/deployments/$($res.id)"
if ($Team) { $statusUrl = "$statusUrl`?slug=$Team" }
for ($i = 0; $i -lt 40; $i++) {
  Start-Sleep -Seconds 3
  try {
    $st = Invoke-RestMethod -Uri $statusUrl -Method Get -Headers @{ Authorization = "Bearer $Token" }
  } catch { break }
  Write-Host ("  [{0,2}] {1}" -f $i, $st.readyState)
  if ($st.readyState -eq 'READY') {
    Write-Host ''
    Write-Host ("XONG -> {0}" -f $deployUrl)
    exit 0
  }
  if ($st.readyState -eq 'ERROR' -or $st.readyState -eq 'CANCELED') {
    Write-Host 'Deploy that bai. Xem log tren dashboard Vercel.'
    exit 1
  }
}
Write-Host ("Chua thay READY sau 2 phut. Kiem tra: {0}" -f $deployUrl)
