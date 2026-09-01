# 15 — Art Direction & Audio

## 1. Art direction một câu

> **Dark fantasy hầm mỏ, nhìn qua ánh đuốc: nền tối gần như đen, quái là bóng đen với mắt đỏ, và vàng là
> thứ duy nhất phát sáng ấm.**

Lý do đây là hướng đúng (không chỉ vì đẹp):

| Quyết định art | Lợi ích gameplay | Lợi ích kỹ thuật |
|---|---|---|
| Nền tối, tương phản cao | Quái luôn đọc được dù 150 con | Giảm chi tiết môi trường |
| Quái ở dải Xa = silhouette + mắt phát sáng | Nhận dạng theo hình, không theo texture | **LOD thấp không bị phát hiện** → chạy được 200 agent |
| Vàng là màu ấm duy nhất | Mắt tự động bị hút về reward | Bloom một màu, cheap |
| Máu quái xanh đen | Không lẫn với vàng, và dễ qua kiểm duyệt store | 1 atlas hạt |
| Hành lang hẹp, cửa vòm | Portrait framing tự nhiên | Cull nhanh, không cần open space |

## 2. Bảng màu

| Vai trò | Màu | Dùng ở đâu |
|---|---|---|
| Nền hầm | `#0B0D10` → `#161A20` | tường, sàn |
| Quái | `#2A323C` (bóng) + mắt `#FF3B30` | mọi enemy |
| Nguy hiểm / telegraph | `#FF3B30` | viền đòn đánh, đạn địch |
| Vàng / reward | `#FFC53D` → `#FF8A00` | vàng, thẻ, cột sáng |
| Lộc / Elite | `#B14CFF` (tím) | Icon Lộc, outline Elite, viền màn hình khi Sương Đen |
| Người chơi (tay, vũ khí) | `#C9CDD4` kim loại lạnh | viewmodel |
| Elite | `#B14CFF` outline xuyên vật thể | luôn thấy |
| Boss | `#FF3B30` + `#FFC53D` | |

**Luật tuyệt đối:** không bao giờ dùng vàng/cam cho kẻ địch. Vàng = thưởng, mãi mãi.

## 3. Depth ảnh hưởng art (visual escalation)

Người chơi phải **cảm** được mình đang xuống sâu, không cần đọc số. Mỗi Depth đổi ít nhất một thứ nhìn thấy được.

| Depth | Biome | Thay đổi nhìn thấy |
|---|---|---|
| 1 | Hầm Đá | Đuốc vàng ấm, đá xám, nước nhỏ giọt. Yên nhất |
| 2 | Mỏ Cũ | Đường ray, xe goòng, bụi than lơ lửng trong luồng đuốc |
| 3 | Hang Nấm | Nấm phát quang xanh lam — **nguồn sáng đầu tiên không phải màu vàng** |
| 4 | Xưởng Rèn | Lò nung đỏ, tia lửa bay, nhiệt độ màu ấm hẳn lên |
| 5 | Nhà Tù | Lồng sắt, xương, đuốc lụi dần — dải Xa tối nhất game |
| 6 | Đền Vàng | Quặng vàng lộ thiên trên tường, tượng thợ mỏ, tím và vàng |
| 7 | Lõi Đỏ | Đá nóng chảy, rễ quặng đập như mạch máu, đỏ rực, nền rung liên tục |

**Ngoài Depth, có ba trạng thái art bật theo tình huống:**

| Trạng thái | Điều kiện | Thay đổi |
|---|---|---|
| **Cửa tối** | Người chơi chọn cửa tag `tối` | Dải Xa chỉ còn mắt đỏ; đuốc thu bán kính 40% |
| **Sương Đen** | Ở trong phòng > 35s (28s từ phòng 8) | Vignette đen bò vào 6%/5s, viền tím, hạt tro |
| **Đông** | Số quái sống > 60 | Thêm layer nhạc; bụi mù chân do quái chạy; camera rung nền rất nhẹ |

