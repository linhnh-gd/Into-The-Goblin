# 16 — Data Schema & Balancing (doc gốc cho MỌI con số)

**Đây là nguồn chân lý cho công thức.** Mọi doc khác chỉ được *tham chiếu* doc này, không được định nghĩa
lại công thức. Mọi giá trị thực nằm trong `data/*.json`. **Không có con số nào được hardcode trong code.**

---

## 1. Từ vựng & quy ước ký hiệu

| Ký hiệu | Nghĩa | Miền |
|---|---|---|
| `D` | Depth (tầng hầm) | 1…7, Endless = 8+ |
| `r` | Chỉ số phòng trong Depth | 1…10 |
| `R` | **Chỉ số phòng toàn cục** = `(D-1)*10 + r` | 1…∞ |
| `L` | **Lộc** — điểm thưởng cho chơi giỏi | 0…20 (24 talent, 28 relic) |
| `T` | Tier vũ khí | 1…6 |
| `Lv` | Level vũ khí | 1…40 |
| `w` | Chỉ số wave trong phòng | 1…3 |

| Tiếng Việt | English | Code id |
|---|---|---|
| Ngã Ba Hầm | The Fork | `fork` |
| Lộc | Luck | `luck` |
| Trại Mỏ | Mine Camp | `camp` |
| Cướp Đạn | Scavenge | `scavenge` |
| Nạp Hoàn Hảo | Perfect Reload | `perfectReload` |
| Chém Hoàn Hảo | Perfect Slash | `perfectSlash` |
| Sương Đen | Black Mist | `blackMist` |
| Mảnh Cốt | Bone Shard | `shards` |
| Phôi Rèn | Ingot | `ingots` |
| Dầu Đèn | Lamp Oil | `tickets` |
| Thẻ Nâng Cấp | Upgrade Card | `card` |
| Bảo Vật | Relic | `relic` |
| Dải Xa / Giữa / Cận chiến | Far / Mid / Melee band | `far` / `mid` / `melee` |

## 2. Quy ước ID (bắt buộc, audit kiểm tra)

| Loại | Pattern | Ví dụ |
|---|---|---|
| Vũ khí tầm xa | `rw_<archetype>_<slug>` | `rw_pistol_kendong` |
| Vũ khí cận chiến | `mw_<archetype>_<slug>` | `mw_greatsword_daidao` |
| Quái | `en_<role>_<slug>` | `en_trash_goblincui` |
| Boss | `bs_d<depth>_<slug>` | `bs_d1_goblinvuongbeo` |
| Thẻ | `cd_<tag>_<slug>` | `cd_melee_luoidai` |
| Bảo vật | `rl_<slug>` | `rl_tuivangdoi` |
| Talent | `tl_<branch>_<slug>` | `tl_nong_bangto` |
| Phòng | `rm_<type>_<slug>` | `rm_event_banthoren` |
| Wave template | `wv_<slug>` | `wv_thuytrieu` |
| Building | `bd_<slug>` | `bd_hamvang` |
| Affix | `af_<slug>` | `af_bocgiap` |

## 3. Người chơi — hằng số nền

| Tham số | Giá trị | Ghi chú |
|---|---|---|
| `hpBase` | 100 | + talent + card |
| `armorMax` | 0.60 | giảm damage tối đa 60%, giảm dần (diminishing) |
| `staminaMax` | 100 | |
| `staminaRegen` | 18 / s | |
| `staminaRegenDelay` | 0.6 s | |
| `staminaLowThreshold` | 0.50 | **dưới mức này: melee attack speed x0.5** (docs) |
| `staminaBarFadeDelay` | 2.0 s | (docs) |
| `scavengeKillsPerMag` | 6 | Chém Hoàn Hảo tính x2 |
| `advanceSpeed` | 2.4 m/s | ngoài combat |
| `dodgeDistance` / `cooldown` | 1.2 m / 2.5 s | Bước Lùi, 0.15s bất tử |
| `dashDistance` / `cooldown` | 2.0 m / 4.0 s | Xốc Tới |
| `bandFar` / `bandMid` / `bandMelee` | 9–22 m / 2.5–9 m / 0–2.5 m | |
| `enemyAttackRange` | 1.2 m | telegraph 0.4 s |
| `aimAssistCone` | 4.0° (D1–4) → 1.5° (D5+) | |

