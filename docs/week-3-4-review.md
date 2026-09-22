# Tuần 3–4: A3 / A4

## Chức năng

- Auth custom `Users` / `Roles`, BCrypt, JWT và refresh token; không dùng ASP.NET Core Identity. Đăng ký công khai luôn cấp Patient, không nhận RoleId từ client.
- Admin quản lý tài khoản tại `/internal/users`: tìm tên đăng nhập/họ tên/email, lọc RoleId/trạng thái, phân trang, khóa/mở khóa và gán vai trò bằng hộp thoại xác nhận. Vai trò được đọc từ API.
- Không cho tự khóa hoặc tự đổi vai trò; giữ ít nhất một Admin hoạt động. Cập nhật quyền và thu hồi refresh token nằm trong transaction, có kiểm soát cập nhật đồng thời.
- JWT chứa `securityVersion`; mỗi request được kiểm tra trạng thái, phiên bản và vai trò hiện tại trong database. Khóa/mở khóa/đổi RoleId tăng phiên bản và thu hồi mọi refresh token của tài khoản. JWT cũ không có hiệu lực trở lại khi mở khóa hoặc đổi về vai trò cũ.
- `GET /api/auth/me` trả thông tin tài khoản hiện tại. Frontend xác minh phiên lưu trước khi dựng route; tự refresh khi 401 và dùng chung một yêu cầu refresh cho các request đồng thời. Kết quả refresh đến muộn không khôi phục phiên đã đăng xuất.
- `InternalLayout` dùng chung cho Admin, Doctor, Receptionist; menu và route kiểm tra vai trò. Menu thu gọn trên điện thoại. Doctor chỉ xem danh mục xét nghiệm; Receptionist có trang tổng quan nền. Các nghiệp vụ tiếp nhận, khám bệnh không thuộc A3/A4.
- Bỏ endpoint thử nghiệm cấp JWT và ghi Role không cần xác thực.

## API

Response thành công của các API đọc/cập nhật được bọc trong `ApiResponse<T>`. Logout trả 204.

| Endpoint | Quyền / hành vi |
|---|---|
| `POST /api/auth/register` | Công khai; đăng ký Patient |
| `POST /api/auth/login` | Công khai; từ chối tài khoản khóa |
| `POST /api/auth/refresh` | Refresh token còn hiệu lực, xoay vòng một lần |
| `POST /api/auth/logout` | Thu hồi refresh token được gửi, có thể gọi lại |
| `GET /api/auth/me` | `[Authorize]`; thông tin chính mình |
| `GET /api/users?search=&roleId=&status=&pageNumber=1&pageSize=10` | Policy `ManageUsers` (Admin) |
| `GET /api/users/{id}` | Admin; không trả password hash/token |
| `PATCH /api/users/{id}/status` | Admin; body `{ "status": false }` để khóa, `true` để mở |
| `PATCH /api/users/{id}/role` | Admin; body `{ "roleId": 2 }`; ID phải có trong Roles |
| `GET /api/roles` | Admin; danh sách vai trò có sẵn |

Policy `InternalAccess` yêu cầu Admin/Doctor/Receptionist. Các controller nghiệp vụ hiện có tiếp tục dùng `[Authorize(Roles = RoleConstants...)]`. Chưa đăng nhập nhận 401; sai vai trò nhận 403. Thiếu trường cập nhật nhận 400, tài khoản/vai trò không tồn tại nhận 404, tự đổi quyền hoặc xung đột nhận 409.

## SignalR nền

- Hub được bảo vệ tại `/hubs/notification`, sử dụng JWT; query `access_token` chỉ được đọc trên đường dẫn Hub, không áp dụng cho API thường.
- `NotificationUserIdProvider` định danh kết nối bằng claim `userId`; không cho client tự chọn người dùng hoặc nhóm để nhận thông báo.
- Service `INotificationService.SendToUserAsync` gửi event `NotificationReceived`, payload `{ type, message, createdAt }`. Chưa thêm nghiệp vụ phát thông báo tự động, lưu thông báo hoặc lịch sử đọc.
- Frontend kết nối khi đăng nhập, dùng token mới khi kết nối lại, thử lại khi mất mạng và dừng khi đăng xuất. Event nhận được hiển thị Snackbar.
- Kết nối hết hạn xác thực sẽ đóng. Khi khóa hoặc đổi quyền, registry của API đóng các kết nối hiện tại của tài khoản.
- CORS cho phép credentials với danh sách origin cấu hình cụ thể. Cấu hình frontend dùng `VITE_SIGNALR_HUB_URL`; nếu bỏ trống sẽ suy ra từ `VITE_API_BASE_URL`.

