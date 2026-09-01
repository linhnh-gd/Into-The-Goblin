# 14 — UI / UX (portrait, một tay)

Nguyên tắc gốc: **màn hình là vùng chiến đấu, không phải bảng điều khiển.** Mọi HUD phải nằm ngoài
vùng ngón tay hoạt động và ngoài vùng quái xuất hiện.

---

## 1. Layout HUD trong combat

```
+---------------------------------------+  <- safe area top
| [LỘC 8]  [D3-R7] [MÉT 73/150] HP [||] |  0-8%   : Lộc + vị trí + quãng đường + HP
|                                       |
|                                       |
|          DẢI XA (quái silhouette)     |  8-40%  : không đặt UI gì ở đây
|                                       |
|                                       |
|- - - - - - - - - - - - - - - - - - - -|
|                                       |
|         DẢI GIỮA / CẬN CHIẾN          |  40-75% : vùng quái tới gần
|              ( O )  <- tâm ngắm 62%   |           NGÓN TAY HOẠT ĐỘNG Ở ĐÂY
|               0.8s     + vòng nhịp bắn|
|- - - - - - - - - - - - - - - - - - - -|
|      ||||||||||||-----                |  77-83% : BĂNG ĐẠN (mỗi vạch = 1 viên)
|            12 / 48  ĐANG NẠP         |           + số đạn + trạng thái
|          [====        ]              |  84-88% : STAMINA (cùng cột, không ở góc)
| VÀNG 1,240                            |  90-96% : vàng (đọc lúc rảnh)
| [NẠP]                                 |  96-100%: nút phụ (đường tắt)
+---------------------------------------+  <- safe area bottom
```

| Vùng | % chiều cao | Nội dung | Luật |
|---|---|---|---|
| Top bar | 0–8% | Lộc, vị trí `D3-R7`, mét đã chạy, HP, pause | Không bao giờ che bởi hiệu ứng |
| Vùng chiến đấu | 8–75% | Chỉ game | Tâm ngắm ở **62%** (thấp hơn giữa, vì ngón tay đến từ dưới) |
| Vòng nhịp bắn | quanh tâm ngắm | Vòng tròn đường kính 48px, viền 2.6px | Chỉ hiện khi nhịp ≥ 0.25s. Số giây chỉ hiện khi nhịp ≥ 0.5s |
| **Băng đạn** | **77–83%** | Vạch đạn + số đạn + `ĐANG NẠP`/`HẾT BĂNG` | **Ngay dưới dải cận chiến**: không che quái, vẫn trong tầm liếc mắt |
| **Đang nạp** | thay chỗ băng đạn | Vòng tròn 64px **xoay** + cung tiến độ + vạch xanh Nạp Hoàn Hảo | Nạp = không bắn được: phải là thứ to nhất trong cột, xem mục 7c |
| **Stamina** | **84–88%** | Hiện khi chém, fade 2s | **Cùng cột với đạn**, không ở góc: nó gác việc còn chém được hay không |
| Viền màn hình | rìa | Chớp đỏ khi trúng đòn · đập đỏ khi HP < 35% · tím khi Sương Đen | Kênh riêng cho **sinh tồn**, xem mục 7e |
| Vàng | 90–96% | | Thông tin **không** cần trong lúc đánh — góc dưới là đúng chỗ của nó |
| Nút | 96–100% | Chỉ 1 nút `NẠP`, và chỉ là đường tắt | Nạp Hoàn Hảo chạm được ở **bất kỳ đâu** trên màn hình |

**Camera chúi 8°** để quái ở dải Cận chiến rơi vào 45–75% chiều cao — trên vùng ngón tay che.

## 2. Màn hình Cổng (xem `08` mục 3)

Đây là màn hình duy nhất được phép "chậm". Cấu trúc từ trên xuống:
3 thẻ nâng cấp → dòng Lộc & vàng → **2 tấm biển cửa** (loại phòng + tag + số quái dự kiến).

## 3. Vùng ngón cái (thumb zone)

```
   Bàn tay phải giữ máy, ngón cái quét được:
        ______________
       |              |   <- không tới được (chỉ để hiển thị)
       |              |
       |      ____    |
       |    /      \  |   <- vùng ngón cái thoải mái (55-100% cao, 20-100% ngang)
       |   |  OK   |  |      -> mọi nút bấm & mọi thẻ chọn phải ở đây
       |    \_____/   |
       |______________|
```

