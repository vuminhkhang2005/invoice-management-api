# Project Tracking & Time Estimation

> **Dự án**: Invoice Management RESTful API  
> **Người thực hiện**: Intern / Backend Candidate  
> **Trạng thái tổng quan**: `IN PROGRESS` 🚀  
> **Thời gian bắt đầu**: 2026-08-23 21:40  

---

## 1. Bảng tổng hợp Ước lượng Thời gian (Estimation Summary)

| Giai đoạn (Phase) | Nội dung công việc | Ước lượng (Est. Time) | Thực tế (Actual Time) | Trạng thái |
| :--- | :--- | :---: | :---: | :---: |
| **Phase 1** | Project Setup, Tooling, Architecture & Types | 45 mins | - | `TODO` |
| **Phase 2** | Database Design, Prisma Schema & Migrations | 45 mins | - | `TODO` |
| **Phase 3** | Business Logic & Service Layer (State Machine, Math) | 60 mins | - | `TODO` |
| **Phase 4** | REST API Controllers, Middlewares & Validation | 60 mins | - | `TODO` |
| **Phase 5** | PDF Generation Engine (PDFKit) & Download API | 60 mins | - | `TODO` |
| **Phase 6** | Unit Testing & Integration Testing (Jest/Supertest) | 60 mins | - | `TODO` |
| **Phase 7** | Postman Collection & API Documentation | 30 mins | - | `TODO` |
| **Phase 8** | Assessment README (Learnings & Challenges) & Review | 40 mins | - | `TODO` |
| **TỔNG CỘNG** | **Toàn bộ dự án** | **6.5 giờ (~390 mins)** | **-** | `IN PROGRESS` |

---

## 2. Chi tiết các Task & Checklist tiến độ (Detailed Tasks)

### 📌 Phase 1: Khởi tạo dự án, Tooling & Kiến trúc nền tảng (Est: 45m)
- [ ] **Task 1.1**: Khởi tạo `package.json` với các dependencies (express, prisma, zod, pdfkit, jest, ts-node, etc.)
- [ ] **Task 1.2**: Cấu hình TypeScript `tsconfig.json` với strict type checking
- [ ] **Task 1.3**: Thiết lập cấu trúc thư mục phân tầng (Clean Layered Architecture)
- [ ] **Task 1.4**: Định nghĩa Global Error Handling, HTTP Response Helpers, Enums & Interfaces
- [ ] **Task 1.5**: Cấu hình Git `.gitignore` và quy chuẩn commit

### 📌 Phase 2: Cơ sở dữ liệu, Prisma Schema & SQL Migrations (Est: 45m)
- [ ] **Task 2.1**: Thiết kế `schema.prisma` với model `Invoice`, `InvoiceItem` và enum `InvoiceStatus`
- [ ] **Task 2.2**: Thiết lập quan hệ tự tham chiếu (Self-relation) phục vụ nghiệp vụ thay thế hoá đơn (`replacedInvoiceId`)
- [ ] **Task 2.3**: Tạo file SQL Migration khởi tạo database
- [ ] **Task 2.4**: Cấu hình Prisma Client singleton & Seed script dữ liệu mẫu

### 📌 Phase 3: Xây dựng Service Layer & Logic nghiệp vụ Hoá đơn (Est: 60m)
- [ ] **Task 3.1**: Xây dựng Utility tính toán tài chính (subtotal, VAT rate, taxAmount, totalAmount)
- [ ] **Task 3.2**: Xây dựng Utility sinh mã hoá đơn duy nhất theo chuẩn định dạng (`INV-YYYYMM-XXXXX`)
- [ ] **Task 3.3**: Cài đặt nghiệp vụ Tạo hoá đơn nháp (`DRAFT`)
- [ ] **Task 3.4**: Cài đặt nghiệp vụ Cập nhật & Xoá hoá đơn nháp (Kiểm tra trạng thái bất biến)
- [ ] **Task 3.5**: Cài đặt nghiệp vụ Xuất hoá đơn chính thức (`ISSUED` State Transition)
- [ ] **Task 3.6**: Cài đặt nghiệp vụ Huỷ hoá đơn (`CANCELED` State Transition kèm lý do huỷ)
- [ ] **Task 3.7**: Cài đặt nghiệp vụ Thay thế hoá đơn (`REPLACED` State Transition & chuỗi liên kết)
- [ ] **Task 3.8**: Cài đặt nghiệp vụ Lấy danh sách (Search, Filter status, Phân trang) & Xem chi tiết

