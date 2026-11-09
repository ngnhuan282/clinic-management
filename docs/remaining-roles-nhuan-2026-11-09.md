# Các vai trò còn lại — phần Nguyễn Văn Nhuận phụ trách

Ngày cập nhật: 09/11/2026. Phân công dựa trên [báo cáo đối chiếu](BAO-CAO-DOI-CHIEU-CHUC-NANG-DSDK-2026-11-04.md) và các đầu việc A1–A11 trong bảng tiến độ. Phần Admin đã được ghi tại [tài liệu riêng](admin-nhuan-completion-2026-11-09.md).

## Phạm vi hoàn thiện

| Vai trò / mục chức năng | Kết quả trong đợt này |
|---|---|
| Bệnh nhân — II.10 | Lưu và nhận thông báo có kết quả xét nghiệm; mở đúng chi tiết từ chuông thông báo, đánh dấu đã đọc; danh sách và chi tiết đang mở tự cập nhật |
| Bác sĩ — V.9 | Nhận thông báo kết quả của chỉ định do mình tạo, mở chi tiết và tự cập nhật kết quả |
| Trưởng khoa — phần nghiệp vụ bác sĩ ở IV.7 | Dùng cùng luồng kết quả cho các chỉ định của bản thân; không nhận thông báo chỉ vì cùng khoa |
| Kỹ thuật viên — kết nối thông báo IX.5 | Hoàn tất kết quả đồng thời lưu thông báo cho đúng Bệnh nhân và Bác sĩ/Trưởng khoa chỉ định; phát SignalR sau khi commit |
| Thu ngân — phần vai trò/quyền VII.1 | Có vai trò hệ thống `Cashier` và ba quyền mặc định; đăng nhập vào quầy thu ngân, bảo vệ menu/route/API theo quyền thực tế |
| Lễ tân và Bệnh nhân — thông báo lịch hẹn | Mã hiện tại đã lưu thông báo lịch hẹn; kiểm tra lại lịch sử lưu trữ, giữ các sự kiện tiếp nhận đã có |
| Dược sĩ | Vai trò/quyền cấp thuốc đã có; giữ điều hướng thông báo rà soát thuốc khi bổ sung điều hướng kết quả |

Phần hồ sơ Patient của II.2 thuộc Phú; hồ sơ khám/chỉ số sinh tồn thuộc Nguyên; liên kết xét nghiệm với lượt khám, hàng chờ và thanh toán xét nghiệm thuộc Thoại. Các chức năng thu ngân về hóa đơn theo đợt, nhiều lần thu, số dư, điều chỉnh/hoàn tiền cũng thuộc Thoại. Đợt này hoàn thiện phần hạ tầng, phân quyền và tích hợp thông báo của Nhuận; không đánh dấu hoàn tất toàn bộ các mục chung đó.

## Thông báo kết quả

- Kết quả, trạng thái `Completed` và bản ghi `Notifications` được lưu trong cùng giao dịch. Nếu lưu thông báo thất bại, kết quả và trạng thái cũng được rollback. Hai yêu cầu hoàn tất đồng thời chỉ được tạo một kết quả và một thông báo cho mỗi người nhận; yêu cầu trùng/xung đột trả 409.
- Người nhận là tài khoản Patient sở hữu chỉ định và Doctor/DepartmentHead đã tạo chỉ định, đang hoạt động và còn quyền xem tương ứng. Mô hình hiện tại lưu `LabTest.DoctorId` và `PatientId` theo **UserId**; không dùng nhầm mã hồ sơ Doctor/Patient để gửi thông báo.
- Không phát đến bệnh nhân khác, bác sĩ khác, Trưởng khoa chỉ cùng khoa, lễ tân, Thu ngân hoặc kỹ thuật viên. Thông báo chỉ báo có kết quả và mã chỉ định, không đưa nội dung kết quả/chẩn đoán vào sự kiện.
- `NotificationReceived` giữ hợp đồng cũ. Sự kiện mới `LabResultChanged` có payload `{ labTestId }` để yêu cầu giao diện đọc lại API được bảo vệ. Gửi realtime xảy ra sau commit; lỗi gửi không làm thao tác lưu đã thành công bị báo thất bại. Người ngoại tuyến có thể đọc lại lịch sử khi đăng nhập.
- `GET /api/notifications` giữ phân trang, bổ sung `labTestId` có thể null. Đánh dấu đã đọc vẫn dùng `PATCH /api/notifications/{id}/read` và chỉ áp dụng cho người sở hữu.
- Thông báo dẫn Bệnh nhân đến `/lab-results?labTestId=...`; Doctor/DepartmentHead đến `/internal/doctor/lab-orders?labTestId=...`. API chi tiết vẫn xác minh quyền và sở hữu; sửa URL không cho phép đọc dữ liệu người khác.
- Bổ sung chuông thông báo trên thanh điều hướng của Bệnh nhân, dùng được trên máy tính và điện thoại; người chưa đăng nhập không hiển thị chuông.
- Danh sách và hộp thoại chi tiết tự đọc lại khi có sự kiện hoặc kết nối lại SignalR. Yêu cầu cũ bị hủy khi đổi người dùng, chỉ định hoặc lượt tải; có trạng thái đang tải, lỗi và thử lại.

