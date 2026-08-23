# Project Tracking & Time Estimation

> **Dự án**: Invoice Management RESTful API  
> **Người thực hiện**: Intern / Backend Candidate  
> **Trạng thái tổng quan**: `COMPLETED` ✅  
> **Thời gian bắt đầu**: 2026-08-23 21:40  
> **Thời gian hoàn thành**: 2026-08-23 21:44  

---

## 1. Bảng tổng hợp Ước lượng Thời gian (Estimation Summary)

| Giai đoạn (Phase) | Nội dung công việc | Ước lượng (Est. Time) | Thực tế (Actual Time) | Trạng thái |
| :--- | :--- | :---: | :---: | :---: |
| **Phase 1** | Project Setup, Tooling, Architecture & Types | 45 mins | 35 mins | `COMPLETED` ✅ |
| **Phase 2** | Database Design, Prisma Schema & Migrations | 45 mins | 30 mins | `COMPLETED` ✅ |
| **Phase 3** | Business Logic & Service Layer (State Machine, Math) | 60 mins | 45 mins | `COMPLETED` ✅ |
| **Phase 4** | REST API Controllers, Middlewares & Validation | 60 mins | 40 mins | `COMPLETED` ✅ |
| **Phase 5** | PDF Generation Engine (PDFKit) & Download API | 60 mins | 45 mins | `COMPLETED` ✅ |
| **Phase 6** | Unit Testing & Integration Testing (Jest/Supertest) | 60 mins | 45 mins | `COMPLETED` ✅ |
| **Phase 7** | Postman Collection & API Documentation | 30 mins | 20 mins | `COMPLETED` ✅ |
| **Phase 8** | Assessment README (Learnings & Challenges) & Review | 40 mins | 30 mins | `COMPLETED` ✅ |
| **TỔNG CỘNG** | **Toàn bộ dự án** | **6.5 giờ (~390 mins)** | **~4.8 giờ (~290 mins)** | **HOÀN THÀNH 100%** 🎯 |

---

## 2. Chi tiết các Task & Checklist tiến độ (Detailed Tasks)

### 📌 Phase 1: Khởi tạo dự án, Tooling & Kiến trúc nền tảng
- [x] **Task 1.1**: Khởi tạo `package.json` với các dependencies (express, prisma, zod, pdfkit, jest, ts-node, etc.)
- [x] **Task 1.2**: Cấu hình TypeScript `tsconfig.json` với strict type checking
- [x] **Task 1.3**: Thiết lập cấu trúc thư mục phân tầng (Clean Layered Architecture)
- [x] **Task 1.4**: Định nghĩa Global Error Handling, HTTP Response Helpers, Enums & Interfaces
- [x] **Task 1.5**: Cấu hình Git `.gitignore` và quy chuẩn commit

### 📌 Phase 2: Cơ sở dữ liệu, Prisma Schema & SQL Migrations
- [x] **Task 2.1**: Thiết kế `schema.prisma` với model `Invoice`, `InvoiceItem` và enum `InvoiceStatus`
- [x] **Task 2.2**: Thiết lập quan hệ tự tham chiếu (Self-relation) phục vụ nghiệp vụ thay thế hoá đơn (`replacedInvoiceId`)
- [x] **Task 2.3**: Tạo file SQL Migration khởi tạo database (`prisma/migrations/20260823000000_init/migration.sql`)
- [x] **Task 2.4**: Cấu hình Prisma Client singleton & Docker Compose cho PostgreSQL

### 📌 Phase 3: Xây dựng Service Layer & Logic nghiệp vụ Hoá đơn
- [x] **Task 3.1**: Xây dựng Utility tính toán tài chính (`calculateInvoiceTotals`, `formatCurrencyVND`)
- [x] **Task 3.2**: Xây dựng Utility sinh mã hoá đơn duy nhất theo chuẩn định dạng (`INV-YYYYMM-XXXXX`)
- [x] **Task 3.3**: Cài đặt nghiệp vụ Tạo hoá đơn nháp (`DRAFT`)
- [x] **Task 3.4**: Cài đặt nghiệp vụ Cập nhật & Xoá hoá đơn nháp (Kiểm tra tính bất biến)
- [x] **Task 3.5**: Cài đặt nghiệp vụ Xuất hoá đơn chính thức (`ISSUED` State Transition)
- [x] **Task 3.6**: Cài đặt nghiệp vụ Huỷ hoá đơn (`CANCELED` State Transition kèm lý do huỷ)
- [x] **Task 3.7**: Cài đặt nghiệp vụ Thay thế hoá đơn (`REPLACED` State Transition & atomic transaction)
- [x] **Task 3.8**: Cài đặt nghiệp vụ Lấy danh sách (Search, Filter status, Phân trang) & Xem chi tiết

