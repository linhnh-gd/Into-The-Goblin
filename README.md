# INTO THE GOBLIN — Game Design Document

> FPS **màn hình dọc, chơi một tay**. Lối di chuyển của **Into the Dead**, cộng **cảm giác mật độ quái đông**
> của **Guns 'n Goblins** — *chỉ lấy feel, không lấy cơ chế nào của họ*.
>
> Hook quyết định của riêng game: **Ngã Ba Hầm** — mỗi Cổng hầm mở ra 2 cửa có biển báo, người chơi chọn 1.
> Độ khó thì **hầm tự tăng** theo phòng và theo wave, đúng dòng docs gốc.
>
> *"Xuống sâu nữa. Vàng ở dưới đó."*

**Đọc bản HTML:** mở [`GDD.html`](GDD.html) — self-contained, có sidebar nav, toàn bộ concept nằm inline.
Bản một trang để share: `artifact/GDD.artifact.html`.

---

## Nguyên tắc: một nguồn, nhiều view

```
   docs/NN-*.md          (concept, VIẾT TAY)
   data/*.json           (SOURCE OF TRUTH cho engine + AI)
        |
        v
   normalize_balance.ps1    -> scale dmg về đường cong tier + balance_report.md
        |
        v
   audit_gdd.ps1  (GATE)    -> 51 bất biến, exit 1 nếu vi phạm + audit_report.md
        |
        v
   build_pages.ps1          -> GDD.html · 6 trang data · docs/gen-*.md · artifact/
```

| Lớp | File | Sửa tay? |
|---|---|---|
| Concept | `docs/00-*.md` … `docs/17-*.md` | **Có** |
| Data | `data/*.json` | **Có** (hoặc để normalize sửa `dmg`) |
| Chuỗi hiển thị | `data/ui.json` | **Có** |
| HTML | `GDD.html`, `weapons.html`, … | **KHÔNG** — generated |
| Data doc cho AI | `docs/gen-*.md` | **KHÔNG** — generated |
| Report | `audit_report.md`, `balance_report.md` | **KHÔNG** — generated |

Mọi công thức nằm ở **[`docs/16-data-schema-balancing.md`](docs/16-data-schema-balancing.md)**.
Không có con số nào được hardcode trong code game.

## Chạy pipeline

```bash
powershell -ExecutionPolicy Bypass -File .\normalize_balance.ps1
```

```bash
powershell -ExecutionPolicy Bypass -File .\audit_gdd.ps1
```

```bash
powershell -ExecutionPolicy Bypass -File .\build_pages.ps1
```

Cả ba script viết bằng **PowerShell 5.1** (máy dev không có Python/Node) và **source phải là ASCII thuần** —
PowerShell 5.1 đọc sai file `.ps1` UTF-8, nên mọi chuỗi tiếng Việt sống trong `data/ui.json` hoặc `docs/`.

`audit_gdd.ps1` trả exit code ≠ 0 khi có FAIL → dùng làm build gate được:

```bash
powershell -ExecutionPolicy Bypass -Command ".\normalize_balance.ps1; if ($?) { .\audit_gdd.ps1; if ($?) { .\build_pages.ps1 } }"
```

## Trạng thái hiện tại

| | |
|---|---|
| Concept doc | 18 (00–17) |
| Vũ khí | 30 (18 tầm xa + 12 cận chiến, 6 tier) |
| Quái | 21 + 7 boss + 7 affix |
| Thẻ nâng cấp | 50 + 12 bảo vật |
| Talent | 24 × 5 bậc (4 nhánh: Nòng / Lưỡi / Da / Đèn) |
| Wave template | 19 |
| Depth | 7 × 10 phòng + Endless |
| Audit | **57 PASS / 2 WARN / 0 FAIL** (59 check) |

**2 WARN còn lại là chủ đích, không phải nợ:**
`magClearRatio` và `reserveWaves` của vũ khí T3+ nằm ngoài khoảng mong muốn vì sức mạnh thực tế ở tier cao
bị chi phối bởi weapon level + talent + thẻ trong run — những thứ không đọc được từ `weapons.json`.
Đây là hai con số **playtest phải quyết**, không phải audit.

> Mọi giá trị số là **first-pass**: đủ đúng để bắt đầu playtest, chưa phải số đã tune.
> Cấu trúc sạch (audit xanh) **không** đồng nghĩa với cân bằng tốt.

## Prototype chơi được (three.js)

Nằm ở [`prototype/`](prototype/) — static site, **không có bước build**, đọc trực tiếp `data/*.json`.
Tài liệu: [`docs/18-prototype.md`](docs/18-prototype.md) · [`prototype/README.md`](prototype/README.md).

Chạy cục bộ (máy không có Node/Python nên server là script PowerShell):

```bash
powershell -ExecutionPolicy Bypass -File .\serve_local.ps1
```

Deploy Vercel (không cần Node/npm/vercel CLI — dùng REST API):

```bash
powershell -ExecutionPolicy Bypass -File .\deploy_vercel.ps1 -Token "<vercel-token>"
```

**Prototype đã tìm ra 6 lỗi trong GDD** mà đọc doc không thấy — trần DPS ở phòng 1 gây chết sau 3.6s,
quái xếp chồng lên nhau thành bức tường, phòng đầu roll ra wave 29 con, v.v.
Chi tiết + các số đã sửa: `docs/18-prototype.md` mục 4.

## Việc tiếp theo

Đọc [`docs/17-production-roadmap.md`](docs/17-production-roadmap.md). Ngắn gọn: **Sprint 0 chỉ để trả lời
một câu hỏi** — người chơi có phân biệt được "tap để bắn" và "quẹt để chém" trên cùng vùng màn hình hay không.
Không đạt thì phải thiết kế lại UX theo Chế độ Hai Vùng. Đừng làm art, meta hay economy trước câu hỏi đó.

Spec duy nhất cần code chính xác từng con số: [`docs/03-controls-gestures.md`](docs/03-controls-gestures.md).
