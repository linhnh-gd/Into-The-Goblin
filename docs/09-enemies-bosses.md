# 09 — Quái & Boss

Docs: *"độ khó mỗi wave sẽ tăng dần, có thể là tăng số lượng, loại quái mới khoẻ hơn"*.
Dữ liệu số: `data/enemies.json` → `gen-enemies.md`. Doc này là **triết lý**, không phải bảng số.

---

## 1. Nguyên tắc thiết kế quái

| # | Nguyên tắc |
|---|---|
| 1 | **Mỗi con quái tồn tại để phá một chiến thuật.** Nếu không trả lời được "con này chống lại kiểu chơi nào" thì cắt |
| 2 | **Nhận dạng bằng silhouette + màu, không bằng chi tiết.** Ở dải Xa chỉ thấy bóng và mắt |
| 3 | **Một con quái, một cơ chế.** Không con nào vừa tàng hình vừa hồi máu vừa triệu hồi |
| 4 | **Trash phải chết trong 1 phát / 1 nhát** ở Depth tương ứng. Trash dai = game nhão |
| 5 | Mỗi loại có **âm thanh riêng khi spawn** — nghe là biết phải làm gì, không cần nhìn |
| 6 | Quái phải "đáng chém": máu ít, đông, bay đẹp → nuôi Chém Hoàn Hảo và Cướp Đạn |

## 2. Bảng vai trò (chống chiến thuật gì)

| Hạng | Loại | Phá chiến thuật | Người chơi phải làm gì |
|---|---|---|---|
| Trash | Goblin Cùi | — (nền, để nổ vàng) | Gì cũng được |
| Trash | Goblin Chạy | Bắn chậm rãi từ xa | Chém quét / shotgun |
| Trash | Goblin Bầy (spawn theo cụm 8) | Bắn từng viên | Chém Hoàn Hảo |
| Ranged | Goblin Ném Đá | Rùa tại chỗ | Tiến lên / bắn tỉa |
| Ranged | Goblin Nỏ | Đứng ở dải Cận chiến chém | Đổi mục tiêu ưu tiên |
| Special | Goblin Thuốc Nổ | Để quái vào gần | Knockback / bắn sớm |
| Special | Goblin Khiên | Spam bắn thẳng | Búa / đánh sau lưng / chém nặng |
| Special | Dơi Hầm (bay) | Chém ngang | Bắn / chém chéo |
| Special | Goblin Đào Hầm (trồi lên sau lưng) | Chỉ nhìn phía trước | Bước Lùi + quay chém |
| Support | Goblin Trống (buff tốc độ đồng bọn) | Bỏ qua mục tiêu phụ | Ưu tiên giết |
| Support | Pháp Sư Xanh (khiên năng lượng cho đồng bọn) | Bắn AoE | Giết trước |
| Heavy | Ogre Hầm | Dựa vào knockback | Kite / bắn yếu điểm |
| Heavy | Đầu Bò Đá (charge thẳng) | Đứng giữa hành lang | Bước Lùi / nhường đường |
| Heavy | Goblin Béo (nổ thành 6 trash khi chết) | Giết bừa ở gần | Giết ở xa |
| Elite | Tướng Goblin | Mọi thứ (có 2 affix) | Dồn burst |
| Elite | Tên Đồ Tể | Cận chiến | Giữ khoảng cách |
| Elite | Ổ Vàng | Ăn vàng trên sàn rồi bỏ chạy mang theo | Chọn: rượt nó hay giữ hàng |

## 2b. Hai con phá chiến thuật đầu tiên — spec cài đặt

Đây là hai loại quái duy nhất (tính tới nay) đã cài **hành vi riêng** trong prototype. Số nằm ở
`data/enemies.json` field `behavior`; audit có gate kiểm tra khối này đầy đủ.

### Goblin Khiên (`behavior.kind = "shield"`)

| Tham số | Giá trị | Nghĩa |
|---|---|---|
| `frontRangedMult` | 0.30 | Damage **tầm xa** từ chính diện chỉ còn 30% |
| `cycleSec` / `openSec` | 4.0 / 0.8 | Mỗi 4s hở khiên 0.8s. **Trong lúc hở, mắt nó sáng vàng** — đó là tín hiệu duy nhất người chơi cần |
| `kbResist` / `kbResistBack` | 0.55 / 0.05 | Chắn được lực đẩy từ trước; sau lưng thì gần như không |
| `turnRateDeg` | 92 | **Quay chậm** — đây là thứ làm counter "đánh sau lưng" tồn tại thật |
| `frontalDot` | 0.20 | Ngưỡng coi là "chính diện" |
| `bypassArchetypes` | `hammer`, `acid` | Búa và axit bỏ qua khiên |
| `bypassHeavySlash` | true | Chém nặng bỏ qua khiên |

