# Balance Report -- INTO THE GOBLIN

> File nay do `normalize_balance.ps1` sinh ra. KHONG sua tay.

- Cong thuc: `dpsTarget(T) = 110 * 2.35^(T-1)`, meleeAdvantage = **0.307**, staminaRegen = 18/s
- anchorRoom(T) = 1, 8, 18, 30, 45, 60
- waveEHP(T) = (TP/1.6) * 40 * 1.068^(R-1) * 1.15
- So vu khi xu ly: **30**

## dpsTarget theo tier

| Tier | dpsTarget (ranged) | target melee (x0.307) |
|---|---|---|
| T1 | 110 | 34 |
| T2 | 259 | 79 |
| T3 | 607 | 186 |
| T4 | 1,428 | 438 |
| T5 | 3,355 | 1,030 |
| T6 | 7,884 | 2,420 |

## Before / After

| Vu khi | Lop | T | dmg cu | dmg moi | Doi | Metric | Sau chuan hoa | Muc tieu | Lech | Ghi chu |
|---|---|---|---|---|---|---|---|---|---|---|
| Kèn Đồng | ranged | 1 | 120 | 120 | 0.0% | dpsSustained | 172 | 110 | +56.6% CHECK | rpm 115 | mag 8 | mag clear 0.67 | TTK trash 0.23s |
| Miệng Hang | ranged | 1 | 120 | 120 | 0.0% | dpsSustained | 188 | 110 | +71.1% CHECK | rpm 48 | mag 2 | mag clear 0.67 | TTK trash 0.21s |
| Ổ Chuột | ranged | 1 | 120 | 120 | 0.0% | dpsSustained | 272 | 110 | +147.4% CHECK | rpm 230 | mag 10 | mag clear 0.84 | TTK trash 0.15s |
| Gọng Sắt | ranged | 2 | 120 | 120 | 0.0% | dpsSustained | 259 | 259 | 0.0% OK | rpm 155 | mag 26 | mag clear 0.53 | TTK trash 0.25s |
| Gai Mực | ranged | 2 | 446 | 446 | 0.0% | dpsSustained | 258 | 259 | -0.1% OK | rpm 51 | mag 4 | mag clear 0.30 | TTK trash 0.25s |
| Lồng Móc | ranged | 2 | 120 | 120 | 0.0% | dpsSustained | 600 | 259 | +132.1% CHECK | rpm 48 | mag 4 | mag clear 0.81 | TTK trash 0.11s |
| Mắt Cú | ranged | 3 | 443 | 443 | 0.0% | dpsSustained | 608 | 607 | +0.1% OK | rpm 105 | mag 14 | mag clear 0.29 | TTK trash 0.20s |
| Trống Đôi | ranged | 3 | 167 | 167 | 0.0% | dpsSustained | 606 | 607 | -0.3% OK | rpm 265 | mag 73 | mag clear 0.57 | TTK trash 0.20s |
| Hơi Ngầm | ranged | 3 | 120 | 120 | 0.0% | dpsSustained | 607 | 607 | 0.0% OK | rpm 349 | mag 109 | mag clear 0.61 | TTK trash 0.20s |
| Nồi Đất | ranged | 4 | 2953 | 2953 | 0.0% | dpsSustained | 1,428 | 1,428 | 0.0% OK | rpm 42 | mag 5 | mag clear 0.20 | TTK trash 0.19s |
| Mũi Kim | ranged | 4 | 327 | 327 | 0.0% | dpsSustained | 1,427 | 1,428 | 0.0% OK | rpm 320 | mag 48 | mag clear 0.21 | TTK trash 0.19s |
| Đinh Sắt | ranged | 4 | 3049 | 3049 | 0.0% | dpsSustained | 1,427 | 1,428 | 0.0% OK | rpm 34 | mag 7 | mag clear 0.29 | TTK trash 0.19s |
| Hàm Tối | ranged | 5 | 488 | 488 | 0.0% | dpsSustained | 3,352 | 3,355 | -0.1% OK | rpm 78 | mag 12 | mag clear 0.14 | TTK trash 0.22s |
| Ruột Đất | ranged | 5 | 1077 | 1077 | 0.0% | dpsSustained | 3,355 | 3,355 | 0.0% OK | rpm 210 | mag 85 | mag clear 0.32 | TTK trash 0.22s |
| Ống Sấm | ranged | 5 | 5823 | 5823 | 0.0% | dpsSustained | 3,355 | 3,355 | 0.0% OK | rpm 48 | mag 7 | mag clear 0.14 | TTK trash 0.22s |
| Lõi Nổ | ranged | 6 | 4280 | 4280 | 0.0% | dpsSustained | 7,884 | 7,884 | 0.0% OK | rpm 150 | mag 14 | mag clear 0.06 | TTK trash 0.25s |
| Miệng Mỏ | ranged | 6 | 570 | 570 | 0.0% | dpsSustained | 7,878 | 7,884 | -0.1% OK | rpm 102 | mag 10 | mag clear 0.07 | TTK trash 0.25s |
| Ruột Sắt | ranged | 6 | 1224 | 1224 | 0.0% | dpsSustained | 7,882 | 7,884 | 0.0% OK | rpm 460 | mag 181 | mag clear 0.22 | TTK trash 0.25s |
| Dao Găm | melee | 1 | 30 | 30 | 0.0% | dpsMeleeEff | 34 | 34 | -0.1% OK | interval 0.889s | targetFactor 3.45 | dmg/stamina 1.9 |
| Rựa Rừng | melee | 1 | 30 | 30 | 0.0% | dpsMeleeEff | 34 | 34 | -0.1% OK | interval 0.889s | targetFactor 3.45 | dmg/stamina 1.9 |
| Búa Đá | melee | 2 | 71 | 71 | 0.0% | dpsMeleeEff | 80 | 79 | +0.6% OK | interval 0.889s | targetFactor 3.45 | dmg/stamina 4.4 |
| Giáo Tre | melee | 2 | 71 | 71 | 0.0% | dpsMeleeEff | 80 | 79 | +0.6% OK | interval 0.889s | targetFactor 3.45 | dmg/stamina 4.4 |
| Đại Đao | melee | 3 | 166 | 166 | 0.0% | dpsMeleeEff | 187 | 186 | +0.1% OK | interval 0.889s | targetFactor 3.45 | dmg/stamina 10.4 |
| Song Đao | melee | 3 | 166 | 166 | 0.0% | dpsMeleeEff | 187 | 186 | +0.1% OK | interval 0.889s | targetFactor 3.45 | dmg/stamina 10.4 |
| Cưa Máy | melee | 4 | 390 | 390 | 0.0% | dpsMeleeEff | 439 | 438 | +0.1% OK | interval 0.889s | targetFactor 3.45 | dmg/stamina 24.4 |
| Phủ Nguyệt | melee | 4 | 390 | 390 | 0.0% | dpsMeleeEff | 439 | 438 | +0.1% OK | interval 0.889s | targetFactor 3.45 | dmg/stamina 24.4 |
| Lưỡi Liềm | melee | 5 | 915 | 915 | 0.0% | dpsMeleeEff | 1,029 | 1,030 | -0.1% OK | interval 0.889s | targetFactor 3.45 | dmg/stamina 57.2 |
| Chuỳ Trời | melee | 5 | 915 | 915 | 0.0% | dpsMeleeEff | 1,029 | 1,030 | -0.1% OK | interval 0.889s | targetFactor 3.45 | dmg/stamina 57.2 |
| Lưỡi Lõi | melee | 6 | 2151 | 2151 | 0.0% | dpsMeleeEff | 2,420 | 2,420 | 0.0% OK | interval 0.889s | targetFactor 3.45 | dmg/stamina 134.4 |
| Xẻ Long | melee | 6 | 2151 | 2151 | 0.0% | dpsMeleeEff | 2,420 | 2,420 | 0.0% OK | interval 0.889s | targetFactor 3.45 | dmg/stamina 134.4 |

## Ket luan

- Thay doi lon nhat: **0.0%**
- Moi vu khi bay gio nam dung tren duong cong tier. Cac rang buoc con lai (mag clear ratio,
  reserve waves, TTK trash, melee > ranged) do `audit_gdd.ps1` kiem tra va co the FAIL/WARN.
- Day la so **first-pass**: dung de bat dau playtest, khong phai so da tune.
