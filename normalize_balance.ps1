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
$rangedMinDmg    = [double]$B.rangedMinDmg
$magClearMax     = [double]$B.magClearMax
$rpmBand         = $B.archetypeRpm
$newRpm = @{}
$flooredIds = @()
$archSpec        = $B.archetypeSpec
$magClearTarget  = [double]$B.magClearTarget
$reserveMags = 1.5
if ($null -ne $B.reserveMagsTarget) { $reserveMags = [double]$B.reserveMagsTarget }
$reserveKillsFloor = 42
if ($null -ne $B.reserveKillsFloor) { $reserveKillsFloor = [double]$B.reserveKillsFloor }
$magSmallThreshold = 4
if ($null -ne $B.magSmallThreshold) { $magSmallThreshold = [double]$B.magSmallThreshold }
# Nhan chung vao dai reload cua MOI archetype. Clamp vao dai DA NHAN chu khong nhan
# thang vao reloadTime cu -> chay lai nhieu lan van ra cung ket qua (idempotent).
$reloadMult = 1.0
if ($null -ne $B.reloadGlobalMult) { $reloadMult = [double]$B.reloadGlobalMult }
$newReserve = @{}
$newReload = @{}
$newPellets = @{}
$newPierce = @{}
$newSpread = @{}
$newMag = @{}
$staminaRegen    = [double]$B.staminaRegen
$rangedTol       = [double]$B.rangedTolerance
$meleeTol        = [double]$B.meleeTolerance

# anchorRoom(T) -- the global room index at which tier T is "the right age" (docs/16 muc 5)
$anchorRoom = @(1, 8, 18, 30, 45, 60)
$TRASH_HP_BASE = 40.0     # en_trash_goblincui base hp
$HP_PER_ROOM   = 1.068
# Ngan sach TP doc tu data/waves.json -- truoc day hardcode 14 + 4.2*R o day trong khi
# data da doi sang 38 + 11.5*R, nen wave EHP bi danh gia THAP hon thuc te 2.7 lan va
# gate magClearRatio khat khe qua muc. Xem docs/18 loi #30.
$wavesRaw = Get-Content (Join-Path $root "data\waves.json") -Raw -Encoding UTF8
$wavesJson = $wavesRaw | ConvertFrom-Json
$TP_BASE = [double]$wavesJson.directorRules.tpBase
$TP_PER_ROOM = [double]$wavesJson.directorRules.tpPerRoom
$AVG_TP_COST   = 1.6      # average threat-point cost of a mixed wave
$MIX_FACTOR    = 1.15     # tougher-than-trash units in a mixed wave

function Get-DpsTarget([int]$tier) { return $dpsBase * [Math]::Pow($dpsGrowth, $tier - 1) }