**Vì sao cần `turnRateDeg`:** bản doc đầu ghi counter "đánh sau lưng" mà không nói quái quay thế nào.
Trong một hành lang mà quái **luôn tự động hướng về người chơi**, "sau lưng" là vị trí không bao giờ tồn tại
— counter đó là counter giấy. Cho nó quay 92°/s thì **Xốc Tới** (quẹt dọc lên, tiến 2m) thật sự vòng được ra
sau trước khi nó kịp quay lại. Đây là phát hiện của prototype, xem `18` mục 4.

### Ogre Hầm (`behavior.kind = "slam"`)

| Tham số | Giá trị | Nghĩa |
|---|---|---|
| `attackRangeM` | **3.4** | Bắt đầu vung từ 3.4m. Không phải 2.6m — xem ô dưới bảng |
| `telegraphSec` | 0.6 | **Vòng đỏ hiện trên sàn** suốt 0.6s trước khi đập |
| `aoeRadiusM` | 2.5 | Chỉ trúng nếu người chơi **còn trong vòng** lúc đập xuống |
| `cooldownSec` | 2.6 | |
| `weakPointMult` | 2.0 | Tap vào **nửa dưới** hitbox (bụng) = damage ×2 |

**Cửa sổ vung phải đủ dài, nếu không đòn đặc trưng không bao giờ thấy được.** Người chơi tự chạy tiến
2.4 m/s, nên thời gian từ lúc Ogre vào tầm đến lúc bị va phải chỉ là `(attackRangeM − contactM) / speedMps`.
Với `attackRangeM = 2.6` cửa sổ đó là **0.67s** trong khi telegraph đã 0.6s, và `atk` khởi tạo ngẫu nhiên
1.3–2.6s — **người chơi chạy qua trước khi Ogre kịp đập**. Hai sửa đổi:

1. `attackRangeM = 3.4` → cửa sổ **1.0s**.
2. Quái đứng-lại-đánh bắt đầu telegraph **ngay khi vào tầm**, không chờ cooldown ngẫu nhiên.

Audit gate: `(attackRangeM − contactM) / speedMps ≥ telegraphSec + 0.25` cho **mọi** quái có telegraph.

**Luật bắt buộc: đòn AoE phải COMMIT.** Khi đã vào telegraph, Ogre vung **dù người chơi đã lùi ra xa**.
Nếu không commit thì Bước Lùi *huỷ* đòn thay vì *né* đòn, và người chơi mất hẳn cảm giác "vừa né được" —
tức là mất luôn lý do tồn tại của đòn AoE. Xem `18` mục 4.

Hợp đồng số, tính theo **điểm giáng đòn thật** chứ không theo `attackRange`:

```
impact = max(contactM, attackRangeM - speedMps * telegraphSec) = max(1.0, 3.4 - 1.44) = 1.96m

trung duoc khi dung im   : aoeRadiusM >= impact              -> 2.50 >= 1.96      OK
ne duoc bang 1 Buoc Lui  : impact + dodgeBackM > aoeRadiusM  -> 1.96 + 1.80 > 2.50 OK
```

**Bước Lùi phải là 1.8m, không phải 1.2m.** Chạy tiến 2.4 m/s trong 0.6s telegraph ăn mất 1.44m, nên lùi
1.2m chỉ đưa người chơi ra 2.36m — **vẫn nằm trong vòng AoE 2.5m**, tức né không thoát. Cả hai bất biến
trên đều có gate, nên đổi một con số là biết ngay con nào vỡ.

## 2c. Quái ĐỨNG YÊN, người chơi chạy — và BA LÀN

Mô hình cuối: **quái không di chuyển chút nào**. Người chơi chạy qua chúng. Đây là dáng của
*Into the Dead*: bạn là thứ duy nhất chuyển động, thế giới đứng chờ.

### Ba làn

| Làn | Bề rộng | Quái ở đây |
|---|---|---|
| **Giữa** | **4.0m** (`lanes.midHalfWidthM` = 2.0 mỗi bên) | **Gây damage.** Va vào người chơi → mất máu 1 lần, quái biến mất, **không rơi vàng** |
| Hai bên | 2.4m mỗi bên | **Không chạm được.** Người chơi chạy qua, không mất gì. Giết là **vàng THÊM** |

