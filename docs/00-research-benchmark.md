# 00 — Research & Benchmark

Mục tiêu: **không sáng tác hệ thống trong chân không**. Mỗi cơ chế trong GDD này phải trả lời được câu hỏi
"lấy từ đâu, tại sao game đó hoạt động, và ta cải tiến chỗ nào".

---

## A. Into the Dead / Into the Dead 2 (PikPok, 2012 / 2017)

**Là gì:** endless runner **góc nhìn thứ nhất** — thể loại cực hiếm. Nhân vật tự chạy với tốc độ cố định,
người chơi lách trái/phải để tránh tay zombie, nhảy qua hàng rào, né cây, và bắn.

**Tại sao nó hoạt động (rút ra được gì):**

| Yếu tố | Cơ chế thật của game | Bài học cho ta |
|---|---|---|
| Góc nhìn 1 | FPS trong endless runner → cảm giác zombie **thò tay vào mặt** | Portrait FPS = màn hình toàn là mặt quái → sợ + thỏa mãn hơn top-down rất nhiều |
| Auto-move | Nhân vật **luôn tiến**, người chơi không kiểm soát tốc độ | Auto-advance giải phóng ngón tay cho combat — nhưng làm mất agency (ta trả lại bằng Chuông Tham) |
| Vũ khí là ngôi sao | "Weapons are the feature the game revolves around". Coin từ run tốt để mua súng, lựu đạn, chainsaw ở Armory | Weapon collection = động lực meta số 1. Ta giữ nguyên trục này |
| Weapon XP | ITD2: **mỗi kill cho XP cho đúng vũ khí đó**, đủ XP thì tiêu Gold để upgrade | Rất hay: khiến người chơi "trung thành" với 1 súng, tạo cảm giác nuôi. Ta copy nguyên |
| Cấu trúc | ITD2: **7 chapter / 60 level**, mỗi level 5 challenge, hoàn thành hết chapter mở Elite mode | Ta dùng 7 Depth, mỗi Depth có challenge + Elite (New Game+) |
| Objective phụ | "giết X zombie", "không dùng vũ khí" | Challenge làm mới cùng một nội dung — cực rẻ, cực hiệu quả |
| Control | Tilt, hoặc 3 sơ đồ nút ảo | **Điểm yếu.** Tilt + nút ảo trong FPS mobile là thoả hiệp. Ta thay bằng gesture thuần (theo docs) |

**Điểm yếu ta phải sửa:**

1. Chết là hết, nhàm sau ~20 run vì mỗi run **giống nhau** (chạy đồng cỏ, rồi lại chạy đồng cỏ).
2. Không có quyết định chiến thuật trong run — chỉ có phản xạ lách.
3. Nhịp phẳng: không có đỉnh/đáy, không có khoảnh khắc "wave clear" để thở.

→ **Ta sửa bằng:** room graph + card upgrade (roguelite) + Chuông Tham (biến độ khó thành lựa chọn của người chơi).

---

## B. Guns 'n Goblins (Lance x SoulGame, PC) — **CHỈ LẤY FEEL, KHÔNG LẤY CƠ CHẾ**

> **Phạm vi tham chiếu (quyết định của chủ dự án):** từ Guns 'n Goblins ta **chỉ lấy feel và mood về mật độ
> quái đông**. Không lấy cơ chế nào của họ.

**Là gì:** "**incremental horde-based survivor FPS where you're 1 vs 10,000**". Dark fantasy. Người chơi là
**Bell Ringer** cuối cùng, bảo vệ một trong những **Bastion** cuối. Cơ chế định nghĩa game của họ là cái
**Bell**: người chơi chủ động gõ chuông để triệu hồi horde, wave lớn hơn thì thưởng lớn hơn nhưng nguy
hiểm tăng vọt.

### Cái ta LẤY — feel và mood

| Yếu tố | Cái ta thật sự dùng |
|---|---|
| **Quy mô** — hàng nghìn quái trên sân, "1 vs 10,000" | Cảm giác **đông tới mức nghẹt thở** là fantasy bán được. Portrait mobile: mục tiêu **150+ silhouette cùng lúc**, ngưỡng 60 con/wave phải đạt ngay trong Depth 1 |
| **Mood** — dark fantasy hầm mỏ, goblin, tối, đuốc | Art direction của ta (xem `15`): nền gần như đen, quái là bóng đen mắt đỏ, vàng là màu ấm duy nhất |
| **Kill → vàng nổ ra** | Vàng là cả phần thưởng cảm xúc lẫn tiền tệ (xem `11`, `13`) |
| **Nhịp incremental** — súng từ yếu tới hạ được dragon | Đường cong power phải **phóng đại** (T1→T6 ×71.7), không phải +5%/level |

