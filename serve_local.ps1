#requires -Version 5.1
<#
  serve_local.ps1 -- static file server bang System.Net.HttpListener.
  Ly do ton tai: may nay KHONG co Node/npm/python, va prototype dung ES module
  nen KHONG mo duoc bang file:// (CORS). Script nay chi dung de test cuc bo.

  Dung:  .\serve_local.ps1                 (port 8123, thu muc .\prototype)
         .\serve_local.ps1 -Port 9000 -Root prototype
  Dung lai: Ctrl+C, hoac dong cua so.

  ASCII-only source: PowerShell 5.1 doc sai file .ps1 UTF-8.
#>
param(
  [int]$Port = 8123,
  [string]$Root = 'prototype'
)

$ErrorActionPreference = 'Stop'
$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$serveDir = (Resolve-Path (Join-Path $rootDir $Root)).Path

$MIME = @{
  '.html' = 'text/html; charset=utf-8'
  '.js'   = 'text/javascript; charset=utf-8'
  '.mjs'  = 'text/javascript; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'
  '.svg'  = 'image/svg+xml'
  '.png'  = 'image/png'
  '.jpg'  = 'image/jpeg'
  '.ico'  = 'image/x-icon'
  '.map'  = 'application/json'
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
try { $listener.Start() }
catch { Write-Host "Khong mo duoc port $Port. Thu port khac: .\serve_local.ps1 -Port 8200"; exit 1 }

Write-Host ""
Write-Host "INTO THE GOBLIN -- prototype server"
Write-Host ("-" * 52)
Write-Host ("root : {0}" -f $serveDir)
Write-Host ("url  : http://localhost:{0}/" -f $Port)
Write-Host "Ctrl+C de dung."
Write-Host ""

while ($listener.IsListening) {
  try {
    $ctx = $listener.GetContext()
  } catch { break }

  $req = $ctx.Request
  $res = $ctx.Response
  try {
    $rel = [System.Uri]::UnescapeDataString($req.Url.AbsolutePath.TrimStart('/'))
    if ([string]::IsNullOrWhiteSpace($rel)) { $rel = 'index.html' }
    $full = Join-Path $serveDir $rel

    # chan path traversal
    $fullResolved = $null
    try { $fullResolved = (Resolve-Path $full -ErrorAction Stop).Path } catch { }
    if ($fullResolved -and (Test-Path $fullResolved -PathType Container)) {
      $fullResolved = (Resolve-Path (Join-Path $fullResolved 'index.html') -ErrorAction SilentlyContinue).Path
    }
    if (-not $fullResolved -or -not $fullResolved.StartsWith($serveDir, [System.StringComparison]::OrdinalIgnoreCase)) {
      # cleanUrls: thu them .html
      $alt = $null
      try { $alt = (Resolve-Path ($full + '.html') -ErrorAction Stop).Path } catch { }
      if ($alt -and $alt.StartsWith($serveDir, [System.StringComparison]::OrdinalIgnoreCase)) { $fullResolved = $alt }
    }

    if (-not $fullResolved) {
      $res.StatusCode = 404
      $b = [System.Text.Encoding]::UTF8.GetBytes("404 - khong tim thay: $rel")
      $res.ContentType = 'text/plain; charset=utf-8'
      $res.ContentLength64 = $b.Length
      $res.OutputStream.Write($b, 0, $b.Length)
      Write-Host ("404 {0}" -f $rel)
    } else {
      $ext = [System.IO.Path]::GetExtension($fullResolved).ToLower()
      $res.ContentType = if ($MIME.ContainsKey($ext)) { $MIME[$ext] } else { 'application/octet-stream' }
      $res.Headers.Add('Cache-Control', 'no-store')
      $bytes = [System.IO.File]::ReadAllBytes($fullResolved)
      $res.ContentLength64 = $bytes.Length
      $res.OutputStream.Write($bytes, 0, $bytes.Length)
      Write-Host ("200 {0} ({1:N0} B)" -f $rel, $bytes.Length)
    }
  } catch {
    try {
      $res.StatusCode = 500
      $b = [System.Text.Encoding]::UTF8.GetBytes("500 - " + $_.Exception.Message)
      $res.ContentLength64 = $b.Length
      $res.OutputStream.Write($b, 0, $b.Length)
    } catch { }
    Write-Host ("500 " + $_.Exception.Message)
  } finally {
    try { $res.OutputStream.Close() } catch { }
  }
}
$listener.Stop()