## 4. Công thức cốt lõi

### 4.1 Đường cong sức mạnh vũ khí (per tier)

```
dpsTarget(T) = 110 * 2.35 ^ (T - 1)
```

| T | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|
| `dpsTarget` | 110 | 259 | 608 | 1,428 | 3,356 | 7,887 |

**Ranged — DPS bền (tính cả reload):**

```
dpsSustained = (dmg * pellets * mag) / ( mag / (rpm/60) + reloadTime )
```
Ràng buộc: `|dpsSustained / dpsTarget(T) - 1| <= 0.22`

**Melee — DPS hiệu dụng (giới hạn bởi stamina chứ không bởi tốc độ tay, và tính cả số mục tiêu):**

```
targetFactor         = 1 + 0.35 * (targets - 1)
swingIntervalSustain = max( swingTime , staminaCost / staminaRegen )
dpsMeleeEff          = dmg * targetFactor / swingIntervalSustain
```
Ràng buộc: `|dpsMeleeEff / (dpsTarget(T) * 1.45) - 1| <= 0.25`

Hệ số **1.45**: melee phải mạnh hơn ranged ở dải Cận chiến (`05` mục 8.3), vì đứng gần là rủi ro.

**Vì sao phải nhân `targetFactor`:** nếu chỉ so `dmg / swingInterval` thì Đại Đao (6 mục tiêu) và Dao Găm
(2 mục tiêu) được coi là ngang nhau, và vũ khí quét sẽ mạnh gấp 3 lần thực tế. Hệ số `0.35`/mục tiêu phản
ánh việc mục tiêu thứ n không luôn có mặt trong tầm quẹt (giảm dần theo thực tế playtest).

**Chỉ số phụ (chỉ để tham khảo, không phải gate):** `dmgPerStamina = dmg / staminaCost`
— dùng để so sánh "cảm giác nặng tay" giữa các vũ khí cùng tier.

**Level vũ khí:** `dmgAtLevel(Lv) = dmg * 1.025 ^ (Lv - 1)` -> Lv40 = **x2.66**
**Chi phí nâng:** `upgradeCost(Lv) = round( 120 * 1.215 ^ (Lv - 1) )` -> Lv1 = 120, Lv30 = 34,142

### 4.2 Scaling của quái

**Không có dial nào cho người chơi.** Độ khó là hàm của `R` (đi sâu) và `w` (wave trong phòng) — đúng dòng
docs gốc *"độ khó mỗi wave sẽ tăng dần, có thể là tăng số lượng, loại quái mới khoẻ hơn"*.

```
enemyHP(e, R, w)  = e.hp    * 1.068 ^ (R - 1) * (1 + 0.06 * (w - 1))
enemyDmg(e, R)    = e.dmg   * 1.055 ^ (R - 1)
enemySpeed(e)     = e.speed                            -- cap x1.25 khi có buff từ Goblin Trống
```

| `R` | 1 | 10 | 20 | 40 | 70 |
|---|---|---|---|---|---|
| hệ số HP | 1.00 | 1.81 | 3.49 | 13.0 | **93.6** |

Bảng đầy đủ do script sinh ra: `docs/gen-escalation.md` — đó là bảng chuẩn, bảng trên chỉ để đọc nhanh.

### 4.3 Leo thang trong phòng (wave-to-wave)

```
TP_budget(R, w) = round( (14 + 4.2 * R) * (1 + 0.18 * (w - 1)) * roomTypeMult )
hpWaveMult(w)   = 1 + 0.06 * (w - 1)
```

| `w` | Số quái | HP mỗi con |
|---|---|---|
| 1 | ×1.00 | ×1.00 |
| 2 | ×1.18 | ×1.06 |
| 3 | ×1.36 | ×1.12 |

Cộng thêm: từ wave 2 director được phép đưa vào **1 loại quái mới khoẻ hơn** (giới hạn 1 loại mới / phòng).

### 4.4 Wave Director

