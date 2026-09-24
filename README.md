# Hệ thống Quản lý Phòng khám Đa khoa

Ứng dụng quản lý phòng khám đa khoa: đặt lịch khám, khám bệnh, kê đơn thuốc, quản lý kho thuốc, xét nghiệm, hóa đơn – thanh toán và báo cáo thống kê. Hệ thống phục vụ 4 vai trò người dùng (Admin, Bác sĩ, Lễ tân, Bệnh nhân) qua hai giao diện: **Patient Portal** (công khai, dành cho bệnh nhân) và **Internal Portal** (dashboard nội bộ cho Admin/Bác sĩ/Lễ tân).

> Đồ án môn học Lập trình .NET.

## Tính năng chính

### Bệnh nhân (Patient Portal)
- Đăng ký/đăng nhập tài khoản, quên/đổi mật khẩu
- Xem thông tin khoa, bác sĩ, chuyên khoa (không cần đăng nhập)
- Đặt lịch khám trực tuyến: chọn khoa → bác sĩ → khung giờ trống
- Xem trạng thái lịch hẹn, hồ sơ bệnh án, đơn thuốc, kết quả xét nghiệm của bản thân
- Xem và tải hóa đơn, lịch sử thanh toán
- Đánh giá bác sĩ sau khi hoàn thành buổi khám
- Nhận thông báo real-time khi lịch hẹn được xác nhận/thay đổi

### Lễ tân (Receptionist)
- Tạo hồ sơ bệnh nhân mới (walk-in) hoặc tiếp nhận đăng ký online
- Duyệt/xác nhận/hủy lịch hẹn, check-in bệnh nhân
- Lập hóa đơn tổng hợp (phí khám + thuốc + xét nghiệm) và ghi nhận thanh toán

### Bác sĩ (Doctor)
- Xem lịch khám được phân công theo ngày
- Khám bệnh, ghi nhận triệu chứng và chẩn đoán, lập hồ sơ bệnh án
- Kê đơn thuốc (chọn thuốc, liều dùng, số lượng, hướng dẫn sử dụng)
- Chỉ định xét nghiệm và xem kết quả
- Xem lịch sử khám bệnh của từng bệnh nhân

### Quản trị viên (Admin)
- Quản lý tài khoản người dùng và phân quyền theo vai trò
- Quản lý danh mục: khoa, chuyên khoa, phòng, loại thuốc, nhà cung cấp, loại xét nghiệm
- Quản lý hồ sơ bác sĩ/nhân viên và lịch làm việc
- Quản lý kho thuốc: nhập kho, kiểm tồn, cảnh báo hết hạn/sắp hết hàng
- Xem báo cáo, thống kê: doanh thu, lượt khám, top thuốc/dịch vụ sử dụng nhiều
- Cấu hình hệ thống (giá khám, giá dịch vụ xét nghiệm...)

## Công nghệ sử dụng

| Thành phần | Công nghệ |
|---|---|
| Backend | ASP.NET Core 8.0 Web API |
| Frontend | React 18+ (Vite), React Router, Axios |
| CSDL | SQL Server |
| ORM | Entity Framework Core (Code First + Migrations) |
| Xác thực | Users/Roles custom + BCrypt + JWT (Access Token + Refresh Token) |
| Real-time | SignalR |
| UI Library | MUI / Ant Design |
| State management | Redux Toolkit (hoặc Context API) |
| Tài liệu API | Swagger / OpenAPI |

## Cấu trúc thư mục

```
clinic-management/
├── ClinicManagement/         # Backend (ASP.NET Core Web API)
│   ├── Controllers/
│   ├── Services/
│   ├── Repositories/
│   ├── Data/                 # DbContext, Entities, Migrations
│   ├── DTOs/
│   ├── Validators/
│   ├── Exceptions/
│   ├── Hubs/                 # SignalR
│   └── Program.cs
└── clinic-management-client/ # Frontend (React)
    ├── src/
    │   ├── api/
    │   ├── layouts/          # PatientLayout, AdminLayout
    │   ├── pages/            # patient/, internal/
    │   ├── routes/
    │   └── App.jsx
    └── package.json
```

Xem chi tiết đầy đủ về CSDL (25 bảng), kiến trúc và luồng nghiệp vụ trong tài liệu đặc tả `DacTa_QuanLyPhongKham.docx`.

## Yêu cầu hệ thống

Cài đặt sẵn các công cụ sau trước khi bắt đầu:

