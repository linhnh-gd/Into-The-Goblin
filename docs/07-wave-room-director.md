# 07 — Wave Director & Room Graph

Docs: *"Trong dungeon sẽ chia thành nhiều wave và room"* · *"độ khó mỗi wave sẽ tăng dần, có thể là tăng
số lượng, loại quái mới khoẻ hơn"* · *"Wave ngẫu nhiên có tỉ lệ nhỏ có các room event thưởng tiền, nâng
cấp súng, hồi máu,..."*

---

## 1. Cấu trúc một Depth

```
   DEPTH (1 tầng hầm) = 10 phòng
   |
   +-- Phòng 1     : Combat (nhẹ, warm-up)
   +-- Phòng 2     : Combat
   +-- Phòng 3     : ngẫu nhiên (Shop 40% / Miếu 35% / Kho báu 25%)
   +-- Phòng 4     : Combat
   +-- Phòng 5     : Elite
   +-- Phòng 6     : ngẫu nhiên (Event 60% / Shop 25% / Gauntlet 15%)
   +-- Phòng 7     : Combat (đông)
   +-- Phòng 8     : Combat (đông + trộn hạng)
   +-- Phòng 9     : Shop (luôn luôn — nạp đạn/máu trước boss)
   +-- Phòng 10    : BOSS
```

Cố định vị trí nhịp (phòng 3 nghỉ, 5 elite, 9 shop, 10 boss) nhưng **nội dung ngẫu nhiên**. Đây là công
thức của Archero: người chơi biết nhịp nên lập kế hoạch được, nhưng vẫn không biết mình sẽ gặp gì.

## 2. Các loại phòng

| Loại | Tần suất | Nội dung | Thưởng |
|---|---|---|---|
| **Combat** | 55% | 1–3 wave | Vàng từ kill + 1 card ở Cổng |
| **Elite** | 10% | 1 elite + hộ vệ | Vàng x2.5 + card rarity +1 bậc |
| **Shop** (Lão Buôn Xác) | 9% | Mua: đạn, máu, thẻ, ổ đạn to hơn, Cột Chống Hầm (hoãn Sương Đen) | tiêu vàng |
| **Miếu Mỏ** | 8% | Chỗ TIÊU Lộc: 4 Lộc + 200 vàng → thẻ epic · 6 Lộc + 350 vàng → hồi đầy HP · hoặc 1 bùa vĩnh viễn | buff |
| **Kho báu** | 6% | Không quái. Hòm cần chém đúng 3 nhát để phá | vàng lớn + phôi rèn |
| **Event** | 6% | Xem bảng dưới | tuỳ |
| **Gauntlet** | 4% | 60s, quái vô hạn, càng giết càng nhiều vàng, tự chọn thoát | vàng x rất nhiều |
| **Boss** | 2% | Boss + wave phụ | mở Depth sau, phôi rèn, relic |

### Event room (bảng roll)

| Event | Nội dung | Nhắc từ docs |
|---|---|---|
| **Bàn thợ rèn** | Nâng 1 vũ khí +1 level ngay trong run | "nâng cấp súng" |
| **Suối máu** | Hồi 60% HP, hoặc hồi 100% nhưng mất 4 Lộc | "hồi máu" |
| **Hòm vàng đổ** | Vàng đổ ra như thác 8s, phải chạy quanh hút | "thưởng tiền" |
| **Cân Vàng** | Đặt vàng lên cân, đổi thành thẻ theo mức: 500 = rare, 1.500 = epic, 4.000 = legendary | "thưởng tiền" + "nâng cấp súng" |
| **Xác đồng nghiệp** | Nhận loadout của một người chơi đã chết (weapon ngẫu nhiên tier cao hơn) | flavour |
| **Đổi máu lấy đạn** | −25% HP tối đa, +100% đạn dự trữ | quyết định thật |
| **Lồng tù nhân** | Giải cứu → NPC bắn hỗ trợ hết Depth | |
| **Cửa khoá** | Cần chìa (drop từ Elite). Bên trong: relic | tạo lý do đánh Elite |

Dữ liệu: `data/rooms.json` → `gen-rooms.md`.

## 3. Wave Director

### 3.1 Threat Points (TP)

Mỗi wave có một **ngân sách TP**, mỗi loại quái có **giá TP**. Director tiêu hết ngân sách theo template
composition. Đây là cách đảm bảo "khó dần" mà không phải viết tay 700 wave.

```
TP_budget(R, G) = round( (14 + 4.2 * R) * (1 + 0.35 * G) * roomTypeMult )

   R = chỉ số phòng toàn cục = (Depth-1)*10 + phòngTrongDepth
   roomTypeMult: Combat 1.0 · Elite 1.4 · Gauntlet 2.2 · Boss 1.6 (chưa tính boss)
```

### 3.2 Luật cưỡng chế (hard constraints — director không được vi phạm)