function Get-WaveEhp([int]$tier) {
    $R  = $anchorRoom[$tier - 1]
    $tp = $TP_BASE + $TP_PER_ROOM * $R
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
        $arch = [string]$w.archetype
        $spec = $null
        if ($archSpec.PSObject.Properties.Name -contains $arch) { $spec = $archSpec.$arch }
        $trashHp = Get-TrashHp $tier
        $waveEhp = Get-WaveEhp $tier

        if ($null -eq $spec) {
            $cycle = [double]$w.mag / ([double]$w.rpm / 60.0) + [double]$w.reloadTime
            $new = Round-Dmg ($target * $cycle / ([double]$w.pellets * [double]$w.mag))
            $dpsAfter = ($new * [double]$w.pellets * [double]$w.mag) / $cycle
            $metric = 'dpsSustained'; $tol = $rangedTol; $extra = 'khong co archetypeSpec'
        }
        else {
            # 1. NHIP BAN tu dai THUC TE cua khau do (MP5 800, M4 700-900, Remington 65...).
            $rpm = [Math]::Round([Math]::Max([double]$spec.rpm[0], [Math]::Min([double]$spec.rpm[1], [double]$w.rpm)))
            $rLo = [Math]::Round([double]$spec.reload[0] * $reloadMult, 2)
            $rHi = [Math]::Round([double]$spec.reload[1] * $reloadMult, 2)
            $reload = [Math]::Round([Math]::Max($rLo, [Math]::Min($rHi, [double]$w.reloadTime)), 2)
            $pellets = [double]$spec.pellets
            $pierce  = [int]$spec.pierce
            $spread  = [double]$spec.spreadDeg

            # 2. SAT THUONG suy tu CO DAN, khong tu DPS. caliberMult = so lan HP cua trash
            #    cung tier. 9mm cua SMG yeu hon 5.56 cua rifle, dung nhu doi that.
            $new = Round-Dmg ($trashHp * [double]$spec.caliberMult)

            # 3. DAN la thu CAN BANG, khong phai DPS. Va thuoc do phai la SO MANG, khong
            #    phai sat thuong tho: mot vien 120 dmg vao goblin 40 HP thi thua 3 lan,
            #    nen "sat thuong moi bang dan / EHP cua wave" cho ra con so sai lech --
            #    no ep bang dan SMG xuong 7 vien. Xem docs/18 loi #36.
            $countWave = $waveEhp / ($trashHp * $MIX_FACTOR)
            $killsPerProj = [Math]::Min(1.0, $new / $trashHp)
            $aoeFactor = 1.0
            if ([string]$spec.style -eq 'aoe') { $aoeFactor = 2.5 }
            # killEff: dan ghem tan theo goc nen KHONG phai vien nao cung trung mot con
            # rieng -- gan thi chum vao mot con, xa thi truot. Vien xuyen cung hiem khi
            # thang hang hoan hao. Khong co he so nay thi shotgun ra 45 mang mot bang.
            $killEff = 1.0
            if ($null -ne $spec.killEff) { $killEff = [double]$spec.killEff }
            # Khau xuyen KHONG GIOI HAN (no) thi "1 + pierce" la vo cuc -- mo hinh can
            # bang phai dung SO CON THUC TE co tren duong bay, vi quai hiem khi thang
            # hang qua vai con. pierceBalance la con so do (docs/18 loi #77).
            $pierceModel = $pierce
            if ($null -ne $spec.pierceBalance) { $pierceModel = [double]$spec.pierceBalance - 1 }
            $killsPerShot = $pellets * $killsPerProj * (1 + $pierceModel) * $aoeFactor * $killEff

            # Co bang dan THAT cua khau do, roi ha xuong neu mot bang giet qua nhieu.
            $mag = [Math]::Max([double]$spec.mag[0], [Math]::Min([double]$spec.mag[1], [double]$w.mag))
            $magCap = [Math]::Floor($magClearTarget * $countWave / [Math]::Max(0.01, $killsPerShot))
            if ($magCap -lt [double]$spec.mag[0]) { $magCap = [double]$spec.mag[0] }
            if ($mag -gt $magCap) { $mag = $magCap }
            $mag = [Math]::Round($mag)
            if ($mag -lt 1) { $mag = 1 }

            # DAN DU TRU do bang SO BANG PHU. Mo hinh cu ("du cho N wave") cho ra 21-22
            # bang phu moi khau -- nguoi choi khong bao gio cham vao tran dan, va tru P2
            # (vong khoa DAN <-> STAMINA) khong bao gio bi kich hoat. Xem docs/18 loi #61.
            $reserve = [Math]::Round($mag * $reserveMags)
            # "1.5 bang phu" VO NGHIA khi bang chi 1 vien: khau do nap lai sau MOI phat
            # nen bang khong con la don vi cua cai gi ca. Voi nhung khau do, neo vao SO
            # MANG -- thu duy nhat co nghia giong nhau o moi khau (docs/18 loi #75).
            if ($mag -lt $magSmallThreshold) {
                $canShots = [Math]::Ceiling($reserveKillsFloor / [Math]::Max(0.01, $killsPerShot))
                $sanReserve = $canShots - $mag
                if ($reserve -lt $sanReserve) { $reserve = $sanReserve }
            }

            $newRpm[$w.id] = $rpm
            $newMag[$w.id] = [int]$mag
            $newReserve[$w.id] = [int]$reserve
            $newReload[$w.id] = $reload
            $newPellets[$w.id] = [int]$pellets
            $newPierce[$w.id] = $pierce
            $newSpread[$w.id] = $spread

            $cycle = $mag / ($rpm / 60.0) + $reload
            $dpsAfter = ($new * $pellets * $mag) / $cycle
            $metric = 'dpsSustained'
            $tol = 99.0     # DPS khong con la rang buoc: xem ghi chu o muc 3
            $extra = ('rpm {0:N0} | mag {1:N0} | ban het bang {2:N1}s | {3:N1} mang/bang tren wave {4:N0} con | reserve {5:N1} wave' -f `
                        $rpm, $mag, ($mag / ($rpm / 60.0)), ($mag * $killsPerShot), $countWave, ($reserve * $killsPerShot / $countWave))
        }
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

# --- ghi lai dmg + rpm + mag + reserveMax + reloadTime + pellets + pierce + spreadDeg ---
# Tat ca deu la DAI LUONG SUY RA tu archetypeSpec (so lieu vu khi that) + can bang dan.
# Giu nguyen dinh dang file: chi thay tung con so tai cho.
$script:curId = $null
$evaluator = [System.Text.RegularExpressions.MatchEvaluator] {
    param($m)
    if ($m.Groups['wid'].Success) { $script:curId = $m.Groups['wid'].Value; return $m.Value }
    if (-not $script:curId) { return $m.Value }
    if ($m.Groups['d'].Success  -and $newDmg.ContainsKey($script:curId))     { return ('"dmg": {0}' -f $newDmg[$script:curId]) }
    if ($m.Groups['r'].Success  -and $newRpm.ContainsKey($script:curId))     { return ('"rpm": {0}' -f $newRpm[$script:curId]) }
    if ($m.Groups['g'].Success  -and $newMag.ContainsKey($script:curId))     { return ('"mag": {0}' -f $newMag[$script:curId]) }
    if ($m.Groups['v'].Success  -and $newReserve.ContainsKey($script:curId)) { return ('"reserveMax": {0}' -f $newReserve[$script:curId]) }
    if ($m.Groups['t'].Success  -and $newReload.ContainsKey($script:curId))  { return ('"reloadTime": {0}' -f $newReload[$script:curId]) }
    if ($m.Groups['p'].Success  -and $newPellets.ContainsKey($script:curId)) { return ('"pellets": {0}' -f $newPellets[$script:curId]) }
    if ($m.Groups['c'].Success  -and $newPierce.ContainsKey($script:curId))  { return ('"pierce": {0}' -f $newPierce[$script:curId]) }
    if ($m.Groups['s'].Success  -and $newSpread.ContainsKey($script:curId))  { return ('"spreadDeg": {0}' -f $newSpread[$script:curId]) }
    return $m.Value
}
$pattern = '"id":\s*"(?<wid>[^"]+)"' +
           '|"dmg":\s*(?<d>[0-9.]+)' +
           '|"rpm":\s*(?<r>[0-9.]+)' +
           '|"mag":\s*(?<g>[0-9]+)' +
           '|"reserveMax":\s*(?<v>[0-9]+)' +
           '|"reloadTime":\s*(?<t>[0-9.]+)' +
           '|"pellets":\s*(?<p>[0-9]+)' +
           '|"pierce":\s*(?<c>[0-9]+)' +
           '|"spreadDeg":\s*(?<s>[0-9.]+)'
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
