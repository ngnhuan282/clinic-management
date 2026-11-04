# Báo cáo đối chiếu chức năng theo danh sách đăng ký

Ngày rà soát: **04/11/2026**. Mã nguồn: nhánh `main`, HEAD `e70da3b`, cùng trạng thái thư mục làm việc tại thời điểm rà soát.

Nguồn yêu cầu: [BB_DoAn_ChucNangtheoDSDK (2).docx](<BB_DoAn_ChucNangtheoDSDK (2).docx>) trong `docs/`. Các mã I.1 đến IX.5 dưới đây giữ đúng nhóm và thứ tự của tài liệu.

Nguồn phân công: [Nhóm16 Tiến độ (2).xlsx][progress-source], sheet `Gantt`, các cột A (mã đầu việc), B (nội dung) và C (người phụ trách). Tên đầy đủ lấy từ `Trang chính!C5:C9`.

**Kết quả: 42/71 mục đã có triển khai chính, 26/71 mục mới làm một phần, 3/71 mục chưa có luồng nghiệp vụ đáp ứng yêu cầu.** Project đã có nền tảng cho các vai trò và phần lớn nghiệp vụ khám; các khoảng trống lớn tập trung ở thu ngân, liên kết xét nghiệm với lượt khám, thông báo kết quả, quản lý nhân sự và cấu hình.

Đây là đánh giá dựa trên mã nguồn frontend, API, service, entity và migration. “Đã có” không có nghĩa đã nghiệm thu toàn bộ trên hệ thống đang chạy. Một chức năng chỉ có tên trong README, quyền, chuỗi BillingStage hoặc dữ liệu mẫu không được coi là đã hoàn thành.

## Cách phân loại

- **Đã có:** tìm thấy triển khai chính và đường sử dụng tương ứng, đáp ứng các yêu cầu chính của mục đó khi dữ liệu/quyền cần thiết đã được cấu hình.
- **Một phần:** đã có mã xử lý hoặc giao diện nhưng thiếu một phần được nêu rõ trong tài liệu, chưa nối đủ luồng, hoặc có đường API chưa bảo vệ điều kiện bắt buộc.
- **Chưa có:** chưa tìm thấy luồng nghiệp vụ đáp ứng chức năng; khai báo dữ liệu hoặc API tổng quát nhận dữ liệu tự do chưa đủ để tính là đã triển khai chức năng đó.

Mỗi mục đánh số của tài liệu được tính một lần. Một thiếu sót có thể ảnh hưởng nhiều mục, ví dụ xét nghiệm của Bác sĩ và nghiệp vụ bác sĩ của Trưởng khoa. Các con số này không phải tỷ lệ khối lượng công việc hoặc tỷ lệ kiểm thử đạt.

## Tổng hợp theo nhóm

| Nhóm | Tổng mục | Đã có | Một phần | Chưa có |
|---|---:|---:|---:|---:|
| I. Khách chưa đăng nhập | 4 | 2 | 2 | 0 |
| II. Bệnh nhân | 10 | 6 | 4 | 0 |
| III. Quản trị viên | 12 | 8 | 3 | 1 |
| IV. Trưởng khoa | 7 | 6 | 1 | 0 |
| V. Bác sĩ | 9 | 6 | 3 | 0 |
| VI. Nhân viên lễ tân | 10 | 7 | 3 | 0 |
| VII. Thu ngân | 8 | 0 | 7 | 1 |
| VIII. Dược sĩ | 6 | 5 | 1 | 0 |
| IX. Kỹ thuật viên xét nghiệm | 5 | 2 | 2 | 1 |
| **Tổng** | **71** | **42** | **26** | **3** |

## Phân công theo bảng tiến độ

| Thành viên | Mã đầu việc và vị trí trong sheet Gantt | Phần phụ trách |
|---|---|---|
| **Nguyễn Văn Nhuận** (Nhuận) | A1–A11; `Gantt!A3:C13` | Hạ tầng, Auth/JWT, người dùng, phân quyền; duyệt ca và phạm vi Trưởng khoa; lịch/thống kê khoa; hồ sơ tài khoản, Reviews; hạ tầng notification/SignalR và tích hợp chung. |
| **Dương Thạch Phú** (Phú) | B1–B11; `Gantt!A15:C25` | Khoa, chuyên khoa, phòng; dữ liệu Doctors/Patients/Staff; hồ sơ và tìm bác sĩ công khai; đăng ký ca, lịch bác sĩ, slot Approved; dữ liệu/trạng thái/lịch sử sổ. B7 chỉ ghi hỗ trợ MedicineCategories/Suppliers nếu cân tải. |
| **Vũ Hoàng** (Hoàng) | C1–C11; `Gantt!A27:C37` | Đặt lịch web/tại quầy; lịch hẹn của tôi; lễ tân xác nhận/đổi/hủy; tiếp nhận, đối chiếu hồ sơ, check-in; thao tác phát/cấp lại sổ sau Paid; tích hợp sự kiện lịch hẹn/Book Paid/check-in. |
| **Võ Ngọc Nguyên** (Nguyên) | D1–D11; `Gantt!A39:C49` | Khám, hồ sơ bệnh án, danh mục bệnh, chẩn đoán; kê đơn, xác nhận ghi sổ, lịch sử khám; danh mục thuốc/nhóm thuốc/nhà cung cấp; nhập kho, lô/hạn dùng, cảnh báo tồn, cấp thuốc và rà soát thiếu thuốc. |
| **Trần Đình Minh Thoại** (Thoại) | E1–E11; `Gantt!A51:C61` | Loại xét nghiệm, chỉ định/kết quả; hóa đơn theo đợt, thanh toán nhiều lần, bảo hiểm mô phỏng, số dư, chứng từ điều chỉnh/hoàn tiền; portal kết quả/hóa đơn; Dashboard Admin và nguồn số liệu lượt khám cho thống kê khoa. |

Cột **Phụ trách theo tiến độ** bên dưới đối chiếu phạm vi các đầu việc trong `Gantt` với 71 mục chức năng. Khi một mục dùng nhiều module, cột này ghi rõ từng phần và mã đầu việc tương ứng. Mã như A4 hoặc E5 là mã công việc trong Excel, khác với mã chức năng I.1 hoặc VII.4 của tài liệu yêu cầu.

**Các phần chưa được giao riêng trong Gantt:** trang giới thiệu/thông tin công khai ở I.1; giao diện Guest xem khung giờ ở I.3; cấu hình phòng khám ở III.9; phát thông báo hoàn tất xét nghiệm ở IX.5 và phần tương ứng của II.10/V.9. Những phần dữ liệu hoặc hạ tầng liên quan vẫn được ghi theo người đã phụ trách, để nhóm bổ sung phân công cho phần còn lại.

**Các chỗ phối hợp cần giữ đúng phân công:** Nhuận làm API/màn hình/quyền lịch và thống kê Trưởng khoa; Phú cung cấp dữ liệu lịch bác sĩ, Thoại cung cấp số liệu lượt khám. Hoàng xử lý tiếp nhận và thao tác phát sổ; Phú phụ trách dữ liệu/trạng thái sổ; Thoại phụ trách hóa đơn và thanh toán. Nguyên phụ trách rà soát đơn thiếu thuốc, phối hợp Thoại về hóa đơn/hoàn tiền.

## Ba chức năng chưa có luồng đáp ứng yêu cầu

1. **III.9 Cấu hình phòng khám:** chưa có quản trị thông tin phòng khám, giá khám mặc định, giá sổ và tham số vận hành; giá khám vẫn ghi cố định trong mã.
2. **VII.4 Lập hóa đơn thuốc hoặc cuối lượt:** chưa có hàng chờ và giao diện lập hóa đơn `Medicine`/`Final` từ lượt khám và đơn đã chốt. Các nơi đọc hóa đơn/cấp thuốc đã hiểu hai loại này nhưng chưa tạo thành luồng thu tiền sử dụng được.
3. **IX.5 Thông báo kết quả xét nghiệm:** lưu kết quả chưa phát thông báo thời gian thực cho Bác sĩ và Bệnh nhân.

