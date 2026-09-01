# 13 — Game Feel & Juice

Docs: *"Khi giết kẻ địch sẽ bung ra nhiều vàng, feeling đã mắt, vfx bùm bùm"* · *"nếu là vũ khí tầm xa thì
kẻ địch khi chết sẽ đẩy lùi về phía sau"* · *"nếu là vũ khí cận chiến thì xác kẻ địch văng theo chiều slide"*.

Đây là doc quyết định game **bán được hay không**. Với thể loại này, feel *chính là* sản phẩm.
Dữ liệu tham số: `data/gamefeel.json` → `gen-gamefeel.md` (để tune không cần build lại code).

---

## 1. Nguyên lý: ba thứ phải nổ **cùng lúc**

> "Khi một đòn trúng: hit stop đóng băng hành động, màn hình rung **theo trục của đòn**, và hạt bắn ra
> **từ điểm va chạm** — tạo thành một vòng cảm giác thống nhất."

Nếu ba thứ này lệch nhau dù chỉ 2 frame thì cảm giác vỡ. **Tất cả phải trigger trong cùng một frame.**

## 2. Bảng tham số juice

### 2.0 Ngân sách đóng băng — luật đứng trên cả bảng dưới

Hit stop **dừng hẳn cả game** (`timeScale` trả về 0). Bảng 2.1 nói mỗi sự kiện đóng băng bao lâu; mục
này nói **tổng cộng được phép bao nhiêu**. Không có trần thì bảng 2.1 tự phản bội chính nó: giữ tay bắn
liên thanh hay chém liên tục làm hàng loạt sự kiện chồng lên nhau, và ở mật độ đó hit stop **không còn
đọc ra là "đã"** — nó đọc ra là **máy giật**.

| Số (`gamefeel.json` → `hitstopRules`) | Giá trị | Việc |
|---|---|---|
| `maxFrac` | **0.08** | Tối đa **8%** thời gian THỰC được đóng băng. Hồi 0.08s ngân sách cho mỗi giây thực |
| `bucketSec` | 0.20 | Burst tối đa — đủ chứa cú Chém Hoàn Hảo 7 frame mà không bị cắt |
| `minGapSec` | 0.13 | Hai lần đóng băng phải cách nhau — **luôn có nhịp SỐNG** ở giữa |

Đo được trước khi có trần: giữ tay bắn rifle → **21% số frame** bị đóng băng, chém liên tục → **20%**.
Trường hợp bệnh lý (mỗi frame một tick slide) làm game **đứng hẳn**. Sau khi có trần: 8%, và con số đó
là **bảo đảm của thiết kế**, không phải kết quả may mắn của một lần tune.

Hai luật đi kèm, quan trọng ngang cái trần:

1. **Chém trượt thì KHÔNG đóng băng.** Dừng cả màn hình để nói "bạn vừa trượt" là lấy thứ đắt nhất
   trong game trả cho thứ rẻ nhất.
2. **Nhát slide chỉ đóng băng khi CÓ MẠNG.** Mỗi đoạn rê tay là một tick; đóng băng mọi tick thì cả
   màn hình giật suốt cú quẹt.

Cú đánh lẻ tẻ vẫn ăn nguyên hit stop trong bảng 2.1 — chỉ bắn/chém liên tục mới bị cắt.

### 2.0b. Hit stop KHÔNG được đánh thuế lên nhịp bắn

Hit stop đóng băng bằng cách trả `dt = 0`. Nếu **mọi** đồng hồ đều nằm sau `if (dt > 0)` thì đồng
hồ vũ khí cũng đứng theo — và ra một hệ quả ngược đời:

> Càng trúng nhiều quái → càng nhiều hit stop → **súng càng bắn chậm**.

Nghĩa là vũ khí yếu đi đúng lúc đông quái nhất, còn bắn hụt vào khoảng không thì đạt tốc độ tối đa.
Đo được: rifle 600 rpm (nhịp lý thuyết **10 phát/giây**) chỉ ra **7–8 phát**, và con số đó bám theo
tỉ lệ đóng băng từng giây. Người chơi đọc ra là *"mấy giây đầu bắn chậm hơn lúc sau"* — vì ngân sách
đóng băng đầy nhất ở đầu mỗi đợt giao tranh.

**Luật:** hit stop là hiệu ứng **trình diễn**, nó dừng thế giới chứ không dừng **đồng hồ của người
chơi**. Các đồng hồ sau chạy theo **thời gian thực** ngay cả trong hit stop:

`fireCd` · `swingCd` · thời gian nạp đạn · cooldown né/xốc · i-frame · cooldown tiếng cò khan.

**Slow-mo thì ngược lại** — nó là một nhịp kịch được thiết kế (Chém Hoàn Hảo, dọn sạch phòng), chậm
lại là *có ý*, nên nó vẫn scale mọi thứ như thường.