- [.NET SDK 8.0+](https://dotnet.microsoft.com/download)
- [Node.js 18+](https://nodejs.org/) (kèm npm)
- [SQL Server](https://www.microsoft.com/sql-server) hoặc SQL Server Express / LocalDB
- [Git](https://git-scm.com/)
- (Khuyến nghị) Visual Studio 2022 hoặc VS Code

## Cài đặt Backend (ASP.NET Core Web API)

1. **Di chuyển vào thư mục backend**
   ```bash
   cd backend/ClinicManagement
   ```

2. **Khôi phục package**
   ```bash
   dotnet restore
   ```

3. **Cấu hình chuỗi kết nối CSDL**

   Mở `appsettings.json` và cập nhật `ConnectionStrings`:
   ```json
   {
     "ConnectionStrings": {
       "DefaultConnection": "Server=localhost;Database=ClinicManagementDb;Trusted_Connection=True;TrustServerCertificate=True"
     },
     "Jwt": {
       "Key": "your-secret-key-min-32-characters",
       "Issuer": "ClinicManagementAPI",
       "Audience": "ClinicManagementClient",
       "AccessTokenExpirationMinutes": 60,
       "RefreshTokenExpirationDays": 7
     }
   }
   ```

4. **Tạo CSDL bằng Migrations**
   ```bash
   dotnet ef database update
   ```
   > Nếu chưa cài EF Core CLI: `dotnet tool install --global dotnet-ef`

5. **Chạy ứng dụng**
   ```bash
   dotnet run
   ```
   API mặc định chạy tại `https://localhost:5001` (hoặc cổng hiển thị trên console). Truy cập `/swagger` để xem tài liệu API.

## Cài đặt Frontend (React)

1. **Di chuyển vào thư mục frontend**
   ```bash
   cd frontend/clinic-management-client
   ```

2. **Cài đặt dependencies**
   ```bash
   npm install
   ```

3. **Cấu hình biến môi trường**

   Tạo file `.env` tại thư mục gốc:
   ```
   VITE_API_BASE_URL=http://localhost:5212/api
   VITE_SIGNALR_HUB_URL=http://localhost:5212/hubs/notification
   ```

4. **Chạy ứng dụng ở chế độ phát triển**
   ```bash
   npm run dev
   ```
   Ứng dụng chạy tại `http://localhost:5173` (mặc định của Vite).

5. **Build cho môi trường production**
   ```bash
   npm run build
   ```

## Chạy toàn bộ hệ thống

1. Khởi động SQL Server.
2. Chạy backend: `dotnet run` (trong `ClinicManagement`).
3. Chạy frontend: `npm run dev` (trong `clinic-management-client`).
4. Truy cập `http://localhost:5173`:
   - Trang chủ (`/`) — Patient Portal, dùng cho bệnh nhân.
   - `/internal/login` — đăng nhập dành cho Admin / Bác sĩ / Lễ tân.

## Tài khoản mặc định

Sau khi chạy migration, có thể nạp dữ liệu mẫu bằng một file SQL. Từ thư mục gốc repository, chạy:

```powershell
dotnet ef database update --project backend/ClinicManagement
sqlcmd -S "(localdb)\MSSQLLocalDB" -d ClinicManagementDb -E -b -i "backend/ClinicManagement/Data/Seed/clinic-all-tables-demo.sql"
```

Nếu `sqlcmd` không có trong PATH, dùng đường dẫn đầy đủ tới `SQLCMD.EXE` hoặc mở file SQL trong SSMS, chọn đúng database `ClinicManagementDb` rồi Execute. Nếu dùng SQL Server khác, thay `-S`, `-d` và kiểu xác thực theo connection string trong `appsettings.json`.

File bảo đảm mỗi bảng nghiệp vụ có ít nhất 20 dòng, giữ nguyên dữ liệu đã có và có thể chạy lại. Một số bảng sẽ có tổng số dòng lớn hơn 20 vì migration đã tạo dữ liệu ban đầu. Bốn role thực dùng là Admin, Doctor, Receptionist, Patient; 16 role mẫu còn lại không được phép gán qua API. Nếu tài khoản `admin` đã tồn tại, file dùng lại tài khoản đó. Tài khoản quản trị mẫu: `admin` / `admin123`, đăng nhập tại `/internal/login`. File này chỉ dành cho môi trường phát triển; nếu đã có tài khoản `admin` với mật khẩu khác, chạy file sẽ đặt lại mật khẩu đó thành `admin123`.

## Thành viên nhóm

- Nguyễn Văn Nhuận
- Võ Ngọc Nguyên
- Vũ Hoàng
- Trần Đình Minh Thoại
- Dương Thạch Phú

