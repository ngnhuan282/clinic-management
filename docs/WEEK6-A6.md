# A6 tuần 6 của Nhuận — 11/10/2026

Triển khai theo `RULES.md — Coding Rules forClinic Management System.md`, đặc tả `DacTa_QuanLyPhongKham_v1.6.docx` và các service/route/layout hiện có. Nhánh: `feature/week6-a6`. Phạm vi: hồ sơ tài khoản, Reviews, refresh/logout và kiểm tra phân quyền; A7 không nằm trong thay đổi này.

## API và giao diện

| API | Quyền và contract |
| --- | --- |
| `GET /api/auth/me` | Mọi tài khoản đã xác thực; `UserId` từ JWT, DTO User hiện có kèm permissions. |
| `PUT /api/auth/me` | Chỉ nhận `{ fullName, email, phone }`; họ tên bắt buộc, tối đa 100; email tối đa 100, đúng định dạng và unique; điện thoại tùy chọn, tối đa 15, đúng định dạng. Trường không được phép như `userId`, `role`, `roleId`, `status` bị từ chối 400. |
| `POST /api/auth/login`, `/register` | Access token và User trong `ApiResponse`; refresh token chỉ qua cookie. |
| `POST /api/auth/refresh` | Đọc cookie; kiểm tra hash, expiry, Status và SecurityVersion; xoay token trong lần SaveChanges nguyên tử với rowversion. Token cũ/không hợp lệ trả 401. |
| `POST /api/auth/logout` | Thu hồi refresh token hiện tại, xóa cookie; gọi lại vẫn trả 204. |
| `GET /api/reviews?doctorId=...&pageNumber=1&pageSize=10` | Công khai, chỉ review visible; DTO công khai không có PatientId/AppointmentId. |
| `GET /api/reviews/my-appointments?pageNumber=1&pageSize=10` | Patient; chỉ lịch Completed do JWT UserId sở hữu, kèm trạng thái review đã gửi. |
| `POST /api/reviews` | Patient; `{ appointmentId, rating, comment }`, rating 1–5, comment tối đa 500. Backend lấy DoctorId và PatientProfileId từ lịch hẹn, kiểm tra Appointment.PatientId và Completed. Unique index AppointmentId bảo vệ cả gửi đồng thời; trùng trả 409. |
| `GET /api/reviews/admin` | Admin, phân trang; xem được cả review đã ẩn. |
| `PATCH /api/reviews/{id}/visibility` | Admin; `{ isVisible: true/false }`; cập nhật cờ, giữ bản ghi. |
| `GET /api/doctor-schedules/{scheduleId:guid}` | Admin/DepartmentHead; Trưởng khoa chỉ đọc ca Approved/active có cả bác sĩ và phòng cùng khoa. ID ngoài khoa trả 404. |
| `GET /api/doctor-schedules`, `GET /api/schedule-requests` | Giữ contract hiện có, thêm doctorId/roomId qua query DTO; Trưởng khoa lấy DepartmentId từ hồ sơ server. Bộ lọc khác khoa trả 403. |

Scope áp dụng cả lịch khoa, lịch cũ, chi tiết, yêu cầu của bản thân, lựa chọn phòng đăng ký và hai API available-slots. Request list/count và conflict detail lọc cả khoa của bác sĩ và phòng. Yêu cầu khác khoa không được xem/duyệt/từ chối; cả Admin và Trưởng khoa đều không tự duyệt. Admin duyệt yêu cầu của Trưởng khoa theo luồng hiện có.

FE dùng lại `ProtectedRoute`, `roleAccess`, `useMyProfile`, User DTO, Axios instance và layout hiện có. `/profile` dùng được cho mọi tài khoản xác thực, kể cả custom role không có permission module; Patient giữ thêm hồ sơ khám. `/internal/profile` cho tài khoản nội bộ; hồ sơ bác sĩ cũ vẫn hoạt động. `/my-reviews` cho Patient, `/internal/reviews` cho Admin, `/reviews?doctorId=...` công khai qua nút trên card bác sĩ. Các form/list có validation, loading, empty và error; review/admin list có phân trang và retry.