Mọi nút tương tác (thẻ, ĐI TIẾP, GÕ CHUÔNG, reroll, shop) phải nằm trong **55–100% chiều cao**.
Thông tin chỉ để đọc thì đặt trên. Đây là quy chuẩn mobile 2026: thiết kế theo tầm ngón, không theo tính đối xứng.

## 4. Meta screen (ngoài run)

| Screen | Nội dung | Ghi chú |
|---|---|---|
| **Cửa Hầm** (home) | Nút CHƠI khổng lồ, loadout 2 slot, Depth khởi đầu, vàng/mảnh | **Nút CHƠI phải ở vùng ngón cái**, tới gameplay ≤ 2 tap |
| **Lò Rèn** | Vũ khí: level, XP bar, tier, khắc | Bar XP mỗi vũ khí luôn thấy → "còn 400 XP nữa" |
| **Cây Thợ Hầm** | 4 nhánh talent | Hiện % power thực của mỗi bậc (chống cảm giác talent rác) |
| **Trại Mỏ** | 12 building 2.5D, thu idle gold | Có nút "Thu tất cả" |
| **Nhiệm vụ** | Daily 3 + Weekly 5 + Sổ Thợ Hầm | |
| **Xếp hạng** | Endless: số phòng × (1 + Lộc/20) | Hiện replay top 10 |

**Từ mở app tới phát bắn đầu tiên: ≤ 10 giây, ≤ 2 tap.** Kiểm tra mỗi build.

## 5. Onboarding (xem `03` mục 6 cho chi tiết gesture)

| Bước | Mở cái gì | Khi nào |
|---|---|---|
| 1 | Tap bắn | giây 0 |
| 2 | Hold bắn | giây 2 |
| 3 | Quẹt chém (súng bị khoá script) | giây 4 |
| 4 | Chém Hoàn Hảo + Cướp Đạn | giây 7 |
| 5 | **Ngã Ba Hầm** (2 cửa có biển báo) | giây 12 (Cổng đầu) |
| 6 | Thẻ nâng cấp | Cổng thứ 2 |
| 7 | Shop | phòng 3 |
| 8 | Nạp Hoàn Hảo | phòng 4 (khi reload lần thứ 5) |
| 9 | Trại Mỏ | sau khi clear Depth 1 |
| 10 | Talent | đầu session 2 (D1) |

Không dạy quá 1 cơ chế mỗi 3 giây. Không có tutorial nào có thể skip bằng nút — chúng được thiết kế để
kết thúc trong 2 giây nếu người chơi làm đúng ngay.

## 6. Trạng thái đặc biệt

| Trạng thái | Xử lý |
|---|---|
| Mất kết nối | Chơi bình thường (offline-first). Chỉ leaderboard/shop bị khoá, có báo nhỏ |
| Có cuộc gọi giữa run | Pause tự động, giữ trạng thái, quay lại có đếm 3-2-1 |
| Pin yếu / máy nóng | Tự giảm cap crowd agent xuống 120, giảm hạt 50%, hiện icon nhỏ |
| Người chơi chết | Không popup ngay. Slow-mo 1.2s cảnh chết → **màn hình kết run** (vàng, Lộc cuối, phòng sâu nhất, weapon XP) → nút "Hồi sinh (ad)" và "Về Cổng Hầm" |
| Chết ở Depth ≥ 4 | Có thêm dòng chữ nhỏ ghi lại "câu chuyện": *"Ngươi xuống tới phòng 37. Xác ngươi giờ là mốc cho kẻ sau."* |

---

## 7. Đọc được số trong lúc mắt đang khoá vào quái

Đây là mục sinh ra từ một lời phàn nàn cụ thể: *"2 góc dưới mù mắt không đọc nổi khi đang phải
nhìn chằm chằm vào đống quái đang đến."* Nó đúng, và lý do là sinh học chứ không phải thẩm mỹ.

### 7a. Vì sao góc màn hình không đọc được

Mắt chỉ nhìn **sắc nét** trong khoảng 2° quanh điểm đang nhìn (vùng fovea), và chỉ còn **đọc
được chữ** tới khoảng 5° (vùng parafovea). Ra ngoài đó, thị giác ngoại vi vẫn rất nhạy với
**chuyển động, tương phản và thay đổi hình dạng** — nhưng gần như **không đọc được ký tự**.

