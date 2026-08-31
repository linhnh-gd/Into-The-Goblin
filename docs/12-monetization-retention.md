# 12 — Monetization & Retention

Nguyên tắc: **không bán sức mạnh chiến đấu trực tiếp**. Bán *thời gian*, *tiện lợi*, *cosmetic*, và
*battle pass*. Lý do: hai hệ quyết định của game (Ngã Ba Hầm và Lộc) đều dựa trên kỹ năng — bán power
là xoá luôn cái để người chơi giỏi lên, và cảm xúc cốt lõi biến mất. **Đặc biệt: không bán Lộc.**

---

## 1. Rewarded Ads (nguồn doanh thu chính giai đoạn đầu)

| Vị trí | Thưởng | Cap | Lý do đặt ở đây |
|---|---|---|---|
| **Hồi sinh tại chỗ** | Sống lại 50% HP, giữ Lộc, giữ vàng | **1 lần / run** | Đúng lúc đau nhất |
| **x2 vàng cuối run** | x2 số vàng vừa kiếm | 1 / run | Cổ điển, tỉ lệ xem cao nhất |
| **Reroll thẻ ở Cổng** | Đổi 3 thẻ | 2 / run | Ngay tại điểm quyết định |
| **Thêm 1 bình Dầu Đèn** | +1 bình | 2 / ngày | |
| **Mở cửa thứ 3 ở Ngã Ba** | Thêm 1 lựa chọn ở Cổng | 2 / run | Ngay tại điểm quyết định |
| **Nhân idle Hầm Vàng** | x2 vàng offline | 1 / lần thu | |
| **Hòm thợ săn** | Phôi rèn / mảnh | 3 / ngày | |

Mục tiêu: **4.5–6 ad / DAU**, eCPM rewarded target $12–22 (tier 1).
Không có interstitial ép giữa run ở v1 (kill nhịp game). Có thể test interstitial **sau khi thoát ra menu**.

## 2. IAP

| SKU | Giá | Nội dung |
|---|---|---|
| **Bỏ quảng cáo bắt buộc + x1.2 vàng** | $4.99 | Vẫn xem được rewarded ad tự nguyện |
| **Sổ Thợ Hầm** (battle pass, 28 ngày) | $9.99 | 60 bậc: skin, ngọc, phôi rèn, mảnh, 1 vũ khí Tier 4 độc quyền (không mạnh hơn, khác cách chơi) |
| **Starter Pack** (chỉ hiện sau khi clear Depth 2, 1 lần) | $2.99 | Vũ khí T2 + 5,000 vàng + 3 vé |
| **Ngọc** | $0.99 – $99.99 | 6 bậc |
| **Gói Depth** | $6.99 | Mở nhanh 1 Depth (vẫn phải chơi để clear) |
| **Skin vũ khí / Skin đèn** | $1.99 – $7.99 | Cosmetic, có cả skin đổi **màu VFX vàng** (bán rất tốt trong game nhiều juice) |

## 3. Retention: kế hoạch theo ngày

| Ngày | Nội dung được thiết kế cho ngày đó |
|---|---|
| D0 | Onboarding 15s (xem `03` mục 6) → clear Depth 1 → mở Trại Mỏ → thấy Ngã Ba Hầm lần đầu |
| D1 | Mở Talent, mở Daily Hầm, quest "clear 1 Depth với Lộc >= 8" |
| D2–D3 | Mở Depth 2–3, mở Elite Depth đầu tiên, mở relic slot 2 |
| D4–D7 | Sổ Thợ Hầm, Contract thợ săn, Hầm Vàng idle, mở talent Lộc Sẵn |
| D7–D14 | Depth 5–6, weapon Tier 3, leaderboard Endless tuần |
| D14–D30 | Depth 7 + MẸ MỎ, Elite Depth 4–7, event Hầm theo mùa |
| D30+ | Endless leaderboard, challenge 5/5 mọi Depth, weapon Tier 5–6 |

## 4. Live content (chống lỗi "grind cùng một dungeon" mà DoF phê Archero)

| Cadence | Nội dung |
|---|---|
| Hàng ngày | Daily Hầm (1 seed toàn server, loadout ép sẵn → thi kỹ năng thuần), 3 Contract |
| Hàng tuần | Boss Tuần (boss cũ + 3 affix mới), leaderboard Endless reset |
| 2 tuần | Event Hầm chủ đề: đổi luật (vd: "Hầm Không Súng" — chỉ cận chiến; "Hầm Sập" — Sương Đen tới sau 15s ở mọi phòng) |
| Theo mùa (8 tuần) | Sổ Thợ Hầm mới, 1 Depth event, 2 vũ khí mới, 1 boss mới |

**Event đổi luật là nội dung rẻ nhất và hiệu quả nhất** cho game này: cùng asset, khác hoàn toàn trải nghiệm,
vì hệ thống đã có wave director theo TP, có Lộc, có card pool, có tag cửa — chỉ cần đổi tham số.

## 5. KPI & mốc kiểm tra

| KPI | Target soft launch | Target global |
|---|---|---|
| D1 | 40% | 45% |
| D7 | 14% | 18% |
| D30 | 5% | 7% |
| Session/day | 3.0 | 3.5–5 |
| Session length | 9 phút | 11 phút |
| Ad/DAU | 3.5 | 4.5–6 |
| IAP conversion | 1.6% | 2.5% |
| ARPDAU | $0.11 | $0.22 |
| Tỉ lệ người chơi chọn cửa "đông"/"tối" (thay vì cửa an toàn) | — | **35–65%** — dưới 35% là biển báo làm người chơi sợ, trên 65% là cửa an toàn vô nghĩa |
| Lộc trung vị khi kết run | — | 8–14 (dưới 6 là Lộc quá khó kiếm; trên 16 là quá dễ) |

## 6. Nguyên tắc đạo đức / store compliance

- Không loot box trả tiền mù (chỉ hòm kiếm trong game, và luôn hiện tỉ lệ).
- Không "pay to skip difficulty" — không bán buff giảm độ khó.
- Không có cơ chế cược vàng nào, tránh bị xếp vào gambling. `Cân Vàng` là đổi giá cố định, không có yếu tố may.
- Hiển thị rõ tỉ lệ drop cho mọi hòm (yêu cầu của một số thị trường).
- Không quảng cáo gây hiểu sai: creative phải là gameplay thật (Chém Hoàn Hảo là cảnh có thật trong game).