## Đối chiếu từng chức năng

### I Khách chưa đăng nhập

| Mã | Chức năng theo tài liệu | Phụ trách theo tiến độ | Trạng thái | Đã có và phần còn thiếu |
|---|---|---|---|---|
| I.1 | Xem thông tin công khai | Chưa giao riêng trang giới thiệu; Phú: danh mục khoa/chuyên khoa (B2). | **Một phần** | Có trang chủ và thông tin liên hệ; menu Chuyên khoa trỏ tới /specialties nhưng chưa có route tương ứng. Chưa có trang danh sách khoa và chuyên khoa công khai đầy đủ. [Trang chủ][home], [Menu công khai][navbar], [Routes][routes]. |
| I.2 | Tra cứu bác sĩ | Phú (B5). | **Đã có** | Đã tìm theo tên, khoa, phòng; hiển thị học vị, kinh nghiệm, giới thiệu và phòng khám sắp tới. Bộ lọc ghi Chuyên khoa hiện dùng DepartmentId. [Tra cứu bác sĩ][doctor-search], [DoctorService][doctor]. |
| I.3 | Xem khung giờ khám trước đăng nhập | Phú: ca/khung giờ (B3–B4); chưa giao riêng giao diện xem giờ cho Guest. | **Một phần** | API khung giờ cho phép truy cập công khai và chỉ lấy ca Approved. Giao diện chọn ngày, giờ nằm trong /booking, yêu cầu Patient đăng nhập; trang bác sĩ chỉ hiển thị phòng sắp tới. [API lịch][schedule-api], [Routes][routes], [Thẻ bác sĩ][doctor-card]. |
| I.4 | Truy cập đăng ký và đăng nhập | Nhuận (A3). | **Đã có** | Có /register, /login và đường dẫn từ cổng bệnh nhân. [Routes][routes]. |

### II Bệnh nhân

| Mã | Chức năng theo tài liệu | Phụ trách theo tiến độ | Trạng thái | Đã có và phần còn thiếu |
|---|---|---|---|---|
| II.1 | Quản lý tài khoản | Nhuận (A3, A6). | **Đã có** | Có đăng ký Patient, đăng nhập, đăng xuất, thông tin phiên đăng nhập và hồ sơ tài khoản. [Xác thực][auth], [AuthController][auth-api]. |
| II.2 | Quản lý hồ sơ cá nhân | Phú: hồ sơ bệnh nhân (B5); Nhuận: hồ sơ tài khoản (A6). | **Một phần** | Xem và sửa được hồ sơ Patient đã liên kết. Chưa có luồng bệnh nhân tự tạo hồ sơ Patient: đăng ký chỉ tạo User; chưa có hồ sơ thì giao diện yêu cầu chờ phòng khám tiếp nhận. [Đăng ký][auth-register], [PatientService][patient], [Hồ sơ bệnh nhân][patient-profile]. |
| II.3 | Đặt lịch khám | Hoàng: đặt lịch (C2); Phú: dữ liệu ca/slot (B3–B4). | **Đã có** | Có chọn khoa, bác sĩ, ngày, giờ; nhập lý do; kiểm tra trùng và xử lý xung đột khi lưu. Lịch hẹn dùng thời lượng 30 phút, không bắt buộc có sổ khi đặt web. [BookingService][booking], [Trang đặt lịch][booking-page]. |
| II.4 | Quản lý lịch hẹn của tôi | Hoàng (C6). | **Một phần** | Có danh sách, thông tin và trạng thái, lọc ngày và cập nhật khi lịch thay đổi. Chưa có nút hoặc API hủy lịch thuộc bản thân; API cancel hiện yêu cầu quyền xử lý lịch của nhân viên. [Lịch hẹn bệnh nhân][my-appointments], [API lịch hẹn][appointments-api], [Danh mục quyền][permissions]. |
| II.5 | Xem lịch sử khám | Nguyên (D6). | **Đã có** | Có danh sách và chi tiết lịch sử của bản thân, triệu chứng, chẩn đoán, kết luận, giới hạn theo hồ sơ Patient liên kết tài khoản. [MedicalHistoryService][history], [Trang lịch sử][patient-history]. |
| II.6 | Xem đơn thuốc | Nguyên (D4, D6). | **Đã có** | Chi tiết lịch sử có thuốc, số lượng, liều dùng, hướng dẫn, trạng thái và thời gian cấp thuốc. [DTO lịch sử][history-dto], [Trang chi tiết lịch sử][patient-history-detail]. |
| II.7 | Xem kết quả xét nghiệm | Thoại (E3, E6). | **Đã có** | Có danh sách, chi tiết, trạng thái và kết quả của tài khoản bệnh nhân; API giới hạn dữ liệu theo người đăng nhập. [LabTestService][lab], [Trang kết quả][lab-results]. |
| II.8 | Xem hóa đơn và thanh toán đã ghi nhận | Thoại (E6). | **Một phần** | Đã xem được hóa đơn Medicine/Final gắn đơn thuốc trong lịch sử khám. Chưa có danh sách đầy đủ tiền sổ, khám, xét nghiệm; chưa có các lần thanh toán và số dư còn thiếu. [Chi phí thuốc][patient-billing], [MedicalHistoryService][history], [Invoice][invoice-entity]. |
| II.9 | Đánh giá bác sĩ | Nhuận (A6). | **Đã có** | Chỉ Patient sở hữu lịch Completed được đánh giá; kiểm tra trùng theo AppointmentId và xử lý xung đột khi ghi. [ReviewService][review], [Trang đánh giá][patient-reviews]. |
| II.10 | Nhận thông báo | Nhuận: hạ tầng (A5); Hoàng: sự kiện lịch hẹn (C5); thông báo kết quả xét nghiệm chưa giao riêng, liên quan Thoại (E3). | **Một phần** | Có SignalR cho thay đổi lịch và API lịch sử/đánh dấu đã đọc. Sự kiện thay đổi lịch hiện chưa được lưu thành bản ghi thông báo để xem lại; chưa có bước phát thông báo khi hoàn tất kết quả xét nghiệm. [NotificationService][notifications], [API thông báo][notification-api], [Lưu kết quả][lab-submit]. |

### III Quản trị viên

