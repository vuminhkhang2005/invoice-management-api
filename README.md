# Invoice Management API — Intern Technical Assessment

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg?logo=node.js)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.21-lightgrey.svg?logo=express)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg?logo=postgresql)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-teal.svg?logo=prisma)](https://www.prisma.io/)
[![Jest](https://img.shields.io/badge/Jest-Tested-brightgreen.svg?logo=jest)](https://jestjs.io/)

Hệ thống RESTful API Quản lý và Xuất hoá đơn điện tử (Electronic Invoice Management) được xây dựng theo chuẩn **Clean Layered Architecture**, quản lý vòng đời hoá đơn thông qua **Máy trạng thái (State Machine)**, cơ sở dữ liệu **PostgreSQL** với **Prisma ORM & SQL Migrations**, động cơ kết xuất hoá đơn **Vector PDF (PDFKit)**, và bộ kiểm thử tự động toàn diện (**Jest & Supertest**).

---

## 📑 Mục lục

1. [Mục tiêu bài kiểm tra & Tiêu chí hoàn thành](#1-mục-tiêu-bài-kiểm-tra--tiêu-chí-hoàn-thành)
2. [Kiến trúc hệ thống & Công nghệ](#2-kiến-trúc-hệ-thống--công-nghệ)
3. [Nghiệp vụ hoá đơn & Máy trạng thái (State Machine)](#3-nghiệp-vụ-hoá-đơn--máy-trạng-thái-state-machine)
4. [Hướng dẫn cài đặt & Chạy ứng dụng](#4-hướng-dẫn-cài-đặt--chạy-ứng-dụng)
5. [Tài liệu REST API Endpoints](#5-tài-liệu-rest-api-endpoints)
6. [Động cơ xuất hoá đơn PDF (PDF Engine)](#6-động-cơ-xuất-hoá-đơn-pdf-pdf-engine)
7. [Kiểm thử tự động (Automated Testing)](#7-kiểm-thử-tự-động-automated-testing)
8. [Kiến thức học được (Key Learnings)](#8-kiến-thức-học-được-key-learnings)
9. [Khó khăn gặp phải & Giải pháp (Challenges & Solutions)](#9-khó-khăn-gặp-phải--giải-pháp-challenges--solutions)
10. [Lịch sử Git Commits & Quản lý tiến độ](#10-lịch-sử-git-commits--quản-lý-tiến-độ)

---

## 1. Mục tiêu bài kiểm tra & Tiêu chí hoàn thành

Dự án này được xây dựng để chứng minh các năng lực cốt lõi:
- **Tinh thần học hỏi & Làm chủ công nghệ**: Nắm vững TypeScript (strict typing), Express, PostgreSQL, Prisma ORM, và PDFKit.
- **Kỹ năng giải quyết logic nghiệp vụ kế toán / hoá đơn**: Xử lý tính bất biến (Immutability), quy trình xuất, huỷ, thay thế hoá đơn, và tính toán số học tài chính chuẩn xác.
- **Tư duy lập trình & Clean Architecture**: Tách bạch tầng rõ ràng (Controller ➔ Service ➔ Database ➔ Middleware ➔ Validator).
- **Tư duy kiểm thử (Test-Driven Mindset)**: Đạt 100% test pass trên toàn bộ các luồng nghiệp vụ và trường hợp biên (Edge cases).
- **Tư duy ước lượng (Estimation)**: Lập kế hoạch và theo dõi thời gian thực hiện chi tiết trong [`TRACKING.md`](./TRACKING.md).
- **Tinh thần cầu tiến & Tác phong chuyên nghiệp**: Tuân thủ chuẩn Conventional Commits, Atomic Commits, và tổng hợp báo cáo chi tiết.

---

## 2. Kiến trúc hệ thống & Công nghệ

### 2.1. Tech Stack
- **Language**: TypeScript 5.6 (Strict Mode enabled).
- **Backend Framework**: Express.js 4.21.
- **Database & ORM**: PostgreSQL 16 + Prisma ORM 5.22 + SQL Migrations.
- **Input Validation**: Zod 3.23 (Schema validation ở tầng HTTP Request).
- **PDF Generation**: PDFKit 0.15 (Direct vector PDF rendering, streaming output).
- **Automated Testing**: Jest 29 + ts-jest + Supertest 7.
- **API Testing**: Postman Collection v2.1 (kèm Environment & Examples).
- **Containerization**: Docker Compose cho PostgreSQL database.

### 2.2. Cấu trúc thư mục (Layered Architecture)
```text
invoice-management-api/
├── prisma/
│   ├── schema.prisma            # Định nghĩa Data Models & Relations
│   └── migrations/              # Lịch sử SQL Migrations
├── src/
│   ├── config/                  # Biến môi trường & cấu hình Database
│   │   ├── database.ts
│   │   └── env.ts
│   ├── constants/               # Enums, mã lỗi, thông tin doanh nghiệp
│   │   └── invoice.constant.ts
│   ├── controllers/             # Tiếp nhận HTTP Request, gọi Service
│   │   └── invoice.controller.ts
│   ├── errors/                  # Custom AppError & Exception classes
│   │   └── appError.ts
│   ├── middlewares/             # Validation & Global Error Handler
│   │   ├── errorHandler.ts
│   │   └── validateRequest.ts
│   ├── routes/                  # Định nghĩa REST API Routes
│   │   ├── index.ts
│   │   └── invoice.route.ts
│   ├── schemas/                 # Zod Validation Schemas
│   │   └── invoice.schema.ts
│   ├── services/                # Business Logic, State Machine & PDF Export
│   │   ├── invoice.service.ts
│   │   └── pdf.service.ts
│   ├── utils/                   # Helpers tính toán, định dạng tiền tệ, sinh mã
│   │   ├── calculation.util.ts
│   │   ├── invoiceNumber.util.ts
│   │   └── response.util.ts
│   ├── app.ts                   # Express Application setup
│   └── server.ts                # Entry point & Graceful shutdown
├── tests/                       # Bộ kiểm thử tự động
│   ├── integration/             # End-to-end API Integration tests
│   │   └── invoice.api.test.ts
│   └── unit/                    # Unit tests cho Services & Utilities
│       ├── calculation.util.test.ts
│       ├── invoice.service.test.ts
│       ├── invoiceNumber.util.test.ts
│       └── pdf.service.test.ts
├── postman/                     # Postman Collection JSON
│   └── Invoice_Management_API.postman_collection.json
├── docker-compose.yml           # PostgreSQL Container orchestration
├── REQUIREMENTS.md              # Đặc tả yêu cầu kỹ thuật chi tiết
├── TRACKING.md                  # Nhật ký tiến độ, estimate & commit logs
├── tsconfig.json                # TypeScript compiler configuration
└── package.json                 # Project dependencies & scripts
```

---

## 3. Nghiệp vụ hoá đơn & Máy trạng thái (State Machine)

### 3.1. Sơ đồ chuyển đổi trạng thái (Lifecycle State Machine)

```mermaid
stateDiagram-v2
    [*] --> DRAFT: Tạo hoá đơn nháp (POST /api/invoices)
    DRAFT --> DRAFT: Chỉnh sửa / Thêm bớt dòng hàng (PUT /api/invoices/:id)
    DRAFT --> [*]: Xoá hoá đơn nháp (DELETE /api/invoices/:id)
    DRAFT --> ISSUED: Xuất hoá đơn chính thức (POST /api/invoices/:id/issue)
    
    ISSUED --> CANCELED: Huỷ hoá đơn (POST /api/invoices/:id/cancel)
    ISSUED --> REPLACED: Thay thế bằng hoá đơn mới (POST /api/invoices/:id/replace)
    CANCELED --> REPLACED: Thay thế bằng hoá đơn mới (POST /api/invoices/:id/replace)
    
    CANCELED --> [*]
    REPLACED --> [*]
```

### 3.2. Ràng buộc nghiệp vụ quan trọng
1. **Hoá đơn nháp (`DRAFT`)**:
   - Được phép thêm, sửa, xoá thông tin khách hàng và danh sách dòng hàng.
   - Chưa được cấp mã số hoá đơn chính thức.
   - Được phép xoá hoàn toàn khỏi cơ sở dữ liệu.
2. **Hoá đơn đã xuất (`ISSUED`)**:
   - **Bất biến (Immutable)**: Tuyệt đối KHÔNG ĐƯỢC PHÉP sửa đổi thông tin hoặc xoá khỏi database.
   - Tự động cấp mã số hoá đơn duy nhất theo chuẩn: `INV-YYYYMM-XXXXX` (ví dụ: `INV-202608-00001`).
   - Ghi nhận thời điểm phát hành (`issuedAt`).
   - Chỉ có thể chuyển trạng thái sang `CANCELED` (Huỷ) hoặc `REPLACED` (Bị thay thế).
3. **Hoá đơn đã huỷ (`CANCELED`)**:
   - Bắt buộc phải cung cấp lý do huỷ (`cancelReason`).
   - Ghi nhận thời điểm huỷ (`canceledAt`).
   - Vẫn được lưu trữ trong DB phục vụ kiểm toán và thanh tra thuế.
   - File PDF kết xuất sẽ hiển thị dấu chìm (Watermark) **"CANCELED / ĐÃ HUỶ"**.
4. **Hoá đơn bị thay thế (`REPLACED`) & Hoá đơn thay thế mới**:
   - Hoá đơn cũ được chuyển trạng thái sang `REPLACED`.
   - Một hoá đơn mới được tạo ra với trường `replacedInvoiceId` trỏ đến hoá đơn cũ.
   - File PDF của hoá đơn mới sẽ hiển thị ghi chú pháp lý: *"Hoá đơn này thay thế cho hoá đơn số [Mã cũ]"*.

### 3.3. Quy tắc tính toán tài chính
- $\text{item.amount} = \text{quantity} \times \text{unitPrice}$
- $\text{subtotal} = \sum \text{item.amount}$
- $\text{taxAmount} = \text{round}\left(\text{subtotal} \times \frac{\text{taxRate}}{100}\right)$
- $\text{totalAmount} = \text{subtotal} + \text{taxAmount}$

---

## 4. Hướng dẫn cài đặt & Chạy ứng dụng

### 4.1. Yêu cầu môi trường
- Node.js version 20 trở lên.
- Docker & Docker Compose (hoặc PostgreSQL instance có sẵn).

### 4.2. Các bước khởi chạy

1. **Cài đặt thư viện (Dependencies)**:
   ```bash
   npm install
   ```

2. **Cấu hình biến môi trường**:
   File `.env` đã được thiết lập sẵn (hoặc copy từ `.env.example`):
   ```env
   PORT=3000
   NODE_ENV=development
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/invoice_db?schema=public"
   ```

3. **Khởi động PostgreSQL bằng Docker (Một lệnh duy nhất)**:
   ```bash
   docker compose up -d
   ```

4. **Chạy Database Migration & Sinh Prisma Client**:
   ```bash
   npx prisma migrate dev --name init
   # Hoặc deploy migration có sẵn:
   npm run prisma:generate
   ```

5. **Khởi động Development Server**:
   ```bash
   npm run dev
   ```
   Ứng dụng sẽ chạy tại: `http://localhost:3000`

6. **Build và Chạy bản Production**:
   ```bash
   npm run build
   npm start
   ```

---

## 5. Tài liệu REST API Endpoints

### Danh sách 9 Endpoints chuẩn RESTful:

| Method | Endpoint | Trạng thái áp dụng | Mô tả chức năng |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | Kiểm tra trạng thái hoạt động của hệ thống |
| `POST` | `/api/invoices` | Tạo mới | Tạo hoá đơn nháp (`DRAFT`) kèm danh sách mặt hàng |
| `GET` | `/api/invoices` | Query / Filter | Lấy danh sách hoá đơn (phân trang, lọc theo status, tìm kiếm, ngày) |
| `GET` | `/api/invoices/:id` | Read | Xem chi tiết 1 hoá đơn (kèm dòng hàng & lịch sử thay thế) |
| `PUT` | `/api/invoices/:id` | `DRAFT` | Cập nhật thông tin hoá đơn nháp (Chặn sửa nếu đã xuất/huỷ) |
| `DELETE` | `/api/invoices/:id` | `DRAFT` | Xoá hoá đơn nháp (Chặn xoá nếu đã xuất/huỷ) |
| `POST` | `/api/invoices/:id/issue` | `DRAFT` ➔ `ISSUED` | Xuất hoá đơn chính thức: cấp mã số `INV-YYYYMM-XXXXX`, khoá sửa |
| `POST` | `/api/invoices/:id/cancel` | `ISSUED` ➔ `CANCELED` | Huỷ hoá đơn đã xuất: bắt buộc nhập `cancelReason` |
| `POST` | `/api/invoices/:id/replace` | `ISSUED`/`CANCELED` ➔ `REPLACED` | Tạo hoá đơn mới thay thế cho hoá đơn cũ |
| `GET` | `/api/invoices/:id/pdf` | Mọi trạng thái | Xuất và tải file PDF hoá đơn vector trực tiếp |

---

## 6. Động cơ xuất hoá đơn PDF (PDF Engine)

Được xây dựng bằng thư viện `PDFKit` với thiết kế giao diện hoá đơn thương mại / giá trị gia tăng chuẩn mực:
- **Company Header**: Logo/Tên công ty, MST, Địa chỉ, Số điện thoại, Email, Số tài khoản ngân hàng.
- **Invoice Metadata**: Số hoá đơn, Ngày lập, Loại tiền tệ (VND), Phương thức thanh toán.
- **Customer Box**: Tên đơn vị mua hàng, MST doanh nghiệp, Địa chỉ, Email.
- **Line Items Table**: Kẻ bảng chuyên nghiệp với màu xen kẽ, STT, Tên hàng, Số lượng, Đơn giá, Thành tiền.
- **Financial Breakdown**: Tổng tiền hàng (`Subtotal`), Tiền thuế VAT (`taxAmount`), Tổng tiền thanh toán (`Grand Total`).
- **Watermark & Badges động**:
  - `DRAFT`: Dấu chìm xám *"DRAFT - BẢN NHÁP"*.
  - `ISSUED`: Badge xanh lá *"ISSUED"*.
  - `CANCELED`: Watermark đỏ nghiêng *"CANCELED - ĐÃ HUỶ"*.
  - `REPLACED`: Banner vàng cảnh báo ghi rõ *"Hoá đơn thay thế cho số: [Mã cũ]"*.
- **Stream Output**: Truyền dữ liệu dạng stream (`application/pdf`) trực tiếp về trình duyệt hoặc Postman mà không ghi rác vào ổ đĩa.

---

## 7. Kiểm thử tự động (Automated Testing)

Dự án sở hữu bộ test toàn diện với **36/36 test cases** thành công trên 5 test suites.

### 7.1. Chạy Tests
```bash
# Chạy toàn bộ test suites
npm test

# Chạy test và xuất báo cáo độ phủ mã nguồn (Coverage Report)
npm run test:coverage
```

### 7.2. Kết quả kiểm thử mẫu
```text
PASS tests/unit/invoice.service.test.ts
PASS tests/unit/pdf.service.test.ts
PASS tests/unit/invoiceNumber.util.test.ts
PASS tests/unit/calculation.util.test.ts
PASS tests/integration/invoice.api.test.ts

Test Suites: 5 passed, 5 total
Tests:       36 passed, 36 total
Snapshots:   0 total
Time:        1.996 s
```

---

## 8. Kiến thức học được (Key Learnings)

Trong quá trình nghiên cứu và thực hiện bài test này, tôi đã đúc kết được nhiều kiến thức giá trị:

1. **Làm chủ TypeScript trong kiến trúc Backend thực tế**:
   - Sử dụng triệt để TypeScript Strict Mode, Generic Types, và Schema Validation (Zod) để đảm bảo toàn bộ dữ liệu ra/vào API đều Type-Safe 100%.
   - Xây dựng tầng DTO và Interface rõ ràng giữa Controller và Service.
2. **Nghiệp vụ Hoá đơn Điện tử & Máy trạng thái (State Machine)**:
   - Hiểu sâu về tính chất bất biến (**Immutability**) của hoá đơn tài chính: Khi đã `ISSUED`, hoá đơn là một văn bản pháp lý không được phép sửa hay xoá, mà phải đi qua quy trình `CANCEL` (Huỷ) hoặc `REPLACE` (Thay thế).
   - Thiết kế quan hệ tự tham chiếu (Self-relation) để tạo chuỗi truy vết thay thế hoá đơn (Audit Trail Chain), giúp tra cứu ngược xuôi giữa hoá đơn cũ và hoá đơn mới.
3. **Kỹ thuật tính toán số học tài chính chính xác**:
   - Nắm rõ cách xử lý sai số số thực (Floating point precision) trong JavaScript: Luôn chuẩn hoá số thập phân bằng `Decimal(15, 2)` trên PostgreSQL và làm tròn số học chuẩn xác trước khi tính tổng cộng.
4. **Kỹ thuật kết xuất PDF hiệu năng cao (Streaming Vector PDF)**:
   - Thay vì dùng giải pháp cồng kềnh như Puppeteer (tốn CPU/RAM vì cần Chromium), việc sử dụng `PDFKit` giúp tạo ra các file vector PDF siêu nhẹ, sắc nét và có thể stream thẳng vào HTTP Response (`pipe(res)`), tối ưu hoá tài nguyên server.
5. **Tư duy kiểm thử tự động & Mocking**:
   - Viết Unit Tests độc lập với database bằng kỹ thuật Mocking Prisma Client, giúp test chạy siêu nhanh (dưới 2 giây cho toàn bộ 36 tests) và có thể tích hợp mượt mà vào CI/CD pipeline.
6. **Kỹ năng quản lý công việc và tác phong làm việc chuẩn mực**:
   - Rèn luyện kỹ năng phân rã bài toán và **Estimate thời gian** sát với thực tế trong file [`TRACKING.md`](./TRACKING.md).
   - Duy trì lịch sử commit chuẩn **Conventional Commits**, chia nhỏ các commit nguyên tử (Atomic commits).

---

## 9. Khó khăn gặp phải & Giải pháp (Challenges & Solutions)

| STT | Thách thức kỹ thuật gặp phải | Giải pháp & Cách xử lý |
| :-: | :--- | :--- |
| **1** | **Xử lý ràng buộc trạng thái phức tạp**: Ngăn chặn người dùng sửa/xoá hoá đơn đã phát hành (`ISSUED`) hoặc đã huỷ (`CANCELED`). | Triển khai mô hình Máy trạng thái (State Machine) tập trung trong `InvoiceService`. Mỗi hành động cập nhật trạng thái đều kiểm tra nghiêm ngặt trạng thái hiện tại (`pre-condition check`) và ném ra `BadRequestError` nếu vi phạm. |
| **2** | **Nghiệp vụ thay thế hoá đơn đòi hỏi tính nhất quán (Atomicity)**: Phải vừa đánh dấu hoá đơn cũ là `REPLACED`, vừa tạo hoá đơn mới liên kết đến hoá đơn cũ. | Sử dụng **Prisma `$transaction`** để bọc cả 2 thao tác cập nhật hoá đơn cũ và tạo hoá đơn mới vào một atomic transaction duy nhất. Nếu bất kỳ bước nào lỗi, toàn bộ dữ liệu sẽ tự động rollback. |
| **3** | **Đảm bảo tính chính xác của tiền tệ và thuế VAT**: Tránh sai lệch tiền thuế và tổng tiền khi có nhiều mặt hàng lẻ. | Thiết kế utility `calculateInvoiceTotals` chuẩn hoá tính toán từng dòng hàng, sau đó mới tính tổng tiền hàng (`subtotal`), tiền thuế GTGT (`taxAmount = round(subtotal * rate / 100)`), và tổng thanh toán (`totalAmount`). |
| **4** | **Thiết kế layout PDF vector tiếng Việt & dynamic watermark**: PDFKit cần tính toán toạ độ (X, Y) chính xác cho từng dòng hàng động. | Xây dựng thuật toán tính toạ độ động (`currentY`) theo số lượng mặt hàng, tự động kẻ bảng xen kẽ màu, tính toán vị trí khối tổng kết tài chính, và áp dụng transformation matrix (`rotate`, `opacity`) để vẽ Watermark trạng thái chìm. |

---

## 10. Lịch sử Git Commits & Quản lý tiến độ

Dự án tuân thủ nghiêm ngặt chuẩn **Conventional Commits**:
- `docs(spec)`: Khởi tạo tài liệu yêu cầu và file tracking tiến độ.
- `chore(init)`: Khởi tạo cấu trúc dự án, TypeScript, Express, error handling và utils.
- `feat(database)`: Thiết kế Prisma schema, migrations SQL và Docker Compose.
- `feat(utils)`: Xây dựng utility tính toán tài chính và sinh mã hoá đơn.
- `feat(service)`: Cài đặt logic nghiệp vụ hoá đơn và máy trạng thái.
- `feat(pdf)`: Xây dựng PDF export engine với PDFKit.
- `feat(api)`: Xây dựng REST API controllers, validation middlewares và routes.
- `test(invoice)`: Viết bộ unit tests và integration tests hoàn chỉnh.
- `feat(postman)`: Cung cấp Postman Collection v2.1 kiểm thử toàn bộ luồng.
- `docs(readme)`: Hoàn thiện tài liệu README, báo cáo học tập và cập nhật file tracking.

Chi tiết bảng phân bổ thời gian và nhật ký task có thể xem tại: [`TRACKING.md`](./TRACKING.md).
