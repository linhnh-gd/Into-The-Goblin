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
| Two-finger tap | gs_twofinger | 2 ngón chạm trong 120ms | Kích Bảo Vật / Ultimate | none |
| Nút Reload | gs_reload | tap nút góc phải-dưới | Reload thủ công / bắt cửa sổ Nạp Hoàn Hảo | ranged |

### Game Feel & Điều khiển

| Tham số | Giá trị | Đơn vị | Ghi chú |
|---|---|---|---|
| tapMaxDuration | 130 | ms | Do TRE truoc khi sung bat dau ban lien tuc. Tang neu tester muon ban ma ra dao |
| tapMaxTravel | 0.05 | S |  |
| slideVelocityThreshold | 360 | px/s | SO QUAN TRONG NHAT CUA GAME. 900 px/s tren man 390px CSS la 2.3 chieu rong man hinh moi giay -- mot cu BUNG tay, khong phai mot cu quet. Hau qua: quet binh thuong bi doc thanh HOLD (rut sung) va do luat khoa thi khong ra dao duoc nua cho toi khi nhac tay. 520 = 1.35 chieu rong/giay, dung tam mot cu quet that. An toan vi slideMinLength van chan: quet ngan qua thi roi ve tap. |
| slideMinLength | 0.12 | S | Quang duong toi thieu de mot cu quet duoc tinh la chem luc NHAC TAY |
| slideCommitLength | 0.18 | S | Di du xa nay thi CHOT thanh nhat chem ngay, khong doi nhac tay. Duoi nguong: doi den luc nhac tay roi xem ngon tay da DUNG chua -- dung roi la tap truot tay, con dang bay la ve nhanh. |
| tapStillMs | 60 | ms | Khong co cu di chuyen nao trong ngan ay ms truoc luc nhac tay = ngon tay da dung = TAP. |
| weaponSwitchWindow | 300 | ms | NHA TAY KHOI GIU-BAN LA MOT TUYEN BO Y DINH. Trong ngan ay ms sau khi nha tay, cu cham tiep theo duoc coi la DOI SANG DAO: quang duong chot rut ve slideMinLength, va sung phai doi lau hon moi duoc tom lai ngon tay. Truoc do nha tay khong duoc gi ca -- cu cham moi bi nem thang lai vao HOLD_FIRE sau 130ms va vi sung chua cat (gunHoldSec 0.30s) nen no ban lai ngay, con cu quet thi phai pha khoa sung them mot lan nua. |
| reholdDelay | 220 | ms | Do tre truoc khi sung duoc tom lai ngon tay, CHI trong cua so weaponSwitchWindow. Dai hon tapMaxDuration vi tay nguoi cham xuong roi moi vay -- 130ms la ngan hon do tre van dong binh thuong, nen cu vay bi nuot. Ngoai cua so do van la tapMaxDuration. |
| holdBreakTravel | 0.07 | S | Dang GIU-BAN ma ngon tay di qua ngan nay tinh tu diem dung gan nhat -> chuyen sang CHEM ngay, khong can van toc. Lam duoc vi hold da la AUTO-AIM: giu tai cho la tu ngam tu ban, nen ngon tay KHONG con ly do gi de di chuyen trong luc giu. Moi chuyen dong dang ke deu chi co the la y dinh chem. Truoc day phai dat 1.15 lan nguong quet moi pha duoc khoa. |
| holdRestVel | 90 | px/s | Duoi muc nay coi la ngon tay DANG DUNG -> dat lai moc do quang duong. De ngon cai xe dich tu tu trong luc giu ban khong cong don thanh mot cu chem oan. |
| sliceStillMs | 150 | ms | Dang CHEM ma ngon tay dung yen ngan nay -> rut sung ra ban. Cap voi holdBreakTravel thanh mot cap doi xung: DI = dao, DUNG = sung, doi qua doi lai trong CUNG mot cu cham, khong can nhac tay. |
| heavySlideLength | 0.55 | S | Cho phép người chơi tune 0.40–0.70 |
| dodgeCooldown | 2.5 | s |  |
| dashCooldown | 4.0 | s |  |
| cameraPitchDown | 8 | deg | Để dải Cận chiến rơi vào 45–75% chiều cao, không bị ngón tay che |
| crosshairScreenHeight | 0.62 | tỉ lệ | Thấp hơn giữa vì ngón tay đến từ dưới |

