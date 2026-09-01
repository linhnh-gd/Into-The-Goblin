# 08 — NGÃ BA HẦM & NHỊP LEO THANG

> **Ghi chú thay đổi thiết kế.** Bản trước của doc này là hệ **"Chuông Tham"**: người chơi tự gõ chuông ở
> Cổng để bơm độ khó lấy multiplier vàng. Đó là **cơ chế lõi của Guns 'n Goblins** (Bell Ringer gõ chuông
> triệu hồi horde), và ta **không mượn cơ chế của họ**. Từ Guns 'n Goblins ta chỉ lấy **feel**: cảm giác
> một mình giữa mật độ quái khổng lồ.
>
> Doc này là hệ thay thế, dựng từ chính docs gốc của dự án.

---

## 1. Hai câu trong docs gốc quyết định thiết kế này

| Dòng docs gốc | Nghĩa thiết kế |
|---|---|
| *"độ khó mỗi wave sẽ tăng dần, có thể là tăng số lượng, loại quái mới khoẻ hơn"* | Độ khó **do hệ thống tự tăng**, không phải người chơi chọn. Đây là chỉ dẫn rõ ràng — ta làm đúng thế |
| *"Wave ngẫu nhiên có tỉ lệ nhỏ có các room event thưởng tiền, nâng cấp súng, hồi máu"* | Có phòng thưởng, xuất hiện ngẫu nhiên. Ta nâng cái **ngẫu nhiên** đó thành **lựa chọn có thông tin** |

Từ đó ra hai hệ tách biệt:

- **Leo thang** = việc của hệ thống. Tự động, không có nút nào cho người chơi.
- **Ngã Ba Hầm** = việc của người chơi. Mỗi Cổng chọn một trong hai cửa.

---

## 2. Leo thang tự động (hệ thống)

```
R = chỉ số phòng toàn cục = (Depth-1)*10 + phòngTrongDepth
w = chỉ số wave trong phòng (1..3)

enemyHP(e, R, w)  = e.hp  * 1.068^(R-1) * (1 + 0.06*(w-1))
enemyDmg(e, R)    = e.dmg * 1.055^(R-1)
TP_budget(R, w)   = round((14 + 4.2*R) * (1 + 0.18*(w-1)) * roomTypeMult)
```

Ba trục tăng cùng lúc, đúng như docs gốc nói:

| Trục | Cách tăng | Người chơi cảm nhận thế nào |
|---|---|---|
| **Số lượng** | `TP_budget` tăng tuyến tính theo `R`, thêm 18% mỗi wave trong phòng | Wave 3 luôn đông hơn wave 1 rõ rệt |
| **Sức mạnh** | HP ×1.068/phòng (gấp đôi mỗi ~10.5 phòng), damage ×1.055/phòng | "Con này dai hơn con lúc trước" |
| **Loại quái mới khoẻ hơn** | Mỗi Depth giới thiệu 1–3 loại mới; affix bật từ Depth 4 | Cứ xuống một tầng là gặp thứ chưa biết |

### Mật độ — chỗ lấy feel của Guns 'n Goblins

| `R` | Depth | Số quái / wave (Thuỷ Triều) | HP mỗi con |
|---|---|---|---|
| 1 | D1 | 29 | ×1.0 |
| 5 | D1 | 56 | ×1.3 |
| 10 | D1 | 89 | ×1.8 |
| 20 | D2 | 155 | ×3.5 |
| 40 | D4 | 289 | ×13.0 |
| 70 | D7 | 489 | ×93.6 |

Bảng này do `build_pages.ps1` tính lại mỗi lần build — bản chuẩn nằm ở `docs/gen-escalation.md`.

Ngưỡng **60 con cùng lúc** đạt được ở khoảng **R6 — tức vẫn còn trong Depth 1**. Người chơi gặp cảnh
"một mình giữa cả hầm" trong **run đầu tiên**, không phải sau 10 giờ. Đó là toàn bộ phần ta lấy từ
Guns 'n Goblins, và nó là phần khó nhất về kỹ thuật (xem `06` mục 4 và `15` mục 4).

Hard cap: 40 quái full-AI · 240 quái sống · vượt thì thành crowd agent chạy flow-field.

---

## 3. Ngã Ba Hầm (quyết định của người chơi)

