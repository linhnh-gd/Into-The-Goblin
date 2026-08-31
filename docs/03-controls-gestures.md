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


## 2b. Súng rút/cất và chém liên tục (bản cài đặt hiện tại)

Hai gesture chính được viết lại để **trạng thái nhìn thấy được trên màn hình**, không phải đọc HUD.

### Súng: rút ra khi bấm, cất đi khi nhả

| Hành động | Kết quả |
|---|---|
| **Tap** hoặc **giữ** | **Rút model súng ra** (`gun.drawSec` 0.14s) và bắn |
| Tiếp tục giữ | Bắn liên tục, rê ngón thì tâm ngắm đi theo |
| **Nhả tay** | **Cất súng đi** rồi **reload** |
| Đang reload mà **còn đạn** → tap | **Huỷ reload**, bắn ngay |
| Đang reload mà **hết sạch đạn** → tap | **Không huỷ được**, phải đợi reload xong |

`gun.gunHoldSec` (0.30s): súng ở ngoài thêm một nhịp sau phát cuối. Không có nó thì một cái tap chỉ thấy
súng nhấp nháy ~0.1s — người chơi không đọc ra được trạng thái. Audit gate: `gunHoldSec ≥ drawSec`.

**Luật "hết sạch đạn thì không huỷ được reload" là cái tạo ra quyết định.** Nếu huỷ được mọi lúc thì reload
không có rủi ro và người chơi sẽ luôn bắn tới viên cuối. Vì không huỷ được, bắn hết băng là **tự khoá mình**
đúng lúc đám quái đang tới — nên phải chủ động nhả tay nạp sớm. Đây là nguồn căng thẳng chính của súng.

### Cận chiến: chém liên tục kiểu chém hoa quả

Quẹt ngang **không** kết thúc sau một nhát. Giữ ngón tay và rê tiếp thì **mỗi đoạn đường trên màn hình là
một nhát nữa**, cho tới khi nhả tay.

| Số (`data/gamefeel.json` khối `melee`) | Giá trị | Việc |
|---|---|---|
| `slideMinSegPx` | 14 | Đoạn ngắn hơn thế không tính là nhát mới |
| `slideHitCooldownSec` | 0.22 | **Mỗi con** chỉ ăn damage 1 lần trong 0.22s |
| `slideTickDamageMult` | 0.62 | Nhát tiếp theo yếu hơn nhát đầu |
| `slideStaminaPerSec` | 34 | Giữ liên tục drain stamina → tối đa **2.9s** |

Hai thứ chặn khai thác, và cả hai đều có gate:
- **`slideHitCooldownSec`** chặn rung ngón tay tại chỗ. Đo thực tế: 12 đoạn quẹt trong **cùng một frame**
  chỉ ăn **1** lần damage; 8 đoạn cách 0.27s ăn đủ **8**; 8 đoạn cách 0.05s chỉ ăn **2**.
- **`slideStaminaPerSec`** chặn giữ vô hạn. Gate yêu cầu thời gian giữ tối đa nằm trong 2–5s.

Nhát **đầu tiên** vẫn đi qua `slash()` nguyên giá (có chém nặng theo độ dài). Các đoạn sau mới dùng
`slideTickDamageMult` — nên chém liên tục **không thay thế** một nhát chém nặng canh đúng lúc.

**Phân biệt với súng:** hướng của đoạn quẹt đầu tiên quyết định, và **khoá** lại. Quẹt ngang (≤55° khỏi trục
ngang) → vào chế độ chém liên tục, súng được cất. Không di chuyển ngón → rút súng. Vùng chết 55–65° vẫn giữ
nguyên: thà mất input còn hơn làm sai input.


### Độ trễ vào chế độ bắn liên tục

`tapMaxDuration` **180 → 110ms**. Đây là độ trễ từ lúc chạm tới lúc súng bắt đầu bắn liên tục — nó phải đủ
dài để phân biệt với một cú quẹt chém, và đủ ngắn để không thấy khựng.

**Máy trạng thái phải được đánh thức bằng HẸN GIỜ, không phải bằng `pointermove`.** Bản đầu chỉ kiểm tra
`elapsed >= tapMaxDuration` bên trong hàm xử lý `pointermove`; giữ ngón tay **đứng yên** thì không có sự kiện
move nào, máy trạng thái kẹt ở `PENDING`, và tới lúc nhả tay nó thành một cái TAP. Nghĩa là **phải rê tay mới
bắn liên tục được**. Đo sau khi sửa: giữ yên hoàn toàn → vào chế độ bắn liên tục sau **132ms**.

Hẹn giờ phải bị **huỷ** ở hai chỗ: khi khoá sang SLIDE, và khi nhả tay. Không huỷ thì một cú quẹt chém sẽ
rút súng ra giữa chừng. Đo: quẹt nhanh → vào chế độ chém, **không** ra súng, tốn **0 đạn**.

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
