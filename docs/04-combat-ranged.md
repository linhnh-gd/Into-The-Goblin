# 04 — Combat: Vũ khí tầm xa

Nguồn từ docs: *cần đạn để bắn* · *tap / hold / hold-drag* · *có băng đạn, hết thì reload, trong lúc
reload không bắn được, chỉ dùng cận chiến* · *knockback tuỳ loại* · *quái chết bị đẩy lùi về phía sau*.

---

## 1. Ba tầng tài nguyên đạn

| Tầng | Tên | Hồi bằng cách nào | Hiển thị |
|---|---|---|---|
| 1 | **Băng đạn** (`mag`) | Reload | Vòng tròn quanh tâm ngắm, mỗi viên là 1 vạch |
| 2 | **Đạn dự trữ** (`reserve`) | Melee kill (Cướp Đạn), hòm, shop, card | Số dưới HUD phải: `24 / 60` |
| 3 | **Cướp Đạn** (`scavenge`) | +1 mỗi melee kill; **Chém Hoàn Hảo tính x2** | Thanh nhỏ hình băng đạn; đầy 6 điểm = +1 băng |

> **Đây là pillar P2.** Súng không có đạn vô hạn, và đạn **không mua được giữa combat** — đường duy nhất
> để có đạn trong lúc đánh là **giết bằng dao**. Ngược lại chém liên tục thì hết stamina. Hai đồng hồ này
> chạy ngược nhau và đó là toàn bộ chiều sâu của combat.

Ràng buộc thiết kế (audit gate): với mọi vũ khí, `mag * dmgPerShot` phải giết được **ít hơn** số quái của
một wave trung bình ở cùng Depth (mặc định: 45–70% wave). Nếu một băng đạn dọn sạch được wave thì melee
thành vô dụng và P2 chết.

---

## 2. Reload & Nạp Hoàn Hảo (Perfect Reload)

```
   Hết đạn (hoặc tap nút Reload)
        |
        v
   [======== thanh reload ========]
             ^          ^
             |          +-- vùng THƯỜNG
             +-- vùng HOÀN HẢO (0.25s, vị trí ngẫu nhiên trong 45%-80% thanh)
```

| | Không tap | Tap trong vùng Hoàn Hảo | Tap ngoài vùng |
|---|---|---|---|
| Thời gian reload | 100% | **55%** | **130%** (kẹt đạn, rung mạnh) |
| Băng đạn kế tiếp | thường | **+15% damage** cả băng | thường |
| VFX | — | Vòng vàng loé + tiếng lên quy lát giòn | Tia lửa đỏ + tiếng kẹt |

- Vị trí vùng Hoàn Hảo **ngẫu nhiên có seed** (xem quy tắc 6 ở `16`) → không học vẹt được.
- Trong lúc reload: **súng bị khoá hoàn toàn** (docs), chỉ chém được. Đây là lúc căng nhất của mỗi vòng giây.
- `Auto-reload` bật mặc định; khi bật vẫn có thể tap để lấy Hoàn Hảo.


## 2b. TỰ NHẮM: tap ở đâu cũng bắn được

Bỏ hẳn cơ chế "phải tap trúng con quái". **Tap hoặc giữ ở bất kỳ đâu trên màn hình** đều bắn, và mục tiêu
được chọn tự động:

1. Con **gần nhất ở LÀN GIỮA** trong `run.tapFarM` (14m) — đây là mối đe doạ thật.
2. Nếu làn giữa trống → con **gần nhất bất kỳ**, để quái làn bên vẫn giết được lấy vàng
   (`09` mục 2c: "giết là vàng thêm").
3. Không có con nào trong tầm → không bắn, không tốn đạn.

**Vị trí tap vẫn còn một nghĩa:** tap ở **nửa dưới màn hình** = nhắm **yếu điểm** (bụng Ogre, ×2.0).
Đây là thứ duy nhất còn phụ thuộc vào chỗ ngón tay chạm, và nó giữ lại cơ chế yếu điểm ở `09` mục 2b.

Vì sao bỏ tap-vào-target: ở tốc độ chạy 4.2 m/s với 150+ quái mỗi phòng, việc bắt người chơi **chạm chính
xác** vào một hình bóng nhỏ đang lùi dần về phía đáy màn hình biến súng thành bài kiểm tra độ chính xác của
ngón tay, chứ không phải bài kiểm tra **chọn mục tiêu nào**. Tự nhắm trả quyết định về đúng chỗ: *bắn hay
chém*, *bắn tiếp hay nhả tay nạp đạn*.

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

## 6. Knockback từ đạn (docs: "quái chết thì bị đẩy lùi về phía sau")

| | Công thức |
|---|---|
| Khi trúng (còn sống) | `push = kb_weapon * (1 - kbResist_enemy) * (0.6 nếu heavy-class)` theo **vector đạn** |
| Khi chết | `launch = kb_weapon * 2.2 * (1 - kbResist)` — xác bay ngược về phía sau, đổ vào đồng bọn |
| Va chạm xác | Xác đang bay đẩy lùi quái nó chạm, truyền 35% lực (**domino**) |
| Shotgun ở dải Cận chiến | Nhân thêm x1.5 (thưởng cho việc dám để nó vào gần) |

Domino là thứ khiến shotgun "sướng": một phát vào đám 6 con ở cửa hẹp thì cả 6 lùi lại.

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
