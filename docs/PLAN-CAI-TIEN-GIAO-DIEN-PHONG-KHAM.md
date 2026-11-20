# Kế hoạch cải tiến giao diện phòng khám

## Nhiệm vụ giao cho sub-agent

Triển khai cải tiến giao diện trong repo `clinic-management`. Cổng dành cho khách và bệnh nhân cần có phong cách phòng khám chuyên nghiệp, lấy xanh dương làm màu chủ đạo và dùng màu phẳng trên toàn bộ giao diện. Trang quản trị cần một cách trình bày thống nhất cho phân trang, tìm kiếm, thao tác trên dòng và nhập hoặc xuất dữ liệu ở các màn hình đã hỗ trợ. Hoàn thành thay đổi trong mã nguồn, kiểm thử các luồng và bàn giao kết quả theo tiêu chí bên dưới.

Đọc [hướng dẫn thiết kế](../DESIGN.md), [quy tắc dự án](<../RULES.md — Coding Rules forClinic Management System.md>) và kiểm tra trạng thái Git trước khi sửa. Dùng React, Material UI và các thành phần hiện có. Giữ hợp đồng API, route, quyền truy cập, cách lọc dữ liệu và nghiệp vụ đặt lịch, thanh toán, khám bệnh hiện hành. Dùng dữ liệu mẫu để kiểm thử và chụp ảnh.

## Cổng khách và bệnh nhân

- Rà các route theo [AppRoutes](../frontend/clinic-management-client/src/routes/AppRoutes.jsx) và bắt đầu từ [PatientLayout](../frontend/clinic-management-client/src/layouts/PatientLayout.jsx), thanh điều hướng, menu tài khoản và chân trang. Áp dụng cùng bộ màu cho trang chủ, chuyên khoa, bác sĩ, dịch vụ, bảng giá, liên hệ, đặt lịch khách và bệnh nhân, đăng nhập và đăng ký, hồ sơ, lịch hẹn, bệnh án, xét nghiệm, hóa đơn và đánh giá.
- Dùng xanh dương cho hành động chính, liên kết và trạng thái đang chọn. Dùng trắng, xanh nhạt và màu trung tính cho nền. Tạo phân cấp bằng khoảng trắng, đường viền, độ đậm chữ và bóng nhẹ. Giữ màu ngữ nghĩa cho cảnh báo, lỗi và thành công, kèm nhãn dễ hiểu. Cổng này dùng màu phẳng cho cả hero, nút, lớp phủ ảnh, các trạng thái hover, focus và pseudo-element. Tìm và loại `linear-gradient`, `radial-gradient` và `conic-gradient` ở bất kỳ lớp nào được render trong phạm vi cổng. Đặt style theo layout hoặc biến màu dùng chung có phạm vi rõ ràng để các component chia sẻ với cổng nội bộ tiếp tục hoạt động đúng.
- Làm rõ hành động chính của từng trang. Trang chủ ưu tiên **Đặt lịch khám** và **Tìm bác sĩ**. Danh sách bác sĩ ưu tiên lọc, đọc thông tin chuyên môn và chuyển sang đặt lịch. Form đặt lịch cần dễ đọc ở từng bước, có thông báo khi giờ đầy, lỗi gửi hoặc đặt thành công. Trên màn hình nhỏ, menu, nhãn form và nút chính phải dễ chạm, chữ tiếng Việt dài không bị cắt và cả trang không cuộn ngang.
- Dùng tên phòng khám từ cấu hình làm nguồn nhận diện chính. Bắt đầu từ `useClinicInfo()`, `GET /api/public/clinic-settings` và trang **Cấu hình phòng khám**. Rà tên thương hiệu trong header, footer, trang xác thực, tab trình duyệt, mô tả HTML, trang lỗi, nội dung liên hệ, cổng nội bộ và mẫu in phiếu thu. Các tên cần dò gồm `ClinicManagementSystem`, `Clinic Management System`, `MedClinic` và `MediFlow`. Chỉ thay các chuỗi hiển thị và metadata thuộc thương hiệu. Đọc [hook cấu hình công khai](../frontend/clinic-management-client/src/api/publicApi.js), [nội dung dự phòng](../frontend/clinic-management-client/src/data/publicContent.js), [HTML khởi động](../frontend/clinic-management-client/index.html) và [mẫu in](../frontend/clinic-management-client/src/pages/internal/CashierBillingPage.jsx).
- Vì tên thật chưa được cung cấp, dùng `Phòng khám Đa khoa` khi chưa có cấu hình hợp lệ. Dùng `Phòng khám Đa khoa ABC` làm dữ liệu kiểm thử để xác minh tên lấy từ cấu hình. Khi tải chậm hoặc API lỗi, UI vẫn hiển thị tên dự phòng ổn định. Dữ liệu tên, địa chỉ, giờ làm việc và số liên hệ do quản trị viên đã lưu phải được giữ đúng. Thông tin công bố cho bệnh nhân cần dựa trên dữ liệu có thật trong cấu hình, kể cả tuyên bố về tiêu chuẩn phòng khám và nội dung tư vấn liên hệ.

