#requires -Version 5.1
<#
  normalize_balance.ps1 -- deterministic balance pass for INTO THE GOBLIN
  ---------------------------------------------------------------------
  Scales weapon `dmg` so every weapon lands on the canonical power curve in
  docs/16-data-schema-balancing.md, while PRESERVING each weapon's character
  (rpm / mag / reload / stamina / arc / targets are never touched).

    ranged : dpsSustained = (dmg*pellets*mag) / (mag/(rpm/60) + reloadTime)  ->  dpsTarget(T)
    melee  : dpsMeleeEff  = dmg*(1+0.35*(targets-1)) / max(swingTime, staminaCost/staminaRegen)
             -> dpsTarget(T) * meleeAdvantage

  Writes data/weapons.json IN PLACE (only the dmg numbers change, formatting is
  preserved) and emits balance_report.md with a before/after table.

  Usage:  .\normalize_balance.ps1            (write)
          .\normalize_balance.ps1 -DryRun    (report only)
  ASCII-only source on purpose: Windows PowerShell 5.1 mis-decodes UTF-8 .ps1 files.
#>
param([switch]$DryRun)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$weaponsPath = Join-Path $root 'data\weapons.json'
$reportPath  = Join-Path $root 'balance_report.md'

function Read-Utf8Json([string]$path) {
    $text = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)
    return $text
}
function Write-Utf8NoBom([string]$path, [string]$text) {
    $enc = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($path, $text, $enc)
}

$raw  = Read-Utf8Json $weaponsPath
$data = $raw | ConvertFrom-Json

$B               = $data.balance
$dpsBase         = [double]$B.dpsTargetBase
$dpsGrowth       = [double]$B.dpsTargetGrowth
$meleeAdv        = [double]$B.meleeAdvantage
$oneShot         = [double]$B.meleeOneShotFactor
$staminaRegen    = [double]$B.staminaRegen
$rangedTol       = [double]$B.rangedTolerance
$meleeTol        = [double]$B.meleeTolerance

# anchorRoom(T) -- the global room index at which tier T is "the right age" (docs/16 muc 5)
$anchorRoom = @(1, 8, 18, 30, 45, 60)
$TRASH_HP_BASE = 40.0     # en_trash_goblincui base hp
$HP_PER_ROOM   = 1.068
$AVG_TP_COST   = 1.6      # average threat-point cost of a mixed wave
$MIX_FACTOR    = 1.15     # tougher-than-trash units in a mixed wave

function Get-DpsTarget([int]$tier) { return $dpsBase * [Math]::Pow($dpsGrowth, $tier - 1) }

function Get-WaveEhp([int]$tier) {
    $R  = $anchorRoom[$tier - 1]
    $tp = 14.0 + 4.2 * $R
    $count = $tp / $AVG_TP_COST
    $trashHp = $TRASH_HP_BASE * [Math]::Pow($HP_PER_ROOM, $R - 1)
    return $count * $trashHp * $MIX_FACTOR
}
function Get-TrashHp([int]$tier) {
    $R = $anchorRoom[$tier - 1]
    return $TRASH_HP_BASE * [Math]::Pow($HP_PER_ROOM, $R - 1)
}
function Round-Dmg([double]$v) {
    if ($v -ge 20) { return [Math]::Round($v, 0) }
    return [Math]::Round($v, 1)
}

$rows = @()
$newDmg = @{}

