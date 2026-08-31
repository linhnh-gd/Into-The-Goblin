# Audit Report -- INTO THE GOBLIN

> File nay do `audit_gdd.ps1` sinh ra. KHONG sua tay.

**PASS 58 / WARN 2 / FAIL 0** trong 60 check.

| Nhom | Trang thai | Check | Chi tiet |
|---|---|---|---|
| LOAD | **PASS** | Moi dataset load duoc va khong rong | weapons=30, enemies=21, bosses=7, affixes=7, waves=19, depths=7, roomTypes=8, events=8, cards=50, relics=12, talents=24, currencies=6, shop=13, buildings=12 |
| ID | **PASS** | Moi id la duy nhat (toan bo dataset) | 198 id; trung: khong |
| ID | **PASS** | Quy uoc prefix id (docs/16 muc 2) | sai prefix: khong |
| REF | **PASS** | waves.json: moi enemy id ton tai | 19 template; sai: 0 |
| REF | **PASS** | depths.json: enemy/boss/weapon id ton tai | 7 depth; sai: 0 |
| REF | **PASS** | bosses.drops: weapon id ton tai | sai: 0 |
| REF | **PASS** | blackMist.spawnEnemy ton tai | en_special_bongham |
| REF | **PASS** | combo unlock tro dung ca hai chieu | 5 combo; sai: 0 |
| REF | **PASS** | Khong co quai orphan (khong wave template nao dung) | orphan: khong |
| ECON | **PASS** | GATE: moi currency co >=1 source VA >=1 sink | 6 currency: gold, luck, shards, ingots, gems, tickets |
| ECON | **PASS** | shop: price > 0 va currency ton tai | 13 item; sai: 0 |
| ECON | **PASS** | tickets KHONG gate Depth 1-7 / Endless (docs/11 muc 6.5) | bi gate: khong |
| ECON | **PASS** | expectedGoldG0 >= 2 x (dan re nhat + mau re nhat) -- shop phai dung duoc | nguong = 480 vang; thieu: 0 |
| ECON | **PASS** | expectedGoldG0 khai bao khop mo hinh tinh tu data (+-40%) | d1 tinh=1400 khai=1400 / d2 tinh=3100 khai=3100 / d3 tinh=5450 khai=5450 / d4 tinh=8650 khai=8650 / d5 tinh=13150 khai=13150 / d6 tinh=19450 khai=19450 / d7 tinh=31900 khai=31900; lech: 0 |
| ECON | **PASS** | goldCurve tang don dieu theo moc | 8 moc, cao nhat 600000 |
| ECON | **PASS** | goldCurve = tong tich luy expectedGoldG0 (khong co he so nhan an) | 8 moc; lech: 0 |
| ECON | **PASS** | Loc ton tai, la currency pham vi run, co source va sink | type=run, 7 source, 3 sink |
| WPN | **PASS** | Moi vu khi nam trong tolerance cua dpsTarget(tier) | 30 vu khi; lech: 0 |
| WPN | **PASS** | TTK trash <= 0.60s cho moi vu khi tam xa | qua cham: khong |
| WPN | **PASS** | Luon con >=1 nhat chem trong 1.4s khi stamina can (regen*1.4 >= staminaCost) | vi pham: khong |
| WPN | **PASS** | Co it nhat 1 vu khi T1 one-shot trash o Depth 1 | one-shot: rw_pistol_kendong, rw_shotgun_mienghang |
| WPN | **PASS** | GATE P2: khong bang dan nao don sach ca wave (magClearRatio <= 1.0) | vi pham: 0 |
| WPN | **WARN** | magClearRatio trong [0.45, 0.70] (y do thiet ke) | ngoai khoang: rw_shotgun_mienghang T1 0.89, rw_smg_ochuot T1 0.75, rw_shotgun_longmoc T2 0.76, rw_lmg_trongdoi T3 0.72, rw_launcher_noidat T4 0.42, rw_smg_muikim T4 0.22, rw_shotgun_hamtoi T5 0.19, rw_acid_ruotdat T5 0.37, rw_launcher_ongsam T5 0.27, rw_deeptech_loino T6 0.11, rw_deeptech_miengmo T6 0.14, rw_minigun_ruotsat T6 0.23 |
| WPN | **WARN** | Du tru du 6-9 wave neu khong melee | ngoai khoang: rw_rifle_matcu 2.9, rw_lmg_trongdoi 4.3, rw_flamer_hoingam 4, rw_launcher_noidat 2.5, rw_smg_muikim 1.5, rw_sniper_dinhsat 3.7, rw_shotgun_hamtoi 1.3, rw_acid_ruotdat 2.2, rw_launcher_ongsam 1.6, rw_deeptech_loino 0.7, rw_deeptech_miengmo 1, rw_minigun_ruotsat 1.4 |
| WPN | **PASS** | Melee DPS >= 1.30 x ranged DPS o cung tier (docs/05 muc 8.3) | so sanh 6 tier; vi pham: 0 |
| WPN | **PASS** | Moi Depth 1-5 mo it nhat 1 cong cu dan cach (kb >= 1.0) | thieu: khong |
| WPN | **PASS** | Moi vu khi duoc mo o mot Depth nao do | khong co duong mo: khong |
| ENEMY | **PASS** | Moi quai co tpCost/goldDrop/hp/sfxSpawn/counters/mechanic | 21 quai; thieu: 0 |
| ENEMY | **PASS** | behavior block day du va hop le (shield / slam) | 2 quai co hanh vi rieng: en_special_khien=shield, en_heavy_ogreham=slam |
| ENEMY | **PASS** | Depth 1-2: khong quai nao kbResist > 0.20 (day co che truoc khi pha) | vi pham: 0 |
| ENEMY | **PASS** | Moi Depth gioi thieu 1-3 loai quai moi | sai: 0 |
| ENEMY | **PASS** | introDepth khop giua enemies.json va depths.json | lech: 0 |
| ENEMY | **PASS** | Affix excludes doi xung (Chai San vs Da Cung) | 7 affix; sai: 0 |
| BOSS | **PASS** | Boss: TTK 40-80s, >=2 phase, co cua so bat buoc dung dao, kbResist=1.0 | 7 boss; sai: 0 |
| BOSS | **PASS** | Moi Depth co dung 1 boss | sai: khong |
| ESCAL | **PASS** | GATE: data khong con co che Greed/Bell cua Guns 'n Goblins (chi lay feel mat do quai) | quet 12 file; ro ri: khong |
| ESCAL | **PASS** | Scaling quai khong co dial nguoi choi dieu khien | khoa: hpPerRoom, dmgPerRoom, speedCap, hpPerWave |
| ESCAL | **PASS** | Do kho tu tang: hpPerRoom > 1.0 VA hpPerWave > 0 (theo docs goc: do kho moi wave tang dan) | hpPerRoom=1.068 / dmgPerRoom=1.055 / hpPerWave=0.06 |
| ESCAL | **PASS** | Cam giac dong (>=60 con/wave) dat duoc truoc phong R20 | wv_thuytrieu: dat o R6 (he so 1.59 con/TP; R1 = 29 con, R10 = 89 con) |
| ESCAL | **PASS** | Hard cap cho phep >= 150 quai song cung luc (feel tham chieu tu Guns n Goblins) | maxTotalAlive=240, fullAI=40 |
| ESCAL | **PASS** | Affix chi bat dau tu Depth 4 (day co che truoc khi pha) | affix som: khong |
| FORK | **PASS** | Nga Ba Ham: moi Cong (tru phong 1/9/10) co >= 2 cua | sai: 0 |
| FORK | **PASS** | Nga Ba co bien bao (>=4 tag) va rang buoc an tinh | 8 tag / 4 rang buoc |
| WAVE | **PASS** | composition weight cong lai = 1.0 | 19 template; sai: 0 |
| WAVE | **PASS** | So loai quai / wave <= 4 | vi pham: 0 |
| WAVE | **PASS** | Wave khong dung quai truoc introDepth cua no | sai: 0 |
| ROOM | **PASS** | Layout Depth co >=1 Shop va 1 Boss | combat > combat > random > combat > elite > random > combat > combat > shop > boss |
| ROOM | **PASS** | Layout Depth co dung 10 phong | 10 phong |
| ROOM | **PASS** | Tong tan suat roomTypes ~ 1.0 | tong = 1 |
| ROOM | **PASS** | Suong Den mien tru phong Boss / Shop / Mieu | boss, shop, shrine |
| TALENT | **PASS** | Talent: delta >= 2%, cost tang don dieu theo tung currency, branch ton tai | 24 talent / 120 bac; sai: 0 |
| TALENT | **PASS** | Moi nhanh talent co >=3 talent | nong=6, luoi=6, da=6, den=6; thieu: khong |
| CARD | **PASS** | The: co tag, co effect, rarity hop le, khong the rac | 50 the; sai: 0 |
| CARD | **PASS** | Phan bo rarity co du 4 bac | common=16, rare=18, epic=11, legendary=5 |
| CARD | **PASS** | The cuc manh (delta >= 80%) phai co gia phai tra | khong co gia: khong |
| FEEL | **PASS** | Luat juice: cap rung, do tre input, hitstop, coin chime | shake cap 26px / input 3 frame / 9 hitstop; sai: 0 |
| FEEL | **PASS** | Rung khi chem phai co huong theo vector slide | 3 su kien rung theo vector slide |
| CTRL | **PASS** | Vung chet giua goc chem va goc di chuyen >= 5 do | melee <= 55 deg, move >= 65 deg, dead zone = 10 deg |
| CTRL | **PASS** | Co phuong an thoat cho rui ro R1 (Che do Hai Vung) | ac_haivung ton tai |
| CTRL | **PASS** | Co gesture cho ca tam xa va can chien, va co vung chet | ranged=4, melee=2, deadzone=1 |

WARN = lech y do thiet ke, can playtest quyet dinh. FAIL = vi pham bat bien, build phai dung.
