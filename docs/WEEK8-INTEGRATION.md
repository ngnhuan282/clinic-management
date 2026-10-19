# Week 8 — Duyệt ca, lịch khoa và thống kê tích hợp Auth/JWT/SignalR

Ngày triển khai: 19/10/2026. Nhánh: `feat/week8-department-integration`, tạo từ `origin/main` tại `035d349`. Phạm vi theo yêu cầu week 8: hoàn thiện tích hợp, phân quyền và kiểm thử các chức năng đã có ở A4/A6/A7.

## Chức năng

- Quyền `schedules.viewDepartment` dành cho DepartmentHead, kiểm tra tại API lịch khoa, API bộ lọc, menu và route frontend. Có thể thu hồi độc lập với `schedules.review` và `reports.departmentStatistics`.
- Khoa được xác định từ `Doctors.UserId` của JWT hiện tại. Hồ sơ bác sĩ hoặc khoa không hoạt động không được xem lịch/thống kê. ID khoa từ query/body không thay đổi phạm vi truy cập; bộ lọc bác sĩ/phòng ngoài khoa trả 403.
- Duyệt/từ chối dùng chung service cho hai đường dẫn API hiện có. Trưởng khoa chỉ duyệt ca của bác sĩ thuộc khoa mình, không tự duyệt và không duyệt ca của trưởng khoa khác. Ca của trưởng khoa do Admin có `schedules.review` duyệt.
- Kiểm tra trùng bác sĩ hoặc phòng trong cùng ngày theo khoảng nửa mở `[StartTime, EndTime)`. Hai ca tiếp giáp được phép; trùng lịch trả 409. Transaction Serializable và liên kết RequestId bảo vệ việc duyệt đồng thời, không tạo hai lịch cho một yêu cầu.
- Bổ sung kiểm tra khoa hoạt động và bác sĩ/phòng cùng khoa cho cả duyệt ca và tạo lịch trực tiếp bởi Admin.
- SignalR làm mới danh sách duyệt, lịch khoa và thống kê sau khi transaction hoàn tất. Thêm hồ sơ khám đầu tiên vẫn cập nhật lượt khám khi lịch hẹn đã ở InProgress trước đó.
- Khi kết nối lại, frontend đọc lại API theo kỳ/bộ lọc đang chọn; logout/đổi tài khoản dọn kết nối và dữ liệu hiển thị được gắn với UserId.

## API và quyền

| API | Điều kiện |
| --- | --- |
| `POST /api/doctor-schedules/request` | Doctor/DepartmentHead; lấy bác sĩ từ tài khoản, chỉ đăng ký phòng cùng khoa. |
| `GET /api/schedule-requests`, `GET /api/schedule-requests/{id}` | Admin/DepartmentHead + `schedules.review`; trưởng khoa chỉ xem yêu cầu có cả bác sĩ và phòng cùng khoa. |
| `POST /api/schedule-requests/{id}/approve`, `/reject` | Cùng quyền duyệt; thêm kiểm tra người gửi, phạm vi, trạng thái và xung đột. Reject cần `rejectReason`. |
| `POST /api/doctor-schedules/{id:int}/approve`, `/reject` | Alias dùng cùng service và kiểm tra quyền. |
| `GET /api/doctor-schedules/department?date=yyyy-MM-dd` | DepartmentHead + `schedules.viewDepartment`; hoặc dùng `weekStart`, không truyền cả hai. |
| `GET /api/doctor-schedules/department/options` | DepartmentHead + `schedules.viewDepartment`; bác sĩ/phòng của khoa hiện tại. |
| `GET /api/department-head/statistics?fromDate=...&toDate=...` | DepartmentHead + `reports.departmentStatistics`; giữ contract [A7/1.0](api/department-head-statistics.md). |
| `GET /api/doctor-schedules`, `/available-slots` | Giữ API công khai phục vụ đặt khám; chỉ công bố ca Approved/active, không trả thông tin người duyệt của lịch khoa. |

401: thiếu/sai/hết hạn JWT, tài khoản khóa hoặc phiên bị thu hồi. 403: sai vai trò, thiếu quyền, khác khoa hoặc tự duyệt. 409: trạng thái không còn Pending hoặc trùng lịch. Giữ envelope `ApiResponse` và các mã lỗi hiện có; A7 dùng 1010 khi thiếu hồ sơ/khoa hoạt động.

## Hợp đồng SignalR

