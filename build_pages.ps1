#requires -Version 5.1
<#
  build_pages.ps1 -- the ONLY thing allowed to write HTML / gen-*.md
  -----------------------------------------------------------------
  One source -> many views:
      docs/NN-*.md  (concept, hand-written)  ->  GDD.html (inline)
      data/*.json   (source of truth)        ->  *.html + docs/gen-*.md
                                             ->  artifact/GDD.artifact.html (one-page, self-contained)

  Never hand-edit the outputs; they are overwritten on every run.

  ASCII-only source on purpose: Windows PowerShell 5.1 mis-decodes UTF-8 .ps1 files,
  so every user-facing Vietnamese string lives in data/ui.json or the docs.
#>
param([switch]$Quiet)

$ErrorActionPreference = 'Stop'
$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$docsDir = Join-Path $rootDir 'docs'
$artDir  = Join-Path $rootDir 'artifact'
if (-not (Test-Path $artDir)) { New-Item -ItemType Directory -Path $artDir | Out-Null }

function Load-Json([string]$rel) {
    return ([System.IO.File]::ReadAllText((Join-Path $rootDir $rel), [System.Text.Encoding]::UTF8) | ConvertFrom-Json)
}
function Save-Text([string]$path, [string]$text) {
    $enc = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($path, $text, $enc)
}
function Esc([string]$s) {
    if ($null -eq $s) { return '' }
    return ($s -replace '&', '&amp;' -replace '<', '&lt;' -replace '>', '&gt;' -replace '"', '&quot;')
}
function Num([object]$v) {
    if ($null -eq $v -or $v -eq '') { return '-' }
    return [string]$v
}
function JoinList([object]$v, [string]$sep = ', ') {
    if ($null -eq $v) { return '-' }
    return (@($v) -join $sep)
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
$ui    = Load-Json 'data\ui.json'
$col   = $ui.cols
$lab   = $ui.labels
$unit  = $ui.units
# every non-ASCII glyph comes from data/ui.json, never from this file
$degSym     = [string]$unit.deg
$dotSym     = [string]$unit.dot
$perDay     = [string]$unit.perDay
$perCollect = [string]$unit.perCollect
$emDash     = [string][char]0x2014

# =====================================================================  markdown
function Convert-Md([string]$text) {
    $lines = $text -split "`r?`n"
    $out = New-Object System.Text.StringBuilder
    $inCode = $false; $inTable = $false; $listType = $null
    $paraBuf = @()

    function Inline([string]$s) {
        $s = Esc $s
        $s = [regex]::Replace($s, '`([^`]+)`', '<code>$1</code>')
        $s = [regex]::Replace($s, '\*\*([^*]+)\*\*', '<strong>$1</strong>')
        $s = [regex]::Replace($s, '(?<![\w*])\*([^*\n]+)\*(?![\w*])', '<em>$1</em>')
        $s = [regex]::Replace($s, '\[([^\]]+)\]\(([^)\s]+)\)', '<a href="$2">$1</a>')
        return $s
    }
    function FlushPara() {
        if ($script:paraBuf.Count -gt 0) {
            [void]$script:out.AppendLine('<p>' + (Inline ($script:paraBuf -join ' ')) + '</p>')
            $script:paraBuf = @()
        }
    }
    function CloseList() {
        if ($script:listType) { [void]$script:out.AppendLine("</$($script:listType)>"); $script:listType = $null }
    }
    $script:out = $out; $script:paraBuf = $paraBuf; $script:listType = $listType

    for ($i = 0; $i -lt $lines.Count; $i++) {
        $ln = $lines[$i]

        if ($ln -match '^\s*```') {
            FlushPara; CloseList
            if ($inCode) { [void]$out.AppendLine('</code></pre>'); $inCode = $false }
            else { [void]$out.AppendLine('<pre class="ascii"><code>'); $inCode = $true }
            continue
        }
        if ($inCode) { [void]$out.AppendLine((Esc $ln)); continue }

        # table
        if ($ln -match '^\s*\|' -and $ln -match '\|\s*$') {
            $isSep = ($ln -replace '[\s|:-]', '') -eq ''
            $cells = @(($ln.Trim().Trim('|') -split '(?<!\\)\|') | ForEach-Object { $_.Trim() })
            if (-not $inTable) {
                FlushPara; CloseList
                [void]$out.AppendLine('<div class="tw"><table>')
                [void]$out.Append('<thead><tr>')
                foreach ($c in $cells) { [void]$out.Append('<th>' + (Inline $c) + '</th>') }
                [void]$out.AppendLine('</tr></thead><tbody>')
                $inTable = $true
                continue
            }
            if ($isSep) { continue }
            [void]$out.Append('<tr>')
            foreach ($c in $cells) { [void]$out.Append('<td>' + (Inline $c) + '</td>') }
            [void]$out.AppendLine('</tr>')
            continue
        }
        elseif ($inTable) { [void]$out.AppendLine('</tbody></table></div>'); $inTable = $false }

        if ($ln -match '^\s*$') { FlushPara; CloseList; continue }

        if ($ln -match '^######\s+(.*)$') { FlushPara; CloseList; [void]$out.AppendLine('<h6>' + (Inline $Matches[1]) + '</h6>'); continue }
        if ($ln -match '^#####\s+(.*)$')  { FlushPara; CloseList; [void]$out.AppendLine('<h5>' + (Inline $Matches[1]) + '</h5>'); continue }
        if ($ln -match '^####\s+(.*)$')   { FlushPara; CloseList; [void]$out.AppendLine('<h5>' + (Inline $Matches[1]) + '</h5>'); continue }
        if ($ln -match '^###\s+(.*)$')    { FlushPara; CloseList; [void]$out.AppendLine('<h4>' + (Inline $Matches[1]) + '</h4>'); continue }
        if ($ln -match '^##\s+(.*)$')     { FlushPara; CloseList; [void]$out.AppendLine('<h3>' + (Inline $Matches[1]) + '</h3>'); continue }
        if ($ln -match '^#\s+(.*)$')      { FlushPara; CloseList; continue }   # H1 handled by caller

        if ($ln -match '^\s*(---+|\*\*\*+)\s*$') { FlushPara; CloseList; [void]$out.AppendLine('<hr />'); continue }

        if ($ln -match '^\s*>\s?(.*)$') {
            FlushPara; CloseList
            $q = @($Matches[1])
            while (($i + 1) -lt $lines.Count -and $lines[$i + 1] -match '^\s*>\s?(.*)$') { $i++; $q += $Matches[1] }
            [void]$out.AppendLine('<blockquote>' + (Inline ($q -join ' ')) + '</blockquote>')
            continue
        }

        if ($ln -match '^\s*[-*]\s+(.*)$') {
            FlushPara
            if ($script:listType -ne 'ul') { CloseList; [void]$out.AppendLine('<ul>'); $script:listType = 'ul' }
            [void]$out.AppendLine('<li>' + (Inline $Matches[1]) + '</li>')
            continue
        }
        if ($ln -match '^\s*\d+\.\s+(.*)$') {
            FlushPara
            if ($script:listType -ne 'ol') { CloseList; [void]$out.AppendLine('<ol>'); $script:listType = 'ol' }
            [void]$out.AppendLine('<li>' + (Inline $Matches[1]) + '</li>')
            continue
        }
        if ($script:listType -and $ln -match '^\s{2,}\S') {
            # continuation of a list item
            [void]$out.AppendLine('<span class="cont">' + (Inline $ln.Trim()) + '</span>')
            continue
        }

        $script:paraBuf += $ln.Trim()
    }
    FlushPara; CloseList
    if ($inCode)  { [void]$out.AppendLine('</code></pre>') }
    if ($inTable) { [void]$out.AppendLine('</tbody></table></div>') }
    return $out.ToString()
}

# =====================================================================  tables
function New-Table([string]$id, [string]$caption, [string[]]$headers, $rows) {
    return [pscustomobject]@{ Id = $id; Caption = $caption; Headers = $headers; Rows = @($rows) }
}
function Render-TableHtml($t) {
    $sb = New-Object System.Text.StringBuilder
    [void]$sb.AppendLine('<div class="tw" data-table="' + (Esc $t.Id) + '"><table>')
    [void]$sb.Append('<thead><tr>')
    foreach ($h in $t.Headers) { [void]$sb.Append('<th>' + (Esc $h) + '</th>') }
    [void]$sb.AppendLine('</tr></thead><tbody>')
    foreach ($r in $t.Rows) {
        $hay = (($r -join ' ') -replace '"', '')
        [void]$sb.Append('<tr data-hay="' + (Esc $hay.ToLower()) + '">')
        foreach ($c in $r) { [void]$sb.Append('<td>' + (Esc ([string]$c)) + '</td>') }
        [void]$sb.AppendLine('</tr>')
    }
    [void]$sb.AppendLine('</tbody></table></div>')
    return $sb.ToString()
}
function Render-TableMd($t) {
    $sb = New-Object System.Text.StringBuilder
    [void]$sb.AppendLine('### ' + $t.Caption)
    [void]$sb.AppendLine('')
    [void]$sb.AppendLine('| ' + (($t.Headers) -join ' | ') + ' |')
    [void]$sb.AppendLine('|' + (($t.Headers | ForEach-Object { '---' }) -join '|') + '|')
    foreach ($r in $t.Rows) {
        $cells = @($r | ForEach-Object { ([string]$_) -replace '\|', '/' -replace '\r?\n', ' ' })
        [void]$sb.AppendLine('| ' + ($cells -join ' | ') + ' |')
    }
    [void]$sb.AppendLine('')
    return $sb.ToString()
}

# ---- derived numbers (same formulas as docs/16) ----
$dpsBase = [double]$gdWpn.balance.dpsTargetBase
$dpsGrow = [double]$gdWpn.balance.dpsTargetGrowth
$sRegen  = [double]$gdWpn.balance.staminaRegen
function Get-Dps($w) {
    if ($w.class -eq 'ranged') {
        $cycle = [double]$w.mag / ([double]$w.rpm / 60.0) + [double]$w.reloadTime
        return [Math]::Round(([double]$w.dmg * [double]$w.pellets * [double]$w.mag) / $cycle)
    }
    $tf = 1.0 + 0.35 * ([double]$w.targets - 1.0)
    $iv = [Math]::Max([double]$w.swingTime, [double]$w.staminaCost / $sRegen)
    return [Math]::Round([double]$w.dmg * $tf / $iv)
}

# ---- table models ----
$tblRanged = New-Table 'ranged' $ui.sections.weapons `
    @($col.name, $col.id, $col.archetype, $col.tier, $col.unlock, $col.dmg, $col.rpm, $col.pellets, $col.mag, $col.reserve, $col.reload, $col.range, $col.pierce, $col.kb, $col.crit, $col.dps, $col.tags, $col.desc) `
    (@($gdWpn.weapons | Where-Object { $_.class -eq 'ranged' } | Sort-Object tier, archetype | ForEach-Object {
        , @($_.name, $_.id, $_.archetype, "T$($_.tier)", $_.unlock, (Num $_.dmg), (Num $_.rpm), (Num $_.pellets), (Num $_.mag), (Num $_.reserveMax), "$($_.reloadTime)s", "$($_.rangeM)m", (Num $_.pierce), "$($_.knockback)m", "x$($_.critMult)", (Get-Dps $_), (JoinList $_.tags), $_.desc)
    }))

$tblMelee = New-Table 'melee' $ui.sections.weapons `
    @($col.name, $col.id, $col.archetype, $col.tier, $col.unlock, $col.dmg, $col.stamina, $col.swing, $col.arc, $col.reach, $col.targets, $col.launch, $col.kb, $col.crit, $col.dps, $col.tags, $col.desc) `
    (@($gdWpn.weapons | Where-Object { $_.class -eq 'melee' } | Sort-Object tier, archetype | ForEach-Object {
        , @($_.name, $_.id, $_.archetype, "T$($_.tier)", $_.unlock, (Num $_.dmg), (Num $_.staminaCost), "$($_.swingTime)s", "$($_.arcDeg)$degSym", "$($_.reachM)m", (Num $_.targets), "$($_.corpseLaunch)m", "$($_.knockback)m", "x$($_.critMult)", (Get-Dps $_), (JoinList $_.tags), $_.desc)
    }))

$tblEnemies = New-Table 'enemies' $ui.sections.enemies `
    @($col.name, $col.id, $col.role, $col.introDepth, $col.hp, $col.dmg, $col.speed, $col.kbResist, $col.tp, $col.gold, $col.mechanic, $col.counters) `
    (@($gdEne.enemies | Sort-Object introDepth, role | ForEach-Object {
        , @($_.name, $_.id, $_.role, "D$($_.introDepth)", (Num $_.hp), (Num $_.dmg), (Num $_.speed), (Num $_.kbResist), (Num $_.tpCost), (Num $_.goldDrop), $_.mechanic, $_.counters)
    }))

$tblBosses = New-Table 'bosses' $ui.sections.enemies `
    @($col.name, $col.depth, $col.hp, $col.ttk, $col.phases, $col.meleeWindow, $col.drops, $col.teaches) `
    (@($gdEne.bosses | Sort-Object depth | ForEach-Object {
        , @($_.name, "D$($_.depth)", (Num $_.hp), "$($_.ttkTargetSec)s", (JoinList $_.phases '  //  '), $_.meleeWindow, (JoinList $_.drops), $_.teaches)
    }))

$tblAffix = New-Table 'affixes' $ui.sections.enemies `
    @($col.name, $col.id, $col.effect, $col.signal, $col.fromGreed) `
    (@($gdEne.affixes | ForEach-Object { , @($_.name, $_.id, $_.effect, $_.signal, "G$($_.minGreed)") }))

$tblDepths = New-Table 'depths' $ui.sections.content `
    @($col.depth, $col.name, $col.biome, $col.introEnemies, $col.boss, $col.unlocks, $col.expectedGold, $col.teaches) `
    (@($gdDep.depths | ForEach-Object {
        $dRow = $_
        $bossId   = $dRow.boss
        $bossName = @($gdEne.bosses | Where-Object { $_.id -eq $bossId } | ForEach-Object { $_.name })
        $introNm  = @($dRow.introEnemies   | ForEach-Object { $eid = $_; @($gdEne.enemies | Where-Object { $_.id -eq $eid } | ForEach-Object { $_.name }) })
        $unlockNm = @($dRow.loadoutUnlocks | ForEach-Object { $wid = $_; @($gdWpn.weapons | Where-Object { $_.id -eq $wid } | ForEach-Object { $_.name }) })
        , @("D$($dRow.depth)", $dRow.name, $dRow.biome, (JoinList $introNm), (JoinList $bossName), (JoinList $unlockNm), (Num $dRow.expectedGoldG0), $dRow.teaches)
    }))

$tblChallenges = New-Table 'challenges' $ui.sections.content `
    @($col.depth, $col.name, $col.reward) `
    (@($gdDep.depths | ForEach-Object {
        $dd = $_.depth
        foreach ($ch in $_.challenges) { , @("D$dd", $ch.name, $ch.reward) }
    }))

$tblRooms = New-Table 'rooms' $ui.sections.content `
    @($col.name, $col.id, $col.type, $col.freq, 'TP x', $col.desc, $col.reward) `
    (@($gdRom.roomTypes | ForEach-Object { , @($_.name, $_.id, $_.type, "$([Math]::Round([double]$_.freq*100))%", (Num $_.tpMult), $_.desc, $_.reward) }))

$tblEvents = New-Table 'events' $ui.sections.content `
    @($col.name, $col.id, $col.effect, $col.choice, $col.fromDocs) `
    (@($gdRom.events | ForEach-Object { , @($_.name, $_.id, $_.effect, $_.choice, $_.fromDocs) }))

$tblWaves = New-Table 'waves' $ui.sections.content `
    @($col.name, $col.id, $col.intent, $col.teaches, 'TP x', $col.minDepth, $col.pattern, $col.composition) `
    (@($gdWav.waveTemplates | Sort-Object minDepth | ForEach-Object {
        $comp = (@($_.composition | ForEach-Object { $cid = $_.enemy; $nm = (@($gdEne.enemies | Where-Object { $_.id -eq $cid }).name); "$nm $([Math]::Round([double]$_.weight*100))%" }) -join ', ')
        , @($_.name, $_.id, $_.intent, $_.teaches, (Num $_.tpMult), "D$($_.minDepth)+", $_.spawnPattern, $comp)
    }))

$tblCards = New-Table 'cards' $ui.sections.meta `
    @($col.name, $col.id, $col.rarity, $col.tags, $col.effect, $col.powerDelta, $col.drawback, $col.combo) `
    (@($gdUpg.cards | ForEach-Object {
        $dw = if ($_.drawback) { $_.drawback } else { $lab.noDrawback }
        $cu = if ($_.comboUnlock) { $_.comboUnlock } else { $lab.noDrawback }
        , @($_.name, $_.id, $_.rarity, (JoinList $_.tags), $_.effect, "+$([Math]::Round([double]$_.powerDelta*100))%", $dw, $cu)
    }))

$tblRelics = New-Table 'relics' $ui.sections.meta `
    @($col.name, $col.id, $col.effect, $col.drawback, $col.source) `
    (@($gdUpg.relics | ForEach-Object {
        $dw = if ($_.drawback) { $_.drawback } else { $lab.noDrawback }
        , @($_.name, $_.id, $_.effect, $dw, $_.source)
    }))

$tblTalents = New-Table 'talents' $ui.sections.meta `
    @($col.branch, $col.name, $col.id, $col.rank, $col.cost, $col.currency, $col.powerDelta, $col.effect) `
    (@($gdTal.talents | ForEach-Object {
        $tn = $_.name; $tid = $_.id
        $bn = (@($gdTal.branches | Where-Object { $_.id -eq $tid.Split('_')[1] }).name)
        foreach ($rk in $_.ranks) {
            , @($bn, $tn, $tid, $rk.rank, (Num $rk.cost), $rk.currency, "+$([Math]::Round([double]$rk.powerDelta*100))%", $rk.effect)
        }
    }))

$tblBastion = New-Table 'bastion' $ui.sections.meta `
    @($col.name, $col.id, $col.effect, $col.idle, $col.maxLevel, 'Lv1', 'Lv10', $col.unlock) `
    (@($gdBst.buildings | ForEach-Object {
        $idl = if ($_.idle) { $_.idle } else { $lab.noDrawback }
        , @($_.name, $_.id, $_.effect, $idl, (Num $_.maxLevel), (Num $_.costLv1), (Num $_.costLv10), $_.unlockAt)
    }))

$tblCurrency = New-Table 'currencies' $ui.sections.economy `
    @($col.name, $col.id, $col.type, $col.sources, $col.sinks) `
    (@($gdEco.currencies | ForEach-Object { , @($_.name, $_.id, $_.type, (JoinList $_.sources $dotSym), (JoinList $_.sinks $dotSym)) }))

$tblShop = New-Table 'shop' $ui.sections.economy `
    @($col.name, $col.id, $col.price, $col.currency, $col.scope) `
    (@($gdEco.shop | ForEach-Object { , @($_.name, $_.id, (Num $_.price), $_.currency, $_.scope) }))

$tblGoldCurve = New-Table 'goldcurve' $ui.sections.economy `
    @($col.milestone, $col.greedLevel, $col.expectedGold) `
    (@($gdEco.goldCurve | ForEach-Object { , @($_.milestone, "G$($_.greed)", ('{0:N0}' -f [double]$_.expectedGold)) }))

$tblAds = New-Table 'ads' $ui.sections.economy `
    @($col.id, $col.placement, $col.cap) `
    (@($gdEco.monetization.rewardedAds | ForEach-Object {
        $cap = if ($_.capPerRun) { "$($_.capPerRun)/run" } elseif ($_.capPerDay) { "$($_.capPerDay)$perDay" } else { "$($_.capPerCollect)$perCollect" }
        , @($_.id, $_.placement, $cap)
    }))

$tblIap = New-Table 'iap' $ui.sections.economy @($col.id, $col.name, 'USD') `
    (@($gdEco.monetization.iap | ForEach-Object { , @($_.id, $_.name, "`$$($_.usd)") }))

$tblHitstop = New-Table 'hitstop' $ui.sections.feel @($col.event, $col.frames, $col.timescale) `
    (@($gdFel.hitstop | ForEach-Object { $d = if ($_.durationSec) { " ($($_.durationSec)s)" } else { '' }; , @($_.event, (Num $_.frames), "$($_.timescale)$d") }))

$tblShake = New-Table 'shake' $ui.sections.feel @($col.event, $col.amplitude, $col.duration, $col.axis) `
    (@($gdFel.shake | ForEach-Object { , @($_.event, (Num $_.amplitudePx), "$($_.durationSec)s", $_.axis) }))

$tblDeath = New-Table 'death' $ui.sections.feel @($col.killType, $col.corpse, $col.particles, $col.coins) `
    (@($gdFel.death | ForEach-Object { , @($_.killType, $_.corpse, (Num $_.particles), (Num $_.goldCoins)) }))

$tblAudio = New-Table 'audio' $ui.sections.feel @($col.priority, $col.sound, $col.note) `
    (@($gdFel.audio | ForEach-Object { , @($_.priority, $_.sound, $_.note) }))

$tblHaptic = New-Table 'haptics' $ui.sections.feel @($col.event, $col.pattern2) `
    (@($gdFel.haptics | ForEach-Object { , @($_.event, $_.pattern) }))

$tblGesture = New-Table 'gestures' $ui.sections.feel @($col.gesture, $col.id, $col.condition, $col.action, $col.weapon) `
    (@($gdCtr.gestures | ForEach-Object { , @($_.name, $_.id, $_.condition, $_.action, $_.weapon) }))

$tblCtrlParam = New-Table 'ctrlparams' $ui.sections.feel @($col.key, $col.value, $col.unit, $col.note) `
    (@($gdCtr.params | ForEach-Object { , @($_.key, (Num $_.value), $_.unit, $_.note) }))

# ---- escalation model (KHONG co dial nguoi choi; ham tu dong dan va khoe dan theo phong) ----
# So quai / wave lay tu composition THUC cua wave flood dung trong phong chien thuong.
$tideWave = @($gdWav.waveTemplates |
    Where-Object { $_.spawnPattern -eq 'flood' -and [double]$_.tpMult -lt 2.0 } |
    Sort-Object -Property tpMult -Descending | Select-Object -First 1)
$tideFactor = 0.0; $tideId = '-'
if ($tideWave.Count -eq 1) {
    $tideId = $tideWave[0].id
    foreach ($itComp in $tideWave[0].composition) {
        $eRef = @($gdEne.enemies | Where-Object { $_.id -eq $itComp.enemy })
        if ($eRef.Count -eq 1 -and [double]$eRef[0].tpCost -gt 0) {
            $tideFactor += [double]$itComp.weight / [double]$eRef[0].tpCost
        }
    }
    $tideFactor *= [double]$tideWave[0].tpMult
}
function Get-EnemyCount([int]$roomIdx) { return [Math]::Round((14.0 + 4.2 * $roomIdx) * $tideFactor) }
function Get-HpMult([int]$roomIdx)     { return [Math]::Pow(1.068, $roomIdx - 1) }
function Get-RoomGold([int]$roomIdx) {
    $dNum = [Math]::Max(1, [Math]::Ceiling($roomIdx / 10.0))
    $pool = @($gdEne.enemies | Where-Object {
        [int]$_.introDepth -le $dNum -and (@($_.tags) -notcontains 'invulnerable') -and $_.role -ne 'elite'
    })
    $avgTp   = ($pool | Measure-Object -Property tpCost -Average).Average
    $avgGold = ($pool | Measure-Object -Property goldDrop -Average).Average
    if ($avgTp -le 0) { return 0 }
    return [Math]::Round(((14.0 + 4.2 * $roomIdx) / $avgTp) * $avgGold * [Math]::Pow(1.15, $dNum - 1))
}

$escalStops = @(1, 5, 10, 15, 20, 25, 30, 40, 50, 60, 70)
$escalRows = @()
foreach ($rIdx in $escalStops) {
    $dLabel = 'D' + [Math]::Max(1, [Math]::Ceiling($rIdx / 10.0))
    $escalRows += , @("R$rIdx ($dLabel)", (Get-EnemyCount $rIdx), ('x{0:N1}' -f (Get-HpMult $rIdx)), ('{0:N0}' -f (Get-RoomGold $rIdx)))
}
$tblEscal = New-Table 'escalation' $ui.sections.escalation `
    @($col.room, $col.enemyCount, $col.hpMult, $col.goldRoom) $escalRows

function Render-EscalationLadder() {
    $maxCount = Get-EnemyCount 70
    $maxHp    = Get-HpMult 70
    $sb = New-Object System.Text.StringBuilder
    [void]$sb.AppendLine('<div class="ladder">')
    foreach ($rIdx in $escalStops) {
        $cnt = Get-EnemyCount $rIdx
        $hp  = Get-HpMult $rIdx
        $cPct = [Math]::Round(100.0 * $cnt / $maxCount, 2)
        $hPct = [Math]::Round(100.0 * $hp / $maxHp, 2)
        [void]$sb.AppendLine('<div class="rung"><span class="g">R' + $rIdx + '</span><span class="bars">' +
            '<i class="bar gold" style="width:' + $cPct + '%"></i>' +
            '<i class="bar bell" style="width:' + $hPct + '%"></i>' +
            '</span><span class="mult">' + $cnt + ' / x' + ('{0:N1}' -f $hp) + '</span></div>')
    }
    [void]$sb.AppendLine('</div>')
    [void]$sb.AppendLine('<p class="legend"><b class="sw gold"></b> ' + (Esc $unit.legendGold) + ' &nbsp; <b class="sw bell"></b> ' + (Esc $unit.legendHp) + ' &nbsp; <span>(' + (Esc $unit.sampleWave) + ': ' + (Esc $tideId) + ')</span></p>')
    return $sb.ToString()
}

# ---- Nga Ba Ham ----
$tblForkSigns = New-Table 'fork-signs' $gdRom.fork.name @($col.sign, $col.meaning) `
    (@($gdRom.fork.signTags | ForEach-Object { , @($_.tag, $_.meaning) }))
$tblLayout = New-Table 'layout' $gdRom.fork.name `
    @($col.room, $col.type, $col.forkPool, $col.note) `
    (@($gdRom.depthLayout | ForEach-Object {
        $fp = if ($_.forkPool) { JoinList $_.forkPool ' | ' } else { $lab.noDrawback }
        , @($_.room, $_.type, $fp, $_.note)
    }))

# =====================================================================  css
$css = @'
@import url("https://fonts.googleapis.com/css2?family=Anton&family=Oswald:wght@400;500;600&family=Be+Vietnam+Pro:ital,wght@0,300;0,400;0,600;0,700;1,400&display=swap");
:root{
  --ground:#0B0D10; --surface:#141821; --surface2:#1B212C; --line:#262E3B;
  --ink:#E7E9ED; --muted:#8B93A2;
  --gold:#FFC53D; --gold-deep:#FF8A00; --bell:#B14CFF; --danger:#FF4438; --ok:#3ED598;
  --shadow:0 1px 0 rgba(255,255,255,.03), 0 12px 32px rgba(0,0,0,.45);
  --rail:250px;
  --f-disp:"Anton",Impact,"Arial Narrow Bold",sans-serif;
  --f-lab:"Oswald","Arial Narrow",sans-serif;
  --f-body:"Be Vietnam Pro",-apple-system,Segoe UI,Roboto,sans-serif;
  --f-mono:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
}
:root:not([data-theme="light"]){ color-scheme:dark; }
@media (prefers-color-scheme: light){
  :root:not([data-theme="dark"]){
    --ground:#ECEEF2; --surface:#FFFFFF; --surface2:#F5F6F9; --line:#D8DCE4;
    --ink:#12161C; --muted:#5A6373;
    --gold:#9A6200; --gold-deep:#C07800; --bell:#7A21C7; --danger:#C42B20; --ok:#0E7C55;
    --shadow:0 1px 0 rgba(255,255,255,.6), 0 10px 26px rgba(16,22,32,.10);
    color-scheme:light;
  }
}
:root[data-theme="light"]{
  --ground:#ECEEF2; --surface:#FFFFFF; --surface2:#F5F6F9; --line:#D8DCE4;
  --ink:#12161C; --muted:#5A6373;
  --gold:#9A6200; --gold-deep:#C07800; --bell:#7A21C7; --danger:#C42B20; --ok:#0E7C55;
  --shadow:0 1px 0 rgba(255,255,255,.6), 0 10px 26px rgba(16,22,32,.10);
  color-scheme:light;
}
*{box-sizing:border-box}
body{margin:0;background:var(--ground);color:var(--ink);font-family:var(--f-body);font-weight:400;line-height:1.65;-webkit-font-smoothing:antialiased}
a{color:var(--gold);text-decoration:none;border-bottom:1px solid color-mix(in srgb, var(--gold) 35%, transparent)}
a:hover{color:var(--gold-deep)}
a:focus-visible,button:focus-visible,input:focus-visible{outline:2px solid var(--bell);outline-offset:2px}
.wrap{display:grid;grid-template-columns:var(--rail) minmax(0,1fr);gap:0;min-height:100vh}
nav.rail{position:sticky;top:0;align-self:start;height:100vh;overflow-y:auto;padding:26px 18px 40px;border-right:1px solid var(--line);background:var(--surface)}
nav.rail .brand{font-family:var(--f-disp);font-size:23px;letter-spacing:.5px;line-height:1.05;color:var(--ink);margin:0 0 2px}
nav.rail .brand span{color:var(--gold)}
nav.rail .tag{font-family:var(--f-lab);font-size:11.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin:0 0 22px}
nav.rail h4{font-family:var(--f-lab);font-weight:500;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--muted);margin:20px 0 8px;padding-bottom:6px;border-bottom:1px solid var(--line)}
nav.rail ol{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:1px}
nav.rail a{display:flex;gap:9px;padding:5px 8px;border-radius:5px;border:0;color:var(--ink);font-size:13.5px;line-height:1.35}
nav.rail a:hover{background:var(--surface2);color:var(--gold)}
nav.rail a .n{font-family:var(--f-mono);font-size:11px;color:var(--muted);padding-top:2px;min-width:20px}
main{min-width:0;padding:0 clamp(18px,4vw,60px) 90px}
header.hero{padding:70px 0 34px;border-bottom:1px solid var(--line);margin-bottom:14px}
header.hero .eyebrow{font-family:var(--f-lab);font-size:11.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--bell);margin:0 0 14px}
header.hero h1{font-family:var(--f-disp);font-size:clamp(46px,8.4vw,104px);line-height:.92;letter-spacing:-.5px;margin:0;text-wrap:balance}
header.hero h1 em{font-style:normal;color:var(--gold)}
header.hero .sub{max-width:62ch;color:var(--muted);font-size:16.5px;margin:16px 0 0}
header.hero .quote{font-family:var(--f-lab);font-weight:400;font-size:15px;letter-spacing:.06em;color:var(--gold);margin:20px 0 0;padding-left:14px;border-left:3px solid var(--gold)}
.chips{display:flex;flex-wrap:wrap;gap:8px;margin:26px 0 0;padding:0;list-style:none}
.chips li{background:var(--surface);border:1px solid var(--line);border-radius:3px;padding:7px 11px;display:flex;gap:7px;align-items:baseline}
.chips b{font-family:var(--f-disp);font-size:19px;color:var(--gold);font-variant-numeric:tabular-nums}
.chips span{font-family:var(--f-lab);font-size:11px;letter-spacing:.11em;text-transform:uppercase;color:var(--muted)}
section.doc{padding:44px 0;border-bottom:1px solid var(--line);scroll-margin-top:14px}
section.doc>h2{font-family:var(--f-disp);font-size:clamp(27px,3.4vw,40px);line-height:1.06;margin:0 0 4px;text-wrap:balance}
section.doc>.docnum{font-family:var(--f-mono);font-size:12px;color:var(--bell);letter-spacing:.1em;margin:0 0 6px}
section.doc>h2+.rule{height:2px;background:linear-gradient(90deg,var(--gold),transparent);margin:0 0 22px;max-width:220px}
.body{max-width:74ch}
.body.wide{max-width:none}
h3{font-family:var(--f-lab);font-weight:600;font-size:19px;letter-spacing:.01em;margin:34px 0 10px;color:var(--ink)}
h4{font-family:var(--f-lab);font-weight:500;font-size:15.5px;letter-spacing:.05em;text-transform:uppercase;color:var(--muted);margin:26px 0 8px}
h5{font-family:var(--f-lab);font-weight:600;font-size:14px;margin:20px 0 6px}
p{margin:0 0 13px}
ul,ol{margin:0 0 13px;padding-left:22px}
li{margin:0 0 5px}
li>.cont{display:block;color:var(--muted)}
strong{font-weight:700}
code{font-family:var(--f-mono);font-size:.87em;background:var(--surface2);border:1px solid var(--line);border-radius:3px;padding:1px 5px}
pre.ascii{font-family:var(--f-mono);font-size:12.2px;line-height:1.5;background:var(--surface);border:1px solid var(--line);border-left:3px solid var(--bell);border-radius:4px;padding:16px 18px;overflow-x:auto;margin:0 0 18px}
pre.ascii code{background:none;border:0;padding:0;font-size:inherit}
blockquote{margin:0 0 18px;padding:14px 18px;background:var(--surface);border-left:3px solid var(--gold);border-radius:0 4px 4px 0;color:var(--ink)}
blockquote p:last-child{margin:0}
hr{border:0;border-top:1px solid var(--line);margin:28px 0}
.tw{overflow-x:auto;margin:0 0 20px;border:1px solid var(--line);border-radius:5px;background:var(--surface);box-shadow:var(--shadow)}
table{border-collapse:collapse;width:100%;font-size:13.4px}
thead th{position:sticky;top:0;background:var(--surface2);font-family:var(--f-lab);font-weight:500;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);text-align:left;padding:9px 11px;border-bottom:1px solid var(--line);white-space:nowrap}
tbody td{padding:8px 11px;border-bottom:1px solid var(--line);vertical-align:top;font-variant-numeric:tabular-nums}
tbody tr:last-child td{border-bottom:0}
tbody tr:hover{background:var(--surface2)}
tbody td:first-child{font-weight:600;white-space:nowrap}
.filter{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:0 0 14px}
.filter input{flex:1 1 240px;min-width:180px;background:var(--surface);color:var(--ink);border:1px solid var(--line);border-radius:4px;padding:9px 12px;font-family:var(--f-body);font-size:14px}
.filter .count{font-family:var(--f-lab);font-size:11.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
.ladder{display:flex;flex-direction:column;gap:3px;margin:0 0 12px;padding:18px;background:var(--surface);border:1px solid var(--line);border-radius:5px}
.rung{display:grid;grid-template-columns:38px 1fr 122px;gap:10px;align-items:center}
.rung .g{font-family:var(--f-mono);font-size:11.5px;color:var(--muted)}
.rung .bars{display:flex;flex-direction:column;gap:2px;min-width:0}
.rung .bar{display:block;height:7px;border-radius:1px;min-width:2px}
.bar.gold{background:linear-gradient(90deg,var(--gold),var(--gold-deep))}
.bar.bell{background:var(--bell);opacity:.75}
.rung .mult{font-family:var(--f-mono);font-size:11.5px;color:var(--ink);text-align:right;font-variant-numeric:tabular-nums}
.legend{font-size:12.5px;color:var(--muted)}
.legend .sw{display:inline-block;width:22px;height:7px;border-radius:1px;vertical-align:middle}
.legend .sw.gold{background:var(--gold)} .legend .sw.bell{background:var(--bell)}
.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(215px,1fr));gap:12px;margin:8px 0 0;padding:0;list-style:none}
.cards li{background:var(--surface);border:1px solid var(--line);border-radius:5px;padding:15px 16px}
.cards a{border:0;font-family:var(--f-lab);font-weight:600;font-size:15px;letter-spacing:.02em}
.cards p{margin:5px 0 0;font-size:12.8px;color:var(--muted)}
.stat{display:flex;gap:26px;flex-wrap:wrap;margin:0 0 20px;padding:16px 18px;background:var(--surface);border:1px solid var(--line);border-radius:5px}
.stat div{display:flex;flex-direction:column}
.stat b{font-family:var(--f-disp);font-size:26px;line-height:1;font-variant-numeric:tabular-nums}
.stat b.ok{color:var(--ok)} .stat b.warn{color:var(--gold)} .stat b.bad{color:var(--danger)}
.stat span{font-family:var(--f-lab);font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin-top:4px}
footer{padding:34px 0 0;color:var(--muted);font-size:12.5px;border-top:1px solid var(--line);margin-top:26px}
.top{position:fixed;right:16px;bottom:16px;background:var(--surface);border:1px solid var(--line);border-radius:4px;padding:8px 12px;font-family:var(--f-lab);font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
@media (max-width:900px){
  .wrap{grid-template-columns:1fr}
  nav.rail{position:static;height:auto;border-right:0;border-bottom:1px solid var(--line)}
  main{padding:0 18px 70px}
  header.hero{padding:34px 0 24px}
  .rung{grid-template-columns:32px 1fr 96px}
}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
'@

$filterJs = @'
<script>
(function(){
  var inp=document.getElementById('q');if(!inp)return;
  var out=document.getElementById('qc');
  function run(){
    var v=inp.value.trim().toLowerCase(),shown=0,total=0;
    document.querySelectorAll('tbody tr[data-hay]').forEach(function(tr){
      total++;var hit=!v||tr.getAttribute('data-hay').indexOf(v)>-1;
      tr.style.display=hit?'':'none';if(hit)shown++;
    });
    if(out)out.textContent=shown+' / '+total;
  }
  inp.addEventListener('input',run);run();
})();
</script>
'@

# =====================================================================  pages
$docFiles = @(Get-ChildItem (Join-Path $docsDir '*.md') | Where-Object { $_.Name -match '^\d\d-' } | Sort-Object Name)
$conceptDocs = @()
foreach ($f in $docFiles) {
    $raw = [System.IO.File]::ReadAllText($f.FullName, [System.Text.Encoding]::UTF8)
    $h1 = 'Doc'
    if ($raw -match '(?m)^#\s+(.*)$') { $h1 = $Matches[1] }
    $num = ($f.Name -split '-')[0]
    $title = ($h1 -replace ('^\d\d\s*[-' + $emDash + ']\s*'), '')
    $conceptDocs += [pscustomobject]@{
        Num = $num; Slug = ('doc-' + $num); Title = $title; File = $f.Name
        Html = (Convert-Md $raw)
    }
}

$dataPages = @(
    [pscustomobject]@{ File = 'weapons.html'; Slug = 'weapons'; Title = $ui.sections.weapons; Tables = @($tblRanged, $tblMelee); Note = 'data/weapons.json' }
    [pscustomobject]@{ File = 'enemies.html'; Slug = 'enemies'; Title = $ui.sections.enemies; Tables = @($tblEnemies, $tblBosses, $tblAffix); Note = 'data/enemies.json' }
    [pscustomobject]@{ File = 'content.html'; Slug = 'content'; Title = $ui.sections.content; Tables = @($tblDepths, $tblLayout, $tblForkSigns, $tblRooms, $tblEvents, $tblWaves, $tblChallenges); Note = 'data/depths.json + rooms.json + waves.json' }
    [pscustomobject]@{ File = 'meta.html';    Slug = 'meta';    Title = $ui.sections.meta;    Tables = @($tblCards, $tblRelics, $tblTalents, $tblBastion); Note = 'data/upgrades.json + talents.json + bastion.json' }
    [pscustomobject]@{ File = 'economy.html'; Slug = 'economy'; Title = $ui.sections.economy; Tables = @($tblCurrency, $tblShop, $tblGoldCurve, $tblAds, $tblIap); Note = 'data/economy.json' }
    [pscustomobject]@{ File = 'feel.html';    Slug = 'feel';    Title = $ui.sections.feel;    Tables = @($tblGesture, $tblCtrlParam, $tblHitstop, $tblShake, $tblDeath, $tblAudio, $tblHaptic); Note = 'data/gamefeel.json + controls.json' }
)

$counts = @{
    weapons = @($gdWpn.weapons).Count; enemies = @($gdEne.enemies).Count; bosses = @($gdEne.bosses).Count
    cards = @($gdUpg.cards).Count; relics = @($gdUpg.relics).Count; talents = @($gdTal.talents).Count
    waves = @($gdWav.waveTemplates).Count; depths = @($gdDep.depths).Count; buildings = @($gdBst.buildings).Count
}
function Render-Chips() {
    $sb = New-Object System.Text.StringBuilder
    [void]$sb.Append('<ul class="chips">')
    foreach ($c in $ui.chips) {
        $v = $counts[$c.key]
        [void]$sb.Append('<li><b>' + $v + '</b><span>' + (Esc $c.label) + '</span></li>')
    }
    [void]$sb.Append('</ul>')
    return $sb.ToString()
}
function Render-Nav([string]$current) {
    $sb = New-Object System.Text.StringBuilder
    [void]$sb.AppendLine('<nav class="rail"><p class="brand">INTO THE<br /><span>GOBLIN</span></p><p class="tag">' + (Esc $ui.site.tagline) + '</p>')
    [void]$sb.AppendLine('<h4>' + (Esc $ui.site.navConcept) + '</h4><ol>')
    foreach ($d in $conceptDocs) {
        $href = if ($current -eq 'gdd') { '#' + $d.Slug } else { 'GDD.html#' + $d.Slug }
        [void]$sb.AppendLine('<li><a href="' + $href + '"><span class="n">' + $d.Num + '</span><span>' + (Esc $d.Title) + '</span></a></li>')
    }
    [void]$sb.AppendLine('</ol>')
    [void]$sb.AppendLine('<h4>' + (Esc $ui.site.navData) + '</h4><ol>')
    foreach ($p in $dataPages) {
        [void]$sb.AppendLine('<li><a href="' + $p.File + '"><span class="n">&#9679;</span><span>' + (Esc $p.Title) + '</span></a></li>')
    }
    [void]$sb.AppendLine('</ol>')
    [void]$sb.AppendLine('<h4>' + (Esc $ui.site.navReports) + '</h4><ol>')
    [void]$sb.AppendLine('<li><a href="audit_report.md"><span class="n">&#9679;</span><span>audit_report.md</span></a></li>')
    [void]$sb.AppendLine('<li><a href="balance_report.md"><span class="n">&#9679;</span><span>balance_report.md</span></a></li>')
    [void]$sb.AppendLine('</ol></nav>')
    return $sb.ToString()
}
function Page-Shell([string]$title, [string]$bodyHtml) {
    return @"
<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>$(Esc $title)</title>
<style>
$css
</style>
</head>
<body>
$bodyHtml
</body>
</html>
"@
}

# ---------- GDD.html ----------
$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine('<div class="wrap">')
[void]$sb.AppendLine((Render-Nav 'gdd'))
[void]$sb.AppendLine('<main>')
[void]$sb.AppendLine('<header class="hero"><p class="eyebrow">Game Design Document &middot; v1 first-pass</p>')
[void]$sb.AppendLine('<h1>INTO THE <em>GOBLIN</em></h1>')
[void]$sb.AppendLine('<p class="sub">' + (Esc $ui.site.subtitle) + '</p>')
[void]$sb.AppendLine('<p class="quote">' + (Esc $ui.site.tagline) + '</p>')
[void]$sb.AppendLine((Render-Chips))
[void]$sb.AppendLine('</header>')

[void]$sb.AppendLine('<section class="doc" id="escal"><p class="docnum">HOOK</p><h2>' + (Esc $ui.sections.escalation) + '</h2><div class="rule"></div><div class="body">')
[void]$sb.AppendLine('<p>' + (Esc $lab.escalationIntro) + '</p>')
[void]$sb.AppendLine((Render-EscalationLadder))
[void]$sb.AppendLine('</div>' + (Render-TableHtml $tblEscal) + '</section>')

foreach ($d in $conceptDocs) {
    [void]$sb.AppendLine('<section class="doc" id="' + $d.Slug + '"><p class="docnum">' + $d.Num + ' &middot; docs/' + (Esc $d.File) + '</p><h2>' + (Esc $d.Title) + '</h2><div class="rule"></div>')
    [void]$sb.AppendLine('<div class="body wide">' + $d.Html + '</div></section>')
}

[void]$sb.AppendLine('<section class="doc" id="data"><p class="docnum">DATA</p><h2>' + (Esc $ui.site.sourceOfTruth) + '</h2><div class="rule"></div><ul class="cards">')
foreach ($p in $dataPages) {
    [void]$sb.AppendLine('<li><a href="' + $p.File + '">' + (Esc $p.Title) + '</a><p>' + (Esc $p.Note) + '</p></li>')
}
[void]$sb.AppendLine('</ul></section>')
[void]$sb.AppendLine('<footer><p>' + (Esc $ui.site.generatedBy) + '</p></footer>')
[void]$sb.AppendLine('</main></div>')
Save-Text (Join-Path $rootDir 'GDD.html') (Page-Shell 'Into the Goblin GDD' $sb.ToString())

# ---------- data pages ----------
foreach ($p in $dataPages) {
    $b = New-Object System.Text.StringBuilder
    [void]$b.AppendLine('<div class="wrap">')
    [void]$b.AppendLine((Render-Nav $p.Slug))
    [void]$b.AppendLine('<main><header class="hero"><p class="eyebrow"><a href="GDD.html">INTO THE GOBLIN</a> &middot; ' + (Esc $ui.site.navData) + '</p>')
    [void]$b.AppendLine('<h1>' + (Esc $p.Title) + '</h1><p class="sub">' + (Esc $p.Note) + ' &mdash; ' + (Esc $ui.site.generatedBy) + '</p></header>')
    [void]$b.AppendLine('<section class="doc"><div class="filter"><input id="q" type="search" placeholder="' + (Esc $lab.filterPlaceholder) + '" /><span class="count">' + (Esc $lab.showing) + ' <b id="qc"></b> ' + (Esc $lab.rows) + '</span></div>')
    foreach ($t in $p.Tables) {
        [void]$b.AppendLine('<h3>' + (Esc $t.Id) + ' &middot; ' + @($t.Rows).Count + ' ' + (Esc $lab.rows) + '</h3>')
        [void]$b.AppendLine((Render-TableHtml $t))
    }
    [void]$b.AppendLine('</section><footer><p><a href="GDD.html">&larr; GDD</a></p></footer></main></div>')
    [void]$b.AppendLine($filterJs)
    Save-Text (Join-Path $rootDir $p.File) (Page-Shell ($p.Title + ' | Into the Goblin') $b.ToString())
}

# ---------- gen-*.md ----------
$genMap = @(
    @{ f = 'gen-weapons.md';  t = @($tblRanged, $tblMelee);  s = 'data/weapons.json' }
    @{ f = 'gen-enemies.md';  t = @($tblEnemies, $tblBosses, $tblAffix); s = 'data/enemies.json' }
    @{ f = 'gen-depths.md';   t = @($tblDepths, $tblChallenges); s = 'data/depths.json' }
    @{ f = 'gen-rooms.md';    t = @($tblRooms, $tblEvents); s = 'data/rooms.json' }
    @{ f = 'gen-waves.md';    t = @($tblWaves); s = 'data/waves.json' }
    @{ f = 'gen-upgrades.md'; t = @($tblCards, $tblRelics); s = 'data/upgrades.json' }
    @{ f = 'gen-talents.md';  t = @($tblTalents); s = 'data/talents.json' }
    @{ f = 'gen-economy.md';  t = @($tblCurrency, $tblShop, $tblGoldCurve, $tblAds, $tblIap); s = 'data/economy.json' }
    @{ f = 'gen-bastion.md';  t = @($tblBastion); s = 'data/bastion.json' }
    @{ f = 'gen-gamefeel.md'; t = @($tblHitstop, $tblShake, $tblDeath, $tblAudio, $tblHaptic, $tblGesture, $tblCtrlParam); s = 'data/gamefeel.json + data/controls.json' }
    @{ f = 'gen-escalation.md'; t = @($tblEscal, $tblForkSigns, $tblLayout); s = 'docs/16 muc 4.3 + data/rooms.json' }
)
foreach ($g in $genMap) {
    $m = New-Object System.Text.StringBuilder
    [void]$m.AppendLine('# ' + ($g.f -replace '^gen-', '' -replace '\.md$', '') + ' (generated)')
    [void]$m.AppendLine('')
    [void]$m.AppendLine(('> ' + ($unit.genNote -replace '{SRC}', $g.s)))
    [void]$m.AppendLine('')
    foreach ($t in $g.t) { [void]$m.Append((Render-TableMd $t)) }
    Save-Text (Join-Path $docsDir $g.f) $m.ToString()
}

# ---------- artifact fragment (self-contained, no local links) ----------
$auditPath = Join-Path $rootDir 'audit_report.md'
$auditLine = 'chua chay audit'
$auditPass = 0; $auditWarn = 0; $auditFail = 0
# CHAY audit truoc khi doc bao cao. Truoc day cho nay chi DOC audit_report.md co san,
# nen dong "audit: PASS x / FAIL y" ma build in ra co the la ket qua cua mot lan chay
# tu rat lau truoc -- build xanh trong khi data da FAIL tu bao gio khong ai biet.
$auditScript = Join-Path $rootDir 'audit_gdd.ps1'
if (Test-Path $auditScript) { & $auditScript | Out-Null }
if (Test-Path $auditPath) {
    $at = [System.IO.File]::ReadAllText($auditPath, [System.Text.Encoding]::UTF8)
    if ($at -match '\*\*PASS (\d+) / WARN (\d+) / FAIL (\d+)\*\* trong (\d+)') {
        $auditPass = [int]$Matches[1]; $auditWarn = [int]$Matches[2]; $auditFail = [int]$Matches[3]
        $auditLine = "$($Matches[4]) check"
    }
}

$a = New-Object System.Text.StringBuilder
[void]$a.AppendLine('<title>Into the Goblin</title>')
[void]$a.AppendLine('<style>')
[void]$a.AppendLine($css)
[void]$a.AppendLine('</style>')
[void]$a.AppendLine('<div class="wrap">')
# artifact nav: anchors only
[void]$a.AppendLine('<nav class="rail"><p class="brand">INTO THE<br /><span>GOBLIN</span></p><p class="tag">' + (Esc $ui.site.tagline) + '</p>')
[void]$a.AppendLine('<h4>' + (Esc $ui.site.navConcept) + '</h4><ol>')
[void]$a.AppendLine('<li><a href="#escal"><span class="n">&#9679;</span><span>' + (Esc $ui.sections.escalation) + '</span></a></li>')
foreach ($d in $conceptDocs) {
    [void]$a.AppendLine('<li><a href="#' + $d.Slug + '"><span class="n">' + $d.Num + '</span><span>' + (Esc $d.Title) + '</span></a></li>')
}
[void]$a.AppendLine('</ol><h4>' + (Esc $ui.site.navData) + '</h4><ol>')
foreach ($p in $dataPages) {
    [void]$a.AppendLine('<li><a href="#d-' + $p.Slug + '"><span class="n">&#9679;</span><span>' + (Esc $p.Title) + '</span></a></li>')
}
[void]$a.AppendLine('</ol></nav>')
[void]$a.AppendLine('<main><header class="hero"><p class="eyebrow">Game Design Document &middot; v1 first-pass</p>')
[void]$a.AppendLine('<h1>INTO THE <em>GOBLIN</em></h1>')
[void]$a.AppendLine('<p class="sub">' + (Esc $ui.site.subtitle) + '</p>')
[void]$a.AppendLine('<p class="quote">' + (Esc $ui.site.tagline) + '</p>')
[void]$a.AppendLine((Render-Chips))
[void]$a.AppendLine('<div class="stat"><div><b class="ok">' + $auditPass + '</b><span>audit pass</span></div><div><b class="warn">' + $auditWarn + '</b><span>warn</span></div><div><b class="bad">' + $auditFail + '</b><span>fail</span></div><div><b>' + (@($conceptDocs).Count) + '</b><span>pillar doc</span></div></div>')
[void]$a.AppendLine('</header>')
[void]$a.AppendLine('<section class="doc" id="escal"><p class="docnum">HOOK</p><h2>' + (Esc $ui.sections.escalation) + '</h2><div class="rule"></div><div class="body"><p>' + (Esc $lab.escalationIntro) + '</p>' + (Render-EscalationLadder) + '</div>' + (Render-TableHtml $tblEscal) + '</section>')
foreach ($d in $conceptDocs) {
    [void]$a.AppendLine('<section class="doc" id="' + $d.Slug + '"><p class="docnum">' + $d.Num + '</p><h2>' + (Esc $d.Title) + '</h2><div class="rule"></div><div class="body wide">' + $d.Html + '</div></section>')
}
foreach ($p in $dataPages) {
    [void]$a.AppendLine('<section class="doc" id="d-' + $p.Slug + '"><p class="docnum">DATA &middot; ' + (Esc $p.Note) + '</p><h2>' + (Esc $p.Title) + '</h2><div class="rule"></div>')
    foreach ($t in $p.Tables) {
        [void]$a.AppendLine('<h3>' + (Esc $t.Id) + ' &middot; ' + @($t.Rows).Count + ' ' + (Esc $lab.rows) + '</h3>')
        [void]$a.AppendLine((Render-TableHtml $t))
    }
    [void]$a.AppendLine('</section>')
}
[void]$a.AppendLine('<footer><p>' + (Esc $ui.site.generatedBy) + ' &middot; audit: ' + $auditLine + '</p></footer>')
[void]$a.AppendLine('</main></div>')
Save-Text (Join-Path $artDir 'GDD.artifact.html') $a.ToString()

# ==============================================  sync data -> prototype
# Prototype la static site khong co buoc build, nen no fetch data/*.json truc tiep.
# Copy o day de prototype/data KHONG BAO GIO lech voi nguon chan ly.
$protoData = Join-Path $rootDir 'prototype\data'
$protoCopied = 0
if (Test-Path (Join-Path $rootDir 'prototype')) {
    if (-not (Test-Path $protoData)) { New-Item -ItemType Directory -Path $protoData | Out-Null }
    foreach ($src in (Get-ChildItem (Join-Path $rootDir 'data\*.json'))) {
        Copy-Item $src.FullName (Join-Path $protoData $src.Name) -Force
        $protoCopied++
    }
}

# =====================================================================  verify
$issues = @()
function Check-Html([string]$path) {
    $t = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)
    foreach ($tag in @('div', 'table', 'thead', 'tbody', 'tr', 'section', 'nav', 'main', 'ul', 'ol', 'li', 'pre', 'code', 'blockquote', 'p', 'span', 'h2', 'h3', 'style')) {
        $open  = ([regex]::Matches($t, "<$tag(\s[^>]*)?>")).Count
        $close = ([regex]::Matches($t, "</$tag>")).Count
        if ($open -ne $close) { $script:issues += ("{0}: <{1}> open={2} close={3}" -f (Split-Path $path -Leaf), $tag, $open, $close) }
    }
    if ($t -match '<td>\s*</td>\s*</tr>\s*</tbody>\s*</table>\s*</div>\s*<tr') { $script:issues += ("{0}: table structure" -f (Split-Path $path -Leaf)) }
    return $t
}
$outFiles = @('GDD.html') + @($dataPages | ForEach-Object { $_.File })
$totalBytes = 0
foreach ($f in $outFiles) {
    $p = Join-Path $rootDir $f
    $t = Check-Html $p
    $totalBytes += (Get-Item $p).Length
    # local links resolve
    foreach ($m in [regex]::Matches($t, 'href="(?!#|https?:)([^"#]+)')) {
        $target = $m.Groups[1].Value
        if (-not (Test-Path (Join-Path $rootDir $target))) { $issues += ("{0}: link khong ton tai -> {1}" -f $f, $target) }
    }
}
$artFile = Join-Path $artDir 'GDD.artifact.html'
$at2 = Check-Html $artFile
$artBytes = (Get-Item $artFile).Length
# tag-boundary patterns: '<head' alone would false-positive on '<header'
foreach ($bad in @('<!DOCTYPE', '<html[\s>]', '<head[\s>]', '<body[\s>]')) {
    if ($at2 -match $bad) { $issues += ("artifact fragment chua duoc phep co {0}" -f $bad) }
}
foreach ($m in [regex]::Matches($at2, 'href="(?!#|https?:)([^"]+)')) { $issues += "artifact co link local: $($m.Groups[1].Value)" }

# anchor integrity
$anchors = @([regex]::Matches($at2, 'id="([^"]+)"') | ForEach-Object { $_.Groups[1].Value })
foreach ($m in [regex]::Matches($at2, 'href="#([^"]+)"')) {
    if ($anchors -notcontains $m.Groups[1].Value) { $issues += "artifact: anchor #$($m.Groups[1].Value) khong co dich" }
}

$genCount = @(Get-ChildItem (Join-Path $docsDir 'gen-*.md')).Count
$rowTotal = 0
foreach ($p in $dataPages) { foreach ($t in $p.Tables) { $rowTotal += @($t.Rows).Count } }

if (-not $Quiet) {
    Write-Host ''
    Write-Host 'BUILD PAGES -- INTO THE GOBLIN'
    Write-Host ('-' * 70)
    Write-Host ("concept doc inline : {0}" -f @($conceptDocs).Count)
    Write-Host ("data page          : {0}  ({1} dong bang)" -f @($dataPages).Count, $rowTotal)
    Write-Host ("gen-*.md           : {0}" -f $genCount)
    Write-Host ("data -> prototype  : {0} file" -f $protoCopied)
    Write-Host ("GDD.html + pages   : {0:N0} KB" -f ($totalBytes / 1024))
    Write-Host ("artifact fragment  : {0:N0} KB  (gioi han 16 MB)" -f ($artBytes / 1024))
    Write-Host ("audit              : PASS {0} / WARN {1} / FAIL {2}" -f $auditPass, $auditWarn, $auditFail)
    Write-Host ('-' * 70)
    if ($issues.Count -eq 0) { Write-Host 'VERIFY: OK -- HTML can doi, link local phan giai duoc, artifact la fragment hop le' }
    else {
        Write-Host ("VERIFY: {0} van de" -f $issues.Count)
        $issues | Select-Object -Unique | ForEach-Object { Write-Host ("  - " + $_) }
    }
    Write-Host ''
}
if ($issues.Count -gt 0) { exit 1 }
exit 0
