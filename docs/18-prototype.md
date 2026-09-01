# 18 — Prototype three.js (playable)

Prototype nằm ở `prototype/`. Nó **không phải demo trình diễn** — nó là dụng cụ đo cho Sprint 0/1 ở `17`:
mục tiêu số một là trả lời *"người chơi có phân biệt được tap-để-bắn và quẹt-để-chém hay không"*.

**Chạy cục bộ:**

```bash
powershell -ExecutionPolicy Bypass -File .\serve_local.ps1
```

Rồi mở `http://localhost:8123`. Bắt buộc chạy qua HTTP — prototype dùng ES module nên `file://` bị CORS chặn.

---

## 1. Kiến trúc

| File | Việc |
|---|---|
| `js/data.js` | `fetch` đúng `data/*.json` của GDD. **Không hardcode số nào** |
| `js/balance.js` | Cài đặt công thức ở `16`: `enemyHP`, `tpBudget`, `countPerTP`, `rarityWeights`, `goldPerKill`, `meleeBandDpsCap`, RNG có seed |
| `js/input.js` | **Máy trạng thái gesture** đúng `03` mục 2, kèm bộ đếm input bị huỷ |
| `js/enemies.js` | Pool 240 quái, 2 InstancedMesh (thân + mắt), separation bằng spatial hash |
| `js/director.js` | Wave director theo TP, chuỗi phòng, Sương Đen, sinh **Ngã Ba Hầm** + 4 ràng buộc ẩn |
| `js/juice.js` | Hitstop, shake có hướng tắt theo hàm mũ, vàng nổ + hút, xác bay theo vector |
| `js/audio.js` | SFX sinh bằng WebAudio (không asset) — có **coin chime ladder** |
| `js/world.js` | Hành lang, 7 biome theo Depth, đuốc, sương mù |
| `js/ui.js` | HUD portrait, màn hình Cổng (thẻ + 2 cửa), màn kết run |
| `js/game.js` | Trạng thái người chơi + combat + vòng khoá Đạn ↔ Stamina |

`prototype/data/` là **bản copy** do `build_pages.ps1` đồng bộ từ `data/`. Không sửa trực tiếp.

## 2. Cái gì đã chạy được

| Hệ | Trạng thái |
|---|---|
| **Mô hình quãng đường**: chạy hết 90m là xong phòng, quái ra liên tục, không cần giết hết | **Có** — `07` mục 3.5 |
| Nhân vật **tự chạy tiến** 2.4 m/s, hành lang tự tái sử dụng (chạy vô hạn) | **Có** |
| Thanh **MÉT** + thanh tiến độ dưới màn hình | **Có** |
| Số wave = quãng đường / 30m, `tpBudget(R,w)` tăng theo w → **wave sau dồn dập hơn** | **Có** |
| Quái tới được người chơi thì **gây dmg 1 lần rồi biến mất**, không rơi vàng | **Có** — `09` mục 2c |
| **Quái ĐỨNG YÊN**, người chơi chạy 4.2 m/s (mô hình Into the Dead) | **Có** — `09` mục 2c |
| **3 làn**: giữa 4.0m gây damage, hai bên 2.4m chạy qua vô hại | **Có** — ngưỡng đo được đúng 2.0m |
| **Vạch làn vẽ trên sàn**, màu theo đuốc của biome | **Có** — không có nó thì luật làn là thông tin ẩn |
| Giết quái làn bên = **vàng thêm**, không bắt buộc | **Có** |
| Khoảng spawn của mọi pattern nằm trong `waves.json`, có gate cửa sổ phản ứng | **Có** |
| Quái `ranged` + Ogre **cắm chân** ở khoảng còn tap được; loại khác **xông tới** | **Có** |
| **Súng rút ra / cất đi**: tap-hold rút súng bắn, nhả tay cất + reload | **Có** — có model súng, nhảy lửa đầu nòng |
| Huỷ reload khi **còn đạn**; **không** huỷ được khi hết sạch đạn | **Có** — `03` mục 2b |
| **Chém liên tục** kiểu chém hoa quả, giữ ngón tay drain stamina | **Có** — cooldown/con chặn rung ngón tay |
| Tap bắn · Hold bắn liên tục · Quẹt ngang chém (nhẹ/nặng theo độ dài) · Quẹt dọc né/xốc | **Có**, đúng ngưỡng ở `controls.json` |
| Vùng chết 55–65° + bộ đếm input huỷ | **Có** — hiện trên overlay "Hiện đo input" |
| Chế độ Hai Vùng (fallback rủi ro R1) | **Có**, bật ở màn hình đầu |
| Băng đạn / dự trữ / reload / **Nạp Hoàn Hảo** (cửa sổ ngẫu nhiên có seed) | **Có** |
| Stamina + ngưỡng 50% giảm 50% tốc độ chém | **Có** |
| **Goblin Vàng**: 50%/wave, chỉ làn bên, giết = 1 băng đạn | **Có** |
| Chém Hoàn Hảo (≥3 con/nhát) + combo 5 bậc | **Có** |
| Knockback + xác bay **theo đúng vector quẹt** + domino | **Có** |
| Wave director theo `TP_budget(R,w)` + `countPerTP` | **Có** |
| Sương Đen | **Chỉ còn ở phòng boss** — mô hình quãng đường làm nó mất lý do tồn tại, xem `07` mục 3.5 |
| **Ngã Ba Hầm**: 2 cửa, biển báo, số quái dự kiến, 4 ràng buộc ẩn | **Có** |
| 3 thẻ nâng cấp, rarity theo **Lộc** | **Có** — 24 thẻ đã cài hiệu ứng thật |
| Lộc: Elite +2, phòng không mất máu +1, mỗi 10 Chém Hoàn Hảo +1 | **Có** |
| Vàng: nổ chùm, vật lý, hút, **coin chime ladder**, cột vàng | **Có** |
| 7 biome theo Depth, cửa "tối" thu đuốc | **Có** |
| Phòng nghỉ (Shop / Miếu / Kho báu / Suối) | **Có** (tự động, chưa có UI mua) |
| **Goblin Khiên**: khiên chắn tầm xa x0.3, hở 0.8s/4s, quay chậm 92°/s nên vòng ra sau lưng được, búa/axit/chém nặng bỏ qua | **Có** |
| **Ogre Hầm**: vòng cảnh báo AoE trên sàn, telegraph 0.6s có commit, yếu điểm bụng x2.0 | **Có** |
| Chọn Depth khởi đầu (1/3/5) + chọn dao ở màn hình đầu | **Có** — để test quái Depth 3+ không phải chơi lại từ đầu |

## 3. Cái gì CHƯA có (ngoài scope prototype)

- **Boss** — phòng 10 hiện chỉ là một wave lớn (`roomTypeMult` 1.6), không có boss thật.
- Meta ngoài run: Weapon XP, talent, Trại Mỏ, Depth unlock. Depth khởi đầu và dao chọn được ở màn hình đầu
  nhưng đó là công cụ test, không phải meta thật.
- UI shop để tự chọn mua (hiện tự mua máu + đạn).
- 26 thẻ còn lại và toàn bộ 12 Bảo Vật.
- Quái Depth 4+ (Dơi Hầm bay, Goblin Đào Hầm trồi lên sau lưng, Đầu Bò charge, support, Quỷ Hầm)
  đã có trong data và director spawn được, nhưng **hành vi riêng chưa cài** — hiện chạy như trash HP cao.
  **Đã cài: Goblin Khiên + Ogre Hầm** (xem `09` mục 2b).

## 4. Prototype đã sửa GDD ở đâu

Đây là phần quan trọng nhất của doc này: **prototype tìm ra 38 lỗi mà đọc doc không thấy.**