Đo thực tế, ngưỡng đúng bằng `midHalfWidthM`: **x ≤ 1.9m → mất 6 HP · x ≥ 2.1m → 0 HP**.

**Vạch làn phải vẽ trên sàn.** Luật "chỉ làn giữa gây damage" chỉ công bằng khi người chơi **nhìn thấy**
ranh giới. Không có vạch thì việc con nào nguy hiểm là thông tin ẩn. Hai vạch ở `x = ±2.0m`,
màu theo đuốc của biome, `lanes.markerOpacity`.

**Quái làn giữa spawn quanh trục** (`midSpawnJitterM` ±0.9), không trải hết làn. Nếu để một con đứng ở
x = 1.9 mà vẫn gây damage thì người chơi thấy nó đi qua **cạnh** mình 1.9m rồi mất máu — đọc ra như lỗi.
Khoảng 0.9m…2.0m là **vùng trống** không có quái nào. Có gate cho ràng buộc này.

`midSpawnFrac` = **0.32** → làn giữa nhận ~30 con mỗi phòng ở R1, làn bên ~123. Hai con số này **tách rời
nhau được** nhờ hệ 3 làn: nâng mật độ tổng lên 2.7× (`tpBase`/`tpPerRoom` ở `waves.json`) rồi hạ
`midSpawnFrac` để giữ số mối đe doạ không đổi — đông hơn mà **không** khó hơn. Đo: không bắn phát nào thì
mất 175 HP, tức bỏ qua hết làn giữa là chết.

Lưu ý khi tinh chỉnh: wave `pincer` dồn **toàn bộ** ra hai làn bên (`lane: "sides"` ở `waves.json`), nên số
thực đo ở làn giữa thấp hơn `tổng × midSpawnFrac` khoảng 1/3. Gate của audit là band sanity, không phải số
chính xác — có ghi chú trong script.

### Hệ quả của việc quái đứng yên

1. **Tốc độ tiếp cận = duy nhất tốc độ chạy của người chơi.** Nên cửa sổ phản ứng do **khoảng cách spawn**
   quyết định, không phải `speed` của quái.
2. **Trường `speed` trong `enemies.json` không còn điều khiển gì.** Giữ lại trong data cho boss và các
   hành vi riêng sau này, nhưng hiện tại nó là số chết — đừng tinh chỉnh nó rồi mong game đổi.
3. **`back_ambush` không thể spawn phía sau nữa** — quái đứng yên thì con ở sau lưng không bao giờ gặp được
   người chơi. Nó thành "khoảng cảnh báo ngắn nhất còn hợp lệ" (9–12m). Gate chặn mọi `spawnDistM ≤ 0`.
4. **Mọi khoảng cách spawn phải ≥ `tapNearM + minReactionSec × speedMps`** = 2.4 + 1.2×4.2 = **7.44m**.
   `ceiling_drop` trước đây spawn ở **5m** → chỉ 0.62s trước khi quái tụt khỏi vùng tap được. Xem `18` lỗi #17.

Hai loại quái vẫn khác nhau ở chỗ **có đánh chủ động hay không**:

| Kiểu | Ai | Hành vi |
|---|---|---|
| **Đánh chủ động** (`holds`) | `role: ranged`, và quái có `behavior.kind = "slam"` | Đứng yên, quay theo người chơi, và **đánh** khi người chơi vào trong `atkRange`. Bắn/đập được sang cả làn khác |
| **Chỉ chặn đường** | mọi loại còn lại | Đứng yên hoàn toàn. Chỉ gây damage nếu người chơi **chạy vào** nó, và chỉ khi nó ở làn giữa |

Đó là khác biệt thật giữa hai nhóm: **quái ranged đe doạ từ mọi làn, quái thường chỉ đe doạ ở làn giữa.**

## 3. Affix (chỉ từ Depth 4)

| Affix | Hiệu ứng | Tín hiệu |
|---|---|---|
| **Bọc Giáp** (D4) | +60% HP, kbResist +0.3 | vảy kim loại sáng |
| **Điên Máu** (D4) | +45% tốc độ khi HP < 50% | vệt đỏ |
| **Chai Sạn** (D4) | Giảm 40% damage từ tầm xa | khói xám |
| **Da Cứng** (D4) | Giảm 40% damage từ cận chiến | vỏ đá |
| **Nổ Xác** (D5) | Chết nổ AoE 20 | bụng phát sáng |
| **Hút Vàng** (D5) | Ăn vàng trên sàn, giết lại nhả x2 | vàng bám người |
| **Bóng Đôi** (D6) | Chết sinh 1 bản sao 30% HP | bóng mờ |

