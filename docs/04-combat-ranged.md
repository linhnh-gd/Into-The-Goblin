# 04 — Combat: Vũ khí tầm xa

Nguồn từ docs: *cần đạn để bắn* · *tap / hold / hold-drag* · *có băng đạn, hết thì reload, trong lúc
reload không bắn được, chỉ dùng cận chiến* · *knockback tuỳ loại* · *quái chết bị đẩy lùi về phía sau*.

---

## 1. Ba tầng tài nguyên đạn

| Tầng | Tên | Hồi bằng cách nào | Hiển thị |
|---|---|---|---|
| 1 | **Băng đạn** (`mag`) | Reload | Vòng tròn quanh tâm ngắm, mỗi viên là 1 vạch |
| 2 | **Đạn dự trữ** (`reserve`) | **Goblin Vàng**, hòm, shop, thẻ | Số dưới tâm ngắm: `24 / 60` |
| 3 | **Goblin Vàng** | Giết = **nguyên 1 băng đạn**. Chỉ ở hai làn bên, không tấn công được | Người lấp lánh vàng — con duy nhất không phải bóng đen |
> **Đây là pillar P2.** Súng không có đạn vô hạn, và đạn **không mua được giữa combat**. Đường duy nhất
> để có đạn giữa trận là **Goblin Vàng** — và nó ở hai làn bên, tức mỗi viên bắn sang đó là một viên
> không bắn vào đám đang tới ở làn giữa. Hết đạn thì chỉ còn dao, mà chém liên tục thì hết stamina.

### 1b. Goblin Vàng — nguồn đạn duy nhất trong combat