### Cái ta KHÔNG lấy (và thay bằng gì)

| Cơ chế của họ | Vì sao không lấy | Ta dùng gì thay |
|---|---|---|
| **Bell — người chơi gõ chuông triệu hồi horde để lấy multiplier** | Đây là cơ chế lõi, là bản sắc của họ | Độ khó **tự tăng** theo phòng/wave, đúng dòng docs gốc *"độ khó mỗi wave sẽ tăng dần"*; quyết định của người chơi là **Ngã Ba Hầm** (chọn cửa) — xem `08` |
| **Bell Ringer / Bastion** (premise + meta base) | Là lore và khung meta của họ | Người chơi là **thợ mỏ xuống hầm vì vàng**; meta base là **Trại Mỏ** |
| **Risk-ladder tự bơm để lấy reward** | Là biến thể của cùng cái Bell | **Lộc** — thưởng cho **chơi giỏi** (giết Elite, không mất máu, Chém Hoàn Hảo), không thưởng cho tự làm khó |

**Điểm yếu (theo review demo) ta phải tránh:**

1. **"Slow basic weapons"** — vũ khí khởi đầu quá yếu, gate progression sớm gây chán. → Ta cho súng T1 **giết trash 1 phát** ở Depth 1.
2. **"Ammo pressure"** gây friction. → Ta biến sức ép đạn thành **cơ chế chủ đích** (melee kill nạp đạn), không phải sự bất tiện.
3. Aiming rườm rà, đổi vũ khí lóng ngóng. → Portrait: chỉ **2 slot** (1 tầm xa + 1 cận chiến), không có menu đổi súng trong combat.
4. Downtime giữa wave. → Wave sau spawn **1.5–2.0s** sau khi con cuối chết.

---

## C. Các game tham chiếu khác

### 1. Archero (Habby) — bộ xương roguelite mobile

- Cơ chế cốt lõi: **đứng thì tự bắn, đi thì không bắn** → mọi thứ là đánh đổi *di chuyển* vs *sát thương*.
  Bài học: **một đánh đổi duy nhất, rõ ràng, lặp lại mỗi giây** là đủ để làm một hit mobile.
- Chọn **3 card giữa wave** để dựng build "chaotic ability combination". Đây là engine replayability rẻ nhất trong ngành. **Ta copy.**
- Phân tích của Deconstructor of Fun chỉ ra 3 lỗi khiến Archero "để lại $35M trên bàn":
  1. **Talent tăng đều (linear) trong khi độ khó tăng dốc** → upgrade late-game cảm giác vô nghĩa.
  2. **Không có đường chuyển đổi item trùng** → drop vô dụng, progression bị luck chặn.
  3. **Chest không thỏa mãn**, fusion phụ thuộc may mắn.
- → **Ta chặn cả 3:** talent scale theo % power delta; mọi weapon/relic trùng đổi thành **Mảnh Chuông** (dust); không gate progression chính bằng gacha.
- Bài học thêm: energy **chỉ gate live content**, không gate mode chính.

### 2. Vampire Survivors / Survivor.io — nhịp horde

- Sức ép tăng liên tục, đỉnh dồn dập, thưởng theo cụm. **Chuỗi coin chime cao dần** là một trong những
  âm hiệu gây nghiện nhất từng được làm ra → ta bắt buộc phải có (xem `13-gamefeel-juice.md`).

### 3. ZOMBIE SLASH / Swipe and Survive / exeCute — swipe melee mobile

- Đã chứng minh **swipe = melee** hoạt động trên mobile: "visceral slashing", screen-shake khi trúng,
  chain hit tăng damage, swipe đúng thời điểm để né.
- Bài học quan trọng: các game này **chỉ có** melee nên không gặp bài toán xung đột gesture.
  Ta có cả tap-để-bắn → **phân giải gesture là rủi ro kỹ thuật số 1 của dự án** (xem `03-controls-gestures.md`).

### 4. Gears of War — Active Reload

- Bấm đúng cửa sổ nhỏ trong lúc reload thì reload nhanh hơn và được buff damage.
  Chuyển thành 1 tap trên mobile = **skill expression gần như miễn phí**, biến thời gian chết (reload)
  thành khoảnh khắc chú ý cao nhất trong trận.

### 5. Left 4 Dead — AI Director

