# A5 tuần 5 của Nhuận

Lịch khoa chỉ đọc ca `DoctorSchedules.IsActive = true`, `Status = Approved`. Backend lấy khoa từ hồ sơ Doctor đang hoạt động liên kết với người đăng nhập có role `DepartmentHead`; kiểm tra cả khoa của bác sĩ và phòng. FE dùng layout MediFlow, `ProtectedRoute` và bộ kiểm tra role hiện có. Không thay các DTO lịch cũ hoặc `NotificationResponse`.

## API và contract

| API | Quyền và hành vi |
| --- | --- |
| `GET /api/doctor-schedules/department?date=YYYY-MM-DD` | Trưởng khoa; một ngày; tùy chọn `doctorId`, `roomId`. |
| `GET /api/doctor-schedules/department?weekStart=YYYY-MM-DD` | Trưởng khoa; bảy ngày kể từ ngày bắt đầu; FE chọn thứ Hai. |
| `GET /api/doctor-schedules/department/options` | Khoa, bác sĩ và phòng lấy từ hồ sơ backend. |
| `GET /api/notifications?pageNumber=1&pageSize=20` | Lịch sử của chính user; phân trang tối đa 100. |
| `PATCH /api/notifications/{id}/read` | Chỉ chủ thông báo; gọi lại vẫn giữ đã đọc. |

Lịch yêu cầu đúng một trong `date`/`weekStart`, sắp xếp `WorkDate`, `StartTime`, `ScheduleId`. `DepartmentId` client gửi bị bỏ qua; bác sĩ/phòng ngoài khoa nhận 403. DTO mới có ngày, giờ đầu/cuối, bác sĩ, phòng, ca, sức chứa/lượt đặt và người duyệt khi có. Không trả danh tính bệnh nhân. Endpoint lịch cũ cũng giới hạn dữ liệu khi user là Trưởng khoa.

SignalR giữ nguyên `/hubs/notification`, event **`NotificationReceived`**, payload **`{ type, message, createdAt }`**, gửi qua `Clients.User`. `Type` dùng các nhóm trong v1.6: `System` cho lịch, `Billing` cho tiền sổ, `Appointment` cho check-in.

| Điểm lưu | Người nhận |
| --- | --- |
| `DoctorScheduleService.CreateRequestAsync` | Trưởng khoa có quyền duyệt trong khoa của bác sĩ; yêu cầu của Trưởng khoa gửi Admin. |
| `ScheduleReviewService.ReviewAsync` | User của bác sĩ gửi yêu cầu; từ chối kèm lý do. |
| `ReceptionService.MarkBookInvoicePaidAsync` | Lễ tân đang hoạt động, có quyền check-in, chỉ khi `Unpaid → Paid`. |
| `InvoiceService.CreateInvoiceAsync` | Lễ tân, chỉ khi hóa đơn có `BillingStage = Book` được lưu lần đầu thành Paid; không phát cho Final/LabAndConsultation/Medicine. |
| `ReceptionService.CheckInAsync` | User của bác sĩ phụ trách lịch hẹn, sau xác minh sổ/check-in thành công. |

Thông báo tham gia cùng transaction với nghiệp vụ. Chỉ gửi SignalR sau commit. Unique index `(UserId, EventKey)` cùng kiểm tra trạng thái/transaction ngăn bản ghi trùng; lỗi gửi realtime được log và không làm thao tác đã commit thất bại. FE tải lịch sử khi mở trang và khi kết nối/reconnect, cập nhật chuông/toast và tải lại dữ liệu liên quan. Không thêm broadcast hoặc group do client tự chọn.

## File thay đổi