| Mã | Chức năng theo tài liệu | Phụ trách theo tiến độ | Trạng thái | Đã có và phần còn thiếu |
|---|---|---|---|---|
| III.1 | Truy cập trang quản trị | Nhuận (A3–A4). | **Đã có** | Có đăng nhập nội bộ, menu và route theo Admin, bảo vệ API theo vai trò hoặc quyền. [Routes][routes], [Quyền giao diện][role-access]. |
| III.2 | Quản lý tài khoản và vai trò | Nhuận (A3–A4). | **Đã có** | Có tìm kiếm, xem tài khoản, khóa/mở khóa, gán vai trò và quản lý quyền. Các chức năng này có API thực; riêng nút sửa thông tin người dùng xem hạn chế ở III.4. [UsersController][users-api], [UserService][users], [RbacService][rbac]. |
| III.3 | Quản lý tổ chức phòng khám | Phú (B2). | **Đã có** | Có thêm, sửa, tra cứu, trạng thái hoạt động cho khoa, chuyên khoa, phòng; thông tin loại phòng và vị trí. [CatalogServices][catalog], [Trang danh mục][catalog-page]. |
| III.4 | Quản lý hồ sơ nhân sự | Phú: Doctors/Patients/Staff (B4–B6); Nhuận: tài khoản/quyền (A3). | **Một phần** | Có thực thể Doctor, bác sĩ tự sửa hồ sơ và API liên kết tài khoản. Chưa có CRUD hồ sơ bác sĩ/nhân viên cho Admin, phân khoa/chuyên khoa/vị trí công việc đầy đủ. Form sửa tài khoản tại UsersPage chỉ báo thành công, không gọi API lưu. [DoctorsController][doctor-api], [DoctorService][doctor], [Form sửa người dùng][users-edit]. |
| III.5 | Quản lý danh mục thuốc | Nguyên (D2); Phú hỗ trợ MedicineCategories/Suppliers nếu cân tải (B7). | **Đã có** | Có quản lý thuốc, nhóm thuốc, nhà cung cấp, đơn vị và giá. [MedicineService][medicine], [SupplierService][supplier], [Routes][routes]. |
| III.6 | Quản lý loại xét nghiệm | Thoại (E2). | **Đã có** | Có thêm, sửa, tra cứu loại xét nghiệm, mô tả, giá và trạng thái. [LabTestTypeService][lab-types], [Trang loại xét nghiệm][lab-types-page]. |
| III.7 | Quản lý nhập kho thuốc | Nguyên (D5). | **Đã có** | Phiếu nhập nhiều dòng thuốc/lô; số lượng, giá nhập, số lô, hạn dùng; nhận hàng cập nhật tồn trong giao dịch, kiểm tra phiếu đã nhận và lô hết hạn. [PurchaseOrderService][purchase], [Trang phiếu nhập][purchase-page]. |
| III.8 | Theo dõi tồn kho | Nguyên (D7). | **Đã có** | Có tra cứu theo thuốc/lô và phân loại còn hàng, ít hàng, hết hàng, gần hết hạn, hết hạn. [InventoryService][inventory], [Trang tồn kho][inventory-page]. |
| III.9 | Cấu hình phòng khám | Chưa có đầu việc phân công riêng trong Gantt. | **Chưa có** | Chưa tìm thấy trang, API hoặc mô hình cấu hình thông tin phòng khám, giá khám mặc định, giá sổ và tham số vận hành. Phí khám 150.000 đồng đang ghi cố định trong InvoiceService; phí sổ nhập tay ở tiếp nhận. [Phí khám][invoice-queue], [Tiếp nhận][reception-ui], [Routes][routes]. |
| III.10 | Duyệt lịch của Trưởng khoa | Nhuận: duyệt (A4); Phú: API/dữ liệu đăng ký ca và xung đột (B4). | **Đã có** | Có Admin duyệt/từ chối yêu cầu lịch của Trưởng khoa, kiểm tra trùng bác sĩ/phòng/thời gian, bắt buộc lý do từ chối và chặn tự duyệt. [ScheduleReviewService][schedule-review], [Trang duyệt lịch][schedule-review-page]. |
| III.11 | Quản lý đánh giá | Nhuận (A6). | **Một phần** | Có xem danh sách và ẩn/hiện nhận xét. Chưa thấy tính hoặc hiển thị điểm trung bình theo bác sĩ; dữ liệu trả về là từng đánh giá. [ReviewService][review], [Trang quản lý đánh giá][review-admin], [DTO đánh giá][review-dto]. |
| III.12 | Xem báo cáo toàn phòng khám | Thoại (E7). | **Một phần** | Có Dashboard doanh thu, lượt khám, tồn kho. API revenue có from/to; giao diện hiện chỉ gọi summary và chưa có chọn kỳ. Chưa có báo cáo lượt khám theo kỳ tùy chọn đầy đủ. [AdminDashboardController][dashboard-api], [Dashboard][dashboard-page]. |

### IV Trưởng khoa

| Mã | Chức năng theo tài liệu | Phụ trách theo tiến độ | Trạng thái | Đã có và phần còn thiếu |
|---|---|---|---|---|
| IV.1 | Truy cập cổng nội bộ theo khoa | Nhuận: vai trò/phạm vi khoa (A4, A6); Phú: dữ liệu bác sĩ/khoa (B4). | **Đã có** | Có DepartmentHead, route theo vai trò và xác định khoa qua hồ sơ Doctor đang hoạt động. [Quyền giao diện][role-access], [DepartmentScope][department-scope]. |
| IV.2 | Xử lý yêu cầu đăng ký ca | Nhuận (A4). | **Đã có** | Duyệt/từ chối trong khoa, bắt buộc lý do từ chối, chặn duyệt khác khoa, tự duyệt và duyệt lịch của Trưởng khoa khác. [ScheduleReviewService][schedule-review]. |
| IV.3 | Kiểm tra lịch trước khi duyệt | Nhuận: kiểm tra khi duyệt (A4); Phú: truy vấn xung đột và ca Approved (B4, B8). | **Đã có** | Kiểm tra trùng bác sĩ, thời gian, phòng; chỉ yêu cầu Pending được xử lý và chỉ ca Approved được đưa ra đặt khám. Hiện chưa có API sửa/xóa ca đã duyệt, nên không có đường sửa ca đang gắn lịch hẹn qua các API này. [Duyệt lịch][schedule-review], [DoctorRepository][doctor-repository], [API lịch][schedule-api]. |
| IV.4 | Đăng ký lịch của bản thân | Phú: đăng ký ca (B4); Nhuận: chuyển Admin duyệt và quyền (A4). | **Đã có** | DepartmentHead dùng chung luồng gửi/theo dõi yêu cầu ca; thông báo yêu cầu của Trưởng khoa chuyển Admin và khoa không được tự duyệt. [DoctorScheduleService][schedule], [Người nhận yêu cầu lịch][notifications]. |
| IV.5 | Xem lịch trực trong khoa | Nhuận: API/màn hình/phạm vi khoa (A5); Phú: nguồn lịch bác sĩ (B6–B7). | **Đã có** | Có lịch ngày/tuần, lọc bác sĩ/phòng trong khoa và chỉ hiển thị ca đã duyệt. [DepartmentScheduleService][department-schedule], [Trang lịch khoa][department-schedule-page]. |
| IV.6 | Xem thống kê khoa | Nhuận: API/màn hình/quyền (A7); Thoại: số liệu lượt khám (E7). | **Đã có** | Có lượt khám, số yêu cầu chờ/đã duyệt theo khoảng ngày, giới hạn khoa được phân công và kiểm tra tham số ngày. [DepartmentStatisticsService][department-statistics], [Trang thống kê khoa][department-statistics-page]. |
| IV.7 | Thực hiện nghiệp vụ bác sĩ | Nguyên: khám/kê đơn/ghi sổ (D3–D4, D6); Thoại: xét nghiệm (E3); Nhuận: quyền (A4). | **Một phần** | Đã được cấp các quyền khám, kê đơn, chỉ định xét nghiệm, ghi sổ. Những phần chưa đủ ở V.5 và V.6 cũng ảnh hưởng Trưởng khoa: chỉ số sinh tồn và gắn chỉ định với lượt khám. [Danh mục quyền][permissions], [MedicalRecord][record-entity], [LabTest][lab-entity]. |

### V Bác sĩ

