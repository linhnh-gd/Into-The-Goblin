# 05 — Combat: Vũ khí cận chiến

Nguồn từ docs: *tiêu stamina để tấn công, stamina hồi dần theo thời gian* · *thanh stamina hiện khi tấn
công, ngừng 2s thì mờ dần* · ***stamina dưới 50% thì giảm 50% melee attack speed*** · *Slide ngón tay,
enemy trong tầm và trúng slide thì get hit* · *knockback* · ***xác kẻ địch văng theo chiều slide***.

---

## 1. Stamina

| Tham số | Giá trị | Ghi chú |
|---|---|---|
| Tối đa | 100 (+ talent/card) | |
| Hồi | **18 / giây**, bắt đầu sau **0.6s** kể từ nhát cuối | Đảm bảo luôn có 1 nhát nhẹ sau ~1.4s dù cạn sạch |
| Ngưỡng kiệt sức | **< 50%** → **tốc độ chém x0.5** (docs) | Không chặn hẳn — vẫn chém được, chỉ chậm |
| Hiển thị | Hiện khi tấn công; **ngừng cận chiến 2s → fade dần trong 0.5s** (docs) | Không chiếm chỗ HUD khi đang bắn |
| Màu | > 50% vàng · < 50% đỏ + nhấp nháy nhẹ + tiếng thở gấp | Dạy ngưỡng 50% không cần chữ |

**Vì sao ngưỡng 50% là thiết kế tốt:** nó tạo ra một "vách" mà người chơi cảm nhận được trong ngón tay
(nhát chém đột nhiên nặng nề) chứ không phải một con số. Người chơi giỏi sẽ **chém 3 nhát rồi lùi 1 nhịp**
để giữ trên 50% — đây là nhịp (rhythm) chứ không phải spam.

## 2. Chi phí stamina theo đòn

| Đòn | Điều kiện gesture | Stamina | Damage | Knockback | Số mục tiêu |
|---|---|---|---|---|---|
| **Chém nhẹ** | slide `0.12S–0.55S`, góc ≤55° | `staminaCost` (12–34 tuỳ vũ khí) | x1.0 | x1.0 | theo `targets` |
| **Chém nặng** | slide `> 0.55S` | **x2** | **x2.0** | **x2.2** | `targets + 2`, arc +30° |
| **Chém khi kiệt** | stamina < 50% | như trên | như trên | như trên | **tốc độ x0.5** |
| **Chém phản** | slide trong 0.25s sau khi quái vung tay | x0.75 | x1.4 | x1.6 | +0.15s bất tử |

Không có "combo bấm nút". Chiều sâu đến từ **độ dài và hướng của ngón tay** — một gesture, nhiều sắc thái.

## 3. Chém Hoàn Hảo (Perfect Slash)

**Điều kiện:** một nhát slide trúng **≥ 3 kẻ địch**.

| Thưởng | Giá trị |
|---|---|
| Stamina | **+12** (hoàn lại phần lớn chi phí → chém giỏi là tự nuôi được) |
| Chuỗi chém | **+1 bậc** thay vì +1 hit (chỉ để tới mốc hút vàng) |
| Cướp Đạn | **tính x2** (mỗi mạng = 2 điểm) |
| Feel | slow-mo 0.12s @ 0.35x, flash trắng 1 frame, tiếng "shiiing" cao vút, chữ **CHÉM HOÀN HẢO** bay lên |

Đây là **money shot** của game — cảnh dùng cho video quảng cáo (UA creative): một nhát quẹt, 5 goblin đứt
đôi, xác bay theo hướng ngón tay, vàng nổ đầy màn hình.

## 4. Chuỗi chém — KHÔNG còn nhân sát thương

> **Đã bỏ bonus sát thương của cận chiến.** Bảng cũ cho chuỗi chém nhân damage tới **x1.80**.
> Nó mâu thuẫn trực tiếp với chính quyết định ở mục 7d: dao **phải yếu hơn súng**
> (`meleeAdvantage` = 0.307), vì đối mặt thật của game là **đạn**, không phải DPS. Một cái nhân
> x1.8 ẩn ở chuỗi chém xoá gần hết khoảng cách đó chỉ sau 4 nhát — mà 4 nhát thì trong đám
> đông là chuyện 2 giây. Kết quả: người chơi giỏi cận chiến gần như không cần bắn nữa, và cả
> vòng khoá ĐẠN ↔ STAMINA (trụ P2) mất lý do tồn tại.

Sát thương một nhát giờ là **phẳng**: `dmg vũ khí × thẻ nâng cấp` (chém nặng vẫn x2 — đó là
cơ chế, không phải bonus tích luỹ). Chuỗi chém vẫn được đếm, nhưng chỉ còn hai tác dụng:

| Bậc | Điều kiện | Được gì |
|---|---|---|
| 0–4 | mỗi nhát trúng lên 1 bậc | Chỉ hiển thị + âm thanh lên tông |
| 5+ | | **Hút vàng bán kính x2** — phần thưởng duy nhất còn lại |

Reset khi: quẹt trượt (không trúng ai), hoặc **1.2s không có nhát trúng nào**, hoặc bị trúng đòn.
Bắn súng **không** reset chuỗi (khuyến khích trộn hai loại vũ khí — đúng ý P2).

## 5. Hitbox của một nhát slide (spec code)

```
   Đường quẹt trên màn hình  ->  chiếu vào không gian thế giới
   thành một CAPSULE hình quạt:

        camera
          |
          |    reach (2.2 - 3.4m)
          v
      /---+---\
     /    |    \   arc (60° - 150°)
    |     |     |
     \    |    /
      \___|___/     <- dày 0.5m theo chiều dọc slide

   - Lấy tối đa `targets` mục tiêu, ưu tiên gần trước.
   - Mỗi mục tiêu chỉ nhận 1 hit / slide (không double-dip).
   - Kiểm tra theo overlap capsule, KHÔNG raycast từng frame.
```

## 6. Xác văng theo chiều slide (docs)

```
   V_slide (2D trên màn hình)  ->  V_world = camera.right * Vx + camera.up * Vy
   launchVector = normalize(V_world) * kbForce * corpseLaunchMult * (1 - kbResist)
```

| Thứ | Quy tắc |
|---|---|
| Xác | Bay theo `launchVector`, ragdoll 1.2s rồi tan thành khói + vàng |
| Chém ngang | Xác bay sang bên, đập vào tường thì bật lại (truyền 25% lực cho quái gần đó) |
| Chém chéo lên | Xác bay lên cao — cảnh đẹp nhất, ưu tiên cho vũ khí nặng |
| Xác đang bay | Đẩy quái nó chạm, truyền 35% lực (domino, giống đạn) |
| Giới hạn | Tối đa 12 ragdoll cùng lúc; vượt thì xác tan ngay bằng VFX (giữ 60fps) |

## 7. Phân loại vũ khí cận chiến (archetype)

| Archetype | Vai trò | Đặc trưng | Ghi chú |
|---|---|---|---|
| **Dao găm** | Khởi đầu, rẻ stamina | stam 12, swing 0.30s, arc 60°, 2 mục tiêu | Nuôi Cướp Đạn tốt nhất |
| **Rựa / Dao rừng** | Cân bằng | stam 18, swing 0.38s, arc 90°, 3 mục tiêu | Mặc định tốt |
| **Đại đao** | Xoá hàng | stam 24, swing 0.62s, arc 150°, 6 mục tiêu, launch 8m | Chém Hoàn Hảo dễ nhất |
| **Búa / Chuỳ** | Phá khiên | stam 23–25, swing 0.55–0.70s, kb x2.5–3.2, bỏ qua khiên | Chống Goblin Khiên |
| **Giáo** | Tầm xa nhất | stam 16, reach 3.4m, arc 40°, xuyên 3 con theo đường thẳng | An toàn nhất |
| **Song đao** | Nhịp nhanh nhất | stam 9, swing 0.22s, arc 55°, lên bậc chuỗi nhanh gấp đôi | Chạm mốc hút vàng x2 sớm nhất |
| **Cưa máy** | Giữ để cắt | stam 22, tiêu theo giây, không dùng slide đơn | Nod tới Into the Dead |
| **Lưỡi Lõi** | Late | hồi 6 stamina mỗi mạng chém khi ở Depth ≥ 5 | End-game |

Dữ liệu chi tiết 12 vũ khí: `data/weapons.json` → `gen-weapons.md`.

## 7b. Luật: vũ khí xịn hơn CHỈ tăng sát thương

Mọi vũ khí cận chiến dùng **cùng một bộ thông số nhắm bắn**. Khác nhau duy nhất là `dmg`.

| Thông số | Giá trị (toàn bộ 12 vũ khí) |
|---|---|
| `reachM` | **6.00** |
| `arcDeg` | 110 — **không còn quyết định vùng cắt**, xem mục 7c |
| `targets` | **8** |
| `staminaCost` | 16 |
| `swingTime` | 0.34 |
| `knockback` · `critMult` · `corpseLaunch` | 1.0 · 2.5 · 4.0 |

`dmg` là bậc thang duy nhất: **30 → 71 → 166 → 390 → 915 → 2151** (tier 1→6) — thấp hơn súng, xem mục 7d.