| Luật | Giá trị |
|---|---|
| Quái full-AI cùng lúc | ≤ 40 (còn lại là crowd agent chạy flow-field) |
| Tổng quái sống cùng lúc | ≤ 240 |
| Quái đang bắn người chơi | ≤ 3 |
| Exploder ở dải Cận chiến | ≤ 2 |
| Elite ngoài phòng Elite | ≤ 1 |
| Loại quái khác nhau trong 1 wave | ≤ 4 (đọc không kịp nếu hơn) |
| Quái mới (chưa từng gặp) | Chỉ giới thiệu **1 loại / phòng**, và **luôn xuất hiện đơn lẻ ở lần đầu** |

### 3.3 Nhịp trong phòng

```
   Wave 1 spawn ngay khi vào phòng (0.4s delay cho camera)
      |
      v
   con cuối chết  ---> chờ 1.5-2.0s  ---> Wave 2 spawn
      |                (vàng tự hút về trong lúc này)
      v
   dọn sạch phòng ---> SLOW-MO 0.35s @ 0.4x ---> Cổng
```

Con số **1.5–2.0s** lấy từ devlog Rogue Wave (họ sửa từ timer cứng ~60s downtime xuống "5 giây sau khi con
cuối chết" và game hay hẳn lên) rồi siết lại cho nhịp mobile. Đủ để thở, không đủ để mất đà.

### 3.4 Nhịp cảm xúc trong 1 Depth (build-up → peak → relax)

```
 áp lực
   ^                                        ####  <- Boss
   |                          ####              #
   |            ####     ####     #        #
   |    ####  #    #   #     #     #     #
   |  #     #      # #        #     #   #
   +--1--2--3--4--5--6--7--8--9--10---> phòng
         ^shop/miếu      ^event   ^shop
```

Không có hai phòng đông liền nhau ở Depth 1–2 (dạy trước, ép sau). Từ Depth 3 cho phép 2 phòng đông liền
nhau nếu `G ≥ 3` (người chơi đã tự xin).


## 3.5. Mô hình QUÃNG ĐƯỜNG (thay cho "diệt hết mới qua")

Phòng **không** kết thúc khi diệt hết quái. Phòng kết thúc khi người chơi **chạy hết `run.roomDistanceM` mét**.
Đây là mô hình của *Into the Dead*: nhân vật tự tiến lên liên tục, quái ra dọc đường, và **không cần giết hết**.

| Số (ở `data/gamefeel.json` khối `run`) | Giá trị | Ý nghĩa |
|---|---|---|
| `speedMps` | **4.2** | Người chơi tự chạy, không có nút di chuyển. **Quái đứng yên** |
| `roomDistanceM` | **150** | Một phòng = 150m ≈ **35.7s** |
| `waveSegmentM` | **50** | 150 / 50 = **3 wave**, mỗi wave một đoạn đường |
| `densityRampEnd` | 1.35 | Số mũ đường cong ra quái trong một đoạn: cuối đoạn đông hơn đầu đoạn |
| `contactM` | 1.0 | Người chơi chạy vào trong khoảng này thì **va phải quái** |
| `lanes.midHalfWidthM` | 2.0 | **Làn giữa (±2.0m) là làn duy nhất gây damage** — xem `09` mục 2c |
| `tapNearM` | 2.4 | Khoảng gần nhất mà quái còn **tap được** (xem mục dưới) |

**Wave sau dồn dập hơn mà không cần dial:** số wave suy ra từ quãng đường, và `tpBudget(R, w)` đã tăng theo `w`
(`×1.18` mỗi wave). Nên một phòng 150m tự động là ba đợt tăng dần — không có tham số "độ khó" nào phải tinh chỉnh tay.

**Ba luật bất biến của mô hình này** (cả ba đều đã bị vi phạm một lần, xem `18` lỗi #39):

1. **Không phòng nào được có ít wave hơn `roomDistanceM / waveSegmentM`** — kể cả phòng Elite và Boss.
   Đặt "một wave lớn trải dài cả quãng đường" là bẫy: vòng spawn rải hàng đợi theo **một đoạn**, nên
   quái hết ở mét 50 còn người chơi vẫn phải chạy nốt 100m trong hành lang trống. Elite/Boss ra ở
   **wave 1**, các wave sau vẫn là wave thường.
2. **Không cắt số quái của wave theo `hardCaps.maxTotalAlive`.** Đó là trần **số con sống cùng lúc**
   (giới hạn perf của instanced mesh), không phải trần **tổng số con** của một wave. Quái đứng yên, bị
   bỏ lại phía sau rồi despawn (`despawnBehindM`) — nên tổng của một wave **được phép** lớn hơn trần đó
   nhiều lần. Cái trần chỉ được phép **làm chậm nhịp ra quái**, không được phép **xoá bớt quái**.
3. **Mỗi wave phải có loại quái chưa gặp trong phòng đó.** Director ưu tiên template chưa dùng và có ít
   nhất một `enemy` chưa xuất hiện; hết cái mới thì mới cho lặp. Đây là vế "loại quái mới khoẻ hơn" của
   docs gốc — leo thang không chỉ là **đông hơn**, mà còn là **khác đi**.

**Quái ở làn giữa mà không giết kịp thì người chơi VA phải:** mất máu **một lần**, quái **biến mất**, và
**không rơi vàng**. Quái ở hai làn bên thì chạy qua vô hại — giết chúng là **vàng thêm**. Đây là áp lực
thay thế cho "diệt hết": bỏ qua làn giữa thì mất máu, bỏ qua làn bên thì chỉ mất bonus.

> **Sương Đen mất lý do tồn tại ở phòng thường.** Nó được thiết kế để chống cắm phòng (`08`). Trong mô hình
> quãng đường người chơi **không thể** cắm phòng — luôn bị đẩy về phía trước. Áp lực chống thụ động giờ là
> chính đám quái tích tụ. Sương Đen chỉ còn hiệu lực ở phòng **boss** (nơi người chơi đứng lại). Số liệu vẫn
> giữ trong `waves.json` để dùng cho boss.

### Vì sao `tapNearM` phải tồn tại

Camera cao 1.62m, fov dọc 72°, chúi xuống 8°. Chiếu phối cảnh cho ra: điểm tap của quái (ở `0.62 × scale`)
nằm ở **92.7% chiều cao màn hình** khi quái ở 1.2m — tức **dưới cả nút NẠP**, không thể bấm.

`audit_gdd.ps1` tự tính con số này từ `data` và **FAIL** nếu nó ra ngoài dải 45–75% ở `camera.meleeBandScreenPct`:

| Khoảng | Vị trí trên màn hình (con nhỏ nhất, scale 0.74) |
|---|---|
| 1.2m (giá trị cũ, gây lỗi) | **100.1%** — ngoài khung hoàn toàn |
| **2.4m** (`tapNearM` hiện tại) | **72.1%** — trong dải |
| 8.5m (`rangedStandoffM`) | 48.7% |

Từ đó suy ra hai ràng buộc cứng, cả hai đều có gate:
1. **Vũ khí cận chiến phải với xa hơn `tapNearM`** — nếu không thì dao vô dụng đúng ở khoảng mà súng đã
   không bắn được nữa. Yêu cầu `reachM ≥ tapNearM + 0.4`; mọi vũ khí cận chiến đã được cộng **+0.8m**.
2. **Quái đứng lại để đánh phải đứng ở ≥ `tapNearM`** — quái ranged không có trường tầm bắn trong data nên
   trước đây dùng `ATTACK_RANGE = 1.2m`, tức "quái ném đá" đi tới sát mặt mới ném. Giờ có `rangedStandoffM = 8.5`.

## 4. Wave archetype (template composition)

| Archetype | Ý đồ | Thành phần | Dạy cái gì |
|---|---|---|---|
| **Dòng chảy** | Warm-up | 100% trash, tới đều từ giữa | Nhắm cơ bản |
| **Vây kép** | Chia chú ý | trash 2 bên + 1 ranged giữa | Chọn mục tiêu |
| **Bầy chạy** | Ép melee | 100% Runner, tới rất nhanh | Chém quét |
| **Tường khiên** | Chống spam | 3 Shield hàng đầu + trash sau | Búa / đánh sau lưng |
| **Mưa đá** | Ép tiến lên | 4 Ranged ở Dải Xa + ít trash | Không được rùa |
| **Bom sống** | Ép dãn cách | 3 Exploder + trash | Knockback |
| **Nặng đô** | Kiểm tra kite | 1 Heavy + trash | kbResist |
| **Hỗn chiến** | Đỉnh | trộn 4 loại, TP x1.3 | Tổng hợp |
| **Thuỷ triều** | Fantasy "đông" | 60+ trash cùng lúc, HP thấp | Chém Hoàn Hảo |
| **Săn Elite** | Trước boss | 1 Elite + 2 Shield + trash | DPS burst |

Dữ liệu: `data/waves.json` → `gen-waves.md`.

## 5. Sinh phòng bằng seed (deterministic)

```
seed_run   = hash(playerId, runIndex, patchVersion)
seed_room  = hash(seed_run, depth, roomIndex)
seed_wave  = hash(seed_room, waveIndex)
```

Cùng seed → cùng nội dung. Cần cho: replay, xem trước phòng kế (talent "Bản Đồ"), báo bug, và cho QA test lặp lại.

## 6. Ràng buộc (audit)

1. Mỗi Depth phải có **≥ 1 Shop** và **≥ 1 nguồn hồi máu** trước phòng Boss.
2. Không phòng nào có TP vượt **1.8x** TP của phòng liền trước (chống spike gây chết oan).
3. Mọi loại quái phải xuất hiện lần đầu ở một wave có `≤ 2` loại quái khác.
4. `expectedGoldG0` của một Depth phải ≥ **2 × (đạn rẻ nhất + máu rẻ nhất)** ở shop, **và** phải khớp
   mô hình tính từ chính data này (TP director × `goldDrop`) trong ±40%. Xem `11` mục 6.
