#requires -Version 5.1
<#
  audit_gdd.ps1 -- invariant GATE for INTO THE GOBLIN
  --------------------------------------------------
  Cross-checks every business invariant stated in docs/ against the real data in
  data/*.json. Prints a PASS/FAIL/WARN table and exits 1 on any FAIL so it works
  as a build gate:   .\normalize_balance.ps1; if ($?) { .\audit_gdd.ps1 }

  The canonical gate (any game with an economy needs it):
      every currency must have >= 1 SOURCE and >= 1 SINK.

  NAMING WARNING: PowerShell variables are CASE-INSENSITIVE. Never name a dataset
  $T and a loop variable $t -- they are the same variable and the dataset gets
  silently overwritten (checks then run on an empty array and falsely report PASS).
  That is why every dataset here uses a 3-letter name (gdWpn, gdEne, ...).

  ASCII-only source on purpose: Windows PowerShell 5.1 mis-decodes UTF-8 .ps1 files.
#>
param([switch]$WarnAsError)

$ErrorActionPreference = 'Stop'
$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path

function Load-Json([string]$rel) {
    $p = Join-Path $rootDir $rel
    if (-not (Test-Path $p)) { throw "missing data file: $rel" }
    return ([System.IO.File]::ReadAllText($p, [System.Text.Encoding]::UTF8) | ConvertFrom-Json)
}

$gdWpn = Load-Json 'data\weapons.json'
$gdEne = Load-Json 'data\enemies.json'
$gdWav = Load-Json 'data\waves.json'
$gdDep = Load-Json 'data\depths.json'
$gdRom = Load-Json 'data\rooms.json'
$gdUpg = Load-Json 'data\upgrades.json'
$gdTal = Load-Json 'data\talents.json'
$gdEco = Load-Json 'data\economy.json'
$gdBst = Load-Json 'data\bastion.json'
$gdFel = Load-Json 'data\gamefeel.json'
$gdCtr = Load-Json 'data\controls.json'

$auditResults = @()
function Add-Result([string]$group, [string]$check, [string]$status, [string]$detail) {
    $script:auditResults += [pscustomobject]@{ Group = $group; Check = $check; Status = $status; Detail = $detail }
}
function Assert-True([string]$group, [string]$check, [bool]$ok, [string]$detail, [string]$failStatus = 'FAIL') {
    if ($ok) { Add-Result $group $check 'PASS' $detail } else { Add-Result $group $check $failStatus $detail }
}
function Join-Or([array]$arr, [string]$empty = '0') {
    if ($arr -and $arr.Count -gt 0) { return ($arr -join ', ') }
    return $empty
}

# --- sanity: every dataset actually loaded (catches the shadowing class of bug) ---
$loaded = @(
    @{ n = 'weapons';  c = @($gdWpn.weapons).Count },
    @{ n = 'enemies';  c = @($gdEne.enemies).Count },
    @{ n = 'bosses';   c = @($gdEne.bosses).Count },
    @{ n = 'affixes';  c = @($gdEne.affixes).Count },
    @{ n = 'waves';    c = @($gdWav.waveTemplates).Count },
    @{ n = 'depths';   c = @($gdDep.depths).Count },
    @{ n = 'roomTypes';c = @($gdRom.roomTypes).Count },
    @{ n = 'events';   c = @($gdRom.events).Count },
    @{ n = 'cards';    c = @($gdUpg.cards).Count },
    @{ n = 'relics';   c = @($gdUpg.relics).Count },
    @{ n = 'talents';  c = @($gdTal.talents).Count },
    @{ n = 'currencies'; c = @($gdEco.currencies).Count },
    @{ n = 'shop';     c = @($gdEco.shop).Count },
    @{ n = 'buildings';c = @($gdBst.buildings).Count }
)
$emptySets = @($loaded | Where-Object { $_.c -lt 1 } | ForEach-Object { $_.n })
Assert-True 'LOAD' 'Moi dataset load duoc va khong rong' ($emptySets.Count -eq 0) `
    (($loaded | ForEach-Object { "$($_.n)=$($_.c)" }) -join ', ')

# ---------------------------------------------------------------- A. ids
$weaponIds = @($gdWpn.weapons | ForEach-Object { $_.id })
$enemyIds  = @($gdEne.enemies | ForEach-Object { $_.id })
$bossIds   = @($gdEne.bosses  | ForEach-Object { $_.id })
$cardIds   = @($gdUpg.cards   | ForEach-Object { $_.id })
$relicIds  = @($gdUpg.relics  | ForEach-Object { $_.id })
$talentIds = @($gdTal.talents | ForEach-Object { $_.id })
$waveIds   = @($gdWav.waveTemplates | ForEach-Object { $_.id })
$roomIds   = @($gdRom.roomTypes | ForEach-Object { $_.id }) + @($gdRom.events | ForEach-Object { $_.id })
$bldIds    = @($gdBst.buildings | ForEach-Object { $_.id })
$affixIds  = @($gdEne.affixes | ForEach-Object { $_.id })
$currIds   = @($gdEco.currencies | ForEach-Object { $_.id })

$allIds = $weaponIds + $enemyIds + $bossIds + $cardIds + $relicIds + $talentIds + $waveIds + $roomIds + $bldIds + $affixIds
$dupes = @($allIds | Group-Object | Where-Object { $_.Count -gt 1 } | ForEach-Object { $_.Name })
Assert-True 'ID' 'Moi id la duy nhat (toan bo dataset)' ($dupes.Count -eq 0) `
    ("$($allIds.Count) id; trung: " + (Join-Or $dupes 'khong'))

$badPrefix = @()
foreach ($itW in $gdWpn.weapons) {
    $want = if ($itW.class -eq 'ranged') { 'rw_' } else { 'mw_' }
    if (-not $itW.id.StartsWith($want)) { $badPrefix += $itW.id }
}
foreach ($itE in $gdEne.enemies)       { if (-not $itE.id.StartsWith('en_')) { $badPrefix += $itE.id } }
foreach ($itB in $gdEne.bosses)        { if (-not $itB.id.StartsWith('bs_')) { $badPrefix += $itB.id } }
foreach ($itC in $gdUpg.cards)         { if (-not $itC.id.StartsWith('cd_')) { $badPrefix += $itC.id } }
foreach ($itL in $gdUpg.relics)        { if (-not $itL.id.StartsWith('rl_')) { $badPrefix += $itL.id } }
foreach ($itT in $gdTal.talents)       { if (-not $itT.id.StartsWith('tl_')) { $badPrefix += $itT.id } }
foreach ($itV in $gdWav.waveTemplates) { if (-not $itV.id.StartsWith('wv_')) { $badPrefix += $itV.id } }
foreach ($itD in $gdBst.buildings)     { if (-not $itD.id.StartsWith('bd_')) { $badPrefix += $itD.id } }
foreach ($itA in $gdEne.affixes)       { if (-not $itA.id.StartsWith('af_')) { $badPrefix += $itA.id } }
Assert-True 'ID' 'Quy uoc prefix id (docs/16 muc 2)' ($badPrefix.Count -eq 0) ("sai prefix: " + (Join-Or $badPrefix 'khong'))

# ---------------------------------------------------------- B. referential
$badRefs = @()
foreach ($itV in $gdWav.waveTemplates) {
    foreach ($itComp in $itV.composition) {
        if ($enemyIds -notcontains $itComp.enemy) { $badRefs += "$($itV.id) -> $($itComp.enemy)" }
    }
}
Assert-True 'REF' 'waves.json: moi enemy id ton tai' ($badRefs.Count -eq 0) `
    ("$(@($gdWav.waveTemplates).Count) template; sai: " + (Join-Or $badRefs))

$badRefs = @()
foreach ($itD in $gdDep.depths) {
    foreach ($itI in $itD.introEnemies) { if ($enemyIds -notcontains $itI) { $badRefs += "depth$($itD.depth) intro -> $itI" } }
    if ($bossIds -notcontains $itD.boss) { $badRefs += "depth$($itD.depth) boss -> $($itD.boss)" }
    foreach ($itU in $itD.loadoutUnlocks) { if ($weaponIds -notcontains $itU) { $badRefs += "depth$($itD.depth) unlock -> $itU" } }
}
Assert-True 'REF' 'depths.json: enemy/boss/weapon id ton tai' ($badRefs.Count -eq 0) `
    ("$(@($gdDep.depths).Count) depth; sai: " + (Join-Or $badRefs))

$badRefs = @()
foreach ($itB in $gdEne.bosses) {
    foreach ($itDrop in $itB.drops) {
        foreach ($tok in [regex]::Matches($itDrop, '\b(?:rw|mw)_[a-z0-9_]+')) {
            if ($weaponIds -notcontains $tok.Value) { $badRefs += "$($itB.id) drop -> $($tok.Value)" }
        }
    }
}
Assert-True 'REF' 'bosses.drops: weapon id ton tai' ($badRefs.Count -eq 0) ("sai: " + (Join-Or $badRefs))

$mistEnemy = $gdWav.directorRules.blackMist.spawnEnemy
Assert-True 'REF' 'blackMist.spawnEnemy ton tai' ($enemyIds -contains $mistEnemy) "$mistEnemy"

$comboIds = @($gdUpg.comboRules | ForEach-Object { $_.id })
$badRefs = @()
foreach ($itR in $gdUpg.comboRules) { if ($cardIds -notcontains $itR.unlocks) { $badRefs += "$($itR.id) -> $($itR.unlocks)" } }
foreach ($itC in $gdUpg.cards) { if ($itC.comboUnlock -and ($comboIds -notcontains $itC.comboUnlock)) { $badRefs += "$($itC.id) -> $($itC.comboUnlock)" } }
Assert-True 'REF' 'combo unlock tro dung ca hai chieu' ($badRefs.Count -eq 0) `
    ("$(@($gdUpg.comboRules).Count) combo; sai: " + (Join-Or $badRefs))

$usedEnemies = @($gdWav.waveTemplates | ForEach-Object { $_.composition } | ForEach-Object { $_.enemy } | Sort-Object -Unique)
$usedEnemies += $mistEnemy
$orphan = @($gdEne.enemies | Where-Object { $usedEnemies -notcontains $_.id } | ForEach-Object { $_.id })
Assert-True 'REF' 'Khong co quai orphan (khong wave template nao dung)' ($orphan.Count -eq 0) `
    ("orphan: " + (Join-Or $orphan 'khong')) 'WARN'

# ------------------------------------------------------------- C. economy
$oneSided = @()
foreach ($itCur in $gdEco.currencies) {
    $ns = @($itCur.sources).Count; $nk = @($itCur.sinks).Count
    if ($ns -lt 1 -or $nk -lt 1) { $oneSided += "$($itCur.id) (source=$ns, sink=$nk)" }
}
Assert-True 'ECON' 'GATE: moi currency co >=1 source VA >=1 sink' ($oneSided.Count -eq 0) `
    ("$($currIds.Count) currency: " + ($currIds -join ', ') + $(if ($oneSided.Count) { ' | MOT CHIEU: ' + ($oneSided -join ', ') } else { '' }))

$badShop = @()
foreach ($itS in $gdEco.shop) {
    if (-not ([double]$itS.price -gt 0)) { $badShop += "$($itS.id) price=$($itS.price)" }
    if ($currIds -notcontains $itS.currency) { $badShop += "$($itS.id) currency=$($itS.currency)" }
}
Assert-True 'ECON' 'shop: price > 0 va currency ton tai' ($badShop.Count -eq 0) `
    ("$(@($gdEco.shop).Count) item; sai: " + (Join-Or $badShop))

$ticketGated = @()
foreach ($itD in $gdDep.depths) { if ($itD.entryCost) { $ticketGated += "depth$($itD.depth)" } }
if ($gdDep.endless.entryCost) { $ticketGated += 'endless' }
Assert-True 'ECON' 'tickets KHONG gate Depth 1-7 / Endless (docs/11 muc 6.5)' ($ticketGated.Count -eq 0) `
    ("bi gate: " + (Join-Or $ticketGated 'khong'))

# Affordability: sau khi clear 1 Depth o G=0 phai mua duoc 2 mon thiet yeu (dan + mau) o shop
$cheapAmmo = (@($gdEco.shop | Where-Object { $_.id -eq 'sh_dan' }).price)
$cheapHeal = (@($gdEco.shop | Where-Object { $_.id -eq 'sh_mau30' }).price)
$affordFloor = 2 * ([double]$cheapAmmo + [double]$cheapHeal)
$badGold = @()
foreach ($itD in $gdDep.depths) {
    if ([double]$itD.expectedGoldG0 -lt $affordFloor) { $badGold += "depth$($itD.depth)=$($itD.expectedGoldG0)" }
}
Assert-True 'ECON' 'expectedGoldG0 >= 2 x (dan re nhat + mau re nhat) -- shop phai dung duoc' ($badGold.Count -eq 0) `
    ("nguong = $affordFloor vang; thieu: " + (Join-Or $badGold))

# Consistency: doi chieu expectedGoldG0 KHAI BAO voi gia tri TINH TU DATA (TP director + goldDrop)
$layoutWeight = @{ 'combat' = 1.00; 'elite' = 1.40; 'boss' = 1.60; 'random' = 0.50; 'shop' = 0.0; 'shrine' = 0.0; 'treasure' = 0.0; 'event' = 0.0; 'gauntlet' = 2.20 }
$goldModel = @()
$goldOff = @()
foreach ($itD in $gdDep.depths) {
    $dNum = [int]$itD.depth
    $pool = @($gdEne.enemies | Where-Object {
        [int]$_.introDepth -le $dNum -and (@($_.tags) -notcontains 'invulnerable') -and $_.role -ne 'elite'
    })
    $avgTp   = ($pool | Measure-Object -Property tpCost -Average).Average
    $avgGold = ($pool | Measure-Object -Property goldDrop -Average).Average
    $sumGold = 0.0
    foreach ($itRoom in $gdRom.depthLayout) {
        $rGlobal = ($dNum - 1) * 10 + [int]$itRoom.room
        $mult = if ($layoutWeight.ContainsKey($itRoom.type)) { $layoutWeight[$itRoom.type] } else { 0.0 }
        if ($mult -le 0) { continue }
        $tp = (14.0 + 4.2 * $rGlobal) * $mult
        $sumGold += ($tp / $avgTp) * $avgGold
    }
    $sumGold *= [Math]::Pow(1.15, $dNum - 1)
    $bossRef = @($gdEne.bosses | Where-Object { [int]$_.depth -eq $dNum })
    if ($bossRef.Count -eq 1) { $sumGold += [double]$bossRef[0].goldDrop }
    $computed = [Math]::Round($sumGold / 50.0) * 50
    $declared = [double]$itD.expectedGoldG0
    $goldModel += "d$dNum tinh=$computed khai=$declared"
    if ($computed -gt 0 -and [Math]::Abs($declared / $computed - 1.0) -gt 0.40) { $goldOff += "d$dNum ($declared vs $computed)" }
}
Assert-True 'ECON' 'expectedGoldG0 khai bao khop mo hinh tinh tu data (+-40%)' ($goldOff.Count -eq 0) `
    (($goldModel -join ' | ') + '; lech: ' + (Join-Or $goldOff)) 'WARN'

$curveMono = $true; $prevGold = -1
foreach ($itM in $gdEco.goldCurve) {
    if ([double]$itM.expectedGold -le $prevGold) { $curveMono = $false }
    $prevGold = [double]$itM.expectedGold
}
Assert-True 'ECON' 'goldCurve tang don dieu theo moc' $curveMono ("$(@($gdEco.goldCurve).Count) moc, cao nhat $prevGold")

# goldCurve = TONG TICH LUY expectedGoldG0 tu Depth 1 den Depth do (khong co he so nhan nao)
$curveOff = @()
foreach ($itM in $gdEco.goldCurve) {
    if ($null -eq $itM.depth) { continue }
    $want = 0.0
    foreach ($dRef in $gdDep.depths) {
        if ([int]$dRef.depth -le [int]$itM.depth) { $want += [double]$dRef.expectedGoldG0 }
    }
    if ($want -le 0) { $curveOff += "moc depth=$($itM.depth) khong tinh duoc"; continue }
    if ([Math]::Abs([double]$itM.expectedGold / $want - 1.0) -gt 0.10) {
        $curveOff += "d$($itM.depth): $($itM.expectedGold) vs $([Math]::Round($want))"
    }
}
Assert-True 'ECON' 'goldCurve = tong tich luy expectedGoldG0 (khong co he so nhan an)' ($curveOff.Count -eq 0) `
    ("$(@($gdEco.goldCurve).Count) moc; lech: " + (Join-Or $curveOff))

$luckCur = @($gdEco.currencies | Where-Object { $_.id -eq 'luck' })
Assert-True 'ECON' 'Loc ton tai, la currency pham vi run, co source va sink' `
    (($luckCur.Count -eq 1) -and ($luckCur[0].type -eq 'run') -and (@($luckCur[0].sources).Count -ge 3) -and (@($luckCur[0].sinks).Count -ge 1)) `
    ($(if ($luckCur.Count -eq 1) { "type=$($luckCur[0].type), $(@($luckCur[0].sources).Count) source, $(@($luckCur[0].sinks).Count) sink" } else { 'KHONG CO currency luck' }))

# ------------------------------------------------------------- D. weapons
$dpsBase = [double]$gdWpn.balance.dpsTargetBase
$dpsGrow = [double]$gdWpn.balance.dpsTargetGrowth
$mAdv    = [double]$gdWpn.balance.meleeAdvantage
$sRegen  = [double]$gdWpn.balance.staminaRegen
$anchorRooms = @(1, 8, 18, 30, 45, 60)
function Get-DpsTarget([int]$tier) { return $dpsBase * [Math]::Pow($dpsGrow, $tier - 1) }
function Get-TrashHp([int]$tier)   { return 40.0 * [Math]::Pow(1.068, $anchorRooms[$tier - 1] - 1) }
function Get-WaveEhp([int]$tier) {
    $rr = $anchorRooms[$tier - 1]
    return ((14.0 + 4.2 * $rr) / 1.6) * (40.0 * [Math]::Pow(1.068, $rr - 1)) * 1.15
}

$offCurve = @(); $slowTtk = @(); $magFail = @(); $magWarn = @(); $reserveWarn = @(); $stamLock = @()
$rangedByTier = @{}; $meleeByTier = @{}
foreach ($itW in $gdWpn.weapons) {
    $tier = [int]$itW.tier
    if ($itW.class -eq 'ranged') {
        $cycle = [double]$itW.mag / ([double]$itW.rpm / 60.0) + [double]$itW.reloadTime
        $dps   = ([double]$itW.dmg * [double]$itW.pellets * [double]$itW.mag) / $cycle
        $dev   = [Math]::Abs($dps / (Get-DpsTarget $tier) - 1.0)
        if ($dev -gt [double]$gdWpn.balance.rangedTolerance) { $offCurve += "$($itW.id) $([Math]::Round($dev*100))%" }
        $ttk = (Get-TrashHp $tier) / $dps
        if ($ttk -gt 0.60) { $slowTtk += "$($itW.id) $([Math]::Round($ttk,2))s" }
        # magClearRatio: FAIL neu 1 bang don sach ca wave (bat ky tier) -> P2 chet.
        # Nguong DUOI chi FAIL o T1-T2, vi tu T3 tro len suc manh thuc te bi chi phoi boi
        # weapon level + talent + the trong run (khong doc duoc tu weapons.json) -> chi WARN.
        $magRatio = ([double]$itW.mag * [double]$itW.dmg * [double]$itW.pellets) / (Get-WaveEhp $tier)
        if ($magRatio -gt 1.0) { $magFail += "$($itW.id) $([Math]::Round($magRatio,2)) (>1.0)" }
        elseif ($magRatio -lt 0.25 -and $tier -le 2) { $magFail += "$($itW.id) $([Math]::Round($magRatio,2)) (<0.25 o T$tier)" }
        elseif ($magRatio -lt 0.45 -or $magRatio -gt 0.70) { $magWarn += "$($itW.id) T$tier $([Math]::Round($magRatio,2))" }
        $resWaves = ([double]$itW.reserveMax * [double]$itW.dmg * [double]$itW.pellets) / (Get-WaveEhp $tier)
        if ($resWaves -lt 6 -or $resWaves -gt 9) { $reserveWarn += "$($itW.id) $([Math]::Round($resWaves,1))" }
        if (-not $rangedByTier.ContainsKey($tier)) { $rangedByTier[$tier] = @() }
        $rangedByTier[$tier] += $dps
    }
    else {
        $tf = 1.0 + 0.35 * ([double]$itW.targets - 1.0)
        $iv = [Math]::Max([double]$itW.swingTime, [double]$itW.staminaCost / $sRegen)
        $dps = [double]$itW.dmg * $tf / $iv
        $dev = [Math]::Abs($dps / ((Get-DpsTarget $tier) * $mAdv) - 1.0)
        if ($dev -gt [double]$gdWpn.balance.meleeTolerance) { $offCurve += "$($itW.id) $([Math]::Round($dev*100))%" }
        if (-not $meleeByTier.ContainsKey($tier)) { $meleeByTier[$tier] = @() }
        $meleeByTier[$tier] += $dps
        if (($sRegen * 1.4) -lt [double]$itW.staminaCost) { $stamLock += "$($itW.id) stam=$($itW.staminaCost)" }
    }
}
Assert-True 'WPN' 'Moi vu khi nam trong tolerance cua dpsTarget(tier)' ($offCurve.Count -eq 0) `
    ("$(@($gdWpn.weapons).Count) vu khi; lech: " + (Join-Or $offCurve))
Assert-True 'WPN' 'TTK trash <= 0.60s cho moi vu khi tam xa' ($slowTtk.Count -eq 0) `
    ("qua cham: " + (Join-Or $slowTtk 'khong'))
Assert-True 'WPN' 'Luon con >=1 nhat chem trong 1.4s khi stamina can (regen*1.4 >= staminaCost)' ($stamLock.Count -eq 0) `
    ("vi pham: " + (Join-Or $stamLock 'khong'))

$t1OneShot = @($gdWpn.weapons | Where-Object { [int]$_.tier -eq 1 -and $_.class -eq 'ranged' -and (([double]$_.dmg * [double]$_.pellets) -ge 40.0) })
Assert-True 'WPN' 'Co it nhat 1 vu khi T1 one-shot trash o Depth 1' ($t1OneShot.Count -ge 1) `
    ("one-shot: " + (Join-Or @($t1OneShot | ForEach-Object { $_.id }) 'KHONG CO'))

Assert-True 'WPN' 'GATE P2: khong bang dan nao don sach ca wave (magClearRatio <= 1.0)' ($magFail.Count -eq 0) `
    ("vi pham: " + (Join-Or $magFail))
Assert-True 'WPN' 'magClearRatio trong [0.45, 0.70] (y do thiet ke)' ($magWarn.Count -eq 0) `
    ("ngoai khoang: " + (Join-Or $magWarn)) 'WARN'
Assert-True 'WPN' 'Du tru du 6-9 wave neu khong melee' ($reserveWarn.Count -eq 0) `
    ("ngoai khoang: " + (Join-Or $reserveWarn)) 'WARN'

$badAdv = @()
foreach ($tKey in ($meleeByTier.Keys | Sort-Object)) {
    if (-not $rangedByTier.ContainsKey($tKey)) { continue }
    $mAvg = ($meleeByTier[$tKey]  | Measure-Object -Average).Average
    $rAvg = ($rangedByTier[$tKey] | Measure-Object -Average).Average
    if ($mAvg -lt (1.30 * $rAvg)) { $badAdv += "T$tKey melee $([Math]::Round($mAvg)) vs ranged $([Math]::Round($rAvg))" }
}
Assert-True 'WPN' 'Melee DPS >= 1.30 x ranged DPS o cung tier (docs/05 muc 8.3)' ($badAdv.Count -eq 0) `
    ("so sanh $(@($meleeByTier.Keys).Count) tier; vi pham: " + (Join-Or $badAdv))

$noKbTool = @()
foreach ($itD in $gdDep.depths) {
    $kbCount = 0
    foreach ($uid in $itD.loadoutUnlocks) {
        $wRef = $gdWpn.weapons | Where-Object { $_.id -eq $uid }
        if ($wRef -and [double]$wRef.knockback -ge 1.0) { $kbCount++ }
    }
    if ($kbCount -lt 1 -and [int]$itD.depth -le 5) { $noKbTool += "depth$($itD.depth)" }
}
Assert-True 'WPN' 'Moi Depth 1-5 mo it nhat 1 cong cu dan cach (kb >= 1.0)' ($noKbTool.Count -eq 0) `
    ("thieu: " + (Join-Or $noKbTool 'khong'))

$unusedWpn = @()
$allUnlocked = @($gdDep.depths | ForEach-Object { $_.loadoutUnlocks }) + @('start')
foreach ($itW in $gdWpn.weapons) {
    if (($allUnlocked -notcontains $itW.id) -and ($itW.unlock -ne 'start')) { $unusedWpn += $itW.id }
}
Assert-True 'WPN' 'Moi vu khi duoc mo o mot Depth nao do' ($unusedWpn.Count -eq 0) `
    ("khong co duong mo: " + (Join-Or $unusedWpn 'khong')) 'WARN'

# ------------------------------------------------------------- E. enemies
$badEnemy = @()
foreach ($itE in $gdEne.enemies) {
    $isMist = @($itE.tags) -contains 'invulnerable'
    if (-not $isMist) {
        if ([double]$itE.tpCost -le 0)   { $badEnemy += "$($itE.id) tpCost" }
        if ([double]$itE.goldDrop -lt 1) { $badEnemy += "$($itE.id) goldDrop" }
        if ([double]$itE.hp -le 0)       { $badEnemy += "$($itE.id) hp" }
    }
    if (-not $itE.sfxSpawn) { $badEnemy += "$($itE.id) sfxSpawn" }
    if (-not $itE.counters) { $badEnemy += "$($itE.id) counters" }
    if (-not $itE.mechanic) { $badEnemy += "$($itE.id) mechanic" }
}
Assert-True 'ENEMY' 'Moi quai co tpCost/goldDrop/hp/sfxSpawn/counters/mechanic' ($badEnemy.Count -eq 0) `
    ("$(@($gdEne.enemies).Count) quai; thieu: " + (Join-Or $badEnemy))

# behavior block: chi quai co hanh vi rieng moi co, nhung co thi phai day du
$badBehav = @()
$behavKinds = @('shield', 'slam')
$withBehav = @($gdEne.enemies | Where-Object { $_.behavior })
foreach ($itE in $withBehav) {
    $b = $itE.behavior
    if ($behavKinds -notcontains $b.kind) { $badBehav += "$($itE.id) kind=$($b.kind)"; continue }
    if ($b.kind -eq 'shield') {
        foreach ($k in @('frontRangedMult', 'kbResistBack', 'cycleSec', 'openSec', 'turnRateDeg', 'frontalDot')) {
            if ($null -eq $b.$k) { $badBehav += "$($itE.id) thieu $k" }
        }
        if ([double]$b.openSec -le 0 -or [double]$b.openSec -ge [double]$b.cycleSec) { $badBehav += "$($itE.id) openSec phai trong (0, cycleSec)" }
        if ([double]$b.frontRangedMult -ge 1) { $badBehav += "$($itE.id) frontRangedMult phai < 1" }
        if (@($b.bypassArchetypes).Count -lt 1 -and -not $b.bypassHeavySlash) { $badBehav += "$($itE.id) khong co duong pha khien" }
    }
    if ($b.kind -eq 'slam') {
        foreach ($k in @('attackRangeM', 'telegraphSec', 'aoeRadiusM', 'cooldownSec', 'weakPointMult')) {
            if ($null -eq $b.$k) { $badBehav += "$($itE.id) thieu $k" }
        }
        # telegraph phai du dai de Buoc Lui (cooldown 2.5s) co the cuu duoc
        if ([double]$b.telegraphSec -lt 0.5) { $badBehav += "$($itE.id) telegraphSec < 0.5 (khong ne kip)" }
        if ([double]$b.aoeRadiusM -gt [double]$b.attackRangeM) { $badBehav += "$($itE.id) aoe > attackRange" }
        if ([double]$b.weakPointMult -le 1) { $badBehav += "$($itE.id) weakPointMult phai > 1" }
    }
}
Assert-True 'ENEMY' 'behavior block day du va hop le (shield / slam)' ($badBehav.Count -eq 0) `
    ("$($withBehav.Count) quai co hanh vi rieng: " + (Join-Or @($withBehav | ForEach-Object { "$($_.id)=$($_.behavior.kind)" }) 'khong') +
     $(if ($badBehav.Count) { ' | SAI: ' + ($badBehav -join ', ') } else { '' }))

$earlyKb = @($gdEne.enemies | Where-Object {
    [int]$_.introDepth -le 2 -and [double]$_.kbResist -gt 0.20 -and (@($_.tags) -notcontains 'invulnerable') -and $_.role -ne 'elite'
} | ForEach-Object { "$($_.id) $($_.kbResist)" })
Assert-True 'ENEMY' 'Depth 1-2: khong quai nao kbResist > 0.20 (day co che truoc khi pha)' ($earlyKb.Count -eq 0) `
    ("vi pham: " + (Join-Or $earlyKb))

$badIntro = @()
foreach ($itD in $gdDep.depths) {
    $n = @($itD.introEnemies).Count
    if ($n -lt 1 -or $n -gt 3) { $badIntro += "depth$($itD.depth)=$n" }
}
Assert-True 'ENEMY' 'Moi Depth gioi thieu 1-3 loai quai moi' ($badIntro.Count -eq 0) ("sai: " + (Join-Or $badIntro))

$introMismatch = @()
foreach ($itE in $gdEne.enemies) {
    if (@($itE.tags) -contains 'invulnerable') { continue }
    $declared = @($gdDep.depths | Where-Object { @($_.introEnemies) -contains $itE.id })
    if ($declared.Count -eq 1 -and [int]$declared[0].depth -ne [int]$itE.introDepth) {
        $introMismatch += "$($itE.id) enemies=$($itE.introDepth) depths=$($declared[0].depth)"
    }
}
Assert-True 'ENEMY' 'introDepth khop giua enemies.json va depths.json' ($introMismatch.Count -eq 0) `
    ("lech: " + (Join-Or $introMismatch))

$badAffix = @()
foreach ($itA in $gdEne.affixes) {
    foreach ($x in @($itA.excludes)) {
        if ($x) {
            $other = $gdEne.affixes | Where-Object { $_.id -eq $x }
            if (-not $other) { $badAffix += "$($itA.id) -> $x (khong ton tai)" }
            elseif (@($other.excludes) -notcontains $itA.id) { $badAffix += "$($itA.id) <-> $x khong doi xung" }
        }
    }
}
Assert-True 'ENEMY' 'Affix excludes doi xung (Chai San vs Da Cung)' ($badAffix.Count -eq 0) `
    ("$(@($gdEne.affixes).Count) affix; sai: " + (Join-Or $badAffix))

$badBoss = @()
foreach ($itB in $gdEne.bosses) {
    if ([double]$itB.ttkTargetSec -lt 40 -or [double]$itB.ttkTargetSec -gt 80) { $badBoss += "$($itB.id) ttk=$($itB.ttkTargetSec)" }
    if (@($itB.phases).Count -lt 2) { $badBoss += "$($itB.id) phases" }
    if (-not $itB.meleeWindow) { $badBoss += "$($itB.id) thieu meleeWindow" }
    if ([double]$itB.kbResist -ne 1.0) { $badBoss += "$($itB.id) kbResist != 1.0" }
}
Assert-True 'BOSS' 'Boss: TTK 40-80s, >=2 phase, co cua so bat buoc dung dao, kbResist=1.0' ($badBoss.Count -eq 0) `
    ("$(@($gdEne.bosses).Count) boss; sai: " + (Join-Or $badBoss))

$missingBoss = @()
foreach ($itD in $gdDep.depths) {
    $bMatch = @($gdEne.bosses | Where-Object { [int]$_.depth -eq [int]$itD.depth })
    if ($bMatch.Count -ne 1) { $missingBoss += "depth$($itD.depth)=$($bMatch.Count)" }
}
Assert-True 'BOSS' 'Moi Depth co dung 1 boss' ($missingBoss.Count -eq 0) ("sai: " + (Join-Or $missingBoss 'khong'))

# ------------------------------------------------- F. escalation (no player dial)
# GATE: khong duoc muon co che cua Guns 'n Goblins. Chi lay FEEL (mat do quai).
# Bat ky khoa/chu "greed"/"Chuong Tham"/"bell" trong data la vi pham yeu cau thiet ke.
$forbidden = @('greed', 'Greed', 'chuong tham', 'Chuong Tham', 'bellringer', 'bastion', 'Bastion')
$leaks = @()
foreach ($dataFile in (Get-ChildItem (Join-Path $rootDir 'data\*.json'))) {
    $txt = [System.IO.File]::ReadAllText($dataFile.FullName, [System.Text.Encoding]::UTF8)
    foreach ($tok in $forbidden) {
        if ($txt -clike "*$tok*") { $leaks += ("{0}: '{1}'" -f $dataFile.Name, $tok) }
    }
}
Assert-True 'ESCAL' "GATE: data khong con co che Greed/Bell cua Guns 'n Goblins (chi lay feel mat do quai)" ($leaks.Count -eq 0) `
    ("quet $(@(Get-ChildItem (Join-Path $rootDir 'data\*.json')).Count) file; ro ri: " + (Join-Or $leaks 'khong'))

$scal = $gdEne.scaling
$noDial = -not ($scal.PSObject.Properties.Name -match 'Greed')
Assert-True 'ESCAL' 'Scaling quai khong co dial nguoi choi dieu khien' $noDial `
    ("khoa: " + (($scal.PSObject.Properties.Name) -join ', '))

Assert-True 'ESCAL' 'Do kho tu tang: hpPerRoom > 1.0 VA hpPerWave > 0 (theo docs goc: do kho moi wave tang dan)' `
    (([double]$scal.hpPerRoom -gt 1.0) -and ([double]$scal.hpPerWave -gt 0)) `
    ("hpPerRoom=$($scal.hpPerRoom) / dmgPerRoom=$($scal.dmgPerRoom) / hpPerWave=$($scal.hpPerWave)")

# mat do quai: phai dat cam giac "mot minh giua ca ham" som (>= 60 con / wave truoc R20).
# So quai phai tinh theo COMPOSITION THUC cua wave dong nhat, khong phai tpCost trung binh
# toan bo pool -- lay trung binh ca Ogre (tp 8) vao mot wave toan Goblin Bay (tp 0.8) la sai.
# chi xet wave flood dung duoc trong PHONG CHIEN THUONG (tpMult < 2.0 loai bo Lo Vang/gauntlet)
$tideWave = @($gdWav.waveTemplates |
    Where-Object { $_.spawnPattern -eq 'flood' -and [double]$_.tpMult -lt 2.0 } |
    Sort-Object -Property tpMult -Descending | Select-Object -First 1)
$densityHitRoom = 0; $tideFactor = 0.0; $tideName = 'khong co wave flood'
if ($tideWave.Count -eq 1) {
    $tideName = $tideWave[0].id
    foreach ($itComp in $tideWave[0].composition) {
        $eRef = @($gdEne.enemies | Where-Object { $_.id -eq $itComp.enemy })
        if ($eRef.Count -eq 1 -and [double]$eRef[0].tpCost -gt 0) {
            $tideFactor += [double]$itComp.weight / [double]$eRef[0].tpCost
        }
    }
    $tideFactor *= [double]$tideWave[0].tpMult
    for ($rr = 1; $rr -le 70; $rr++) {
        $cnt = (14.0 + 4.2 * $rr) * $tideFactor
        if ($cnt -ge 60 -and $densityHitRoom -eq 0) { $densityHitRoom = $rr }
    }
}
Assert-True 'ESCAL' 'Cam giac dong (>=60 con/wave) dat duoc truoc phong R20' `
    ($densityHitRoom -gt 0 -and $densityHitRoom -le 20) `
    ("${tideName}: dat o R$densityHitRoom (he so $([Math]::Round($tideFactor,2)) con/TP; R1 = $([Math]::Round(18.2*$tideFactor)) con, R10 = $([Math]::Round(56*$tideFactor)) con)")

$capOk = ([int]$gdWav.directorRules.hardCaps.maxTotalAlive -ge 150)
Assert-True 'ESCAL' 'Hard cap cho phep >= 150 quai song cung luc (feel tham chieu tu Guns n Goblins)' $capOk `
    ("maxTotalAlive=$($gdWav.directorRules.hardCaps.maxTotalAlive), fullAI=$($gdWav.directorRules.hardCaps.maxFullAiAgents)")

$affixEarly = @($gdEne.affixes | Where-Object { [int]$_.minDepth -lt 4 } | ForEach-Object { "$($_.id) D$($_.minDepth)" })
Assert-True 'ESCAL' 'Affix chi bat dau tu Depth 4 (day co che truoc khi pha)' ($affixEarly.Count -eq 0) `
    ("affix som: " + (Join-Or $affixEarly 'khong'))

# --------------------------------------------------------------- F2. nga ba ham
$forkMissing = @()
foreach ($itRoom in $gdRom.depthLayout) {
    $rn = [int]$itRoom.room
    if ($rn -eq 1 -or $rn -eq 9 -or $rn -eq 10) {
        if ($itRoom.forkPool) { $forkMissing += "phong $rn khong duoc co nga ba" }
    }
    elseif (@($itRoom.forkPool).Count -lt 2) { $forkMissing += "phong $rn chi co $(@($itRoom.forkPool).Count) cua" }
}
Assert-True 'FORK' 'Nga Ba Ham: moi Cong (tru phong 1/9/10) co >= 2 cua' ($forkMissing.Count -eq 0) `
    ("sai: " + (Join-Or $forkMissing))
Assert-True 'FORK' 'Nga Ba co bien bao (>=4 tag) va rang buoc an tinh' `
    ((@($gdRom.fork.signTags).Count -ge 4) -and (@($gdRom.fork.constraints).Count -ge 3)) `
    ("$(@($gdRom.fork.signTags).Count) tag / $(@($gdRom.fork.constraints).Count) rang buoc")

# -------------------------------------------------------- G. waves / rooms
$badWeight = @(); $tooManyTypes = @()
$maxTypes = [int]$gdWav.directorRules.hardCaps.maxDistinctTypesPerWave
foreach ($itV in $gdWav.waveTemplates) {
    $sum = ($itV.composition | Measure-Object -Property weight -Sum).Sum
    if ([Math]::Abs($sum - 1.0) -gt 0.001) { $badWeight += "$($itV.id)=$sum" }
    if (@($itV.composition).Count -gt $maxTypes) { $tooManyTypes += $itV.id }
}
Assert-True 'WAVE' 'composition weight cong lai = 1.0' ($badWeight.Count -eq 0) `
    ("$(@($gdWav.waveTemplates).Count) template; sai: " + (Join-Or $badWeight))
Assert-True 'WAVE' "So loai quai / wave <= $maxTypes" ($tooManyTypes.Count -eq 0) ("vi pham: " + (Join-Or $tooManyTypes))

$badMinDepth = @()
foreach ($itV in $gdWav.waveTemplates) {
    foreach ($itComp in $itV.composition) {
        $eRef = $gdEne.enemies | Where-Object { $_.id -eq $itComp.enemy }
        if ($eRef -and ([int]$eRef.introDepth -gt [int]$itV.minDepth)) {
            $badMinDepth += "$($itV.id) dung $($itComp.enemy) (intro $($eRef.introDepth) > minDepth $($itV.minDepth))"
        }
    }
}
Assert-True 'WAVE' 'Wave khong dung quai truoc introDepth cua no' ($badMinDepth.Count -eq 0) ("sai: " + (Join-Or $badMinDepth))

$layoutTypes = @($gdRom.depthLayout | ForEach-Object { $_.type })
Assert-True 'ROOM' 'Layout Depth co >=1 Shop va 1 Boss' (($layoutTypes -contains 'shop') -and ($layoutTypes -contains 'boss')) `
    ($layoutTypes -join ' > ')
Assert-True 'ROOM' 'Layout Depth co dung 10 phong' (@($gdRom.depthLayout).Count -eq 10) `
    ("$(@($gdRom.depthLayout).Count) phong")

$freqSum = ($gdRom.roomTypes | Measure-Object -Property freq -Sum).Sum
Assert-True 'ROOM' 'Tong tan suat roomTypes ~ 1.0' ([Math]::Abs($freqSum - 1.0) -le 0.02) ("tong = $([Math]::Round($freqSum,3))")

$mistExempt = @($gdWav.directorRules.blackMist.exemptRooms)
Assert-True 'ROOM' 'Suong Den mien tru phong Boss / Shop / Mieu' `
    (($mistExempt -contains 'boss') -and ($mistExempt -contains 'shop') -and ($mistExempt -contains 'shrine')) `
    ($mistExempt -join ', ')

# ------------------------------------------------------------ H. talents
$badTalent = @()
$branchIds = @($gdTal.branches | ForEach-Object { $_.id })
foreach ($itT in $gdTal.talents) {
    $prevCostGold = -1.0; $prevCostShard = -1.0; $prevDelta = $null; $ri = 0
    foreach ($itRank in $itT.ranks) {
        $ri++
        if ([double]$itRank.powerDelta -lt 0.02) { $badTalent += "$($itT.id) r$ri delta=$($itRank.powerDelta)" }
        if ($currIds -notcontains $itRank.currency) { $badTalent += "$($itT.id) r$ri currency=$($itRank.currency)" }
        if ($null -ne $prevDelta -and ([double]$itRank.powerDelta -lt (0.5 * $prevDelta))) { $badTalent += "$($itT.id) r$ri delta tut >50%" }
        if ($itRank.currency -eq 'gold') {
            if ([double]$itRank.cost -le $prevCostGold) { $badTalent += "$($itT.id) r$ri cost gold khong tang" }
            $prevCostGold = [double]$itRank.cost
        } else {
            if ([double]$itRank.cost -le $prevCostShard) { $badTalent += "$($itT.id) r$ri cost shard khong tang" }
            $prevCostShard = [double]$itRank.cost
        }
        $prevDelta = [double]$itRank.powerDelta
    }
    if (@($itT.ranks).Count -lt 3) { $badTalent += "$($itT.id) chi co $(@($itT.ranks).Count) bac" }
    if ($branchIds -notcontains $itT.branch) { $badTalent += "$($itT.id) branch=$($itT.branch)" }
}
$rankTotal = 0; foreach ($itT in $gdTal.talents) { $rankTotal += @($itT.ranks).Count }
Assert-True 'TALENT' 'Talent: delta >= 2%, cost tang don dieu theo tung currency, branch ton tai' ($badTalent.Count -eq 0) `
    ("$(@($gdTal.talents).Count) talent / $rankTotal bac; sai: " + (Join-Or $badTalent))

$perBranch = @($gdTal.branches | ForEach-Object { $bid = $_.id; "$bid=$(@($gdTal.talents | Where-Object { $_.branch -eq $bid }).Count)" })
$emptyBranch = @($gdTal.branches | Where-Object { $bid = $_.id; @($gdTal.talents | Where-Object { $_.branch -eq $bid }).Count -lt 3 } | ForEach-Object { $_.id })
Assert-True 'TALENT' 'Moi nhanh talent co >=3 talent' ($emptyBranch.Count -eq 0) (($perBranch -join ', ') + '; thieu: ' + (Join-Or $emptyBranch 'khong'))

# -------------------------------------------------------------- I. cards
$badCard = @()
foreach ($itC in $gdUpg.cards) {
    if (@($itC.tags).Count -lt 1) { $badCard += "$($itC.id) khong co tag" }
    if ([double]$itC.powerDelta -lt 0.02 -and -not $itC.drawback) { $badCard += "$($itC.id) delta<2% & khong drawback" }
    if (-not $itC.effect) { $badCard += "$($itC.id) khong co effect" }
    if (@('common','rare','epic','legendary') -notcontains $itC.rarity) { $badCard += "$($itC.id) rarity=$($itC.rarity)" }
}
Assert-True 'CARD' 'The: co tag, co effect, rarity hop le, khong the rac' ($badCard.Count -eq 0) `
    ("$(@($gdUpg.cards).Count) the; sai: " + (Join-Or $badCard))

$rarGroups = @($gdUpg.cards | Group-Object rarity)
Assert-True 'CARD' 'Phan bo rarity co du 4 bac' ($rarGroups.Count -eq 4) `
    (($rarGroups | ForEach-Object { "$($_.Name)=$($_.Count)" }) -join ', ')

$strongNoCost = @($gdUpg.cards | Where-Object { [double]$_.powerDelta -ge 0.80 -and -not $_.drawback } | ForEach-Object { $_.id })
Assert-True 'CARD' 'The cuc manh (delta >= 80%) phai co gia phai tra' ($strongNoCost.Count -eq 0) `
    ("khong co gia: " + (Join-Or $strongNoCost 'khong')) 'WARN'

# ------------------------------------------------------- J. gamefeel/ctrl
$badFeel = @()
if ([double]$gdFel.globalRules.shakeTotalAmplitudeCapPx -gt 30) { $badFeel += 'shake cap > 30px' }
if ([double]$gdFel.globalRules.targetInputToBulletFrames -gt 3) { $badFeel += 'input->bullet > 3 frame' }
if (@($gdFel.hitstop).Count -lt 5) { $badFeel += 'hitstop < 5 su kien' }
if (-not $gdFel.gold.coinChimeLadder) { $badFeel += 'thieu coin chime ladder' }
Assert-True 'FEEL' 'Luat juice: cap rung, do tre input, hitstop, coin chime' ($badFeel.Count -eq 0) `
    ("shake cap $($gdFel.globalRules.shakeTotalAmplitudeCapPx)px / input $($gdFel.globalRules.targetInputToBulletFrames) frame / $(@($gdFel.hitstop).Count) hitstop; sai: " + (Join-Or $badFeel))

$dirShake = @($gdFel.shake | Where-Object { $_.axis -match 'slide' })
Assert-True 'FEEL' 'Rung khi chem phai co huong theo vector slide' ($dirShake.Count -ge 3) `
    ("$($dirShake.Count) su kien rung theo vector slide")

$meleeMax = [double](($gdCtr.params | Where-Object { $_.key -eq 'meleeAngleMax' }).value)
$moveMin  = [double](($gdCtr.params | Where-Object { $_.key -eq 'moveAngleMin' }).value)
Assert-True 'CTRL' 'Vung chet giua goc chem va goc di chuyen >= 5 do' (($moveMin - $meleeMax) -ge 5) `
    ("melee <= $meleeMax deg, move >= $moveMin deg, dead zone = $($moveMin - $meleeMax) deg")

$hasTwoZone = (@($gdCtr.accessibility | Where-Object { $_.id -eq 'ac_haivung' }).Count -eq 1)
Assert-True 'CTRL' 'Co phuong an thoat cho rui ro R1 (Che do Hai Vung)' $hasTwoZone `
    ($(if ($hasTwoZone) { 'ac_haivung ton tai' } else { 'THIEU fallback cho rui ro chi tu' }))

$gestureWeapons = @($gdCtr.gestures | Where-Object { $_.weapon -eq 'ranged' }).Count
$gestureMelee   = @($gdCtr.gestures | Where-Object { $_.weapon -eq 'melee' }).Count
Assert-True 'CTRL' 'Co gesture cho ca tam xa va can chien, va co vung chet' `
    ($gestureWeapons -ge 3 -and $gestureMelee -ge 2 -and (@($gdCtr.gestures | Where-Object { $_.id -eq 'gs_deadzone' }).Count -eq 1)) `
    ("ranged=$gestureWeapons, melee=$gestureMelee, deadzone=$(@($gdCtr.gestures | Where-Object { $_.id -eq 'gs_deadzone' }).Count)")

# ============================ RUN / CAMERA (mo hinh chay X met) =========================
# Nhung check nay ton tai vi prototype cho thay quai dung o 1.2m thi diem tap roi vao
# 92.7% chieu cao man hinh -- tuc nam duoi nut NAP, khong the tan cong (docs/18 loi #9).
# Cong thuc duoi day la CHIEU PHOI CANH THAT (giong three.js), khong phai xap xi goc.
function Get-ScreenPct([double]$distM, [double]$anchorY, [double]$camH, [double]$fovDeg, [double]$pitchDeg) {
    $th = $pitchDeg * [Math]::PI / 180.0
    $dy = $anchorY - $camH
    $dz = -$distM
    $yp = $dy * [Math]::Cos($th) - $dz * [Math]::Sin($th)
    $zp = $dy * [Math]::Sin($th) + $dz * [Math]::Cos($th)
    if ($zp -ge 0) { return 999.0 }
    $ndc = ($yp / (-$zp)) / [Math]::Tan($fovDeg * [Math]::PI / 360.0)
    return ((1.0 - $ndc) / 2.0) * 100.0
}

$gdCam = $gdFel.camera
$gdRun = $gdFel.run
$bandLo = [double]$gdCam.meleeBandScreenPct[0]
$bandHi = [double]$gdCam.meleeBandScreenPct[1]

Assert-True 'RUN' 'gamefeel.json co khoi camera + run day du' `
    ($null -ne $gdCam -and $null -ne $gdRun -and $null -ne $gdRun.tapNearM) `
    ("camera=$($null -ne $gdCam) run=$($null -ne $gdRun)")

# scale nho nhat = truong hop XAU NHAT (con thap nhat nam thap nhat tren man hinh)
$scales = @($gdEne.enemies | Where-Object { $null -ne $_.scale } | ForEach-Object { [double]$_.scale })
if ($scales.Count -eq 0) { $scales = @(1.0) }
$minScale = ($scales | Measure-Object -Minimum).Minimum
$anchorMin = [double]$gdCam.tapAnchorFrac * $minScale
$pctNear = Get-ScreenPct ([double]$gdRun.tapNearM) $anchorMin ([double]$gdCam.heightM) ([double]$gdCam.fovDegVertical) ([double]$gdCam.pitchDegDown)
Assert-True 'RUN' 'Quai o tapNearM van nam trong dai man hinh cho phep (tap duoc)' `
    ($pctNear -ge $bandLo -and $pctNear -le $bandHi) `
    ("con thap nhat (scale $minScale) o {0:N2}m nam o {1:N1}% chieu cao man hinh; cho phep $bandLo-$bandHi%" -f [double]$gdRun.tapNearM, $pctNear)

# quai ranged dung xa hon -> phai KHONG bi tran ra khoi dinh man hinh
$pctRanged = Get-ScreenPct ([double]$gdRun.rangedStandoffM) ([double]$gdCam.tapAnchorFrac * 0.95) ([double]$gdCam.heightM) ([double]$gdCam.fovDegVertical) ([double]$gdCam.pitchDegDown)
Assert-True 'RUN' 'Quai ranged o rangedStandoffM van trong dai man hinh' `
    ($pctRanged -ge $bandLo -and $pctRanged -le $bandHi) `
    ("o {0:N1}m nam o {1:N1}%; cho phep $bandLo-$bandHi%" -f [double]$gdRun.rangedStandoffM, $pctRanged)

$gdMel = @($gdWpn.weapons | Where-Object { $null -ne $_.reachM })

# CAN CHIEN PHAI VOI XA HON CHO QUAI DUNG: neu khong thi dao vo dung o dung cai
# khoang ma sung khong con ban duoc (quai da tut xuong duoi day man hinh).
$needReach = [double]$gdRun.tapNearM + [double]$gdRun.meleeReachMarginM
$shortMelee = @($gdMel | Where-Object { [double]$_.reachM -lt $needReach } | ForEach-Object { "$($_.id) $($_.reachM)m" })
Assert-True 'WEAPON' 'Moi vu khi can chien voi xa hon khoang quai dung (tapNearM + margin)' `
    ($shortMelee.Count -eq 0) `
    ("can >= {0:N2}m; ngan nhat hien tai = {1:N2}m" -f $needReach, (($gdMel | ForEach-Object { [double]$_.reachM } | Measure-Object -Minimum).Minimum) +
     $(if ($shortMelee.Count) { ' | VI PHAM: ' + ($shortMelee -join ', ') } else { '' }))

# HOP DONG DON AoE: nguoi choi chay tien nen telegraph AN MAT speed*telegraphSec met.
# Don giang o impactM, va Buoc Lui phai dua ra NGOAI aoeRadius tu do.
$badAoe = @()
foreach ($itS in @($gdEne.enemies | Where-Object { $_.behavior -and $_.behavior.kind -eq 'slam' })) {
    $bh = $itS.behavior
    $impact = [Math]::Max([double]$gdRun.contactM, [double]$bh.attackRangeM - [double]$gdRun.speedMps * [double]$bh.telegraphSec)
    if ([double]$bh.aoeRadiusM -lt $impact) {
        $badAoe += ("$($itS.id): aoeRadius {0:N2} < impact {1:N2} -> don KHONG BAO GIO trung" -f [double]$bh.aoeRadiusM, $impact)
    }
    if (($impact + [double]$gdRun.dodgeBackM) -le [double]$bh.aoeRadiusM) {
        $badAoe += ("$($itS.id): impact {0:N2} + dodgeBack {1:N2} <= aoeRadius {2:N2} -> NE KHONG THOAT" -f $impact, [double]$gdRun.dodgeBackM, [double]$bh.aoeRadiusM)
    }
}
Assert-True 'ENEMY' 'Don AoE: vua trung duoc khi dung im, vua ne duoc bang 1 Buoc Lui' `
    ($badAoe.Count -eq 0) `
    ("impact = max(contactM, attackRange - speed*telegraph)" + $(if ($badAoe.Count) { ' | ' + ($badAoe -join ' ; ') } else { '' }))

# ================== LAN (3 lan, quai dung yen) ==================
$gdLan = $gdFel.lanes
Assert-True 'RUN' 'Lan giua rong hon moi lan ben (yeu cau thiet ke)' `
    ((2.0 * [double]$gdLan.midHalfWidthM) -gt [double]$gdLan.sideWidthM) `
    ("lan giua rong {0:N2}m, moi lan ben {1:N2}m; hanh lang 9m" -f (2.0 * [double]$gdLan.midHalfWidthM), [double]$gdLan.sideWidthM)

# Quai lan giua spawn quanh truc chu khong trai het lan: neu mot con dung o sat ranh
# lan (1.9m) ma van gay dmg thi nguoi choi thay no di qua canh minh roi mat mau.
Assert-True 'RUN' 'Quai lan giua spawn quanh truc, khong trai sat ranh lan' `
    ([double]$gdLan.midSpawnJitterM -gt 0 -and [double]$gdLan.midSpawnJitterM -lt [double]$gdLan.midHalfWidthM) `
    ("jitter +-{0:N2}m trong lan +-{1:N2}m -> vung trong {2:N2}m..{1:N2}m khong co quai nao" -f [double]$gdLan.midSpawnJitterM, [double]$gdLan.midHalfWidthM, [double]$gdLan.midSpawnJitterM)

Assert-True 'RUN' 'midSpawnFrac nam trong 0.30-0.70' `
    ([double]$gdLan.midSpawnFrac -ge 0.30 -and [double]$gdLan.midSpawnFrac -le 0.70) `
    ("midSpawnFrac = {0:N2} -> {1:N0}% quai la moi de, con lai la vang them" -f [double]$gdLan.midSpawnFrac, (100.0 * [double]$gdLan.midSpawnFrac))

Assert-True 'RUN' 'Lane spring ton tai va separation khong day ngang qua manh' `
    ([double]$gdRun.laneSpringPerSec -gt 0 -and [double]$gdRun.sepLateralMult -gt 0 -and [double]$gdRun.sepLateralMult -lt 1) `
    ("laneSpringPerSec {0:N1}/s, sepLateralMult {1:N2}" -f [double]$gdRun.laneSpringPerSec, [double]$gdRun.sepLateralMult)

# ================== CUA SO PHAN UNG ==================
# QUAI DUNG YEN nen toc do tiep can = DUY NHAT toc do chay cua nguoi choi. Cua so phan
# ung vi vay do KHOANG CACH SPAWN quyet dinh, khong phai speed quai.
$needDist = [double]$gdRun.tapNearM + [double]$gdRun.minReactionSec * [double]$gdRun.speedMps
$badSpawn = @()
$pats = $gdWav.directorRules.spawnPatterns
foreach ($pn in @($pats.PSObject.Properties.Name | Where-Object { $_ -ne '_comment' })) {
    $p = $pats.$pn
    if ($null -eq $p.spawnDistM) { $badSpawn += "$pn thieu spawnDistM"; continue }
    $lo = [double]$p.spawnDistM[0]
    if ($lo -le 0) { $badSpawn += "$pn spawn PHIA SAU ($lo m) -- quai dung yen thi khong bao gio gap duoc"; continue }
    if ($lo -lt $needDist) {
        $badSpawn += ("$pn spawn o {0:N1}m -> chi {1:N2}s truoc khi tut khoi vung tap duoc" -f $lo, (($lo - [double]$gdRun.tapNearM) / [double]$gdRun.speedMps))
    }
}
Assert-True 'WAVE' 'Moi spawn pattern cho du cua so phan ung (quai dung yen)' `
    ($badSpawn.Count -eq 0) `
    ("can spawn xa >= tapNearM + minReactionSec*speedMps = {0:N2}m" -f $needDist) `
    -failStatus 'FAIL'
if ($badSpawn.Count) { $auditResults[-1].Detail += ' | VI PHAM: ' + ($badSpawn -join ' ; ') }

$windowSec = ([double]$gdRun.tapFarM - [double]$gdRun.tapNearM) / [double]$gdRun.speedMps
Assert-True 'RUN' 'Cua so tu luc thay quai den luc no tut khoi vung tap duoc' `
    ($windowSec -ge [double]$gdRun.minReactionSec) `
    ("(tapFar {0:N1} - tapNear {1:N1}) / chay {2:N1} = {3:N2}s (can >= {4:N2}s)" -f [double]$gdRun.tapFarM, [double]$gdRun.tapNearM, [double]$gdRun.speedMps, $windowSec, [double]$gdRun.minReactionSec)

# CUA SO TELEGRAPH: quai PLANT phai co du thoi gian vung truoc khi nguoi choi
# chay den contactM va don no ra sau. Neu khong, don dac trung cua no khong bao gio
# thay duoc -- prototype cho thay Ogre bi chay qua truoc khi kip dap (docs/18 loi #11).
$badTele = @()
foreach ($itT in @($gdEne.enemies | Where-Object { $_.behavior -and $_.behavior.telegraphSec })) {
    $bt = $itT.behavior
    $winSec = ([double]$bt.attackRangeM - [double]$gdRun.contactM) / [double]$gdRun.speedMps
    $needSec = [double]$bt.telegraphSec + 0.25
    if ($winSec -lt $needSec) {
        $badTele += ("$($itT.id): cua so {0:N2}s < telegraph {1:N2}s + 0.25 -> khong kip vung; can attackRangeM >= {2:N2}m" -f $winSec, [double]$bt.telegraphSec, ([double]$gdRun.contactM + [double]$gdRun.speedMps * $needSec))
    }
}
Assert-True 'ENEMY' 'Quai PLANT co du cua so de vung truoc khi bi chay qua' `
    ($badTele.Count -eq 0) `
    ("cua so = (attackRangeM - contactM) / speedMps" + $(if ($badTele.Count) { ' | ' + ($badTele -join ' ; ') } else { '' }))
# Do dai phong tinh theo quang duong, khong phai theo dong ho.
$roomSec = [double]$gdRun.roomDistanceM / [double]$gdRun.speedMps
$nWaves = [Math]::Round([double]$gdRun.roomDistanceM / [double]$gdRun.waveSegmentM)
Assert-True 'WAVE' 'Do dai 1 phong (quang duong / toc do) nam trong 25-60 giay' `
    ($roomSec -ge 25 -and $roomSec -le 60) `
    ("{0:N0}m / {1:N1} m/s = {2:N1}s, chia {3} wave x {4:N0}m" -f [double]$gdRun.roomDistanceM, [double]$gdRun.speedMps, $roomSec, $nWaves, [double]$gdRun.waveSegmentM)

# CHEM LIEN TUC (kieu chem hoa qua) phai co TRAN. Hai thu chan lai:
#   - moi con chi an dmg mot lan moi slideHitCooldownSec -> rung ngon tay khong nhan dmg
#   - giu ngon tay drain stamina -> khong the chem mai
$gdMel2 = $gdFel.melee
$sliceSec = 100.0 / [double]$gdMel2.slideStaminaPerSec
Assert-True 'FEEL' 'Chem lien tuc co tran: giu toi da 2-5s roi het stamina' `
    ($sliceSec -ge 2.0 -and $sliceSec -le 5.0) `
    ("stamina 100 / {0:N0} moi giay = {1:N2}s giu lien tuc; moi con an dmg toi da 1 lan moi {2:N2}s" -f [double]$gdMel2.slideStaminaPerSec, $sliceSec, [double]$gdMel2.slideHitCooldownSec)

Assert-True 'FEEL' 'Chem lien tuc yeu hon nhat chem don (khong thay the han)' `
    ([double]$gdMel2.slideTickDamageMult -gt 0 -and [double]$gdMel2.slideTickDamageMult -lt 1) `
    ("slideTickDamageMult = {0:N2}" -f [double]$gdMel2.slideTickDamageMult)

# Sung phai o ngoai du lau de NHIN THAY duoc, khong thi mot cai tap chi thay nhap nhay.
$gdGun = $gdFel.gun
Assert-True 'FEEL' 'Sung o ngoai du lau de doc duoc trang thai (gunHoldSec >= drawSec)' `
    ([double]$gdGun.gunHoldSec -ge [double]$gdGun.drawSec) `
    ("gunHoldSec {0:N2}s vs drawSec {1:N2}s + holsterSec {2:N2}s" -f [double]$gdGun.gunHoldSec, [double]$gdGun.drawSec, [double]$gdGun.holsterSec)

# -------------------------------------------------------------- K. output
$pass = @($auditResults | Where-Object { $_.Status -eq 'PASS' }).Count
$warn = @($auditResults | Where-Object { $_.Status -eq 'WARN' }).Count
$fail = @($auditResults | Where-Object { $_.Status -eq 'FAIL' }).Count

$sep = '-' * 100
Write-Host ''
Write-Host 'AUDIT GDD -- INTO THE GOBLIN'
Write-Host $sep
foreach ($itR in $auditResults) {
    Write-Host ('{0,-6} {1,-5} {2}' -f $itR.Group, $itR.Status, $itR.Check)
    Write-Host ('             -> {0}' -f $itR.Detail)
}
Write-Host $sep
Write-Host ('PASS {0}   WARN {1}   FAIL {2}   (tong {3} check)' -f $pass, $warn, $fail, $auditResults.Count)
Write-Host ''

$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine('# Audit Report -- INTO THE GOBLIN')
[void]$sb.AppendLine('')
[void]$sb.AppendLine('> File nay do `audit_gdd.ps1` sinh ra. KHONG sua tay.')
[void]$sb.AppendLine('')
[void]$sb.AppendLine(('**PASS {0} / WARN {1} / FAIL {2}** trong {3} check.' -f $pass, $warn, $fail, $auditResults.Count))
[void]$sb.AppendLine('')
[void]$sb.AppendLine('| Nhom | Trang thai | Check | Chi tiet |')
[void]$sb.AppendLine('|---|---|---|---|')
foreach ($itR in $auditResults) {
    $d = ($itR.Detail -replace '\|', '/')
    [void]$sb.AppendLine(('| {0} | **{1}** | {2} | {3} |' -f $itR.Group, $itR.Status, $itR.Check, $d))
}
[void]$sb.AppendLine('')
[void]$sb.AppendLine('WARN = lech y do thiet ke, can playtest quyet dinh. FAIL = vi pham bat bien, build phai dung.')
$enc = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText((Join-Path $rootDir 'audit_report.md'), $sb.ToString(), $enc)
Write-Host ('report -> ' + (Join-Path $rootDir 'audit_report.md'))

if ($fail -gt 0) { exit 1 }
if ($WarnAsError -and $warn -gt 0) { exit 1 }
exit 0