- Nhịp "build-up → peak → relax → build-up". Đám đông xuất hiện theo áp lực, không theo timer cứng.
- **Panic event** nếu người chơi rùa → ta làm **Sương Đen** (xem `06`).

### 6. Company of Heroes 3 "Final Stand" / Rogue Wave — wave + shop

- 12 wave leo thang rồi tới boss, tiền kiếm giữa wave mở cây faction. Xác nhận nhịp **wave → shop → wave** là chuẩn mực của thể loại.
- Devlog Rogue Wave: wave spawn theo **timer cứng gây ~1 phút downtime** → sửa thành "5 giây sau khi con
  cuối chết" thì game "nhanh hơn, sướng hơn". **Ta lấy con số này và siết còn 1.5–2s cho mobile.**

### 7. Slay the Spire / Archero node map — cấu trúc rẽ nhánh

- Người chơi thấy trước bản đồ và **chọn đường**: đường nhiều tiền, đường nhiều máu, đường có shop.
- Bài học: **lựa chọn có thông tin** hay hơn **ngẫu nhiên** dù nội dung y hệt. Cùng một phòng Shop, nhưng
  "tao chọn nó vì tao hết đạn" cho cảm giác chủ động, còn "nó tự hiện ra" thì chỉ là may.
- → Đây là gốc của **Ngã Ba Hầm** (`08`), và nó đến từ truyền thống dungeon-crawl chứ không phải từ
  cơ chế Bell của Guns 'n Goblins.

### 8. Xu hướng mobile 2026

- Session ngắn; **one-handed / vertical** là mặc định; UI dồn về vùng ngón cái ở đáy màn hình.
- Hybrid-casual: **vào được gameplay dưới 10 giây** sau khi mở app.
- → Portrait + gesture-only + không có cửa vào phức tạp là đúng hướng thị trường.

---

## D. Bảng tổng hợp: game này là cái gì

| Trục | Lấy từ | Cụ thể |
|---|---|---|
| Camera & di chuyển | Into the Dead | FPS portrait, auto-advance, hành lang hầm |
| **Cảm giác đông (chỉ feel)** | **Guns 'n Goblins** | 150+ quái, silhouette, mood dark-fantasy hầm mỏ, "1 mình vs cả hầm" |
| Leo thang độ khó | **docs gốc của dự án** | Tự tăng theo phòng và theo wave — không có dial cho người chơi |
| Hook quyết định | Slay the Spire / Archero node map + docs gốc | **Ngã Ba Hầm**: mỗi Cổng chọn 1 trong 2 cửa có biển báo |
| Cấu trúc run | Archero + CoH Final Stand | Room graph, wave → Cổng → 3 thẻ → wave |
| Combat tay | docs + ZOMBIE SLASH + Gears | Tap bắn / Slide chém / Nạp Hoàn Hảo |
| Đánh đổi mỗi giây | Biến thể của Archero (move-vs-shoot) | **Đạn vs Stamina**: hết đạn phải vào gần chém, chém đủ thì có đạn |
| Meta | Into the Dead 2 | Weapon XP + Talent + Trại Mỏ |
| Juice | Vampire Survivors + lý thuyết game feel | Hitstop 3–5 frame, shake có hướng, gold burst, coin chime ladder |

## E. Cái ta thêm mà không game nào có (điểm khác biệt bán được)

1. **Vòng khoá tài nguyên chéo Đạn ↔ Stamina** (melee kill nạp đạn) — biến "reload chỉ được melee" từ
   *hạn chế* thành *nhịp chơi bắt buộc học*.
2. **Chiều dài slide = độ nặng đòn** — slide ngắn là đòn nhẹ, slide dài quá 55% màn hình là đòn nặng
   (2x stamina, 2x damage, 2x knockback). Một gesture, hai tầng chiều sâu.
3. **Knockback là hệ phòng thủ chính** — không có nút né; giữ khoảng cách chính là kỹ năng.
   Đi thẳng từ dòng docs "cả 2 loại weapon đều knockback kẻ địch".
4. **Lộc** — tài nguyên đẩy chất lượng thẻ, kiếm bằng **chơi giỏi** (giết Elite, clear phòng không mất máu,
   Chém Hoàn Hảo) chứ không phải bằng tự làm khó mình. Và nó có chi phí cơ hội thật: tiêu ngay lấy thẻ epic,
   hay giữ để mọi thẻ sau này đều xịn hơn.