## 4. Ngân sách asset (v1)

| Loại | Số lượng | Ghi chú |
|---|---|---|
| Enemy model | 18 base + 6 boss | Mỗi base có 2 biến thể màu/mũ để tạo cảm giác đa dạng |
| Poly / enemy | 1.2k (full) / 300 (crowd) / billboard (dải Xa) | 3 mức LOD |
| Animation / enemy | 6 (idle, đi, chạy, đánh, bị đẩy, chết) + ragdoll | Chia sẻ rig giữa các goblin |
| Vũ khí viewmodel | 30 (18 ranged + 12 melee) | Dùng chung tay, chỉ đổi mesh vũ khí |
| Module hầm | 24 module ghép (hành lang, phòng vuông, cầu, hang) | Ghép ngẫu nhiên theo seed |
| Biome | 7 (1 / Depth): hầm đá, mỏ cũ, hang nấm, xưởng rèn, nhà tù, đền vàng, lõi đỏ | Đổi màu + prop, dùng lại module |
| VFX | 40 | máu, khói, nổ, cột vàng, Sương Đen, sập trần |
| SFX | ~220 | |
| Nhạc | 7 track layer động | mỗi track 4 layer bật theo Depth và theo số quái sống |

## 5. Viewmodel (tay & vũ khí) — chi tiết dễ bị bỏ quên

Trên portrait FPS, viewmodel chiếm nhiều màn hình hơn landscape. Luật:

| Luật | Lý do |
|---|---|
| Súng đặt **lệch phải, thấp**, chiếm ≤ 22% chiều cao màn hình | Không che dải Cận chiến |
| Dao **không hiện** khi đang bắn; chỉ hiện trong 0.4s của nhát chém | Giữ màn hình sạch |
| Nhát chém vẽ thêm **vệt sáng (slash trail)** theo đúng đường ngón tay | Người chơi thấy chính xác mình đã quẹt gì |
| Reload animation phải nhìn thấy rõ, có vòng tiến trình quanh tâm ngắm | Nạp = không bắn được, phải đọc ra ngay |
| Không có animation "kiểm tra súng" idle | Portrait không có chỗ cho flavour animation |

## 6. Audio direction

| Lớp | Nội dung |
|---|---|
| **Diegetic** | Đèn dầu cháy xì xì (pitch nền hạ nửa cung mỗi Depth), đuốc cháy, nước nhỏ giọt, tiếng goblin lao xao ở xa (số lượng tiếng lao xao **tỉ lệ với số quái** → nghe là biết wave to cỡ nào **trước khi thấy**) |
| **Combat** | Súng (3 layer), cận chiến (4 layer), impact, ragdoll |
| **Reward** | **Coin chime ladder** (xem `13`), tiếng thẻ, tiếng cột vàng |
| **Nhạc** | 4 layer/track bật dần: bass+perc (D1) → trống (D3) → dây (D5) → hợp xướng (D7); thêm 1 layer khi số quái sống > 60. Chuyển layer khớp nhịp, không fade thô |
| **Player** | Thở (gấp khi stamina thấp), nhịp tim (HP < 30%), càu nhàu khi chém nặng |

**Trick quan trọng:** *tiếng lao xao của đám đông phát trước khi quái xuất hiện, âm lượng tỉ lệ với số
lượng wave sắp tới.* Người chơi học được "nghe là biết sắp đông" → tạo cảm giác sợ trước khi thấy, và đó là
thứ Into the Dead làm rất tốt.

## 7. Localization & culture

- Ngôn ngữ v1: **Tiếng Việt + English**. Sau đó: ID, TH, PT-BR, ES, RU, TR (thị trường horde-shooter mạnh).
- Tên vũ khí/quái dùng từ ngắn, 2–3 âm → vừa khung UI portrait mọi ngôn ngữ.
- Máu xanh đen (không đỏ) giúp qua kiểm duyệt ở các thị trường khắt khe mà không cần build riêng.