Hub hiện có: `/hubs/notification`, yêu cầu JWT. Sự kiện mới **`DepartmentWorkflowChanged`**:

```json
{"departmentId":1,"area":"Schedules"}
```

| `area` | Nguồn thay đổi sau khi lưu thành công | Màn hình đọc lại |
| --- | --- | --- |
| `Schedules` | Gửi/duyệt/từ chối yêu cầu, Admin tạo lịch trực tiếp; tạo/đổi/hủy lịch hẹn làm thay đổi số chỗ đã đặt. | Danh sách duyệt, lịch khoa, thống kê kỳ đang chọn. |
| `Statistics` | Bắt đầu/hoàn thành khám; tạo/cập nhật hồ sơ khám, kể cả trạng thái lịch hẹn giữ nguyên. | Thống kê kỳ đang chọn. |

Máy chủ xác định khoa từ DoctorId trong nghiệp vụ đã lưu, rồi gửi qua `Clients.Users`. Người nhận phải là DepartmentHead đang hoạt động, có hồ sơ bác sĩ hoạt động tại khoa đó và quyền hiện tại trong DB. `Schedules` cần một trong ba quyền lịch/duyệt/thống kê; `Statistics` cần `reports.departmentStatistics`. Admin, bác sĩ thường và trưởng khoa khác khoa không nhận sự kiện này.

Payload chỉ có hai trường để yêu cầu đọc lại API được phân quyền, không chứa bệnh án, bệnh nhân, doanh thu hoặc số đếm. Không có thao tác join group theo DepartmentId do client cung cấp. Sự kiện này không tạo thêm lịch sử thông báo. Thông báo gửi yêu cầu/kết quả duyệt đã có vẫn được lưu và gửi riêng. Lỗi gửi realtime được ghi log, không biến transaction đã commit thành lỗi để người dùng gửi lại nghiệp vụ.

## Auth/JWT và cấu hình tích hợp

- Dùng lại JWT bearer, `ICurrentUserService`, DB permissions, `NotificationHub` và `NotificationUserIdProvider`; không tạo cơ chế đăng nhập riêng.
- HTTP gửi `Authorization: Bearer <accessToken>`. SignalR dùng `accessTokenFactory: getAccessToken`; JWT qua query `access_token` chỉ được chấp nhận trong đường dẫn hub.
- Access token được kiểm tra chữ ký, issuer, audience, thời hạn, tài khoản hoạt động, RoleId/role và SecurityVersion hiện tại. Thu hồi quyền/đổi vai trò/khóa tài khoản làm mất hiệu lực access/refresh token và đóng kết nối hub đang mở trên API instance hiện tại.
- Refresh dùng cookie HttpOnly `clinic_refresh`; frontend chia sẻ một promise refresh cho các request đồng thời. Không ghi refresh token trong storage hoặc JSON phía client. Logout thu hồi refresh cookie và dừng kết nối frontend; access token cũ vẫn tuân theo thời hạn hiện có của hệ thống.
- FE: `VITE_API_BASE_URL` (mặc định `http://localhost:5212/api`), `VITE_SIGNALR_HUB_URL` (mặc định suy ra cùng máy chủ API). BE: `Cors__FrontendUrl` là origin FE được phép; giữ các cấu hình `Jwt__*` và `AuthCookie__*` hiện có.
- Trường hợp nhiều API instance cần backplane/shared connection revocation theo kiến trúc triển khai; phần hiện tại dùng registry kết nối trong một process.

## Migration

`20261019010000_AddDepartmentSchedulePermission` chỉ thêm permission và grant cho role tìm bằng tên `DepartmentHead`, có Up idempotent và Down xóa riêng permission đó. EF snapshot, PermissionCatalog và demo role grants đồng bộ. Không đổi schema hay vai trò tài khoản.

Kiểm tra snapshot/model cũng phát hiện khai báo lặp `InsuranceDiscountPercent` ghi đè kiểu `decimal(5,2)` bằng `decimal(18,2)` trong snapshot cũ. Đã bỏ khai báo lặp để metadata khớp model và migration hiện có; không thêm thay đổi cột hay sửa migration hóa đơn.

Kiểm thử hồi quy tích hợp phát hiện các lỗi validation khi lập hóa đơn đang ném `InvalidOperationException`, dẫn tới 500 thay vì 400. Các guard của `CreateInvoiceAsync` đã chuyển sang `AppException(INVALID_REQUEST)`, giữ nguyên thông báo và quy tắc thanh toán; khoản phí bị từ chối không tạo hóa đơn hoặc phát sự kiện.

