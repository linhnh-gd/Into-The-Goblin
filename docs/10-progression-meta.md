# 10 — Progression: trong run & meta

Ba trục tách biệt, không được trộn lẫn:

| Trục | Sống bao lâu | Nguồn | Cảm giác |
|---|---|---|---|
| **Thẻ Nâng Cấp** (card) | 1 run | Cổng, Elite, Miếu | "Run này tao build gì?" |
| **Bảo Vật** (relic) | 1 run, mạnh hơn card | Boss, Cửa Khoá, shop đắt | "Run này tao có đồ khủng" |
| **Meta** | Vĩnh viễn | Vàng, Mảnh Cốt, Weapon XP, Phôi Rèn | "Tao đang tiến bộ mỗi ngày" |

---

## 1. Thẻ Nâng Cấp (in-run cards) — engine replayability

**Chọn 1 trong 3 ở mỗi Cổng.** 48 thẻ = **12 chỉ số × 4 bậc**. Mỗi thẻ là **một con số cộng vào
một chỉ số** — không điều kiện, không đánh đổi, không cơ chế riêng.

| Chỉ số | Tag | Bậc I → IV |
|---|---|---|
| Sát Thương | `ranged` | +15% → +26% → +39% → **+57%** sát thương mọi vũ khí |
| Băng Đạn | `ammo` | +25% → +42% → +65% → **+95%** số đạn một băng |
| Nạp Nhanh | `ammo` | −12% → −20% → −31% → **−46%** thời gian nạp |
| Nhịp Bắn | `ranged` | +10% → +17% → +26% → **+38%** tốc độ bắn |
| Chí Mạng | `crit` | +6% → +10% → +16% → **+23%** tỉ lệ chí mạng |
| Đạn Dự Trữ | `ammo` | +30% → +51% → +78% → **+114%** |
| Vàng | `gold` | +20% → +34% → +52% → **+76%** vàng nhặt được |
| Hút Vàng | `gold` | +35% → +59% → +91% → **+133%** bán kính |
| Hồi Sức | `stamina` | +5 → +9 → +13 → **+19** stamina/giây |
| Sức Bền | `stamina` | +25 → +43 → +65 → **+95** stamina tối đa |
| Máu | `survival` | +25 → +43 → +65 → **+95** HP tối đa |
| Sức Đẩy | `knockback` | +25% → +43% → +65% → **+95%** lực đẩy lùi |

### Luật thiết kế thẻ

1. **Không thẻ nào có logic.** Không điều kiện ("khi HP < 30%"), không đánh đổi ("nhưng −15% HP"),
   không cơ chế riêng ("chém trúng thì phát bắn sau +60%"). Lý do: người chơi đọc thẻ ngay sau khi
   vừa chạy hết 50m và đang thở — ba thẻ có điều kiện là **ba bài toán** đặt vào đúng lúc họ ít khả
   năng giải nhất. Chỗ dành cho cơ chế là **Bảo Vật** (mục 2) và **Talent** (mục 4), nơi người chơi
   ngồi đọc ngoài trận.
2. **Bậc thẻ chỉ đổi CON SỐ, không đổi công dụng.** "Sát Thương I" và "Sát Thương IV" cùng làm một
   việc, chỉ khác 15% với 57%. Không phải học lại gì khi lên bậc.
3. **Cùng chỉ số thì cộng dồn**, tối đa `maxStackPerStat` = 8 lần. Nhân kiểu `mult` cộng dồn theo
   tích `(1+step)`, `add` cộng thẳng. Ở Cổng không bao giờ bày 2 thẻ cùng chỉ số.
4. **Rarity theo Lộc** (xem `08`): chơi giỏi (Elite, không mất máu, Chém Hoàn Hảo) là cách duy nhất
   thấy thẻ bậc IV sớm. Đây là chỗ duy nhất còn "quyết định" trong hệ thẻ — và nó nằm ở **cách chơi**,
   không nằm ở việc đọc thẻ.
5. Có thể **đổi 3 thẻ** (reroll): 1 lần miễn phí / Depth, sau đó 80 vàng hoặc xem 1 ad.

> **Cái đã bỏ:** bộ 50 thẻ cũ có drawback, có điều kiện, và có **combo ẩn** (3 thẻ cùng tag mở một
> thẻ Legendary có cơ chế riêng). Combo ẩn là ý tưởng tốt cho một game người chơi ngồi đọc; nó sai
> chỗ trong một game người chơi đang chạy 4.2 m/s giữa 40 con goblin.

Dữ liệu: `data/upgrades.json` → `gen-upgrades.md`.

## 2. Bảo Vật (relic)

12 relic, mỗi run mang tối đa 3. Mạnh, đổi luật chơi:

| Relic | Hiệu ứng |
|---|---|
| **Túi Vàng Đáy Kép** | Vàng thu được x1.5, nhưng bị trúng đòn thì rơi 10% vàng đang giữ ra sàn — phải hút lại |
| **Đồng Hồ Cát Nứt** | Thời gian chậm 40% khi HP < 25%, 3s, hồi mỗi phòng |
| **Găng Thợ Rèn** | Nạp đạn nhanh hơn 35%, và viên đầu mỗi băng +30% damage |
| **Túi Đáy Rộng** | Đạn dự trữ +150%, nhưng Goblin Vàng không xuất hiện nữa |
| **Lưỡi Ma** | Chém Hoàn Hảo hồi 8 HP |
| **Mặt Nạ Tham** | Vàng x1.6, nhưng HP tối đa −20% |
| ... | 6 relic còn lại trong `data/upgrades.json` (`kind: relic`) |

