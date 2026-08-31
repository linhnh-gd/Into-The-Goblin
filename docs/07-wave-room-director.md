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
