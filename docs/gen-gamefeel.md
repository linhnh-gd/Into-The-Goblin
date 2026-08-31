# gamefeel (generated)

> Sinh ra bởi `build_pages.ps1` từ `data/gamefeel.json + data/controls.json`. **KHÔNG sửa tay** — sửa data rồi build lại.

### Game Feel & Điều khiển

| Sự kiện | Frame | Timescale |
|---|---|---|
| Đạn trúng trash | 2 | 0.0 |
| Đạn headshot | 4 | 0.0 |
| Shotgun trúng >=3 con | 5 | 0.0 |
| Chém nhẹ trúng | 3 | 0.05 |
| Chém nặng trúng | 5 | 0.0 |
| CHÉM HOÀN HẢO | 7 | 0.35 |
| Kill con cuối của wave | - | 0.4 (0.35s) |
| Người chơi bị trúng | 3 | 0.0 |
| Boss vào phase mới | 12 | 0.0 |

### Game Feel & Điều khiển

| Sự kiện | Biên độ (px) | Thời gian | Hướng |
|---|---|---|---|
| Bắn súng lục | 3 | 0.06s | dọc |
| Bắn shotgun | 14 | 0.16s | dọc + xoay 1.2° |
| Bắn liên thanh (mỗi phát) | 2 | 0.04s | ngẫu nhiên nhỏ, cộng dồn cap 9px |
| Chém nhẹ | 5 | 0.08s | theo vector slide |
| Chém nặng | 16 | 0.18s | theo vector slide |
| CHÉM HOÀN HẢO | 20 | 0.22s | theo vector slide + flash trắng 1 frame |
| Người chơi bị trúng | 12 | 0.20s | từ hướng bị đánh |
| Boss đập đất | 26 | 0.35s | dọc |
| Mở cửa ở Ngã Ba Hầm | 10 | 0.45s | dọc, một nhịp nặng |

### Game Feel & Điều khiển

| Kiểu kill | Xác | Hạt | Đồng vàng |
|---|---|---|---|
| Đạn thường | Bay ngược về sau theo vector đạn, ragdoll 1.2s | 12 | 3–6 |
| Headshot | Đầu nổ, thân quỳ rồi ngã | 20 | 5–8 |
| Shotgun gần | Bay 3–4m, đập tường bật lại (truyền 25% lực) | 26 | 6–10 |
| Chém nhẹ | Đứt đôi theo ĐÚNG đường quẹt, 2 nửa bay theo vector slide | 18 | 4–7 |
| Chém nặng | Bay 6–8m theo vector slide, xoay | 30 | 8–14 |
| Nổ (exploder / AoE) | Bay tứ tán | 40 | 6–12 |
| Cột vàng (Depth 3+, 4% + 0.4%/Lộc) | Xác tan thành vàng | cột sáng 3m | x25 |

### Game Feel & Điều khiển

| Ưu tiên | Âm | Ghi chú |
|---|---|---|
| 1 | Coin chime ladder | Vũ khí gây nghiện số 1. Duck toàn mix 60% khi Chém Hoàn Hảo |
| 2 | Impact cận chiến | 4 layer: lưỡi cắt thịt + xương gãy + vải xé + đuôi vang. 4 biến thể chống lặp |
| 3 | Súng | 3 layer: cơ khí + nổ + reverb theo kích thước phòng |
| 4 | Tiếng quái spawn | Mỗi loại một âm riêng — nghe là biết, không cần nhìn |
| 5 | Đèn & hầm | Đèn dầu cháy xì xì; mỗi Depth hạ pitch tiếng nền nửa cung -> Depth 7 là tiếng gầm dưới đất |
| 6 | Nhịp tim người chơi | Vào khi HP < 30%, tempo theo mức máu |
| 7 | Nhạc nền layer động | trống từ Depth 3, dây từ Depth 5, hợp xướng từ Depth 7; thêm 1 layer nữa khi số quái sống > 60. Chuyển layer khớp nhịp |
| 8 | Tiếng lao xao đám đông | Phát TRƯỚC khi quái xuất hiện, âm lượng tỉ lệ số quái sắp tới — nghe là biết wave to cỡ nào |