| Mã | Chức năng theo tài liệu | Phụ trách theo tiến độ | Trạng thái | Đã có và phần còn thiếu |
|---|---|---|---|---|
| V.1 | Truy cập và xem hồ sơ cá nhân | Phú: hồ sơ bác sĩ (B5–B6); Nhuận: đăng nhập/hồ sơ tài khoản (A3, A6). | **Đã có** | Có đăng nhập nội bộ, xem/sửa thông tin bác sĩ gồm họ tên, học vị, kinh nghiệm, giới thiệu; khoa và chuyên khoa chỉ đọc. [DoctorService][doctor], [Trang hồ sơ bác sĩ][doctor-profile]. |
| V.2 | Đăng ký ca khám | Phú (B4). | **Đã có** | Có ngày, giờ bắt đầu/kết thúc, phòng; theo dõi Pending/Approved/Rejected và lý do. Kiểm tra phòng thuộc khoa và xung đột. [DoctorScheduleService][schedule], [Trang đăng ký ca][schedule-request-page]. |
| V.3 | Xem lịch và danh sách chờ khám | Phú: lịch bác sĩ (B6); Hoàng: lịch hẹn/check-in (C4); Nguyên: tiếp nhận khám (D3, D8). | **Đã có** | Có yêu cầu/lịch làm việc của mình, lịch hẹn và hàng đợi bệnh nhân đã check-in, bắt đầu khám. [Trang ca làm][schedule-request-page], [Danh sách khám][doctor-queue], [MedicalRecordService][record]. |
| V.4 | Tra cứu lịch sử bệnh nhân | Nguyên (D6). | **Đã có** | Có lịch sử khám, chẩn đoán, đơn thuốc; xác minh lượt hiện tại thuộc bác sĩ và đã check-in/xác minh sổ trước khi tra cứu. [MedicalHistoryService][history], [Trang lịch sử bệnh nhân][doctor-history]. |
| V.5 | Khám và lập hồ sơ bệnh án | Nguyên (D3). | **Một phần** | Có bắt đầu khám, triệu chứng, chẩn đoán theo danh mục bệnh, ghi chú chẩn đoán và kết luận. Chưa có trường dữ liệu hoặc form chỉ số sinh tồn như huyết áp, mạch, nhiệt độ, SpO2. [MedicalRecordService][record], [MedicalRecord][record-entity], [Form khám][record-form]. |
| V.6 | Chỉ định xét nghiệm | Thoại (E3). | **Một phần** | Có tạo chỉ định, loại xét nghiệm, theo dõi và xem kết quả. Chỉ định mới chỉ gắn PatientId là UserId và DoctorId; thiếu AppointmentId/MedicalRecordId, kiểm tra lượt khám được phân công và hỗ trợ bệnh nhân trực tiếp chưa có tài khoản. [LabTestService][lab], [LabTest][lab-entity], [Trang chỉ định][lab-orders-page]. |
| V.7 | Kê đơn thuốc | Nguyên (D4). | **Đã có** | Có thuốc, số lượng, liều, hướng dẫn, cảnh báo tồn; chưa trừ kho lúc kê đơn. Có quản lý phiên bản, chặn sửa đơn đã cấp và chặn đổi thuốc/số lượng khi đã có hóa đơn. [PrescriptionService][prescription], [Trang kê đơn][prescription-page]. |
| V.8 | Đối chiếu và ghi sổ khám | Nguyên (D4, D6). | **Đã có** | Có xác nhận ghi sổ; bắt buộc có sổ và xác nhận trước khi hoàn thành, cùng chẩn đoán và kết luận. Sửa nội dung/đơn thuốc làm mất xác nhận cũ để cần đối chiếu lại. [MedicalRecordService][record], [PrescriptionService][prescription], [Trang hồ sơ khám][record-page]. |
| V.9 | Nhận thông báo thời gian thực | Nhuận: hạ tầng (A5); Hoàng: sự kiện check-in (C5); thông báo kết quả chưa giao riêng, liên quan Thoại (E3). | **Một phần** | Có thông báo bệnh nhân check-in. Chưa có phát thông báo cho bác sĩ sau khi hoàn tất xét nghiệm. [ReceptionService][reception], [Lưu kết quả][lab-submit]. |

### VI Nhân viên lễ tân

| Mã | Chức năng theo tài liệu | Phụ trách theo tiến độ | Trạng thái | Đã có và phần còn thiếu |
|---|---|---|---|---|
| VI.1 | Truy cập cổng tiếp nhận | Hoàng: cổng tiếp nhận (C3–C4); Nhuận: đăng nhập/phân quyền (A3–A4). | **Đã có** | Có vai trò, menu tiếp nhận, route và quyền xử lý lịch/sổ/check-in. [Quyền giao diện][role-access], [Danh mục quyền][permissions]. |
| VI.2 | Tiếp nhận và quản lý hồ sơ bệnh nhân | Hoàng: tiếp nhận/đối chiếu (C4); Phú: hồ sơ và chống trùng Patient (B4, B9). | **Một phần** | Có tìm đối chiếu, tạo hồ sơ khi tiếp nhận/đặt trực tiếp, kiểm tra hồ sơ trùng và liên kết tài khoản online. Chưa có API/form cho lễ tân cập nhật đầy đủ hồ sơ Patient đã tồn tại. [ReceptionService][reception], [Đặt lịch trực tiếp][booking], [ReceptionPatientsController][reception-api]. |
| VI.3 | Tra cứu lịch hẹn | Hoàng (C7). | **Đã có** | Có danh sách, thông tin chi tiết và lọc ngày/trạng thái/bác sĩ. [AppointmentsPage][reception-appointments], [BookingService][booking]. |
| VI.4 | Xử lý lịch hẹn | Hoàng (C3–C4). | **Đã có** | Có xác nhận, đổi lịch, hủy và phát sự kiện thay đổi; kiểm tra ca hợp lệ, xung đột và trạng thái, chặn đổi/hủy sau check-in. Từ chối lịch Pending hiện thực hiện qua thao tác Hủy chung, chưa có trạng thái Rejected riêng. [BookingService][booking], [AppointmentsPage][reception-appointments]. |
| VI.5 | Đặt lịch tại quầy | Hoàng: đặt tại quầy (C2, C4); Phú: ca/slot đã duyệt (B3–B4). | **Đã có** | Có tạo lịch hộ/khách trực tiếp, chọn bác sĩ/ca đã duyệt/giờ trống, tạo hoặc chọn hồ sơ hiện có. [Đặt lịch trực tiếp][booking], [AppointmentsPage][reception-appointments]. |
| VI.6 | Kiểm tra sổ khám | Phú (B6). | **Đã có** | Có sổ hiện hành, mã sổ, lịch sử cấp lại và xác nhận đã mang/đối chiếu sổ thực tế. [ReceptionService][reception], [PatientBookService][books], [Hộp thoại tiếp nhận][reception-ui]. |
| VI.7 | Tạo yêu cầu mua hoặc cấp lại sổ | Hoàng: tiếp nhận yêu cầu và thao tác quầy (C6); Thoại: hóa đơn Book (E4). | **Một phần** | Có tạo hóa đơn sổ và xử lý phát/cấp lại, giữ liên kết lịch sử. Chưa tách yêu cầu mua/cấp lại chuyển Thu ngân: lễ tân hiện trực tiếp lập hóa đơn và bấm Ghi Paid trong hộp thoại tiếp nhận. [Tiếp nhận][reception-ui], [Quyền mặc định][permissions]. |
| VI.8 | Cấp và liên kết sổ khám | Hoàng: thao tác phát/cấp lại (C5–C6); Phú: trạng thái/lịch sử sổ (B5–B6); Thoại: điều kiện Paid (E4–E5). | **Một phần** | Luồng IssueBook kiểm tra Paid, ghi mã/thời gian, vô hiệu sổ trước và giữ liên kết; có ràng buộc tối đa một sổ Issued trong migration. Chưa lưu người cấp. API đổi trạng thái sổ có nhánh cấp lại trực tiếp không buộc hóa đơn mới đã thanh toán. [IssueBook][book-issue], [PatientBookService][books], [PatientBook][book-entity]. |
| VI.9 | Check-in bệnh nhân | Hoàng (C4, C7). | **Đã có** | Bắt buộc lịch Confirmed đúng ngày, khớp hồ sơ, sổ Issued, hóa đơn sổ Paid nếu có và xác nhận mang sổ; lưu mã sổ, thời điểm xác minh/check-in. [ReceptionService][reception]. |
| VI.10 | Nhận và gửi thông báo thời gian thực | Hoàng: tích hợp sự kiện (C5); Nhuận: hạ tầng SignalR (A5). | **Đã có** | Có thay đổi lịch, sổ, thanh toán tiền sổ và thông báo check-in cho bác sĩ; các sự kiện gắn đúng nhóm người nhận. [NotificationService][notifications], [ReceptionService][reception]. |