## Vai trò và quyền Thu ngân

Migration `20261109100000_CompleteCashierRole` tạo/cập nhật vai trò `Cashier` và bổ sung `billing.view`, `billing.create`, `billing.recordPayment`. Đây là cập nhật dữ liệu, không đổi cấu trúc bảng.

SQL cấp vai trò theo tên, giữ nguyên ID của Cashier đã được tạo thủ công và các tài khoản/quyền đang có. Nếu ID 8 đã được vai trò khác sử dụng, script cấp ID mới thay vì ghi đè. Vì vậy Cashier được cấp qua migration, không gắn dữ liệu seed EF với một ID cố định trong model. Script chạy lặp không nhân đôi vai trò hoặc quyền. `Down` giữ lại vai trò và grant để không ảnh hưởng tài khoản có sẵn; việc thu hồi quyền cần thực hiện rõ ràng qua quản trị RBAC.

| Thao tác | Điều kiện |
|---|---|
| Mở menu/route `/internal/cashier/billing` | Admin hoặc Cashier, có `billing.view` |
| Xem hàng chờ, lịch sử, chi tiết `/api/invoices` | Cùng vai trò và quyền xem |
| Tạo hóa đơn hoặc chứng từ điều chỉnh | Có cả `billing.create` và `billing.recordPayment`, vì API hiện ghi nhận thanh toán ngay |
| Vào Admin, dữ liệu lâm sàng, duyệt lịch | Không tự cấp các quyền này cho Cashier |

Giao diện vô hiệu thao tác thu tiền/điều chỉnh khi thiếu quyền. API kiểm tra độc lập với giao diện. Người lập chứng từ lấy từ `ICurrentUserService`, không dùng ID mặc định. Vai trò hệ thống được bảo vệ khỏi đổi tên/xóa theo cơ chế RBAC hiện có; Admin vẫn quản lý được bộ quyền hợp lệ.

Với database đã cập nhật đầy đủ migration, chạy từ gốc repository:

```powershell
dotnet ef database update --project backend/ClinicManagement
```

Nếu database phát triển còn thiếu migration module khác, áp dụng riêng [SQL vai trò Cashier](../backend/ClinicManagement/Data/Seed/20261109-cashier-role.sql) vào database đã có RBAC. Script có giao dịch và không sửa lịch sử migration. Không chạy lại seed dữ liệu mẫu để nâng cấp. Khởi động lại backend đang chạy bản cũ và đăng nhập lại để tải quyền mới. Script seed toàn bộ dữ liệu mẫu cũng đã được cập nhật cho database tạo mới, nhưng vẫn là script xóa/nạp lại dữ liệu như trước.

## Kiểm thử

```powershell
dotnet build tests/UiRefreshVerification -c Release
node tests/UiRefreshVerification/smoke.mjs --remaining-roles
node tests/remaining-roles-ui.mjs
cd frontend/clinic-management-client
node --test --test-reporter=dot tests/*.test.mjs
npm run build
```

Runner giao diện dùng Edge headless; đặt `PLAYWRIGHT_MODULE` tới Playwright ESM module đã cài nếu cần. Cả hai runner đều tạo LocalDB ngẫu nhiên, chạy chuỗi migration thật, dọn database và không ghi dữ liệu nghiệp vụ vào database đang dùng. Ảnh nằm tại `.tmp/remaining-roles/`.

Kiểm tra gồm cấp Cashier trên database mới/nâng cấp/chạy lặp, quyền xem/tạo/thu tiền tách biệt, API 401/403, gửi SignalR đúng tài khoản, lịch sử và đọc thông báo, truy cập kết quả người khác, hoàn tất đồng thời, rollback khi lưu thông báo lỗi, kết quả nhận khi ngoại tuyến, tự cập nhật hộp thoại và điều hướng của các vai trò. Runner giao diện cũng bật các kiểm tra API Admin đã bổ sung ở đợt trước để kiểm tra hồi quy.

Trên LocalDB `ClinicManagementDb` của workspace, đã áp dụng riêng SQL Cashier và xác minh vai trò giữ ID 1021, chuyển thành vai trò hệ thống và có đủ ba quyền mặc định. Các quyền bổ sung được cấu hình từ trước được giữ nguyên; việc thu hẹp quyền theo thực tế vận hành có thể thực hiện qua màn hình quản lý vai trò.

Kết quả ngày 09/11/2026: build backend, hai project kiểm chứng và frontend thành công; 87 unit test frontend, 47 kiểm tra API/SignalR (gồm hồi quy Admin) và 18 kiểm tra trình duyệt đều qua. Đã kiểm tra bố cục kết quả ở 320/390/768/1440 px và ảnh desktop/mobile. Database kiểm thử đã được dọn. Build fixture có cảnh báo NU1900 do không truy cập được nguồn dữ liệu kiểm tra lỗ hổng NuGet; không có lỗi biên dịch.