```
   [DỌN SẠCH PHÒNG]
        |
        v
   +-------------------------------------------------+
   |   CHỌN 1 THẺ NÂNG CẤP  [ 1 ]  [ 2 ]  [ 3 ]      |
   |                        (đổi thẻ: ad / 80 vàng)  |
   |-------------------------------------------------|
   |   LỘC 8            VÀNG 3,240                   |
   |-------------------------------------------------|
   |                                                 |
   |   +---------------------+  +------------------+ |
   |   |   CỬA TRÁI          |  |   CỬA PHẢI       | |
   |   |   PHÒNG CHIẾN       |  |   MIẾU MỎ        | |
   |   |   [ĐÔNG]            |  |   [YÊN]          | |
   |   |   ~90 quái          |  |   đổi Lộc        | |
   |   |   vàng x1.25        |  |   hồi máu        | |
   |   +---------------------+  +------------------+ |
   +-------------------------------------------------+
```

| Luật | Chi tiết |
|---|---|
| Vị trí | Mọi Cổng, **trừ** sau phòng 1 (đang dạy combat), phòng 9 (Shop cố định) và phòng 10 (Boss) |
| Số cửa | **2** (3 cửa nếu có talent `tl_den_bandoham` bậc 5, hoặc xem 1 ad) |
| Biển báo | Luôn nói trước **loại phòng + 1 tag**. Không bao giờ úp mở |
| Chọn rồi | Cửa kia đóng. Không quay lại |

### Bảng tag trên biển báo

| Tag | Nghĩa |
|---|---|
| **đông** | TP ×1.25, nhiều trash, nhiều vàng |
| **có Elite** | 1 Elite + hộ vệ, rơi Chìa Khoá, **+2 Lộc** |
| **tối** | Dải Xa chỉ thấy mắt đỏ; vàng ×1.3; Sương Đen tới sau 28s |
| **hẹp** | Hành lang hẹp: knockback hiệu quả hơn nhưng không có chỗ lùi |
| **có thợ rèn** | Nâng 1 vũ khí +1 level trong run |
| **có suối** | Hồi máu |
| **có hòm** | Vàng lớn + Phôi Rèn + 1 Lộc |
| **yên** | Không quái: Shop hoặc Miếu Mỏ |

### Bốn ràng buộc (director cưỡng chế, không nói ra cho người chơi)

1. Hai cửa **không bao giờ cùng tag** — luôn phải là một lựa chọn thật.
2. Nếu `HP < 35%`: ít nhất một cửa phải có nguồn hồi máu.
3. Nếu `đạn dự trữ < 25%`: ít nhất một cửa phải có Shop hoặc hòm đạn.
4. Không hai phòng **đông** liền nhau ở Depth 1–2.

**Vì sao Ngã Ba hay hơn "phòng ngẫu nhiên":** cùng một nội dung, nhưng người chơi **tự lo cái mình đang
thiếu**. Hết máu thì đi cửa có suối và chấp nhận ít vàng. Đang mạnh thì lao vào cửa đông. Cái quyết định
đó xảy ra **ngay sau khi vừa dọn xong một phòng** — lúc người chơi biết chính xác build của mình mạnh cỡ
nào. Đó là thông tin đầy đủ, nên nó là quyết định *chiến thuật*, không phải *đánh cược*.

---

### 3d. Ngã Ba phải là một CHỖ, không phải một cái menu

Trước đây chạy hết 150m là người chơi **đứng sựng lại giữa một đám quái còn sống**, rồi một lớp UI
phủ lên trên. Ngã Ba Hầm — thứ mà mục 3 gọi là "quyết định không gian" — thực ra không hề tồn tại
trong không gian: nó là hai cái nút. Và vạch đích không có hình hài gì cả, nên người chơi không
*tới* đâu hết, họ bị một cái menu chặn lại giữa lúc đang bắn.

Bây giờ cuối hành lang là một **bức tường có hai cửa**:

| | |
|---|---|
| Khi nào hiện | Khi còn cách cửa `doorRevealM` = **45m** — tức từ khoảng **mét 127** |
| Ở đâu | `doorApproachM` = **22m** sau vạch đích |
| Dừng ở đâu | `doorStopGapM` = **10m** trước cửa |
| Quái | **Thưa dần về 0** trong `endTaperM` = 30m cuối, không bị xoá |
| Sau vạch đích | **Không bắn, không chém được** (`advancing`) |

