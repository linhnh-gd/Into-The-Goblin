# 03 — Controls & Gesture Disambiguation

> Docs gốc ghi rõ: *"Weapon tầm xa tấn công bằng cách tap lên màn hình tại vị trí kẻ địch hoặc là Hold,
> hoặc là Hold and Drag. **Cần rõ ràng với Slide của weapon cận chiến**"*.
>
> Đây là **rủi ro kỹ thuật số 1** của dự án. Toàn bộ cảm giác game phụ thuộc vào việc máy phân biệt đúng
> "tao đang rê nòng súng" với "tao đang quẹt dao". Doc này là spec chính thức để code, không phải gợi ý.

---

## 1. Bảng gesture chính thức

| Gesture | Điều kiện nhận (chuẩn hoá theo `S` = chiều rộng màn hình) | Hành động | Vũ khí |
|---|---|---|---|
| **Tap** | Ngón nhấc lên trong `< 180ms` **và** tổng di chuyển `< 0.05S` | 1 phát bắn nhắm vào điểm tap | Tầm xa |
| **Hold** | Ngón giữ `>= 180ms`, tốc độ `< 900 px/s` | Bắn liên tục vào điểm đang giữ (theo RPM) | Tầm xa |
| **Hold & Drag** | Đã ở trạng thái Hold rồi mới di chuyển, tốc độ `< 900 px/s` | Bắn liên tục, tâm ngắm đi theo ngón | Tầm xa |
| **Slide nhẹ** | Tốc độ đỉnh `>= 900 px/s` trong `<= 250ms` đầu, độ dài `0.12S–0.55S`, góc lệch khỏi ngang `<= 55°` | Chém nhẹ | Cận chiến |
| **Slide nặng** | Như trên nhưng độ dài `> 0.55S` | Chém nặng: 2x stamina, 2.0x damage, 2.2x knockback, arc +30° | Cận chiến |
| **Slide dọc xuống** | Tốc độ `>= 900 px/s`, góc lệch khỏi *dọc* `<= 25°`, hướng xuống | **Bước Lùi**: lùi 1.2m, 0.15s bất tử, cooldown 2.5s | — |
| **Slide dọc lên** | Như trên, hướng lên | **Xốc Tới**: tiến 2.0m, đẩy văng quái trên đường, cooldown 4s | — |
| **Two-finger tap** | 2 ngón chạm trong `120ms` | Kích Bảo Vật / Ultimate | — |
| **Tap nút góc phải-dưới** | — | Reload thủ công / Nạp Hoàn Hảo | Tầm xa |

### Vùng chết (dead zone) — quy tắc bất khả xâm phạm

```
        Góc lệch khỏi trục NGANG
   0°  ---------------- 55°  ][  65° ---------------- 90°
   [======= CHÉM =======][DEAD][===== DI CHUYỂN =====]
                          zone
```

Slide có góc trong khoảng **55°–65°** bị **bỏ qua hoàn toàn** (không chém, không di chuyển, không bắn).
Thà mất một input còn hơn thực hiện sai input — người chơi sẽ tự học quẹt dứt khoát ngang hoặc dọc.

---

## 2. Máy trạng thái nhận diện (spec để code)

```
TOUCH_DOWN
  |
  |-- ghi t0, p0. state = PENDING
  v
PENDING  (cửa sổ quyết định: 180ms hoặc tới khi vượt ngưỡng)
  |
  |-- Nếu vận tốc tức thời >= 900 px/s TRƯỚC 250ms
  |        --> state = SLIDE  (khoá, không thể quay lại bắn trong lần chạm này)
  |
  |-- Nếu nhấc ngón trước 180ms & |p - p0| < 0.05S
  |        --> FIRE_SINGLE(p0);  state = IDLE
  |
  |-- Nếu giữ tới 180ms mà chưa đạt ngưỡng vận tốc
  |        --> state = HOLD_FIRE  (khoá, phần còn lại của lần chạm này KHÔNG thể thành chém)
  v
SLIDE  (tích luỹ điểm cho tới khi nhấc ngón hoặc đạt 400ms)
  |-- tính vector V = p_end - p_start, độ dài L, góc A
  |-- A <= 55°  --> MELEE(light nếu L<=0.55S, heavy nếu L>0.55S)
  |-- A >= 65°  --> DODGE_BACK (xuống) / DASH_FWD (lên)
  |-- 55<A<65   --> huỷ, rung nhẹ 8ms để báo "input bị bỏ"
  v
HOLD_FIRE
  |-- bắn theo RPM tại vị trí ngón (cập nhật mỗi frame)
  |-- nhấc ngón --> IDLE
```

