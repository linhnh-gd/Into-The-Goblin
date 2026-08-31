# Import vào Vercel

Repo này chứa cả GDD (`docs/`, `data/`) và prototype chơi được (`prototype/`).
Prototype là **static site, không có bước build**.

## Cấu hình khi import

| Mục | Giá trị |
|---|---|
| Framework Preset | **Other** |
| **Root Directory** | **`prototype`** ← quan trọng nhất |
| Build Command | *(để trống)* |
| Output Directory | *(để trống)* |
| Install Command | *(để trống)* |
| Node.js Version | không dùng |

`prototype/vercel.json` đã có sẵn (`cleanUrls` + header `no-cache` cho `data/` và `js/`).

## Sau khi import

Mỗi lần `git push` lên nhánh chính là Vercel tự deploy lại. Nếu sửa `data/*.json` ở gốc repo,
nhớ chạy lại pipeline trước khi commit — bước cuối của `build_pages.ps1` copy `data/` sang
`prototype/data/`:

```bash
powershell -ExecutionPolicy Bypass -File .\build_pages.ps1
```

## Nếu muốn deploy không qua GitHub

Có sẵn `deploy_vercel.ps1` (dùng Vercel REST API, không cần Node/npm/vercel CLI):

```bash
powershell -ExecutionPolicy Bypass -File .\deploy_vercel.ps1 -Token "<vercel-token>"
```

## Nếu gặp `404: NOT_FOUND`

Gốc repo **không có `index.html`** (chỉ có `GDD.html`, `content.html`, …). Nên khi Root Directory
để mặc định là gốc repo, Vercel không tìm thấy file nào cho `/` → trả về 404 của Vercel
(không phải lỗi JS — trang trắng có khung "404: NOT_FOUND" là Vercel, không phải game).

Cách sửa đúng: đặt **Root Directory = `prototype`** trong Settings → Build & Deployment, rồi
**Redeploy** (đổi setting không tự deploy lại).

Repo cũng đã có sẵn đường dự phòng để chạy được ngay cả khi Root Directory là gốc repo:

| File | Việc |
|---|---|
| `index.html` (gốc) | Redirect sang `prototype/`. Mọi đường dẫn trong prototype đều **tương đối** nên nó chạy đúng ở subpath |
| `.vercelignore` | Chỉ upload `index.html` + `prototype/` — giữ `docs/`, `data/`, `*.ps1` **không** lên URL công khai |
| `vercel.json` (gốc) | Header `no-cache` cho `/prototype/data/` và `/prototype/js/` |

Mọi pattern trong `.vercelignore` đều **neo bằng `/` ở đầu** (`/data/`, không phải `data/`).
Bỏ dấu neo là loại luôn `prototype/data/` và game mất toàn bộ số cân bằng.
Muốn GDD đọc được công khai thì xoá dòng `/*.html` và `/docs/`.
