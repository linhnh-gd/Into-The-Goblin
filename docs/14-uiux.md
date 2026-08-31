# 14 — UI / UX (portrait, một tay)

Nguyên tắc gốc: **màn hình là vùng chiến đấu, không phải bảng điều khiển.** Mọi HUD phải nằm ngoài
vùng ngón tay hoạt động và ngoài vùng quái xuất hiện.

---

## 1. Layout HUD trong combat

```
+---------------------------------------+  <- safe area top
| [LỘC 8]  [D3-R7]   HP ####----   [||] |  0-8%   : Lộc + vị trí + HP + pause
|                                       |
|                                       |
|          DẢI XA (quái silhouette)     |  8-40%  : không đặt UI gì ở đây
|                                       |
|                                       |
|- - - - - - - - - - - - - - - - - - - -|
|                                       |
|         DẢI GIỮA / CẬN CHIẾN          |  40-78% : vùng quái tới gần
|            (tâm ngắm ở 62%)           |           NGÓN TAY HOẠT ĐỘNG Ở ĐÂY
|                                       |
|- - - - - - - - - - - - - - - - - - - -|
|   [stamina ====     ]  (fade sau 2s)  |  78-86% : stamina (chỉ khi chém)
|                                       |
| VÀNG 1,240        (o o o o o - - -)   |  86-94% : vàng + vòng đạn
|                              24/60    |
| [RELOAD]                       [ULT]  |  94-100%: 2 nút duy nhất của game
+---------------------------------------+  <- safe area bottom
```

| Vùng | % chiều cao | Nội dung | Luật |
|---|---|---|---|
| Top bar | 0–8% | Lộc, vị trí `D3-R7`, HP, pause | Không bao giờ che bởi hiệu ứng |
| Vùng chiến đấu | 8–78% | Chỉ game, không UI | Tâm ngắm ở **62%** (thấp hơn giữa, vì ngón tay đến từ dưới) |
| Stamina | 78–86% | Hiện khi chém, fade 2s | Đúng docs |
| Vàng + đạn | 86–94% | | Vàng bên trái (đọc trước), đạn bên phải (gần ngón) |
| Nút | 94–100% | **Chỉ 2 nút**: Reload (phải), Ultimate (phải ngoài) | Cả hai trong vùng ngón cái |

**Camera chúi 8°** để quái ở dải Cận chiến rơi vào 45–75% chiều cao — trên vùng ngón tay che.

## 2. Màn hình Cổng (xem `08` mục 3)

Đây là màn hình duy nhất được phép "chậm". Cấu trúc từ trên xuống:
3 thẻ nâng cấp → dòng Lộc & vàng → **2 tấm biển cửa** (loại phòng + tag + số quái dự kiến).

## 3. Vùng ngón cái (thumb zone)

```
   Bàn tay phải giữ máy, ngón cái quét được:
        ______________
       |              |   <- không tới được (chỉ để hiển thị)
       |              |
       |      ____    |
       |    /      \  |   <- vùng ngón cái thoải mái (55-100% cao, 20-100% ngang)
       |   |  OK   |  |      -> mọi nút bấm & mọi thẻ chọn phải ở đây
       |    \_____/   |
       |______________|
```

Mọi nút tương tác (thẻ, ĐI TIẾP, GÕ CHUÔNG, reroll, shop) phải nằm trong **55–100% chiều cao**.
Thông tin chỉ để đọc thì đặt trên. Đây là quy chuẩn mobile 2026: thiết kế theo tầm ngón, không theo tính đối xứng.

## 4. Meta screen (ngoài run)

| Screen | Nội dung | Ghi chú |
|---|---|---|
| **Cửa Hầm** (home) | Nút CHƠI khổng lồ, loadout 2 slot, Depth khởi đầu, vàng/mảnh | **Nút CHƠI phải ở vùng ngón cái**, tới gameplay ≤ 2 tap |
| **Lò Rèn** | Vũ khí: level, XP bar, tier, khắc | Bar XP mỗi vũ khí luôn thấy → "còn 400 XP nữa" |
| **Cây Thợ Hầm** | 4 nhánh talent | Hiện % power thực của mỗi bậc (chống cảm giác talent rác) |
| **Trại Mỏ** | 12 building 2.5D, thu idle gold | Có nút "Thu tất cả" |
| **Nhiệm vụ** | Daily 3 + Weekly 5 + Sổ Thợ Hầm | |
| **Xếp hạng** | Endless: số phòng × (1 + Lộc/20) | Hiện replay top 10 |

**Từ mở app tới phát bắn đầu tiên: ≤ 10 giây, ≤ 2 tap.** Kiểm tra mỗi build.

## 5. Onboarding (xem `03` mục 6 cho chi tiết gesture)

| Bước | Mở cái gì | Khi nào |
|---|---|---|
| 1 | Tap bắn | giây 0 |
| 2 | Hold bắn | giây 2 |
| 3 | Quẹt chém (súng bị khoá script) | giây 4 |
| 4 | Chém Hoàn Hảo + Cướp Đạn | giây 7 |
| 5 | **Ngã Ba Hầm** (2 cửa có biển báo) | giây 12 (Cổng đầu) |
| 6 | Thẻ nâng cấp | Cổng thứ 2 |
| 7 | Shop | phòng 3 |
| 8 | Nạp Hoàn Hảo | phòng 4 (khi reload lần thứ 5) |
| 9 | Trại Mỏ | sau khi clear Depth 1 |
| 10 | Talent | đầu session 2 (D1) |

Không dạy quá 1 cơ chế mỗi 3 giây. Không có tutorial nào có thể skip bằng nút — chúng được thiết kế để
kết thúc trong 2 giây nếu người chơi làm đúng ngay.

## 6. Trạng thái đặc biệt

| Trạng thái | Xử lý |
|---|---|
| Mất kết nối | Chơi bình thường (offline-first). Chỉ leaderboard/shop bị khoá, có báo nhỏ |
| Có cuộc gọi giữa run | Pause tự động, giữ trạng thái, quay lại có đếm 3-2-1 |
| Pin yếu / máy nóng | Tự giảm cap crowd agent xuống 120, giảm hạt 50%, hiện icon nhỏ |
| Người chơi chết | Không popup ngay. Slow-mo 1.2s cảnh chết → **màn hình kết run** (vàng, Lộc cuối, phòng sâu nhất, weapon XP) → nút "Hồi sinh (ad)" và "Về Cổng Hầm" |
| Chết ở Depth ≥ 4 | Có thêm dòng chữ nhỏ ghi lại "câu chuyện": *"Ngươi xuống tới phòng 37. Xác ngươi giờ là mốc cho kẻ sau."* |
