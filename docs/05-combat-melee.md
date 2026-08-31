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
| Combo | **+1 bậc** thay vì +1 hit |
| Cướp Đạn | **tính x2** (mỗi mạng = 2 điểm) |
| Feel | slow-mo 0.12s @ 0.35x, flash trắng 1 frame, tiếng "shiiing" cao vút, chữ **CHÉM HOÀN HẢO** bay lên |

Đây là **money shot** của game — cảnh dùng cho video quảng cáo (UA creative): một nhát quẹt, 5 goblin đứt
đôi, xác bay theo hướng ngón tay, vàng nổ đầy màn hình.

## 4. Combo cận chiến

| Bậc | Điều kiện | Nhân damage | Feel |
|---|---|---|---|
| 0 | — | x1.00 | |
| 1 | 1 nhát trúng | x1.15 | tiếng trầm |
| 2 | nhát tiếp trong 1.2s | x1.30 | tiếng cao hơn |
| 3 | | x1.50 | camera FOV +2° |
| 4 | | x1.80 | viền màn hình sáng vàng |
| 5+ | | x1.80 + **hút vàng bán kính x2** | trống dồn |

Reset khi: quẹt trượt (không trúng ai), hoặc **1.2s không có nhát trúng nào**, hoặc bị trúng đòn.
Bắn súng **không** reset combo (khuyến khích trộn hai loại vũ khí — đúng ý P2).

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
| **Song đao** | Combo | stam 9, swing 0.22s, arc 55°, combo lên bậc nhanh gấp đôi | Build combo |
| **Cưa máy** | Giữ để cắt | stam 22, tiêu theo giây, không dùng slide đơn | Nod tới Into the Dead |
| **Lưỡi Lõi** | Late | hồi 6 stamina mỗi mạng chém khi ở Depth ≥ 5 | End-game |

Dữ liệu chi tiết 12 vũ khí: `data/weapons.json` → `gen-weapons.md`.

## 8. Ràng buộc cân bằng (audit)

1. **`staminaCost` ≤ 25 với MỌI vũ khí cận chiến.** Vì `staminaRegen × 1.4s = 25.2`, luật này đảm bảo
   dù stamina cạn sạch thì trong 1.4 giây vẫn có được **một** nhát chém. Reload dài tới 4.5s — nếu vũ khí
   nặng tiêu 40 stamina thì sẽ có những khoảnh khắc người chơi **không tấn công được bằng bất cứ gì**,
   và đó là kiểu chết khiến người chơi bỏ game. **Sức nặng của vũ khí nằm ở `swingTime`, `targets`,
   `corpseLaunch`, `knockback` — không nằm ở stamina.**
2. Stamina đầy cho **4 nhát** ở vũ khí nặng nhất và **8 nhát** ở vũ khí rẻ nhất.
3. `dpsMeleeEff` (đã tính `targetFactor` và giới hạn stamina) nằm trong **±25%** đường cong
   `dpsTarget(tier) × 1.45` — xem `16` mục 4.1.
4. Melee DPS **phải cao hơn** ranged DPS ở cùng tier (**≥ +30%**) — nếu không thì không ai dám vào gần và
   cơ chế Cướp Đạn chết. Audit so trung bình theo từng tier.
5. Melee DPS phải **thấp hơn** ranged DPS nếu tính cả thời gian di chuyển tới dải Cận chiến (rủi ro có giá).
6. Không vũ khí cận chiến nào one-shot được Elite ở cùng Depth (giữ đất cho boss/elite fight).