Kèm một chi tiết nhỏ nhưng đủ nuốt một phát bắn mỗi giây: cổng `fireCd > 0` phải có **epsilon**.
`0.1s − 6 × (1/60)` ra một số dương tí hon do dấu phẩy động, và cái số đó làm rifle mất đúng 1 phát
mỗi giây. Cộng thêm: khi bắn thì **cộng dồn** `fireCd += fireInterval` (giữ phần đã quá hạn, chặn ở
nửa nhịp) chứ không gán cứng — gán cứng thì mọi nhịp bị làm tròn lên theo frame.

Đo lại sau khi sửa: rifle **10/10/10/10/10/10 phát mỗi giây**, và **bằng nhau** dù bắn vào khoảng
không (0% đóng băng) hay vào giữa đám quái (10–22% đóng băng).

### 2.1 Hit stop (đóng băng khi va chạm)

| Sự kiện | Frame đóng băng (60fps) | Timescale |
|---|---|---|
| Đạn trúng trash | 2 | 0.0 |
| Đạn headshot | 4 | 0.0 |
| Shotgun trúng ≥3 con | 5 | 0.0 |
| Chém nhẹ trúng | 3 | 0.05 |
| Chém nặng trúng | **5** | 0.0 |
| **Chém Hoàn Hảo** | 7 (0.12s) | 0.35 (slow-mo, không đóng băng hẳn) |
| Kill con cuối của wave | — | 0.4 trong **0.35s** |
| Người chơi bị trúng | 3 | 0.0 + flash đỏ viền |
| Boss vào phase mới | 12 | 0.0 + zoom 1.1x |

Nguồn: hit stop 3–5 frame là ngưỡng chuẩn để não kịp ghi nhận cú đánh.

### 2.2 Screen shake (rung có hướng, tắt theo hàm mũ)

| Sự kiện | Biên độ (px @1080w) | Thời gian | Hướng |
|---|---|---|---|
| Bắn súng lục | 3 | 0.06s | dọc (giật nòng) |
| Bắn shotgun | 14 | 0.16s | dọc + xoay 1.2° |
| Bắn liên thanh | 2 / phát (tích luỹ, cap 9) | liên tục | ngẫu nhiên nhỏ |
| Chém nhẹ | 5 | 0.08s | **theo vector slide** |
| Chém nặng | 16 | 0.18s | theo vector slide |
| Chém Hoàn Hảo | 20 | 0.22s | theo vector slide + flash trắng 1 frame |
| Người chơi bị trúng | 12 | 0.20s | từ hướng bị đánh (dạy người chơi quái ở đâu) |
| Boss đập đất | 26 | 0.35s | dọc |
| Mở cửa ở Ngã Ba Hầm | 10 | 0.45s | dọc, một nhịp nặng |

**Bắt buộc:** tắt dần theo hàm mũ (`amplitude *= 0.86` mỗi frame), camera về đúng vị trí gốc trong ≤ 0.35s.
Rung mà không tắt nhanh = mất khả năng đọc, và đó là cái bẫy phổ biến nhất của "juice quá tay".

### 2.3 Cái chết của quái

| Loại kill | Xác | Hạt | Vàng |
|---|---|---|---|
| Đạn thường | Bay **ngược về sau** theo vector đạn, ragdoll 1.2s | 12 hạt máu xanh đen theo vector | 3–6 đồng |
| Headshot | Đầu nổ, thân quỳ rồi ngã | 20 hạt + mảnh xương | 5–8 đồng |
| Shotgun gần | Bay 3–4m, đập tường bật lại | 26 hạt hình nón | 6–10 đồng |
| Chém nhẹ | Đứt đôi theo **đúng đường quẹt**, 2 nửa bay theo vector slide | 18 hạt dọc đường cắt | 4–7 đồng |
| Chém nặng | Bay 6–8m theo vector slide, xoay | 30 hạt | 8–14 đồng |
| Nổ (exploder/AoE) | Bay tứ tán | 40 hạt + khói | 6–12 đồng |
| Cột vàng (`G≥5`) | Xác tan thành vàng | cột sáng 3m | **25x** |

**Đường cắt phải khớp đường quẹt.** Đây là chi tiết mà người chơi không nói ra được nhưng cảm nhận ngay:
nếu quẹt chéo mà xác đứt ngang thì cảm giác "game rẻ tiền".

### 2.4 Âm thanh (thứ tự ưu tiên khi trộn)

