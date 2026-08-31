# enemies (generated)

> Sinh ra bởi `build_pages.ps1` từ `data/enemies.json`. **KHÔNG sửa tay** — sửa data rồi build lại.

### Quái & Boss

| Tên | ID | Vai trò | Xuất hiện | HP | Damage | Tốc độ | Kháng KB | TP | Vàng | Cơ chế | Cách xử lý |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Bóng Hầm | en_special_bongham | special | D1 | - | 8 | 2.6 | 0.30 | - | - | Sinh ra bởi Sương Đen. KHÔNG GIẾT ĐƯỢC — chỉ knockback được. Chạm gây 8 damage + tối màn 0.3s | Dọn sạch phòng nhanh hơn. Đây không phải kẻ địch, đây là đồng hồ đếm |
| Goblin Cùi | en_trash_goblincui | trash | D1 | 40 | 6 | 2.2 | - | 1.0 | 3 | Đi thẳng tới người chơi, vung tay ở 1.2m | Bất cứ gì. Đây là nền để nổ vàng và nuôi combo. |
| Goblin Bầy | en_trash_goblinbay | trash | D1 | 18 | 4 | 2.8 | - | 0.8 | 2 | Luôn spawn theo cụm 8 con, đi sát nhau | Chém Hoàn Hảo — cụm này tồn tại để bị quẹt một nhát |
| Goblin Chạy | en_trash_goblinchay | trash | D1 | 26 | 5 | 4.4 | 0.10 | 1.2 | 4 | Chạy rất nhanh, lao thẳng qua dải Giữa không dừng | Chém quét hoặc shotgun — không kịp nhắm từng con |
| Tướng Goblin | en_elite_tuonggoblin | elite | D2 | 700 | 30 | 2.2 | 0.70 | 12.0 | 60 | Có 2 affix ngẫu nhiên. Hô hào: mọi trash trong phòng +20% damage. Rơi Chìa Khoá | Dồn burst damage, dùng relic/ultimate |
| Goblin Ném Đá | en_ranged_nemda | ranged | D2 | 34 | 12 | 1.8 | 0.15 | 2.0 | 6 | Đứng ở dải Xa ném đá theo đường vòng cung, tốc độ 11 m/s | Phải tiến lên hoặc bắn tỉa — không được rùa tại chỗ |
| Goblin Thuốc Nổ | en_special_thuocno | special | D2 | 30 | 25 | 3.0 | 0.05 | 2.2 | 6 | Lao vào rồi tự nổ bán kính 3m. Bình nổ trên lưng bắn được — nổ sớm gây 25 damage lên đồng bọn | Knockback hoặc bắn bình nổ khi nó còn ở dải Giữa |
| Ogre Hầm | en_heavy_ogreham | heavy | D3 | 320 | 26 | 1.4 | 0.85 | 6.0 | 20 | Gần như không đẩy được. Đập đất gây AoE 2.5m, telegraph 0.6s có vòng cảnh báo trên sàn | Kite bằng Bước Lùi ra khỏi vòng, bắn yếu điểm ở bụng (x2.0) |
| Goblin Khiên | en_special_khien | special | D3 | 90 | 10 | 1.6 | 0.55 | 3.0 | 7 | Khiên chắn chính diện: damage tầm xa x0.3, kbResist 0.55 (sau lưng chỉ 0.05). Vung khiên mỗi 4s, hở 0.8s | Búa (bỏ qua khiên), chém nặng, axit, hoặc đánh khi nó vung khiên, hoặc Xốc Tới vòng ra sau lưng |
| Tên Đồ Tể | en_elite_dote | elite | D4 | 900 | 45 | 3.2 | 0.75 | 14.0 | 80 | Lao tới dải Cận chiến và ở đó. Móc câu kéo người chơi lại gần từ 6m | Giữ khoảng cách bằng shotgun/chuỳ, đừng đấu dao với hắn |
| Dơi Hầm | en_special_doiham | special | D4 | 22 | 7 | 3.6 | 0.40 | 1.6 | 5 | Bay ở độ cao 2–4m, lao xuống theo đường chéo. Bị đẩy cả trục dọc (bay lên nhìn rất sướng) | Bắn, hoặc chém chéo lên — chém ngang không tới |
| Goblin Đào Hầm | en_special_daoham | special | D4 | 45 | 14 | 3.4 | 0.20 | 2.4 | 8 | Trồi lên từ sàn PHÍA SAU người chơi sau 2.5s, có tiếng đất nứt báo trước 0.8s | Bước Lùi rồi quay chém — dạy người chơi rằng phía sau cũng tồn tại |
| Ổ Vàng | en_elite_omvang | elite | D5 | 800 | 25 | 2.6 | 0.65 | 15.0 | 100 | Ăn mọi đồng vàng rơi trên sàn. Sau 25s nó bỏ chạy qua cửa và mang theo toàn bộ số vàng đã ăn. Giết được thì nhả ra x1.5 | Chọn: rượt nó (bỏ mặt trước) hay giữ hàng và chấp nhận mất vàng |
| Goblin Trống | en_support_trong | support | D5 | 70 | 6 | 2.0 | 0.20 | 3.2 | 12 | Đứng ở dải Xa gõ trống: đồng bọn trong 12m được +35% tốc độ di chuyển | Ưu tiên giết — dạy người chơi chọn mục tiêu thay vì bắn con gần nhất |
| Pháp Sư Xanh | en_support_phapsuxanh | support | D5 | 70 | 15 | 1.8 | 0.25 | 3.6 | 12 | Tạo khiên năng lượng cho 3 đồng bọn gần nhất (hấp thụ 60 damage). Khiên vỡ có tiếng riêng | Giết trước, hoặc dùng AoE để phá nhiều khiên cùng lúc |
| Đầu Bò Đá | en_heavy_daubo | heavy | D6 | 260 | 32 | 5.2 | 0.80 | 5.4 | 18 | Đứng gầm 1.2s rồi lao thẳng hết hành lang. Đâm tường thì choáng 2s | Bước Lùi sang bên và để nó đâm tường — rồi chém lúc nó choáng |
| Goblin Béo | en_heavy_goblinbeo | heavy | D6 | 200 | 18 | 1.5 | 0.60 | 4.6 | 16 | Khi chết nổ ra 6 con Goblin Bầy tại chỗ | Giết khi nó còn ở dải Xa — giết ở gần là tự tạo ra một wave nữa |
| Goblin Nỏ | en_ranged_no | ranged | D6 | 40 | 20 | 2.0 | 0.15 | 2.6 | 9 | Bắn thẳng, tốc độ 14 m/s, có tia laser đỏ báo trước 0.5s | Đổi mục tiêu ưu tiên khi thấy tia laser, hoặc dùng vật cản |
| Quỷ Hầm | en_heavy_quyham | heavy | D7 | 520 | 40 | 1.6 | 0.90 | 8.0 | 30 | Bắt người chơi 1.2s (khoá cả tap và slide), phải quẹt liên tục 4 lần để thoát | Không để nó vào dải Cận chiến. Đây là bài kiểm tra cuối của knockback |
| Goblin Lửa | en_special_goblinlua | special | D7 | 60 | 16 | 2.6 | 0.20 | 3.0 | 10 | Để lại vũng lửa 4s ở nơi nó đi qua. Chết nổ vũng lửa bán kính 2.5m | Giết ở xa, hoặc dùng knockback đẩy nó ra khỏi đường đi của mình |
| Thầy Mo | en_support_thaymo | support | D7 | 110 | 10 | 1.7 | 0.30 | 4.4 | 14 | Mỗi 6s hồi sinh 1 kẻ địch đã chết trong 8m với 50% HP. Có cột sáng xanh khi đang niệm (1.2s) | Giết trong lúc niệm, hoặc kéo xác ra xa bằng knockback |