**Nguyên tắc khoá (latching):** một lần chạm chỉ được là **một** loại hành động. Đã vào `HOLD_FIRE` thì
quẹt nhanh cũng không ra dao; đã vào `SLIDE` thì giữ lại cũng không ra súng. Không có chuyển tiếp giữa hai
nhánh — đây chính là cái làm nó "rõ ràng" như docs yêu cầu.

**Đa điểm chạm:** chỉ ngón **đầu tiên** điều khiển combat. Ngón thứ 2 chỉ dùng cho two-finger tap
(Ultimate) và bị bỏ qua trong mọi trường hợp khác.

---

## 3. Tham số tinh chỉnh (đưa vào `data/controls.json`, không hardcode)

| Tham số | Mặc định | Ghi chú tune |
|---|---|---|
| `tapMaxDuration` | 180 ms | Tăng nếu tester "muốn bắn mà ra dao" |
| `tapMaxTravel` | 0.05 S | |
| `slideVelocityThreshold` | 900 px/s | **Số quan trọng nhất của game.** Test trên máy 60Hz và 120Hz |
| `slideDetectWindow` | 250 ms | |
| `slideMinLength` | 0.12 S | Dưới ngưỡng này coi là tap |
| `heavySlideLength` | 0.55 S | |
| `meleeAngleMax` | 55° | |
| `moveAngleMin` | 65° | |
| `dodgeCooldown` | 2.5 s | |
| `dashCooldown` | 4.0 s | |

## 4. Hỗ trợ & accessibility (bắt buộc có ở v1)

| Tuỳ chọn | Mô tả | Vì sao |
|---|---|---|
| **Chế độ Hai Vùng** | Nửa dưới màn hình = chỉ chém, nửa trên = chỉ bắn | Cứu người chơi không quẹt được dứt khoát. Bật được từ Settings và được gợi ý tự động nếu tỉ lệ input bị huỷ > 15% trong 2 run |
| **Nút Chém** | Hiện 1 nút chém ở góc trái-dưới (chém tự động vào con gần nhất) | Accessibility / tay yếu |
| **Auto-reload** | Bật mặc định. Tắt để chơi Nạp Hoàn Hảo thủ công | |
| **Aim assist** | Hút tâm 4° tới đầu quái gần nhất trong dải Giữa/Xa, giảm còn 1.5° ở Depth 5+ | Portrait FPS ngón tay to, không có aim assist là không chơi được |
| **Rung** | 3 mức + tắt | |
| **Nhạy độ dài slide** | Kéo `heavySlideLength` từ 0.40S đến 0.70S | Người tay nhỏ / màn hình lớn |

## 5. Rủi ro và phương án thoát

| Rủi ro | Xác suất | Phương án dự phòng |
|---|---|---|
| Người chơi không phân biệt được tap và slide | **Cao** | Bật "Chế độ Hai Vùng" làm mặc định cho người mới trong 3 run đầu, sau đó gợi ý chuyển sang chế độ tự do |
| Slide dọc (né) bị nhận thành chém dọc | Trung bình | Dead zone 55–65°; nếu vẫn lẫn thì bỏ hẳn Xốc Tới (giữ Bước Lùi) và chuyển né sang nút |
| Máy Android tần số quét thấp bỏ mất sample | Trung bình | Đọc input theo `Input.touchCount` mỗi frame + nội suy, không dựa vào event OS |
| Ngón tay che quái ở nửa dưới màn hình | Cao (bản chất portrait FPS) | Đặt dải Cận chiến ở **nửa trên** khung nhìn: camera hơi chúi xuống 8°, quái tới gần thì hiển thị ở 45–75% chiều cao màn hình |

## 6. Onboarding gesture (10 giây đầu)

| Giây | Việc xảy ra |
|---|---|
| 0–2 | Vào thẳng hành lang, 1 goblin đi tới, chữ to: **"CHẠM VÀO NÓ"** |
| 2–4 | Nó chết nổ vàng. 3 con nữa tới, chữ: **"GIỮ ĐỂ BẮN LIÊN TỤC"** |
| 4–7 | Hết đạn (script cứng), súng khoá, 2 con vào gần, chữ: **"QUẸT NGANG ĐỂ CHÉM"** |
| 7–10 | Chém chết 3 con 1 nhát, slow-mo, hiện **"CHÉM HOÀN HẢO +ĐẠN"** |
| 10–15 | Tới Ngã Ba đầu tiên: 2 cửa có biển báo. Một ghi **ĐÔNG · VÀNG x1.25**, một ghi **TỐI · VÀNG x1.3**. Chữ: **"CHỌN CỬA"** |

Không có màn hình text nào. Không có video. Dạy bằng chính tình huống bắt buộc.
