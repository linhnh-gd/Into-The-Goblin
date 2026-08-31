# Into the Goblin — Prototype (three.js)

Static site, **không có bước build**. Mọi số lấy từ `data/*.json` (đồng bộ từ GDD ở thư mục cha).

Tài liệu thiết kế đi kèm: [`../docs/18-prototype.md`](../docs/18-prototype.md).

## Chạy cục bộ

Bắt buộc chạy qua HTTP (dùng ES module → `file://` bị CORS chặn):

```bash
powershell -ExecutionPolicy Bypass -File ../serve_local.ps1
```

Mở `http://localhost:8123`. Máy này không có Node/Python nên server là một script PowerShell
dùng `HttpListener` — nếu bạn có Node thì `npx serve prototype` cũng được.

## Điều khiển

| Gesture | Hành động |
|---|---|
| **Chạm** vào quái | 1 phát bắn nhắm |
| **Giữ** | Bắn liên tục; rê ngón thì tâm ngắm đi theo |
| **Quẹt ngang** (lệch ≤55° khỏi trục ngang) | Chém. Dài hơn 55% màn hình = **chém nặng** |
| **Quẹt dọc xuống** | Bước Lùi (0.15s bất tử) |
| **Quẹt dọc lên** | Xốc Tới (đẩy văng quái trên đường) |
| Quẹt ở 55–65° | **Bị bỏ qua có chủ đích** (vùng chết) |
| Nút NẠP | Reload; bấm đúng vạch xanh = **Nạp Hoàn Hảo** |
| `R` / `S` / `W` (desktop) | reload / bước lùi / xốc tới |

Bật **"Hiện đo input (Sprint 0)"** ở màn hình đầu để thấy tỉ lệ input bị huỷ — đây là con số go/no-go
của Sprint 0 (ngưỡng < 8%).

Bật **"Chế độ Hai Vùng"** để thử phương án dự phòng: nửa trên chỉ bắn, nửa dưới chỉ chém.

## Deploy Vercel

```bash
powershell -ExecutionPolicy Bypass -File ../deploy_vercel.ps1 -Token "<vercel-token>"
```

Lấy token ở https://vercel.com/account/tokens. Thêm `-Prod` để vào production,
`-DryRun` để xem trước. Không cần Node/npm/vercel CLI.

Hoặc cách thủ công: import repo vào Vercel, đặt **Root Directory = `prototype`**,
framework **Other**, không có build command, output là chính thư mục đó.

## Hook debug

`window.ITG` có sẵn trong console:

```js
ITG.game            // trạng thái người chơi + director
ITG.game.pool.list  // pool quái
ITG.run(120)        // chạy 120 frame ở dt cố định (test không cần rAF)
ITG.game.input.stats // bộ đếm gesture
```

## Giới hạn đã biết

- **Chưa có boss.** Phòng 10 chỉ là một wave lớn hơn.
- **Đã cài hành vi riêng:** Goblin Khiên (khiên chắn / hở khiên / vòng ra sau lưng) và Ogre Hầm
  (vòng cảnh báo AoE / yếu điểm bụng). Quái Depth 4+ (bay, trồi lên sau lưng, charge) chưa cài.
- Không có meta ngoài run. Màn hình đầu cho chọn **Depth khởi đầu** (1/3/5) và **dao** — đó là công cụ
  test để xem quái Depth 3+ mà không phải chơi lại từ đầu. Chọn **Búa Đá** để thử counter phá khiên.
- 24/50 thẻ đã cài hiệu ứng thật; các thẻ chưa cài **không được đưa vào pool** (không có thẻ ma).
- three.js nạp từ CDN jsdelivr (ghim `0.169.0`) — cần mạng ở lần tải đầu.