Ba lý do đây là luật, không phải chỗ tinh chỉnh:
1. **Không có vũ khí nào "xấu" ở một trục nào.** Trước đây `targets` từ 2 đến 6 và `reachM` từ 2.0 đến 3.4 —
   nghĩa là một vũ khí tier cao có thể **kém hơn** một vũ khí tier thấp ở số mục tiêu, mà người chơi không có
   cách nào biết trước.
2. **Mọi vũ khí đều chém được nhiều mục tiêu.** `targets = 5` cho tất cả, nên Chém Hoàn Hảo (≥3 con/nhát,
   mục 3) luôn với được — không còn vũ khí nào bị khoá khỏi cơ chế đó.
3. **Tầm 4.50m đặt mục tiêu vào giữa màn hình.** Chiếu phối cảnh cho ra **55%** chiều cao màn hình ở 4.5m,
   so với 92.7% ở 1.2m (lỗi #9 ở `18`). Chém ở tầm gần thì không thấy mình chém gì.

Audit có gate cho cả hai chiều: một gate bắt mọi thông số ngoài `dmg` bị lệch giữa các vũ khí, và một gate
đòi `targets ≥ 3`. Không có gate thứ nhất thì các tier sẽ tự lệch lại khi ai đó tinh chỉnh một cái.

> **Hệ quả phải biết:** hai vũ khí **cùng tier** giờ giống nhau hoàn toàn, kể cả `dmg`. Khác biệt duy nhất
> còn lại là `archetype` — và nó **có** ý nghĩa cơ chế: `hammer` và `acid` bỏ qua khiên Goblin Khiên
> (`09` mục 2b). Nếu muốn vũ khí có bản sắc trở lại thì `archetype` là chỗ để làm, chứ không phải các con số
> nhắm bắn — vì `archetype` là *counter*, không phải *sức mạnh*.

## 7c. Lưỡi dao là ĐƯỜNG NGÓN TAY, không phải hình quạt

Trước đây nhát chém dùng **hình quạt world-space**: lấy vector quẹt trên màn hình, đổi thành hướng trong
thế giới rồi quét một hình quạt `arcDeg` quanh nó. Hai lỗi không tránh được:

1. **Cung 110° ở tầm xa phủ gần hết chiều rộng hành lang** → *chém làn trái giết luôn quái làn phải*.
2. Trong chế độ **chém liên tục**, mỗi đoạn ngón tay có hướng riêng, nên cung nhảy qua nhảy lại hai bên.

Model hiện tại: **cắt những con mà đoạn ngón tay đi qua trên màn hình.**

```
tam the gioi : bo con nao xa hon reachM
chieu man hinh: quai -> (ex, ey);  ngon tay -> doan (x0,y0)-(x1,y1)
cat neu       : khoang cach tu (ex,ey) den DOAN do  <=  bladeWidthPx + 26*scale
```

Ba thứ được cùng lúc:
- **Chém trái không giết phải** — đo được: quẹt nửa trái cắt quái trái, không chạm quái phải, và ngược lại.
- **Vệt slash chính là lưỡi dao.** `trail.js` vẽ đúng đoạn thẳng mà `queryBlade` dùng, nên người chơi
  **thấy đúng cái đã cắt**. Không có hai nguồn sự thật.
- Thẻ nâng cấp `arcAdd` vẫn còn tác dụng: nó làm lưỡi **dày** thêm.

`arcDeg` trong `weapons.json` giờ **không còn quyết định vùng cắt** — nó chỉ còn là hệ số dày lưỡi qua
`arcAdd`. Giữ trong data cho thẻ nâng cấp, nhưng đừng tinh chỉnh nó rồi mong vùng cắt đổi.

**Một nhát quẹt ngang cắt một DẢI NGANG, tức một khoảng độ sâu.** Quái ở xa nằm cao trên màn hình, quái ở
gần nằm thấp — nên muốn cắt cả cụm trải theo độ sâu thì phải quẹt **chéo** hoặc quẹt nhiều lần. Đây là hệ
quả cố hữu của model, và nó biến việc **nhắm** thành một kỹ năng thật.

### Tại sao `targets` không nằm trong ngân sách DPS nữa

`normalize_balance.ps1` từng tính `dpsMeleeEff = dmg × (1 + 0.35×(targets−1)) / interval`. Khi `targets`
còn khác nhau giữa các vũ khí (2…6) thì hệ số đó là cái giá phải trả cho khả năng đánh nhiều mục tiêu.

Giờ `targets = 8` cho **mọi** vũ khí, nên nó chỉ còn là **một phép chia đều cho 3.45** — không phân biệt gì,
mà kéo sát thương xuống **dưới HP của trash**: đo được trash cần **5 nhát** mới chết, phá luật cứng
"trash phải chết trong 1 nhát" (`09` nguyên tắc 4).

Sửa: bỏ `targets` khỏi ngân sách (`dpsMeleeEff = dmg / interval`), và thêm **sàn one-shot**
`dmg ≥ trashHp(tier) × meleeOneShotFactor` với `meleeOneShotFactor = 1.65 ≈ 1 / slideTickDamageMult` — nên
**kể cả một đoạn quét trong chế độ chém liên tục cũng đủ giết trash**. Cả `normalize_balance.ps1` và
`audit_gdd.ps1` đều dùng công thức mới; nếu lệch nhau thì gate báo ngay.

## 7d. ĐẢO NGƯỢC: cận chiến YẾU HƠN súng

`meleeAdvantage` **1.45 → 0.80**. Melee DPS giờ **thấp hơn** ranged DPS ở mọi tier, và audit gate đã đảo
chiều theo (`WPN: Melee DPS THAP HON ranged DPS o cung tier`).

Doc cũ ghi lý do ngược lại: *"melee phải mạnh hơn, nếu không thì không ai dám vào gần và cơ chế Cướp Đạn
chết"*. Lý do đó **không còn đúng** trong mô hình chạy X mét, vì người chơi **không chọn** vào gần hay
không — quái làn giữa tự đến trước mặt. "Vào gần" không còn là rủi ro phải trả giá.

Đối mặt thật bây giờ là **đạn**:

| | Súng | Dao |
|---|---|---|
| Sát thương | **cao hơn** | thấp hơn |
| Chi phí | **tốn đạn** (băng + dự trữ hữu hạn) | miễn phí, chỉ tốn stamina (tự hồi) |
| Nạp lại | phải nhả tay, mất nhịp | không |
| Cướp Đạn | — | 1 mạng chém = **0.3 giây bắn** (`gamefeel.json` → `melee.scavengeSecondsPerKill`) |

Nên quyết định mỗi giây là: *bắn để giết nhanh mà tốn đạn*, hay *chém để giữ đạn mà chậm hơn*. Nếu dao vừa
mạnh hơn vừa miễn phí thì không ai bắn cả — đó mới là điều phá vòng lặp, chứ không phải chuyện dám vào gần.

`meleeAdvantage` hạ tiếp xuống **0.307** → T1 dmg = **30**. **Luật "trash chết 1 nhát" đã BỎ** (`09` nguyên tắc 4 không còn áp cho cận chiến): 30 dmg vs trash 40 HP nên cần **2 nhát**, và một
đoạn quét liên tục (62%) cần **3 lượt**. Đây là hệ quả trực tiếp của việc hạ sát thương cận chiến xuống 30, và `meleeOneShotFactor` + gate one-shot đã bị gỡ khỏi cả normalizer lẫn audit.

## 8. Ràng buộc cân bằng (audit)

1. **`staminaCost` ≤ 25 với MỌI vũ khí cận chiến.** Vì `staminaRegen × 1.4s = 25.2`, luật này đảm bảo
   dù stamina cạn sạch thì trong 1.4 giây vẫn có được **một** nhát chém. Reload dài tới 4.5s — nếu vũ khí
   nặng tiêu 40 stamina thì sẽ có những khoảnh khắc người chơi **không tấn công được bằng bất cứ gì**,
   và đó là kiểu chết khiến người chơi bỏ game. **Sức nặng của vũ khí nằm ở `swingTime`, `targets`,
   `corpseLaunch`, `knockback` — không nằm ở stamina.**
2. Stamina đầy cho **4 nhát** ở vũ khí nặng nhất và **8 nhát** ở vũ khí rẻ nhất.
3. `dpsMeleeEff` = `dmg / max(swingTime, staminaCost/staminaRegen)` — **không** tính `targets` (mục 7c) — nằm trong **±25%** đường cong
   `dpsTarget(tier) × 1.45` — xem `16` mục 4.1.
4. Melee DPS **phải THẤP HƠN** ranged DPS ở cùng tier — xem mục 7d. Súng mạnh hơn nhưng tốn đạn;
   dao yếu hơn nhưng miễn phí và còn nạp đạn lại qua Cướp Đạn. Audit so trung bình theo từng tier.
5. **Sàn one-shot thắng khi xung đột**: `dmg ≥ trashHp(tier) × meleeOneShotFactor` — kể cả khi nó đẩy DPS lên trên đường cong.
6. Không vũ khí cận chiến nào one-shot được Elite ở cùng Depth (giữ đất cho boss/elite fight).