### VII Thu ngân

| Mã | Chức năng theo tài liệu | Phụ trách theo tiến độ | Trạng thái | Đã có và phần còn thiếu |
|---|---|---|---|---|
| VII.1 | Truy cập quầy thu ngân | Thoại: quầy Billing (E4–E5); Nhuận: vai trò/quyền Cashier (A4, A6). | **Một phần** | Đã có route/menu Cashier và InvoicesController cho Cashier/Admin. Chưa seed vai trò Cashier và bộ quyền mặc định trong DbContext/PermissionCatalog; cần tạo/gán thủ công để dùng trên cơ sở dữ liệu mới. [Routes][routes], [API hóa đơn][invoice-api], [Seed vai trò][role-seed], [Danh mục quyền][permissions]. |
| VII.2 | Lập hóa đơn tiền sổ | Thoại (E4). | **Một phần** | Có BookInvoice và API thu tiền/Invoice BillingStage Book. Trang Thu ngân chưa có hàng chờ Book; luồng hiện đặt tại lễ tân và chưa nối yêu cầu mua/cấp lại từ lễ tân sang quầy Thu ngân. [ReceptionService][reception], [InvoiceService][invoice], [Trang thu ngân][cashier-page]. |
| VII.3 | Lập hóa đơn khám và xét nghiệm | Thoại (E4–E5). | **Một phần** | Có hàng chờ LabAndConsultation và ghi hóa đơn. Hiện chỉ gom xét nghiệm theo bệnh nhân, AppointmentId = 0, không ghép phí khám chưa thu của đúng lượt; phí khám nằm riêng ở Pending. [Hàng chờ hóa đơn][invoice-queue]. |
| VII.4 | Lập hóa đơn thuốc hoặc cuối lượt | Thoại (E5, E9). | **Chưa có** | Chưa có luồng lập từ đơn đã chốt: GetPendingBillingsAsync chỉ xử lý Pending và LabAndConsultation; giao diện cũng chỉ có hai lựa chọn này. Medicine/Final đã xuất hiện ở nơi đọc hóa đơn/cấp thuốc nhưng chưa có hàng chờ, tính phí và thao tác lập tương ứng. [Hàng chờ hóa đơn][invoice-queue], [Giao diện thu ngân][cashier-stages], [Hóa đơn cấp thuốc][dispensing-repository]. |
| VII.5 | Tính và đối chiếu chi phí | Thoại (E4–E5). | **Một phần** | Có tổng tiền, giảm BHYT mô phỏng theo tỷ lệ và kiểm tra nguồn khoản mục đã thu. Chưa đối chiếu đầy đủ theo lượt; ngoài tiền sổ, đơn giá/số lượng/nguồn phí vẫn nhận trực tiếp từ client thay vì dựng từ nghiệp vụ gốc. [Tạo hóa đơn][invoice-create]. |
| VII.6 | Ghi nhận thanh toán | Thoại (E5–E6). | **Một phần** | Có chọn tiền mặt/chuyển khoản/thẻ và xác nhận thu tiền. Tạo Invoice là Paid ngay; chưa có bảng/giao dịch từng lần thanh toán, trả một phần, số dư, mã/chứng từ đối chiếu. BookInvoice cũng mới có Unpaid/Paid. [Tạo hóa đơn][invoice-paid], [Invoice][invoice-entity], [Trang thu ngân][cashier-page]. |
| VII.7 | Tra cứu hóa đơn và phiếu thu | Thoại (E6, E11). | **Một phần** | Có danh sách lịch sử, tìm theo mã bệnh nhân/lượt khám và API chi tiết hóa đơn. Chưa có lịch sử các lần thanh toán, mẫu phiếu thu hoặc thao tác in/xuất phiếu thu tại quầy. [InvoiceService][invoice], [Trang thu ngân][cashier-page]. |
| VII.8 | Điều chỉnh và hoàn tiền | Thoại: chứng từ/hoàn tiền (E6, E10); Nguyên: phối hợp khi thiếu thuốc (D7). | **Một phần** | Có Adjustment Invoice, hóa đơn gốc, lý do, khoản tiền âm/dương, người lập, thời điểm; giữ hóa đơn cũ. Chưa nối chứng từ với đối soát đơn thuốc đang AwaitingBilling và các lần thanh toán; response cũng chưa trả InvoiceType/OriginalInvoiceId để truy vết đầy đủ trên giao diện. [Chứng từ điều chỉnh][invoice-adjust], [Ánh xạ hóa đơn][invoice-map], [Rà soát đơn][stock-review]. |

### VIII Dược sĩ

| Mã | Chức năng theo tài liệu | Phụ trách theo tiến độ | Trạng thái | Đã có và phần còn thiếu |
|---|---|---|---|---|
| VIII.1 | Truy cập quầy thuốc | Nguyên: quầy thuốc (D5); Nhuận: vai trò/quyền Pharmacist (A4, A6). | **Đã có** | Có vai trò Pharmacist, menu/route cấp thuốc, bảo vệ bằng quyền pharmacy.dispense. [Quyền giao diện][role-access], [Routes][routes]. |
| VIII.2 | Tiếp nhận đơn thuốc | Nguyên (D5). | **Đã có** | Có danh sách, tìm kiếm, bộ lọc, chi tiết bệnh nhân/thuốc/liều/hướng dẫn và tình trạng hóa đơn tương ứng. [DispensingService][dispensing], [Trang cấp thuốc][dispensing-page]. |
| VIII.3 | Kiểm tra và chọn lô thuốc | Nguyên (D5, D8). | **Đã có** | Tự phân bổ theo lô còn hạn, còn tồn, ưu tiên hạn dùng sớm; một dòng đơn có thể dùng nhiều lô. [Phân bổ lô][dispensing-allocation]. |
| VIII.4 | Xác nhận giao thuốc | Nguyên: giao thuốc (D5, D8); Thoại: thanh toán Medicine/Final (E5). | **Đã có** | Chỉ cho xác nhận khi tìm được Invoice Standard Medicine/Final ở trạng thái Paid, khớp lượt/bệnh nhân/đơn hoặc đủ các dòng thuốc. Điều kiện này hoạt động trên trạng thái hóa đơn hiện có; luồng tạo và thanh toán hóa đơn tương ứng còn thiếu ở VII.4/VII.6. [Xác nhận cấp][dispensing-confirm], [Đối chiếu hóa đơn][dispensing-repository]. |
| VIII.5 | Ghi nhận cấp thuốc và xuất kho | Nguyên (D5, D8). | **Đã có** | Lưu lô/số lượng, người cấp/thời điểm; trừ tồn và đổi trạng thái Dispensed trong giao dịch. Chặn cấp lặp, thiếu tồn, lô hết hạn và xử lý xung đột. [Xác nhận cấp][dispensing-confirm], [Phân bổ lô][dispensing-allocation]. |
| VIII.6 | Xử lý thiếu thuốc | Nguyên: thiếu thuốc/điều chỉnh đơn (D7); Thoại: hóa đơn/hoàn tiền (E6, E10). | **Một phần** | Có dừng toàn đơn, gửi rà soát, bác sĩ giữ/điều chỉnh đơn, thông báo các bên và kiểm lại tồn. Khi đã có hóa đơn, phương án điều chỉnh dừng ở AwaitingBilling; chưa có bước Thu ngân đối soát/hoàn tiền rồi áp dụng phương án và mở lại cấp thuốc. [Rà soát bác sĩ][stock-review], [Rà soát dược sĩ][dispensing-review]. |