- Lịch BE: `Controllers/DoctorSchedulesController.cs`, DTO `DepartmentScheduleQuery`/`DepartmentScheduleResponse`, repository/interface và service/interface `DepartmentSchedule`, đăng ký DI.
- Notification BE: entity/configuration `Notification`, `ApplicationDbContext`, migration `20261004135510_AddPersistentNotifications` và snapshot, `NotificationsController`, DTO `NotificationHistoryResponse`, `INotificationService`/`NotificationService`.
- Điểm phát: `DoctorScheduleService`, `ScheduleReviewService`, `ReceptionService`, `InvoiceService`. `InvoicesController` lấy user qua `ICurrentUserService` thay claim `NameIdentifier` không có trong JWT hiện tại. Route gửi/xem yêu cầu ca cho phép cả Doctor và DepartmentHead như menu đang có.
- Lịch FE: `DepartmentSchedulesPage`, `DepartmentScheduleGrid`, `useDepartmentSchedules`, `scheduleCalendar`, `doctorScheduleApi`, `AppRoutes`, `roleAccess`.
- Notification FE: `NotificationProvider`, `NotificationBell`, `NotificationListener`, `NotificationContext`, `useNotifications`, `notificationApi`, `signalrService`, `App`, `InternalLayout`. Trang yêu cầu/duyệt ca, hàng chờ bác sĩ và dialog tiếp nhận tải lại khi có sự kiện hoặc reconnect.
- Kiểm tra: `tests/Week2Verification/A5Checks.cs`, `Program.cs` thêm `--a5`/`--a5-ui`, `tests/a5-ui.mjs`, FE `tests/scheduleCalendar.test.mjs`.

`BookNumber` trong model được khớp lại với migration/schema hiện có (40 ký tự, index unique). Migration A5 chỉ tạo/xóa bảng Notifications và index/FK của bảng này.

## Kiểm tra

- Build BE/FE đạt. Snapshot khớp model (`dotnet ef migrations has-pending-model-changes`).
- 67 kiểm tra SQL Server/API/SignalR thật đạt: scope khoa, 401/403, bỏ qua DepartmentId giả, Pending/Rejected/inactive, bộ lọc khác khoa, thứ tự lịch, đúng người nhận, retry duyệt/từ chối/pay/check-in, hóa đơn Paid khác Book, lịch sử và trạng thái đã đọc sau đăng nhập lại; bác sĩ bị thu hồi quyền lâm sàng không nhận thông báo check-in.
- 8 test FE về quyền truy cập và ngày/tuần đạt. ESLint các component/hook mới đạt.
- Browser E2E dùng API/SignalR thật đạt: chuyển ngày/tuần, lọc, nhiều ca cùng ô, chi tiết, loading/empty/error/retry, toast trực tiếp, lịch sử/đã đọc sau reload, mobile không tràn ngang và không có lỗi runtime browser.

Chạy BE: `dotnet run --no-restore --project tests/Week2Verification/Week2Verification.csproj -- --a5`. Browser: `node tests/a5-ui.mjs` (cần Playwright; dùng `PLAYWRIGHT_MODULE` nếu nằm ngoài dependency repo, `BROWSER_CHANNEL` mặc định `msedge`). Fixture dùng database tên ngẫu nhiên và tự dọn sau khi chạy.

## Dependency còn lại

- **Phú/Hoàng – migration sổ/check-in:** chuỗi migration cũ không chạy từ DB trống: `AddPatientBooksAndPaperBookTracking` và `AddReceptionCheckInBooks` tạo trùng `BookVerifiedAt`, `PatientBookId`, bảng PatientBooks; `RebuildSnapshot` còn khai báo tạo lại nhiều bảng có sẵn. Đây là lỗi trước A5. Bộ A5 tạo schema baseline từ model hiện tại và kiểm tra riêng migration Notifications; không coi kết quả này là xác nhận toàn bộ chuỗi migration cũ. DB local cấu hình mặc định còn nhiều migration Pending, nên chưa áp dụng migration A5 lên DB đó.
- **Thoại – Payment/Book thống nhất:** chưa có entity/service Payment riêng hoặc luồng cập nhật trạng thái Invoice tổng quát. Invoice hiện được tạo trực tiếp Paid; cấp sổ/check-in dùng BookInvoices riêng. Khi chuyển sang Payment chung, cần giữ guard chuyển trạng thái Book sang Paid và gọi cơ chế stage/publish tại transaction cuối; cần liên kết Book Invoice chung với PatientBooks trước khi dùng để cấp sổ. A5 đã nối hai điểm lưu đang tồn tại, không thay cơ chế cấp sổ hiện tại.
- **Phú – hồ sơ tài khoản:** bác sĩ/Trưởng khoa cần `Doctor.UserId` liên kết user; lịch khoa cần hồ sơ Trưởng khoa đang hoạt động. Người nhận bị khóa hoặc không có quyền liên quan được loại khỏi thông báo.