Trong game này điểm mắt đang nhìn là **tâm ngắm ở 62% chiều cao**, vì đó là chỗ quái làn giữa
đi tới. Trên điện thoại dọc cầm cách mắt ~30cm, màn hình cao ~13cm phủ khoảng 24° thị trường:

| Vị trí HUD | Cách tâm ngắm | Đọc được không |
|---|---|---|
| Góc dưới trái/phải (cũ) | ~14–18° | **Không.** Phải *chuyển ánh mắt*, mất 0.2–0.3s và mất luôn cảnh quái đang tới |
| Ngay dưới tâm ngắm (78% cao) | ~3–4° | Đọc được bằng cách **liếc**, không cần rời mắt khỏi đám quái |
| Sát tâm ngắm (vòng 48px) | ~1.5° | Đọc được bằng **thị giác trung tâm**, không tốn gì cả |

Một cú liếc xuống góc màn hình trong game này tốn khoảng **nửa giây** cả đi lẫn về. Ở tốc độ
chạy 4.2 m/s thì nửa giây là **2.1 mét** — đủ để một con goblin từ ngoài tầm dao đi vào tận mặt.
Nói cách khác: HUD ở góc màn hình không phải "khó đọc", nó là **một đòn sát thương**.

### 7b. Ba kênh, ba loại thông tin

Không phải thứ gì cũng cần đặt gần tâm ngắm. Luật phân loại:

| Kênh | Đọc bằng gì | Dùng cho | Đặt ở đâu |
|---|---|---|---|
| **Hình dạng** | Ngoại vi cũng thấy | Còn nhiều / sắp hết | Dải vạch đạn — mỗi vạch là 1 viên |
| **Chuyển động** | Ngoại vi rất nhạy | Bao giờ bắn được phát nữa | Vòng tròn quanh tâm ngắm |
| **Con số** | Chỉ đọc được ở trung tâm | Chính xác bao nhiêu viên, còn mấy giây | Ngay dưới tâm ngắm, cỡ chữ ≥ 24px |

Hệ quả trực tiếp: **vàng ở góc dưới là đúng** (không ai cần biết chính xác 1.240 hay 1.260 giữa
lúc đánh), còn **đạn ở góc dưới là sai** — đạn quyết định hành động của chính giây tiếp theo.

### 7c. Ba thứ phải hiển thị, và cách hiển thị

**1. Số đạn còn lại** — dải vạch ở 78% chiều cao, mỗi vạch một viên (trên 24 viên thì vẽ thành
thanh liền, vì quá số đó mắt không đếm được nữa). Vàng → cam khi dưới 30% → đỏ + nhấp nháy khi
hết. Ngay dưới là số to `12 / 48` (băng / dự trữ). Còn 1 viên thì **luôn còn ít nhất 1 vạch
sáng** — làm tròn xuống 0 là nói dối người chơi đúng lúc họ cần tin nhất.

**2. Đang nạp** — **vòng tròn 64px thay chỗ dải vạch**, ba lớp trên cùng một vòng:

| Lớp | Là gì | Nói gì |
|---|---|---|
| Vòng đứt nét **xoay liên tục** | tín hiệu | "đang chờ" — ký hiệu ai cũng đọc được, và **xoay** thì thị giác ngoại vi bắt được ngay cả khi mắt đang khoá vào đám quái |
| Cung vàng chạy | số liệu | còn bao nhiêu phần |
| Vạch xanh trên vòng | mục tiêu | cửa sổ **Nạp Hoàn Hảo** — chạm khi cung vàng chạm vạch xanh |
| Số ở giữa vòng | chính xác | giây còn lại |
| Chữ dưới vòng | trạng thái | `ĐANG NẠP`, hoặc `ĐANG NẠP VIÊN 3/5` với súng nạp từng viên |

Một thanh mảnh 13px **không đủ**: nạp là trạng thái người chơi **không bắn được**, nó phải hét lên,
không phải thì thầm. Và vì cửa sổ xanh chỉ rộng ~0.25s nên nó **bắt buộc** phải nằm trong tầm liếc:
bắt người chơi canh 0.25s ở góc màn hình là bắt họ chọn giữa nạp giỏi và sống sót. Kéo theo một
thay đổi điều khiển: **chạm bất kỳ đâu trên màn hình** đều tính là cú Nạp Hoàn Hảo (20% đầu bỏ qua,
vì đó là cú chạm cuối của loạt bắn vừa rồi chứ không phải ý định nạp).

