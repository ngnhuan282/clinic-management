# Tuần 10 — Kiểm thử chéo Trưởng khoa và release candidate

Candidate: **0.10.0-rc.1**. Phạm vi: ủy quyền Trưởng khoa theo DepartmentId, lịch bác sĩ/lịch khoa, thống kê khoa, query, UI và tích hợp Auth/JWT/SignalR. Nhánh `feat/week10-department-rc`, base `a94ccae`. Ngày: 20/10/2026.

RC được chốt bằng commit nguồn sạch, gói build Release, log của các cổng kiểm thử, `manifest.json` chứa commit/hash từng file và SHA-256 của ZIP. Trạng thái thực tế nằm trong manifest do `scripts/Prepare-ReleaseCandidate.ps1` sinh sau khi mọi cổng đạt; script dừng ngay khi có lỗi hoặc nguồn thay đổi trong lúc kiểm thử.

## Các lỗi đã sửa

1. `PATCH /api/doctors/{id}/account` trước đây đổi quyền theo khoa mà vẫn để access/refresh token và hub cũ hoạt động. Hiện tại thay đổi liên kết thật tăng SecurityVersion, thu hồi refresh token và ngắt SignalR cho cả chủ cũ lẫn chủ mới sau commit. Liên kết không đổi không thu hồi phiên; thất bại không ghi audit thay đổi quyền.
2. Liên kết đồng thời được bảo vệ bằng transaction Serializable và unique index hiện có. SQL deadlock/unique conflict, kể cả SqlException được EF bọc trong exception khác, trả 409 thay vì 500. Một tài khoản chỉ nhận một liên kết bác sĩ.
3. Query lịch tuần vượt `DateOnly.MaxValue`, đồng thời truyền ngày/tuần, ngày tối thiểu không hỗ trợ hoặc offset phân trang vượt Int32 trả 400. Không còn phép cộng/tràn số gây 500. Quy tắc chuẩn hóa pageNumber/pageSize hiện có được giữ.
4. Một Trưởng khoa có thêm quyền `schedules.manage` từ dữ liệu cũ vẫn phải tuân thủ phạm vi bác sĩ/phòng cùng khoa khi tạo lịch; quyền thêm không mở toàn phòng khám.
5. Chặn thời gian kết thúc `24:00`, không biểu diễn được trong cột SQL `time`, bằng 400 trước khi ghi dữ liệu. Phòng đăng ký cũng yêu cầu khoa của hồ sơ bác sĩ đang hoạt động.
6. Lịch khoa hủy request cũ, xóa dữ liệu/options cũ khi đổi bộ lọc/phiên, xử lý 403 qua route cấm truy cập và giữ lỗi nguồn thành lỗi thật. Thống kê, danh sách duyệt và form đăng ký được gắn UserId/phiên; đổi credentials làm vô hiệu dữ liệu cũ và đóng dialog của phiên trước. Không giữ token trong khóa cache.

Không đổi schema hay thêm migration tuần 10. Version backend, frontend, lockfile và `release-candidate.json` thống nhất `0.10.0-rc.1`.

## Ma trận kiểm thử chéo

| Tình huống | Kết quả yêu cầu |
| --- | --- |
| Hai trưởng khoa thuộc hai khoa, UserId khác DoctorId | Lịch, options, yêu cầu cá nhân và thống kê theo hồ sơ DB của từng người. |
| Giả DepartmentId bằng query/header/body/claim JWT hợp lệ | Không thay đổi khoa DB; claim role không khớp DB trả 401. |
| Lọc bác sĩ/phòng khoa khác | 403 trên lịch khoa, lịch bác sĩ và danh sách duyệt. |
| Đọc lịch theo GUID ngoài khoa hoặc ca có bác sĩ/phòng lệch khoa | 404; không trả chi tiết của ca. |
| Hai API available-slots | Không lộ ca/phòng khoa khác, ca chưa công bố hoặc không hoạt động cho trưởng khoa. |
| Đọc/duyệt yêu cầu khoa khác, tự duyệt | 403; kiểm tra cả alias duyệt cũ và API mới. |
| Tám tổ hợp view calendar / statistics / review | Ba quyền độc lập ở API, options, menu và route UI. |
| Admin/Doctor/Receptionist/Lab/Patient/custom role có grant đọc khoa giả lập | Vẫn 403 trên lịch khoa và thống kê dành riêng DepartmentHead. |
| Thiếu hồ sơ hoặc khoa/hồ sơ không hoạt động | Từ chối, không fallback toàn phòng khám; thống kê dùng 403/1010. |
| Thay tài khoản liên kết, rồi chuyển cùng UserId sang khoa khác | Thu hồi cả hai phiên liên quan, giữ phiên khoa khác; đăng nhập mới chỉ có khoa mới. |
| Hai thao tác liên kết đồng thời | Một liên kết thành công; thao tác còn lại trả 400/409, không có hai quyền khoa. |
| Source lỗi/response cũ bị trì hoãn/đổi tài khoản | UI xóa số liệu cũ, có retry; response của phiên trước không ghi đè phiên mới. |
| Thống kê lượt khám có record/appointment khác khoa | Không tính bản ghi không nhất quán; DTO vẫn đúng bảy trường, không có thông tin bệnh nhân. |

