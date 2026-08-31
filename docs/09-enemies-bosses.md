# 09 — Quái & Boss

Docs: *"độ khó mỗi wave sẽ tăng dần, có thể là tăng số lượng, loại quái mới khoẻ hơn"*.
Dữ liệu số: `data/enemies.json` → `gen-enemies.md`. Doc này là **triết lý**, không phải bảng số.

---

## 1. Nguyên tắc thiết kế quái

| # | Nguyên tắc |
|---|---|
| 1 | **Mỗi con quái tồn tại để phá một chiến thuật.** Nếu không trả lời được "con này chống lại kiểu chơi nào" thì cắt |
| 2 | **Nhận dạng bằng silhouette + màu, không bằng chi tiết.** Ở dải Xa chỉ thấy bóng và mắt |
| 3 | **Một con quái, một cơ chế.** Không con nào vừa tàng hình vừa hồi máu vừa triệu hồi |
| 4 | **Trash phải chết trong 1 phát / 1 nhát** ở Depth tương ứng. Trash dai = game nhão |
| 5 | Mỗi loại có **âm thanh riêng khi spawn** — nghe là biết phải làm gì, không cần nhìn |
| 6 | Quái phải "đáng chém": máu ít, đông, bay đẹp → nuôi Chém Hoàn Hảo và Cướp Đạn |

## 2. Bảng vai trò (chống chiến thuật gì)

| Hạng | Loại | Phá chiến thuật | Người chơi phải làm gì |
|---|---|---|---|
| Trash | Goblin Cùi | — (nền, để nổ vàng) | Gì cũng được |
| Trash | Goblin Chạy | Bắn chậm rãi từ xa | Chém quét / shotgun |
| Trash | Goblin Bầy (spawn theo cụm 8) | Bắn từng viên | Chém Hoàn Hảo |
| Ranged | Goblin Ném Đá | Rùa tại chỗ | Tiến lên / bắn tỉa |
| Ranged | Goblin Nỏ | Đứng ở dải Cận chiến chém | Đổi mục tiêu ưu tiên |
| Special | Goblin Thuốc Nổ | Để quái vào gần | Knockback / bắn sớm |
| Special | Goblin Khiên | Spam bắn thẳng | Búa / đánh sau lưng / chém nặng |
| Special | Dơi Hầm (bay) | Chém ngang | Bắn / chém chéo |
| Special | Goblin Đào Hầm (trồi lên sau lưng) | Chỉ nhìn phía trước | Bước Lùi + quay chém |
| Support | Goblin Trống (buff tốc độ đồng bọn) | Bỏ qua mục tiêu phụ | Ưu tiên giết |
| Support | Pháp Sư Xanh (khiên năng lượng cho đồng bọn) | Bắn AoE | Giết trước |
| Heavy | Ogre Hầm | Dựa vào knockback | Kite / bắn yếu điểm |
| Heavy | Đầu Bò Đá (charge thẳng) | Đứng giữa hành lang | Bước Lùi / nhường đường |
| Heavy | Goblin Béo (nổ thành 6 trash khi chết) | Giết bừa ở gần | Giết ở xa |
| Elite | Tướng Goblin | Mọi thứ (có 2 affix) | Dồn burst |
| Elite | Tên Đồ Tể | Cận chiến | Giữ khoảng cách |
| Elite | Ổ Vàng | Ăn vàng trên sàn rồi bỏ chạy mang theo | Chọn: rượt nó hay giữ hàng |

## 3. Affix (chỉ từ Depth 4)

| Affix | Hiệu ứng | Tín hiệu |
|---|---|---|
| **Bọc Giáp** (D4) | +60% HP, kbResist +0.3 | vảy kim loại sáng |
| **Điên Máu** (D4) | +45% tốc độ khi HP < 50% | vệt đỏ |
| **Chai Sạn** (D4) | Giảm 40% damage từ tầm xa | khói xám |
| **Da Cứng** (D4) | Giảm 40% damage từ cận chiến | vỏ đá |
| **Nổ Xác** (D5) | Chết nổ AoE 20 | bụng phát sáng |
| **Hút Vàng** (D5) | Ăn vàng trên sàn, giết lại nhả x2 | vàng bám người |
| **Bóng Đôi** (D6) | Chết sinh 1 bản sao 30% HP | bóng mờ |

