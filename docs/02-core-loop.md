# 02 — Core Loop

Ba tầng vòng lặp. Tầng nào cũng phải có **quyết định**, không chỉ có hành động.

---

## Tầng 1 — Vòng giây (2–6 giây): "Bắn hay Chém"

```
        +---------------------------------------------------+
        |                                                   |
        v                                                   |
   [Quái vào dải Xa/Giữa]                                   |
        |                                                   |
   TAP / HOLD  --> đạn giảm --> HẾT ĐẠN                      |
        |                          |                        |
        |                          v                        |
        |                   [RELOAD 1.4-4.5s]               |
        |                   chỉ được chém                    |
        |                          |                        |
        |                    Nạp Hoàn Hảo? --> -45% thời gian|
        |                          |          +15% dmg băng  |
        v                          v                        |
   [Quái vào dải Cận chiến] <------+                        |
        |                                                   |
   SLIDE --> stamina giảm --> stamina < 50% --> chém chậm 50%|
        |                                                   |
   Chém trúng >= 3 con 1 nhát = CHÉM HOÀN HẢO                |
        |  +12 stamina, +1 bậc combo, slow-mo 0.12s         |
        |  (mỗi 10 lần Chém Hoàn Hảo = +1 Lộc)              |
        |                                                   |
   16 mạng chém = +1 băng đạn miễn phí --------------------->+
```

**Quyết định người chơi phải ra mỗi 2–6 giây:** *"Tao bắn nốt băng này rồi mới chém, hay chém trước để
đẩy nó ra rồi mới bắn?"* — vì knockback của súng và của dao khác nhau, và stamina/đạn là hai đồng hồ chạy ngược nhau.

**Đây là P2.** Nếu người chơi có thể thắng bằng cách chỉ dùng một loại vũ khí thì pillar này chết —
xem ràng buộc số học trong `16-data-schema-balancing.md` mục "TTK & khoá tài nguyên".

---

## Tầng 2 — Vòng run (4–6 phút): "Đi cửa nào"

```
   [Vào hầm: Depth D, Lộc L = 0 (hoặc +2..+10 nếu có talent)]
        |
        v
   +--> [PHÒNG]  1-3 wave. Wave sau đông hơn wave trước 18% và có thể có
   |      |      loại quái mới khoẻ hơn. Spawn 1.5-2.0s sau khi con cuối chết.
   |      |      (ở lâu quá 35s: SƯƠNG ĐEN dồn tới từ phía sau -- 28s từ phòng 8)
   |      v
   |    [DỌN SẠCH]  slow-mo 0.35s @ 0.4x, vàng tự hút về túi
   |      |         không mất máu cả phòng --> +1 Lộc
   |      v
   |    [CỔNG]
   |      |
   |      +-- chọn 1 trong 3 THẺ NÂNG CẤP (rarity theo Lộc)
   |      |
   |      +-- NGÃ BA HẦM: 2 cửa, mỗi cửa có biển báo
   |      |     CỬA A: PHÒNG CHIẾN [ĐÔNG]  ~90 quái, vàng x1.25
   |      |     CỬA B: MIẾU MỎ    [YÊN]    đổi Lộc / hồi máu
   |      |
   |      v
   |    [Phòng tiếp theo: Chiến / Elite / Shop / Miếu / Kho báu / Sự kiện / Lò Vàng]
   |      |
   +------+
        |
        v
   [Phòng 9 = Shop (cố định)] --> [Phòng 10 = BOSS] --> mở Depth sau
        |
        v
   [hoặc CHẾT]
        |
        v
   [Kết run: vàng đã thu, Mảnh Cốt, Weapon XP cho đúng vũ khí đã dùng]
```

**Hai quyết định của tầng này:**

1. **Thẻ nào** — build của run này (Archero-style, 1 trong 3).
2. **Cửa nào** — đường đi qua hầm. Xem `08-fork-escalation.md`.

