# 11 — Economy

Docs: *"Khi giết kẻ địch sẽ bung ra nhiều vàng, feeling đã mắt, vfx bùm bùm"*.
Vàng là **cả phần thưởng cảm xúc lẫn tiền tệ**. Cả hai vai trò đều phải được thiết kế.

Dữ liệu: `data/economy.json` → `gen-economy.md`. Audit `audit_gdd.ps1` cưỡng chế:
**mọi currency phải có ≥1 nguồn VÀ ≥1 chỗ tiêu.**

---

## 1. Bảng currency

| Currency | Ký hiệu | Loại | Nguồn | Chỗ tiêu |
|---|---|---|---|---|
| **Vàng** | `gold` | soft, dùng cả trong run và ngoài | Kill, cột vàng, hòm, event, Lò Vàng, Hầm Vàng (idle), quest | Shop trong run, Cột Chống Hầm, đổi Lộc ở Miếu Mỏ, Cân Vàng, reroll thẻ, nâng level vũ khí, talent bậc thấp, Trại Mỏ |
| **Lộc** | `luck` | **run** — chỉ tồn tại trong 1 run | Elite +2, hòm +1, clear phòng không mất máu +1, mỗi 10 Chém Hoàn Hảo +1, boss +3, talent `Lộc Sẵn` | Miếu Mỏ (đổi thẻ epic / hồi máu), Suối Máu |
| **Mảnh Cốt** | `shards` | meta, khó | Clear Depth, boss, đổi vũ khí/relic trùng, challenge | Talent bậc cao, mở tier vũ khí, slot khắc |
| **Phôi Rèn** | `ingots` | material | Boss, Kho báu, Elite Depth, Daily | Lên Tier vũ khí (T→T+1) |
| **Ngọc** | `gems` | hard / premium | IAP, quest tuần, achievement, ad thưởng (ít) | Bundle, Sổ Thợ Hầm, mở nhanh, skin, revive thứ 2 |
| **Dầu Đèn** | `tickets` | entry | 3 bình/ngày miễn phí (hồi 1 bình / 4 giờ), quest, IAP | Vào **Daily Hầm** và **Event Hầm** (KHÔNG gate Depth chính) |

> **Depth 1–7 và Endless không bao giờ tốn Dầu Đèn.** Bài học từ Archero: energy chỉ nên gate live content.
> Gate mode chính là cách nhanh nhất giết D1.

## 2. Vàng: thiết kế cảm xúc

| Thứ | Quy tắc |
|---|---|
| Rơi ra | Mỗi kill nổ **3–14 đồng** tuỳ hạng quái (không phải 1 cục — phải là *chùm*) |
| Vật lý | Đồng xu bay theo lực chết (đạn = bay ra sau, dao = bay theo hướng quẹt), nảy 2 lần, nằm sàn 0.35s |
| Hút | Sau 0.35s tự bay về người chơi theo đường cong ease-in, 0.5s |
| Bán kính hút | 6m base · x2 khi combo ≥ 5 · x3 khi dọn sạch phòng (tất cả bay về) |
| Âm | **Coin chime ladder**: mỗi đồng liên tiếp trong 1.5s tăng nửa cung, reset sau 1.5s, cap 2 quãng tám. Đây là cái làm người ta chơi thêm 1 run |
| Cột vàng (Depth 3+) | Kill trash có `4% + 0.4%/Lộc` ra **cột sáng vàng** = 25x vàng, kèm tiếng cồng trầm |
| Số hiển thị | Bộ đếm vàng ở HUD **giật nảy + phóng to 1.15x** mỗi lần tăng, không tăng mượt (tăng mượt = không cảm thấy gì) |

## 3. Gold curve (target thu nhập)

```
goldPerKill(enemy, D) = enemy.goldDrop
                        * 1.15 ^ (D - 1)     <- Depth
                        * campGoldBonus      <- meta Trai Mo (1.00 - 1.60)
                        * doorTagMult        <- tag cua: 1.00 / "dong" 1.25 / "toi" 1.30
```

> **Không có hệ số nhân toàn cục nào.** Vàng chỉ phụ thuộc Depth, meta Trại Mỏ, và tag của cửa người chơi
> đã chọn. Bản trước của doc này có hệ Greed nhân tới x23.3 (cơ chế của Guns n Goblins) — đã bỏ hẳn.

