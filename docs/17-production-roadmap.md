# 17 — Production Roadmap, Playtest & Risk

## 1. Câu hỏi phải trả lời TRƯỚC khi làm gì khác

Toàn bộ game này đứng trên **một** giả thuyết chưa được chứng minh:

> **Người chơi có phân biệt được "tap để bắn" và "quẹt để chém" trên cùng một vùng màn hình hay không?**

Nếu **không** → không có game (hoặc phải chuyển sang Chế độ Hai Vùng và thiết kế lại UX).
Nếu **có** → mọi thứ còn lại chỉ là công việc.

→ **Sprint 0 tồn tại chỉ để trả lời câu này.** Không làm meta, không làm art, không làm economy.

## 2. Lộ trình

### Sprint 0 — Gesture Spike (3–5 ngày)

| Việc | Xong là gì |
|---|---|
| 1 hành lang xám, 1 loại goblin, 1 súng, 1 dao | Build chạy trên điện thoại thật |
| Cài đúng máy trạng thái ở `03` mục 2 | Có log tỉ lệ input: `tap / hold / slide / bị huỷ` |
| Test 10 người chưa biết game | |

**Cổng đi tiếp (go/no-go):** tỉ lệ input bị nhận sai **< 8%** sau 2 phút chơi, và ≥ 7/10 người tự nói
được "tap là bắn, quẹt là chém" mà không cần giải thích lại.

### Sprint 1–2 — Vertical Slice (3 tuần)

- 1 Depth (10 phòng), 6 loại quái, 1 boss, 3 súng, 3 dao.
- Wave director theo TP, wave delay 1.5–2.0s, Sương Đen.
- **Ngã Ba Hầm đầy đủ** (2 cửa, biển báo, 4 ràng buộc ẩn) + hệ **Lộc**.
- Vòng khoá Đạn ↔ Stamina (Goblin Vàng là nguồn đạn duy nhất giữa trận) + Nạp Hoàn Hảo + Chém Hoàn Hảo.
- Juice: hitstop, shake, gold burst, coin chime ladder, xác bay theo slide.
- Chưa cần: meta, Trại Mỏ, IAP, art cuối.

**Cổng:** 20 người chơi, mỗi người ≥ 3 run. Đo:
`% chọn cửa "đông"/"tối" trong khoảng 35–65%` · `độ dài phòng trung vị 18–30s` · `đạt 60 quái/wave ở Depth 1` · `“muốn chơi lại” ≥ 70%`.

### Sprint 3–5 — Playable Core (5 tuần)

- 3 Depth, 12 quái, 3 boss, 10 súng, 6 dao, 30 thẻ.
- Meta: Weapon XP + level, 12 talent, Lò Rèn.
- Onboarding 15 giây, màn hình kết run, hồi sinh bằng ad.
- Tối ưu: 150 quái @ 60fps trên máy mốc.

### Sprint 6–8 — Content & Meta (6 tuần)

- 7 Depth, 24 quái, 7 boss, 30 vũ khí, 48 thẻ, 12 relic, 24 talent, 12 building Trại Mỏ.
- Endless + leaderboard, Daily Hầm, challenge 5/Depth, Elite Depth.
- Sổ Thợ Hầm, IAP, analytics đầy đủ.

### Sprint 9–10 — Soft Launch (4 tuần)

- Soft launch: PH, VN, ID, BR. Đo KPI ở `12` mục 5.
- A/B: hệ số `doorTagMult` của cửa "đông"/"tối" (1.15 / 1.25 / 1.40) — **test quan trọng nhất của cả dự án**: nó quyết định người chơi có dám vào cửa khó hay không.
- A/B: tốc độ kiếm Lộc (Elite +2 vs +3) và giá đổi ở Miếu Mỏ (4 vs 3 Lộc).
- A/B: Chế độ Hai Vùng bật mặc định cho người mới hay không.

### Global Launch — tuần 24

## 3. Bảng đo playtest (mỗi vòng test đều đo)

| Chỉ số | Ngưỡng khoẻ | Nếu lệch thì sửa gì |
|---|---|---|
| Tỉ lệ input nhận sai | < 8% | `slideVelocityThreshold`, dead zone |
| Độ dài phòng (trung vị) | 18–30 s | TP budget, Sương Đen timer |
| % chọn cửa "đông"/"tối" | 35–65% | `doorTagMult`, chữ trên biển báo, mức HP khi tới Cổng |
| Lộc trung vị lúc kết run | 8–14 | tốc độ kiếm Lộc, giá đổi ở Miếu Mỏ |
| Số quái tối đa thấy được trong 1 wave | >= 60 trước Depth 2 | `tpMult` của wave flood, `tpCost` của trash |
| Tỉ lệ thời gian dùng melee | 25–45% | `directorRules.golden.chancePerWave`, `reserveMax` |
| Số lần Chém Hoàn Hảo / run | 8–20 | `arcDeg`, `targets`, mật độ spawn |
| Tỉ lệ Nạp Hoàn Hảo thành công | 45–70% | độ rộng cửa sổ |
| Run kết thúc vì chết (không phải quit) | > 80% | nếu quit nhiều → nhàm hoặc quá dài |
| Độ dài run | 4–6 phút | số phòng / Depth |
| Frame time p95 | < 18 ms | cap crowd agent, hạt |

