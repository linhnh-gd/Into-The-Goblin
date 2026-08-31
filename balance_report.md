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
| Kèn Đồng | ranged | 1 | 128 | 128 | 0.0% | dpsSustained | 237 | 110 | +115.5% OK | rpm 150 | mag 10 | ban het bang 4.0s | 10.0 mang/bang tren wave 31 con | reserve 7.0 wave |
| Miệng Hang | ranged | 1 | 64 | 64 | 0.0% | dpsSustained | 358 | 110 | +225.1% OK | rpm 55 | mag 5 | ban het bang 5.5s | 20.3 mang/bang tren wave 31 con | reserve 6.9 wave |
| Ổ Chuột | ranged | 1 | 120 | 120 | 0.0% | dpsSustained | 742 | 110 | +574.6% OK | rpm 700 | mag 25 | ban het bang 2.1s | 25.0 mang/bang tren wave 31 con | reserve 7.0 wave |
| Gọng Sắt | ranged | 2 | 285 | 285 | 0.0% | dpsSustained | 1,549 | 259 | +499.2% OK | rpm 600 | mag 25 | ban het bang 2.5s | 25.0 mang/bang tren wave 81 con | reserve 7.0 wave |
| Gai Mực | ranged | 2 | 824 | 824 | 0.0% | dpsSustained | 477 | 259 | +84.6% OK | rpm 51 | mag 4 | ban het bang 4.7s | 7.8 mang/bang tren wave 81 con | reserve 7.0 wave |
| Lồng Móc | ranged | 2 | 101 | 101 | 0.0% | dpsSustained | 538 | 259 | +108.0% OK | rpm 55 | mag 5 | ban het bang 5.5s | 20.3 mang/bang tren wave 81 con | reserve 7.0 wave |
| Mắt Cú | ranged | 3 | 1224 | 1224 | 0.0% | dpsSustained | 1,527 | 607 | +151.4% OK | rpm 105 | mag 10 | ban het bang 5.7s | 15.0 mang/bang tren wave 153 con | reserve 7.0 wave |
| Trống Đôi | ranged | 3 | 514 | 514 | 0.0% | dpsSustained | 3,771 | 607 | +520.7% OK | rpm 650 | mag 100 | ban het bang 9.2s | 100.0 mang/bang tren wave 153 con | reserve 7.0 wave |
| Hơi Ngầm | ranged | 3 | 367 | 367 | 0.0% | dpsSustained | 2,669 | 607 | +339.4% OK | rpm 600 | mag 80 | ban het bang 8.0s | 40.0 mang/bang tren wave 153 con | reserve 7.0 wave |
| Nồi Đất | ranged | 4 | 2426 | 2426 | 0.0% | dpsSustained | 1,237 | 1,428 | -13.4% OK | rpm 42 | mag 6 | ban het bang 8.6s | 10.5 mang/bang tren wave 239 con | reserve 7.0 wave |
| Mũi Kim | ranged | 4 | 809 | 809 | 0.0% | dpsSustained | 5,458 | 1,428 | +282.4% OK | rpm 700 | mag 32 | ban het bang 2.7s | 32.0 mang/bang tren wave 239 con | reserve 7.0 wave |
| Đinh Sắt | ranged | 4 | 6469 | 6469 | 0.0% | dpsSustained | 2,856 | 1,428 | +100.1% OK | rpm 34 | mag 6 | ban het bang 10.6s | 14.4 mang/bang tren wave 239 con | reserve 7.0 wave |
| Hàm Tối | ranged | 5 | 1157 | 1157 | 0.0% | dpsSustained | 9,100 | 3,355 | +171.3% OK | rpm 78 | mag 8 | ban het bang 6.2s | 32.4 mang/bang tren wave 347 con | reserve 7.0 wave |
| Ruột Đất | ranged | 5 | 2314 | 2314 | 0.0% | dpsSustained | 7,029 | 3,355 | +109.5% OK | rpm 210 | mag 69 | ban het bang 19.7s | 120.8 mang/bang tren wave 347 con | reserve 7.0 wave |
| Ống Sấm | ranged | 5 | 6508 | 6508 | 0.0% | dpsSustained | 3,425 | 3,355 | +2.1% OK | rpm 45 | mag 6 | ban het bang 8.0s | 10.5 mang/bang tren wave 347 con | reserve 7.0 wave |
| Lõi Nổ | ranged | 6 | 32977 | 32977 | 0.0% | dpsSustained | 57,351 | 7,884 | +627.5% OK | rpm 150 | mag 16 | ban het bang 6.4s | 28.0 mang/bang tren wave 455 con | reserve 7.0 wave |
| Miệng Mỏ | ranged | 6 | 32977 | 32977 | 0.0% | dpsSustained | 43,207 | 7,884 | +448.1% OK | rpm 102 | mag 16 | ban het bang 9.4s | 28.0 mang/bang tren wave 455 con | reserve 7.0 wave |
| Ruột Sắt | ranged | 6 | 5819 | 5819 | 0.0% | dpsSustained | 99,754 | 7,884 | +1165.3% OK | rpm 1,800 | mag 200 | ban het bang 6.7s | 200.0 mang/bang tren wave 455 con | reserve 7.0 wave |
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