Vàng dự kiến **không phải số đoán tay**: nó được tính từ chính `waves.json` (TP director) và
`enemies.json` (goldDrop), và `audit_gdd.ps1` đối chiếu lại con số khai báo trong `depths.json` (±40%).

| Mốc | Vàng của Depth đó | Tích luỹ |
|---|---|---|
| Depth 1 clear | **1,400** | 1,400 |
| Depth 2 clear | 3,100 | 4,500 |
| Depth 3 clear | 5,450 | 9,950 |
| Depth 4 clear | 8,650 | 18,600 |
| Depth 5 clear | 13,150 | 31,750 |
| Depth 6 clear | 19,450 | 51,200 |
| Depth 7 clear | 31,900 | 83,100 |
| Endless phòng 40 (R=110), 1 run | — | ~600,000 |

## 4. Sink: giá tham chiếu

| Sink | Giá |
|---|---|
| Shop: 1 băng đạn | 60 vàng |
| Shop: hồi 30% HP | 180 vàng |
| Shop: 1 thẻ ngẫu nhiên | 250 vàng |
| Shop: thẻ epic chọn từ 3 | 700 vàng |
| Shop: Cột Chống Hầm (hoãn Sương Đen +20s cho 3 phòng) | 400 vàng |
| Miếu Mỏ: 4 Lộc → thẻ epic chọn từ 3 | 200 vàng (kèm 4 Lộc) |
| Miếu Mỏ: 6 Lộc → hồi đầy HP | 350 vàng (kèm 6 Lộc) |
| Reroll thẻ ở Cổng | 80 vàng (lần đầu mỗi Depth miễn phí) |
| Nâng vũ khí level 1→2 | 120 vàng |
| Nâng vũ khí level 30→31 | 34,000 vàng |
| Talent bậc 1 | 500 vàng |
| Talent bậc 5 | 12,000 vàng + 40 Mảnh Cốt |
| Trại Mỏ building lv1 | 2,000 vàng |
| Trại Mỏ building lv10 | 380,000 vàng |

**Quy tắc chống lạm phát:** vàng chưa tiêu khi chết **được giữ** (không mất — mất tiền khi chết là hình
phạt kép, làm người chơi sợ đi sâu). Nhưng **Trại Mỏ là hố tiêu không đáy** để hút vàng
late-game.

## 5. Cân bằng nguồn / chỗ tiêu

```
   NGUỒN                                    CHỖ TIÊU
   ------------------------                 --------------------------
   Kill (vàng)  ---------------------------> Shop trong run (đạn/máu/thẻ)
   Hòm, Event  ----------------------------> Cột Chống Hầm / đổi Lộc ở Miếu Mỏ
   Gauntlet  ------------------------------> Reroll thẻ
   Idle Hầm Vàng  -------------------------> Nâng level vũ khí (hố lớn nhất)
   Quest / Challenge  ---------------------> Talent
   Clear Depth (mảnh)  --------------------> Talent bậc cao, tier vũ khí
   Boss (phôi rèn)  -----------------------> Lên Tier
   Đồ trùng (mảnh)  -----------------------> Talent
   IAP / quest tuần (ngọc)  ---------------> Sổ Thợ Hầm, bundle, skin
   Vé miễn phí 3/ngày  --------------------> Daily Hầm, Event Hầm
```

Không có currency nào một chiều. Audit `audit_gdd.ps1` kiểm tra tự động và **fail build** nếu vi phạm.

## 6. Ràng buộc (audit)

1. Mọi currency trong `economy.json` có `sources.length ≥ 1` **và** `sinks.length ≥ 1`.
2. Mọi item trong `shop` có `price > 0` và `currency` tồn tại.
3. `expectedGoldG0` của mỗi Depth ≥ **2 × (đạn rẻ nhất + máu rẻ nhất)** = 480 vàng — shop phải dùng được thật.
4. `expectedGoldG0` khai báo phải khớp **mô hình tính từ data** (TP director × goldDrop) trong ±40%.
5. `goldCurve[i].expectedGold` phải bằng **tổng tích luỹ** `expectedGoldG0` từ Depth 1 tới Depth đó, trong ±10%.
6. `goldCurve` tăng đơn điệu theo mốc.
7. `tickets` **không** được xuất hiện trong `entryCost` của Depth 1–7 hay Endless.