## Trang quản trị

Lấy danh sách trang theo quyền Admin từ [roleAccess.js](../frontend/clinic-management-client/src/routes/roleAccess.js). Rà một lượt các trang có bảng, bao gồm tài khoản, hồ sơ bác sĩ và nhân viên, vai trò và lịch sử phân quyền, khoa, chuyên khoa, phòng, vị trí công việc, danh mục bệnh, loại xét nghiệm, đánh giá, lịch hẹn, lịch trực, duyệt ca, kho dược và thu ngân. Rà cả các bảng con và tab trong những trang này.

- Dùng `ClinicPagination` trong [ClinicPageHeader.jsx](../frontend/clinic-management-client/src/components/common/ClinicPageHeader.jsx) làm điểm xuất phát. Dùng cùng cách hiển thị số dòng, tổng số, nút trước và sau, trang hiện tại, kích thước trang và trạng thái tải. Chuyển đổi giữa trang bắt đầu từ 0 và từ 1 ở lớp gọi component. Giữ loại phân trang hiện có của dữ liệu, kể cả các bảng dùng Ant Design. Khi đổi bộ lọc hoặc kích thước trang, quay về trang đầu. Khi xóa bản ghi cuối ở một trang, điều chỉnh về trang còn dữ liệu.
- Dùng bộ icon và màu dùng chung trong [clinicUi.js](../frontend/clinic-management-client/src/components/common/clinicUi.js) để định nghĩa các hành động **Xem**, **Thêm**, **Sửa**, **Xóa**, **Tìm kiếm**, **Xuất dữ liệu** và **Nhập dữ liệu**. Dùng MUI Rounded nhất quán cho các hành động chung. Dùng nút có nhãn cho thao tác chính ở đầu bảng, icon button có tooltip và `aria-label` cho thao tác theo dòng. Giữ cùng kích thước, thứ tự, khoảng cách và trạng thái hover, focus, disabled. Dành màu nguy hiểm cho thao tác xóa. Các thao tác khóa, hủy hay ngừng hoạt động cần nhãn và icon thể hiện đúng hành vi hiện có.
- Thống nhất thanh tìm kiếm và bộ lọc. Dùng nhãn cụ thể như **Tìm theo tên hoặc số điện thoại** khi màn hình hỗ trợ các trường đó. Giữ cách tìm kiếm, reset, bộ lọc và loại dữ liệu xuất hiện hành của từng màn hình. Chỉ hiển thị **Nhập dữ liệu** và **Xuất dữ liệu** khi đã có chức năng và người dùng có quyền. Nếu một nút chỉ xuất trang hiện tại, ghi rõ phạm vi trong nhãn hoặc tooltip.
- Giữ header và bảng dễ quét bằng mắt. Căn số liệu nhất quán, cho phép bảng rộng cuộn trong vùng bảng trên mobile và để cột thao tác có chỗ hiển thị. Các trang được sửa đều có trạng thái tải, rỗng, lỗi và cách thử lại phù hợp.