5. **Biển báo ở Ngã Ba nói trước cả cái xấu** ("đông", "tối", "hẹp") — người chơi bước vào phòng khó *một
   cách có chủ ý*. Không có cái gì nhảy ra sau lưng mà họ không được cảnh báo.

## Nguồn

- [Into the Dead — Wikipedia](https://en.wikipedia.org/wiki/Into_the_Dead) · [Into the Dead 2 — Wikipedia](https://en.wikipedia.org/wiki/Into_the_Dead_2) · [Into the Dead (franchise)](https://en.wikipedia.org/wiki/Into_the_Dead_%28franchise%29)
- [PikPok Reveals 'Into the Dead' — TouchArcade](https://toucharcade.com/2012/12/04/pikpok-reveals-into-the-dead-a-first-person-endless-runner) · [TA Plays: Into the Dead](https://toucharcade.com/2012/12/05/ta-plays-into-the-dead-a-physical-first-person-endless-runner/) · [Pocket Gamer — Android launch](https://www.pocketgamer.com/articles/049719/first-person-endless-runner-into-the-dead-charges-onto-android/) · [MobyGames](https://www.mobygames.com/game/79867/into-the-dead/)
- [Into The Dead 2 Wiki — Story](https://into-the-dead-2.fandom.com/wiki/Story) · [Walkthrough & Guide — SuperCheats](https://www.supercheats.com/into-the-dead-2/walkthrough/)
- [Guns 'n Goblins — Steam](https://store.steampowered.com/app/881940/Guns_n_Goblins/) · [GameDaily](https://gamedaily.com/news/guns-n-goblins-gameplay-and-release-details-for-this-horde-survivor-fps) · [FullCleared](https://fullcleared.com/news/guns-n-goblins-looks-to-be-our-next-roguelite-obsession/) · [Games Press](https://www.gamespress.com/Guns-n-Goblins---A-New-Incremental-Horde-Based-Survivor-FPS-Where-Your) · [Trees Hate You — demo review](https://treeshateyou.com/games/guns-n-goblins-demo) · [Playtester](https://playtester.io/guns-n-goblins) · [IncrementalDB](https://www.incrementaldb.com/game/guns-n-goblins)
- [Deconstructor of Fun — Archero](https://www.deconstructoroffun.com/blog/2019/8/9/why-archero-banked-25m-but-leaves-25m-hanging-hlx9n) · [Game Developer — Finding the Fun: Archero](https://www.gamedeveloper.com/design/finding-the-fun-archero-part-1---gameplay) · [Pocket Gamer — How to play Archero](https://www.pocketgamer.com/archero/how-to-play-archero-the-latest-free-mobile-rogueli/) · [GameRefinery — Roguelike elements](https://www.gamerefinery.com/roguelike-elements-in-mobile-games-in-china/)
- [ZOMBIE SLASH — Google Play](https://play.google.com/store/apps/details?id=com.nsystudios.zombieslash) · [Swipe and Survive — itch.io](https://hstsdev.itch.io/swipe-and-survive/devlog/741978/swipe-and-survive-v001) · [exeCute — itch.io](https://execute.itch.io/execute) · [Zombie Slayer: Hack n Slash](https://apps.apple.com/lc/app/zombie-slayer-hack-n-slash/id6502264072)
- [Juice in Game Design — Blood Moon Interactive](https://www.bloodmooninteractive.com/articles/juice.html) · [Maximizing Game Feel](https://salivity.github.io/game-development/article/maximizing-game-feel-in-action-game-development) · [The "Juice" Factor](https://hackread.com/the-juice-factor-designing-game-feel/) · [The Juice Problem — Wayline](https://www.wayline.io/blog/the-juice-problem-how-exaggerated-feedback-is-harming-game-design)
- [Rogue Wave devlog — wave pacing](https://bearlikelion.itch.io/mpdc/devlog/212005/survival-waves-reworked) · [CoH3 Final Stand](https://companyofheroes3.wiki/guides/final-stand/) · [Horde Survivor — Steam](https://store.steampowered.com/app/2738910/Horde_Survivor/)
- [Push Your Luck — BoardGameGeek](https://boardgamegeek.com/boardgamemechanic/2661/push-your-luck) · [The Art of Calculated Risk — Joy Hammer Games](https://www.joyhammergames.com/post/the-art-of-calculated-risk-push-your-luck-in-games) · [Mechanic Spotlight: Push-Your-Luck](https://gameideas.net/blog/push-your-luck)
- [Mobile Gaming Trends 2026 — AppFollow](https://appfollow.io/blog/mobile-gaming-trends-2026)
