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
| Tap bắn · Hold bắn liên tục · Quẹt ngang chém (nhẹ/nặng theo độ dài) · Quẹt dọc né/xốc | **Có**, đúng ngưỡng ở `controls.json` |
| Vùng chết 55–65° + bộ đếm input huỷ | **Có** — hiện trên overlay "Hiện đo input" |
| Chế độ Hai Vùng (fallback rủi ro R1) | **Có**, bật ở màn hình đầu |
| Băng đạn / dự trữ / reload / **Nạp Hoàn Hảo** (cửa sổ ngẫu nhiên có seed) | **Có** |
| Stamina + ngưỡng 50% giảm 50% tốc độ chém | **Có** |
| **Cướp Đạn**: 6 mạng chém = 1 băng đạn | **Có** |
| Chém Hoàn Hảo (≥3 con/nhát) + combo 5 bậc | **Có** |
| Knockback + xác bay **theo đúng vector quẹt** + domino | **Có** |
| Wave director theo `TP_budget(R,w)` + `countPerTP` | **Có** |
| Sương Đen (35s / 28s từ phòng 8) + Bóng Hầm không giết được | **Có** |
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

Đây là phần quan trọng nhất của doc này: **prototype tìm ra 8 lỗi mà đọc doc không thấy.**

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

Ngoài ra prototype xác nhận **công thức số quái phải tính theo `composition`**, không phải `tpCost` trung bình
toàn pool — lấy trung bình (có Ogre tp 8.0) cho ra con số sai gấp 3 lần. Đã ghi vào `16` mục 4.4.

### Kiểm chứng hai hành vi mới (test tiền định, `ITG.run` bước dt cố định)

| Tình huống | Kết quả | Đúng docs? |
|---|---|---|
| Bắn Khiên từ chính diện, khiên giương | 100 → **30** damage (×0.3), số hiện màu xám | ✓ `09` |
| Bắn đúng lúc **hở khiên** | 100 → **100** | ✓ |
| Bắn bằng **axit** (bypass) | 100 → **100** | ✓ |
| Bắn **từ sau lưng** (face quay ngược) | 100 → **100** + cờ `flanked` | ✓ |
| **Chém nặng** / **búa** | 100 → **100**, và kbResist rơi 0.55 → 0.05 | ✓ |
| Bắn Ogre vào thân | 100 → **100** | ✓ |
| Bắn Ogre vào **bụng** (tap nửa dưới) | 100 → **200** (×2.0) | ✓ |
| Ogre đập, **không né** | mất 67.5 HP, vòng đỏ đã hiện trước 0.6s | ✓ |
| Ogre đập, **Bước Lùi giữa telegraph** (2.4m → 3.6m) | **0 HP**, banner "NÉ ĐƯỢC" | ✓ |

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
