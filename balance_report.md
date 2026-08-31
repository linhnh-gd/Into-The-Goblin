# Balance Report -- INTO THE GOBLIN

> File nay do `normalize_balance.ps1` sinh ra. KHONG sua tay.

- Cong thuc: `dpsTarget(T) = 110 * 2.35^(T-1)`, meleeAdvantage = **0.8**, staminaRegen = 18/s
- anchorRoom(T) = 1, 8, 18, 30, 45, 60
- waveEHP(T) = (TP/1.6) * 40 * 1.068^(R-1) * 1.15
- So vu khi xu ly: **30**

## dpsTarget theo tier

| Tier | dpsTarget (ranged) | target melee (x0.8) |
|---|---|---|
| T1 | 110 | 88 |
| T2 | 259 | 207 |
| T3 | 607 | 486 |
| T4 | 1,428 | 1,142 |
| T5 | 3,355 | 2,684 |
| T6 | 7,884 | 6,307 |

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
| Dao Găm | melee | 1 | 142 | 78 | -45.1% | dpsMeleeEff | 88 | 88 | -0.3% OK | interval 0.889s | targetFactor 3.45 | dmg/stamina 4.9 |
| Rựa Rừng | melee | 1 | 142 | 78 | -45.1% | dpsMeleeEff | 88 | 88 | -0.3% OK | interval 0.889s | targetFactor 3.45 | dmg/stamina 4.9 |
| Búa Đá | melee | 2 | 333 | 184 | -44.7% | dpsMeleeEff | 207 | 207 | +0.1% OK | interval 0.889s | targetFactor 3.45 | dmg/stamina 11.5 |
| Giáo Tre | melee | 2 | 333 | 184 | -44.7% | dpsMeleeEff | 207 | 207 | +0.1% OK | interval 0.889s | targetFactor 3.45 | dmg/stamina 11.5 |
| Đại Đao | melee | 3 | 783 | 432 | -44.8% | dpsMeleeEff | 486 | 486 | 0.0% OK | interval 0.889s | targetFactor 3.45 | dmg/stamina 27.0 |
| Song Đao | melee | 3 | 783 | 432 | -44.8% | dpsMeleeEff | 486 | 486 | 0.0% OK | interval 0.889s | targetFactor 3.45 | dmg/stamina 27.0 |
| Cưa Máy | melee | 4 | 1840 | 1015 | -44.8% | dpsMeleeEff | 1,142 | 1,142 | 0.0% OK | interval 0.889s | targetFactor 3.45 | dmg/stamina 63.4 |
| Phủ Nguyệt | melee | 4 | 1840 | 1015 | -44.8% | dpsMeleeEff | 1,142 | 1,142 | 0.0% OK | interval 0.889s | targetFactor 3.45 | dmg/stamina 63.4 |
| Lưỡi Liềm | melee | 5 | 4324 | 2386 | -44.8% | dpsMeleeEff | 2,684 | 2,684 | 0.0% OK | interval 0.889s | targetFactor 3.45 | dmg/stamina 149.1 |
| Chuỳ Trời | melee | 5 | 4324 | 2386 | -44.8% | dpsMeleeEff | 2,684 | 2,684 | 0.0% OK | interval 0.889s | targetFactor 3.45 | dmg/stamina 149.1 |
| Lưỡi Lõi | melee | 6 | 10161 | 5606 | -44.8% | dpsMeleeEff | 6,307 | 6,307 | 0.0% OK | interval 0.889s | targetFactor 3.45 | dmg/stamina 350.4 |
| Xẻ Long | melee | 6 | 10161 | 5606 | -44.8% | dpsMeleeEff | 6,307 | 6,307 | 0.0% OK | interval 0.889s | targetFactor 3.45 | dmg/stamina 350.4 |

## Ket luan

- Thay doi lon nhat: **45.1%**
- Moi vu khi bay gio nam dung tren duong cong tier. Cac rang buoc con lai (mag clear ratio,
  reserve waves, TTK trash, melee > ranged) do `audit_gdd.ps1` kiem tra va co the FAIL/WARN.
- Day la so **first-pass**: dung de bat dau playtest, khong phai so da tune.