## Thứ tự thực hiện

1. Lập danh sách route và màn hình cần chỉnh từ cấu hình route và quyền. Ghi lại nơi đang hiển thị thương hiệu cũ, các biến thể phân trang và các thao tác có sẵn. Chụp ảnh ban đầu của trang chủ, đặt lịch, tài khoản và một màn hình quản trị đang dùng kiểu phân trang khác.
2. Hoàn thiện bộ màu cổng bệnh nhân và cách lấy thương hiệu. Áp dụng trước cho layout, trang chủ, đăng nhập và luồng đặt lịch. Dùng các mẫu này cho các trang còn lại.
3. Hoàn thiện mẫu thanh công cụ quản trị, phân trang và nút thao tác. Áp dụng trước trên tài khoản, danh mục và một bảng kho dược. Mở rộng sang các màn hình Admin còn lại, xử lý các bảng dùng Ant Design qua adapter hoặc cùng thành phần phân trang.
4. Kiểm tra từng luồng, cập nhật ngắn gọn các quy ước vừa dùng trong `DESIGN.md` nếu cần, rồi bàn giao thay đổi cùng bằng chứng kiểm thử.

## Tiêu chí nghiệm thu

| Phạm vi | Kết quả cần xác minh |
|---|---|
| Màu và bố cục cổng bệnh nhân | Xanh dương là màu hành động chính. Các route trong phạm vi và trạng thái tương tác liên quan dùng màu phẳng. Ở 320, 390, 768 và 1440 px, điều hướng và form hoạt động, chữ không bị cắt và trang không cuộn ngang. |
| Nhận diện | Khi dùng cấu hình kiểm thử có tên khác mặc định, tên xuất hiện đúng ở các vị trí liên quan, gồm tab trình duyệt và phiếu in. Khi cấu hình thiếu hoặc lỗi, UI dùng tên dự phòng. Tên dự phòng và metadata tĩnh đều thống nhất. |
| Đặt lịch và tài khoản | Kiểm tra đường đi từ tìm bác sĩ đến một khung giờ, đặt lịch khách, đặt lịch khi đăng nhập, xem lịch hẹn và mở hồ sơ, xét nghiệm hoặc hóa đơn. Giữ trạng thái tải, lỗi và thông báo thành công đúng nghĩa. |
| Bảng quản trị | Mọi bảng phân trang trong phạm vi có một kiểu hiển thị. Kiểm tra danh sách rỗng, một trang, nhiều trang, đổi kích thước trang, lọc và xóa dòng cuối. Nút thao tác có cùng phong cách, dùng được bằng bàn phím và giữ đúng quyền. Xuất hoặc nhập dữ liệu ở màn hình có chức năng vẫn thực hiện đúng phạm vi. |
| Hồi quy | Chạy `npm run lint`, `npm test` và `npm run build` trong thư mục frontend. Từ gốc repo chạy `node tests/ui-regressions.mjs` trên bản production. Chạy `node tests/admin-completion-ui.mjs` sau khi build fixture Release theo [hướng dẫn kiểm thử](../tests/UiRefreshVerification/README.md). Bổ sung kịch bản có ý nghĩa nếu runner hiện tại chưa kiểm tra thương hiệu hoặc hành vi phân trang vừa thay đổi. |

Bàn giao danh sách màn hình đã chỉnh, cách dùng màu và thành phần chung, kết quả kiểm thử thực tế và ảnh trước sau đại diện cho desktop và mobile ở mỗi cổng. Ghi rõ mọi màn hình thuộc phạm vi còn cần xử lý và nguyên nhân nếu có.
