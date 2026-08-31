# Audit Report -- INTO THE GOBLIN

> File nay do `audit_gdd.ps1` sinh ra. KHONG sua tay.

**PASS 83 / WARN 1 / FAIL 0** trong 84 check.

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
| ECON | **PASS** | expectedGoldG0 khai bao khop mo hinh tinh tu data (+-40%) | d1 tinh=3150 khai=3150 / d2 tinh=7250 khai=7250 / d3 tinh=12900 khai=12900 / d4 tinh=20350 khai=20350 / d5 tinh=30800 khai=30800 / d6 tinh=44550 khai=44550 / d7 tinh=66500 khai=66500; lech: 0 |
| ECON | **PASS** | goldCurve tang don dieu theo moc | 8 moc, cao nhat 1339000 |
| ECON | **PASS** | goldCurve = tong tich luy expectedGoldG0 (khong co he so nhan an) | 8 moc; lech: 0 |
| ECON | **PASS** | Loc ton tai, la currency pham vi run, co source va sink | type=run, 7 source, 3 sink |
| WPN | **PASS** | Moi vu khi nam trong tolerance cua dpsTarget(tier) | 30 vu khi; lech: 0 |
| WPN | **PASS** | TTK trash <= 0.60s cho moi vu khi tam xa | qua cham: khong |
| WPN | **PASS** | Luon con >=1 nhat chem trong 1.4s khi stamina can (regen*1.4 >= staminaCost) | vi pham: khong |
| WPN | **PASS** | Co it nhat 1 vu khi T1 one-shot trash o Depth 1 | one-shot: rw_pistol_kendong, rw_shotgun_mienghang, rw_smg_ochuot |
| WPN | **PASS** | GATE P2: khong bang dan nao don sach ca wave (magClearRatio <= 1.0) | vi pham: 0 |
| WPN | **WARN** | magClearRatio trong [0.45, 0.70] (y do thiet ke) | ngoai khoang: rw_pistol_kendong T1 0.32, rw_smg_ochuot T1 0.81, rw_rifle_gongsat T2 0.31, rw_crossbow_gaimuc T2 0.1, rw_shotgun_longmoc T2 0.25, rw_rifle_matcu T3 0.1, rw_flamer_hoingam T3 0.26, rw_launcher_noidat T4 0.04, rw_smg_muikim T4 0.13, rw_sniper_dinhsat T4 0.06, rw_shotgun_hamtoi T5 0.09, rw_acid_ruotdat T5 0.35, rw_launcher_ongsam T5 0.03, rw_deeptech_loino T6 0.06, rw_deeptech_miengmo T6 0.06, rw_minigun_ruotsat T6 0.44 |
| WPN | **PASS** | Du tru du 6-9 wave neu khong melee | ngoai khoang: 0 |
| WPN | **PASS** | Melee DPS THAP HON ranged DPS o cung tier (dao nguoc, docs/05 muc 8.3) | so sanh 6 tier; vi pham: 0 |
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
| ESCAL | **PASS** | Cam giac dong (>=60 con/wave) dat duoc truoc phong R20 | wv_thuytrieu: dat o R1 (he so 1.59 con/TP; R1 = 29 con, R10 = 89 con) |
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
| CTRL | **PASS** | Co gesture cho ca tam xa va can chien | ranged=4, melee=2 |
| CTRL | **PASS** | Khong con gesture di chuyen, va khong con vung chet | Bo quet doc thi moi cu quet deu la chem -> vung chet 55-65 do khong con gi de tach. gesture di chuyen=0, vung chet=0 |
| CTRL | **PASS** | Khong con tham so dieu khien chet trong controls.json | meleeAngleMax / moveAngleMin da go: goc quet khong con quyet dinh gi |
| RUN | **PASS** | gamefeel.json co khoi camera + run day du | camera=True run=True |
| RUN | **PASS** | Quai o tapNearM van nam trong dai man hinh cho phep (tap duoc) | con thap nhat (scale 0.74) o 2.40m nam o 72.1% chieu cao man hinh; cho phep 45-75% |
| RUN | **PASS** | Quai ranged o rangedStandoffM van trong dai man hinh | o 8.5m nam o 48.7%; cho phep 45-75% |
| WEAPON | **PASS** | Moi vu khi can chien voi xa hon khoang quai dung (tapNearM + margin) | can >= 2.80m; ngan nhat hien tai = 6.00m |
| WEAPON | **PASS** | Tam can chien ngan hon khoang quai ranged dung | tam dao 6.00m vs rangedStandoffM 8.50m |
| ENEMY | **PASS** | Don AoE trung duoc khi nguoi choi chay qua (khong con Buoc Lui de ne) | impact = max(contactM, attackRange - speed*telegraph) |
| RUN | **PASS** | Lan giua rong hon moi lan ben (yeu cau thiet ke) | lan giua rong 3.60m, moi lan ben 1.45m; hanh lang 9m |
| RUN | **PASS** | Quai lan giua spawn quanh truc, khong trai sat ranh lan | jitter +-0.90m trong lan +-1.80m -> vung 0.90m..1.80m khong co quai nao |
| WAVE | **PASS** | So quai LAN GIUA moi phong (R1) nam trong 60-150 | phong R1: ~149 quai tong, lan giua ~98 (moi de), lan ben ~51 (vang them) |
| WAVE | **PASS** | Tong quai / phong khong vuot cap maxTotalAlive | ~149 quai / phong, cap 240 |
| WEAPON | **PASS** | Vu khi can chien chi khac nhau o dmg (moi thong so khac phai dong nhat) | 12 vu khi can chien; dmg tu 30 den 2151 |
| WEAPON | **PASS** | Moi vu khi can chien chem duoc NHIEU muc tieu (>= 3) | targets = 8 |
| RUN | **PASS** | Lane spring ton tai va separation khong day ngang qua manh | laneSpringPerSec 3.2/s, sepLateralMult 0.35 |
| WAVE | **PASS** | Moi spawn pattern cho du cua so phan ung (quai dung yen) | can spawn xa >= tapNearM + minReactionSec*speedMps = 7.44m |
| RUN | **PASS** | Cua so tu luc thay quai den luc no tut khoi vung tap duoc | (tapFar 14.0 - tapNear 2.4) / chay 4.2 = 2.76s (can >= 1.20s) |
| ENEMY | **PASS** | Quai PLANT co du cua so de vung truoc khi bi chay qua | cua so = (attackRangeM - contactM) / speedMps |
| WAVE | **PASS** | Do dai 1 phong (quang duong / toc do) nam trong 25-60 giay | 150m / 4.2 m/s = 35.7s, chia 3 wave x 50m |
| FEEL | **PASS** | Chem lien tuc co tran: giu toi da 2-5s roi het stamina | stamina 100 / 34 moi giay = 2.94s giu lien tuc; moi con an dmg toi da 1 lan moi 0.22s |
| FEEL | **PASS** | Chem lien tuc yeu hon nhat chem don (khong thay the han) | slideTickDamageMult = 0.62 |
| FEEL | **PASS** | Sung o ngoai du lau de doc duoc trang thai (gunHoldSec >= drawSec) | gunHoldSec 0.30s vs drawSec 0.14s + holsterSec 0.18s |
| WEAPON | **PASS** | Moi archetype tam xa co dac ta so lieu vu khi that | 13 archetype co spec |
| WEAPON | **PASS** | rpm / bang dan / co che khop dac ta vu khi that | kiem 18 sung; 0 lech |
| WEAPON | **PASS** | Moi vien dan du giet trash cung tier (caliberMult >= 1.0) | caliberMult = so lan HP trash. 9mm cua SMG 3.0, 5.56 cua rifle 4.5, .50 cua sniper 24.0 |
| FEEL | **PASS** | Moi archetype co hinh dang vien dan rieng (mau/co/toc do) | khong co vien dan bay ra thi shotgun va rifle nhin GIONG HET nhau du co che da khac; du ca 13 |

WARN = lech y do thiet ke, can playtest quyet dinh. FAIL = vi pham bat bien, build phai dung.