Cashier và Pharmacist được nhận diện trong internal access/menu; route Reviews Admin luôn kiểm tra role. `InvoicesController` dùng `ICurrentUserService.GetRequiredUserId()` để lấy người thu tiền, thay việc tự dò claim và fallback ID.

## Refresh cookie và tích hợp

Tái sử dụng bảng `RefreshTokens` và generator cryptographic hiện có. DB chỉ lưu SHA-256 hash, expiry, revoked timestamp, SecurityVersion và rowversion. `AuthResponse.RefreshToken`/expiry nội bộ có `JsonIgnore`. Các response Auth đặt `Cache-Control: no-store`. FE xóa refresh token của session cũ khỏi local/session storage, chỉ lưu access token và User theo lựa chọn ghi nhớ.

Cookie `clinic_refresh`: HttpOnly, path `/api/auth`, SameSite=Lax, expiry từ server. `AuthCookie:Secure` mặc định true; Development cấu hình false để chạy HTTP local. Production không chấp nhận Secure=false; SameSite=None cần Secure=true. Với deployment khác site, đặt `AuthCookie__SameSite=None`, `AuthCookie__Secure=true` và cấu hình `Cors__FrontendUrl` bằng origin FE chính xác. Cookie auth kiểm tra Origin theo cấu hình CORS; Origin ngoài danh sách trả 403. FE gửi `withCredentials: true`; refresh/logout không gửi token trong JSON.

Axios dùng một refresh promise cho các request đồng thời, retry tối đa một lần, loại các endpoint auth khỏi retry và không khôi phục session đã logout/đổi phiên. Logout đợi refresh đang chạy trước khi gửi request thu hồi, để cookie thay thế được thu hồi. Các mutation login/register/logout được xếp hàng. Tests Auth cũ đã chuyển sang cookie và không so sánh/in token thô trong lỗi assertion.

## Migration

`20261011135346_AddAppointmentReviews`: tạo Reviews, FK restrictive tới Appointments/Patients/Doctors, unique AppointmentId, index công khai và check Rating 1–5. Snapshot cập nhật metadata của ba cột Insurance mà migration `AddInsuranceToInvoices` đã tạo; migration A6 chỉ thao tác bảng Reviews.

Fixture kiểm chứng dùng `Database.MigrateAsync()` trên SQL Server LocalDB tên ngẫu nhiên từ trống và dọn đúng DB thử nghiệm. Không dùng EnsureCreated hoặc schema sinh trực tiếp từ model để kết luận migration thành công. EF kiểm tra snapshot/model: không còn pending model changes.

## Kiểm tra thực tế

- BE Release build và FE production build: đạt. Lint các file FE mới/thay đổi thuộc A6: đạt.
- A6: **165 kiểm tra HTTP/SQL Server đạt**, gồm sửa hồ sơ người khác/overposting, validation và email trùng; review trước Completed/sai bệnh nhân/trùng/invalid rating/comment dài; gửi review đồng thời; ẩn/hiện và DTO công khai; hash/expiry, refresh hợp lệ/hết hạn/dùng lại/tài khoản bị khóa, refresh đồng thời, logout lặp lại; 401/403 cho DepartmentHead/Cashier/Pharmacist; lịch/request/filter/room/conflict khác khoa, truy cập bằng ID và không tự duyệt. Cookie Secure=true và Development=false đều được kiểm tra ở hai mode fixture.
- FE/storage/role/calendar: **21 test đạt**, gồm tài khoản role tùy chỉnh không có permission vẫn mở được hồ sơ riêng.
- A4 API: **42 kiểm tra đạt** với `--a4-api`; tách khỏi ca migration RoleId collision để báo đúng lỗi riêng ở dưới.
- Browser A6 trên **DB dựng bằng chuỗi migration thật: đạt**. Edge headless kiểm chứng lưu/reload hồ sơ, tài khoản custom role không có permission module vẫn xem/sửa hồ sơ riêng, cookie HttpOnly ngoài browser storage, review Completed và không có nút gửi lần hai, Admin ẩn/hiện và API công khai, ba request 401 dùng đúng một refresh, logout khi refresh đang chạy thu hồi cookie thay thế, route 403 cho ba role/redirect login khi chưa xác thực, hồ sơ mobile 390px không tràn ngang. Không có lỗi runtime browser; có cảnh báo props MUI cũ.
- Cảnh báo còn có: FE bundle lớn; NU1900 khi offline; decimal precision của Invoice/InvoiceDetail; props MUI cũ trong UI sẵn có.