### Quái & Boss

| Tên | Depth | HP | TTK mục tiêu | Các phase | Cửa sổ dao | Rơi ra | Dạy gì |
|---|---|---|---|---|---|---|---|
| Goblin Vương Béo | D1 | 2600 | 50s | P1: Lăn ngang hành lang, nhả 4 Goblin Bầy mỗi 8s. Yếu điểm: bụng phát sáng khi nó dừng lăn  //  P2 (dưới 50% HP): Nôn vũng axit chặn 40% chiều ngang, buộc di chuyển  //  P3 (chỉ Elite Depth): Chia thành 2 con nhỏ, mỗi con 30% HP, cùng lăn | Sau mỗi lần lăn nó choáng 1.5s — chỉ chém được, súng bị nó chắn | mở Depth 2, 3 Phôi Rèn, 1 relic ngẫu nhiên, rw_shotgun_longmoc | Bắn yếu điểm, và phải dùng cả dao |
| Đôi Song Sinh Rỉ | D2 | 4200 | 55s | P1: 2 con chia sẻ thanh HP. Đứng hai bên, ném lưỡi câu xen kẽ  //  P2 (một con chết): Con còn lại điên máu +60% tốc độ, +40% damage  //  P3 (chỉ Elite Depth): Hai con hợp thành một, HP hồi 30% | Lưỡi câu bị chém đứt được — chém đúng lúc thì nó tự trúng đòn | mở Depth 3, 4 Phôi Rèn, mw_twinblade_songdao | Chọn mục tiêu và quản lý thứ tự giết |
| Tường Khiên Sống | D3 | 6800 | 60s | P1: Khiên chắn 90% damage chính diện. Mở khiên 2.0s sau mỗi 4 đòn nó đánh  //  P2 (dưới 55%): Sinh 3 Goblin Khiên làm hàng rào di động  //  P3 (chỉ Elite Depth): Khiên phản 30% damage tầm xa về người chơi | Cửa sổ 2.0s là lúc duy nhất damage vào đủ — phải sẵn sàng burst | mở Depth 4, 5 Phôi Rèn, rw_rifle_matcu | Kiên nhẫn và timing — không phải trận nào cũng spam được |
| Nhện Trần Hầm | D4 | 9500 | 62s | P1: Bám trần, thả xuống theo đường thẳng đứng. Hoàn toàn miễn knockback  //  P2 (dưới 60%): Tơ khoá màn hình 1.0s (không tap, không slide) mỗi 12s  //  P3 (chỉ Elite Depth): Vô hình giữa các đòn, chỉ thấy 8 mắt đỏ | Khi nó thả xuống chém được chân — cắt 1 chân giảm 20% tốc độ | mở Depth 5, 6 Phôi Rèn, rw_sniper_dinhsat | Sống mà không có công cụ knockback |
| Ogre Mỏ | D5 | 13500 | 65s | P1: Đập trụ chống hầm. Mỗi 20s một phần trần sập: hành lang hẹp lại 15% (tối đa 3 lần) — càng đánh lâu càng ít chỗ lùi  //  P2 (dưới 50%): Sóng xung hình vòng từ chân, phải Bước Lùi đúng lúc  //  P3 (chỉ Elite Depth): Cướp 1 thẻ nâng cấp của người chơi cho tới hết trận | Chém được xà chống nó đang cầm để chặn lần đập tiếp theo — súng không phá được xà | mở Depth 6, 7 Phôi Rèn, rw_deeptech_loino, mw_deeptech_luoiloi | Áp lực thời gian — và rằng không gian cũng là tài nguyên |
| Vua Xác Vàng | D6 | 18000 | 68s | P1: Ăn vàng trên sàn để hồi 1% HP mỗi 100 vàng. Người chơi phải hút vàng trước nó  //  P2 (dưới 55%): Nhả vàng thành đạn, 18 damage mỗi đồng  //  P3 (chỉ Elite Depth): Toàn bộ vàng trên sàn biến thành Goblin Bầy | Lúc nó cúi xuống ăn vàng: bất động 1.4s, chỉ chém được (miệng chắn đạn) | mở Depth 7, 8 Phôi Rèn, rw_minigun_ruotsat | Bỏ tham đúng lúc — bài học ngược của cả game |
| MẸ MỎ | D7 | 26000 | 70s | P1: Khối thịt-quặng gắn vào vách hầm, treo bằng 4 gân rễ. Phải CHÉM đứt cả 4 — đạn không cắt được gân  //  P2 (2 gân đứt): Nhả ra bóng của 6 boss trước, mỗi con 15% HP gốc  //  P3 (chỉ Elite Depth): Đảo ngược điều khiển 5s — tap thành chém, quẹt thành bắn | Toàn bộ phase 1 là melee-check. Đây là lý do game bắt ngươi học dao từ phút đầu | mở Endless, 12 Phôi Rèn, mw_greatsword_xelong, rw_deeptech_miengmo, skin Sập Hầm | Tổng hợp: tap, slide, knockback, quản lý tài nguyên, và giữ bình tĩnh khi hầm đầy quái |

### Quái & Boss

| Tên | ID | Hiệu ứng | Tín hiệu |  |
|---|---|---|---|---|
| Bọc Giáp | af_bocgiap | +60% HP, kbResist +0.30 | vảy kim loại sáng bạc | G |
| Điên Máu | af_dienmau | +45% tốc độ khi HP < 50% | vệt đỏ kéo theo | G |
| Chai Sạn | af_chaisan | -40% damage nhận từ vũ khí tầm xa | khói xám quanh người | G |
| Da Cứng | af_dacung | -40% damage nhận từ vũ khí cận chiến | vỏ đá trên vai | G |
| Nổ Xác | af_noxac | Chết nổ AoE 20 damage bán kính 2.5m | bụng phát sáng đỏ | G |
| Hút Vàng | af_hutvang | Ăn vàng trên sàn; giết lại nhả ra x2 | vàng bám quanh người | G |
| Bóng Đôi | af_bongdoi | Khi chết sinh 1 bản sao 30% HP | có bóng mờ lệch nửa nhịp | G |

