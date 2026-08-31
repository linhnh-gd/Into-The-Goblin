# rooms (generated)

> Sinh ra bởi `build_pages.ps1` từ `data/rooms.json`. **KHÔNG sửa tay** — sửa data rồi build lại.

### Hầm: Depth · Phòng · Wave

| Tên | ID | Loại | Tần suất | TP x | Mô tả | Thưởng |
|---|---|---|---|---|---|---|
| Phòng Chiến | rm_combat_thuong | combat | 55% | 1.00 | 1–3 wave theo wave template. Wave sau đông hơn wave trước 18% và có thể có loại quái mới. Dọn sạch mới mở Cổng. | vàng từ kill + 1 thẻ ở Cổng |
| Phòng Elite | rm_elite_sanelite | elite | 10% | 1.40 | 1 Elite (có affix từ Depth 4) + hộ vệ. Elite có outline tím xuyên vật thể. | vàng x2.5, +2 Lộc, Chìa Khoá mở Cửa Khoá |
| Lão Buôn Xác | rm_shop_laobuonxac | shop | 9% | - | NPC ngồi trên đống xác. Không có quái. Không có Sương Đen. | mua đạn / máu / thẻ / ổ đạn / Cột Chống Hầm (hoãn Sương Đen) |
| Miếu Mỏ | rm_shrine_mieumo | shrine | 8% | - | Bàn thờ thợ mỏ chết trong hầm. Không quái. Đây là chỗ TIÊU Lộc. | 4 Lộc → 1 thẻ epic chọn từ 3 · 6 Lộc → hồi đầy HP · hoặc nhận 1 bùa vĩnh viễn cho run |
| Kho Báu | rm_treasure_khobau | treasure | 6% | - | Không quái. Hòm phải CHÉM đúng 3 nhát để phá (dạy chém khi không bị ép). | vàng lớn + 1–2 Phôi Rèn + 1 Lộc |
| Phòng Sự Kiện | rm_event_ngaunhien | event | 6% | - | Roll 1 trong 8 event ở mục events. Biển báo ở Cổng đã nói trước loại thưởng. | tuỳ event |
| Lò Vàng | rm_gauntlet_lovang | gauntlet | 4% | 2.20 | 60 giây, quái vô hạn theo wv_gauntlet. Vàng/kill tăng 8% mỗi 5 giây trụ được. Người chơi TỰ CHỌN lúc thoát qua cửa sau. | vàng rất lớn — đây là chỗ duy nhất trong game có đánh đổi kiểu 'trụ thêm hay đi' |
| Cửa Boss | rm_boss_cua | boss | 2% | 1.60 | Boss của Depth + wave phụ. Không có Sương Đen. Không có ngã ba. | mở Depth sau, Phôi Rèn, relic, vũ khí mới, +3 Lộc |

### Hầm: Depth · Phòng · Wave

| Tên | ID | Hiệu ứng | Lựa chọn | Từ docs gốc |
|---|---|---|---|---|
| Bàn Thợ Rèn | rm_event_banthoren | Nâng 1 vũ khí đang mang +1 level ngay trong run này | Chọn súng hay dao | nâng cấp súng |
| Suối Máu | rm_event_suoimau | Hồi 60% HP | Hoặc hồi 100% HP nhưng mất 4 Lộc | hồi máu |
| Hòm Vàng Đổ | rm_event_homvangdo | Vàng đổ ra như thác trong 8 giây, phải chạy quanh hút | Không có — chỉ có chạy | thưởng tiền |
| Cân Vàng | rm_event_canvang | Đặt lên cân số vàng bất kỳ; cân trả lại thẻ có rarity tương ứng (500 = rare, 1500 = epic, 4000 = legendary) | Đổi bao nhiêu vàng lấy sức mạnh ngay | thưởng tiền + nâng cấp súng |
| Xác Đồng Nghiệp | rm_event_xacdongnghiep | Nhặt loadout của một thợ mỏ đã chết: 1 vũ khí ngẫu nhiên tier +1 | Đổi vũ khí hiện tại hay giữ | flavour + lore |
| Đổi Máu Lấy Đạn | rm_event_doimaulaydan | -25% HP tối đa, +100% đạn dự trữ | Nhận hay bỏ | quyết định thật, không phải quà |
| Lồng Tù Nhân | rm_event_longtunhan | Giải cứu 1 NPC: bắn hỗ trợ 25 dps tới hết Depth | Mở lồng (mất 1 wave phụ spawn ra) hay đi tiếp | tạo lý do đánh thêm |
| Cửa Khoá | rm_event_cuakhoa | Cần Chìa Khoá (rơi từ Elite). Bên trong: 1 Bảo Vật | Có chìa thì mở | tạo lý do đánh Elite |

