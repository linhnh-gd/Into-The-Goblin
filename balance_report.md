# Balance Report -- INTO THE GOBLIN

> File nay do `normalize_balance.ps1` sinh ra. KHONG sua tay.

- Cong thuc: `dpsTarget(T) = 110 * 2.35^(T-1)`, meleeAdvantage = **1.45**, staminaRegen = 18/s
- anchorRoom(T) = 1, 8, 18, 30, 45, 60
- waveEHP(T) = (TP/1.6) * 40 * 1.068^(R-1) * 1.15
- So vu khi xu ly: **30**

## dpsTarget theo tier

| Tier | dpsTarget (ranged) | target melee (x1.45) |
|---|---|---|
| T1 | 110 | 160 |
| T2 | 259 | 375 |
| T3 | 607 | 881 |
| T4 | 1,428 | 2,070 |
| T5 | 3,355 | 4,864 |
| T6 | 7,884 | 11,431 |

## Before / After

| Vu khi | Lop | T | dmg cu | dmg moi | Doi | Metric | Sau chuan hoa | Muc tieu | Lech | Ghi chu |
|---|---|---|---|---|---|---|---|---|---|---|
| Kèn Đồng | ranged | 1 | 44 | 44 | 0.0% | dpsSustained | 110 | 110 | 0.0% OK | mag clear 0.59 | reserve 7.1 wave | TTK trash 0.36s |
| Miệng Hang | ranged | 1 | 29 | 29 | 0.0% | dpsSustained | 110 | 110 | +0.4% OK | mag clear 0.89 | reserve 7.1 wave | TTK trash 0.36s |
| Ổ Chuột | ranged | 1 | 17.8 | 17.8 | 0.0% | dpsSustained | 110 | 110 | 0.0% OK | mag clear 0.75 | reserve 7.0 wave | TTK trash 0.36s |
| Gọng Sắt | ranged | 2 | 60 | 60 | 0.0% | dpsSustained | 257 | 259 | -0.7% OK | mag clear 0.61 | reserve 7.0 wave | TTK trash 0.25s |
| Gai Mực | ranged | 2 | 448 | 448 | 0.0% | dpsSustained | 258 | 259 | 0.0% OK | mag clear 0.62 | reserve 7.0 wave | TTK trash 0.25s |
| Lồng Móc | ranged | 2 | 33 | 33 | 0.0% | dpsSustained | 261 | 259 | +0.8% OK | mag clear 0.76 | reserve 7.0 wave | TTK trash 0.24s |
| Mắt Cú | ranged | 3 | 324 | 324 | 0.0% | dpsSustained | 608 | 607 | 0.0% OK | mag clear 0.45 | reserve 2.9 wave | TTK trash 0.20s |
| Trống Đôi | ranged | 3 | 95 | 95 | 0.0% | dpsSustained | 606 | 607 | -0.2% OK | mag clear 0.72 | reserve 4.3 wave | TTK trash 0.20s |
| Hơi Ngầm | ranged | 3 | 59 | 59 | 0.0% | dpsSustained | 603 | 607 | -0.7% OK | mag clear 0.67 | reserve 4.0 wave | TTK trash 0.20s |
| Nồi Đất | ranged | 4 | 2855 | 2855 | 0.0% | dpsSustained | 1,428 | 1,428 | 0.0% OK | mag clear 0.42 | reserve 2.5 wave | TTK trash 0.19s |
| Mũi Kim | ranged | 4 | 149 | 149 | 0.0% | dpsSustained | 1,425 | 1,428 | -0.2% OK | mag clear 0.22 | reserve 1.5 wave | TTK trash 0.19s |
| Đinh Sắt | ranged | 4 | 2884 | 2884 | 0.0% | dpsSustained | 1,428 | 1,428 | 0.0% OK | mag clear 0.53 | reserve 3.7 wave | TTK trash 0.19s |
| Hàm Tối | ranged | 5 | 288 | 288 | 0.0% | dpsSustained | 3,360 | 3,355 | +0.2% OK | mag clear 0.19 | reserve 1.3 wave | TTK trash 0.22s |
| Ruột Đất | ranged | 5 | 563 | 563 | 0.0% | dpsSustained | 3,354 | 3,355 | 0.0% OK | mag clear 0.37 | reserve 2.2 wave | TTK trash 0.22s |
| Ống Sấm | ranged | 5 | 4777 | 4777 | 0.0% | dpsSustained | 3,355 | 3,355 | 0.0% OK | mag clear 0.27 | reserve 1.6 wave | TTK trash 0.22s |
| Lõi Nổ | ranged | 6 | 3285 | 3285 | 0.0% | dpsSustained | 7,884 | 7,884 | 0.0% OK | mag clear 0.11 | reserve 0.7 wave | TTK trash 0.25s |
| Miệng Mỏ | ranged | 6 | 558 | 558 | 0.0% | dpsSustained | 7,878 | 7,884 | -0.1% OK | mag clear 0.14 | reserve 1.0 wave | TTK trash 0.25s |
| Ruột Sắt | ranged | 6 | 574 | 574 | 0.0% | dpsSustained | 7,878 | 7,884 | -0.1% OK | mag clear 0.23 | reserve 1.4 wave | TTK trash 0.25s |
| Dao Găm | melee | 1 | 79 | 79 | 0.0% | dpsMeleeEff | 160 | 160 | +0.3% OK | interval 0.667s | targetFactor 1.35 | dmg/stamina 6.6 |
| Rựa Rừng | melee | 1 | 94 | 94 | 0.0% | dpsMeleeEff | 160 | 160 | +0.2% OK | interval 1.000s | targetFactor 1.70 | dmg/stamina 5.2 |
| Búa Đá | melee | 2 | 355 | 355 | 0.0% | dpsMeleeEff | 375 | 375 | +0.1% OK | interval 1.278s | targetFactor 1.35 | dmg/stamina 15.4 |
| Giáo Tre | melee | 2 | 196 | 196 | 0.0% | dpsMeleeEff | 375 | 375 | 0.0% OK | interval 0.889s | targetFactor 1.70 | dmg/stamina 12.3 |
| Đại Đao | melee | 3 | 427 | 427 | 0.0% | dpsMeleeEff | 881 | 881 | 0.0% OK | interval 1.333s | targetFactor 2.75 | dmg/stamina 17.8 |
| Song Đao | melee | 3 | 326 | 326 | 0.0% | dpsMeleeEff | 880 | 881 | -0.1% OK | interval 0.500s | targetFactor 1.35 | dmg/stamina 36.2 |
| Cưa Máy | melee | 4 | 1488 | 1488 | 0.0% | dpsMeleeEff | 2,070 | 2,070 | 0.0% OK | interval 1.222s | targetFactor 1.70 | dmg/stamina 67.6 |
| Phủ Nguyệt | melee | 4 | 1346 | 1346 | 0.0% | dpsMeleeEff | 2,069 | 2,070 | 0.0% OK | interval 1.333s | targetFactor 2.05 | dmg/stamina 56.1 |
| Lưỡi Liềm | melee | 5 | 2179 | 2179 | 0.0% | dpsMeleeEff | 4,864 | 4,864 | 0.0% OK | interval 1.389s | targetFactor 3.10 | dmg/stamina 87.2 |
| Chuỳ Trời | melee | 5 | 3974 | 3974 | 0.0% | dpsMeleeEff | 4,864 | 4,864 | 0.0% OK | interval 1.389s | targetFactor 1.70 | dmg/stamina 159.0 |
| Lưỡi Lõi | melee | 6 | 6196 | 6196 | 0.0% | dpsMeleeEff | 11,432 | 11,431 | 0.0% OK | interval 1.111s | targetFactor 2.05 | dmg/stamina 309.8 |
| Xẻ Long | melee | 6 | 4602 | 4602 | 0.0% | dpsMeleeEff | 11,431 | 11,431 | 0.0% OK | interval 1.389s | targetFactor 3.45 | dmg/stamina 184.1 |

## Ket luan

- Thay doi lon nhat: **0.0%**
- Moi vu khi bay gio nam dung tren duong cong tier. Cac rang buoc con lai (mag clear ratio,
  reserve waves, TTK trash, melee > ranged) do `audit_gdd.ps1` kiem tra va co the FAIL/WARN.
- Day la so **first-pass**: dung de bat dau playtest, khong phai so da tune.
