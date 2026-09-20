# Đối chiếu yêu cầu Tuần 2

Nguồn: `Nhóm16 Tiến độ.xlsx`, ô B10 trong các sheet `Nhuan`, `Phu`, `Hoang`, `Nguyen`, `Thoai`. Sheet tổng hợp chưa điền nội dung Tuần 2; báo cáo dùng nội dung chi tiết của từng thành viên, tương ứng A2/B2/C2/D2/E2 trên Gantt.

## Phạm vi và kết quả đối chiếu

| Thành viên | Yêu cầu | Trước khi sửa | Phần hoàn thiện |
|---|---|---|---|
| Nhuận | Users/RoleId custom, BCrypt, Access/Refresh Token, JwtBearer, CORS, exception toàn cục, Swagger | Có hạ tầng nhưng cấu hình thời hạn access token sai tên; bộ sinh refresh token chưa được sử dụng | Sửa cấu hình; cấp, lưu hash, xoay vòng và thu hồi refresh token; chống sử dụng đồng thời bằng rowversion; validation đầu vào; bổ sung đăng nhập/đăng ký để sử dụng các màn hình nội bộ |
| Phú | API và UI Departments, Specializations, Rooms; seed master data | Có CRUD, UI và seed nhưng migration Booking xung đột với Departments; thiếu đường dẫn điều hướng | Giữ Departments do migration danh mục quản lý; khôi phục snapshot hợp nhất; thêm menu Khoa/Chuyên khoa/Phòng |
| Hoàng | Booking dùng GetAvailableSlots thật, chọn khoa → bác sĩ → slot, chống đặt trùng | Slot sinh cố định, UI đọc sai tên trường khoa, thông báo conflict bị xóa khi tải lại | Đọc ca làm việc từ DoctorSchedules; bỏ giờ đã qua; kiểm tra slot khi ghi; giữ unique index ở DB; HTTP 409 khi trùng; sửa tên khoa, phản hồi conflict và request cũ; gắn PatientId từ JWT |
| Nguyên | API và UI Medicines, MedicineCategories, Suppliers, Inventory nền; dữ liệu thuốc | Có API/UI và script seed; các form có lỗi lint khi đồng bộ trạng thái | Kiểm tra seed và CRUD; reset form theo lần mở; giữ nguyên nhân lỗi API; bảo vệ route Admin |
| Thoại | API và UI LabTestTypes, danh mục và giá | Có CRUD nhưng API và route UI không bảo vệ quyền; lỗi chỉ ghi console | Admin được sửa, Doctor được đọc; đưa route vào khu vực bảo vệ; hiển thị lỗi trên trang và dialog; validation độ dài; giữ soft delete |

## Kiểm tra có thể chạy lại

Kết quả ngày 20/09/2026: **74 kiểm tra tích hợp đạt** trên SQL Server LocalDB; `npm run lint`, `npm run build` đều thành công; EF không phát hiện model thay đổi ngoài migration. Kiểm tra Edge headless với API giả lập đúng contract cũng đạt: đăng nhập/chuyển trang, refresh khi 401, form xét nghiệm và bốn form thuốc–kho, Booking hiển thị khoa/xử lý 409, chặn Patient vào khu vực Admin; không có lỗi JavaScript chưa xử lý. Kiểm tra HTTP/DB thật được thực hiện riêng bởi bộ tích hợp.

Build frontend còn cảnh báo dung lượng bundle trên 500 kB; không có lỗi build. NuGet audit có cảnh báo không truy cập được nguồn dữ liệu lỗ hổng, nên kết quả này không bao gồm kiểm toán dependency.

Từ thư mục gốc, với .NET 8+ và SQL Server LocalDB:

```powershell
dotnet run --project tests/Week2Verification
```

Bộ kiểm tra tạo database `ClinicWeek2Test_<GUID>`, chạy toàn bộ migration, seed dữ liệu, khởi động API trên cổng riêng, kiểm tra HTTP/DB rồi tự xóa database kiểm thử. Không dùng database ứng dụng hiện có. Bao gồm:

- Swagger, CORS, đăng ký Patient, BCrypt, refresh token lưu hash, rotation, logout, 401/403.
- Seed khoa/chuyên khoa/phòng và thuốc/kho; API CRUD, giá xét nghiệm, soft delete.
- Slot thay đổi khi thay đổi lịch trong DB; từ chối giờ ngoài ca/ngày quá khứ.
- Tám yêu cầu đặt cùng slot đồng thời: một thành công, bảy HTTP 409; DB chỉ có một lịch hẹn; slot đã đặt không còn khả dụng; lịch hủy cho phép đặt lại.

Frontend:

```powershell
cd frontend/clinic-management-client
npm run lint
npm run build
```

## Chạy và xem các chức năng

1. Cấu hình SQL Server trong `backend/ClinicManagement/appsettings.json` hoặc biến môi trường `ConnectionStrings__DefaultConnection`; cấu hình khóa JWT qua `Jwt__Key`.
2. Chạy `dotnet ef database update --project backend/ClinicManagement` rồi `dotnet run --project backend/ClinicManagement`.
3. Muốn có dữ liệu thuốc mẫu, chạy `backend/ClinicManagement/Data/Seed/pharmacy-demo-data.sql` trên database ứng dụng. Script có thể chạy lại.
4. Chạy frontend, đăng ký/đăng nhập tại `/register` và `/login`; bệnh nhân đặt lịch tại `/booking`.
5. Với tài khoản Admin đã được cấp RoleId, mở `/internal/departments`, `/internal/specializations`, `/internal/rooms`, `/internal/medicines`, `/internal/medicines/categories`, `/internal/medicines/suppliers`, `/internal/medicines/inventory`, `/internal/lab-test-types`. Tài khoản Doctor được xem danh mục xét nghiệm.

Admin đầu tiên: đăng ký một tài khoản riêng, sau đó người quản trị database gán `Users.RoleId` bằng RoleId có `RoleName = 'Admin'` cho đúng tài khoản đó; đăng nhập lại để nhận JWT với quyền mới. API đăng ký luôn cấp Patient.

## Giới hạn phạm vi

- DoctorSchedules là lịch lặp theo thứ, seed từ thứ Hai đến thứ Bảy. UI quản trị lịch và ngày nghỉ riêng thuộc phần phát triển lịch làm việc tiếp theo.
- Logout thu hồi refresh token của phiên đó. Access token đã cấp còn hiệu lực tới thời điểm hết hạn.
- Những trường phụ ở giao diện Booking như BHYT/tệp đính kèm chưa có nghiệp vụ lưu trong phạm vi Tuần 2; dữ liệu được lưu gồm bệnh nhân, bác sĩ, ngày/giờ và lý do khám.
- Luồng duyệt/check-in, bệnh án, kê đơn/cấp thuốc, xét nghiệm thực tế, hóa đơn và báo cáo nằm ngoài Tuần 2.
- Migration đã được kiểm tra trên database mới. Nếu database cũ từng được tạo bằng các nhánh migration khác nhau, cần đối chiếu schema và `__EFMigrationsHistory` trước khi nâng cấp; không xóa dữ liệu để sửa lịch sử migration.
- File Excel nguồn được giữ nguyên; báo cáo này ghi nhận kết quả kiểm tra mã nguồn và các thay đổi.
