# INTO THE GOBLIN — Index tài liệu thiết kế

> Mobile portrait First-Person Wave Shooter.
> `Into the Dead` (di chuyển / góc nhìn / căng thẳng hành lang) **+** `Guns 'n Goblins` (**chỉ lấy feel: mật độ quái đông**, không lấy cơ chế).
> Hook quyết định của riêng game: **Ngã Ba Hầm** — mỗi Cổng chọn 1 trong 2 cửa có biển báo.

## Nguyên tắc tài liệu

| Lớp | File | Ai đọc | Ai sửa |
|---|---|---|---|
| Concept (pillar) | `docs/NN-*.md` | Human + AI | **Sửa tay** |
| Data (source of truth) | `data/*.json` | Engine + AI | **Sửa tay / script** |
| View người đọc | `GDD.html`, `*.html` | Human | **KHÔNG sửa tay** — generated |
| View data cho AI | `docs/gen-*.md` | AI / LLM | **KHÔNG sửa tay** — generated |

Pipeline: `data/*.json` → `normalize_balance.ps1` → `audit_gdd.ps1` (GATE) → `build_pages.ps1` → HTML + `gen-*.md`.

## Concept docs

| # | File | Nội dung |
|---|---|---|
| 00 | [00-research-benchmark.md](00-research-benchmark.md) | Research 2 game gốc + 8 game tham chiếu, lấy gì / bỏ gì |
| 01 | [01-overview.md](01-overview.md) | Pitch, design pillars, target player, platform, session |
| 02 | [02-core-loop.md](02-core-loop.md) | Vòng lặp 3 tầng: giây / phút / ngày |
| 03 | [03-controls-gestures.md](03-controls-gestures.md) | **Bảng phân giải gesture** tap / hold / hold-drag / slide |
| 04 | [04-combat-ranged.md](04-combat-ranged.md) | Đạn, băng đạn, reload, Goblin Vàng, hai chế độ ngắm |
| 05 | [05-combat-melee.md](05-combat-melee.md) | Slide, stamina, combo, Chém Hoàn Hảo, đòn nặng |
| 06 | [06-spacing-threat-bands.md](06-spacing-threat-bands.md) | 3 dải cự ly, knockback = tài nguyên phòng thủ, Sương Đen |
| 07 | [07-wave-room-director.md](07-wave-room-director.md) | Wave director, threat points, room graph, pacing |
| 08 | [08-fork-escalation.md](08-fork-escalation.md) | **Ngã Ba Hầm** + nhịp leo thang tự động + hệ **Lộc** |
| 09 | [09-enemies-bosses.md](09-enemies-bosses.md) | Triết lý thiết kế quái + boss (data: `data/enemies.json`) |
| 10 | [10-progression-meta.md](10-progression-meta.md) | Card trong run, weapon level, talent, Trại Mỏ, Depth |
| 11 | [11-economy.md](11-economy.md) | 5 currency, source/sink, giá shop, gold curve |
| 12 | [12-monetization-retention.md](12-monetization-retention.md) | F2P, ads, Sổ Thợ Hầm, D1/D7/D30 |
| 13 | [13-gamefeel-juice.md](13-gamefeel-juice.md) | Hitstop, shake, gold burst, xác bay, coin chime |
| 14 | [14-uiux.md](14-uiux.md) | HUD portrait, thumb zone, onboarding 10 giây |
| 15 | [15-art-audio.md](15-art-audio.md) | Art direction, LOD/silhouette, audio motif |
| 16 | [16-data-schema-balancing.md](16-data-schema-balancing.md) | **Mọi công thức & convention** — doc gốc cho mọi số |
| 17 | [17-production-roadmap.md](17-production-roadmap.md) | MVP, prototype 6 tuần, playtest metric, risk |
| 18 | [18-prototype.md](18-prototype.md) | **Prototype three.js** — kiến trúc, cái gì chạy được, 6 lỗi prototype tìm ra trong GDD |

## Generated data docs

`gen-weapons.md` · `gen-enemies.md` · `gen-upgrades.md` · `gen-talents.md` · `gen-rooms.md` · `gen-waves.md` · `gen-depths.md` · `gen-economy.md` · `gen-bastion.md` · `gen-gamefeel.md` · `gen-escalation.md`

## System dependency map

```
16-data-schema (formula gốc)
  |
  +-- 03-controls ----+
  |                   |
  +-- 04-ranged ------+--> 06-spacing --+
  |                   |                 |
  +-- 05-melee -------+                 +--> 07-wave-director --+
  |                                     |                       |
  +-- 09-enemies ------------------------+                       +--> 08-fork-escalation
  |                                                              |
  +-- 10-progression <---- 11-economy <--------------------------+
  |         |                  |
  |         +--> 12-monetization
  |
  +-- 13-gamefeel --> 14-uiux --> 15-art-audio
```

**Quy tắc:** đổi số ở `16-data-schema-balancing.md` thì **phải** đổi `data/*.json` và chạy lại pipeline. Không có số "chỉ nằm trong code".