Cơ chế cũ là **Cướp Đạn**: mỗi mạng chém cho một ít đạn. Tỉ giá đó phải neo vào một con số nào đó, và
nó **sai ba lần liên tiếp** (`18` lỗi #55, #62, #64):

| Neo vào | Hỏng thế nào |
|---|---|
| `magMax` | Thẻ Băng Đạn ăn hai lần: vừa băng to hơn, vừa nhân số đạn cướp được |
| Giây bắn | Đúng nguyên tắc, nhưng con số tính cho kho 569 viên; cắt kho xuống 38 thì 13 mạng chém đầy nguyên kho |
| Kho đạn gốc | Đúng về mặt số học, nhưng vẫn là một **bộ đếm vô hình** |

Gốc vấn đề không nằm ở con số nào cả: **một bộ đếm vô hình không thể tự nói cho người chơi biết nó
đang ở đâu.** Người chơi không thấy nó, không nhắm được vào nó, không quyết định gì về nó. Nó chỉ là
một cái vòi nước chảy ngầm mà nhà thiết kế phải liên tục vặn cho vừa.

**Goblin Vàng thay cả cơ chế đó bằng một thứ NHÌN THẤY VÀ BẮN ĐƯỢC.**

| | |
|---|---|
| Thưởng | Giết = **nguyên 1 băng đạn** vào kho dự trữ |
| Vị trí | **Chỉ hai làn bên** — không bao giờ chạm được người chơi, `dmg` = 0 |
| Tỉ lệ | `chancePerWave` 0.5, tối đa 1 con/wave → **~1.5 con mỗi phòng** |
| Khoảng spawn | 13–20m: lúc mới hiện nó nằm gần giữa màn hình, càng chạy tới càng dạt ra rìa |
| Ngân sách | **Ngoài** ngân sách TP của wave — nó là một món quà, không phải một mối đe doạ |
| Hình | Vàng nguyên khối + lấp lánh lệch pha + phình nhẹ theo nhịp |

**Cái giá là ĐẠN và THỜI GIAN, không phải máu.** Nó không đánh được bạn, nên đối mặt không phải "sống
hay chết" mà là *"có đáng bỏ mấy viên đạn và mấy giây ra không, trong khi đám ở làn giữa vẫn đang tới"*.
Và vì nó dạt ra rìa màn hình khi bạn chạy tới gần, **quyết định đó có hạn chót**.

Nó cũng vá một lỗ hổng thiết kế có sẵn: hai làn bên trước giờ chỉ có *"giết lấy vàng thêm"* — tức
không có lý do gì đủ mạnh để bắn sang đó. Bây giờ thì có.

**Vì sao chính art direction làm cho nó đọc được ngay.** `15` đặt luật: quái là **bóng đen**, và
**vàng là màu ấm duy nhất** trong game. Goblin Vàng là con duy nhất phá luật đó — một hình vàng sáng
giữa hành lang toàn bóng đen thì không cần icon, không cần mũi tên, không cần dạy.

Ràng buộc thiết kế (audit gate): với mọi vũ khí, `mag * dmgPerShot` phải giết được **ít hơn** số quái của
một wave trung bình ở cùng Depth (mặc định: 45–70% wave). Nếu một băng đạn dọn sạch được wave thì melee
thành vô dụng và P2 chết.

---

## 2. Reload — không còn Nạp Hoàn Hảo

Nạp Hoàn Hảo (chạm đúng cửa sổ 0.25s trên thanh nạp = 55% thời gian + 15% damage cả băng)
**đã bỏ**. Lý do nằm ở chỗ nó đòi một thứ mà chính game này không cho phép: **nhìn xuống thanh
nạp**. `14` mục 7 đã phải chuyển thanh nạp lên sát tâm ngắm vì hết đạn là lúc căng nhất, không
được bắt người chơi rời mắt khỏi đám quái. Nhưng dời chỗ chỉ chữa được triệu chứng — bản thân cơ
chế **vẫn** là "canh một cửa sổ hẹp bằng mắt, đúng lúc mắt đang bận". Một cơ chế mà cách chơi tối
ưu là *phớt lờ nó đi* thì nó không phải chiều sâu, nó là thuế.

| Trước | Bây giờ |
|---|---|
| Hết đạn → thanh nạp có vạch xanh → chạm đúng vạch = 55% thời gian + 15% damage | Hết đạn → **tự nạp**, không phải bấm gì |
| Chạm trượt = 130% thời gian (phạt) | Không còn phạt |
| Còn đạn thì chạm huỷ nạp, bắn tiếp | **Giữ nguyên** — đây mới là quyết định thật |

Cái quyết định **được giữ lại** là cái duy nhất không cần nhìn xuống: *nạp nốt cho đầy, hay cắt
ngang để bắn ngay bằng số đạn đang có*. Nó nhìn vào **đám quái** để quyết, không nhìn vào thanh nạp.

### 2a. Shotgun nạp TỪNG VIÊN — và nhịp đó là hằng số

`archetypeSpec.shotgun.reloadStyle = "shell"`. Nạp xong một viên là có ngay một viên để bắn, nên
người chơi cắt ngang được bất cứ lúc nào: còn 1 viên trong ổ mà đám quái tới sát thì bắn luôn.

Nhịp mỗi viên đọc từ `archetypeSpec.shotgun.shellReloadSec` = **1.05s**, và nó **không** phải
`reloadTime / magMax` như bản cũ. Chia cho `magMax` nghĩa là thẻ Băng Đạn làm **mỗi viên vào nhanh
hơn**: đo được băng 5 → 0.75s/viên, băng 10 → 0.38s, băng 20 → 0.19s. Băng to gấp bốn thì nạp mỗi
viên nhanh gấp bốn — đúng ngược với thực tế, và đúng kiểu lỗi **neo vào một con số nâng cấp được**
đã gặp ở Cướp Đạn (`18` lỗi #55). Neo vào hằng số thì băng to hơn = nạp lâu hơn vì có nhiều viên
hơn phải vào, còn **nhịp thì không đổi cả run**.

## 2b. HAI CHẾ ĐỘ NGẮM: chạm thì nhắm, giữ thì tự nhắm

Cùng một khẩu súng, hai cách chơi — và **chính gesture chọn cách**, không có nút chuyển:

| | **CHẠM (tap)** | **GIỮ (hold)** |
|---|---|---|
| Nhắm | **Đúng chỗ ngón tay chạm** — nón trợ giúp `aimCone` 4° | **Tự nhắm** con gần nhất ở làn giữa |
| Chọn mục tiêu | **Có** — nhặt riêng con Thuốc Nổ trong đám, hay con Khiên đang hở | Không |
| Yếu điểm (bụng Ogre ×2.0) | **Có** — chạm nửa dưới hitbox của **chính con đó** | **Không bao giờ** |
| Bắn trượt | **Có** — mất viên đạn, hiện vòng xám tại chỗ chạm | Không thể trượt |
| Hướng đạn ghém (shotgun) | Nón xoay theo **chỗ chạm** | Nón xoay theo con đã tự nhắm |

Auto-aim ở chế độ giữ vẫn theo thứ tự cũ: con **gần nhất ở LÀN GIỮA** trong `run.tapFarM` (14m) — mối
đe doạ thật; làn giữa trống thì lấy con gần nhất bất kỳ, để quái làn bên vẫn giết được lấy vàng
(`09` mục 2c).

**Vì sao tách làm hai thay vì chọn một.** Bản trước tự nhắm cho *cả hai*, với lý do đúng: ở 4.2 m/s
giữa 150 con, bắt người chơi chạm chính xác vào một hình bóng nhỏ là bài kiểm tra **ngón tay**, không
phải bài kiểm tra **chọn mục tiêu nào**. Nhưng hệ quả là **không còn cách nào để chọn mục tiêu cả** —
thấy con Thuốc Nổ sắp nổ vào mặt cũng không bắn riêng nó được, và yếu điểm thành thứ tự động ăn.

Tách hai chế độ trả lại cả hai: giữ ngón thì máy lo, **chạm thì bạn lo**. Cái giá của chế độ chính xác
là **bắn trượt được** — và đó chính là thứ làm nó có giá trị. Một chế độ không thể trượt thì không thể
gọi là ngắm.

**Phải có phản hồi tại chỗ chạm.** Không có nó thì "bắn trượt" và "game không nhận input" nhìn giống hệt
nhau. Vòng **vàng** = trúng, vòng **xám** = trượt, 0.3s rồi biến. Và viên đạn **vẫn bay ra** theo hướng đã
nhắm dù không trúng ai — im lặng nuốt mất phát bắn là lỗi, không phải luật.

## 3. Chuỗi Bắn (Accuracy chain)

| Số phát trúng liên tiếp | Buff |
|---|---|
| 1–3 | — |
| 4–7 | +10% damage |
| 8–14 | +25% damage |
| 15+ | +40% damage, đạn để lại vệt sáng |

Bắn trượt (không trúng hitbox nào) → reset về 0. Mục đích: thưởng cho **nhắm**, phạt **spam tap bừa** —
nếu không có cơ chế này thì tap loạn khắp màn hình là chiến thuật tối ưu và game mất chiều sâu.

## 4. Điểm yếu (weak point)

| Vị trí | Hệ số | Ghi chú |
|---|---|---|
| Đầu | x2.5 | Có ring hiển thị mờ khi aim assist bắt được |
| Thân | x1.0 | |
| Khiên (Goblin Khiên) | x0.3 | Phải chém, đẩy lùi, hoặc bắn khi nó vung khiên |
| Bình nổ trên lưng (Goblin Thuốc Nổ) | x1.0 nhưng nổ AoE 25 dmg lên đồng bọn | Reward cho việc nhắm |
| Yếu điểm boss (phát sáng) | x4.0 | Cần **tap chính xác**, không nhận aim assist |

## 5. Phân loại vũ khí tầm xa (archetype)

| Archetype | Vai trò | Đặc trưng số | Ai dùng |
|---|---|---|---|
| **Súng lục** (Pistol) | Khởi đầu, tap chính xác | mag nhỏ, reload nhanh, dmg/phát cao, kb thấp | Người mới |
| **Súng ngắn nòng cưa** (Shotgun) | **Công cụ dãn cách** | dmg cao gần, kb **1.6m+**, mag 2–6, reload chậm | Người chơi thích cận chiến |
| **Súng trường** (Rifle) | DPS ổn định dải Giữa | rpm trung, mag 20–30, tap-hold | Mọi build |
| **Liên thanh** (SMG/LMG) | Hold & Drag quét ngang | rpm rất cao, spread lớn, dmg/phát thấp | Build đông quái |
| **Nỏ / Bắn tỉa** | Xuyên hàng | 1 viên xuyên 5 con, reload dài, kb dọc mạnh | Build kỹ năng |
| **Súng phóng** (Launcher) | AoE, xoá wave | dmg AoE, đạn cực ít (2–4), self-knockback | Build boom |
| **Súng phun lửa / axit** | DoT, kiểm soát vùng | dmg/s, không knockback, đốt lan | Build DoT |
| **Vũ khí Lõi Hầm** (deep-tech) | Late game, thưởng cho đi sâu | damage scale theo `D` (+9%/Depth), hoặc nạp bằng vàng thay vì đạn | End-game |

Dữ liệu chi tiết 18 khẩu: `data/weapons.json` → xem `gen-weapons.md`.


## 5b. Dải nhịp bắn theo archetype — thứ tạo ra FEELING khác nhau

`weapons.json` → `balance.archetypeRpm` giữ một **dải rpm cho từng archetype**. Normalizer ép `rpm` vào dải
rồi mới giải `dmg` từ đó. Đây là thứ làm shotgun cảm thấy khác SMG, chứ không phải sát thương.

| Archetype | Dải rpm | Cảm giác |
|---|---|---|
| sniper · launcher · crossbow | 28–58 | một phát một nhịp thở |
| **shotgun** | **48–78** | chậm, nặng, nhiều viên ghém |
| marksman · deeptech | 70–150 | có nhịp, phải ngắm |
| pistol · **rifle** (assault) | 115–200 | nhịp đều, xương sống của game |
| acid · lmg · smg | 150–320 | xối xả |
| flamer · minigun | 260–460 | dòng liên tục |

**Sàn sát thương `rangedMinDmg = 120`.** Mọi viên đạn phải hiện số ≥ 120 — con số nhỏ hơn đọc ra như
"cào nhẹ", không ra cảm giác súng. Sàn này **thắng** đường cong DPS khi hai thứ xung đột.

**Chọn súng ở màn hình đầu** (`optRanged`): Gọng Sắt (rifle) · Kèn Đồng (pistol) · Miệng Hang (shotgun) ·
Ổ Chuột (SMG) · Gai Mực (nỏ). Đo thực tế trong 1 giây giữ tay: rifle **3 phát**, SMG **4 phát**,
shotgun **1 phát** (4 viên ghém), nỏ **1 phát** (446 sát thương).

Hai gate mới: mọi súng phải có `dmg ≥ rangedMinDmg`, và `rpm` phải nằm trong dải của archetype nó. Không có
gate thứ hai thì các archetype sẽ trôi về gần nhau khi tinh chỉnh, và lý do có nhiều loại súng biến mất.


## 5c. Một phát đạn chạm vào đám quái thế nào — theo từng archetype

`weapons.json` → `balance.archetypeHit`. **Đây mới là thứ phân biệt shotgun với rifle, không phải sát thương.**

| Kiểu | Archetype | Cách chạm |
|---|---|---|
| `single` | pistol · rifle · smg · lmg · minigun | 1 mục tiêu |
| `spread` | **shotgun** · flamer | Chia viên ghém ra **nhiều con** gần nhất, mỗi con ăn phần của nó |
| `pierce` | marksman (1) · crossbow (2) · **sniper (4)** | Xuyên qua con đầu, trúng thêm n con **phía sau nó trên cùng trục** |
| `aoe` | launcher (3.2m) · deeptech (2.4m) · acid (1.8m) | Nổ theo bán kính quanh điểm trúng, có vòng hiển thị |

Trước đây **mọi** súng đều dùng `dmg × pellets` **dồn hết vào một con**. Shotgun 4 viên ghém vì thế chỉ giết
được **1 quái** — không khác gì rifle, chỉ là bắn chậm hơn. Đó là lỗi #33 ở `18`.

Đo sau khi sửa, cùng một cảnh 6 con (4 làn giữa rải theo độ sâu, 2 làn bên):

| Súng | Số con trúng 1 phát | Sát thương mỗi con |
|---|---|---|
| Gọng Sắt (rifle) | **1** | 120 |
| Miệng Hang (shotgun) | **4** | 120 mỗi con |
| Gai Mực (nỏ, xuyên 2) | **3** | full mỗi con |

> **Lưu ý cân bằng:** `spread` giữ nguyên tổng sát thương một phát (chia ra chứ không nhân lên), nên nó
> **không** phá đường cong DPS. Nhưng `pierce` và `aoe` thì **có** nhân lên trong đám đông — mô hình
> `dpsSustained` chỉ đo đơn mục tiêu. Đó là bản sắc của archetype, không phải lỗi; nhưng khi tinh chỉnh
> `pierce`/`aoeRadiusM` thì phải nhớ chúng nằm **ngoài** ngân sách DPS.

### 5c-bis. Shotgun: MỘT PHÁT DỌN SẠCH MỘT VÙNG

Cơ chế `spread` đúng nhưng bản đầu **tune sai hướng**: nón 12°, `caliberMult` 1.6 (mỗi viên ghém vừa
đúng 1 lần HP trash, hết scaling là không giết nổi), và dung sai bắt trúng 0.42m — nên phần lớn viên
ghém bay qua khe giữa hai con. Kết quả đọc ra là *"shotgun yếu, vùng bắn nhỏ"*.

| Số | Cũ → mới | Việc |
|---|---|---|
| `spreadDeg` | 12 → **26** | Ở 8m nón phủ **3.7m** — hơn nửa chiều rộng hành lang |
| `caliberMult` | 1.6 → **3.4** | Mỗi viên ghém = **3.4 lần HP trash** → vẫn one-shot sau vài phòng HP scaling |
| `pelletRadiusM` | 0.42 → **0.6** | Bề ngang tia đạn. 0.85 thì con gần nhất **nuốt cả 9 viên** — xem 5c-ter |
| `killEff` | 0.45 → **0.55** | Nón rộng hơn thì trúng nhiều hơn → normalize tự hạ đạn dự trữ xuống |
| `falloffStart/End/Min` | — → **7m / 13m / 0.4** | Ngoài 7m sát thương tắt dần, còn 40% ở 13m |

Đo lại (T1, `dmg` 136 × 9 viên, bắn vào đám 14 con): **6 / 2 / 4 / 3 mạng mỗi phát** — mọi con trúng
đều chết. Đó là "dọn sạch một vùng".

**Cái giá phải trả đi kèm, không tách rời:** 1.09s giữa hai phát · băng **5 viên** · nạp **từng viên**
0.75s/viên. Một phát trượt không chỉ mất đạn, nó mất cả nhịp. Và `falloff` giữ cho nó là vũ khí **cự ly
gần** chứ không thành khẩu bắn tỉa đám đông ở dải Xa — nếu bỏ falloff thì không còn lý do gì để cầm khẩu
khác.

### 5c-ter. Viên ghém là một TIA — và chỉ xuyên qua khi nó GIẾT được

Cách chọn mục tiêu của từng viên ghém là chỗ dễ sai nhất, và nó đã sai theo cả hai hướng.

**Sai lần 1 — bắn xuyên qua người sống.** Mỗi viên chọn con có **sai lệch ngang nhỏ nhất**. Một con ở
12m nằm đúng tia (lệch 0.05m) thắng một con ở 4m nằm lệch 0.5m — nên một phát bắn **giết con đằng sau
trong khi mấy con trước mặt không xảy ra gì**. Không game bắn súng nào làm thế.

**Sai lần 2 — con gần nhất nuốt cả loạt.** Sửa thành "con **gần nhất** trên tia thì dừng lại", nhưng
với `pelletRadiusM` 0.85 thì bề ngang tia là **1.15m** — gấp đôi thân goblin thật (0.52m). Con đứng
giữa che kín cả nón: đo được **9.9/9 viên vào một con**, hai con đứng cạnh ở ±1.4m ăn **0**.

**Mô hình đúng**, lấy từ các game horde (Left 4 Dead, Killing Floor):

```
   viên ghém = một TIA, duyệt các con từ GẦN ra XA
     |
     |-- con đầu tiên nằm trong bề ngang tia  -->  ăn đạn
     |        |
     |        |-- viên đó GIẾT được nó   -->  đạn XUYÊN TIẾP (x penetrationMult)
     |        |                                sang con kế, tối đa penetrateMax con
     |        |
     |        |-- KHÔNG giết được        -->  viên đạn DỪNG LẠI
     |
     |-- không con nào trong bề ngang    -->  viên bay lọt qua đám
```

| Số | Giá trị | Việc |
|---|---|---|
| `pelletRadiusM` | **0.6** | Bề ngang tia (+ `0.3 × scale` theo cỡ con). Đủ rộng để không lọt khe, đủ hẹp để không che cả nón |
| `penetrateMax` | **3** | Tối đa 3 lần xuyên cho một viên |
| `penetrationMult` | **0.6** | Xuyên qua thì yếu đi — hàng thứ ba khó chết hơn hàng đầu |

Luật **"chỉ xuyên khi giết"** là thứ làm cả hai yêu cầu cùng đúng một lúc:

| Cảnh đo được | Kết quả |
|---|---|
| 3 con xếp hàng, đều yếu | **cả 3 chết** — một phát dọn sạch một hàng |
| 3 con xếp hàng, **con đầu trâu (60× HP)** | **cả 3 sống** — con dày chặn hết, không con nào sau lưng chết |
| 6 con rải trong nón, 5–9m | **cả 6 chết** |

Dòng thứ hai là bất biến quan trọng nhất: **không bao giờ có cảnh con đằng sau chết mà con trước mặt
còn sống.** Đó không phải hệ quả của việc tune số, nó là hệ quả của thứ tự duyệt.


## 5d. Mô phỏng theo SỐ LIỆU VŨ KHÍ THẬT — và đảo ngược mô hình cân bằng

Mô hình cũ ép **mọi súng có cùng DPS ở cùng tier**. Hệ quả: nhịp bắn thật **không thể tồn tại** — muốn SMG
bắn 700 nhịp/phút thì sát thương mỗi viên phải tụt xuống mức vô nghĩa, còn muốn viên đạn mạnh thì phải kéo
nhịp bắn xuống 48 (shotgun) hay 155 (rifle), tức chậm hơn đời thật 4–5 lần.

**Đảo lại:** sát thương suy từ **cỡ đạn**, nhịp bắn lấy từ **số liệu thật**, và **ĐẠN mới là thứ cân bằng**.

### Bảng đặc tả (`weapons.json` → `balance.archetypeSpec`)

| Archetype | Tham chiếu thật | rpm | Băng | `caliberMult` | Cơ chế |
|---|---|---|---|---|---|
| pistol | Glock 17 / M1911 9mm, bắn đơn 120–200 | 150–260 | 10–17 | 3.2 | single |
| **smg** | **MP5 / Uzi 9mm, 700–900** | **700–950** | 25–32 | 3.0 | single |
| **rifle** | **M4 750–900 / AK-47 600** | **600–800** | 25–30 | 4.5 | single |
| lmg | M249 750–1000 / PKM 650 | 650–900 | 100–200 | 4.2 | single |
| minigun | M134 2000–6000 (hạ xuống cho chơi được) | 1800–3000 | 200–400 | 3.0 | single |
| shotgun | Remington 870 12ga 00 buck, bơm tay ~65 | 55–95 | 5–8 | 1.6 | **9 viên ghém** |
| marksman | SR-25 DMR bắn đơn 80–120 | 70–120 | 10–20 | 10.0 | xuyên 1 |
| sniper | Barrett M82 .50, 30–50 | 30–50 | 5–10 | 24.0 | xuyên 3 |
| crossbow | Nỏ nặng (thật 2–3 phát/phút, game hoá lên) | 30–60 | 1–5 | 13.0 | xuyên 2 |
| launcher | M79 40mm bắn đơn 15–25 | 25–45 | 1–6 | 9.0 | nổ 3.2m |

`caliberMult` = **số lần HP của trash cùng tier**. Đó là cách mô phỏng cỡ đạn: viên 9mm của SMG (3.0) yếu hơn
viên 5.56 của rifle (4.5), và cả hai đều bé tí so với viên .50 của sniper (24.0). Nó thay cho sàn "120 cứng"
— cái đó không diễn tả được sự khác nhau giữa các cỡ đạn.

### DPS không còn là ràng buộc; SỐ BĂNG PHỤ mới là

SMG 700 nhịp/phút và sniper 40 nhịp/phút **không thể** có cùng DPS, và **không nên**. Thứ giữ chúng ngang
nhau là: mọi khẩu mang đúng **1.5 băng phụ** (`reserveMagsTarget`), và **một băng đạn không dọn nổi một
wave** (trụ P2). Nên đối mặt là *bắn xối xả rồi hết đạn sớm* vs *bắn dè rồi đủ đạn lâu*.

> **Mô hình cũ đo bằng "đủ cho 7 wave" và nó vô hiệu hoá chính trụ P2.** Công thức đó cho ra 217 viên
> cho súng lục (**21 băng phụ**), 569 cho rifle (**22 băng**), 292 mũi cho nỏ. Với ngần ấy đạn, người
> chơi **không bao giờ chạm vào cái trần đạn** trong một phòng — mà "hết đạn" chính là thứ duy nhất
> buộc người ta rút dao ra. Trụ P2 tồn tại trên giấy chứ không bao giờ chạy.
>
> Đo sau khi đổi (rifle, băng 25 + **38 dự trữ**, giữ tay bắn liên tục suốt phòng R1): **hết sạch băng
> 3 lần**, kết thúc phòng với **0 đạn dự trữ**, 28 mạng. Hết đạn giờ là một sự kiện **thật**, xảy ra
> vài lần mỗi phòng — và đó là lý do để rút dao.
>
> **"1.5 băng phụ" vô nghĩa khi băng chỉ có 1 viên.** Nỏ nạp lại sau *mỗi* phát, nên "băng" không còn là
> đơn vị của cái gì cả. Sàn cũ (`reserveMinShots` = 6 viên) chỉ là một con số bắt ra từ không khí, và nó
> sai xa: đo **số mạng cả kho đạn mua được** thì nỏ ra **14**, trong khi shotgun 64 và rifle 63 — chọn nỏ
> là chọn một ván ngắn hơn **4.5 lần**, chứ không phải chọn một lối chơi khác.
>
> Với khẩu có băng < `magSmallThreshold` (4), dự trữ neo vào **SỐ MẠNG** (`reserveKillsFloor` = 42) —
> thứ duy nhất có nghĩa **giống nhau** ở mọi khẩu:
> `số phát = ceil(reserveKillsFloor / killsPerShot)`, với `killsPerShot` đã tính cả `pellets`, `pierce`
> và `killEff`.
>
> | | mạng cả kho | giây bắn | |
> |---|---|---|---|
> | Rifle | 63 | 6.3s | |
> | Shotgun | 64 | 14.2s | |
> | Súng lục | 25 | 10.0s | |
> | **Nỏ — trước** | **14** | 8.3s | 1 + 6 mũi |
> | **Nỏ — sau** | **43** | 25.9s | 1 + **21** mũi |
>
> Vẫn thấp hơn rifle/shotgun — đúng, vì mỗi mũi ăn 824 damage và xuyên 3 con thẳng hàng, nó không phải
> khẩu dọn vùng. Nhưng 25.9 giây bắn trong một phòng 35.7 giây nghĩa là **bắn liên tục thì vẫn cạn** ở
> một phần ba cuối phòng: P2 vẫn còn hiệu lực, chỉ là không còn cạn từ phút đầu.

Đo được: Ổ Chuột (SMG) bắn hết băng 25 viên trong **2.1s**; Kèn Đồng 10 viên trong **4.0s**; Miệng Hang
5 viên trong **5.5s**. Đó mới là cảm giác khác nhau giữa các khẩu.

### Viên đạn bay ra thật (`projectiles.js`)

Sát thương vẫn giải quyết ngay lúc bắn (hitscan) — viên đạn **chỉ là hình**. Làm vậy để không bao giờ lệch
giữa "cái đã trúng" và "cái đang bay", và để tự nhắm không bắn trượt vì đạn bay chậm. Mỗi archetype có
màu / cỡ / độ dài / tốc độ riêng, có gate kiểm.

**Đạn ghém tản theo GÓC THẬT, không chia đều mục tiêu.** Mỗi viên lấy một góc ngẫu nhiên trong nón
`spreadDeg` rồi tìm con gần tia đó nhất. Đo thực tế một phát vào 8 con: 9 viên bay ra, trúng **5 con** với
sát thương **192 / 128 / 64 / 64 / 128** — có con ăn 3 viên, có con ăn 1, có viên trượt hẳn. Đó là lý do
shotgun mạnh ở gần và vô dụng ở xa, mà **không cần luật riêng nào**.

## 6. Knockback từ đạn (docs: "quái chết thì bị đẩy lùi về phía sau")

| | Công thức | Hướng |
|---|---|---|
| Khi trúng (còn sống) | `push = kb_weapon * (1 - kbResist_enemy) * hitReaction.impulseMult` | **THẲNG RA SAU** dọc hành lang |
| **Giật ngược (lurch)** | `lurchDistM * max(lurchMinFrac, 1 - kbResist)` trong `lurchSec`, kèm **nén người** | **THẲNG RA SAU** |
| Khi chết | `launch = kb_weapon * 2.2 * (1 - kbResist)` | **theo vector quẹt / vector đạn** |
| Va chạm xác | Xác đang bay đẩy lùi quái nó chạm, truyền 35% lực (**domino**) | |

> **Quái còn sống bị đẩy THẲNG RA SAU, xác thì bay theo vector quẹt.** Hai thứ khác hướng nhau là cố ý.
>
> Hành lang có **ba làn** và chỉ làn giữa gây damage. Đẩy theo hướng quẹt là đẩy **NGANG** — một nhát
> chém ngang hất quái từ làn giữa sang làn bên, tức nó **âm thầm xoá mối đe doạ** theo một cách người
> chơi không chủ định và cũng không đọc ra được. Đẩy thẳng ra sau thì knockback chỉ làm đúng một việc:
> **mua thêm khoảng cách**. Đó cũng là cả lý do tồn tại của shotgun (công cụ dãn cách).
>
> Xác thì ngược lại: nó **không còn là mối đe doạ** nên bay hướng nào cũng được, và "xác đứt đôi bay
> theo đúng đường ngón tay" là money shot của game (`05` mục 6). Đo: chém ngang một con — con **sống**
> lùi 1.76m thẳng ra sau, 0m ngang; con **chết** thì xác bay `lx 2.2 / lz -1.1`, tức sang bên.
>
> Công tắc: `gamefeel.json` → `hitReaction.pushStraightBack`.

Domino là thứ khiến shotgun "sướng": một phát vào đám 6 con ở cửa hẹp thì cả 6 lùi lại.

> **`impulseMult` và `lurch` không phải trang trí.** Xung gốc (`kb_weapon` = 0.4 với rifle, 1.6 với
> shotgun) tắt theo hàm mũ và chỉ đi được **~0.4m** — ở cự ly 10m đó là *vài pixel*, tức là bắn vào
> một con không chết thì màn hình **không có gì thay đổi** ngoài một cái nháy trắng 0.17s. Đo lại sau
> khi sửa: một phát shotgun vào 6 con đẩy mỗi con **2.5–2.8m**. Lurch thì độc lập với `kbResist`, có
> sàn `lurchMinFrac` — nên **Quỷ Hầm** (`kbResist` 0.90) bị đẩy rất ít nhưng vẫn **giật thấy được**:
> *"không đẩy được"* phải khác *"không phản ứng"*, nếu không người chơi tưởng đạn không trúng.

### 6a. Ngân sách đẩy — thứ giữ cho knockback mạnh mà không phá game

Knockback mạnh đặt ra ngay một câu hỏi: **chém slide liên tục có biến thành tường chắn không?**
Có, nếu không có gì chặn. Một nhát mỗi `slideHitCooldownSec` (0.22s) × ~1.8m/nhát = **8 m/s**, gần
gấp đôi tốc độ chạy 4.2 m/s — quái sẽ không bao giờ chạm được vào người chơi nữa.

Cách chặn **không phải** là giảm lực mỗi nhát (làm vậy thì nhát đầu tiên cũng yếu đi, mất hết cảm
giác "nảy"). Cách chặn là **ngân sách tính bằng mét**:

| Tham số (`gamefeel.json` → `hitReaction`) | Giá trị | Ý nghĩa |
|---|---|---|
| `kbBudgetM` | **4.0** | Mỗi con có sẵn 4m để bị đẩy. Cú đánh đầu tiên ăn **nguyên lực** |
| `kbRefillMps` | **1.2** | Hồi 1.2m mỗi giây — **thấp hơn hẳn** `run.speedMps` = 4.2 |

Hệ quả là một bất biến, không phải một con số cần tinh chỉnh: **tốc độ lùi bền vững của quái luôn
thấp hơn tốc độ chạy của người chơi**, nên dù bắn/chém liên tục thế nào, khoảng cách vẫn *rút ngắn*.
Đo thực tế (chém slide liên tục, stamina vô hạn, vào một con): khoảng cách 8m → 6.87 → 5.97 → 5.17
→ 3.83 → 2.31 → **chạm nhau sau 2.9 giây**. Hết ngân sách thì quái vẫn **giật** (lurch), chỉ không
lùi nữa — phản hồi còn nguyên, lợi thế thì không.

## 6b. Nạp đạn: thời gian dài hơn, và shotgun nạp TỪNG VIÊN

`balance.reloadGlobalMult` = **1.45** nhân vào dải reload của mọi archetype. Lý do: reload phải là
một **quyết định** (rút súng hay rút dao) chứ không phải một cái chớp mắt — nó là bản lề của trụ P2
(vòng khoá ĐẠN ↔ STAMINA). Sau khi nhân:

| Khẩu | Băng | Nạp | Kiểu nạp | Nhịp |
|---|---|---|---|---|
| Kèn Đồng (súng lục) | 10 | 1.88s | cả băng | 0.40s/phát |
| Ổ Chuột (tiểu liên) | 25 | 2.76s | cả băng | liên thanh |
| Gọng Sắt (súng trường) | 25 | 3.04s | cả băng | liên thanh |
| **Miệng Hang (súng ghém)** | 5 | 3.77s | **từng viên (0.75s/viên)** | 1.09s/phát |
| **Gai Mực (nỏ)** | **1** | **0.55s** | cả băng | 1.18s/phát |

**Shotgun — `reloadStyle: "shell"`.** Nạp từng viên một: mỗi viên mất `reloadTime / mag` giây, và
nạp xong một viên là **có ngay một viên để bắn**. Nạp đầy cả băng vẫn tốn đúng `reloadTime` — không
nhanh hơn — nhưng người chơi được quyền **cắt ngang bất cứ lúc nào**: đám quái tới sát mà trong ổ
đã có 2 viên thì bắn luôn. Đây là cá tính duy nhất mà một khẩu shotgun cần, và nó không phải là
một cơ chế mới: nó chỉ là *chia nhỏ* thứ vốn đã có.

**Nỏ — một mũi tên mỗi băng, nạp 0.55s.** Vì `0.55s` **ngắn hơn** khoảng giữa hai phát (`1.18s`),
việc nạp **không bao giờ chặn tay**: bắn → nạp xong trong lúc còn đang chờ nhịp → bắn tiếp. Nỏ
thành vũ khí theo **nhịp**, không có lúc nào phải dừng lại nạp cả băng. Đổi lại nó chỉ có đúng một
mũi tên: bắn trượt là mất trọn một nhịp.

## 6c. Lên đạn: cái khoảng giữa hai phát phải có gì đó xảy ra

Với súng nhịp chậm (shotgun **1.09s**, nỏ **1.18s**, phóng lựu **1.33s**) khoảng giữa hai phát dài hơn
cả thời gian phản ứng của người chơi. Trước đây khoảng đó **rỗng hoàn toàn**: chạm màn hình → không ra
đạn, không tiếng, không cử động nào. Đọc ra như súng hỏng hoặc máy nuốt input, chứ không đọc ra là "đang
lên đạn".

| Lớp | Cái gì | Khi nào |
|---|---|---|
| Vũ khí | **Thoi trượt về sau rồi đẩy lên trước**, cả khẩu ngửa lên `rackKickDeg` | nhịp ≥ `rackMinIntervalSec` (0.35s) |
| HUD | Vòng tròn quanh tâm ngắm chạy đầy (xem `14` mục 7c) | nhịp ≥ 0.25s |
| HUD | Số giây đếm ngược dưới tâm ngắm | nhịp ≥ 0.5s |
| Phản hồi | Chạm lúc chưa xong → **tiếng cò khan** + vòng nhịp nảy một cái | có `dryClickCooldownSec` chống spam |

Ba luật của lớp này:

1. **Animation dài đúng bằng `60/rpm`.** Nó là *cái vẻ* của delay đã có, không phải một delay thứ hai.
   Nếu animation dài hơn nhịp thì nó đang nói dối; ngắn hơn thì lại có một khoảng rỗng nữa.
2. **Chuyển sang chém thì bỏ animation NGAY, nhưng delay giữ nguyên.** Nhát chém ra tức thì, súng cất
   đi, thoi ngừng chạy — nhưng `fireCd` vẫn đếm hết. Rút dao ra không làm súng lên đạn nhanh hơn.
3. **Không bao giờ nuốt im lặng một cú chạm.** Một input không có phản hồi bị đọc là *lỗi*, không phải
   là *luật chơi*.

## 7. Ràng buộc cân bằng (audit)

1. **TTK trên trash ≤ 0.60s** với *mọi* vũ khí tầm xa, và phải có **ít nhất một** khẩu T1 one-shot goblin
   thường ở Depth 1 (chống lỗi "slow basic weapons" của Guns 'n Goblins). Không đòi mọi khẩu one-shot —
   SMG/liên thanh vốn là vũ khí xịt, không phải vũ khí nhắm.
2. DPS bền của vũ khí tầm xa nằm trong **±22%** đường cong `dpsTarget(tier)` ở `16`.
3. **`magClearRatio` ≤ 1.00** — một băng đạn không được dọn sạch cả wave. Vi phạm là **FAIL build**, vì
   nếu súng dọn hết wave thì melee vô dụng và pillar P2 chết. Khoảng mong muốn là `[0.45, 0.70]`.
   *Ví dụ thật: bản nháp đầu cho "Miệng Hang" 4 viên → ratio 1.22 → audit FAIL → sửa thành súng hai nòng
   (mag 2) → 0.89.*
4. Ngưỡng **dưới** của `magClearRatio` chỉ FAIL ở T1–T2. Từ T3 trở lên, sức mạnh thực tế bị chi phối bởi
   weapon level + talent + thẻ trong run (không đọc được từ `weapons.json`) nên chỉ WARN.
5. `reserveMax` đủ cho **6–9 wave** nếu không melee → buộc phải melee từ wave ~7 (WARN, quyết định bằng playtest).
6. Không vũ khí nào có cả `dps` **và** `knockback` ở top 10% (không có "khẩu ngon nhất mọi mặt").