| # | Phát hiện | Sửa |
|---|---|---|
| 1 | 17 con cùng đi tới **một điểm** → xếp chồng lên nhau, màn hình thành một bức tường capsule, không đọc được gì | Thêm separation bằng spatial hash. Đây là thứ doc chưa bao giờ nói tới nhưng bắt buộc phải có |
| 2 | Quái cao 1.6m (như zombie) thì **một con** đã che kín khung nhìn ở tầm 1.2m | Goblin cao **1.05m**. Vừa đúng lore (goblin lùn) vừa giải quyết rủi ro R6. Đã ghi vào `09` |
| 3 | Đèn đuốc để intensity 1.35 → hành lang **đen thui**. three r155+ dùng đơn vị vật lý (candela, giảm theo 1/d²) | Intensity 24–44 tuỳ biome. Ghi lại để không ai lặp lại |
| 4 | **Trần DPS ở dải Cận chiến 0.28×HP/giây tại R1** = chết sau 3.6s tiếp xúc. Không còn chỗ để học | Hạ base xuống **0.16** (~6.3s), giữ trần 0.55. Đã sửa `16` mục 5 và `06` mục 5. **Cần human playtest xác nhận** |
| 5 | Phòng đầu tiên của run có thể roll ra wave **Thuỷ Triều 29 con** → người mới chết ngay | Phòng 1–2 của mỗi Depth chỉ roll wave `tpMult ≤ 1.05`; wave đầu tiên của run luôn là `wv_dongchay`. Đúng `07` mục 3.4 nhưng doc chưa nói rõ là ràng buộc cứng |
| 6 | Telegraph đỏ cộng dồn → **cả đám đỏ vĩnh viễn**, mất hoàn toàn tín hiệu "con này sắp đánh" | Telegraph lấy từ cooldown đòn: chỉ đỏ trong 0.4s trước khi vung |
| 7 | Counter **"đánh sau lưng Goblin Khiên"** là counter giấy: trong hành lang mà quái luôn tự hướng về người chơi thì "sau lưng" không bao giờ tồn tại | Cho quái một **tốc độ quay có giới hạn** (`turnRateDeg`, Khiên = 92°/s). Xốc Tới giờ thật sự vòng được ra sau. Đã ghi vào `09` mục 2b |
| 8 | Bước Lùi **huỷ** đòn AoE của Ogre thay vì **né** nó — vì lùi ra khỏi `attackRange` là ogre thoát trạng thái đánh. Mất hẳn cảm giác "vừa né được", tức mất lý do tồn tại của đòn AoE | Đòn AoE phải **COMMIT**: đã vào telegraph là vung, dù người chơi đã lùi. Né = ra khỏi `aoeRadius`. Đã ghi vào `09` mục 2b |
| 9 | **Quái tụt xuống dưới đáy màn hình, không tấn công được.** Mọi con dừng ở `atkRange = 1.2m`; chiếu phối cảnh cho thấy điểm tap của chúng nằm ở **92.7%** chiều cao màn hình — dưới cả nút NẠP. Doc chỉ ghi "dải Cận chiến rơi vào 45–75% màn hình" mà **chưa bao giờ kiểm** | Thêm `run.tapNearM = 2.4m` (→ 72.1%), và audit **tự tính** vị trí trên màn hình từ `camera` + `scale` trong data, FAIL nếu ra ngoài 45–75%. Con số cũ 1.2m giờ báo **100.1%** — ngoài khung hoàn toàn |
| 10 | **Vũ khí cận chiến với ngắn hơn khoảng quái đứng** → dao vô dụng đúng ở khoảng mà súng đã không bắn được nữa. Và quái `role: ranged` **không có trường tầm bắn** trong data nên dùng `ATTACK_RANGE = 1.2m`: "quái ném đá" đi tới sát mặt mới ném | Mọi `reachM` +0.8m (ngắn nhất 2.0 → **2.8m**); thêm `rangedStandoffM = 8.5m`. Gate: `reachM ≥ tapNearM + 0.4` |
| 11 | **Ogre không bao giờ kịp đập.** Người chơi tự chạy 2.4 m/s nên cửa sổ từ lúc vào tầm (2.6m) tới lúc va phải (1.0m) chỉ **0.67s**, mà telegraph đã 0.6s và `atk` khởi tạo ngẫu nhiên 1.3–2.6s | `attackRangeM` 2.6 → **3.4m** (cửa sổ 1.0s) và quái bắt đầu telegraph **ngay khi vào tầm**. Gate: cửa sổ ≥ `telegraphSec + 0.25` |
| 12 | **Bước Lùi 1.2m không còn né được đòn AoE.** Chạy tiến ăn mất `2.4 × 0.6 = 1.44m` trong lúc telegraph, nên điểm giáng đòn là 1.96m và lùi 1.2m chỉ ra 2.36m < `aoeRadius` 2.5m | `dodgeBackM = 1.8m`. Hợp đồng viết lại theo **điểm giáng đòn thật**, không theo `attackRange`. Cả 2 chiều đều có gate |
| 13 | `walked` không bao giờ reset nên `standZ(20) = -440` nằm **ngoài** sàn dài 420m — sau ~19 phòng người chơi rơi ra khỏi thế giới. Chạy liên tục chạm giới hạn này nhanh hơn nhiều | Hành lang **tự tái sử dụng**: kéo cả nhóm mesh theo người chơi, vòng chống hầm dịch theo bội số 5.5m nên trông như đứng yên |