**3. Nhịp bắn / delay giữa 2 phát** — vòng tròn quanh tâm ngắm chạy đầy dần; đầy = bắn được.
Đây là thông tin *chỉ có nghĩa ngay tại điểm ngắm*, nên nó đi theo tâm ngắm.

| Súng | Nhịp/phút | Delay giữa 2 phát | HUD hiện gì |
|---|---|---|---|
| Ổ Chuột (SMG) | 700 | 0.09s | Không gì — bắn liên thanh, vòng quay sẽ thành nhiễu |
| Gọng Sắt (rifle) | 600 | 0.10s | Không gì |
| Kèn Đồng (súng lục) | 150 | 0.40s | Vòng tròn |
| **Miệng Hang (shotgun)** | **55** | **1.09s** | Vòng tròn **+ số giây đếm ngược** |
| Gai Mực (nỏ) | 51 | 1.18s | Vòng tròn + số giây |

Ngưỡng: vòng tròn từ **0.25s**, số giây từ **0.5s**. Dưới ngưỡng thì HUD nhấp nháy nhanh hơn tốc
độ mắt xử lý, thành nhiễu chứ không thành thông tin. Khi vòng chạy hết, tâm ngắm **nảy một cái**
— với súng chậm, cái nảy đó là tín hiệu quan trọng hơn cả con số, vì ngoại vi bắt được nó.

### 7d. Cột trạng thái, và những gì KHÔNG được ở góc

Áp cùng một câu hỏi cho từng thứ trên HUD — *"nó có quyết định hành động của giây tiếp theo không?"*
— thì ra một cột duy nhất chạy dọc giữa màn hình ngay dưới dải cận chiến:

```
                ( O )  0.8s        <- tâm ngắm + vòng nhịp bắn (62%)
             ||||||||-----          <- băng đạn  (77%)      ] cột
                12 / 48             <- số đạn + trạng thái   ] trạng
             [====      ]           <- STAMINA               ] thái
```

**Stamina chuyển từ góc dưới lên cột này.** Nó gác việc *có chém được nữa hay không* — đúng loại
thông tin của giây tiếp theo, y như đạn. Ở góc dưới nó chỉ là một vệt sáng người chơi không bao giờ
đọc. Vàng thì ngược lại: ở lại góc dưới, vì không ai cần biết chính xác 1.240 hay 1.260 giữa trận.

### 7e. Máu: nói bằng màu ở rìa, không bằng số ở góc

Thanh HP cao 10px nằm trong thanh trên, cách tâm ngắm ~20° — **không đọc được giữa trận**, đúng
cùng một lỗi với đạn ở góc dưới. Nhưng máu không thể dời vào giữa màn hình (nó sẽ đè lên quái).
Nên nó đổi **kênh** thay vì đổi **chỗ**:

| Trạng thái | Tín hiệu | Vì sao đọc được |
|---|---|---|
| Vừa trúng đòn | **Chớp đỏ 0.18s ở viền màn hình** | Rung tay không nói được "mất bao nhiêu"; một viền đỏ thì ngoại vi bắt ngay |
| HP < 35% | **Viền đỏ đập theo nhịp 1.15s**, không tắt | Trạng thái kéo dài phải có tín hiệu kéo dài. Nhịp đập = "đang chảy máu", không cần chữ |
| Sương Đen | Viền tím tối dần | Cùng kênh, khác màu — hai thứ không lẫn nhau |

Luật: **viền màn hình là kênh của trạng thái sinh tồn.** Không dùng nó cho bất cứ thứ gì khác, vì
một kênh mang hai nghĩa là một kênh không mang nghĩa nào.

### 7f. Luật chung rút ra

1. Thông tin quyết định hành động **của giây tiếp theo** thì đặt trong 5° quanh tâm ngắm.
2. Thông tin tổng kết (vàng, Lộc, mét) đặt ở rìa — ở đó nó **không** cạnh tranh với quái.
3. Không đặt gì đặc (nền mờ, khối lớn) trong dải **45–75% chiều cao**: đó là chỗ quái cận chiến
   đứng. HUD trong vùng đó chỉ được là **đường viền mảnh** (vòng nhịp bắn 2.6px).
4. Mọi chữ trên HUD phải có `text-shadow` đen: nền hầm gần như đen nhưng có lúc loé sáng
   (nổ, vàng, muzzle flash), không có viền tối thì chữ vàng biến mất đúng lúc đông nhất.
