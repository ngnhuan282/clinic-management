# RBAC triển khai

## Phạm vi

- Mỗi `Users.RoleId` trỏ tới đúng một vai trò. Năm vai trò hệ thống là `Admin`, `Doctor`, `Receptionist`, `LabTechnician`, `Patient`; `Guest` không được lưu như vai trò.
- Migration `20260927024230_AddDynamicRbac` thêm `Permissions`, `RolePermissions`, `RbacAudits`, cờ `Roles.IsSystem`, `Roles.Version` và `Doctors.UserId`. Migration `20260927030547_GrantDoctorPharmacyViewCatalog` cấp quyền xem danh mục thuốc cho Doctor. Cả hai migration cộng thêm, không xóa dữ liệu tài khoản.
- Tên/mô tả và quyền của vai trò tùy chỉnh có thể chỉnh sửa; vai trò hệ thống không thể đổi tên hoặc xóa. Quyền hệ thống chỉ được chỉnh trong phạm vi nghiệp vụ mặc định của vai trò đó. Quyền tài khoản và RBAC chỉ dành cho Admin.
- API kiểm tra quyền trực tiếp từ database sau khi xác thực JWT. Khi đổi vai trò hoặc quyền, `SecurityVersion` tăng, refresh token bị thu hồi và kết nối SignalR bị ngắt.

## API

| API | Quyền |
| --- | --- |
| `GET /api/rbac/permissions`, `GET /api/rbac/roles`, `GET /api/rbac/roles/{id}` | `accounts.manageRoles` + Admin |
| `POST /api/rbac/roles`, `PUT /api/rbac/roles/{id}`, `PUT /api/rbac/roles/{id}/permissions`, `DELETE /api/rbac/roles/{id}` | `accounts.manageRoles` + Admin |
| `GET /api/rbac/audit` | `accounts.manageRoles` + Admin |
| `GET /api/users`, `GET /api/users/{id}` | `accounts.view` + Admin |
| `PATCH /api/users/{id}/role` | `accounts.assignRole` + Admin |
| `PATCH /api/users/{id}/status` | `accounts.update` + Admin |
| `PATCH /api/doctors/{id}/account` | `accounts.assignRole` + Admin; liên kết tài khoản với bác sĩ phụ trách |
| `/api/appointments` | `appointments.*` theo từng hành động |
| `/api/medical-records` | `clinical.viewAssigned`, `clinical.writeRecord`, `clinical.editDiagnosis` theo hành động và `Doctors.UserId` |
| `/api/LabTests`, `/api/LabTestTypes` | `labs.*` theo từng hành động; kết quả và danh sách giới hạn theo công việc/bệnh nhân |
| API danh mục, lịch bác sĩ, thuốc và kho | `catalog.manage`, `schedules.manage`, `clinical.manageDiseases`, `pharmacy.manageCatalog`, `pharmacy.manageInventory` |

Các mã quyền cụ thể và trạng thái có API nằm tại `Commons/PermissionCatalog.cs`. API công khai đặt lịch vẫn công khai; quyền đặt lịch của bệnh nhân là `appointments.bookSelf`.

## Dữ liệu bác sĩ hiện có

Trước khi bác sĩ dùng API bệnh án, Admin cần gắn tài khoản với hàng `Doctors` bằng `PATCH /api/doctors/{doctorId}/account` và body `{ "userId": 123 }`. Bác sĩ chưa liên kết sẽ nhận 403 khi truy cập bệnh án; không đoán liên kết từ tên để tránh lộ hồ sơ. Demo seed liên kết `demo_doctor` với bác sĩ 1005. Liên kết hiện có trong database phát triển cần được xác nhận thủ công sau migration.

## Hóa đơn

Các mã `billing.view`, `billing.create`, `billing.recordPayment`, `billing.viewOwn` có trong danh mục quyền nhưng đánh dấu `IsImplemented = false`; hiện chưa có API/bảng hóa đơn. Có thể cấu hình vai trò mẫu `Cashier` với quyền xem hóa đơn và ghi nhận thanh toán để chuẩn bị giai đoạn sau, nhưng các quyền này chưa mở chức năng. Luồng hóa đơn riêng cần để Receptionist xuất hóa đơn, xét nghiệm thanh toán trước khi thực hiện, thuốc thanh toán sau khi cấp và từng khoản phát sinh được thanh toán riêng.

## Áp dụng và kiểm tra

```powershell
dotnet ef database update --project backend/ClinicManagement --configuration Release
dotnet run --no-restore -c Release --project tests/Week2Verification/Week2Verification.csproj
cd frontend/clinic-management-client
npm run build
npm run lint
npm test
```

Bộ `Week2Verification` tạo database LocalDB tạm, áp toàn bộ migration, gọi API thực và xóa database khi kết thúc.