Lệnh kiểm chứng:

```powershell
dotnet build backend/ClinicManagement/ClinicManagement.csproj --no-restore -c Release
dotnet build tests/Week2Verification --no-restore -c Release
dotnet run --no-build --no-restore -c Release --project tests/Week2Verification -- --a6
dotnet run --no-build --no-restore -c Release --project tests/Week2Verification -- --a4-api
node --test tests/auth-storage.test.mjs frontend/clinic-management-client/tests/*.test.mjs
node tests/a6-ui.mjs # PLAYWRIGHT_MODULE nếu Playwright nằm ngoài dependency repo
```

Browser fixture tạo lịch Completed để bắt đầu kiểm chứng Reviews. Kết quả A6 không xác nhận toàn bộ hành trình khám/thu phí của các module khác.

## Phần bị chặn và dependency

- DB **trống** chạy được toàn bộ migration. Lỗi tạo trùng PatientBooks/Check-in đã báo A5 không tái hiện trong ca này; guard của `AddReceptionCheckInBooks` vẫn chủ động dừng khi sổ cũ thiếu chủ/số hoặc xác minh không nhất quán.
- `--migrations-only` trên DB có sổ cũ hợp lệ nhưng `Status='Voided'` **thất bại** tại `20261005080400_UpdatePatientBookStatuses`, SQL 547, constraint `CK_PatientBooks_Status`. Migration thay bộ trạng thái thành Pending/Issued/Lost/Replaced mà chưa chuyển dữ liệu Voided. Đây vẫn chặn nâng cấp DB có dữ liệu này và chưa kiểm chứng được rollback toàn bộ chuỗi. Cần module Sổ khám thống nhất ánh xạ trạng thái cũ trước khi nâng cấp DB đó.
- `--a4` ca custom role chiếm ID 6 **thất bại** tại `20261006174653_AddPrescriptionDispensing`: DepartmentHead được cấp ID 7, trong khi migration Pharmacist insert cố định ID 7 gây SQL 2627. Cần module Dược sửa cấp role theo tên/ID thực tế.
- `--a5` đạt phần lịch khoa/notification/duyệt ca và thanh toán đầu tiên, sau đó **dừng ở Invoice Book gửi trùng**: `/api/Invoices` trả 500, test mong 400. `InvoiceService` đang dùng `InvalidOperationException` cho lỗi nghiệp vụ; cần module hóa đơn chuẩn hóa AppException/response. Không tuyên bố bộ hồi quy A5 đạt toàn bộ.
- Reviews cần lịch Completed có `PatientId` tài khoản sở hữu và `PatientProfileId` hợp lệ từ luồng tiếp nhận. Lịch cũ thiếu liên kết hồ sơ nhận lỗi 404; cần module Appointment/Patient/Check-in hoàn thiện liên kết trên server.
- Cashier cần có role/tài khoản được cấp trong DB quản trị; A6 dùng cơ chế role hiện tại, fixture tự cấp role để kiểm tra, không thêm quy trình cấp nhân viên/thu phí mới.

## File chính

BE: AuthController/AuthService/AuthResponse/RefreshCookie; UserService/IUserService/UpdateMyProfileRequest/MyProfileValidator; ReviewsController/ReviewService/ReviewRepository/ReviewMappings/Review entity/configuration/DTO/validator/migration; DoctorScheduleService/BookingService/ScheduleReviewService/DepartmentScope/query DTO; authorization/RoleConstants/InvoicesController.

FE: axiosClient/authApi/authStorage/useAuth/AuthForm; AccountProfile/ProfilePage và các trang hồ sơ hiện có; reviewApi/useReviewList/ReviewDialog/ReviewsPage/ReviewsManagementPage; AppRoutes/roleAccess/Navbar/PublicDoctorCard/InternalLayout/errorHandler.

Kiểm chứng: A6Checks/TestAuthCookies/Program, test quyền FE/storage, a6-ui và các fixture Auth cũ được cập nhật cookie.
