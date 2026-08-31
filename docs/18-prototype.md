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
| **Cướp Đạn**: 6 mạng chém = 1 băng đạn | **Có** |
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

Đây là phần quan trọng nhất của doc này: **prototype tìm ra 17 lỗi mà đọc doc không thấy.**

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
| Một phòng | **150m / 37.4s**, đủ 3 wave | ✓ (mô hình: 35.7s) |
| Ngưỡng làn: quái ở x ≤ 1.9m | mất **6 HP** (làn giữa) | ✓ đúng `midHalfWidthM` = 2.0 |
| Ngưỡng làn: quái ở x ≥ 2.1m | **0 HP** (làn bên) | ✓ |
| Phân bố thực tế trong một phòng | 56 con: **32 làn giữa / 24 làn bên** (57%) | ✓ `midSpawnFrac` 0.45 |
| Một phòng, **không bắn phát nào** | mất **164 HP** | bỏ qua hết làn giữa = chết |
| Quái cùng lúc trên sàn (đỉnh) | **14** | quái đứng chờ, không dồn cục |

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
