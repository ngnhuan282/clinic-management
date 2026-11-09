# Hoàn thiện chức năng Admin của Nguyễn Văn Nhuận — 09/11/2026

## Phạm vi theo phân công

Đối chiếu với [báo cáo chức năng ngày 04/11](BAO-CAO-DOI-CHIEU-CHUC-NANG-DSDK-2026-11-04.md), dựa trên đặc tả và bảng tiến độ của nhóm:

| Mục | Phần thiếu thuộc Nhuận | Kết quả bổ sung |
|---|---|---|
| III.4 — Hồ sơ nhân sự | Tài khoản/quyền (A3): form sửa chưa lưu API; tạo tài khoản chưa có API quản trị riêng | Đã lưu thông tin tài khoản; tạo nhân viên với vai trò; liên kết hồ sơ bác sĩ có sẵn; thống kê và danh sách dùng dữ liệu thật |
| III.11 — Quản lý đánh giá | Reviews (A6): thiếu điểm trung bình theo bác sĩ | Đã có API và bảng tổng hợp điểm, số đánh giá công khai/đã ẩn; lọc bác sĩ và phân trang |

III.4 vẫn là chức năng chung còn một phần: CRUD hồ sơ Doctor/Staff, phân khoa/chuyên khoa và vị trí công việc thuộc Phú (B4–B6). Màn hình tài khoản hiển thị thông tin liên kết thực tế; không thay thế CRUD hồ sơ nhân sự. III.9 (cấu hình phòng khám) chưa có phân công riêng; III.12 (báo cáo toàn phòng khám) thuộc Thoại (E7). Các chức năng Admin khác của Nhuận đã có theo báo cáo đối chiếu.

## Tài khoản

Trang `/internal/users` hỗ trợ tạo nhân viên, sửa họ tên/email/điện thoại, tìm theo tên đăng nhập/họ tên/email/điện thoại, lọc vai trò/trạng thái, phân trang và xuất trang hiện tại ra CSV có dấu. Tổng tài khoản/hoạt động/đã khóa tính trên toàn bộ kết quả của bộ lọc. Các thông tin khoa/bác sĩ lấy từ liên kết hồ sơ trong database.

- Tạo nhân viên dùng API quản trị riêng, không gọi đăng ký bệnh nhân và không thay refresh cookie của Admin.
- Doctor/DepartmentHead phải chọn một hồ sơ bác sĩ đang hoạt động, có khoa/chuyên khoa hợp lệ và chưa liên kết tài khoản. Tạo tài khoản, gắn hồ sơ và ghi audit nằm trong cùng giao dịch; xung đột trả 409 và không để lại tài khoản dở dang.
- Không tạo tài khoản Patient qua form nhân viên. Vai trò tùy chỉnh đã khai báo có thể được Admin có đủ quyền gán khi tạo.
- Mật khẩu được hash qua `IPasswordHasherService`, tối thiểu 8 ký tự và tối đa 72 byte UTF-8. Response không chứa hash hoặc token.
- Sửa thông tin không đổi vai trò, trạng thái, mật khẩu hay phiên đăng nhập. Payload chứa trường ngoài hợp đồng bị từ chối. Đổi vai trò/khóa/mở khóa giữ luồng xác nhận và cơ chế thu hồi phiên hiện có.
- CSV chỉ xuất trang đang xem; có BOM UTF-8, thoát dấu ngoặc kép/xuống dòng và bảo vệ giá trị có thể bị phần mềm bảng tính hiểu thành công thức.

| API | Quyền của Admin | Hợp đồng |
|---|---|---|
| `POST /api/users` | `accounts.create` **và** `accounts.assignRole` | `{ username, password, fullName, email?, phone?, roleId, doctorId? }`; 201 + `UserResponse` |
| `PUT /api/users/{id}` | `accounts.update` | `{ fullName, email?, phone? }`; 200 + `UserResponse` |
| `GET /api/users/summary` | `accounts.view` | Lọc `search`, `roleId`, `status`; trả `{ total, active, locked, roles }` |
| `GET /api/users/available-doctor-profiles` | `accounts.view` | `search`, `pageNumber`, `pageSize`; trả danh sách phân trang hồ sơ đủ điều kiện |