Luồng cấp lại sổ trong cùng bộ hồi quy cũng thiếu bước chuyển sổ Issued cũ sang Replaced và gắn PreviousBookId khi tái sử dụng sổ Pending. Đã khôi phục các bước này trong một transaction, lưu việc thu hồi sổ cũ trước để không vi phạm unique index, chặn thay sổ đang dùng trong ca khám chưa kết thúc và chỉ phát SignalR sau commit. Fixture check-in cũ được cập nhật thành `bookPresented=true` theo quy tắc xác minh sổ hiện có.

Khi áp dụng vào database hiện tại, chạy migration bằng quy trình cập nhật database của dự án (`dotnet ef database update --project backend/ClinicManagement`). Bộ kiểm thử chỉ tạo/xóa database LocalDB tên ngẫu nhiên; không cập nhật database cấu hình của ứng dụng. Dữ liệu demo có thao tác thay dữ liệu nên không chạy trong đợt triển khai này.

## Kiểm chứng

Lệnh từ root, trừ npm chạy trong `frontend/clinic-management-client`:

```powershell
dotnet build tests/Week2Verification/Week2Verification.csproj --no-restore
dotnet run --no-build --no-restore --project tests/Week2Verification -- --week8
node tests/week8-ui.mjs --production
npm test
npm run lint
npm run build
```

Browser runner dùng Playwright đã cài (`PLAYWRIGHT_MODULE` nếu không resolve được module mặc định) và Edge headless; có thể đặt `BROWSER_CHANNEL`. Runner chạy cả bộ API, dùng DB migrate thật, mở các phiên độc lập, rồi dọn API/database. Sau browser production test, chạy `npm run build` với môi trường bình thường để dist dùng lại API cấu hình mặc định.

| Kiểm tra | Kết quả thực tế |
| --- | --- |
| Build project kiểm thử và backend, `--no-restore` | Đạt, 0 warning / 0 error. |
| `--week8` | **222 kiểm tra đạt**, gồm A4/A7 API, migration quyền mới, snapshot/model, JWT thật và WebSocket SignalR. |
| `node tests/week8-ui.mjs --production` | Đạt trên Edge headless: duyệt qua UI làm mới phiên khác cùng khoa, không làm mới khoa khác; gửi/từ chối ca; đóng cả hai phía WebSocket để tạo mất kết nối, mở transport mới và lấy bù dữ liệu; refresh JWT bằng cookie HttpOnly; logout và menu/route 403. Không có uncaught browser exception. |
| `--clinic-realtime` | **69 kiểm tra đạt**: đặt/đổi/hủy, chống trùng đồng thời, phạm vi người nhận, thanh toán/cấp lại sổ, rollback, check-in và hoàn thành khám. |
| `--c6c7` | **66 kiểm tra đạt**, gồm cấp lại sổ Pending/Issued/Lost, lịch sử PreviousBookId và sổ đang dùng trong ca khám. |
| `--billing-migrations-only` | **9 kiểm tra đạt**: upgrade/downgrade/reapply, giữ dữ liệu bảo hiểm và liên kết lịch hẹn nullable. |
| `node --test --test-reporter=spec tests/*.test.mjs` ở frontend | **62/62 đạt**. |
| `npm run lint` | Đạt, 0 error / 0 warning. |
| `npm run build` sau browser test | Đạt; dist đã build lại bằng cấu hình API bình thường. |
| `node --check tests/week8-ui.mjs`, `git diff --check` | Đạt. |

Các kiểm tra dùng chuỗi migration thật trên SQL Server LocalDB, không dùng `--model-schema`. Khoa/phòng/bác sĩ đúng phạm vi, tự duyệt/duyệt trưởng khoa khác, xung đột và duyệt đồng thời đều được xác minh bằng cả HTTP và dữ liệu lưu. Thu hồi quyền, khóa tài khoản và đổi vai trò kiểm tra đồng thời access token, refresh token và đóng socket đang mở. Sự kiện chỉ được thấy sau commit, và API đọc ngay sau đó trả dữ liệu đã cập nhật.

Các vấn đề migration legacy đã ghi trong [WEEK6-A6.md](WEEK6-A6.md) không thuộc thay đổi week 8: ca nâng cấp dữ liệu cũ có trạng thái sổ `Voided` cần thống nhất nghiệp vụ ánh xạ trạng thái. Chuỗi migration từ database trống được kiểm tra riêng trong bộ week 8.
