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
| **Tap** | Ngón nhấc lên trong `< 130ms` **và** tổng di chuyển `< 0.05S` | 1 phát bắn **đúng chỗ chạm** (nón trợ giúp 4°), ăn được yếu điểm, trượt được | Tầm xa |
| **Hold** | Ngón giữ `>= 130ms`, tốc độ `< 360 px/s` | Bắn liên tục, **tự nhắm** con gần nhất làn giữa. Không ăn yếu điểm | Tầm xa |
| **Hold & Drag** | Đã ở trạng thái Hold rồi mới di chuyển, tốc độ `< 360 px/s` | Bắn liên tục — vẫn **tự nhắm**, vị trí ngón không đổi mục tiêu | Tầm xa |
| **Slide nhẹ** | Tốc độ đỉnh `>= 360 px/s` trong `<= 300ms` đầu, độ dài `0.12S–0.55S`, góc lệch khỏi ngang `<= 55°` | Chém nhẹ | Cận chiến |
| **Slide nặng** | Như trên nhưng độ dài `> 0.55S` | Chém nặng: 2x stamina, 2.0x damage, 2.2x knockback, arc +30° | Cận chiến |
| **Slide dọc xuống** | Tốc độ `>= 360 px/s`, góc lệch khỏi *dọc* `<= 25°`, hướng xuống | **Bước Lùi**: lùi 1.2m, 0.15s bất tử, cooldown 2.5s | — |
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
PENDING  (cửa sổ quyết định: 130ms hoặc tới khi vượt ngưỡng)
  |
  |-- Nếu vận tốc tức thời >= 360 px/s VÀ đã đi quá 0.05S, TRƯỚC 300ms
  |        --> state = SLIDE  (khoá, không thể quay lại bắn trong lần chạm này)
  |
  |-- Nếu nhấc ngón trước 130ms & |p - p0| < 0.05S
  |        --> FIRE_SINGLE(p0);  state = IDLE
  |
  |-- Nếu giữ tới 130ms mà chưa đạt ngưỡng vận tốc
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

**Nguyên tắc khoá (latching):** một lần chạm chỉ được là **một** loại hành động — đã vào `SLIDE` thì
giữ lại cũng không ra súng. Đây là cái làm nó "rõ ràng" như docs yêu cầu.

**Một lối thoát khoá, chỉ một chiều: `HOLD_FIRE` → `SLIDE`.** Bản đầu khoá **cả hai chiều**, nên muốn
đổi từ bắn sang chém phải **nhấc tay** rồi quẹt lại. Trong một game quái tới liên tục, một lần nhấc tay
là một nhịp mất trắng — và đó chính là cảm giác "chuyển đổi giữa cận chiến và bắn xa không mượt".

| | Điều kiện | Vì sao an toàn |
|---|---|---|
| Thoát khoá | vận tốc `>= 1.15 ×` ngưỡng quẹt **và** đi được `>= tapMaxTravel` (19px) | **Vận tốc** mới là thứ quyết định. Giữ để bắn thì ngón tay hoặc đứng yên hoặc rê CHẬM (hold-and-drag) — không bao giờ đạt 1.15× ngưỡng quẹt. Bắt 45px làm cú vẫy tay dứt khoát vẫn bị nuốt |
| Sau khi thoát | chốt thành nhát chém ở `slideMinLength` chứ không phải `slideCommitLength` | Ý đồ đã chứng minh bằng vận tốc rồi, không cần lớp bảo vệ cho cú tap nữa — nên nhát chém ra **giữa cú vẫy**, không đợi nhả tay |
| Mốc đo quãng đường | đặt lại mỗi khi vận tốc tụt dưới `0.5 ×` ngưỡng | Rê chậm cả giây không cộng dồn thành "một cú quẹt" |

Chiều ngược lại (`SLIDE` → bắn) **vẫn khoá**: đang chém mà lỡ tay ra một phát đạn là mất đạn, mà đạn
là tài nguyên khan hiếm nhất (trụ P2). Nhấc tay rồi chạm là đủ nhanh cho chiều đó.

**Đa điểm chạm:** chỉ ngón **đầu tiên** điều khiển combat. Ngón thứ 2 (`isPrimary = false`) chỉ dùng
cho two-finger tap (Ultimate) và bị bỏ qua trong mọi trường hợp khác.