### Game Feel & Điều khiển

| Sự kiện | Kiểu rung |
|---|---|
| Bắn 1 phát | light impact |
| Shotgun | heavy impact |
| Chém trúng | medium impact |
| Chém Hoàn Hảo | success (2 nhịp) |
| Nạp Hoàn Hảo | selection click giòn |
| Nạp trượt (kẹt đạn) | error |
| Bị trúng | heavy + 40ms |
| Mở cửa ở Ngã Ba | rung 0.35s một nhịp nặng |
| Input bị huỷ (dead zone 55–65°) | 8ms rất nhẹ — báo máy nhận nhưng bỏ |

### Game Feel & Điều khiển

| Gesture | ID | Điều kiện | Hành động | Vũ khí |
|---|---|---|---|---|
| Tap | gs_tap | nhấc ngón < 180ms VÀ di chuyển < 0.05S | 1 phát bắn nhắm vào điểm tap | ranged |
| Hold | gs_hold | giữ >= 180ms, tốc độ < 900 px/s | Bắn liên tục vào điểm đang giữ (theo RPM) | ranged |
| Hold & Drag | gs_holddrag | đã ở Hold rồi mới di chuyển, tốc độ < 900 px/s | Bắn liên tục, tâm ngắm đi theo ngón | ranged |
| Slide nhẹ | gs_slide_light | tốc độ đỉnh >= 900 px/s trong <=250ms đầu, dài 0.12S–0.55S, góc lệch khỏi ngang <= 55° | Chém nhẹ | melee |
| Slide nặng | gs_slide_heavy | như slide nhẹ nhưng dài > 0.55S | Chém nặng: 2x stamina, 2.0x damage, 2.2x knockback, arc +30° | melee |
| Slide dọc xuống | gs_slide_down | >= 900 px/s, góc lệch khỏi dọc <= 25°, hướng xuống | Bước Lùi: lùi 1.2m, 0.15s bất tử, cooldown 2.5s | none |
| Slide dọc lên | gs_slide_up | như trên, hướng lên | Xốc Tới: tiến 2.0m, đẩy văng quái trên đường, cooldown 4s | none |
| Two-finger tap | gs_twofinger | 2 ngón chạm trong 120ms | Kích Bảo Vật / Ultimate | none |
| Nút Reload | gs_reload | tap nút góc phải-dưới | Reload thủ công / bắt cửa sổ Nạp Hoàn Hảo | ranged |
| VÙNG CHẾT | gs_deadzone | slide có góc lệch khỏi ngang trong khoảng 55°–65° | BỎ QUA HOÀN TOÀN + rung 8ms. Thà mất input còn hơn làm sai input | none |

### Game Feel & Điều khiển

| Tham số | Giá trị | Đơn vị | Ghi chú |
|---|---|---|---|
| tapMaxDuration | 180 | ms | Tăng nếu tester 'muốn bắn mà ra dao' |
| tapMaxTravel | 0.05 | S |  |
| slideVelocityThreshold | 900 | px/s | SO QUAN TRONG NHAT CUA GAME. Test tren may 60Hz va 120Hz |
| slideDetectWindow | 250 | ms |  |
| slideMinLength | 0.12 | S | Dưới ngưỡng này coi là tap |
| heavySlideLength | 0.55 | S | Cho phép người chơi tune 0.40–0.70 |
| meleeAngleMax | 55 | deg | lệch khỏi trục ngang |
| moveAngleMin | 65 | deg | lệch khỏi trục ngang |
| dodgeCooldown | 2.5 | s |  |
| dashCooldown | 4.0 | s |  |
| cameraPitchDown | 8 | deg | Để dải Cận chiến rơi vào 45–75% chiều cao, không bị ngón tay che |
| crosshairScreenHeight | 0.62 | tỉ lệ | Thấp hơn giữa vì ngón tay đến từ dưới |