### IX Kỹ thuật viên xét nghiệm

| Mã | Chức năng theo tài liệu | Phụ trách theo tiến độ | Trạng thái | Đã có và phần còn thiếu |
|---|---|---|---|---|
| IX.1 | Truy cập cổng xét nghiệm | Thoại: module/quyền xét nghiệm (E1, E3); Nhuận: Auth/phân quyền chung (A3–A4). | **Đã có** | Có LabTechnician, route hàng chờ và quyền xem/nhập kết quả. [Routes][routes], [API xét nghiệm][lab-api]. |
| IX.2 | Tiếp nhận chỉ định | Thoại (E3, E5, E8). | **Một phần** | Có hàng chờ xét nghiệm dựa vào InvoiceDetail SourceType LabTest. Chưa kiểm tra Invoice.Status/BillingStage và thanh toán đủ; chỉ định thiếu liên kết lượt khám, giao diện chủ yếu hiển thị ID bệnh nhân. [Hàng chờ xét nghiệm][lab-pending], [LabTest][lab-entity], [Giao diện kỹ thuật viên][technician-page]. |
| IX.3 | Thực hiện xét nghiệm | Thoại (E5, E8). | **Một phần** | Có luồng Pending sang Completed khi nộp kết quả. Chưa có thao tác nhận/bắt đầu và trạng thái đang thực hiện; API SubmitResult không kiểm tra thanh toán nên điều kiện tại hàng chờ chưa được bảo vệ khi gọi trực tiếp. [Lưu kết quả][lab-submit], [API xét nghiệm][lab-api], [Danh mục quyền][permissions]. |
| IX.4 | Nhập và hoàn tất kết quả | Thoại (E3). | **Đã có** | Có nội dung kết quả, ghi chú, URL tệp nếu có, người thực hiện, thời điểm; cập nhật trạng thái và chặn nhập trùng. API nhập kết quả được kiểm soát bằng quyền xét nghiệm, không cập nhật chẩn đoán/hồ sơ bác sĩ. [Lưu kết quả][lab-submit], [API xét nghiệm][lab-api]. |
| IX.5 | Thông báo kết quả | Chưa giao riêng phát thông báo kết quả; liên quan Thoại: hoàn tất kết quả (E3), Nhuận: hạ tầng SignalR (A5). | **Chưa có** | Chưa có lời gọi NotificationService/SignalR trong luồng hoàn tất xét nghiệm. Bác sĩ và bệnh nhân hiện cần tải lại dữ liệu để xem kết quả. [Lưu kết quả][lab-submit], [NotificationService][notifications]. |

## Những chỗ cần xử lý trước khi nghiệm thu

### Hoàn thiện luồng thu ngân và thanh toán

**Phụ trách:** Thoại (E4–E6, E9–E10); Nhuận phối hợp vai trò/quyền Cashier (A4, A6); Hoàng và Phú phối hợp tiếp nhận/phát sổ và dữ liệu sổ (C5–C6, B5–B6).

Ở [InvoiceService.cs:14][invoice-queue], hàng chờ chỉ có `Pending` và `LabAndConsultation`. Nhánh xét nghiệm gom theo `PatientId`, đặt `AppointmentId = 0` và chưa ghép phí khám chưa thu của đúng lượt. [CashierBillingPage.jsx:224][cashier-stages] cũng chỉ cho chọn hai loại này. Vì vậy chưa thể thực hiện trọn luồng từ chốt đơn đến thu tiền thuốc/cuối lượt bằng giao diện hiện có.

[InvoiceService.cs:140][invoice-paid] đặt hóa đơn thành `Paid` ngay khi tạo. Mô hình [Invoice][invoice-entity] chưa có tập các lần thanh toán hay số tiền đã thu/còn thiếu. Cần tách lập hóa đơn và ghi nhận từng lần thu, lưu số tiền, người thu, thời điểm, phương thức/chứng từ và tính trạng thái thanh toán đủ. Ngoài tiền sổ, API hiện chưa dựng lại đơn giá và số lượng từ lượt khám, xét nghiệm, đơn thuốc gốc; cần đối chiếu tại server và chống thu trùng cả khi có yêu cầu đồng thời.

Quầy tiền sổ hiện nằm ở [ReceptionCheckInDialog.jsx:176][reception-book-ui]: lễ tân lập hóa đơn và bấm `Ghi Paid`. Cần nối luồng yêu cầu mua/cấp lại sổ sang Thu ngân theo tài liệu, bổ sung hàng chờ Book và seed vai trò/quyền Cashier. Không suy ra dữ liệu của database hiện tại từ seed; nhận xét về Cashier ở đây áp dụng cho việc khởi tạo mới từ mã nguồn.

### Gắn xét nghiệm với lượt khám và kiểm tra thanh toán tại API

**Phụ trách:** Thoại (E3–E6, E8–E9); Nguyên phối hợp hồ sơ khám/kê đơn (D8–D9); phần phát thông báo kết quả cần bổ sung phân công riêng với Nhuận phụ trách hạ tầng SignalR (A5).

[LabTest][lab-entity] và DTO tạo chỉ định chưa có `AppointmentId`/`MedicalRecordId`. [LabTestService.cs:19][lab] còn yêu cầu bệnh nhân là một `User` mang vai trò Patient; hồ sơ khách trực tiếp trong bảng Patients chưa có tài khoản không đáp ứng điều kiện này. Cần liên kết đúng hồ sơ/lượt khám và kiểm tra phạm vi bác sĩ được phân công.

[LabTestService.cs:73][lab-pending] lọc hàng chờ theo việc tồn tại `InvoiceDetail` của xét nghiệm, chưa kiểm tra trạng thái hóa đơn và thanh toán đủ. Đáng chú ý hơn, [SubmitResultAsync:86][lab-submit] chỉ kiểm tra xét nghiệm tồn tại, trạng thái Pending và chưa có kết quả, rồi lưu Completed; chưa kiểm tra thanh toán. Điều kiện thanh toán cần được kiểm tra ở thao tác bắt đầu và thao tác ghi kết quả, kể cả khi gọi API trực tiếp. Cũng cần có thao tác nhận thực hiện và trạng thái đang thực hiện theo IX.3.

### Nối bước đối soát sau khi thiếu thuốc

**Phụ trách:** Nguyên về thiếu thuốc/đơn thuốc (D7); Thoại về hóa đơn, chứng từ và hoàn tiền (E6, E10).

[PrescriptionService.StockReviews.cs:80][stock-review] lưu phương án bác sĩ thành `AwaitingBilling` khi đã tồn tại hóa đơn. [DispensingService.cs:281][dispensing-review] tiếp tục chặn kiểm lại tồn khi còn trạng thái này. Chưa tìm thấy API hoặc thao tác Thu ngân hoàn tất đối soát để áp dụng phương án, cập nhật chứng từ và cho phép tiếp tục cấp thuốc. API tạo Adjustment hiện chưa giải quyết bước này.

### Hoàn thiện quản lý sổ và lưu người cấp

**Phụ trách:** Phú về dữ liệu/trạng thái/lịch sử sổ (B5–B6, B8); Hoàng về thao tác tiếp nhận/phát sổ (C5–C6); Thoại về thanh toán tiền sổ (E4–E5).