**Luật:** `Chai Sạn` và `Da Cứng` không bao giờ cùng lúc trên một con (sẽ không có cách nào giết).

## 4. Boss (7 con, 1 cho mỗi Depth)

Boss trên portrait phải: **to, chính diện, có yếu điểm cần tap chính xác, và mang wave phụ theo** để người
chơi vẫn phải dùng cả súng lẫn dao.

| Depth | Boss | Cơ chế phase 1 | Phase 2 | Phase 3 (chỉ Elite Depth) | Dạy cái gì |
|---|---|---|---|---|---|
| 1 | **Goblin Vương Béo** | Lăn ngang, nhả trash | Nôn ra vũng axit | Chia làm 2 con nhỏ | Cơ bản: bắn yếu điểm |
| 2 | **Đôi Song Sinh Rỉ** | 2 con, chia damage | Con còn lại điên máu | Hợp thành 1 | Chọn mục tiêu |
| 3 | **Tường Khiên Sống** | Khiên chắn 90% chính diện | Mở khiên 2s sau mỗi 4 đòn | Sinh 3 Shield | Kiên nhẫn / timing |
| 4 | **Nhện Trần Hầm** | Từ trên xuống, không knockback được | Tơ khoá màn hình 1s | Vô hình giữa các đòn | Không dựa vào knockback |
| 5 | **Ogre Mỏ** | Đập trụ chống: mỗi 20s trần sập, hành lang hẹp lại 15% (tối đa 3 lần) | Sóng xung từ chân | Cướp mất 1 thẻ của bạn | Áp lực thời gian, và không gian là tài nguyên |
| 6 | **Vua Xác Vàng** | Ăn vàng trên sàn để hồi máu | Nhả vàng thành đạn | Toàn bộ vàng trên sàn thành quái | Ép bỏ tham |
| 7 | **MẸ MỎ** | Khối thịt-quặng treo bằng 4 gân rễ; phải CHÉM đứt cả 4 (đạn không cắt được) | Triệu hồi mọi boss trước ở dạng bóng | Đảo ngược điều khiển tap/slide 5s | Tổng hợp toàn bộ |

**Luật boss:**
- TTK mục tiêu: **45–70 giây** ở `G=0` với loadout đúng tier.
- Mỗi phase phải có ít nhất một cửa sổ **bắt buộc dùng cận chiến** (khoá súng bằng cơ chế, không bằng UI).
- Boss không knockback được (`kbResist = 1.0`) — người chơi mất công cụ chính, đó là bài kiểm tra.
- Rơi ra: mở Depth sau + phôi rèn + 1 relic ngẫu nhiên + vàng lớn.

## 5. Đường cong giới thiệu quái (dạy trước, ép sau)

```
 Depth 1 : Cùi, Chạy, Bầy                      -> dạy tap, hold, chém quét
 Depth 2 : + Ném Đá, Thuốc Nổ                  -> dạy tiến lên, knockback
 Depth 3 : + Khiên, Ogre                        -> phá thói quen spam bắn
 Depth 4 : + Dơi bay, Đào Hầm                   -> dạy trục dọc & phía sau
 Depth 5 : + Trống, Pháp Sư                     -> dạy ưu tiên mục tiêu
 Depth 6 : + Đầu Bò, Goblin Béo, Nỏ             -> hỗn chiến thật sự
 Depth 7 : trộn tất cả + affix mặc định          -> kỳ thi tốt nghiệp
```

Mỗi loại mới: xuất hiện **một mình** ở lần đầu, có chữ hiện tên + tiếng riêng, và wave đó có ≤ 2 loại khác.

## 6. Ràng buộc (audit)

1. Mọi enemy id trong `waves.json` và `depths.json` phải tồn tại trong `enemies.json` (**0 ID sai**).
2. Mọi quái phải có `tpCost > 0`, `goldDrop ≥ 1`, `sfxSpawn` khác rỗng.
3. Mỗi Depth phải giới thiệu **1–3** loại mới, không hơn.
4. Không quái nào ở Depth 1–2 có `kbResist > 0.2`.
5. Tổng `tpCost` của mọi loại trong một Depth phải phủ được ngân sách TP của phòng đông nhất.