Contract thống kê giữ [A7/1.0](api/department-head-statistics.md). Request count thuộc khoa theo `Request.Doctor.DepartmentId` và `WorkDate`; generated schedules không cộng thêm vào Approved. Lịch công khai phục vụ đặt khám vẫn là API công khai. Bộ kiểm thử dùng SQL Server thật với database tên ngẫu nhiên, JWT và WebSocket thật; dữ liệu kiểm thử không ghi vào DB cấu hình của ứng dụng.

## Kiểm thử và dựng lại RC

Điều kiện máy dựng: .NET SDK hỗ trợ net8.0, SQL Server LocalDB, Node/npm, dependencies đã restore/cài, Playwright và Edge hoặc browser được cấu hình bởi `BROWSER_CHANNEL`. Nếu Playwright nằm ngoài project, đặt `PLAYWRIGHT_MODULE` thành module URL tương ứng. Không cài hay nâng phiên bản dependency trong quy trình RC.

```powershell
dotnet build tests/Week2Verification/Week2Verification.csproj --no-restore
dotnet run --no-build --no-restore --project tests/Week2Verification -- --week10
node tests/week10-ui.mjs
```

Runner tuần 10 luôn build production với `/api` và `/hubs/notification`, dùng proxy cùng origin cho HTTP/cookie/WebSocket, đi qua form đăng nhập thật và mô phỏng thu hồi quyền qua API thật. Runner tuần 8 giữ kiểm tra duyệt ca, realtime, reconnect và refresh JWT.

Sau khi commit mã đã review, chạy từ root:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/Prepare-ReleaseCandidate.ps1
```

Script chạy tuần tự: build Release, test frontend, lint, UI/API tuần 10, UI/API tuần 8, hồi quy clinic realtime, C6/C7, migration hóa đơn, publish API, kiểm thử lại tuần 10 bằng DLL/config đã publish và build frontend dùng URL tương đối. ZIP, log và manifest nằm trong `artifacts/rc/<version>-<timestamp>/`. Config được đóng gói chỉ chứa giá trị mẫu, khóa JWT và connection string để trống; các `appsettings` máy phát triển bị loại khỏi gói. Script không migrate DB cấu hình ứng dụng.

Kết quả kiểm chứng cuối cùng được ghi trong manifest/log kèm artifact; log API in số kiểm tra đã chạy, log Node ghi số test pass/fail. `git diff --check` và kiểm tra cú pháp runner/script cũng phải đạt trước khi commit.

## Áp dụng candidate

1. Xác minh SHA-256 ZIP và `manifest.json.sourceCommit` khớp tag `v0.10.0-rc.1`.
2. Sao lưu DB và dùng quy trình migration đã thống nhất. Schema yêu cầu đến `20261019010000_AddDepartmentSchedulePermission`; tuần 10 không có migration mới. Không chạy các script demo phá dữ liệu để triển khai RC.
3. Cung cấp `ConnectionStrings__DefaultConnection`, `Jwt__Key` đủ ít nhất 32 byte và `Cors__FrontendUrl` đúng origin qua môi trường/quản lý secret. `AuthCookie__Secure=true` khi chạy HTTPS; giữ issuer/audience thống nhất giữa các API instance.
4. Chạy `dotnet backend/ClinicManagement.dll` với môi trường Production và cấu hình HTTPS/reverse proxy. Serve thư mục frontend với fallback `index.html`; proxy `/api` và `/hubs/notification` đến API, cho phép WebSocket. Gói frontend đã kiểm chứng dùng các đường dẫn cùng origin này.
5. Smoke test đăng nhập trưởng khoa ở hai khoa: bộ lọc, lịch đã duyệt, thống kê kỳ, 403/404 ngoài khoa và phản hồi sau thu hồi quyền. Giữ ZIP/config đã triển khai trước để rollback ứng dụng; không downgrade DB tùy tiện.

## Giới hạn đã biết

- Đây là RC cho phạm vi Trưởng khoa tuần 10, không phải xác nhận toàn bộ nghiệp vụ của các nhóm khác đã nghiệm thu.
- Nâng cấp DB lịch sử có sổ `Voided` vẫn cần thống nhất ánh xạ trạng thái trước migration cũ `UpdatePatientBookStatuses`; không suy đoán chuyển thành Lost/Replaced. Candidate được kiểm chứng trên DB trống migrate thật và schema hiện tại. Chi tiết lịch sử: [WEEK6-A6.md](WEEK6-A6.md).
- Đóng kết nối SignalR khi thu hồi phiên đang dùng registry trong một process; triển khai nhiều API instance cần cơ chế chia sẻ revocation/backplane.
- Thống kê lịch sử theo khoa hiện tại của bác sĩ vì schema không lưu snapshot khoa tại thời điểm khám. Logout thu hồi refresh cookie và dừng frontend; access token cũ tiếp tục theo thời hạn/kiểm tra SecurityVersion hiện có.