**Cổng phải được BÁO TRƯỚC, và quái phải TỰ HẾT.** Bản đầu dựng cửa đúng lúc chạm 150m,
cùng lúc đám quái phía trước bị dọn một loạt — hai sự kiện đó đập vào nhau thành một cái
giật: cổng *bật* ra và quái *biến mất*. Người chơi không đọc được là mình đã đi hết đường;
họ đọc được là game vừa cắt cảnh.

Vị trí cửa tính được **từ đầu phòng** (`roomStartZ − roomDist − doorApproachM`), nên nó hiện
ra khi còn cách 45m — thấy trước khoảng **5.5 giây**. Và mật độ spawn giảm tuyến tính về 0
trong 30m cuối, kèm luật **không spawn con nào rơi ra sau vạch đích**. Đo:

| mét | quái phía trước |
|---|---|
| 102 | 33 |
| 121 | 17 |
| 132 | 9 |
| 136 | 3 |
| **139** | **0** |

Hành lang **tự trống** trước vạch đích 11m. Cái `despawnAhead` ở vạch đích vẫn giữ, nhưng
giờ nó gần như không còn gì để dọn — nó là lưới an toàn, không phải cơ chế.

> **Sương nuốt mất cổng.** Lần đầu cửa hiện đúng chỗ đúng lúc mà người chơi vẫn không thấy
> gì: `FogExp2` mật độ 0.055 thì ở 31m đã che **94%**. "Hiện ra sớm" thành vô nghĩa. Lòng cửa
> là một **ngọn đèn**, không phải một mảng tường — nên nó đặt `fog: false` để xuyên qua sương.

**Vì sao dừng ở 10m chứ không phải sát cửa.** Màn dọc: `fovDegVertical` 72° là góc nhìn **dọc**,
còn bề ngang hẹp hơn nhiều (~37° ở tỉ lệ 9:19.5). Ở 3m trước tường chỉ thấy được **2.1m bề ngang** —
không đủ cho một cánh cửa, chứ đừng nói hai. Muốn "chọn giữa hai cửa" thì hai cửa **phải cùng nằm
trong một khung nhìn**; nếu không thì nó lại thành hai cái nút, chỉ khác là bằng polygon.
Kéo theo: hai cửa kê sát nhau hơn (tâm cách trục 1.8m thay vì `hallWidth/4` = 2.25m).

**Quái phía trước giải tán KHÔNG rơi vàng.** Giết được trước vạch đích mới ăn vàng — 150m vì thế là
một **hạn chót thật**, không phải một cái vạch kẻ cho vui. Bỏ chạy là mất phần vàng đó.

**Màu.** `15` đặt luật vàng là **màu ấm duy nhất** của game, nên không được bịa thêm một màu thứ hai
cho cửa "nguy hiểm" — làm thế là phá chính cái luật khiến Goblin Vàng đọc được. Hai cửa đều vàng,
cửa **nóng** (`đông` / `tối` / `hẹp` / `có Elite`) chỉ lệch sang phía đỏ hơn: vẫn trong họ vàng,
nhưng mắt đọc ra ngay là không giống nhau.

## 4. Lộc — hệ thưởng cho chơi giỏi

Bản trước dùng Greed (tự làm khó) để đẩy chất lượng thẻ. Thay bằng **Lộc**: kiếm bằng **chơi giỏi**.

| Kiếm Lộc | +bao nhiêu |
|---|---|
| Giết Elite | **+2** |
| Phá hòm Kho Báu | +1 |
| Clear một phòng **không mất máu** | +1 |
| Mỗi 10 lần Chém Hoàn Hảo | +1 |
| Giết boss | +3 |
| Talent `Lộc Sẵn` | +2 → +10 lúc bắt đầu run |

Trần: **20** (24 với talent bậc 5, 28 với Bảo Vật `Lõi Mỏ`).

### Lộc dùng để làm gì

| Tiêu ở đâu | Đổi được gì |
|---|---|
| **Miếu Mỏ** | 4 Lộc + 200 vàng → 1 thẻ **epic** chọn từ 3 |
| **Miếu Mỏ** | 6 Lộc + 350 vàng → hồi đầy HP |
| **Suối Máu** | 4 Lộc → hồi 100% HP thay vì 60% |
| Thụ động | Đẩy rarity thẻ ở mọi Cổng, và tăng tỉ lệ cột vàng |