| Ưu tiên | Âm | Ghi chú |
|---|---|---|
| 1 | Coin chime ladder | Mỗi đồng liên tiếp trong 1.5s **tăng nửa cung**, cap 2 quãng tám, reset sau 1.5s. **Vũ khí gây nghiện số 1** |
| 2 | Impact cận chiến | Layer: lưỡi cắt thịt + xương gãy + vải xé. 4 biến thể ngẫu nhiên chống lặp |
| 3 | Súng | Layer: cơ khí + nổ + đuôi vang hầm (reverb theo kích thước phòng) |
| 4 | Tiếng quái spawn | Mỗi loại một âm riêng — nghe là biết, không cần nhìn |
| 5 | Đèn & hầm | Đèn dầu cháy xì xì; mỗi Depth hạ pitch tiếng nền nửa cung → Depth 7 là tiếng gầm dưới đất |
| 6 | Nhịp tim người chơi | Vào khi HP < 30%, tăng tempo theo mức máu |
| 7 | Nhạc nền | Layer động: trống vào từ Depth 3, dây từ Depth 5, hợp xướng từ Depth 7, thêm 1 layer khi số quái sống > 60 |

**Ducking:** khi Chém Hoàn Hảo, hạ toàn bộ mix 60% trong 0.12s để tiếng "shiiing" và coin chime nổi lên.

### 2.5 UI feedback

| Thứ | Quy tắc |
|---|---|
| Số damage | Bay lên + phóng to; crit thì **to gấp 1.8x và màu vàng**; số cộng dồn nếu cùng mục tiêu trong 0.3s |
| Bộ đếm vàng | **Giật nảy** (scale 1.15 → 1.0 trong 0.12s) mỗi lần tăng. Không tween mượt |
| Thanh HP quái | Chỉ hiện khi trúng, mờ sau 1.2s. Elite/Boss thì luôn hiện |
| Vòng đạn | Mỗi viên bắn: vạch tương ứng tắt + nảy nhẹ; viên cuối thì vòng đỏ nhấp nháy |
| Thanh stamina | Hiện khi chém, **fade sau 2s** (đúng docs). Dưới 50%: đỏ + rung nhẹ |
| Combo | Số bậc ở giữa dưới, mỗi bậc phóng to + đổi màu; bậc 5 thì viền màn hình sáng vàng |
| Lộc | Icon đèn ở góc trên + số Lộc; nhấp nháy vàng 0.3s mỗi lần +1 Lộc |

### 2.6 Haptic (rung máy)

| Sự kiện | Kiểu |
|---|---|
| Bắn 1 phát | light impact |
| Shotgun | heavy impact |
| Chém trúng | medium impact |
| Chém Hoàn Hảo | success pattern (2 nhịp) |
| Nạp thất bại (kẹt) | error pattern |
| Bị trúng | heavy + 40ms |
| Mở cửa ở Ngã Ba | rung 0.35s một nhịp nặng |
| Input bị huỷ (dead zone) | 8ms rất nhẹ (báo "máy nhận nhưng bỏ") |

## 3. Bẫy phải tránh

| Bẫy | Vì sao chết | Luật chống |
|---|---|---|
| Rung quá nhiều, quá lâu | Không đọc được đám đông → chết oan → cảm giác game gian | Cap tổng biên độ rung mọi nguồn ở 26px; tắt dần hàm mũ; camera về gốc ≤0.35s |
| Hạt che kín màn hình | Không thấy quái | Cap 2,200 hạt cùng lúc; hạt máu **không** vẽ trên nửa trên màn hình quá 0.2s |
| Slow-mo quá thường xuyên | Mất đà, cảm giác lag | Slow-mo chỉ ở Chém Hoàn Hảo và wave-clear; cooldown 1.5s |
| Số damage nhiều tới mức là bức tường số | Không thấy quái | Cộng dồn số cùng mục tiêu; cap 14 số hiện cùng lúc |
| Vàng nhiều tới mức tụt frame | | Cap 400 đồng vật lý; vượt thì gộp thành "cục vàng" giá trị lớn |
| Juice không nhất quán | Cảm giác chắp vá | **Mọi tham số ở `data/gamefeel.json`**, một người duyệt |

## 4. Test feel (làm hằng tuần)

1. **Test tắt tiếng:** chơi 1 phòng không có âm. Nếu không còn sướng → juice hình đang dựa vào âm quá nhiều.
2. **Test 5 giây:** quay 5 giây gameplay bất kỳ, cho người ngoài xem. Họ có muốn thử không?
3. **Test một tay trên xe bus:** chơi thật khi đang rung lắc. Còn phân biệt được tap/slide không?
4. **Test frame:** quay 240fps màn hình thật, đếm frame giữa lúc ngón chạm và lúc đạn ra. **Phải ≤ 3 frame.**
5. **Test đọc:** dừng frame ở lúc đông nhất. Có đếm được số quái đang bắn mình không? Có thấy Elite không?
