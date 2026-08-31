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