**Nhưng một ngón `isPrimary` MỚI đến trong khi vẫn đang theo dõi ngón cũ thì phải NHẬN nó.** Nó có
nghĩa là ngón cũ đã nhấc lên rồi mà `pointerup` bị mất hoặc đến muộn — chuyện thường gặp trên màn
cảm ứng khi nhấc tay rồi chạm lại ngay. Bỏ qua ngón mới thì cả cú quẹt đó bị nuốt và người chơi
phải nhấc tay làm lại (`18` lỗi #60). Đóng ngón cũ, nhận ngón mới.

**Không khoá vào `HOLD_FIRE` khi súng không bắn được.** Hết sạch đạn mà vẫn khoá thì ngón tay bị
**nhốt** trong một trạng thái không làm gì cả: không bắn được vì hết đạn, không chém được vì đã khoá.
Bị từ chối thì ở lại `PENDING` — cú chạm vẫn còn nguyên cơ hội thành nhát chém — và hẹn giờ thử lại
mỗi 80ms để nạp xong là tự động bắn tiếp mà không phải nhấc tay.

## 2d. Cú tap được bảo vệ bằng "NGÓN TAY ĐÃ DỪNG", không bằng ngưỡng vận tốc cao

Đây là chỗ hai yêu cầu đối đầu nhau trực tiếp:

- *"Chuyển sang chém phải nhạy hơn"* → **hạ** ngưỡng nhận quẹt.
- *"Tap vào mà không bắn"* → **nâng** ngưỡng, để cú tap hơi trượt tay không bị nuốt thành nhát chém.

Một con số không thể vừa cao vừa thấp. Lời giải là **đừng dùng một con số** — dùng đúng cái phân biệt
được hai thứ đó. Đo thực tế: ngón cái bấm nhanh trên màn 375px **trôi 30–55px là bình thường**, và ở
30ms thì 50px = 1.600 px/s, thừa sức vượt mọi ngưỡng vận tốc hợp lý. Quãng đường và vận tốc **đều
không** tách được hai gesture này.

Cái tách được: **cú tap thì ngón tay đã dừng lại rồi mới nhấc; cú vẽ thì ngón tay vẫn còn đang bay.**

| Lúc nhả tay | Điều kiện | Kết luận |
|---|---|---|
| Đã đi `< slideCommitLength` **và** (không cử động trong `tapStillMs` **hoặc** vận tốc cuối `< ngưỡng`) | ngón tay **đã dừng** | **TAP** — bắn |
| Còn lại | ngón tay **còn đang bay** | **CHÉM** |

Ba luật đi kèm, tất cả đều cần thiết:

1. **Khoá sang SLIDE phải có CẢ vận tốc LẪN quãng đường > `tapMaxTravel`.** Chỉ nhìn vận tốc thì một
   cái giật tay 20px cũng khoá mất, và từ đó không bắn được nữa.
2. **Chốt sớm giữa cú chỉ khi đã đi quá `slideCommitLength`.** Dưới ngưỡng đó thì *đợi tới lúc nhả tay*
   rồi mới xử — vì chỉ lúc đó mới biết ngón tay dừng hay chưa.
3. **Lối thoát khoá `HOLD_FIRE → SLIDE` KHÔNG được resolve ngay tại chỗ.** Lúc thoát, quãng đường mới
   ~19–25px, dưới `slideMinLength` — gọi `_resolveSlide()` ngay thì nó rơi vào nhánh *"quá ngắn → coi
   là tap"* và **nuốt luôn cả cú chạm**: không bắn, cũng không chém. Phải chuyển state rồi để nó chạy
   tiếp vài frame.

Đo sau khi sửa (màn 375px):

| Thao tác | Kết quả |
|---|---|
| Tap trôi tay 0 / 30 / **55px** rồi dừng | **BẮN** cả ba (trước: 50px trở lên là mất phát bắn) |
| Đang giữ bắn, vẫy tay 60 / 80 / 120px | **RA DAO ngay giữa cú vẫy**, không cần nhả tay |
| Đang giữ bắn, rê **chậm** 120px (ngắm) | **Vẫn cầm súng** — hold-and-drag không bị phá nhầm |

---


## 2e. BỎ LUẬT KHOÁ — đi là dao, dừng là súng

Luật khoá (*"một lần chạm chỉ được là MỘT loại hành động"*) là luật gốc của máy trạng thái này. Nó sinh
ra khi hold còn là **hold-and-drag**: giữ để bắn *vào chỗ ngón tay đang chỉ*, nên ngón tay có lý do chính
đáng để di chuyển trong lúc giữ, và "di chuyển" vì thế **mơ hồ** — vừa có thể là rê tâm ngắm, vừa có thể
là chém. Luật khoá là cách xử lý sự mơ hồ đó.

**Sự mơ hồ đó đã biến mất khi hold thành AUTO-AIM** (`04` mục 6a). Giữ tại chỗ là tự ngắm tự bắn — ngón
tay không còn việc gì để làm trong lúc giữ. Từ đó mọi chuyển động đáng kể chỉ còn **một** cách hiểu.

Nên luật khoá bị bỏ, thay bằng một cặp đối xứng trong **cùng một cú chạm**:

| Ngón tay | Kết quả | Ngưỡng |
|---|---|---|
| **ĐI** quá `holdBreakTravel` tính từ điểm dừng gần nhất | ra **dao** ngay | 26px (0.07 S) — **không cần vận tốc** |
| **DỪNG** quá `sliceStillMs` | **súng** tự rút ra bắn | 150 ms |

Không còn lần nào phải nhấc tay để đổi vũ khí.

**Vì sao bỏ được điều kiện vận tốc.** Trước đây phá khoá cần `1.15 × slideVelocityThreshold` = 414 px/s —
ngưỡng *cao hơn* cả ngưỡng nhận diện quẹt thường, đặt cao có chủ đích để một cú rê tay khi hold-and-drag
không phá nhầm. Không còn hold-and-drag thì không còn cái cần chống, và cái ngưỡng đó chỉ còn là thuế:
đo được một cú kéo dứt khoát ở **150–200 px/s bị nuốt hoàn toàn** — vẫn bắn, không ra dao.

**Cái chống chém oan bây giờ là MỐC TỰ ĐẶT LẠI, không phải vận tốc.** Ngón cái đặt trên màn hình luôn
xê dịch. Nên mốc đo quãng đường được **đặt lại mỗi khi ngón tay chậm hơn `holdRestVel` (90 px/s)**: xê
dịch chậm không bao giờ cộng dồn, dù trôi bao xa. Đo: giữ bắn rồi trượt **40px trong 1.2 giây** (trung
bình 39 px/s) → **0 nhát chém oan**. Muốn ra dao thì phải đi 26px *mà không dừng lại giữa chừng* — tức
là một cử động thật, không phải một cái trôi tay.

### Nhả tay khỏi giữ-bắn là một tuyên bố ý định

Kể cả khi vẫn nhấc tay, thao tác đó trước đây **không đạt được gì**:

| Bước | Trạng thái input | Súng |
|---|---|---|
| Đang giữ bắn | `HOLD_FIRE` | ra ngoài |
| **Nhả tay** | `IDLE` | **vẫn ra ngoài** — `gunHoldSec` 0.30s mới cất |
| Chạm lại sau 130ms | **`HOLD_FIRE` lại** | vẫn ra ngoài → bắn lại **ngay**, không có độ trễ rút súng |

Cú chạm mới bị ném thẳng trở lại cho súng, và vì súng chưa kịp cất nên nó bắn lại tức thì. Đo được:
nhả tay rồi quẹt tốn **72px** mới ra dao, còn **không** nhấc tay mà vẩy thẳng chỉ tốn **48px** — nhấc
tay bị phạt *nặng hơn* là không nhấc. Sửa: trong `weaponSwitchWindow` (300ms) sau khi nhả tay, quãng
đường chốt rút về `slideMinLength` và súng phải đợi `reholdDelay` (220ms) mới được tóm lại ngón tay.

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

`tapMaxDuration` **180 → 130ms**. Đây là độ trễ từ lúc chạm tới lúc súng bắt đầu bắn liên tục — nó phải đủ
dài để phân biệt với một cú quẹt chém, và đủ ngắn để không thấy khựng.

**Máy trạng thái phải được đánh thức bằng HẸN GIỜ, không phải bằng `pointermove`.** Bản đầu chỉ kiểm tra
`elapsed >= tapMaxDuration` bên trong hàm xử lý `pointermove`; giữ ngón tay **đứng yên** thì không có sự kiện
move nào, máy trạng thái kẹt ở `PENDING`, và tới lúc nhả tay nó thành một cái TAP. Nghĩa là **phải rê tay mới
bắn liên tục được**. Đo sau khi sửa: giữ yên hoàn toàn → vào chế độ bắn liên tục sau **132ms**.

Hẹn giờ phải bị **huỷ** ở hai chỗ: khi khoá sang SLIDE, và khi nhả tay. Không huỷ thì một cú quẹt chém sẽ
rút súng ra giữa chừng. Đo: quẹt nhanh → vào chế độ chém, **không** ra súng, tốn **0 đạn**.


## 2c. BỎ quẹt dọc — và vùng chết mất lý do tồn tại theo

Quẹt dọc lên (Xốc Tới) và quẹt dọc xuống (Bước Lùi) **đã bị gỡ**. Hệ quả dây chuyền:

1. **Mọi cú quẹt đều là chém**, bất kể góc. Không còn phải phân giải hướng.
2. **Vùng chết 55–65° không còn gì để tách.** Nó sinh ra để phân biệt "quẹt để chém" với "quẹt để di
   chuyển"; bỏ vế thứ hai thì vế thứ nhất chiếm trọn. Đã gỡ `gs_deadzone`, `gs_slide_up`, `gs_slide_down`
   khỏi `controls.json`, và gỡ luôn hai tham số chết `meleeAngleMax` / `moveAngleMin`.
3. **Tỉ lệ input bị huỷ — cổng go/no-go của Sprint 0 — về 0 theo định nghĩa.** Không còn input nào bị bỏ
   qua. Rủi ro R1 ("người chơi muốn bắn mà ra dao") giờ chỉ còn ở ranh giới tap-vs-quẹt, không phải ở góc.
4. **Chế độ Hai Vùng đã gỡ.** Nó là phương án thoát cho rủi ro R1; với sơ đồ hai gesture (chạm = bắn,
   quẹt = chém) thì nó thừa.
5. **Đòn AoE của Ogre không còn counter bằng NÉ.** Counter duy nhất còn lại là **giết nó trước khi vung** —
   xem `09` mục 2b. Gate "né được bằng 1 Bước Lùi" đã gỡ khỏi audit; gate cửa sổ telegraph vẫn giữ, và giờ
   nó có nghĩa là "đủ thời gian để kịp giết".

## 3. Tham số tinh chỉnh (đưa vào `data/controls.json`, không hardcode)

| Tham số | Mặc định | Ghi chú tune |
|---|---|---|
| `tapMaxDuration` | 130 ms | Tăng nếu tester "muốn bắn mà ra dao" |
| `tapMaxTravel` | 0.05 S | |
| `slideVelocityThreshold` | **360 px/s** | **Số quan trọng nhất của game.** 900 px/s trên màn 390px CSS là **2.3 chiều rộng màn hình mỗi giây** — một cú *bung* tay, không phải một cú quẹt. Hậu quả: quẹt bình thường bị đọc thành `HOLD` (rút súng), và do luật khoá thì không ra dao được nữa cho tới khi nhấc tay. 360 = 0.96 chiều rộng/giây. An toàn vì cú tap được bảo vệ bằng luật NGÓN TAY ĐÃ DỪNG (mục 2d), không phải bằng ngưỡng vận tốc cao |
| `slideMinLength` | 0.12 S | Quãng đường tối thiểu để tính là chém lúc **nhả tay** |
| `slideCommitLength` | **0.18 S** | Đi đủ xa này thì **chốt** thành nhát chém ngay giữa cú, không đợi nhả tay |
| `tapStillMs` | **60 ms** | Không có cử động nào trong ngần ấy ms trước lúc nhả = ngón tay đã dừng = **TAP** |
| `holdBreakTravel` | **0.07 S** | Đang giữ bắn mà ngón đi quá ngần này tính từ điểm dừng gần nhất → **chém ngay, không cần vận tốc**. Xem mục 2e |
| `holdRestVel` | 90 px/s | Dưới mức này coi là ngón đang **dừng** → đặt lại mốc. Ngón cái xê dịch từ từ (đo được ~39 px/s) không cộng dồn thành chém oan |
| `sliceStillMs` | **150 ms** | Đang chém mà ngón dừng ngần này → **súng tự rút ra bắn** |
| `weaponSwitchWindow` | 300 ms | Nhả tay khỏi giữ-bắn rồi chạm lại trong ngần này = **đang đổi vũ khí** → quãng đường chốt rút về `slideMinLength` |
| `reholdDelay` | 220 ms | Trong cửa sổ trên, súng phải đợi ngần này mới được tóm lại ngón tay |
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