Luồng [IssueBookAsync:173][book-issue] đã kiểm tra hóa đơn Paid. Tuy nhiên [PatientBookService.cs:62][book-status] có đường thay sổ Issued bằng sổ mới trực tiếp, không yêu cầu hóa đơn cấp lại đã thanh toán; [PatientBook][book-entity] cũng chưa có trường người cấp. Cần thống nhất các đường cấp/cấp lại để cùng tuân thủ điều kiện thanh toán và lưu vết người thao tác.

### Bổ sung các chức năng bệnh nhân và hồ sơ nhân sự

**Phụ trách:** Hoàng về lịch hẹn của tôi/hủy lịch (C6); Phú về hồ sơ bệnh nhân và Doctors/Patients/Staff (B4–B6); Nhuận về hồ sơ tài khoản/quyền (A3, A6); Thoại về hóa đơn/lịch sử thanh toán bệnh nhân (E6).

Bệnh nhân hiện chưa có thao tác tự hủy lịch; trang “Lịch hẹn của tôi” chỉ tải/lọc/hiển thị. Hồ sơ Patient mới chỉ được tạo qua phòng khám tiếp nhận, chưa có luồng tự tạo từ cổng bệnh nhân. Phần hóa đơn của bệnh nhân mới tập trung vào tiền thuốc trong lịch sử khám, thiếu toàn bộ các đợt thu và số dư.

Quản lý nhân sự chưa có CRUD đầy đủ cho Admin và phân công khoa/chuyên khoa/vị trí. Đặc biệt [UsersPage.jsx:285][users-edit] chỉ hiển thị thông báo lưu thành công ở nhánh sửa, không gửi thay đổi tới API. Cần nối lưu thực tế trước khi tính chức năng này là đã làm.

### Bổ sung dữ liệu khám, thông báo và báo cáo

**Phụ trách theo module:** Nguyên về hồ sơ khám (D3); Nhuận về Reviews và hạ tầng thông báo (A6, A5); Thoại về xét nghiệm và Dashboard Admin (E3, E7). Cấu hình phòng khám và phát thông báo kết quả xét nghiệm chưa có đầu việc giao riêng trong Gantt.

[MedicalRecord][record-entity] và form khám chưa có chỉ số sinh tồn. Hoàn tất xét nghiệm chưa gọi NotificationService, nên cả II.10, V.9 và IX.5 còn thiếu phần thông báo kết quả. Sự kiện thay đổi lịch hiện chỉ phát SignalR, chưa tạo bản ghi Notifications để bệnh nhân xem lại/đánh dấu đã đọc. Quản lý đánh giá cần bổ sung điểm trung bình theo bác sĩ; Dashboard cần có chọn kỳ và dữ liệu báo cáo tương ứng. Phần cấu hình cần chuyển giá và thông tin phòng khám khỏi mã cố định sang nguồn quản trị được.

## Kiểm tra đã chạy trong lần rà soát

| Kiểm tra | Kết quả | Phạm vi kết luận |
|---|---|---|
| `dotnet build backend/ClinicManagement/ClinicManagement.csproj --no-restore --nologo` | Thành công; 0 lỗi, 0 cảnh báo | Backend biên dịch được với dependencies hiện có. |
| `npm run build` trong frontend | Thành công | Frontend đóng gói production được. |
| `npm test` trong frontend | 71/71 kiểm thử đạt; 0 thất bại, 0 bỏ qua | Các kiểm thử đơn vị hiện có đạt. Số lượng 71 kiểm thử không tương ứng một-một với 71 chức năng trong tài liệu. |

Chưa chạy kiểm thử tích hợp SQL Server, E2E trên ứng dụng đang chạy hoặc thử nhiều người dùng đồng thời trong lần rà soát này. Vì vậy những điều kiện về transaction, ràng buộc database và quyền được ghi nhận theo triển khai mã nguồn/migration, chưa phải kết quả xác minh runtime.

Không thay đổi mã nghiệp vụ hoặc trạng thái các tài liệu đã bị xóa sẵn trong thư mục làm việc. Tệp báo cáo này là đầu ra mới của lần rà soát.

Phần phân công được bổ sung theo bảng tiến độ; các trạng thái và kết quả kiểm tra ở trên giữ theo lần rà soát mã nguồn ngày 04/11/2026.

## Thứ tự hoàn thiện đề xuất

1. Nối hóa đơn Book/LabAndConsultation/Medicine/Final theo đúng lượt khám; tách ghi nhận nhiều lần thanh toán, số dư và chứng từ; hoàn thiện vai trò Thu ngân.
2. Gắn xét nghiệm với lượt khám/hồ sơ, hỗ trợ bệnh nhân trực tiếp, chặn xử lý khi chưa thanh toán đủ tại API và phát thông báo kết quả.
3. Hoàn tất đối soát/hoàn tiền cho đơn thiếu thuốc và thống nhất điều kiện cấp lại sổ.
4. Bổ sung bệnh nhân tự hủy lịch, tự tạo hồ sơ và xem toàn bộ hóa đơn/lịch sử thu.
5. Hoàn thiện CRUD nhân sự, cấu hình phòng khám, chỉ số sinh tồn, xem giờ khám công khai, điểm trung bình bác sĩ và lọc kỳ báo cáo.

