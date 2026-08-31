# 01 — Overview

## Pitch một câu

> **Một khẩu súng, một lưỡi dao, và một cái hầm goblin sâu không đáy.
> Súng hết đạn thì phải vào gần mà chém — và chém đủ thì lại có đạn.**

## Pitch 30 giây (dùng cho pitch deck / store)

Into the Goblin là **FPS màn hình dọc chơi một tay**. Nhân vật tự tiến sâu vào hầm; ngón tay bạn dành 100%
cho việc giết: **tap để bắn**, **quẹt để chém**. Súng có băng đạn — hết đạn phải lùi về dùng dao;
mỗi 6 mạng chém được lại nạp cho bạn một băng đạn mới. Đó là toàn bộ nhịp của game, và nó lặp mỗi 3 giây.

Hầm chia thành phòng và wave. Càng xuống sâu, quái càng đông và càng khoẻ — tới Depth 1 phòng 6 đã có gần
**60 con cùng lúc trên màn hình**, và chết là nổ vàng đầy mặt. Ở mỗi Cổng, hầm mở ra **hai cửa** với biển
báo nói trước cái gì đợi bên trong: *ĐÔNG · vàng ×1.25* hay *YÊN · có suối máu*. Bạn hết máu thì chọn cửa
an toàn và chấp nhận ít vàng. Bạn đang mạnh thì lao vào cửa đông. Hầm không hỏi bạn muốn khó cỡ nào —
nó tự khó lên. Bạn chỉ chọn đường đi qua nó.

## 5 Design Pillar

| # | Pillar | Nghĩa là gì | Test để biết đạt hay không |
|---|---|---|---|
| P1 | **Một tay, một ngón, không nút** | Không joystick ảo, không nút bắn. Tap = bắn, quẹt = chém. Mọi thứ khác là tự động | Chơi được khi đang đứng trên xe bus, tay còn lại giữ cột |
| P2 | **Đạn và Stamina cắn nhau** | Không có "spam một nút thắng". Hết đạn thì buộc phải vào gần; chém đủ thì được đạn | Người chơi *tự nói ra* nhịp "bắn → hết đạn → chém → có đạn" sau 3 run |
| P3 | **Đông tới mức nghẹt thở** | Màn hình phải đầy quái. Knockback là cách duy nhất để thở. **Đây là phần lấy feel từ Guns 'n Goblins** | Đạt 60 con/wave trong Depth 1; có ít nhất 1 khoảnh khắc mỗi run người chơi nói "trời ơi" |
| P4 | **Không được dừng** | Hầm tự đông dần và tự khoẻ dần; Sương Đen dồn tới nếu bạn cố thủ. Tension của Into the Dead, không có nút tạm dừng nhịp | Độ dài phòng trung vị 18–30s; >80% run kết thúc vì chết chứ không vì quit |
| P5 | **Mỗi cái chết đều nổ ra vàng** | Không kill nào im lặng. Hitstop, shake, vàng bay, xác văng theo hướng quẹt | Tắt tiếng vẫn thấy sướng; xem 5 giây gameplay là muốn tải |

**Quyết định của người chơi ở tầng run** không nằm trong pillar vì nó là *hệ*, không phải *cảm giác*:
xem **Ngã Ba Hầm** ở `08-fork-escalation.md`.

## Đối tượng người chơi

| | |
|---|---|
| **Primary** | 18–34, đã chơi Archero / Survivor.io / Into the Dead, thích run ngắn + build ngẫu nhiên |
| **Secondary** | Fan horde-shooter PC (Vampire Survivors, Deep Rock Survivor) muốn phiên bản mobile 5 phút |
| **Motivation chính** | Completion + Power fantasy + Mastery (theo thang Quantic Foundry) |
| **Không nhắm** | PvP competitive, người chơi cần story dài, người chơi landscape/gamepad |

## Platform & yêu cầu kỹ thuật

| | |
|---|---|
| Platform | iOS 15+ / Android 9+ (API 28) |
| Engine đề xuất | Unity 6 URP, portrait lock 9:19.5–9:16 |
| Orientation | **Portrait cứng** (không hỗ trợ landscape ở v1) |
| Thiết bị mốc | iPhone 11 / Snapdragon 720G @ 60fps, low-tier 30fps lock |
| Budget hiển thị | 40 agent full-AI + tối đa 240 crowd agent; **150+ quái nhìn thấy được cùng lúc** |
| Kích thước build | < 200MB tải lần đầu (asset còn lại tải theo Depth) |
| Online | Không bắt buộc — chơi offline được toàn bộ Depth; online chỉ cho leaderboard/event/shop |

## Session & retention target

| Chỉ số | Mục tiêu |
|---|---|
| Thời gian tới lần bắn đầu tiên | **< 10 giây** kể từ khi mở app |
| Độ dài 1 run | 4–6 phút (8–12 phòng) |
| Số run / session | 2–4 |
| Session / ngày | 3–5 |
| D1 / D7 / D30 | 45% / 18% / 7% |
| Playtime D30 tích lũy | > 6 giờ |

## Non-goal của v1

- Không PvP, không co-op realtime.
- Không open world, không hub 3D đi lại — Trại Mỏ là UI 2.5D.
- Không cốt truyện cutscene; lore kể qua item description và xác của những thợ mỏ trước.
- Không crafting sâu; nâng cấp = vàng + mảnh, hết.
- **Không có dial để người chơi tự bơm độ khó lấy thưởng** — đó là cơ chế của Guns 'n Goblins, ta không mượn.

## Tên & branding

- Tên làm việc: **INTO THE GOBLIN** (giữ liên hệ với Into the Dead, thay zombie bằng goblin dark-fantasy).
- Tagline: *"Xuống sâu nữa. Vàng ở dưới đó."*
- Người chơi là một **thợ mỏ** — không phải anh hùng. Xuống hầm vì vàng, chết vì tham.
- Bảng tên tiếng Việt cho các khái niệm chính: xem `16-data-schema-balancing.md` mục "Từ vựng".