foreach ($w in $data.weapons) {
    $tier   = [int]$w.tier
    $target = Get-DpsTarget $tier
    $old    = [double]$w.dmg

    if ($w.class -eq 'ranged') {
        $rpm      = [double]$w.rpm
        $mag      = [double]$w.mag
        $pellets  = [double]$w.pellets
        $reload   = [double]$w.reloadTime
        $cycle    = $mag / ($rpm / 60.0) + $reload
        $new      = Round-Dmg ($target * $cycle / ($pellets * $mag))
        $dpsAfter = ($new * $pellets * $mag) / $cycle
        $metric   = 'dpsSustained'
        $tol      = $rangedTol
        $extra    = ('mag clear {0:N2} | reserve {1:N1} wave | TTK trash {2:N2}s' -f `
                        (($mag * $new * $pellets) / (Get-WaveEhp $tier)), `
                        ((([double]$w.reserveMax) * $new * $pellets) / (Get-WaveEhp $tier)), `
                        ((Get-TrashHp $tier) / $dpsAfter))
    }
    else {
        $targets  = [double]$w.targets
        $stam     = [double]$w.staminaCost
        $swing    = [double]$w.swingTime
        $tf       = 1.0 + 0.35 * ($targets - 1.0)
        $interval = [Math]::Max($swing, $stam / $staminaRegen)
        # tf KHONG con nam trong ngan sach DPS. Ly do: targets gio DONG NHAT cho moi vu khi
        # (docs/05 muc 7b) nen tf = 3.45 chi la mot phep chia deu, khong phan biet gi ca --
        # nhung no keo sat thuong xuong duoi HP cua trash, tuc pha luat "1 nhat 1 mang".
        # Kha nang chem nhieu muc tieu gio la MOT PHAN CUA FANTASY, khong phai thu phai tra gia.
        $new      = Round-Dmg ($target * $meleeAdv * $interval)
        # SAN ONE-SHOT. Luat cung o docs/09 nguyen tac 4: "trash phai chet trong 1 nhat".
        # tf = 1 + 0.35*(targets-1) = 3.45 khi targets = 8, va vi targets gio DONG NHAT
        # cho moi vu khi nen tf chi con la mot phep chia deu, khong phan biet gi ca --
        # nhung no lam trash song sot 5 nhat. Factor 1.65 = 1/slideTickDamageMult, nen
        # ke ca MOT DOAN quet trong che do chem lien tuc cung du giet trash.
        $floor    = Round-Dmg ((Get-TrashHp $tier) * $oneShot)
        if ($new -lt $floor) { $new = $floor }
        $dpsAfter = $new / $interval
        $metric   = 'dpsMeleeEff'
        $tol      = $meleeTol
        $extra    = ('interval {0:N3}s | targetFactor {1:N2} | dmg/stamina {2:N1}' -f $interval, $tf, ($new / $stam))
    }

    $newDmg[$w.id] = $new
    $rows += [pscustomobject]@{
        Id       = $w.id
        Name     = $w.name
        Class    = $w.class
        Tier     = $tier
        OldDmg   = $old
        NewDmg   = $new
        Change   = if ($old -gt 0) { ($new / $old - 1.0) * 100.0 } else { 0.0 }
        Metric   = $metric
        DpsAfter = $dpsAfter
        Target   = if ($w.class -eq 'melee') { $target * $meleeAdv } else { $target }
        Tol      = $tol
        Extra    = $extra
    }
}

# --- rewrite only the dmg numbers, preserving file formatting exactly ---
$script:curId = $null
$evaluator = [System.Text.RegularExpressions.MatchEvaluator] {
    param($m)
    if ($m.Groups['wid'].Success) { $script:curId = $m.Groups['wid'].Value; return $m.Value }
    if ($m.Groups['d'].Success -and $script:curId -and $newDmg.ContainsKey($script:curId)) {
        return ('"dmg": {0}' -f $newDmg[$script:curId])
    }
    return $m.Value
}
$pattern = '"id":\s*"(?<wid>[^"]+)"|"dmg":\s*(?<d>[0-9.]+)'
$updated = [System.Text.RegularExpressions.Regex]::Replace($raw, $pattern, $evaluator)

if (-not $DryRun) {
    Write-Utf8NoBom $weaponsPath $updated
}

# --- report ---
$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine('# Balance Report -- INTO THE GOBLIN')
[void]$sb.AppendLine('')
[void]$sb.AppendLine('> File nay do `normalize_balance.ps1` sinh ra. KHONG sua tay.')
[void]$sb.AppendLine('')
[void]$sb.AppendLine(('- Cong thuc: `dpsTarget(T) = {0} * {1}^(T-1)`, meleeAdvantage = **{2}**, staminaRegen = {3}/s' -f $dpsBase, $dpsGrowth, $meleeAdv, $staminaRegen))
[void]$sb.AppendLine(('- anchorRoom(T) = {0}' -f ($anchorRoom -join ', ')))
[void]$sb.AppendLine(('- waveEHP(T) = (TP/{0}) * {1} * {2}^(R-1) * {3}' -f $AVG_TP_COST, $TRASH_HP_BASE, $HP_PER_ROOM, $MIX_FACTOR))
[void]$sb.AppendLine(('- So vu khi xu ly: **{0}**' -f $rows.Count))
if ($DryRun) { [void]$sb.AppendLine('- Che do: **DRY RUN** (khong ghi data/weapons.json)') }
[void]$sb.AppendLine('')
[void]$sb.AppendLine('## dpsTarget theo tier')
[void]$sb.AppendLine('')
[void]$sb.AppendLine('| Tier | dpsTarget (ranged) | target melee (x' + $meleeAdv + ') |')
[void]$sb.AppendLine('|---|---|---|')
for ($t = 1; $t -le 6; $t++) {
    $dt = Get-DpsTarget $t
    [void]$sb.AppendLine(('| T{0} | {1:N0} | {2:N0} |' -f $t, $dt, ($dt * $meleeAdv)))
}
[void]$sb.AppendLine('')
[void]$sb.AppendLine('## Before / After')
[void]$sb.AppendLine('')
[void]$sb.AppendLine('| Vu khi | Lop | T | dmg cu | dmg moi | Doi | Metric | Sau chuan hoa | Muc tieu | Lech | Ghi chu |')
[void]$sb.AppendLine('|---|---|---|---|---|---|---|---|---|---|---|')
foreach ($r in $rows) {
    $dev = ($r.DpsAfter / $r.Target - 1.0) * 100.0
    $flag = if ([Math]::Abs($dev) -le ($r.Tol * 100.0)) { 'OK' } else { 'CHECK' }
    [void]$sb.AppendLine(('| {0} | {1} | {2} | {3} | {4} | {5:+0.0;-0.0;0.0}% | {6} | {7:N0} | {8:N0} | {9:+0.0;-0.0;0.0}% {10} | {11} |' -f `
        $r.Name, $r.Class, $r.Tier, $r.OldDmg, $r.NewDmg, $r.Change, $r.Metric, $r.DpsAfter, $r.Target, $dev, $flag, $r.Extra))
}
[void]$sb.AppendLine('')
[void]$sb.AppendLine('## Ket luan')
[void]$sb.AppendLine('')
$maxChange = ($rows | ForEach-Object { [Math]::Abs($_.Change) } | Measure-Object -Maximum).Maximum
[void]$sb.AppendLine(('- Thay doi lon nhat: **{0:N1}%**' -f $maxChange))
[void]$sb.AppendLine('- Moi vu khi bay gio nam dung tren duong cong tier. Cac rang buoc con lai (mag clear ratio,')
[void]$sb.AppendLine('  reserve waves, TTK trash, melee > ranged) do `audit_gdd.ps1` kiem tra va co the FAIL/WARN.')
[void]$sb.AppendLine('- Day la so **first-pass**: dung de bat dau playtest, khong phai so da tune.')

Write-Utf8NoBom $reportPath $sb.ToString()

Write-Host ('normalize_balance: {0} weapons processed, max change {1:N1}%' -f $rows.Count, $maxChange)
Write-Host ('report -> {0}' -f $reportPath)
if ($DryRun) { Write-Host 'DRY RUN: data/weapons.json khong bi ghi.' }