Ví dụ gọi từ một service nghiệp vụ sau khi lưu thành công:

```csharp
await notifications.SendToUserAsync(userId,
    new NotificationResponse("AppointmentConfirmed", "Lịch hẹn đã được xác nhận", DateTime.UtcNow));
```

Registry đóng kết nối hiện tại dành cho một API instance. Khi triển khai nhiều instance, cần đồng bộ sự kiện thu hồi giữa các instance. Logout hiện thu hồi refresh token của phiên; access token đã cấp còn hạn đến khi hết hạn hoặc khi Admin đổi quyền/khóa tài khoản.

## Chạy và nâng cấp

```powershell
dotnet ef database update --project backend/ClinicManagement
dotnet run --project backend/ClinicManagement
```

Migration `AddUserAccessSecurity` thêm `SecurityVersion` vào Users và RefreshTokens, không xóa dữ liệu. Cấu hình connection string và JWT key bằng môi trường như trước. JWT cũ thiếu claim mới sẽ cần refresh/đăng nhập lại.

```powershell
cd frontend/clinic-management-client
npm install
npm run dev
```

Đăng nhập Admin tại `/internal/login`, mở `/internal/users`. Admin đầu tiên vẫn do người quản trị database cấp: đăng ký tài khoản riêng, gán `Users.RoleId` tương ứng `Roles.RoleName = 'Admin'`, đăng nhập lại. Không có mật khẩu Admin mặc định hoặc endpoint nâng quyền công khai. Gán Doctor chỉ thay đổi quyền; hồ sơ bác sĩ/lịch làm việc được quản lý riêng.

## Kiểm thử

```powershell
dotnet run --project tests/Week2Verification
node --test tests/auth-storage.test.mjs
cd frontend/clinic-management-client
npm run lint
npm run build
```

Bộ tích hợp hiện chạy cả tuần 2–4: 146 kiểm tra trên SQL Server LocalDB, database ngẫu nhiên riêng và được dọn sau khi chạy. Bao gồm ma trận 401/403, DTO không lộ thông tin nhạy cảm, phân trang/tìm kiếm, bảo vệ tài khoản Admin, khóa/mở khóa, đổi vai trò, thu hồi token, refresh đồng thời, CORS, SignalR negotiate, WebSocket thật và đóng kết nối khi khóa. EF xác nhận không còn thay đổi model ngoài migration. Sáu kiểm tra lưu phiên frontend đạt.

Kiểm thử trình duyệt trong `tests/auth-ui.mjs` dùng API và SQL Server thật. Yêu cầu Playwright và Edge; đặt `PLAYWRIGHT_MODULE` theo hướng dẫn [AUTH-TESTING](../tests/AUTH-TESTING.md) nếu module nằm ngoài dự án. Script kiểm tra đăng ký/đăng nhập/refresh/logout, quản lý User/Role, Doctor/Receptionist, chống dùng vai trò giả trong storage, refresh đồng thời, đăng xuất khi refresh chưa hoàn tất và giao diện desktop/mobile. Ảnh kiểm tra lưu trong `.tmp/`.

Ngày 22/09/2026: bộ kiểm thử Edge headless đạt, không có lỗi JavaScript chưa xử lý; đã xem ảnh desktop/mobile. Backend build, frontend lint/build và kiểm tra migration đều đạt.

Build frontend còn cảnh báo bundle lớn hơn 500 kB. NuGet audit có thể báo không truy cập được nguồn dữ liệu lỗ hổng; kiểm thử chức năng không thay thế kiểm toán dependency.