| 14 | **`pincer` nhắm vào vị trí hiện tại của người chơi thì không bao giờ trúng.** Người chơi chạy tiến 2.4 m/s nên đường chéo cố định cắt qua **phía sau lưng**. Doc tả pattern "vào từ hai bên" mà không nói cách tính hướng | Giải bài toán **đón đầu** khi spawn (nghiệm dương của `(a²+1)hz² + 2ab·hz + b²−1 = 0`). Đo: spawn `x=3.5` cách 12m → hướng `(−0.560, 0.829)`, tới sát **1.02m** và trúng. Đã ghi vào `09` mục 2d |
| 15 | **Cả wave `wv_saulung` (đánh sau lưng) vô tác dụng.** Nó dùng Goblin Đào Hầm (2.4 m/s = **bằng đúng** người chơi) và Goblin Cùi (2.2). Spawn từ phía sau mà không nhanh hơn thì không bao giờ đuổi tới | Đào Hầm 2.4 → **3.4**; thay Goblin Cùi bằng Goblin Chạy (4.4). Gate: mọi quái trong wave `back_ambush` phải có `speed > run.speedMps` |
| 16 | **Separation xoá sạch làn.** Nó được thêm vào ở lỗi #1 để chống quái xếp chồng khi tất cả cùng lao vào một điểm. Giờ quái đi thẳng theo làn thì lực đẩy ngang của nó phá vỡ đúng cái cơ chế "quái ở rìa đi thẳng qua" | Giảm lực đẩy ngang (`sepLateralMult` 0.35) và thêm **lane spring** kéo quái về làn spawn. Đẩy dọc giữ nguyên nên quái cùng làn xếp hàng sau nhau. Đo lại: trôi ngang = **0.00m** trên cả 5 làn |
| 17 | **`ceiling_drop` spawn ở 5m là không kịp phản ứng.** Khi quái đứng yên thì tốc độ tiếp cận = tốc độ chạy, nên 5m ở 4.2 m/s chỉ cho **0.62s** trước khi quái tụt khỏi vùng tap được. Và `back_ambush` spawn **phía sau** thì với quái đứng yên là **không bao giờ gặp được** người chơi | Khoảng spawn của mọi pattern chuyển vào `waves.json` (`spawnDistM`) để director và audit đọc **cùng một nguồn**. Gate: mọi `spawnDistM[0] ≥ tapNearM + minReactionSec × speedMps` = **7.44m**, và chặn mọi giá trị ≤ 0. `ceiling_drop` → 9–14m, `back_ambush` → 9–12m |
| 18 | **Thống nhất thông số vũ khí cận chiến làm vỡ mục tiêu DPS theo tier.** DPS = `dmg × targets / swingTime`, nên đổi `targets` từ 2–6 sang 5 cho tất cả làm 9/12 vũ khí lệch khỏi `dpsTarget(tier)` — lệch nhiều nhất **156%** | `normalize_balance.ps1` tính lại `dmg` (thay đổi lớn nhất **60.8%**) → bậc thang sạch 59/139/326/767/1802/4234. Đây là lý do `dmg` phải là **đại lượng suy ra**, không phải số gõ tay |
| 19 | **Tăng mật độ quái mà không sửa `midSpawnFrac` thì độ khó tăng theo.** Nâng `tpBase`/`tpPerRoom` lên 2.7× cho ra 153 quái/phòng, nhưng nếu giữ nguyên tỉ lệ làn giữa thì số mối đe doạ cũng ×2.7 | Hệ 3 làn cho phép tách hai thứ: hạ `midSpawnFrac` 0.45 → **0.32** giữ làn giữa ở **30 con** (trước là 32) trong khi làn bên tăng 24 → **123**. Đông gấp 2.7× mà độ khó không đổi |
| 20 | **Wave `pincer` pha loãng tỉ lệ làn giữa ~1/3.** Nó dồn **toàn bộ** ra hai làn bên (`lane: "sides"`), nên `midSpawnFrac` = 0.20 cho ra làn giữa chỉ **19 con** và **không bắn gì cũng chỉ mất 97 HP** — sống sót được mà không làm gì | Bù lên 0.32. Đo lại: làn giữa 30, không bắn gì mất **175 HP**. Gate về số tuyệt đối có ghi chú rằng con số mô hình hoá cao hơn thực đo ~1/3 |
| 21 | **Chém làn trái giết luôn quái làn phải.** Nhát chém dùng hình quạt world-space; cung 110° ở tầm xa phủ gần hết chiều rộng hành lang. Và trong chế độ chém liên tục, mỗi đoạn ngón tay có hướng riêng nên cung nhảy qua nhảy lại hai bên | Lưỡi dao = **đoạn ngón tay trên màn hình** (`queryBlade`), không phải hình quạt. Đo: quẹt nửa trái cắt quái trái, **không** chạm quái phải; và ngược lại. Vệt slash vẽ đúng đoạn đó nên người chơi **thấy đúng cái đã cắt**. Xem `05` mục 7c |
| 22 | **Trash cần 5 nhát mới chết**, phá luật cứng "trash chết 1 nhát" (`09` nguyên tắc 4). Nguyên nhân: `dpsMeleeEff` chia sát thương cho `targetFactor = 1 + 0.35×(targets−1)` = **3.45** khi `targets = 8` — mà vì `targets` giờ đồng nhất, hệ số đó không phân biệt vũ khí nào cả, nó chỉ là một phép chia đều | Bỏ `targets` khỏi ngân sách DPS ở **cả** `normalize_balance.ps1` **và** `audit_gdd.ps1` (hai bên lệch nhau thì gate báo), cộng **sàn one-shot** `dmg ≥ trashHp × 1.65` (= 1/`slideTickDamageMult`) nên một đoạn quét cũng đủ giết trash. Gate mới kiểm luật này |
| 23 | **Chỉ có 1.63 con trong tầm dao**, 32% thời gian không có con nào — nên `targets = 8` là con số chết. Rải đều 0.7 con/m thì tầm 4.5m không bao giờ đủ đông | Tầm **7.0m** (gate mới: phải < `rangedStandoffM` 8.5m, nếu không dao giải quyết luôn cả quái ranged) + **cụm** (`clumpChance` 0.72). Đo lại: trung bình **16.8 con** trong tầm, một nhát giết tối đa **7 con**, trung bình **2.65** |
| 24 | **Quái làn bên không bao giờ chém được.** FOV ngang của màn hình dọc chỉ 58.8°, nên ở độ sâu 3m thì 3m ngang đã ra ngoài khung — chúng chỉ vào khung từ ~5.3m, nhưng lúc đó vẫn ngoài tầm dao cũ | Không sửa: đây là **phân vai đúng** — làn bên chỉ **bắn** được, làn giữa mới **chém**. Đã ghi vào `09` mục 2c để không ai đi tìm "bug" này nữa |
| 25 | **Vệt slash vẽ đè lên cả HUD và màn chọn thẻ**, vì canvas 2D của nó có `z-index: 2` trong khi HUD và sheet đều dùng z-index tự động | Bỏ `z-index`: thứ tự DOM đã đúng (`view` → `fxTrail` → `hud` → `screen`) |
| 26 | **Luật "melee mạnh hơn ranged +30%" có lý do đã hết hiệu lực.** Doc ghi *"nếu không thì không ai dám vào gần và Cướp Đạn chết"* — nhưng trong mô hình chạy X mét người chơi **không chọn** vào gần: quái làn giữa tự đến trước mặt. "Vào gần" không còn là rủi ro phải trả giá | Đảo gate: `meleeAdvantage` 1.45 → **0.80**, melee DPS phải **thấp hơn** ranged. Đối mặt thật là **đạn**: súng mạnh hơn nhưng hữu hạn, dao yếu hơn nhưng miễn phí và nạp đạn lại qua Cướp Đạn. Xem `05` mục 7d |
| 27 | **`canvas.clientWidth` ra 0 thì lưỡi dao im lặng không trúng gì.** Toạ độ lưỡi dao và vệt slash lấy từ `clientWidth`, mà renderer lại lấy từ `window.innerWidth` — hai nguồn khác nhau. Khi layout chưa xong hoặc pane bị ẩn thì `clientWidth = 0`, lưỡi dao co về một điểm và **không có lỗi nào được ghi ra** | Một nguồn kích thước duy nhất: `resize()` lưu `this.vw/vh` từ `window.innerWidth/Height`, và lưỡi dao, vệt slash, renderer đều dùng nó |
| 28 | **Giữ ngón tay đứng yên thì súng KHÔNG BAO GIỜ bắn liên tục.** `_enterHold()` chỉ được gọi bên trong `pointermove`, nên nếu ngón tay không nhúc nhích thì không có sự kiện nào và máy trạng thái kẹt ở `PENDING` cho tới lúc nhả tay — lúc đó nó thành một cái TAP. Người chơi phải **rê tay** mới ra đạn liên tục. Doc `03` mô tả máy trạng thái bằng *điều kiện*, không bằng *sự kiện nào đánh thức nó* — nên lỗi này đọc doc không thấy | Đặt `setTimeout` ngay ở `pointerdown`, huỷ khi khoá sang SLIDE hoặc khi nhả tay. Đo: giữ yên hoàn toàn → vào chế độ bắn liên tục sau **132ms**. Hạ `tapMaxDuration` 180 → **110ms** |
| 29 | **Tăng băng đạn và giảm tốc độ bắn cùng lúc làm vỡ trụ P2.** `magClearRatio = dpsTarget × cycle / waveEHP` chỉ phụ thuộc **thời lượng chu kỳ**, mà `mag↑` và `rpm↓` **đều** kéo dài chu kỳ. Băng ×1.6 + rpm ×0.7 cho ra 8 vũ khí có ratio > 1.0, tức **một băng đạn dọn sạch cả wave** — vòng khoá Đạn↔Stamina chết vì người chơi không bao giờ hết đạn | Biên độ bị chính gate chặn: chốt ở **mag ×1.18, rpm ×0.85**. Muốn băng to hơn nữa thì phải rút ngắn `reloadTime` để bù, chứ không thể chỉ tăng mag |
| 30 | **Ba nơi mô hình hoá cùng một cái wave, bằng ba công thức khác nhau.** `normalize_balance.ps1` và `audit_gdd.ps1` đều hardcode `tp = 14 + 4.2R`, trong khi `data/waves.json` đã đổi sang `38 + 11.5R` từ lúc tăng mật độ quái. Hai script vì thế đánh giá wave **nhỏ hơn thực tế 2.7 lần**, làm gate `magClearRatio` báo FAIL oan cho 7 vũ khí — tôi suýt cắt băng đạn xuống một nửa để chiều một con số sai | Cả hai script đọc `tpBase`/`tpPerRoom` từ `waves.json`. Sửa xong thì 7 FAIL đó biến mất **mà không đụng vào một con số cân bằng nào**. Kéo theo: vàng khai báo ở `economy.json` + `depths.json` lệch 2.25× so với mật độ mới → cập nhật cả hai |
| 31 | **"Mọi viên đạn ≥ 120 sát thương" mâu thuẫn trực tiếp với đường cong DPS.** Ở T1 mục tiêu DPS là 110, nên **một viên** 120 dmg đã hơn cả một giây DPS. Bản đầu tôi cho normalizer hạ `rpm` để giữ DPS — nó kéo shotgun xuống **8 rpm**, tức 7 giây một phát | Sàn sát thương **thắng** đường cong: chấp nhận 4 súng tier thấp vượt DPS mục tiêu, và audit **liệt kê** chúng thay vì báo FAIL. Nhịp bắn do dải archetype quyết định, không do phương trình DPS |
| 32 | **Shotgun T1 bị ép xuống băng 1 viên.** 120 dmg × 8 viên ghém = 960 mỗi phát, mà cả một wave T1 chỉ có ~1423 EHP → hai phát đã dọn sạch wave, vỡ trụ P2. Sàn "băng ≥ 2 viên" thì lại vỡ gate | Giảm viên ghém của riêng nó 8 → **4** (vẫn là shotgun, vẫn 120/viên). Đây là archetype bị sàn 120 bóp nghẹt nhất: nhân sát thương với số viên ghém thì trần wave đến rất nhanh |
| 33 | **Shotgun chỉ giết được 1 con.** Mọi súng đều tính `dmg × pellets` rồi **dồn hết vào một mục tiêu** — nên shotgun 4 viên ghém không khác gì rifle, chỉ là bắn chậm hơn. Cả bảng archetype trong `04` mục 5 chỉ là **mô tả văn xuôi**, chưa bao giờ có cơ chế nào đứng sau | `balance.archetypeHit` trong data: `single` / `spread` (chia viên ghém ra nhiều con) / `pierce` (xuyên n con phía sau) / `aoe` (nổ theo bán kính). Đo cùng một cảnh 6 con: rifle trúng **1**, shotgun trúng **4**, nỏ xuyên **3** |
| 34 | **Bỏ quẹt dọc thì vùng chết 55–65° mất hết lý do tồn tại**, nhưng nó vẫn nằm trong `controls.json` cùng hai tham số chết `meleeAngleMax` / `moveAngleMin`, và Chế độ Hai Vùng vẫn còn trong UI. Vùng chết sinh ra để tách "quẹt để chém" khỏi "quẹt để di chuyển" — bỏ vế sau thì vế trước chiếm trọn | Gỡ `gs_deadzone` + `gs_slide_up` + `gs_slide_down` + 2 tham số + Chế độ Hai Vùng. Gate CTRL viết lại: giờ nó **kiểm rằng không còn** vùng chết và gesture di chuyển. Kéo theo: đòn AoE của Ogre mất counter "né", chỉ còn "giết trước khi nó vung" |
| 35 | **Màn hình đầu vẫn dạy cơ chế đã bị thay.** Nó ghi "CHẠM vào quái để bắn" (giờ tự nhắm), "QUẸT DỌC XUỐNG = bước lùi" (đã gỡ), "Rựa Rừng — 3 mục tiêu" (giờ mọi dao đều 8), và Chế độ Hai Vùng. Không có gate nào bắt được text UI lệch khỏi cơ chế | Viết lại toàn bộ. Cũng sửa 2 lỗi layout: thừa một `</div>` làm dòng trạng thái văng ra ngoài khung, và `.screen` không cho cuộn nên nút XUỐNG HẦM bị cắt trên máy màn nhỏ |
| 36 | **Mô hình "mọi súng cùng DPS" làm nhịp bắn thật không thể tồn tại.** Muốn SMG bắn 700 nhịp/phút thì sát thương mỗi viên phải tụt xuống mức vô nghĩa; muốn viên đạn mạnh thì nhịp bắn phải xuống 155 (rifle) hay 48 (shotgun) — chậm hơn đời thật 4–5 lần. Không phải lỗi số, mà là **mô hình cân bằng sai chỗ** | Đảo lại: sát thương suy từ **cỡ đạn** (`caliberMult` = số lần HP trash), nhịp bắn từ **số liệu thật**, và **đạn** là thứ cân bằng (mọi khẩu mang **1.5 băng phụ**, xem lỗi #62). DPS giờ chạy từ 237 tới 1549 tuỳ archetype — đúng như đời thật |
| 37 | **`magClearRatio` đo sát thương thô, không đo số mạng.** Một viên 120 dmg vào goblin 40 HP thì thừa 3 lần, nên metric cho ra con số sai gấp 3 — nó ép băng đạn SMG xuống **7 viên** trong khi MP5 thật có 30 | Đổi sang `killsPerShot = pellets × min(1, dmg/trashHp) × (1+pierce) × aoeFactor × killEff`. Băng đạn về đúng cỡ thật (SMG 25, rifle 25, LMG 100). `killEff` có mặt vì đạn ghém tản theo góc nên **không phải viên nào cũng trúng một con riêng** — thiếu nó thì shotgun ra 45 mạng một băng |
| 38 | **Chính `audit_gdd.ps1` bị nhân đôi một khối lớn** do một lần splice sai của tôi, và nó **vẫn chạy xanh** — chỉ khác là in ra hai bản tóm tắt và báo 99 check thay vì 80. Một cái audit tự nhân đôi sẽ thổi phồng số PASS và che mất chỗ nào chưa được kiểm | Dựng lại file từ ba đoạn đúng. Bài học đã ghi: khi sửa audit bằng splice thì phải **đếm lại số check** và soi trùng tên, vì file này là lưới an toàn của cả dự án — nó hỏng thì không có gì bắt được nữa |

| 39 | **Chạy được ~70m ở D1-R5 là hết sạch quái, 80m còn lại chạy giữa hành lang trống.** Phòng Elite (và Boss) đặt `wavesInRoom = 1` với ghi chú "một wave lớn trải dài cả quãng đường", nhưng vòng spawn lại rải hết hàng đợi trong đúng **một đoạn `waveSegmentM` = 50m**. Cộng thêm `target = min(maxTotalAlive, ...)` cắt số quái của wave theo trần **số con sống cùng lúc** — hai thứ khác hẳn nhau, vì quái đứng yên và bị bỏ lại phía sau rồi despawn | Bỏ cả hai. Mọi phòng chia đều thành đoạn 50m, **mỗi đoạn là một wave mới**, wave sau đông hơn theo `tpPerWave` và ưu tiên template có **loại quái chưa xuất hiện trong phòng**. Elite giờ ra ở wave 1 của phòng Elite, các wave sau vẫn chạy bình thường. Đo lại D1-R5: số con phía trước 37 → 60 → 109 suốt 150m thay vì về 0 ở mét 70 |
| 40 | **Nạp Hoàn Hảo bắt nhìn xuống góc dưới bên phải đúng lúc không được phép nhìn.** Cửa sổ xanh rộng ~0.25s nằm trên nút `NẠP` ở góc màn hình — cách tâm ngắm 14–18°, tức **ngoài vùng đọc được của mắt**. Người chơi phải chọn giữa nạp giỏi và thấy đám quái đang tới. Cùng lý do đó, số đạn ở góc dưới cũng vô dụng trong lúc đánh | HUD đạn dời lên **78% chiều cao** (ngay dưới dải cận chiến, không che quái), nhịp bắn vẽ thành **vòng tròn quanh tâm ngắm**, và Nạp Hoàn Hảo **chạm được ở bất kỳ đâu** trên màn hình (20% đầu bỏ qua vì đó là cú chạm cuối của loạt bắn). Nghiên cứu + số đo ở `14` mục 7 |
| 41 | **Nhãn chọn súng ở màn hình đầu viết tay nên lệch hẳn với data.** Nó ghi "Gọng Sắt 155 nhịp/phút" trong khi `weapons.json` là **600**, "Miệng Hang 48" trong khi thật là **55**. Sai từ lần tune trước và không có gate nào bắt được, vì audit chỉ kiểm data chứ không kiểm text UI | Sinh danh sách súng **từ data** trong `main.js`, và mỗi dòng ghi thẳng **delay giữa 2 phát** (`60/rpm`) thay vì nhịp/phút — đó mới là con số người chơi cảm thấy. Nguyên tắc: **không viết tay bất kỳ con số nào đã có trong `data/`** |

| 42 | **Bắn trúng con không chết thì màn hình không có gì thay đổi.** Xung knockback *có* chạy, nhưng `kb_weapon` chỉ 0.4–1.6 và tắt theo hàm mũ → đi được ~0.4m, mà ở cự ly 10m thì 0.4m là **vài pixel**; phần đẩy ngang lại bị lane spring kéo về ngay. Còn lại đúng một cái nháy trắng 0.17s. Người chơi đọc ra là "đạn không trúng" | Ba lớp chồng lên nhau trong `gamefeel.json` khối `hitReaction`: `impulseMult` 3.5 (một phát shotgun đẩy 5 con lùi **1.35m**), **giật ngược** 0.16s có sàn `lurchMinFrac` nên Quỷ Hầm `kbResist` 0.90 chỉ lùi 0.14m nhưng **vẫn giật**, và **nén người** trong lúc giật. "Không đẩy được" phải khác "không phản ứng" |
| 43 | **Shotgun: chạm liên tục mà không ra đạn, và không có gì báo vì sao.** `if (this.fireCd > 0) return;` — một `return` câm lặng. Với nhịp 1.09s thì có tới hơn một giây người chơi bấm mà máy không trả lời gì. Một input không có phản hồi bị đọc là **lỗi máy**, không phải luật chơi | Lấp khoảng đó bằng **animation lên đạn** (thoi trượt về sau rồi đẩy lên trước) chạy **đúng bằng `60/rpm`** — nó là cái vẻ của delay đã có, không phải delay thứ hai. Cộng tiếng **cò khan** + vòng nhịp bắn nảy khi chạm sớm (có cooldown chống spam). Chuyển sang chém thì bỏ animation ngay nhưng `fireCd` **giữ nguyên**: rút dao ra không làm súng lên đạn nhanh hơn |

| 44 | **Knockback vẫn nhẹ, mà tăng lực lên thì vỡ game theo hướng khác.** `impulseMult` 3.5 cho ra 1.35m — vẫn chưa "nảy". Nhưng nâng thẳng lên thì chém slide liên tục (1 nhát / 0.22s × ~1.8m) đẩy quái **8 m/s**, gần gấp đôi tốc độ chạy 4.2 m/s → quái **không bao giờ chạm được** vào người chơi nữa. Giảm lực mỗi nhát để chữa thì nhát ĐẦU TIÊN cũng yếu đi, tức là chữa đúng cái đang muốn giữ | `impulseMult` → **7.0** (một phát shotgun đẩy 6 con **2.5–2.8m**), và thêm **ngân sách đẩy tính bằng mét**: mỗi con có `kbBudgetM` 4.0m, hồi `kbRefillMps` 1.2 m/s. Cú đầu ăn nguyên lực; đẩy liên tục thì tốc độ lùi bị kẹp về 1.2 m/s — **thấp hơn hẳn** tốc độ chạy, nên người chơi luôn đuổi kịp. Đo: chém liên tục vào một con, khoảng cách 8m → chạm nhau sau **2.9 giây** |
| 45 | **Nạp đạn nhanh quá và shotgun nạp cả băng cùng lúc.** Reload 1.4–2.6s là một cái chớp mắt, không phải một quyết định — trụ P2 (vòng khoá ĐẠN ↔ STAMINA) mất bản lề. Riêng shotgun nạp cả 5 viên một lần thì mất luôn cá tính đặc trưng nhất của nó | `balance.reloadGlobalMult` = **1.45** nhân vào dải reload mọi archetype (normalize clamp vào dải ĐÃ nhân nên idempotent). Shotgun `reloadStyle: "shell"` — **nạp từng viên** 0.75s/viên, nạp đủ vẫn tốn 3.77s nhưng **cắt ngang được bất cứ lúc nào**. Nỏ đi hướng ngược lại: băng **1 mũi tên**, nạp **0.55s** — ngắn hơn nhịp bắn 1.18s nên nạp không bao giờ chặn tay |
| 46 | **"Đang nạp" nói bằng một thanh mảnh 13px.** Nạp là trạng thái người chơi **không bắn được** — trạng thái nặng nhất trong trận — mà tín hiệu của nó nhỏ hơn cả dãy vạch đạn bình thường. Ngoại vi không bắt được, và cửa sổ Nạp Hoàn Hảo rộng 0.25s thì càng không | Vòng tròn 64px thay chỗ dãy vạch: **vòng đứt nét XOAY** (ngoại vi bắt chuyển động ngay cả khi mắt khoá vào quái) + cung vàng tiến độ + vạch xanh cửa sổ + số giây ở giữa + chữ `ĐANG NẠP` / `ĐANG NẠP VIÊN 3/5`. Cùng lúc dời **stamina** từ góc dưới lên cột trạng thái, và cho **viền màn hình** thành kênh sinh tồn (chớp đỏ khi trúng, đập đỏ khi HP < 35%). Xem `14` mục 7c–7e |
| 47 | **Bộ 50 thẻ nâng cấp toàn logic.** Điều kiện ("khi HP < 30%"), đánh đổi ("vàng x1.4 nhưng −15% HP"), cơ chế riêng ("chém trúng thì phát bắn sau +60%"), combo ẩn mở thẻ Legendary. Người chơi đọc ba thẻ này ngay sau khi vừa chạy 50m và đang thở — đó là **ba bài toán** đặt vào đúng lúc họ ít khả năng giải nhất | Viết lại thành **12 chỉ số × 4 bậc**: mỗi thẻ là MỘT con số cộng vào MỘT chỉ số, không điều kiện, không drawback. Bậc chỉ đổi con số (Sát Thương I/IV = +15%/+57%), Lộc kéo bậc lên. `applyCard()` thành bảng tra cứu phẳng theo `stat` — thêm thẻ mới trong data không phải sửa dòng code nào. Cơ chế riêng dời hẳn về **Bảo Vật** và **Talent**, nơi người chơi ngồi đọc ngoài trận |

| 48 | **"Giật lag" không phải lag — là hit stop.** `addHitstop` làm `timeScale` trả về 0, tức **dừng hẳn cả game**, và nó được gọi ở **mọi** cú trúng: mỗi nạn nhân của một phát shotgun, mỗi tick slide, và cả khi **chém trượt**. Đo: giữ tay bắn rifle → **21% số frame** đóng băng; chém liên tục → **20%**; ép mỗi frame một tick slide → game **đứng hẳn**. Ở mật độ đó hit stop không còn đọc ra là "đã" mà là "máy hỏng" | `hitstopRules` leaky bucket: `maxFrac` **0.08** (trần cứng 8% thời gian thực), `bucketSec` 0.20 (burst đủ cho Chém Hoàn Hảo 7 frame), `minGapSec` 0.13 (**luôn có nhịp SỐNG** giữa hai lần đóng băng). Cộng hai luật: chém trượt **không** đóng băng, và nhát slide chỉ đóng băng **khi có mạng**. Cú đánh lẻ vẫn ăn nguyên hit stop |
| 49 | **`_separate` đẻ 240 chuỗi mỗi frame.** Khoá lưới không gian dùng `` `${cx},${cz}` `` — ở 60fps với 240 con là **14.400 chuỗi/giây** chỉ để vứt đi, và GC pause lộ ra **đúng lúc đông quái** (frame xấu nhất 3.9ms). Nó chiếm 56% thời gian của `pool.update` | Khoá thành số nguyên `(cx+512)*4096 + (cz+2048)`. Đo lại: `_separate` **0.131ms → 0.028ms**, frame xấu nhất 3.9 → 3.1ms, và hết hẳn rác chuỗi mỗi frame |
| 50 | **Ngưỡng nhận quẹt 900 px/s là một cú BUNG tay, không phải cú quẹt.** Trên màn 390px CSS đó là 2.3 chiều rộng màn hình mỗi giây. Quẹt bình thường bị đọc thành `HOLD` → rút súng, và **luật khoá hai chiều** thì từ đó không ra dao được nữa cho tới khi **nhấc tay**. Mỗi lần đổi bắn ↔ chém là một nhịp mất trắng — đó chính là "chuyển đổi không mượt" | Ngưỡng **900 → 520 px/s** (1.35 chiều rộng/giây), cửa sổ nhận 250 → 300ms. Và mở **một lối thoát khoá một chiều** `HOLD_FIRE → SLIDE`: quẹt dứt khoát (≥ 1.35× ngưỡng **và** đủ dài) ra dao ngay, không cần nhấc tay. Chiều ngược lại vẫn khoá vì lỡ tay bắn là mất đạn. Đo: giữ 220ms (súng ra) → quẹt → ra dao trong cùng một lần chạm |
| 51 | **Shotgun tune sai hướng nên phản bội chính cơ chế `spread` của nó.** Nón 12°, `caliberMult` 1.6 (mỗi viên ghém vừa đúng 1 lần HP trash — hết scaling là không giết nổi), dung sai bắt trúng 0.42m nên phần lớn viên ghém bay lọt khe giữa hai con. Đọc ra là "yếu, vùng bắn nhỏ" | Nón **26°** (phủ 3.7m ở cự ly 8m), `caliberMult` **3.4**, `pelletRadiusM` **0.85**, cộng **tắt dần theo tầm** 7m→13m còn 40% để nó vẫn là vũ khí cự ly gần. Đo: bắn vào đám 14 con ra **6 / 2 / 4 / 3 mạng mỗi phát** — mọi con trúng đều chết. Cái giá đi kèm không tách rời: 1.09s/phát, băng 5, nạp từng viên |

| 52 | **Tự nhắm cho CẢ tap lẫn hold nên không còn cách nào chọn mục tiêu.** Lý do bỏ tap-vào-target ở lỗi #24 vẫn đúng (chạm chính xác vào hình bóng nhỏ ở 4.2 m/s là bài kiểm tra ngón tay), nhưng nó bị áp cho **cả hai** gesture — hậu quả: thấy con Thuốc Nổ sắp nổ vào mặt cũng không bắn riêng nó được, và yếu điểm Ogre thành thứ **tự động ăn** chứ không phải phần thưởng của việc nhắm. `pickByScreen` đã có sẵn trong `enemies.js` nhưng **không ai gọi** | Tách hai chế độ: **tap = bắn đúng chỗ chạm** (nón trợ giúp `aimCone` 4°, ăn yếu điểm khi chạm nửa dưới hitbox, và **trượt được** — trượt là thứ làm chế độ chính xác có giá trị); **hold = tự nhắm** như cũ nhưng **không bao giờ** ăn yếu điểm. Nón đạn ghém của shotgun cũng xoay theo hướng nhắm chứ không cố định thẳng trước mặt. Thêm dấu chạm tại chỗ (vàng = trúng / xám = trượt) vì nếu không thì "bắn trượt" và "máy không nhận input" nhìn giống hệt nhau |

| 53 | **Đạn ghém bắn xuyên qua người sống.** Mỗi viên chọn con có **sai lệch ngang nhỏ nhất**, không phải con **gần nhất trên tia**. Một con ở 12m nằm đúng tia (lệch 0.05m) thắng một con ở 4m nằm lệch 0.5m — nên một phát giết con **đằng sau** trong khi mấy con trước mặt không xảy ra gì. Sửa lần đầu thành "gần nhất thì dừng" lại hỏng kiểu khác: `pelletRadiusM` 0.85 cho bề ngang tia **1.15m**, gấp đôi thân goblin thật, nên con đứng giữa **nuốt 9.9/9 viên** còn hai con cạnh nó ăn 0 | Mô hình của game horde (Left 4 Dead / Killing Floor): duyệt từ **gần ra xa**, viên ghém dừng ở con đầu tiên nó chạm, và **chỉ xuyên tiếp khi nó GIẾT được** con đó (`penetrationMult` 0.6, tối đa `penetrateMax` 3). `pelletRadiusM` về **0.6**. Đo: 3 con xếp hàng đều yếu → **cả 3 chết**; đúng cảnh đó nhưng con đầu 60× HP → **cả 3 sống**. Bất biến: không bao giờ có con sau chết mà con trước còn sống |
| 54 | **Cướp Đạn 6 mạng/băng làm vòng khoá ĐẠN ↔ STAMINA mất hết căng thẳng.** Một phòng có 100–170 con; chém 40 con là được gần 7 băng, tức **không bao giờ hết đạn** — mà "đạn hữu hạn" chính là trụ P2, là lý do tồn tại của cả cơ chế cận chiến | **16 mạng = 1 băng**, và chuyển hằng số ra `gamefeel.json` → `melee.scavengeKillsPerMag` (trước nằm cứng trong `game.js`). 40 mạng chém = 2.5 băng: vẫn đáng để vào gần chém, nhưng không thay thế được việc giữ đạn |

| 55 | **Cướp Đạn neo vào `magMax`, mà `magMax` thì nâng cấp được — nên thẻ Băng Đạn ĂN HAI LẦN.** "16 mạng chém = 1 băng" nghe như một tỉ giá cố định, nhưng "một băng" không phải đơn vị cố định: thẻ Băng Đạn cộng tới **+95%** mỗi cấp, chồng 8 cấp. Cuối run cùng 16 mạng chém đổi được gấp nhiều lần đạn so với đầu run — thẻ đó vừa cho băng to hơn, **vừa nhân số đạn cướp được**. Tốc độ hồi đạn dốc lên theo build thay vì phẳng | Neo vào **GIÂY BẮN**, thứ không thẻ nào chạm tới: `bullets/kill = scavengeSecondsPerKill × rpm_GỐC / 60`. `rw.rpm` gốc không nâng cấp được (`rofMult` chỉ đổi `fireInterval`), nên tỉ giá **phẳng suốt run** và **giống nhau giữa mọi khẩu**. Đo: 40 mạng chém = ~12 giây bắn cho cả 4 khẩu (shotgun 10.9s · rifle 12.0s · SMG 11.9s · nỏ 11.8s), và chồng 8 thẻ Băng Đạn (mag 5 → 1045) làm số đạn cướp được đổi **0**. Cộng thêm: trả **từng viên** thay vì một cục mỗi 16 mạng — thanh đạn nhích lên đều trong lúc chém |

| 56 | **Cú tap hơi trượt tay bị nuốt thành nhát chém — "tap vào mà không bắn".** Máy trạng thái khoá sang `SLIDE` **chỉ dựa vào vận tốc**, rồi resolve theo quãng đường. Đo: ngón cái bấm nhanh trên màn 375px trôi **≥ 50px là mất phát bắn**, mà trôi ngần ấy là chuyện bình thường. Hạ `slideVelocityThreshold` ở lỗi #50 làm nó **nặng thêm**: càng nhiều cú tap vượt cổng vận tốc. Và không con số nào cứu được — ở 30ms thì 50px = 1.600 px/s, thừa vượt mọi ngưỡng hợp lý; quãng đường lẫn vận tốc **đều không** tách được "tap trượt tay" khỏi "vẽ nhanh" | Đổi hẳn thứ dùng để phân biệt: **ngón tay đã DỪNG hay còn đang BAY lúc nhả**. Tap thì dừng rồi mới nhấc; vẽ thì vẫn đang chuyển động. Thêm `slideCommitLength` 0.18S (chốt sớm giữa cú) + `tapStillMs` 60ms, và khoá sang SLIDE phải có **cả** vận tốc **lẫn** quãng đường > `tapMaxTravel`. Đo lại: tap trôi 0/30/**55px** đều bắn; vẽ nhanh 50px+ vẫn ra dao. Nhờ đó hạ tiếp ngưỡng quẹt 520 → **430** mà không hy sinh cú tap |
| 57 | **Lối thoát khoá súng → dao NUỐT LUÔN cú chạm.** Lối thoát ở lỗi #50 gọi `_resolveSlide()` ngay tại điểm thoát, nhưng lúc đó quãng đường mới ~19–25px — dưới `slideMinLength`, nên nó rơi vào nhánh *"quá ngắn → coi là tap"*, đặt state = `CONSUMED` và kết thúc: **không bắn, cũng không chém**. Tệ hơn cả trước khi có lối thoát | Lúc thoát chỉ **chuyển state sang SLIDE** rồi để nó chạy tiếp, không resolve tại chỗ. Kèm cờ `fromHoldEscape`: cú quẹt thoát ra từ chế độ giữ đã chứng minh ý đồ bằng vận tốc rồi, nên chốt ở `slideMinLength` chứ không phải `slideCommitLength` — nhát chém ra **giữa cú vẫy**, không đợi nhả tay. Ngưỡng thoát cũng hạ: 1.35× → **1.15×** và quãng đường 45px → **19px** |
| 58 | **Thanh stamina fade đi ĐÚNG LÚC người chơi đang chờ nó hồi.** `showStamina()` đặt hẹn giờ 2s kể từ nhát chém cuối rồi ẩn — nhưng stamina hồi 18/giây, nghĩa là từ 0 lên đầy mất **5.6 giây**. Thanh biến mất ở giây thứ 2, giấu đi đúng cái duy nhất người chơi đang nhìn để biết bao giờ chém tiếp được | Hiện **suốt lúc chưa đầy**, chỉ ẩn khi đã đầy lại (trễ 0.7s cho khỏi giật). Còn đang hồi thì nó còn là thông tin |

| 59 | **Súng bắn chậm hơn ở những giây đầu, nhanh hơn về sau.** Hit stop trả `dt = 0`, mà **mọi** đồng hồ — kể cả `fireCd`, thời gian nạp, cooldown né — đều nằm sau `if (dt > 0)`. Hệ quả ngược đời: **càng trúng nhiều quái càng nhiều hit stop, càng nhiều hit stop thì súng càng bắn chậm**. Vũ khí yếu đi đúng lúc đông quái nhất. Và vì ngân sách đóng băng đầy nhất ở đầu mỗi đợt giao tranh nên nó đọc ra là "mấy giây đầu chậm hơn". Đo: rifle 600 rpm (lý thuyết 10 phát/giây) chỉ ra **7–8 phát**, con số bám theo tỉ lệ đóng băng từng giây (18% → 7 phát, 3% → gần đủ) | Đồng hồ của **người chơi** chạy theo **thời gian thực** ngay cả trong hit stop (`fireCd`, `swingCd`, nạp đạn, né, i-frame) — hit stop là hiệu ứng trình diễn, nó dừng thế giới chứ không được đánh thuế lên nhịp bắn. Slow-mo thì vẫn scale, vì đó là nhịp kịch có chủ đích. Kèm hai chi tiết đủ nuốt 1 phát/giây: **epsilon** ở cổng `fireCd > 0` (sai số dấu phẩy động của `0.1 − 6/60`) và **cộng dồn** `fireCd += fireInterval` thay vì gán cứng. Đo lại: **10/10/10/10/10/10 phát mỗi giây**, và **bằng nhau** dù bắn vào khoảng không (0% đóng băng) hay giữa đám quái (10–22%) |

| 60 | **Bắn hết đạn, nhả tay ra quẹt thì không chém được ngay.** Hai nguyên nhân độc lập cùng đổ vào đúng một khoảnh khắc — và khoảnh khắc đó là lúc *duy nhất* game **ép** người chơi nhả tay rồi chạm lại. (a) **Ngón tay bị nhốt trong `HOLD_FIRE`**: hết sạch đạn mà vẫn khoá vào chế độ giữ-bắn thì không bắn được (hết đạn) mà cũng không chém được (đã khoá). Đo: giữ rồi quẹt 333 px/s — còn đạn thì **bắn 2 phát**, hết đạn thì **bắn 0, chém 0**, ngón tay không làm gì cả. (b) **`pointerdown` mới bị bỏ qua**: nhấc tay rồi chạm lại ngay thì `pointerdown` của ngón mới có thể tới **trước** `pointerup` của ngón cũ, và `if (this.id !== null) return` nuốt luôn cả cú quẹt | (a) `onHoldStart` trả về **false** khi súng không bắn được; bị từ chối thì **ở lại `PENDING`** (cú chạm vẫn còn cơ hội thành nhát chém) và hẹn giờ thử lại mỗi 80ms để nạp xong là tự bắn tiếp. Không gọi `gunUp()` ở nhánh này vì nó có tác dụng phụ tính một cú Nạp Hoàn Hảo — mà `_enterHold()` được thử lại nhiều lần thì cú nạp đó bị tiêu mất vào một thời điểm ngẫu nhiên. (b) Ngón **`isPrimary` mới** đến khi đang theo dõi ngón cũ = ngón cũ đã nhấc, `pointerup` đến muộn → đóng ngón cũ, **nhận ngón mới**. Ngón thứ hai thật sự (`isPrimary = false`) vẫn bỏ qua. Cộng thêm hạ ngưỡng quẹt 430 → **360 px/s**. Đo lại: cả hai kịch bản đều chém được ở 667 px/s trở lên, hết đạn hay còn đạn đều như nhau |

| 61 | **Knockback đẩy theo vector đòn đánh, tức đẩy NGANG — và nó âm thầm xoá mối đe doạ.** Hành lang có ba làn, chỉ làn giữa gây damage. Một nhát chém ngang hất quái từ làn giữa sang làn bên, nghĩa là knockback đang làm một việc **quan trọng hơn nhiều so với vẻ ngoài của nó**, theo một cách người chơi không chủ định và cũng không đọc ra được | Quái **còn sống** bị đẩy **thẳng ra sau** dọc hành lang (`hitReaction.pushStraightBack`), kể cả cú giật (lurch). Knockback giờ chỉ làm đúng một việc: **mua thêm khoảng cách** — cũng là cả lý do tồn tại của shotgun. **Xác thì giữ nguyên** bay theo vector quẹt: nó không còn là mối đe doạ, và đó là money shot của game (`05` mục 6). Đo: chém ngang — con sống lùi **1.76m thẳng, 0m ngang**; xác bay `lx 2.2 / lz -1.1` |
| 62 | **Đạn dự trữ nhiều tới mức trụ P2 chưa bao giờ thật sự chạy.** Mô hình `reserveWavesTarget` = 7 ("đủ cho 7 wave") cho ra **21–22 băng phụ** mỗi khẩu — 217 viên cho súng lục, 569 cho rifle. Người chơi **không bao giờ chạm vào trần đạn** trong một phòng, mà "hết đạn" chính là thứ duy nhất buộc rút dao ra. Vòng khoá ĐẠN ↔ STAMINA tồn tại trên giấy chứ không bao giờ chạy | Đổi sang **`reserveMagsTarget` = 1.5 băng phụ** + `reserveMinShots` = 6 (sàn cho nỏ băng 1 viên). Gate audit cũng đổi theo: từ "đủ 6–9 wave" sang "**1.2–2.2 băng phụ**". Đo: rifle (băng 25 + 38 dự trữ) giữ tay bắn liên tục suốt phòng R1 → **hết sạch băng 3 lần**, kết thúc với **0 đạn dự trữ** |
| 63 | **`build_pages.ps1` chỉ ĐỌC `audit_report.md` chứ không CHẠY audit — nên dòng "audit: PASS x / FAIL y" mà build in ra có thể là kết quả của một lần chạy từ rất lâu trước.** Phát hiện khi `audit_report.md` còn nguyên mtime của 11 tiếng trước trong khi data đã đổi hàng chục lần. Trong suốt quãng đó build vẫn in "PASS 83 / FAIL 0" đều đặn, còn audit thật thì đang **FAIL 1** (nỏ băng 1 viên vi phạm hai gate về cỡ băng đạn). Đây là lỗi cùng họ với #38: **lưới an toàn hỏng mà vẫn báo xanh** | `build_pages.ps1` **chạy** `audit_gdd.ps1` trước khi đọc báo cáo. Và sửa hai gate cỡ băng đạn: khẩu nào có `reloadTime` **ngắn hơn** khoảng cách giữa 2 phát thì việc nạp không bao giờ chặn tay — với khẩu đó **băng đạn không phải đơn vị chơi**, nhịp bắn mới là, nên hai gate đó đo sai vật |

| 64 | **Cắt kho đạn 15 lần nhưng để nguyên tỉ giá Cướp Đạn — đạn lại thành vô hạn.** Lỗi #62 hạ `reserveMax` của rifle từ 569 xuống 38, còn tỉ giá cướp đạn vẫn là `0.3 giây bắn/mạng` (= 3 viên/mạng) vốn được tính cho kho 569. Kết quả: **13 mạng chém đầy nguyên kho đạn** — mà một phòng có 100–170 con. Sửa một đầu của cán cân mà quên đầu kia thì cán cân lật ngược lại y như cũ. Đo: rifle 13 mạng, SMG 11, súng lục 20, shotgun 30 | Neo tỉ giá vào **chính kho đạn gốc**: `viên/mạng = reserveMax GỐC × scavengeReserveFracPerKill` (0.008). Neo vào chính thứ nó nạp lại thì hai con số **không thể lệch nhau nữa** — đổi `reserveMagsTarget` bao nhiêu, tỉ giá tự động theo bấy nhiêu. Đo lại: **125 mạng chém mới đầy kho, ~80 mạng mới được một băng**, đồng đều cho mọi khẩu (trước: 11–30). Dùng kho GỐC nên thẻ Đạn Dự Trữ nâng trần chứa mà không nâng tốc độ hồi (chồng 4 thẻ: kho 38 → 797, tốc độ hồi đổi **0**). Chơi thật: hết phòng R1 còn 12/38, R2 còn 23/38 |
| 65 | **Sửa tỉ giá Cướp Đạn ba lần liên tiếp (#55, #62, #64) mà không lần nào chạm tới lỗi thật.** Neo vào `magMax` — thẻ ăn hai lần. Neo vào giây bắn — đúng nguyên tắc nhưng số tính cho kho cũ. Neo vào kho gốc — đúng số học, và người chơi **vẫn** không biết mình đang ở đâu. Ba lần đều đi tìm con số đúng cho một **bộ đếm vô hình**: người chơi không thấy nó, không nhắm được vào nó, không ra quyết định gì về nó. Một cơ chế mà cách duy nhất để cân là nhà thiết kế ngồi vặn hằng số thì bản thân nó là lỗi, không phải hằng số | **Bỏ hẳn Cướp Đạn, thay bằng Goblin Vàng** — một con quái nhìn thấy được, nhắm được, và giết được để lấy nguyên 1 băng. `dmg` 0 và **chỉ ở hai làn bên**, nên cái giá không phải máu mà là **đạn và giây**: bắn sang bên là không bắn vào làn giữa, và nó dạt ra rìa màn hình khi bạn chạy tới nên quyết định có hạn chót. Tần suất `chancePerWave` 0.5 nằm trong `waves.json`, chèn **ngoài ngân sách TP**. Tiện thể vá một lỗ hổng có sẵn: hai làn bên trước giờ chỉ có "giết lấy vàng thêm" — không đủ lý do để bắn sang. Đo: R1 1 con, R2 2 con, R3 0 (phòng nghỉ), cả 6 lần đều ở làn bên (x = ±2.2…2.7), giết 1 con → kho 3 → 28 viên. Xoá toàn bộ `scavenge*` khỏi `game.js`, `gamefeel.json`, talent, relic, tag vũ khí |

> **Lỗi #14 và #16 đã bị chính thiết kế vượt qua.** Khi chuyển sang **quái đứng yên**, bài toán đón đầu của
> `pincer` (#14) không còn ý nghĩa — không ai di chuyển để phải đón đầu, nên bộ giải đó **đã bị bỏ khỏi code**.
> Lane spring (#16) thì vẫn giữ, nhưng giờ nó chỉ chống separation làm lệch làn khi quái spawn chồng nhau,
> không còn phải chống lực đẩy dồn theo suốt đường đi. Ghi lại ở đây vì hai lỗi đó **là lỗi thật** ở thời điểm
> phát hiện, và vì nó cho thấy giá của việc đổi mô hình di chuyển: mọi thứ suy ra từ tốc độ quái đều phải tính lại.

Ngoài ra prototype xác nhận **công thức số quái phải tính theo `composition`**, không phải `tpCost` trung bình
toàn pool — lấy trung bình (có Ogre tp 8.0) cho ra con số sai gấp 3 lần. Đã ghi vào `16` mục 4.4.

### Kiểm chứng mô hình quãng đường (test tiền định, `ITG.run` bước dt cố định)

| Tình huống | Kết quả | Đúng docs? |
|---|---|---|
| Va vào người chơi | mất máu **1 lần**, con quái **biến mất**, **vàng +0** | ✓ `09` mục 2c |
| Vị trí quái trên màn hình ở `tapNearM` | **72.1%** (con nhỏ nhất, scale 0.74) | ✓ dải 45–75% |
| Quái ranged ở `rangedStandoffM` 8.5m | **48.7%** | ✓ |
| Quái có đứng yên thật không | dịch **0.000m** cả trục x và z sau 2s | ✓ `09` mục 2c |
| Tốc độ chạy | **4.2 m/s** | ✓ `speedMps` |
| Một phòng | **150m / 37.5s**, đủ 3 wave | ✓ (mô hình: 35.7s) |
| Hành lang | rộng **6.5m**: làn giữa **3.6m** (±1.8), hai làn bên **1.45m** | ✓ `09` mục 2c |
| Tỉ lệ làn giữa (5 run) | **68–77%**, trung bình 72% ở `midSpawnFrac` 0.72 → hạ về **0.66** | mục tiêu 60–70% |
| Quái mỗi phòng (R1) | **142–163** | — |
| Tự nhắm | tap **góc trên trái** (không trúng con nào) → vẫn bắn con làn giữa, **không** bắn con làn bên | ✓ `04` mục 2b |
| Chỉ còn quái làn bên | vẫn bắn được (giữ vàng thêm) | ✓ |
| Một đoạn quét giết trash | **48 dmg vs 40 HP** → chết ngay, dù melee DPS đã thấp hơn súng | ✓ sàn one-shot |
| Một nhát quét giết được | tối đa **6**, trung bình **2.1** | thấp hơn trước (7 / 2.65) — xem ghi chú dưới |
| Không bắn phát nào | mất **312–382 HP** trên 100 HP | phải dọn làn giữa, không có cách khác |
| Giữ ngón tay **đứng yên hoàn toàn** | vào bắn liên tục sau **132ms** (trước: không bao giờ) | ✓ `03` mục 2b |
| Giữ ~0.75s | bắn **3 phát** (rpm 254 → 4.2 phát/s) | ✓ tốc độ bắn đã giảm |
| Tap nhanh 60ms | **1 phát**, không vào chế độ giữ | ✓ |
| Quẹt nhanh | vào chế độ **chém**, không ra súng, **tốn 0 đạn** | ✓ hẹn giờ bị huỷ đúng |
| Súng bắn 1 viên vào trash | 120 dmg → trash 40 HP **chết ngay**, tốn 1 đạn | ✓ `rangedMinDmg` |
| Dao chém 1 nhát vào trash | 30 dmg → trash **còn 10 HP**, cần 2 nhát | ✓ luật one-shot đã bỏ |
| Nhịp bắn 1 giây giữ tay | rifle **3** · SMG **4** · shotgun **1** · nỏ **1** | ✓ dải archetype |
| Chọn súng ở màn hình đầu | 5 lựa chọn, đổi được archetype | ✓ `04` mục 5b |
| Shotgun bắn 1 phát vào 6 con | trúng **4 con**, 120 mỗi con | ✓ `04` mục 5c |
| Rifle bắn 1 phát vào 6 con | trúng **1 con** | ✓ |
| Nỏ bắn 1 phát vào 6 con | **xuyên 3 con** | ✓ |
| Màn hình đầu | dòng trạng thái nằm trong khung, cuộn được (697px trên viewport 682px) | ✓ |
| Nhịp bắn theo số liệu thật | SMG **700** · rifle **600** · pistol 150 · shotgun 55 · nỏ 51 | ✓ `04` mục 5d |
| Băng đạn theo cỡ thật | SMG **25** · rifle **25** · LMG **100** · shotgun 5 · nỏ 4 | ✓ |
| Bắn hết một băng | SMG **2.1s** · pistol 4.0s · shotgun 5.5s | ✓ cảm giác khác nhau |
| Shotgun 1 phát vào 8 con | **9 viên bay ra**, trúng **5 con**: 192/128/64/64/128 | ✓ đạn ghém tản theo góc |
| Nỏ 1 phát | 1 viên, **xuyên 3 con**, 824 mỗi con | ✓ |
| Viên đạn trong scene | 9 instance đang vẽ, tản ngang từ −0.14 đến +0.07 | ✓ `projectiles.js` |

### Kiểm chứng súng và chém liên tục

| Tình huống | Kết quả | Đúng yêu cầu? |
|---|---|---|
| Tap | rút súng (t=0.48, hiện) → bắn (mag 7→6) → hết `gunHoldSec` → cất + reload | ✓ |
| Đang reload, **còn đạn**, tap | **huỷ reload** và bắn ngay (mag 4→3) | ✓ |
| Đang reload, **hết sạch đạn**, tap | `gunUp()` trả về **false**, reload vẫn chạy, mag vẫn 0 | ✓ |
| Sau khi reload xong (100 frame) | bắn được, mag = 7 | ✓ |
| Chém liên tục: 12 đoạn quẹt **cùng 1 frame** | **1** lần ăn damage | ✓ `slideHitCooldownSec` chặn rung ngón tay |
| 8 đoạn cách 0.27s (> cooldown) | **8** lần | ✓ |
| 8 đoạn cách 0.05s (< cooldown) | **2** lần | ✓ |
| Giữ ngón tay 1 giây | stamina 100 → **66** | ✓ `slideStaminaPerSec` 34 |

### Kiểm chứng hai hành vi quái riêng (từ lượt trước, vẫn đúng)

| Tình huống | Kết quả |
|---|---|
| Bắn Khiên chính diện lúc giương khiên | 100 → **30** (×0.3) |
| Bắn đúng lúc hở khiên / axit / búa / chém nặng / sau lưng | 100 → **100** |
| Bắn bụng Ogre | 100 → **200** (×2.0) |

## 5. Số đo từ lần chạy tự động

Bot tự chơi (tap con xa nhất, quẹt khi có con trong 2.3m, reload khi hết đạn):

| Chỉ số | Kết quả | Ngưỡng ở `17` |
|---|---|---|
| Input bị huỷ | **0.0%** (178 gesture) | < 8% |
| fps | 59–62 | p95 frame < 18ms |
| Quái sống cùng lúc (đỉnh) | 16 ở R1 | 150+ ở phòng đông |
| Clear phòng 1 | 15 mạng, 100 HP, +1 Lộc | — |
| Vàng phòng 1 | **45** = 15 × 3 | khớp `goldPerKill` ở `16` |

> **0% input huỷ là của BOT, không phải của người.** Bot quẹt hoàn toàn ngang nên không bao giờ chạm vùng
> chết 55–65°. Con số này chỉ chứng minh máy trạng thái hoạt động đúng — **cổng go/no-go của Sprint 0 vẫn
> phải đo trên 10 người thật.**

## 6. Deploy

Static, không có bước build. Deploy được thẳng lên Vercel:

```bash
powershell -ExecutionPolicy Bypass -File .\deploy_vercel.ps1 -Token "<vercel-token>"
```

Script dùng Vercel REST API + `curl` (máy dev không có Node nên không cài được `vercel` CLI).
Thêm `-Prod` để deploy production. `-DryRun` để xem trước danh sách file.

three.js nạp từ CDN qua importmap (`jsdelivr`, phiên bản ghim `0.169.0`). Nếu cần offline hoàn toàn thì
tải `three.module.js` vào `prototype/vendor/` rồi sửa importmap trong `index.html`.

## 7. Việc tiếp theo cho prototype

1. **Đo trên người thật** — 10 người, mỗi người 2 phút, ghi tỉ lệ input huỷ. Đây là cổng Sprint 0.
2. Thả 150 con trong một phòng để đo frame thật trên điện thoại tầm trung (rủi ro R2).
3. Thêm 1 boss (Goblin Vương Béo) để kiểm tra cửa sổ bắt buộc dùng dao.
4. Cài hành vi cho nhóm Depth 4+: Dơi Hầm (bay, trục dọc), Goblin Đào Hầm (trồi lên sau lưng),
   Đầu Bò Đá (charge rồi đâm tường choáng 2s) — ba con này dạy ba trục không gian khác nhau.
5. UI shop để tự chọn mua thay vì tự động.