**Điểm quan trọng:** người chơi **không** điều khiển độ khó. Hầm tự đông dần và tự khoẻ dần theo `R`
(chỉ số phòng) và `w` (wave trong phòng) — đúng dòng docs gốc *"độ khó mỗi wave sẽ tăng dần, có thể là
tăng số lượng, loại quái mới khoẻ hơn"*. Người chơi chỉ chọn **đi qua nó bằng đường nào**.

Đây là chỗ khác biệt có ý thức với Guns 'n Goblins: họ cho người chơi gõ chuông để tự bơm độ khó lấy
thưởng. Ta không mượn cơ chế đó — ta chỉ lấy **cảm giác đông** của họ.

---

## Tầng 3 — Vòng ngày (mở app 3–5 lần/ngày): "Nuôi cái gì"

```
   [Kết thúc run]
        |
        +--> Vàng ------------> Nâng cấp Weapon (cần cả Weapon XP từ kill)
        |                  \--> Talent (4 nhánh: Nòng / Lưỡi / Da / Đèn)
        |                   \-> Trại Mỏ building (buff run-start, idle gold)
        |
        +--> Mảnh Cốt ------> Talent bậc cao + đổi từ weapon/relic trùng
        |
        +--> Weapon XP ------> chỉ vũ khí ĐÃ DÙNG lên level (lấy từ Into the Dead 2)
        |
        +--> Phôi Rèn -------> lên Tier vũ khí (T1->T6)
        |
        v
   [Mở Depth mới / mở Elite Depth / Endless leaderboard / Hầm Ngày]
        |
        v
   [Vào run tiếp — mạnh hơn, nên xuống được sâu hơn]
```

**Cầu nối tầng 2 ↔ tầng 3:** sức mạnh meta không dùng để làm game dễ đi — nó dùng để **xuống được sâu hơn**,
và ở dưới sâu thì hầm vẫn thắng (đường cong quái ×1.068/phòng không bao giờ dừng, xem `16` mục 7).
Đây là cách ta tránh lỗi của Archero mà Deconstructor of Fun chỉ ra: talent tăng đều trong khi độ khó
tăng dốc. Ở đây người chơi luôn có một biên giới mới để đẩy tới.

---

## Sơ đồ phụ thuộc số học

| Đại lượng | Bị điều khiển bởi | Điều khiển cái gì |
|---|---|---|
| `R` (chỉ số phòng) | Người chơi đi sâu | Số quái, HP quái, damage quái, vàng |
| `w` (wave trong phòng) | Hệ thống | Số quái (+18%/wave), HP (+6%/wave) |
| `L` (Lộc) | Chơi giỏi: Elite, không mất máu, Chém Hoàn Hảo | Rarity thẻ, tỉ lệ cột vàng, đổi ở Miếu Mỏ |
| Đạn dự trữ | Melee kill, shop, hòm | Có được bắn hay không |
| Stamina | Thời gian, Chém Hoàn Hảo, thẻ | Tốc độ chém (dưới 50% thì -50%) |
| Khoảng cách quái | Knockback (súng + dao), Bước Lùi | HP người chơi |
| Vàng trong run | Kill × tag cửa × Depth | Shop, Miếu, Cân Vàng, reroll |
| Weapon XP | Kill bằng đúng vũ khí đó | Level vũ khí ở meta |

## Anti-pattern phải tránh trong loop

1. **Không có phòng nào "chỉ để đi qua"** — mọi phòng phải có kill hoặc quyết định.
2. **Không có wave nào dài quá 35s** — vượt ngưỡng là Sương Đen ép người chơi xông lên.
3. **Không bao giờ để người chơi hết cả đạn lẫn stamina cùng lúc mà không có đường ra** — mọi vũ khí cận
   chiến phải có `staminaCost ≤ 25` để `staminaRegen × 1.4s` luôn đủ cho một nhát (xem `16` mục 5).
4. **Không popup nào giữa combat** — mọi lựa chọn dồn về Cổng.
5. **Không có dial độ khó cho người chơi** — nếu ai đó đề xuất "cho người chơi bấm nút để quái đông hơn
   lấy thêm vàng", đó chính là cơ chế của Guns 'n Goblins và nó đã bị loại có chủ đích.