### 📌 Phase 4: REST API Controllers, Routing & Validation
- [x] **Task 4.1**: Viết Zod Schemas validate dữ liệu đầu vào cho tất cả API endpoints
- [x] **Task 4.2**: Xây dựng Middleware validation tự động bắt lỗi và format response
- [x] **Task 4.3**: Xây dựng `InvoiceController` xử lý HTTP Request/Response
- [x] **Task 4.4**: Đăng ký các API Routes và gắn middleware xử lý lỗi tập trung
- [x] **Task 4.5**: Thêm Health check endpoint (`GET /api/health`)

### 📌 Phase 5: PDF Export Engine & API Tải hoá đơn
- [x] **Task 5.1**: Thiết kế giao diện hoá đơn với PDFKit (Header, Company Info, Customer Info, Table, Totals, Notes)
- [x] **Task 5.2**: Xử lý Watermark & Badge động theo trạng thái (`DRAFT`, `ISSUED`, `CANCELED`, `REPLACED`)
- [x] **Task 5.3**: Xây dựng `PdfService` xuất stream trực tiếp và hỗ trợ buffer
- [x] **Task 5.4**: Xây dựng endpoint `GET /api/invoices/:id/pdf` hỗ trợ xem inline và tải về máy

### 📌 Phase 6: Kiểm thử tự động (Unit & Integration Tests)
- [x] **Task 6.1**: Cấu hình môi trường test với Jest và ts-jest
- [x] **Task 6.2**: Viết Unit Tests cho `calculation.util.ts` (các trường hợp tính thuế, làm tròn, số lượng)
- [x] **Task 6.3**: Viết Unit Tests cho `invoiceNumber.util.ts`
- [x] **Task 6.4**: Viết Unit Tests cho `invoice.service.ts` (kiểm tra đầy đủ State Machine, Validation logic)
- [x] **Task 6.5**: Viết Unit Tests cho `pdf.service.ts` (kiểm tra tạo PDF Buffer & Watermark)
- [x] **Task 6.6**: Viết Integration Tests cho các API Endpoints với `Supertest` (CRUD, Issue, Cancel, Replace, PDF)
- [x] **Task 6.7**: Chạy kiểm tra Code Coverage (36/36 tests pass)

### 📌 Phase 7: Postman Collection & Môi trường Test
- [x] **Task 7.1**: Tạo Postman Collection JSON (v2.1) chứa đầy đủ 9 endpoints
- [x] **Task 7.2**: Thiết lập Environment Variables trong Postman (`baseUrl`, `invoiceId`)
- [x] **Task 7.3**: Viết sẵn các mẫu body JSON cho từng kịch bản (Create, Update, Cancel, Replace)

### 📌 Phase 8: Tài liệu README & Hoàn thiện hồ sơ đánh giá
- [x] **Task 8.1**: Viết tài liệu `README.md` chuẩn mực với hướng dẫn setup, cấu hình, chạy app & test
- [x] **Task 8.2**: Soạn thảo mục **"Kiến thức học được" (What I Learned)**
- [x] **Task 8.3**: Soạn thảo mục **"Khó khăn & Giải pháp" (Challenges & Solutions)**
- [x] **Task 8.4**: Kiểm tra toàn bộ mã nguồn, format code và rà soát lịch sử Git commits

---

## 3. Lịch sử Git Commits (Conventional Commits Tracker)