```
TP_budget(R, w) = round( (14 + 4.2 * R) * (1 + 0.18 * (w - 1)) * roomTypeMult )
roomTypeMult: combat 1.00 · elite 1.40 · gauntlet 2.20 · boss 1.60
tag cửa "đông": TP x1.25
```
Số quái của wave = tiêu hết TP theo `composition` của wave template.
Hard cap: 40 full-AI · 240 tổng · 3 quái đang bắn · 2 exploder dải Cận chiến · 4 loại/wave.

**Số quái thật của một wave phải tính theo `composition`**, không phải theo `tpCost` trung bình của cả pool:

```
countPerTP = tpMult * SUM( weight_i / tpCost_i )
count(R, w) = TP_budget(R, w) * countPerTP
```

Ví dụ `wv_thuytrieu` (70% Goblin Bầy tp 0.8 + 30% Goblin Cùi tp 1.0, tpMult 1.35) → `countPerTP = 1.59`
→ R1 = 29 con, R10 = 89 con. Lấy trung bình cả pool (gồm Ogre tp 8.0) sẽ cho ra con số sai gấp 3 lần.

### 4.5 Vàng

```
goldPerKill(e, D)  = e.goldDrop * 1.15^(D-1) * campGoldBonus * doorTagMult
goldRunEnd         = tong vang da thu (KHONG nhan lai lan nao nua)
doorTagMult: mặc định 1.00 · cửa "đông" 1.25 · cửa "tối" 1.30
```

`expectedGoldG0(depth)` **không được đoán tay** — nó được tính từ `depthLayout` (TP director) và
`goldDrop` của pool quái khả dụng ở Depth đó, cộng `goldDrop` của boss. Audit tính lại và so với con số
khai báo trong `depths.json` (±40%). `goldCurve` phải bằng **tổng tích luỹ** `expectedGoldG0` (±10%).

### 4.6 Rarity thẻ theo Lộc `L`

```
w_common    = max(6,  60 - 2.6 * L)
w_rare      =       28 +  1.3 * L
w_epic      =       10 +  1.0 * L
w_legend    =        2 +  0.4 * L
   (chuẩn hoá về tổng 100)
```

| `L` | common | rare | epic | legendary |
|---|---|---|---|---|
| 0 | 60% | 28% | 10% | 2% |
| 8 | 39% | 38% | 18% | 5% |
| 14 | 24% | 46% | 24% | 7% |
| 20 | 8% | 54% | 30% | 10% |

```
Lộc: Elite +2 · hòm +1 · clear phòng không mất máu +1 · mỗi 10 Chém Hoàn Hảo +1 · boss +3
Tiêu: Miếu Mỏ 4 Lộc + 200 vàng -> thẻ epic  |  6 Lộc + 350 vàng -> hồi đầy HP
Cột vàng: chance = 0.04 + 0.004 * L (mở từ Depth 3)
```

### 4.7 Talent

```
talentCost(n) = baseCost * (powerDelta_n / powerDelta_1) ^ 1.15 * 1.55 ^ (n - 1)
```
Bất biến: `powerDelta_n >= 0.02` (không talent rác) · `cost` tăng đơn điệu ·
`powerDelta_n >= 0.5 * powerDelta_(n-1)`.

### 4.8 Nạp Hoàn Hảo

```
reloadTimeActual = reloadTime * (0.55 nếu perfect | 1.00 nếu không tap | 1.30 nếu trượt)
dmgNextMag       = dmg * (1.15 nếu perfect | 1.00)
perfectWindow    = 0.25 s, vị trí ngẫu nhiên trong [0.45, 0.80] của thanh (seed)
```

### 4.9 Knockback

```
push   = kb  * (1 - kbResist) * classMult          -- classMult: heavy 0.6, khác 1.0
launch = kb  * 2.2 * (1 - kbResist)                -- khi chết
domino = launchLựcHiệnTại * 0.35                    -- xác/quái đang bay đẩy con nó chạm
Chém nặng: kb x2.2 · Shotgun ở dải Cận chiến: x1.5
```

### 4.10 Combo

```
meleeComboMult = [1.00, 1.15, 1.30, 1.50, 1.80, 1.80]   -- bậc 0..5+
comboWindow    = 1.2 s
rangedChain    = [0, 0, 0, 0.10, 0.10, 0.10, 0.10, 0.25, ... 0.40 từ hit 15]
```

## 5. TTK & khoá tài nguyên (ràng buộc sống còn của P2)