### Rarity thẻ theo Lộc

```
w_common = max(6, 60 - 2.6*L)     w_rare   = 28 + 1.3*L
w_epic   = 10 + 1.0*L             w_legend =  2 + 0.4*L      (chuẩn hoá về 100)
```

| `L` | common | rare | epic | legendary |
|---|---|---|---|---|
| 0 | 60% | 28% | 10% | 2% |
| 8 | 39% | 38% | 18% | 5% |
| 14 | 24% | 46% | 24% | 7% |
| 20 | 8% | 54% | 30% | 10% |

**Điểm mấu chốt:** Lộc là tài nguyên có **chi phí cơ hội thật**. Tiêu 4 Lộc lấy thẻ epic ngay, hay giữ Lộc
để mọi thẻ từ giờ tới cuối run đều xịn hơn? Đó là quyết định lặp lại 3–4 lần mỗi run, và nó không đòi người
chơi phải tự làm khó mình mới có thưởng.

---

## 5. Áp lực: Sương Đen (không phải người chơi tự bơm)

Không có dial độ khó, nên **áp lực thời gian gánh vai trò giữ nhịp**. Xem `06` mục 3 cho spec đầy đủ.

| Tham số | Giá trị |
|---|---|
| Kích hoạt | Ở trong một phòng **> 35s** |
| Từ phòng 8 của mỗi Depth | **28s** (hầm càng sâu càng ít kiên nhẫn) |
| Thẻ `SẬP HẦM` | **20s** — cái giá của thẻ legendary mạnh nhất |
| Hoãn được | `Cột Chống Hầm` ở shop (400 vàng, +20s cho 3 phòng tới) · Bảo Vật `Đèn Không Tắt` (tắt hẳn, đổi bằng −20% vàng) |

Đây là cách giữ được cảm giác "không được dừng" của Into the Dead khi nhân vật không còn tự chạy liên tục.

---

## 6. Bảng đối chiếu: cái gì thay cái gì

| Vai trò trong bản cũ (Chuông Tham) | Bản này thay bằng |
|---|---|
| Người chơi tự chọn độ khó | **Không còn.** Độ khó tự tăng theo `R` và `w` (đúng docs gốc) |
| Multiplier vàng theo bậc chuông | Tag **đông**/**tối** trên cửa (×1.25 / ×1.3), Lò Vàng, cột vàng |
| Rarity thẻ tốt hơn khi tự làm khó | **Lộc** — thưởng cho chơi giỏi |
| Quyết định lớn mỗi 30–60s | **Ngã Ba Hầm** — chọn cửa |
| Câu chuyện tự kể của mỗi run | *"tao chọn cửa tối ở phòng 7 rồi hộc máu"* — vẫn có, vẫn share được |
| Áp lực không cho rùa | **Sương Đen** (đã có sẵn, giờ gánh nhiều hơn) |
| Vũ khí scale theo bậc chuông | Vũ khí **deeptech** scale theo **Depth** |

## 7. Ràng buộc (audit)

1. **GATE:** không file data nào được chứa `greed` / `Chuong Tham` / `bell` / `bastion` — kiểm tra bằng
   quét văn bản trong `audit_gdd.ps1`. Đây là gate chống việc cơ chế cũ lẻn trở lại.
2. `scaling` của quái không được có khoá nào chứa `Greed`.
3. `hpPerRoom > 1.0` **và** `hpPerWave > 0` — độ khó phải thật sự tự tăng.
4. Mật độ ≥ **60 con/wave** phải đạt được **trước phòng R20** (kiểm tra bằng composition thực của wave
   flood dùng trong phòng chiến thường, không phải tpCost trung bình toàn pool).
5. `maxTotalAlive ≥ 150`.
6. Affix chỉ bật từ **Depth 4**.
7. Mọi Cổng (trừ phòng 1/9/10) có `forkPool` ≥ 2 cửa; bảng biển báo ≥ 4 tag; ≥ 3 ràng buộc ẩn.
8. `luck` là currency phạm vi `run`, có ≥ 3 nguồn và ≥ 1 chỗ tiêu.