**Luật:** `Chai Sạn` và `Da Cứng` không bao giờ cùng lúc trên một con (sẽ không có cách nào giết).

## 4. Boss (7 con, 1 cho mỗi Depth)

Boss trên portrait phải: **to, chính diện, có yếu điểm cần tap chính xác, và mang wave phụ theo** để người
chơi vẫn phải dùng cả súng lẫn dao.

| Depth | Boss | Cơ chế phase 1 | Phase 2 | Phase 3 (chỉ Elite Depth) | Dạy cái gì |
|---|---|---|---|---|---|
| 1 | **Goblin Vương Béo** | Lăn ngang, nhả trash | Nôn ra vũng axit | Chia làm 2 con nhỏ | Cơ bản: bắn yếu điểm |
| 2 | **Đôi Song Sinh Rỉ** | 2 con, chia damage | Con còn lại điên máu | Hợp thành 1 | Chọn mục tiêu |
| 3 | **Tường Khiên Sống** | Khiên chắn 90% chính diện | Mở khiên 2s sau mỗi 4 đòn | Sinh 3 Shield | Kiên nhẫn / timing |
| 4 | **Nhện Trần Hầm** | Từ trên xuống, không knockback được | Tơ khoá màn hình 1s | Vô hình giữa các đòn | Không dựa vào knockback |
| 5 | **Ogre Mỏ** | Đập trụ chống: mỗi 20s trần sập, hành lang hẹp lại 15% (tối đa 3 lần) | Sóng xung từ chân | Cướp mất 1 thẻ của bạn | Áp lực thời gian, và không gian là tài nguyên |
| 6 | **Vua Xác Vàng** | Ăn vàng trên sàn để hồi máu | Nhả vàng thành đạn | Toàn bộ vàng trên sàn thành quái | Ép bỏ tham |
| 7 | **MẸ MỎ** | Khối thịt-quặng treo bằng 4 gân rễ; phải CHÉM đứt cả 4 (đạn không cắt được) | Triệu hồi mọi boss trước ở dạng bóng | Đảo ngược điều khiển tap/slide 5s | Tổng hợp toàn bộ |

**Luật boss:**
- TTK mục tiêu: **45–70 giây** ở `G=0` với loadout đúng tier.
- Mỗi phase phải có ít nhất một cửa sổ **bắt buộc dùng cận chiến** (khoá súng bằng cơ chế, không bằng UI).
- Boss không knockback được (`kbResist = 1.0`) — người chơi mất công cụ chính, đó là bài kiểm tra.
- Rơi ra: mở Depth sau + phôi rèn + 1 relic ngẫu nhiên + vàng lớn.

## 5. Đường cong giới thiệu quái (dạy trước, ép sau)

```
 Depth 1 : Cùi, Chạy, Bầy                      -> dạy tap, hold, chém quét
 Depth 2 : + Ném Đá, Thuốc Nổ                  -> dạy tiến lên, knockback
 Depth 3 : + Khiên, Ogre                        -> phá thói quen spam bắn
 Depth 4 : + Dơi bay, Đào Hầm                   -> dạy trục dọc & phía sau
 Depth 5 : + Trống, Pháp Sư                     -> dạy ưu tiên mục tiêu
 Depth 6 : + Đầu Bò, Goblin Béo, Nỏ             -> hỗn chiến thật sự
 Depth 7 : trộn tất cả + affix mặc định          -> kỳ thi tốt nghiệp
```

Mỗi loại mới: xuất hiện **một mình** ở lần đầu, có chữ hiện tên + tiếng riêng, và wave đó có ≤ 2 loại khác.

## 6. Ràng buộc (audit)

1. Mọi enemy id trong `waves.json` và `depths.json` phải tồn tại trong `enemies.json` (**0 ID sai**).
2. Mọi quái phải có `tpCost > 0`, `goldDrop ≥ 1`, `sfxSpawn` khác rỗng.
3. Mỗi Depth phải giới thiệu **1–3** loại mới, không hơn.
4. Không quái nào ở Depth 1–2 có `kbResist > 0.2`.
5. Tổng `tpCost` của mọi loại trong một Depth phải phủ được ngân sách TP của phòng đông nhất.