## 3. Meta 1 — Vũ khí (lấy từ Into the Dead 2)

```
   Mỗi kill bằng vũ khí X  -->  Weapon XP cho X (chỉ X)
        |
        v
   Đủ XP  -->  mở khả năng nâng level  -->  tiêu VÀNG để nâng
        |
        v
   Level 10 / 20 / 30  -->  cần PHÔI RÈN để lên Tier (T1..T6)
```

| | |
|---|---|
| Level | 1–40 mỗi vũ khí. Mỗi level +2.5% damage (nhân dồn) |
| Tier | T1–T6. Lên tier: +45% damage nền, mở 1 slot khắc (mod) |
| Slot khắc | T3+: 1 slot · T5+: 2 slot. Khắc = mod nhỏ (+kb, +mag, +stamina hoàn) |
| Loadout | **1 tầm xa + 1 cận chiến** (portrait, không đổi trong combat) |
| Vũ khí trùng | Đổi thành **Mảnh Cốt** (chống lỗi "không có đường chuyển đổi" của Archero) |

**Vì sao XP theo từng vũ khí là cơ chế hay:** nó tạo *sự gắn bó*. Người chơi có "khẩu của tao". Và nó tạo
một lý do rất mạnh để chơi thêm run: *"còn 400 XP nữa là nâng được"*.

## 4. Meta 2 — Talent (Cây Thợ Hầm)

24 talent, 4 nhánh. Tiêu **Vàng** ở bậc thấp, **Mảnh Cốt** ở bậc cao.

| Nhánh | Chủ đề | Ví dụ |
|---|---|---|
| **Nòng** (ranged) | Đạn, mag, reload | +reserve, viên đầu mỗi băng mạnh hơn |
| **Lưỡi** (melee) | Stamina, arc, combo | Chém Hoàn Hảo cần 2 con thay vì 3 |
| **Da** (survival) | HP, giáp, revive | +HP, giảm damage khi < 30% HP |
| **Đèn** (`den`) | Kinh tế, Lộc và tầm nhìn | Bắt đầu run với +2..+10 Lộc; biển báo ở Ngã Ba hiện thêm thông tin |

**Chống lỗi Archero (talent linear vs độ khó dốc):** chi phí talent scale theo **% power delta thực tế**,
không theo bậc:

```
cost(bậc n) = baseCost * (deltaPower_n / deltaPower_1) ^ 1.15
```

Nghĩa là: talent cho +2% ở late-game **rẻ tương ứng**, và mọi talent phải cho ít nhất **+2% power thực**
— không có talent rác. Audit gate kiểm tra điều này.

Dữ liệu: `data/talents.json` → `gen-talents.md`.

## 5. Meta 3 — Trại Mỏ (Trại Cổng Hầm)

Lấy từ Guns 'n Goblins (mỗi run cho meta upgrade + nhân vật cải tạo Trại Mỏ). Đây là **nơi tiêu vàng dài
hạn** và **lý do mở app buổi sáng**.

| Building | Chức năng | Idle |
|---|---|---|
| **Lò Rèn** | Mở tier vũ khí, khắc mod | — |
| **Quán Trọ** | +HP khởi đầu, mở slot relic thứ 3 | — |
| **Giếng Sâu** | Level 5 mở Endless; mỗi level cho quyền bắt đầu run ở 1 Depth sâu hơn đã clear | — |
| **Kho Đạn** | +đạn dự trữ khởi đầu | +đạn/giờ |
| **Hầm Vàng** | +% vàng mọi run | **Sinh vàng khi offline** (cap 8 giờ) |
| **Chuồng Chó** | Thú đồng hành: tự chém quái sau lưng | — |
| **Bàn Thẻ** | Loại bỏ 3 thẻ không thích khỏi pool (bỏ rác) | — |
| **Nhà Thợ Săn** | Contract hàng ngày (kill X con Y) | daily |
| ... | 12 building trong `data/bastion.json` | |

**Idle gold có cap 8 giờ** — đủ để "sáng mở app có quà", không đủ để bỏ chơi 3 ngày rồi giàu.

## 6. Depth & Elite Depth (cấu trúc nội dung)

| | |
|---|---|
| Depth 1–7 | 10 phòng mỗi Depth, boss cuối. Mở tuần tự |
| Challenge | Mỗi Depth có **5 challenge** (kiểu Into the Dead 2): "clear không dùng súng", "clear ở `G ≥ 5`", "clear không mất máu", "Chém Hoàn Hảo 20 lần", "clear dưới 4 phút" |
| Elite Depth | Mở khi hoàn thành đủ 5 challenge của Depth đó. Quái level +6, drop tier cao hơn |
| **Endless** | Sau Depth 7. Phòng vô hạn, `R` tăng mãi. **Leaderboard: số phòng đạt được × (1 + Lộc/20)** |
| Daily Hầm | 1 seed / ngày cho toàn server, cùng loadout ép sẵn → so sánh thuần kỹ năng |

## 7. Ràng buộc (audit)

1. Mọi thẻ/relic/talent phải có `id` duy nhất và `tags` không rỗng.
2. Mọi thẻ có `powerDelta ≥ 2%` (không thẻ rác) — trừ thẻ có `drawback` (thẻ đánh đổi).
3. Mọi vũ khí trong `loadoutUnlocks` của `depths.json` phải tồn tại trong `weapons.json`.
4. Mọi combo ẩn (`comboUnlock`) phải trỏ tới thẻ tồn tại.
5. `cost` của talent tăng đơn điệu theo bậc; `powerDelta` không được giảm quá 50% giữa hai bậc liền kề.