| Ràng buộc | Công thức | Vì sao |
|---|---|---|
| **TTK trash phải nhanh** | `enemyHP(trash, anchorRoom(T), 1) / dpsSustained <= 0.60 s` cho **mọi** vũ khí | Chống lỗi "slow basic weapons" của Guns 'n Goblins |
| **Có khẩu one-shot trash** | Tồn tại ≥1 vũ khí T1 có `dmg*pellets >= trashHP(D1)` | Cảm giác "súng ra súng" ngay từ phút đầu |
| **Một băng không dọn hết wave** | `magClearRatio = (mag*dmg*pellets) / waveEHP(anchorRoom(T))`. **FAIL nếu > 1.00** hoặc `< 0.25`; **WARN** nếu ngoài `[0.45, 0.70]` | Nếu 1 băng dọn sạch wave thì melee vô dụng → **P2 chết** |
| **Dự trữ đủ 6–9 wave** | `6 <= reserveMax*dmg*pellets / waveEHP <= 9` (WARN nếu lệch) | Buộc phải melee từ wave ~7 |
| **Melee mạnh hơn ở gần** | `dpsMeleeEff >= 1.30 * dpsSustained` (so trung vị cùng tier) | Có lý do dám vào gần |
| **Luôn còn 1 nhát khi cạn** | `staminaRegen * 1.4 >= staminaCost` với **mọi** vũ khí cận chiến → `staminaCost <= 25` (18×1.4 = 25.2) | Reload mất tới 4.5s; nếu vũ khí nặng tiêu 40 stamina thì có lúc **không tấn công được bằng gì cả** → chết không hiểu vì sao. Sức nặng của vũ khí thể hiện qua `swingTime` / `targets` / `corpseLaunch` / `knockback`, **không** qua stamina |
| **DPS quái ở dải Cận chiến** | `<= min(0.55, 0.16 + 0.0055*(R-1)) * hpBase` mỗi giây | Chết phải hiểu vì sao. Ở R1 là 16% HP/giây (~6.3s tiếp xúc toàn phần), tới R72 đạt trần 55%. **Base hạ từ 0.28 xuống 0.16 sau prototype** — xem `18` mục 4 |

`anchorRoom(T) = [1, 8, 18, 30, 45, 60]` — phòng mà tier `T` được coi là "đúng tuổi".

## 6. Randomness — bắt buộc có seed

```
seed_run  = hash(playerId, runIndex, patchVersion)
seed_room = hash(seed_run, D, r)
seed_wave = hash(seed_room, w)
seed_card = hash(seed_room, "card")
seed_reload = hash(seed_room, shotCount)      -- vị trí vùng Nạp Hoàn Hảo
```
Cùng seed → cùng kết quả. Cần cho replay, preview phòng, QA và báo bug.

## 7. Kiểm tra sức mạnh tổng thể (sanity check của cả game)

| Nguồn tăng sức mạnh của người chơi | Hệ số từ đầu tới cuối |
|---|---|
| Tier vũ khí T1→T6 | **x71.7** |
| Level vũ khí Lv1→Lv40 | x2.66 |
| Talent (24 talent full) | ~x1.8 |
| Thẻ trong một run tốt | ~x3.0 |
| **Tổng** | **~x1,030** |

| Nguồn tăng sức mạnh của quái | Hệ số |
|---|---|
| Phòng R1→R70 (hết Depth 7) | **x93.6** |
| Wave 1→3 trong phòng | x1.12 |
| Endless tới R110 (phòng 40) | x1,301 |

→ Hết Depth 7 (R70): người chơi ~**x1,030** vs hầm ~**x94**. Người chơi **thắng rõ**, và đó là chủ đích —
Depth 7 phải clear được với build tốt, nó là *đích* của campaign chứ không phải bức tường.

→ Trong **Endless**, đường cong quái `1.068^(R-1)` không bao giờ dừng: nó vượt người chơi ở khoảng
**R ≈ 106** (tức phòng ~36 của Endless). Đó là nơi hầm luôn thắng, và là nơi leaderboard sống.

Nếu tỉ lệ này lệch quá 1.6x theo hướng nào, sửa **`dpsTarget` hoặc hệ số 1.068** — không sửa lẻ từng vũ khí.