Các API trên đều yêu cầu vai trò Admin bên cạnh quyền tương ứng. `GET /api/users` giữ hợp đồng phân trang, bổ sung `doctorId`, `doctorName`, `departmentName` có thể null. `PATCH /api/users/{id}/role` và `/status` được giữ nguyên.

## Đánh giá

`GET /api/reviews/admin/statistics` chỉ dành cho Admin, nhận `doctorId?`, `pageNumber`, `pageSize`. Response gồm `totals` và `doctors` (phân trang). Mỗi dòng bác sĩ có tên, khoa, tổng số đánh giá, số công khai/đã ẩn, `averageRating` (tất cả) và `publicAverageRating` (chỉ công khai).

Trung bình và tổng số tính trên mọi đánh giá phù hợp, độc lập với trang danh sách. Không có đánh giá trả trung bình null; giao diện hiển thị “Chưa có”. Ẩn/hiện nhận xét tải lại cả danh sách và thống kê: điểm công khai thay đổi theo trạng thái, điểm tất cả giữ nguyên. Trang `/internal/reviews` cho chọn bác sĩ từ bảng tổng hợp, xóa lọc và phân trang nhận xét riêng.

## Cập nhật quyền và database

Migration `20261109090000_CompleteAdminAccounts` chỉ cập nhật dữ liệu quyền: bật `accounts.create`, bổ sung grant còn thiếu cho Admin và đổi nhãn `accounts.update`. Không thêm/sửa cấu trúc bảng. Với database đã theo đầy đủ chuỗi migration, chạy từ gốc repository:

```powershell
dotnet ef database update --project backend/ClinicManagement
```

Với database phát triển còn thiếu migration của module khác, có thể áp dụng riêng [SQL quyền tài khoản](../backend/ClinicManagement/Data/Seed/20261109-admin-accounts.sql) trong đúng database đã có RBAC. Script có giao dịch, chạy lặp an toàn và không sửa lịch sử migration. Sau này chạy migration đầy đủ vẫn áp dụng được. Không chạy lại seed dữ liệu mẫu để bật quyền. Làm mới trang hoặc đăng nhập lại để giao diện tải lại quyền; khởi động lại backend nếu đang chạy bản build cũ.

## Kiểm chứng

```powershell
dotnet build tests/UiRefreshVerification -c Release
node tests/admin-completion-ui.mjs
cd frontend/clinic-management-client
node --test --test-reporter=dot tests/*.test.mjs
npm run build
```

Nếu Playwright không nằm trong dependencies của repository, đặt `PLAYWRIGHT_MODULE` tới ESM module đã cài. Runner dùng Edge headless, tự tạo API/Vite và database LocalDB ngẫu nhiên; dọn database khi kết thúc, không tạo tài khoản/đánh giá vào database đang dùng. Ảnh kiểm tra nằm tại `.tmp/admin-completion/`.

Kiểm tra API gồm 401/403, thiếu từng quyền tạo/gán vai trò, trùng tên/email, dữ liệu sai, chống sửa lẫn quyền qua payload hồ sơ, lưu hồ sơ và audit, liên kết Doctor/DepartmentHead, xung đột liên kết đồng thời, không ghi đè cookie Admin, tổng số ngoài trang hiện tại, trung bình và ẩn/hiện đánh giá. Kiểm tra giao diện gồm tạo/sửa/lưu sau tải lại, chọn hồ sơ bác sĩ, đổi vai trò/khóa, CSV, tự khóa/tự đổi vai trò, lọc/phân trang/ẩn-hiện đánh giá, lỗi tải/thử lại và bố cục 1440/768/390/320 px.

Kết quả ngày 09/11/2026: build backend và frontend thành công; 82 unit test frontend, bộ kiểm tra API mở rộng và 21 kiểm tra trình duyệt đều qua; database tạm đã được dọn. Backend build có cảnh báo NU1900 vì môi trường không truy cập được nguồn dữ liệu kiểm tra lỗ hổng NuGet; không có lỗi biên dịch. Trên LocalDB `ClinicManagementDb` của workspace, đã áp dụng riêng script quyền tài khoản và xác minh `accounts.create` được bật, Admin có grant tương ứng. Các migration cũ còn thiếu được giữ nguyên để xử lý theo module.