[home]: ../frontend/clinic-management-client/src/pages/patient/HomePage.jsx
[navbar]: ../frontend/clinic-management-client/src/layouts/patient/Navbar.jsx
[routes]: ../frontend/clinic-management-client/src/routes/AppRoutes.jsx
[doctor-search]: ../frontend/clinic-management-client/src/pages/patient/DoctorSearchPage.jsx
[doctor]: ../backend/ClinicManagement/Services/Implementations/DoctorService.cs
[schedule-api]: ../backend/ClinicManagement/Controllers/DoctorSchedulesController.cs
[doctor-card]: ../frontend/clinic-management-client/src/components/patient/PublicDoctorCard.jsx
[auth]: ../backend/ClinicManagement/Services/Implementations/AuthService.cs
[auth-api]: ../backend/ClinicManagement/Controllers/AuthController.cs
[auth-register]: ../backend/ClinicManagement/Services/Implementations/AuthService.cs#L47
[patient]: ../backend/ClinicManagement/Services/Implementations/PatientService.cs
[patient-profile]: ../frontend/clinic-management-client/src/pages/patient/PatientProfilePage.jsx
[booking]: ../backend/ClinicManagement/Services/Implementations/BookingService.cs
[booking-page]: ../frontend/clinic-management-client/src/pages/patient/BookingPage.jsx
[my-appointments]: ../frontend/clinic-management-client/src/pages/patient/MyAppointmentsPage.jsx
[appointments-api]: ../backend/ClinicManagement/Controllers/AppointmentsController.cs
[permissions]: ../backend/ClinicManagement/Commons/PermissionCatalog.cs
[history]: ../backend/ClinicManagement/Services/Implementations/MedicalHistoryService.cs
[patient-history]: ../frontend/clinic-management-client/src/pages/patient/PatientMedicalHistoryPage.jsx
[history-dto]: ../backend/ClinicManagement/DTOs/Responses/MedicalHistoryResponses.cs
[patient-history-detail]: ../frontend/clinic-management-client/src/pages/patient/PatientMedicalHistoryDetailPage.jsx
[lab]: ../backend/ClinicManagement/Services/Implementations/LabTestService.cs
[lab-results]: ../frontend/clinic-management-client/src/pages/patient/LabResultsPage.jsx
[patient-billing]: ../frontend/clinic-management-client/src/components/patient/medical-history/PatientMedicineBillingSection.jsx
[invoice-entity]: ../backend/ClinicManagement/Data/Entities/Invoice.cs
[review]: ../backend/ClinicManagement/Services/Implementations/ReviewService.cs
[patient-reviews]: ../frontend/clinic-management-client/src/pages/patient/ReviewsPage.jsx
[notifications]: ../backend/ClinicManagement/Services/Implementations/NotificationService.cs
[notification-api]: ../backend/ClinicManagement/Controllers/NotificationsController.cs
[lab-submit]: ../backend/ClinicManagement/Services/Implementations/LabTestService.cs#L86
[role-access]: ../frontend/clinic-management-client/src/routes/roleAccess.js
[users-api]: ../backend/ClinicManagement/Controllers/UsersController.cs
[users]: ../backend/ClinicManagement/Services/Implementations/UserService.cs
[rbac]: ../backend/ClinicManagement/Services/Implementations/RbacService.cs
[catalog]: ../backend/ClinicManagement/Services/Implementations/CatalogServices.cs
[catalog-page]: ../frontend/clinic-management-client/src/pages/internal/CatalogManagementPage.jsx
[doctor-api]: ../backend/ClinicManagement/Controllers/DoctorsController.cs
[users-edit]: ../frontend/clinic-management-client/src/pages/internal/admin/UsersPage.jsx#L273
[medicine]: ../backend/ClinicManagement/Services/Implementations/MedicineService.cs
[supplier]: ../backend/ClinicManagement/Services/Implementations/SupplierService.cs
[lab-types]: ../backend/ClinicManagement/Services/Implementations/LabTestTypeService.cs
[lab-types-page]: ../frontend/clinic-management-client/src/pages/internal/LabTestTypesPage.jsx
[purchase]: ../backend/ClinicManagement/Services/Implementations/PurchaseOrderService.cs
[purchase-page]: ../frontend/clinic-management-client/src/pages/internal/admin/PurchaseOrdersPage.jsx
[inventory]: ../backend/ClinicManagement/Services/Implementations/InventoryService.cs
[inventory-page]: ../frontend/clinic-management-client/src/pages/internal/admin/InventoryPage.jsx
[invoice-queue]: ../backend/ClinicManagement/Services/Implementations/InvoiceService.cs#L14
[reception-ui]: ../frontend/clinic-management-client/src/components/internal/ReceptionCheckInDialog.jsx
[reception-book-ui]: ../frontend/clinic-management-client/src/components/internal/ReceptionCheckInDialog.jsx#L176
[schedule-review]: ../backend/ClinicManagement/Services/Implementations/ScheduleReviewService.cs
[schedule-review-page]: ../frontend/clinic-management-client/src/pages/internal/ScheduleReviewPage.jsx
[review-admin]: ../frontend/clinic-management-client/src/pages/internal/admin/ReviewsManagementPage.jsx
[review-dto]: ../backend/ClinicManagement/DTOs/Responses/ReviewResponse.cs
[dashboard-api]: ../backend/ClinicManagement/Controllers/AdminDashboardController.cs
[dashboard-page]: ../frontend/clinic-management-client/src/pages/internal/DashboardPage.jsx
[department-scope]: ../backend/ClinicManagement/Services/Implementations/DepartmentScope.cs
[doctor-repository]: ../backend/ClinicManagement/Repositories/Implementations/DoctorRepository.cs
[schedule]: ../backend/ClinicManagement/Services/Implementations/DoctorScheduleService.cs
[department-schedule]: ../backend/ClinicManagement/Services/Implementations/DepartmentScheduleService.cs
[department-schedule-page]: ../frontend/clinic-management-client/src/pages/internal/DepartmentSchedulesPage.jsx
[department-statistics]: ../backend/ClinicManagement/Services/Implementations/DepartmentStatisticsService.cs
[department-statistics-page]: ../frontend/clinic-management-client/src/pages/internal/DepartmentStatisticsPage.jsx
[record-entity]: ../backend/ClinicManagement/Data/Entities/MedicalRecord.cs
[lab-entity]: ../backend/ClinicManagement/Data/Entities/LabTest.cs
[doctor-profile]: ../frontend/clinic-management-client/src/pages/internal/doctor/DoctorProfilePage.jsx
[schedule-request-page]: ../frontend/clinic-management-client/src/pages/internal/doctor/DoctorScheduleRequestPage.jsx
[doctor-queue]: ../frontend/clinic-management-client/src/pages/internal/doctor/DoctorAppointmentsPage.jsx
[record]: ../backend/ClinicManagement/Services/Implementations/MedicalRecordService.cs
[doctor-history]: ../frontend/clinic-management-client/src/pages/internal/doctor/MedicalHistoryPage.jsx
[record-form]: ../frontend/clinic-management-client/src/components/internal/examinations/MedicalRecordFormSections.jsx
[lab-orders-page]: ../frontend/clinic-management-client/src/pages/internal/doctor/DoctorLabOrdersPage.jsx
[prescription]: ../backend/ClinicManagement/Services/Implementations/PrescriptionService.cs
[prescription-page]: ../frontend/clinic-management-client/src/pages/internal/doctor/PrescriptionPage.jsx
[record-page]: ../frontend/clinic-management-client/src/pages/internal/doctor/MedicalRecordPage.jsx
[reception]: ../backend/ClinicManagement/Services/Implementations/ReceptionService.cs
[reception-api]: ../backend/ClinicManagement/Controllers/ReceptionPatientsController.cs
[reception-appointments]: ../frontend/clinic-management-client/src/pages/internal/AppointmentsPage.jsx
[books]: ../backend/ClinicManagement/Services/Implementations/PatientBookService.cs
[book-issue]: ../backend/ClinicManagement/Services/Implementations/ReceptionService.cs#L173
[book-entity]: ../backend/ClinicManagement/Data/Entities/PatientBook.cs
[book-status]: ../backend/ClinicManagement/Services/Implementations/PatientBookService.cs#L62
[invoice-api]: ../backend/ClinicManagement/Controllers/InvoicesController.cs
[role-seed]: ../backend/ClinicManagement/Data/ApplicationDbContext.cs#L109
[invoice]: ../backend/ClinicManagement/Services/Implementations/InvoiceService.cs
[cashier-page]: ../frontend/clinic-management-client/src/pages/internal/CashierBillingPage.jsx
[cashier-stages]: ../frontend/clinic-management-client/src/pages/internal/CashierBillingPage.jsx#L224
[dispensing-repository]: ../backend/ClinicManagement/Repositories/Implementations/DispensingRepository.cs#L83
[invoice-create]: ../backend/ClinicManagement/Services/Implementations/InvoiceService.cs#L88
[invoice-paid]: ../backend/ClinicManagement/Services/Implementations/InvoiceService.cs#L140
[invoice-adjust]: ../backend/ClinicManagement/Services/Implementations/InvoiceService.cs#L223
[invoice-map]: ../backend/ClinicManagement/Services/Implementations/InvoiceService.cs#L289
[stock-review]: ../backend/ClinicManagement/Services/Implementations/PrescriptionService.StockReviews.cs#L47
[dispensing]: ../backend/ClinicManagement/Services/Implementations/DispensingService.cs
[dispensing-page]: ../frontend/clinic-management-client/src/pages/internal/pharmacist/DispensingPage.jsx
[dispensing-allocation]: ../backend/ClinicManagement/Services/Implementations/DispensingService.cs#L327
[dispensing-confirm]: ../backend/ClinicManagement/Services/Implementations/DispensingService.cs#L112
[dispensing-review]: ../backend/ClinicManagement/Services/Implementations/DispensingService.cs#L221
[lab-api]: ../backend/ClinicManagement/Controllers/LabTestsController.cs
[lab-pending]: ../backend/ClinicManagement/Services/Implementations/LabTestService.cs#L70
[technician-page]: ../frontend/clinic-management-client/src/pages/internal/technician/TechnicianLabQueuePage.jsx

[progress-source]: <Nhóm16 Tiến độ (2).xlsx>