## 4. Sổ rủi ro

| # | Rủi ro | Mức | Dấu hiệu sớm | Phương án |
|---|---|---|---|---|
| R1 | **Gesture tap/slide lẫn nhau** | **Cao / Chí tử** | Tỉ lệ nhận sai > 12% ở Sprint 0 | Chế độ Hai Vùng làm mặc định; hoặc melee thành nút |
| R2 | 150 quái tụt frame trên máy tầm trung | Cao | p95 frame > 22ms | Crowd agent billboard, GPU instancing, cap động theo nhiệt máy |
| R3 | Không ai dám chọn cửa khó (cửa "đông"/"tối" bị bỏ qua) | Trung bình | % chọn < 25% | Tăng `doorTagMult`, viết lại chữ trên biển, cho xem trước số quái |
| R4 | Ngã Ba thành lựa chọn giả (luôn có 1 cửa hiển nhiên tốt hơn) | **Cao** | Tester chọn cùng 1 loại cửa > 80% | Cân lại giá trị tag; bắt buộc 2 cửa khác trục (vàng vs máu vs thẻ) |
| R5 | Melee vô dụng (một băng dọn hết wave) | Trung bình | % thời gian melee < 15% | Siết `mag`, siết `reserveMax`, tăng HP trash — audit đã có gate |
| R6 | Ngón tay che quái | Trung bình | Người chơi chết mà không biết vì sao | Camera chúi 8°, dời dải Cận chiến lên 45–75% màn hình |
| R7 | Juice quá tay, không đọc được | Trung bình | Chết oan nhiều, complaint "game rung quá" | Cap tổng biên độ rung, tắt hàm mũ |
| R8 | Nội dung hết nhanh (grind lặp) | Trung bình | D14 tụt | Event đổi luật 2 tuần/lần (rẻ vì đã có TP director + Lộc + tag cửa) |
| R9 | Mật độ 150 quái không đọc được trên màn hình 6 inch | **Cao** | Tester chết mà không biết vì sao ở phòng đông | Luật readability ở `06` mục 4; giảm cap crowd; tăng tương phản silhouette |
| R10 | Thị trường FPS mobile đông | Cao | CPI cao | Định vị khác: **portrait, một tay, 5 phút** — không cạnh tranh trực tiếp CoD Mobile |

## 5. Team tối thiểu

| Vai trò | Số người | Ghi chú |
|---|---|---|
| Gameplay programmer | 2 | 1 người chuyên input/feel |
| Tech artist / VFX | 1 | juice là sản phẩm, không phải trang trí |
| 3D artist | 2 | 1 quái, 1 môi trường/vũ khí |
| Game designer | 1 | giữ `data/*.json` |
| UI/UX | 1 | portrait, thumb zone |
| Audio | 0.5 (outsource) | coin chime ladder phải làm kỹ |
| QA | 1 | |
| Product/analytics | 0.5 | |

## 6. Cột mốc quyết định (kill switch)

| Mốc | Nếu không đạt |
|---|---|
| Sprint 0 | Đổi sang Chế độ Hai Vùng làm thiết kế chính, viết lại `03` và `14` |
| Vertical Slice | Nếu "muốn chơi lại" < 50% → dừng, xem lại vòng khoá Đạn ↔ Stamina (P2) trước khi xem lại bất cứ thứ gì khác |
| Soft launch D1 < 32% | Dừng scale UA, quay lại onboarding |
| Soft launch ARPDAU < $0.06 | Xem lại `12`, không launch global |

## 7. Việc tiếp theo ngay (actionable)

1. Chốt `03-controls-gestures.md` với programmer — đây là spec duy nhất cần code chính xác từng con số.
2. Dựng Sprint 0 spike (không cần art, hộp xám là đủ).
3. Chạy `.\normalize_balance.ps1` rồi `.\audit_gdd.ps1` sau mỗi lần sửa `data/*.json`.
4. Làm prototype web playable từ chính `data/*.json` này để test nhịp trước khi vào Unity.
