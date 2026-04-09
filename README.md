# FairGit

FairGit là hệ thống full-stack dùng lịch sử Git để đánh giá mức độ đóng góp cá nhân trong dự án làm việc nhóm.

## Kiến trúc hệ thống

- `apps/web`: frontend React + Vite
- `apps/api`: backend Express + MongoDB
- `services/analyzer`: worker BullMQ phân tích repository và tính điểm
- `infra/docker-compose.yml`: stack chạy local (Mongo, Redis, API, Analyzer, Web)

Luồng dữ liệu chính:

1. Người dùng tạo một lần phân tích (run) từ frontend.
2. API tạo bản ghi `Run` và đẩy job vào hàng đợi BullMQ.
3. Analyzer lấy job, đọc commit history, tính điểm và trích xuất evidence.
4. Analyzer lưu các bản ghi `Result`, đồng thời cập nhật tiến độ/trạng thái run.
5. Frontend đọc dữ liệu run, leaderboard và evidence để hiển thị.

## Mô hình chấm điểm (v2)

Mỗi thành viên sẽ có các chỉ số:

- `Consistency` (0..30): mức độ làm việc đều theo ngày/tuần, có phạt khi dồn commit bất thường.
- `Impact` (0..50): mức tác động thực chất dựa trên thay đổi dòng code theo nhóm file (core/test/doc/other/noise).
- `Focus` (0..20): mức tập trung vào phần việc cốt lõi, bị giảm khi có nhiều thay đổi nhiễu hoặc commit quá nhỏ.
- `Confidence` (0..100): độ tin cậy của kết quả, phụ thuộc vào độ dày dữ liệu và độ phủ hoạt động.

Cơ chế tăng tính công bằng:

- phạt mẫu tiny commit/spam commit
- phạt khi tỷ trọng thay đổi nhiễu cao
- chuẩn hóa log để giảm việc một vài outlier chi phối điểm
- chuẩn hóa Impact theo mốc P90 thay vì theo giá trị lớn nhất tuyệt đối

## Khởi chạy nhanh (local)

Yêu cầu:

- Node.js 20+
- pnpm
- Docker (khuyến nghị dùng cho Mongo/Redis)

### 1. Khởi động hạ tầng nền

```bash
cd infra
docker compose up -d mongo redis
```

### 2. Cấu hình biến môi trường

Sao chép và chỉnh lại:

- `apps/api/.env.example` -> `apps/api/.env`
- `services/analyzer/.env.example` -> `services/analyzer/.env`
- `apps/web/.env.example` -> `apps/web/.env` (tùy chọn)

### 3. Cài dependencies

```bash
pnpm install
```

### 4. Chạy các service

```bash
pnpm dev:api
pnpm dev:analyzer
pnpm dev:web
```

## Lệnh thường dùng

```bash
pnpm typecheck
pnpm build
pnpm test
pnpm --filter api seed:admin
pnpm --filter api seed:users
```

## Chạy full stack bằng Docker Compose

```bash
cd infra
docker compose up --build
```

- Web: http://localhost:8080
- API: http://localhost:4000
- MongoDB: localhost:27017
- Redis: localhost:6379

## Tài khoản mẫu (seed mặc định)

- `admin@fairgit.local` / `Admin123!`
- `manager@fairgit.local` / `Manager123!`
- `member@fairgit.local` / `Member123!`
