# Balance Report -- INTO THE GOBLIN

> File nay do `normalize_balance.ps1` sinh ra. KHONG sua tay.

- Cong thuc: `dpsTarget(T) = 110 * 2.35^(T-1)`, meleeAdvantage = **0.55**, staminaRegen = 18/s
- anchorRoom(T) = 1, 8, 18, 30, 45, 60
- waveEHP(T) = (TP/1.6) * 40 * 1.068^(R-1) * 1.15
- So vu khi xu ly: **30**

## dpsTarget theo tier

| Tier | dpsTarget (ranged) | target melee (x0.55) |
|---|---|---|
| T1 | 110 | 61 |
| T2 | 259 | 142 |
| T3 | 607 | 334 |
| T4 | 1,428 | 785 |
| T5 | 3,355 | 1,845 |
| T6 | 7,884 | 4,336 |

## Before / After

| Vu khi | Lop | T | dmg cu | dmg moi | Doi | Metric | Sau chuan hoa | Muc tieu | Lech | Ghi chu |
|---|---|---|---|---|---|---|---|---|---|---|
| Kèn Đồng | ranged | 1 | 45 | 45 | 0.0% | dpsSustained | 109 | 110 | -0.5% OK | mag clear 0.69 | reserve 7.2 wave | TTK trash 0.37s |
| Miệng Hang | ranged | 1 | 31 | 31 | 0.0% | dpsSustained | 112 | 110 | +1.4% OK | mag clear 0.95 | reserve 7.6 wave | TTK trash 0.36s |
| Ổ Chuột | ranged | 1 | 18 | 18 | 0.0% | dpsSustained | 110 | 110 | 0.0% OK | mag clear 0.89 | reserve 7.1 wave | TTK trash 0.36s |
| Gọng Sắt | ranged | 2 | 63 | 63 | 0.0% | dpsSustained | 257 | 259 | -0.7% OK | mag clear 0.76 | reserve 7.3 wave | TTK trash 0.25s |
| Gai Mực | ranged | 2 | 446 | 446 | 0.0% | dpsSustained | 258 | 259 | -0.1% OK | mag clear 0.82 | reserve 7.0 wave | TTK trash 0.25s |
| Lồng Móc | ranged | 2 | 31 | 33 | +6.5% | dpsSustained | 256 | 259 | -1.0% OK | mag clear 0.91 | reserve 7.0 wave | TTK trash 0.25s |
| Mắt Cú | ranged | 3 | 334 | 334 | 0.0% | dpsSustained | 608 | 607 | +0.1% OK | mag clear 0.59 | reserve 3.0 wave | TTK trash 0.20s |
| Trống Đôi | ranged | 3 | 99 | 99 | 0.0% | dpsSustained | 606 | 607 | -0.3% OK | mag clear 0.92 | reserve 4.5 wave | TTK trash 0.20s |
| Hơi Ngầm | ranged | 3 | 63 | 63 | 0.0% | dpsSustained | 604 | 607 | -0.6% OK | mag clear 0.87 | reserve 4.3 wave | TTK trash 0.20s |
| Nồi Đất | ranged | 4 | 2953 | 2953 | 0.0% | dpsSustained | 1,428 | 1,428 | 0.0% OK | mag clear 0.54 | reserve 2.6 wave | TTK trash 0.19s |
| Mũi Kim | ranged | 4 | 151 | 151 | 0.0% | dpsSustained | 1,425 | 1,428 | -0.2% OK | mag clear 0.27 | reserve 1.6 wave | TTK trash 0.19s |
| Đinh Sắt | ranged | 4 | 3049 | 3049 | 0.0% | dpsSustained | 1,427 | 1,428 | 0.0% OK | mag clear 0.79 | reserve 3.9 wave | TTK trash 0.19s |
| Hàm Tối | ranged | 5 | 289 | 289 | 0.0% | dpsSustained | 3,355 | 3,355 | 0.0% OK | mag clear 0.23 | reserve 1.3 wave | TTK trash 0.22s |
| Ruột Đất | ranged | 5 | 613 | 613 | 0.0% | dpsSustained | 3,355 | 3,355 | 0.0% OK | mag clear 0.49 | reserve 2.4 wave | TTK trash 0.22s |
| Ống Sấm | ranged | 5 | 5041 | 5041 | 0.0% | dpsSustained | 3,355 | 3,355 | 0.0% OK | mag clear 0.33 | reserve 1.7 wave | TTK trash 0.22s |
| Lõi Nổ | ranged | 6 | 3445 | 3445 | 0.0% | dpsSustained | 7,884 | 7,884 | 0.0% OK | mag clear 0.13 | reserve 0.8 wave | TTK trash 0.25s |
| Miệng Mỏ | ranged | 6 | 570 | 570 | 0.0% | dpsSustained | 7,878 | 7,884 | -0.1% OK | mag clear 0.18 | reserve 1.0 wave | TTK trash 0.25s |
| Ruột Sắt | ranged | 6 | 595 | 595 | 0.0% | dpsSustained | 7,890 | 7,884 | +0.1% OK | mag clear 0.29 | reserve 1.4 wave | TTK trash 0.25s |
| Dao Găm | melee | 1 | 54 | 54 | 0.0% | dpsMeleeEff | 61 | 61 | +0.4% OK | interval 0.889s | targetFactor 3.45 | dmg/stamina 3.4 |
| Rựa Rừng | melee | 1 | 54 | 54 | 0.0% | dpsMeleeEff | 61 | 61 | +0.4% OK | interval 0.889s | targetFactor 3.45 | dmg/stamina 3.4 |
| Búa Đá | melee | 2 | 126 | 126 | 0.0% | dpsMeleeEff | 142 | 142 | -0.3% OK | interval 0.889s | targetFactor 3.45 | dmg/stamina 7.9 |
| Giáo Tre | melee | 2 | 126 | 126 | 0.0% | dpsMeleeEff | 142 | 142 | -0.3% OK | interval 0.889s | targetFactor 3.45 | dmg/stamina 7.9 |
| Đại Đao | melee | 3 | 297 | 297 | 0.0% | dpsMeleeEff | 334 | 334 | 0.0% OK | interval 0.889s | targetFactor 3.45 | dmg/stamina 18.6 |
| Song Đao | melee | 3 | 297 | 297 | 0.0% | dpsMeleeEff | 334 | 334 | 0.0% OK | interval 0.889s | targetFactor 3.45 | dmg/stamina 18.6 |
| Cưa Máy | melee | 4 | 698 | 698 | 0.0% | dpsMeleeEff | 785 | 785 | 0.0% OK | interval 0.889s | targetFactor 3.45 | dmg/stamina 43.6 |
| Phủ Nguyệt | melee | 4 | 698 | 698 | 0.0% | dpsMeleeEff | 785 | 785 | 0.0% OK | interval 0.889s | targetFactor 3.45 | dmg/stamina 43.6 |
| Lưỡi Liềm | melee | 5 | 1640 | 1640 | 0.0% | dpsMeleeEff | 1,845 | 1,845 | 0.0% OK | interval 0.889s | targetFactor 3.45 | dmg/stamina 102.5 |
| Chuỳ Trời | melee | 5 | 1640 | 1640 | 0.0% | dpsMeleeEff | 1,845 | 1,845 | 0.0% OK | interval 0.889s | targetFactor 3.45 | dmg/stamina 102.5 |
| Lưỡi Lõi | melee | 6 | 3854 | 3854 | 0.0% | dpsMeleeEff | 4,336 | 4,336 | 0.0% OK | interval 0.889s | targetFactor 3.45 | dmg/stamina 240.9 |
| Xẻ Long | melee | 6 | 3854 | 3854 | 0.0% | dpsMeleeEff | 4,336 | 4,336 | 0.0% OK | interval 0.889s | targetFactor 3.45 | dmg/stamina 240.9 |

## Ket luan

- Thay doi lon nhat: **6.5%**
- Moi vu khi bay gio nam dung tren duong cong tier. Cac rang buoc con lai (mag clear ratio,
  reserve waves, TTK trash, melee > ranged) do `audit_gdd.ps1` kiem tra va co the FAIL/WARN.
- Day la so **first-pass**: dung de bat dau playtest, khong phai so da tune.
