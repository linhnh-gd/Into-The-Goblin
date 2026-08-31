# 06 — Dải cự ly, Knockback = phòng thủ, và Sương Đen

Docs không có nút né. Docs có: *"Weapon tầm xa và cận chiến khi tấn công đều sẽ knockback kẻ địch, độ mạnh
tuỳ vào loại weapon"*. Ta nâng câu đó lên thành **hệ phòng thủ chính của game**.

---

## 1. Ba dải cự ly (threat band)

```
        MÀN HÌNH DỌC (nhìn từ trên xuống, người chơi ở dưới)

   22m  ==============================  spawn line
        |    DẢI XA (9 - 22m)         |  quái đi tới, chỉ bị bắn
        |    - hiện dạng silhouette   |  - đây là nơi "cảm giác đông" sống
   9m   ==============================
        |    DẢI GIỮA (2.5 - 9m)      |  bắn hiệu quả nhất, quái tầm xa bắt đầu bắn lại
        |    - full model, có mặt     |  - shotgun đẩy được về Dải Xa
   2.5m ==============================
        |    DẢI CẬN CHIẾN (0 - 2.5m) |  chém được, và bị đánh
        |    - quái vung tay ở 1.2m   |  - MELEE DPS CAO NHẤT Ở ĐÂY
   0m   ============ NGƯỜI CHƠI =======
```

| Dải | Người chơi làm gì | Quái làm gì | Camera |
|---|---|---|---|
| **Xa** 9–22m | Bắn, chọn mục tiêu | Đi tới, quái bắn tỉa bắt đầu ngắm (có tia báo) | Nét sâu, sương mù |
| **Giữa** 2.5–9m | Bắn hiệu quả, hoặc đẩy lùi | Quái tầm xa bắn, exploder tăng tốc | Vùng đọc chính |
| **Cận chiến** 0–2.5m | Chém (DPS cao nhất), rủi ro cao nhất | Vung tay ở 1.2m, 0.4s telegraph | Rung nhẹ liên tục, tiếng thở |

**Camera chúi xuống 8°** để quái ở dải Cận chiến rơi vào 45–75% chiều cao màn hình — không bị ngón tay che.

## 2. Knockback là tài nguyên phòng thủ

Không có nút né (chỉ có Bước Lùi cooldown 2.5s). Cách sống sót là **giữ mặt trước sạch**.

| Công cụ | Lực đẩy | Chi phí | Khi nào dùng |
|---|---|---|---|
| Shotgun | 1.6–2.4m, hình nón | 1 viên đạn | Đám dồn vào cửa |
| Chém nặng | 2.2x kb vũ khí | 2x stamina | 2–3 con sát mặt |
| Búa | kb x2.5 | stamina cao | Goblin Khiên |
| Bước Lùi | tự lùi 1.2m | cooldown 2.5s | Cứu mạng |
| Xốc Tới | đẩy văng quái trên đường | cooldown 4s | Thoát khi bị vây / lấy vàng |
| Đạp cửa / bẫy phòng | tuỳ phòng | 1 lần / phòng | Xem `rooms.json` |

### Kháng knockback theo hạng quái

| Hạng | `kbResist` | Ý nghĩa thiết kế |
|---|---|---|
| Trash (Goblin thường, Chạy) | 0.0–0.1 | Bay như lá |
| Ranged (Ném đá, Nỏ) | 0.15 | Đẩy được để cắt tầm bắn |
| Shield | 0.55 (chính diện) / 0.05 (sau lưng) | Phải phá thế hoặc dùng búa |
| Heavy (Ogre, Đầu bò) | 0.85 | **Gần như không đẩy được** → phải né/kite |
| Flyer | 0.4 nhưng bị đẩy cả trục dọc | Bắn xuống được, nhìn rất sướng |
| Boss | 1.0 (chỉ "flinch" khi trúng yếu điểm) | Boss là bài kiểm tra: hết công cụ dãn cách |

**Đây là đường cong độ khó thật sự của game:** Depth 1–2 mọi thứ đẩy được (người chơi học rằng knockback
cứu mạng), Depth 3–4 xuất hiện Shield/Heavy (công cụ cũ hết tác dụng, phải học công cụ mới),
Depth 5+ đám đông trộn kbResist cao (phải chọn mục tiêu, không phải quẹt bừa).

## 3. Sương Đen (Black Mist) — chống rùa

Lấy từ AI Director của Left 4 Dead: nếu người chơi cố thủ thì hệ thống tự tạo áp lực.

| Tham số | Giá trị |
|---|---|
| Kích hoạt | Ở trong một phòng **> 35s** (giảm còn 28s khi `G ≥ 6`) |
| Biểu hiện | Vignette đen bò vào từ 4 viền, mỗi 5s vào thêm 6% màn hình + tiếng đá lăn vọng lại từ phía sau |
| Spawn | Mỗi 4s sinh 1 **Bóng Hầm** từ phía sau: không giết được, chỉ knockback được, tốc độ 2.6 |
| Sát thương | Bóng chạm người chơi: 8 dmg + tối màn 0.3s |
| Tắt | Ngay khi dọn sạch phòng, hoặc khi bước qua Cổng |
| Ngoại lệ | Phòng Boss, Shop, Miếu **không** có Sương Đen |

Mục tiêu: giữ độ dài phòng trong khoảng **18–30s** cho 95% người chơi, mà không cần timer đếm ngược
(timer đếm ngược tạo lo lắng kiểu thi cử; sương mù tạo lo lắng kiểu kinh dị — đúng tông game hơn).

## 4. Đọc được trong 0.2 giây (readability rules)

Portrait FPS + 150 quái = nguy cơ nhìn không kịp. Luật cứng:

| Luật | Con số |
|---|---|
| Số quái **đang bắn** người chơi cùng lúc | tối đa **3** (director cưỡng chế) |
| Số exploder trong dải Cận chiến cùng lúc | tối đa **2** |
| Telegraph đòn đánh | **0.4s** với viền sáng đỏ trên quái, có cả tín hiệu âm |
| Đạn địch | luôn có vệt sáng, tốc độ ≤ 14 m/s (thấy được để lùi) |
| Elite | viền tím + cột sáng, luôn nhìn thấy qua đám đông (outline xuyên vật thể) |
| Quái ở dải Xa | được vẽ tối màu, chỉ có **mắt đỏ phát sáng** → vừa atmosphere, vừa che LOD thấp |
| Màu | Địch = xanh xám lạnh · Nguy hiểm = đỏ · Thưởng = vàng. **Không dùng vàng cho địch, bao giờ cũng vậy** |

## 5. Ràng buộc (audit)

1. Ở mọi Depth, phải tồn tại **ít nhất một** công cụ dãn cách trong loadout khả dụng.
2. Tổng DPS quái đang ở dải Cận chiến không được vượt `min(0.55, 0.16 + 0.0055*(R-1))` × HP tối đa
   mỗi giây — ở phòng đầu là **16%/giây**, tới R72 mới đạt trần 55%. Trên mức đó là chết không hiểu vì sao.
   Prototype cài đúng ràng buộc này bằng token bucket (xem `18` mục 4).
3. Không quái nào ở Depth 1–2 có `kbResist > 0.2` (dạy cơ chế trước khi phá nó).