**Ghi chú lịch sử:** bản trước của GDD có thêm một hệ số nữa cho quái (Greed, tối đa ×8.92) do người chơi
tự bơm. Hệ đó đã bị loại vì là cơ chế của Guns 'n Goblins; từ đó ta **chỉ lấy feel mật độ quái**.

## 8. Schema các file dữ liệu

### `data/weapons.json`
```
{ "weapons": [ {
  "id","name","class":"ranged|melee","archetype","tier":1-6,"unlock",
  ranged: "dmg","rpm","pellets","mag","reserveMax","reloadTime","spreadDeg","rangeM","pierce",
  melee : "dmg","staminaCost","swingTime","arcDeg","reachM","targets","corpseLaunch",
  chung : "knockback","critMult","tags":[],"desc"
} ] }
```

### `data/enemies.json`
```
{ "enemies": [ {
  "id","name","role":"trash|ranged|special|support|heavy|elite|boss","introDepth",
  "hp","dmg","speed","kbResist":0-1,"tpCost","goldDrop","attackType","mechanic",
  "counters":"người chơi phải làm gì","sfxSpawn","tags":[]
} ], "bosses": [ { "id","name","depth","hp","phases":[...],"ttkTargetSec","drops" } ],
  "affixes": [ { "id","name","effect","signal","minDepth","excludes":[] } ] }
```

### `data/waves.json`
```
{ "waveTemplates": [ { "id","name","intent","teaches","tpMult",
    "composition":[{"enemy":"<id>","weight":0-1}], "spawnPattern","minDepth" } ],
  "directorRules": { ... } }
```

### `data/depths.json`
```
{ "depths": [ { "depth","name","biome","rooms":10,"introEnemies":["<id>"],
   "boss":"<id>","loadoutUnlocks":["<id>"],"challenges":[{"id","name","reward"}],
   "expectedGoldG0","entryCost" } ] }
```

### `data/rooms.json`
```
{ "fork": { "name","rule","why","signTags":[{"tag","meaning"}],"constraints":[] },
  "depthLayout":[{"room","type","note","forkPool":[]}],
  "roomTypes":[{"id","name","type","freq","desc","reward","tpMult"}],
  "events":[{"id","name","effect","choice","fromDocs"}] }
```

### `data/upgrades.json`
```
{ "cards":[{"id","name","rarity","tags":[],"effect","powerDelta","drawback","comboUnlock"}],
  "relics":[{"id","name","effect","source"}] }
```

### `data/talents.json`
```
{ "branches":[{"id","name","theme"}],
  "talents":[{"id","name","branch","ranks":[{"rank","cost","currency","powerDelta","effect"}]}] }
```

### `data/economy.json`
```
{ "currencies":[{"id","name","type":"soft|run|meta|material|hard|entry","sources":[],"sinks":[]}],
  "shop":[{"id","name","price","currency","scope"}],
  "goldCurve":[{"milestone","depth","expectedGold"}] }
```

### `data/bastion.json`
```
{ "buildings":[{"id","name","effect","idle","maxLevel","costLv1","costLv10","unlockAt"}] }
```

### `data/gamefeel.json`
```
{ "hitstop":[{"event","frames","timescale"}],
  "shake":[{"event","amplitudePx","durationSec","axis"}],
  "death":[{"killType","corpse","particles","goldCoins"}],
  "audio":[{"priority","sound","note"}],
  "haptics":[{"event","pattern"}] }
```

### `data/controls.json`
```
{ "gestures":[{"id","name","condition","action","weapon"}],
  "params":[{"key","value","unit","note"}],
  "accessibility":[{"id","name","desc"}] }
```

## 9. Pipeline & gate

```
1. Sửa data/*.json  (hoặc sửa công thức ở doc này rồi sửa data)
2. .\normalize_balance.ps1      -> scale dmg về đúng dpsTarget, ghi balance_report.md
3. .\audit_gdd.ps1              -> GATE: exit 1 nếu vi phạm bất biến
4. .\build_pages.ps1            -> sinh GDD.html, *.html, docs/gen-*.md, artifact/
```

**Không bao giờ sửa tay `GDD.html`, `*.html`, `docs/gen-*.md`.** Chúng bị ghi đè.