### 📌 Phase 4: REST API Controllers, Routing & Validation (Est: 60m)
- [ ] **Task 4.1**: Viết Zod Schemas validate dữ liệu đầu vào cho tất cả API endpoints
- [ ] **Task 4.2**: Xây dựng Middleware validation tự động bắt lỗi và format response
- [ ] **Task 4.3**: Xây dựng `InvoiceController` xử lý HTTP Request/Response
- [ ] **Task 4.4**: Đăng ký các API Routes và gắn middleware xử lý lỗi tập trung
- [ ] **Task 4.5**: Thêm Health check endpoint (`GET /api/health`)

### 📌 Phase 5: PDF Export Engine & API Tải hoá đơn (Est: 60m)
- [ ] **Task 5.1**: Thiết kế giao diện hoá đơn với PDFKit (Header, Company Info, Customer Info, Table, Totals, Notes)
- [ ] **Task 5.2**: Xử lý Watermark & Badge động theo trạng thái (`DRAFT`, `ISSUED`, `CANCELED`, `REPLACED`)
- [ ] **Task 5.3**: Xây dựng `PdfService` xuất stream buffer
- [ ] **Task 5.4**: Xây dựng endpoint `GET /api/invoices/:id/pdf` hỗ trợ xem inline và tải về máy

### 📌 Phase 6: Kiểm thử tự động (Unit & Integration Tests) (Est: 60m)
- [ ] **Task 6.1**: Cấu hình môi trường test với Jest và ts-jest
- [ ] **Task 6.2**: Viết Unit Tests cho `calculation.util.ts` (các trường hợp tính thuế, làm tròn, số lượng)
- [ ] **Task 6.3**: Viết Unit Tests cho `invoice.service.ts` (kiểm tra đầy đủ State Machine, Validation logic)
- [ ] **Task 6.4**: Viết Integration Tests cho các API Endpoints với `Supertest` (CRUD, Issue, Cancel, Replace, PDF)
- [ ] **Task 6.5**: Chạy kiểm tra Code Coverage và tối ưu test cases

### 📌 Phase 7: Postman Collection & Môi trường Test (Est: 30m)
- [ ] **Task 7.1**: Tạo Postman Collection JSON (v2.1) chứa đầy đủ endpoints
- [ ] **Task 7.2**: Thiết lập Environment Variables trong Postman (`baseUrl`, `invoiceId`, v.v.)
- [ ] **Task 7.3**: Viết sẵn các mẫu body JSON cho từng kịch bản (Create, Update, Cancel, Replace)

### 📌 Phase 8: Tài liệu README & Hoàn thiện hồ sơ đánh giá (Est: 40m)
- [ ] **Task 8.1**: Viết tài liệu `README.md` chuẩn mực với hướng dẫn setup, cấu hình, chạy app & test
- [ ] **Task 8.2**: Soạn thảo mục **"Kiến thức học được" (What I Learned)**
- [ ] **Task 8.3**: Soạn thảo mục **"Khó khăn & Giải pháp" (Challenges & Solutions)**
- [ ] **Task 8.4**: Kiểm tra toàn bộ mã nguồn, format code và rà soát lịch sử Git commits

---

## 3. Lịch sử Git Commits (Conventional Commits Tracker)

| # | Commit Type | Scope | Commit Message | Files Changed |
| :-: | :--- | :--- | :--- | :--- |
| `1` | `docs` | `spec` | `docs(spec): add detailed requirements and tracking documents` | `REQUIREMENTS.md`, `TRACKING.md` |
| `2` | `chore` | `init` | *(Upcoming)* `chore(init): initialize node typescript express project structure` | `package.json`, `tsconfig.json`, `.gitignore` |
| `...`| `...` | `...` | *(Được cập nhật liên tục theo từng bước)* | `...` |

---

## 4. Nhật ký Khó khăn & Bài học kinh nghiệm (Engineering Log)

### 💡 Bài học kinh nghiệm (Learnings)
- *Sẽ được ghi lại chi tiết và tổng hợp vào README trong quá trình thực hiện.*

### 🛠️ Thách thức & Giải pháp kỹ thuật (Challenges & Solutions)
- *Sẽ được cập nhật liên tục khi đối mặt với các bài toán kỹ thuật thực tế.*