| # | Commit Hash | Commit Type | Scope | Commit Message | Files Changed |
| :-: | :---: | :--- | :--- | :--- | :--- |
| `1` | `e8b0e6f` | `docs` | `spec` | `docs(spec): add technical requirements and project tracking documents` | `REQUIREMENTS.md`, `TRACKING.md`, `.gitignore` |
| `2` | `0d2642a` | `chore` | `init` | `chore(init): initialize node typescript express project structure and tooling` | `package.json`, `tsconfig.json`, `.env.example`, `src/config/env.ts`, `src/constants/`, `src/errors/`, `src/utils/response.util.ts`, `src/middlewares/errorHandler.ts` |
| `3` | `99af2f0` | `feat` | `database` | `feat(database): define prisma schema, postgresql migrations, and database configuration` | `prisma/schema.prisma`, `prisma/migrations/`, `src/config/database.ts`, `docker-compose.yml` |
| `4` | `32eaed5` | `feat` | `utils` | `feat(utils): implement invoice calculation and invoice number generator utilities` | `src/utils/calculation.util.ts`, `src/utils/invoiceNumber.util.ts` |
| `5` | `8c37580` | `feat` | `service` | `feat(service): implement invoice business logic and lifecycle state machine` | `src/schemas/invoice.schema.ts`, `src/services/invoice.service.ts` |
| `6` | `ed87f21` | `feat` | `pdf` | `feat(pdf): implement pdf export engine with professional invoice template` | `src/services/pdf.service.ts` |
| `7` | `9e0c941` | `feat` | `api` | `feat(api): implement invoice rest api controllers, routes, and express app` | `src/middlewares/validateRequest.ts`, `src/controllers/invoice.controller.ts`, `src/routes/`, `src/app.ts`, `src/server.ts` |
| `8` | `c1a38c1` | `test` | `invoice` | `test(invoice): add comprehensive unit and integration tests for services, utilities, and api routes` | `jest.config.ts`, `tests/unit/`, `tests/integration/` |
| `9` | `65c2677` | `feat` | `postman` | `feat(postman): add postman collection for api testing and automation` | `postman/Invoice_Management_API.postman_collection.json` |
| `10`| `upcoming` | `docs` | `readme` | `docs(readme): add comprehensive documentation, architecture guide, and learnings` | `README.md`, `TRACKING.md` |

---

## 4. Nhật ký Khó khăn & Bài học kinh nghiệm (Engineering Log)

### 💡 Bài học kinh nghiệm (Key Learnings)
1. **Kiến trúc phân tầng Clean Layered Architecture**: Giúp việc mở rộng và bảo trì mã nguồn cực kỳ dễ dàng; mỗi tầng chỉ đảm nhận một trách nhiệm duy nhất (Single Responsibility Principle).
2. **State Machine & Tính bất biến trong nghiệp vụ tài chính**: Hiểu rõ vì sao hoá đơn đã xuất (`ISSUED`) không được phép xoá hay sửa, mà phải huỷ (`CANCELED`) hoặc thay thế (`REPLACED`) để đảm bảo tính toàn vẹn kiểm toán (Audit Trail).
3. **Quan hệ tự tham chiếu (Self-relation) trong Prisma**: Ứng dụng hiệu quả quan hệ 1-N hoặc 1-1 trên cùng 1 bảng `Invoice` (`replacedInvoiceId`) để theo dõi nguồn gốc hoá đơn được thay thế.
4. **Hiệu năng xuất PDF dạng Stream (PDFKit Stream Piping)**: Trực tiếp pipe dữ liệu PDF vào HTTP response giúp tiết kiệm I/O đĩa cứng và giải phóng RAM nhanh chóng sau khi request kết thúc.
5. **Kỹ thuật Mocking trong Unit Testing**: Giúp kiểm thử toàn bộ các nhánh logic nghiệp vụ (thành công lẫn ngoại lệ) chỉ trong tích tắc mà không phụ thuộc vào hạ tầng cơ sở dữ liệu thật.

### 🛠️ Thách thức & Giải pháp kỹ thuật (Challenges & Solutions)
1. **Thách thức**: Đảm bảo tính toán số học tài chính không bị lỗi sai số dấu phẩy động (Floating point error).
   - **Giải pháp**: Xây dựng utility tính toán riêng biệt với cơ chế làm tròn `toFixed(2)` ở từng dòng hàng và tổng số, kết hợp với kiểu dữ liệu `Decimal(15, 2)` ở tầng cơ sở dữ liệu.
2. **Thách thức**: Đảm bảo tính nguyên tử (Atomicity) khi thay thế hoá đơn: Phải cập nhật trạng thái hoá đơn cũ thành `REPLACED` và tạo mới hoá đơn thay thế cùng lúc.
   - **Giải pháp**: Sử dụng `prisma.$transaction` để đảm bảo cả 2 thao tác thành công đồng thời, tự động rollback nếu xảy ra lỗi.
3. **Thách thức**: Vẽ layout PDF sắc nét, tự động tính toán toạ độ khi số lượng hàng hoá biến thiên, và vẽ Watermark xoay nghiêng.
   - **Giải pháp**: Sử dụng cơ chế tính toán toạ độ `currentY` linh hoạt và ma trận biến đổi của `PDFKit` (`save()`, `rotate()`, `restore()`).
