# Báo cáo đối chiếu chức năng theo danh sách đăng ký

Ngày cập nhật: **16/11/2026**. Mã nguồn nền: nhánh main, HEAD **a9d740a**, kèm các bản sửa sau merge trong lần rà soát này. Giữ tên file có ngày 04/11 để các liên kết hiện có không bị hỏng; nội dung bên dưới phản ánh trạng thái ngày 16/11.

Nguồn yêu cầu: [BB_DoAn_ChucNangtheoDSDK (2).docx](<BB_DoAn_ChucNangtheoDSDK (2).docx>). Đã đọc trực tiếp nội dung DOCX và đối chiếu đủ **71 mục**, giữ nguyên nhóm và thứ tự I.1–IX.5.

**Kết quả hiện tại: 53/71 mục đã có triển khai chính, 16/71 mục một phần, 2/71 mục chưa có luồng đáp ứng.** Lần 04/11 ghi nhận 42/26/3; lần này có thêm 11 mục đạt triển khai chính. Hai chức năng chưa có là **III.9 Cấu hình phòng khám** và **VII.4 Lập hóa đơn thuốc hoặc cuối lượt**. Các khoảng trống lớn còn nằm ở hóa đơn/thanh toán theo lượt, liên kết xét nghiệm, nhân sự và báo cáo theo kỳ.

Đây là đối chiếu triển khai frontend/API/service/entity/migration, có bổ sung kiểm thử trên database SQL Server LocalDB tạm và trình duyệt. “Đã có” không có nghĩa đã nghiệm thu đầy đủ trên database đang vận hành. Không thay đổi database ứng dụng trong lần rà soát này.

## Cách phân loại

- **Đã có:** có triển khai chính và đường sử dụng tương ứng với yêu cầu, trong điều kiện dữ liệu/quyền được cấu hình đúng.
- **Một phần:** đã có xử lý nhưng thiếu giao diện, điều kiện nghiệp vụ hoặc liên kết cần thiết được nêu rõ trong tài liệu.
- **Chưa có:** chưa có luồng thực tế đáp ứng mục đó; tên quyền, dữ liệu mẫu hoặc API tạo dữ liệu tùy ý chưa đủ.

Mỗi mục tài liệu được tính một lần; số lượng kiểm thử không tương ứng một-một với số chức năng. Đánh giá theo yêu cầu đã đăng ký: mục V.5 không quy định bắt buộc mạch/SpO2, nên 4 chỉ số hiện có được tính là đã triển khai phần chỉ số sinh tồn. Các vấn đề kết nối xét nghiệm vẫn khiến IV.7/V.6 ở mức một phần dù khám và thông báo đã có.

## Tổng hợp theo nhóm

| Nhóm | Tổng mục | Đã có | Một phần | Chưa có |
|---|---:|---:|---:|---:|
| I. Khách chưa đăng nhập | 4 | 3 | 1 | 0 |
| II. Bệnh nhân | 10 | 9 | 1 | 0 |
| III. Quản trị viên | 12 | 9 | 2 | 1 |
| IV. Trưởng khoa | 7 | 6 | 1 | 0 |
| V. Bác sĩ | 9 | 8 | 1 | 0 |
| VI. Nhân viên lễ tân | 10 | 9 | 1 | 0 |
| VII. Thu ngân | 8 | 1 | 6 | 1 |
| VIII. Dược sĩ | 6 | 5 | 1 | 0 |
| IX. Kỹ thuật viên xét nghiệm | 5 | 3 | 2 | 0 |
| **Tổng** | **71** | **53** | **16** | **2** |

## Nguồn phân công

Cột người phụ trách lấy **trực tiếp từ DOCX yêu cầu**, không suy ra từ tác giả commit hay người sửa lỗi. Tên viết tắt: Nhuận — Nguyễn Văn Nhuận; Phú — Dương Thạch Phú; Hoàng — Vũ Hoàng; Nguyên — Võ Ngọc Nguyên; Thoại — Trần Đình Minh Thoại.

Bản cũ dùng [bảng tiến độ][progress-source] để suy ra người phụ trách theo module. Khi có khác biệt, bảng hiện tại ưu tiên DOCX: **II.2 và III.9 là Nhuận; V.5 là Thoại, Nguyên; VI.8 là Phú; IX.5 là Thoại**. Những mục **II.7, II.8, VII.4, IX.1** không ghi tên trong DOCX được giữ là “Chưa ghi tên”; đây là khoảng trống phân công, khác với thiếu triển khai. Nhóm cần thống nhất người phụ trách VII.4, liên quan module hóa đơn của Thoại.

## Đối chiếu từng chức năng

### I Khách chưa đăng nhập

| Mã | Chức năng theo tài liệu | Phụ trách trong tài liệu | Trạng thái | Đã có và phần còn thiếu |
|---|---|---|---|---|
| I.1 | Xem thông tin công khai | Nhuận | **Một phần** | Đã có trang chủ, giới thiệu, dịch vụ, hướng dẫn, liên hệ và route /specialties. Tuy nhiên danh sách/chi tiết “Chuyên khoa” chỉ đọc Departments; chưa công bố danh mục Specializations và quan hệ khoa–chuyên khoa riêng như mô hình hiện tại. API /api/specializations vẫn yêu cầu catalog.manage. [Trang công khai][public-pages], [Routes][routes], [API danh mục][catalog-api]. |
| I.2 | Tra cứu bác sĩ | Phú | **Đã có** | Có tìm theo tên, lọc khoa/phòng, xem hồ sơ chuyên môn, học vị, kinh nghiệm và các phòng khám sắp tới. Bộ lọc khoa dùng DepartmentId; không coi đây là bộ lọc SpecializationId độc lập. [Tra cứu bác sĩ][doctor-search], [DoctorService][doctor]. |
| I.3 | Xem khung giờ khám trước đăng nhập | Phú | **Đã có** | Khách xem hồ sơ bác sĩ, chọn ngày và xem khung giờ trống trước đăng nhập; chỉ công bố ca Approved. API lịch đã được sửa để không báo trống giờ đã có lịch hẹn khi bộ đếm CurrentBooked chưa cập nhật. [Hồ sơ công khai][public-doctor], [BookingService][booking], [DoctorScheduleService][schedule]. |
| I.4 | Truy cập đăng ký và đăng nhập | Nhuận | **Đã có** | Có /register, /login và đường dẫn từ cổng bệnh nhân. [Routes][routes]. |

### II Bệnh nhân

| Mã | Chức năng theo tài liệu | Phụ trách trong tài liệu | Trạng thái | Đã có và phần còn thiếu |
|---|---|---|---|---|
| II.1 | Quản lý tài khoản | Nhuận | **Đã có** | Có đăng ký Patient, đăng nhập, đăng xuất, thông tin phiên đăng nhập và hồ sơ tài khoản. [Xác thực][auth], [AuthController][auth-api]. |
| II.2 | Quản lý hồ sơ cá nhân | Nhuận | **Đã có** | Có POST/GET/PUT /api/patients/me và form tạo khi chưa có hồ sơ. Kiểm tra ngày sinh, giấy tờ trùng, từ chối tự liên kết hồ sơ có sẵn chỉ dựa trên tên/điện thoại. API và trình duyệt đã xác minh tạo, sửa, tải lại và thử lại khi lỗi. [PatientService][patient], [Hồ sơ bệnh nhân][patient-profile]. |
| II.3 | Đặt lịch khám | Hoàng | **Đã có** | Có chọn khoa, bác sĩ, ngày, giờ; nhập lý do; kiểm tra trùng và xử lý xung đột khi lưu. Lịch hẹn dùng thời lượng 30 phút, không bắt buộc có sổ khi đặt web. [BookingService][booking], [Trang đặt lịch][booking-page]. |
| II.4 | Quản lý lịch hẹn của tôi | Hoàng | **Đã có** | Có danh sách/chi tiết/trạng thái và thao tác hủy lịch của mình qua PATCH /api/appointments/mine/{id}/cancel. Chặn người khác, lịch không còn được hủy và lịch đã tiếp nhận; giữ lịch sử, giải phóng giờ và lưu thông báo. [Lịch hẹn bệnh nhân][my-appointments], [API lịch hẹn][appointments-api], [BookingService][booking]. |
| II.5 | Xem lịch sử khám | Nguyên | **Đã có** | Có danh sách và chi tiết lịch sử của bản thân, triệu chứng, chẩn đoán, kết luận, giới hạn theo hồ sơ Patient liên kết tài khoản. [MedicalHistoryService][history], [Trang lịch sử][patient-history]. |
| II.6 | Xem đơn thuốc | Nguyên | **Đã có** | Chi tiết lịch sử có thuốc, số lượng, liều dùng, hướng dẫn, trạng thái và thời gian cấp thuốc. [DTO lịch sử][history-dto], [Trang chi tiết lịch sử][patient-history-detail]. |
| II.7 | Xem kết quả xét nghiệm | Chưa ghi tên | **Đã có** | Có danh sách, chi tiết, trạng thái và kết quả của tài khoản bệnh nhân; API giới hạn dữ liệu theo người đăng nhập. [LabTestService][lab], [Trang kết quả][lab-results]. |
| II.8 | Xem hóa đơn và thanh toán đã ghi nhận | Chưa ghi tên | **Một phần** | Đã xem được hóa đơn Medicine/Final gắn đơn thuốc trong lịch sử khám. Chưa có danh sách đầy đủ tiền sổ, khám, xét nghiệm; chưa có các lần thanh toán và số dư còn thiếu. [Chi phí thuốc][patient-billing], [MedicalHistoryService][history], [Invoice][invoice-entity]. |
| II.9 | Đánh giá bác sĩ | Nhuận | **Đã có** | Chỉ Patient sở hữu lịch Completed được đánh giá; kiểm tra trùng theo AppointmentId và xử lý xung đột khi ghi. [ReviewService][review], [Trang đánh giá][patient-reviews]. |
| II.10 | Nhận thông báo | Nhuận | **Đã có** | Thay đổi lịch đã lưu Notifications và phát SignalR. Hoàn tất xét nghiệm lưu thông báo cho đúng bệnh nhân/bác sĩ, phát LabResultChanged để tải lại danh sách/chi tiết; có xem lịch sử, mở kết quả và đánh dấu đã đọc. Kiểm tra API/SignalR xác minh phạm vi người nhận và rollback khi lưu thông báo lỗi. [NotificationService][notifications], [API thông báo][notification-api], [Lưu kết quả][lab-submit]. |

### III Quản trị viên

| Mã | Chức năng theo tài liệu | Phụ trách trong tài liệu | Trạng thái | Đã có và phần còn thiếu |
|---|---|---|---|---|
| III.1 | Truy cập trang quản trị | Nhuận | **Đã có** | Có đăng nhập nội bộ, menu và route theo Admin, bảo vệ API theo vai trò hoặc quyền. [Routes][routes], [Quyền giao diện][role-access]. |
| III.2 | Quản lý tài khoản và vai trò | Nhuận | **Đã có** | Có tìm/lọc/phân trang, khóa/mở khóa, gán vai trò và quản lý quyền. Đã bổ sung tạo tài khoản nhân viên, lưu sửa họ tên/email/điện thoại qua API riêng, thống kê thật và liên kết hồ sơ bác sĩ. [UsersController][users-api], [UserService][users], [Trang tài khoản][users-page]. |
| III.3 | Quản lý tổ chức phòng khám | Phú | **Đã có** | Có thêm, sửa, tra cứu, trạng thái hoạt động cho khoa, chuyên khoa, phòng; thông tin loại phòng và vị trí. [CatalogServices][catalog], [Trang danh mục][catalog-page]. |
| III.4 | Quản lý hồ sơ nhân sự | Phú | **Một phần** | Đã có API Admin thêm/sửa/tra cứu/khóa hồ sơ Doctor, gán khoa/chuyên khoa, API liên kết tài khoản; sửa tài khoản đã lưu thật. Chưa có màn hình quản trị hồ sơ Doctor tương ứng và chưa có CRUD hồ sơ Staff/vị trí công việc đầy đủ. UsersPage quản lý tài khoản không thay thế hồ sơ nhân sự. [DoctorsController][doctor-api], [DoctorService][doctor], [Routes][routes], [Trang tài khoản][users-page]. |
| III.5 | Quản lý danh mục thuốc | Phú, Nguyên | **Đã có** | Có quản lý thuốc, nhóm thuốc, nhà cung cấp, đơn vị và giá. [MedicineService][medicine], [SupplierService][supplier], [Routes][routes]. |
| III.6 | Quản lý loại xét nghiệm | Thoại | **Đã có** | Có thêm, sửa, tra cứu loại xét nghiệm, mô tả, giá và trạng thái. [LabTestTypeService][lab-types], [Trang loại xét nghiệm][lab-types-page]. |
| III.7 | Quản lý nhập kho thuốc | Nguyên | **Đã có** | Phiếu nhập nhiều dòng thuốc/lô; số lượng, giá nhập, số lô, hạn dùng; nhận hàng cập nhật tồn trong giao dịch, kiểm tra phiếu đã nhận và lô hết hạn. [PurchaseOrderService][purchase], [Trang phiếu nhập][purchase-page]. |
| III.8 | Theo dõi tồn kho | Nguyên | **Đã có** | Có tra cứu theo thuốc/lô và phân loại còn hàng, ít hàng, hết hàng, gần hết hạn, hết hạn. [InventoryService][inventory], [Trang tồn kho][inventory-page]. |
| III.9 | Cấu hình phòng khám | Nhuận | **Chưa có** | Chưa có trang/API/mô hình quản trị thông tin phòng khám, giá khám, giá sổ và tham số vận hành. Nội dung công khai hiện nằm trong file; InvoiceService vẫn cố định phí khám 150.000 đồng. [Hàng chờ hóa đơn][invoice-queue], [Nội dung công khai][public-content], [Routes][routes]. |
| III.10 | Duyệt lịch của Trưởng khoa | Nhuận | **Đã có** | Có Admin duyệt/từ chối yêu cầu lịch của Trưởng khoa, kiểm tra trùng bác sĩ/phòng/thời gian, bắt buộc lý do từ chối và chặn tự duyệt. [ScheduleReviewService][schedule-review], [Trang duyệt lịch][schedule-review-page]. |
| III.11 | Quản lý đánh giá | Nhuận | **Đã có** | Có quản lý ẩn/hiện và API /api/reviews/admin/statistics: số lượng, điểm trung bình tất cả/công khai theo bác sĩ; lọc và phân trang độc lập. Không có đánh giá trả null. [ReviewService][review], [Trang đánh giá][review-admin], [Bảng điểm][doctor-ratings]. |
| III.12 | Xem báo cáo toàn phòng khám | Thoại | **Một phần** | Có Dashboard doanh thu, lượt khám, tồn kho. API revenue có from/to; giao diện hiện chỉ gọi summary và chưa có chọn kỳ. Chưa có báo cáo lượt khám theo kỳ tùy chọn đầy đủ. [AdminDashboardController][dashboard-api], [Dashboard][dashboard-page]. |

### IV Trưởng khoa

| Mã | Chức năng theo tài liệu | Phụ trách trong tài liệu | Trạng thái | Đã có và phần còn thiếu |
|---|---|---|---|---|
| IV.1 | Truy cập cổng nội bộ theo khoa | Nhuận | **Đã có** | Có DepartmentHead, route theo vai trò và xác định khoa qua hồ sơ Doctor đang hoạt động. [Quyền giao diện][role-access], [DepartmentScope][department-scope]. |
| IV.2 | Xử lý yêu cầu đăng ký ca | Nhuận | **Đã có** | Duyệt/từ chối trong khoa, bắt buộc lý do từ chối, chặn duyệt khác khoa, tự duyệt và duyệt lịch của Trưởng khoa khác. [ScheduleReviewService][schedule-review]. |
| IV.3 | Kiểm tra lịch trước khi duyệt | Phú | **Đã có** | Kiểm tra trùng bác sĩ, thời gian, phòng; chỉ yêu cầu Pending được xử lý và chỉ ca Approved được đưa ra đặt khám. Hiện chưa có API sửa/xóa ca đã duyệt, nên không có đường sửa ca đang gắn lịch hẹn qua các API này. [Duyệt lịch][schedule-review], [DoctorRepository][doctor-repository], [API lịch][schedule-api]. |
| IV.4 | Đăng ký lịch của bản thân | Nhuận | **Đã có** | DepartmentHead dùng chung luồng gửi/theo dõi yêu cầu ca; thông báo yêu cầu của Trưởng khoa chuyển Admin và khoa không được tự duyệt. [DoctorScheduleService][schedule], [Người nhận yêu cầu lịch][notifications]. |
| IV.5 | Xem lịch trực trong khoa | Nhuận | **Đã có** | Có lịch ngày/tuần, lọc bác sĩ/phòng trong khoa và chỉ hiển thị ca đã duyệt. [DepartmentScheduleService][department-schedule], [Trang lịch khoa][department-schedule-page]. |
| IV.6 | Xem thống kê khoa | Nhuận | **Đã có** | Có lượt khám, số yêu cầu chờ/đã duyệt theo khoảng ngày, giới hạn khoa được phân công và kiểm tra tham số ngày. [DepartmentStatisticsService][department-statistics], [Trang thống kê khoa][department-statistics-page]. |
| IV.7 | Thực hiện nghiệp vụ bác sĩ | Cả nhóm | **Một phần** | Có quyền khám, chỉ số sinh tồn, kê đơn, ghi sổ và nhận kết quả xét nghiệm. Đã sửa route/menu/API hồ sơ bác sĩ để Trưởng khoa xem/sửa hồ sơ chuyên môn của mình. Vẫn thiếu liên kết xét nghiệm với lượt khám và hỗ trợ bệnh nhân trực tiếp chưa có tài khoản như V.6. [DoctorsController][doctor-api], [MedicalRecordService][record], [LabTest][lab-entity]. |

### V Bác sĩ

| Mã | Chức năng theo tài liệu | Phụ trách trong tài liệu | Trạng thái | Đã có và phần còn thiếu |
|---|---|---|---|---|
| V.1 | Truy cập và xem hồ sơ cá nhân | Phú | **Đã có** | Có đăng nhập nội bộ, xem/sửa thông tin bác sĩ gồm họ tên, học vị, kinh nghiệm, giới thiệu; khoa và chuyên khoa chỉ đọc. [DoctorService][doctor], [Trang hồ sơ bác sĩ][doctor-profile]. |
| V.2 | Đăng ký ca khám | Phú | **Đã có** | Có ngày, giờ bắt đầu/kết thúc, phòng; theo dõi Pending/Approved/Rejected và lý do. Kiểm tra phòng thuộc khoa và xung đột. [DoctorScheduleService][schedule], [Trang đăng ký ca][schedule-request-page]. |
| V.3 | Xem lịch và danh sách chờ khám | Phú | **Đã có** | Có yêu cầu/lịch làm việc của mình, lịch hẹn và hàng đợi bệnh nhân đã check-in, bắt đầu khám. [Trang ca làm][schedule-request-page], [Danh sách khám][doctor-queue], [MedicalRecordService][record]. |
| V.4 | Tra cứu lịch sử bệnh nhân | Nguyên | **Đã có** | Có lịch sử khám, chẩn đoán, đơn thuốc; xác minh lượt hiện tại thuộc bác sĩ và đã check-in/xác minh sổ trước khi tra cứu. [MedicalHistoryService][history], [Trang lịch sử bệnh nhân][doctor-history]. |
| V.5 | Khám và lập hồ sơ bệnh án | Thoại, Nguyên | **Đã có** | Có bắt đầu khám, triệu chứng, chẩn đoán, ghi chú, kết luận và 4 chỉ số: nhiệt độ, huyết áp, cân nặng, chiều cao. Dữ liệu đi xuyên entity/DTO/migration/form/lịch sử; thay đổi chỉ số làm mất xác nhận ghi sổ cũ. 118 kiểm tra API chỉ số sinh tồn đã đạt. Tài liệu không quy định danh sách chỉ số bắt buộc; chưa coi mạch/SpO2 là yêu cầu đã đăng ký riêng. [MedicalRecordService][record], [MedicalRecord][record-entity], [Chỉ số sinh tồn][vitals-form]. |
| V.6 | Chỉ định xét nghiệm | Thoại | **Một phần** | Có tạo chỉ định, loại xét nghiệm, theo dõi và xem kết quả. Chỉ định mới chỉ gắn PatientId là UserId và DoctorId; thiếu AppointmentId/MedicalRecordId, kiểm tra lượt khám được phân công và hỗ trợ bệnh nhân trực tiếp chưa có tài khoản. [LabTestService][lab], [LabTest][lab-entity], [Trang chỉ định][lab-orders-page]. |
| V.7 | Kê đơn thuốc | Nguyên | **Đã có** | Có thuốc, số lượng, liều, hướng dẫn, cảnh báo tồn; chưa trừ kho lúc kê đơn. Có quản lý phiên bản, chặn sửa đơn đã cấp và chặn đổi thuốc/số lượng khi đã có hóa đơn. [PrescriptionService][prescription], [Trang kê đơn][prescription-page]. |
| V.8 | Đối chiếu và ghi sổ khám | Nguyên | **Đã có** | Có xác nhận ghi sổ; bắt buộc có sổ và xác nhận trước khi hoàn thành, cùng chẩn đoán và kết luận. Sửa nội dung/đơn thuốc làm mất xác nhận cũ để cần đối chiếu lại. [MedicalRecordService][record], [PrescriptionService][prescription], [Trang hồ sơ khám][record-page]. |
| V.9 | Nhận thông báo thời gian thực | Nhuận | **Đã có** | Có thông báo check-in và kết quả xét nghiệm cho bác sĩ đặt chỉ định, gồm Trưởng khoa khi thực hiện nghiệp vụ bác sĩ; lưu lịch sử và tự cập nhật dữ liệu qua SignalR. API/SignalR đã kiểm tra không phát cho bác sĩ không liên quan. [ReceptionService][reception], [NotificationService][notifications], [Lưu kết quả][lab-submit]. |

### VI Nhân viên lễ tân

| Mã | Chức năng theo tài liệu | Phụ trách trong tài liệu | Trạng thái | Đã có và phần còn thiếu |
|---|---|---|---|---|
| VI.1 | Truy cập cổng tiếp nhận | Nhuận | **Đã có** | Có vai trò, menu tiếp nhận, route và quyền xử lý lịch/sổ/check-in. [Quyền giao diện][role-access], [Danh mục quyền][permissions]. |
| VI.2 | Tiếp nhận và quản lý hồ sơ bệnh nhân | Phú | **Một phần** | Có tìm đối chiếu, tạo hồ sơ khi tiếp nhận/đặt trực tiếp, chống trùng và liên kết tài khoản. Đã thêm PUT /api/patients/{patientId} cập nhật hồ sơ với kiểm tra trùng giấy tờ; kiểm tra API đã có. Giao diện tiếp nhận hiện chưa có form/gọi API sửa đầy đủ hồ sơ đã tồn tại. [ReceptionPatientsController][reception-api], [ReceptionService][reception], [Hộp thoại tiếp nhận][reception-ui]. |
| VI.3 | Tra cứu lịch hẹn | Hoàng | **Đã có** | Có danh sách, thông tin chi tiết và lọc ngày/trạng thái/bác sĩ. [AppointmentsPage][reception-appointments], [BookingService][booking]. |
| VI.4 | Xử lý lịch hẹn | Hoàng | **Đã có** | Có xác nhận, đổi lịch, hủy và phát sự kiện thay đổi; kiểm tra ca hợp lệ, xung đột và trạng thái, chặn đổi/hủy sau check-in. Từ chối lịch Pending hiện thực hiện qua thao tác Hủy chung, chưa có trạng thái Rejected riêng. [BookingService][booking], [AppointmentsPage][reception-appointments]. |
| VI.5 | Đặt lịch tại quầy | Hoàng | **Đã có** | Có tạo lịch hộ/khách trực tiếp, chọn bác sĩ/ca đã duyệt/giờ trống, tạo hoặc chọn hồ sơ hiện có. [Đặt lịch trực tiếp][booking], [AppointmentsPage][reception-appointments]. |
| VI.6 | Kiểm tra sổ khám | Phú | **Đã có** | Có sổ hiện hành, mã sổ, lịch sử cấp lại và xác nhận đã mang/đối chiếu sổ thực tế. [ReceptionService][reception], [PatientBookService][books], [Hộp thoại tiếp nhận][reception-ui]. |
| VI.7 | Tạo yêu cầu mua hoặc cấp lại sổ | Hoàng | **Đã có** | Đã lưu PatientBookRequest cho New/Lost/Forgot, chống tạo yêu cầu mở trùng và thông báo tới Thu ngân/Admin; giao diện hướng dẫn sang Thu ngân, không đổi hồ sơ/lịch sử. Đã sửa để yêu cầu Issued trong lịch sử không khóa nút tạo yêu cầu tiếp theo. Phần Thu ngân tiếp nhận/lập hóa đơn từ yêu cầu vẫn thiếu ở VII.2. [Yêu cầu sổ][book-requests], [Hộp thoại tiếp nhận][reception-ui]. |
| VI.8 | Cấp và liên kết sổ khám | Phú | **Đã có** | Cấp/cấp lại kiểm tra hóa đơn Paid, lưu người cấp/thời gian/mã sổ, vô hiệu sổ cũ và giữ PreviousBookId; database bảo vệ một sổ Issued mỗi bệnh nhân. Đã bổ sung kiểm tra Paid cho cả nhánh Pending → Issued của API đổi trạng thái, chặn cấp sổ bỏ qua thu tiền; chặn cấp lại sổ đang dùng cho lượt khám chưa xong. [ReceptionService][reception], [PatientBookService][books], [PatientBook][book-entity]. |
| VI.9 | Check-in bệnh nhân | Hoàng | **Đã có** | Bắt buộc lịch Confirmed đúng ngày, khớp hồ sơ, sổ Issued, hóa đơn sổ Paid nếu có và xác nhận mang sổ; lưu mã sổ, thời điểm xác minh/check-in. [ReceptionService][reception]. |
| VI.10 | Nhận và gửi thông báo thời gian thực | Hoàng | **Đã có** | Có thay đổi lịch, sổ, thanh toán tiền sổ và thông báo check-in cho bác sĩ; các sự kiện gắn đúng nhóm người nhận. [NotificationService][notifications], [ReceptionService][reception]. |

### VII Thu ngân

| Mã | Chức năng theo tài liệu | Phụ trách trong tài liệu | Trạng thái | Đã có và phần còn thiếu |
|---|---|---|---|---|
| VII.1 | Truy cập quầy thu ngân | Thoại | **Đã có** | Đã seed/nâng cấp vai trò Cashier và quyền billing.view/create/recordPayment; route/menu và API kiểm tra vai trò cùng quyền. Kiểm tra API xác minh tài khoản thiếu quyền bị từ chối; migration giữ vai trò tùy chỉnh khi trùng ID seed. [API hóa đơn][invoice-api], [Quyền giao diện][role-access], [Migration Cashier][cashier-migration]. |
| VII.2 | Lập hóa đơn tiền sổ | Thoại | **Một phần** | Lễ tân đã tạo yêu cầu mua/cấp lại và gửi thông báo Thu ngân; có BookInvoice, API tạo/thu tiền và phát sổ sau Paid. Quầy Thu ngân vẫn không có hàng chờ Book hoặc thao tác lập hóa đơn từ PatientBookRequest; yêu cầu hiện được liên kết với hóa đơn ở bước phát sổ. [Yêu cầu sổ][book-requests], [ReceptionService][reception], [Trang thu ngân][cashier-page]. |
| VII.3 | Lập hóa đơn khám và xét nghiệm | Thoại | **Một phần** | Có hàng chờ LabAndConsultation và ghi hóa đơn. Hiện chỉ gom xét nghiệm theo bệnh nhân, AppointmentId = 0, không ghép phí khám chưa thu của đúng lượt; phí khám nằm riêng ở Pending. [Hàng chờ hóa đơn][invoice-queue]. |
| VII.4 | Lập hóa đơn thuốc hoặc cuối lượt | Chưa ghi tên | **Chưa có** | Chưa có luồng lập từ đơn đã chốt: GetPendingBillingsAsync chỉ xử lý Pending và LabAndConsultation; giao diện cũng chỉ có hai lựa chọn này. Medicine/Final đã xuất hiện ở nơi đọc hóa đơn/cấp thuốc nhưng chưa có hàng chờ, tính phí và thao tác lập tương ứng. [Hàng chờ hóa đơn][invoice-queue], [Giao diện thu ngân][cashier-stages], [Hóa đơn cấp thuốc][dispensing-repository]. |
| VII.5 | Tính và đối chiếu chi phí | Thoại | **Một phần** | Có tổng tiền, giảm BHYT mô phỏng theo tỷ lệ và kiểm tra nguồn khoản mục đã thu. Chưa đối chiếu đầy đủ theo lượt; ngoài tiền sổ, đơn giá/số lượng/nguồn phí vẫn nhận trực tiếp từ client thay vì dựng từ nghiệp vụ gốc. [Tạo hóa đơn][invoice-create]. |
| VII.6 | Ghi nhận thanh toán | Thoại | **Một phần** | Có chọn tiền mặt/chuyển khoản/thẻ và xác nhận thu tiền. Tạo Invoice là Paid ngay; chưa có bảng/giao dịch từng lần thanh toán, trả một phần, số dư, mã/chứng từ đối chiếu. BookInvoice cũng mới có Unpaid/Paid. [Tạo hóa đơn][invoice-paid], [Invoice][invoice-entity], [Trang thu ngân][cashier-page]. |
| VII.7 | Tra cứu hóa đơn và phiếu thu | Thoại | **Một phần** | Có danh sách lịch sử, tìm theo mã bệnh nhân/lượt khám và API chi tiết hóa đơn. Chưa có lịch sử các lần thanh toán, mẫu phiếu thu hoặc thao tác in/xuất phiếu thu tại quầy. [InvoiceService][invoice], [Trang thu ngân][cashier-page]. |
| VII.8 | Điều chỉnh và hoàn tiền | Thoại | **Một phần** | Có Adjustment Invoice, hóa đơn gốc, lý do, khoản tiền âm/dương, người lập, thời điểm; giữ hóa đơn cũ. Chưa nối chứng từ với đối soát đơn thuốc đang AwaitingBilling và các lần thanh toán; response cũng chưa trả InvoiceType/OriginalInvoiceId để truy vết đầy đủ trên giao diện. [Chứng từ điều chỉnh][invoice-adjust], [Ánh xạ hóa đơn][invoice-map], [Rà soát đơn][stock-review]. |

### VIII Dược sĩ

| Mã | Chức năng theo tài liệu | Phụ trách trong tài liệu | Trạng thái | Đã có và phần còn thiếu |
|---|---|---|---|---|
| VIII.1 | Truy cập quầy thuốc | Nguyên | **Đã có** | Có vai trò Pharmacist, menu/route cấp thuốc, bảo vệ bằng quyền pharmacy.dispense. [Quyền giao diện][role-access], [Routes][routes]. |
| VIII.2 | Tiếp nhận đơn thuốc | Nguyên | **Đã có** | Có danh sách, tìm kiếm, bộ lọc, chi tiết bệnh nhân/thuốc/liều/hướng dẫn và tình trạng hóa đơn tương ứng. [DispensingService][dispensing], [Trang cấp thuốc][dispensing-page]. |
| VIII.3 | Kiểm tra và chọn lô thuốc | Nguyên | **Đã có** | Tự phân bổ theo lô còn hạn, còn tồn, ưu tiên hạn dùng sớm; một dòng đơn có thể dùng nhiều lô. [Phân bổ lô][dispensing-allocation]. |
| VIII.4 | Xác nhận giao thuốc | Nguyên | **Đã có** | Chỉ cho xác nhận khi tìm được Invoice Standard Medicine/Final ở trạng thái Paid, khớp lượt/bệnh nhân/đơn hoặc đủ các dòng thuốc. Điều kiện này hoạt động trên trạng thái hóa đơn hiện có; luồng tạo và thanh toán hóa đơn tương ứng còn thiếu ở VII.4/VII.6. [Xác nhận cấp][dispensing-confirm], [Đối chiếu hóa đơn][dispensing-repository]. |
| VIII.5 | Ghi nhận cấp thuốc và xuất kho | Nguyên | **Đã có** | Lưu lô/số lượng, người cấp/thời điểm; trừ tồn và đổi trạng thái Dispensed trong giao dịch. Chặn cấp lặp, thiếu tồn, lô hết hạn và xử lý xung đột. [Xác nhận cấp][dispensing-confirm], [Phân bổ lô][dispensing-allocation]. |
| VIII.6 | Xử lý thiếu thuốc | Nguyên | **Một phần** | Có dừng toàn đơn, gửi rà soát, bác sĩ giữ/điều chỉnh đơn, thông báo các bên và kiểm lại tồn. Khi đã có hóa đơn, phương án điều chỉnh dừng ở AwaitingBilling; chưa có bước Thu ngân đối soát/hoàn tiền rồi áp dụng phương án và mở lại cấp thuốc. [Rà soát bác sĩ][stock-review], [Rà soát dược sĩ][dispensing-review]. |

### IX Kỹ thuật viên xét nghiệm

| Mã | Chức năng theo tài liệu | Phụ trách trong tài liệu | Trạng thái | Đã có và phần còn thiếu |
|---|---|---|---|---|
| IX.1 | Truy cập cổng xét nghiệm | Chưa ghi tên | **Đã có** | Có LabTechnician, route hàng chờ và quyền xem/nhập kết quả. [Routes][routes], [API xét nghiệm][lab-api]. |
| IX.2 | Tiếp nhận chỉ định | Thoại | **Một phần** | Có hàng chờ xét nghiệm dựa vào InvoiceDetail SourceType LabTest. Chưa kiểm tra Invoice.Status/BillingStage và thanh toán đủ; chỉ định thiếu liên kết lượt khám, giao diện chủ yếu hiển thị ID bệnh nhân. [Hàng chờ xét nghiệm][lab-pending], [LabTest][lab-entity], [Giao diện kỹ thuật viên][technician-page]. |
| IX.3 | Thực hiện xét nghiệm | Thoại | **Một phần** | Có luồng Pending sang Completed khi nộp kết quả. Chưa có thao tác nhận/bắt đầu và trạng thái đang thực hiện; API SubmitResult không kiểm tra thanh toán nên điều kiện tại hàng chờ chưa được bảo vệ khi gọi trực tiếp. [Lưu kết quả][lab-submit], [API xét nghiệm][lab-api], [Danh mục quyền][permissions]. |
| IX.4 | Nhập và hoàn tất kết quả | Thoại | **Đã có** | Có nội dung kết quả, ghi chú, URL tệp nếu có, người thực hiện, thời điểm; cập nhật trạng thái và chặn nhập trùng. API nhập kết quả được kiểm soát bằng quyền xét nghiệm, không cập nhật chẩn đoán/hồ sơ bác sĩ. [Lưu kết quả][lab-submit], [API xét nghiệm][lab-api]. |
| IX.5 | Thông báo kết quả | Thoại | **Đã có** | Hoàn tất xét nghiệm lưu thông báo trong cùng transaction với kết quả rồi phát NotificationReceived/LabResultChanged cho đúng bệnh nhân và bác sĩ có quyền; hỗ trợ Trưởng khoa chỉ định xét nghiệm, lịch sử và mở chi tiết. Kiểm tra đồng thời, trùng kết quả và lỗi lưu thông báo đã đạt. Điều kiện thanh toán vẫn thiếu riêng tại IX.2–IX.3. [Lưu kết quả][lab-submit], [NotificationService][notifications], [Điều hướng thông báo][notification-navigation]. |

## Các lỗi đã sửa trong lần rà soát sau merge

| Lỗi xác nhận được | Sửa và bằng chứng kiểm tra |
|---|---|
| Migration 05/11 và 08/11 cùng tạo IssuedByUserId/index/FK, khiến database mới dừng với SQL 2705 | Cho migration 05/11 sở hữu cấu trúc, nhận diện cấu trúc đã có từ nhánh còn lại; bỏ thêm/xóa lặp ở migration 08/11. Kiểm tra cả database mới, nâng cấp dữ liệu cũ, rollback và tình huống nhánh đã có cột nhưng chưa có lịch sử migration 05/11. |
| Nâng cấp sổ Voided bị chặn bởi CK_PatientBooks_Status mới | Chuyển Voided sang Replaced trước khi đổi constraint; rollback trạng thái không còn hiệu lực về Voided. Không xóa sổ hoặc mối nối lịch sử. Nếu còn sổ Pending, rollback về mô hình cũ dừng với thông báo yêu cầu xử lý trước, vì mô hình cũ không có trạng thái tương ứng. |
| SeedDepartmentHeadRole gán quyền/xóa vai trò theo ID 6 dù ID đó thuộc vai trò tùy chỉnh | Tìm Trưởng khoa theo tên, giữ đúng ID đang có và không xóa dữ liệu thuộc migration trước khi rollback. Kiểm thử dùng CustomRole ID 6 và DepartmentHead ID 42. |
| API đổi trạng thái cho cấp sổ Pending chưa có hóa đơn Paid | Kiểm tra hóa đơn Paid và đúng bệnh nhân trước khi cấp; yêu cầu bị từ chối giữ nguyên Pending và chưa ghi người cấp. Loại bỏ một phép gán người cấp bị lặp sau merge. |
| Yêu cầu sổ đã Issued trong lịch sử làm khóa nút yêu cầu mua/cấp lại tiếp theo | Chỉ chặn khi còn yêu cầu mở; hiển thị đúng “Đã phát sổ” cho yêu cầu hoàn tất. Bổ sung xác nhận trình duyệt cho cả Mất sổ/Quên sổ. |
| Trưởng khoa không vào được hồ sơ chuyên môn của mình | Đồng bộ menu, route và GET/PUT /api/doctors/me cho Doctor/DepartmentHead; các vai trò khác không được thấy menu hoặc truy cập route này. |
| API giờ trống của DoctorScheduleService chỉ đọc CurrentBooked, trong khi đặt lịch lưu ở Appointments | Đối chiếu lịch hẹn chưa hủy theo bác sĩ/ngày/giờ để loại giờ đã đặt khỏi giờ trống; thêm kiểm tra API sau đặt tại quầy khi bộ đếm vẫn bằng 0. |
| Nhiều người đặt cùng giờ gây deadlock SQL 1205 và trả HTTP 500 | Bao phủ toàn bộ thao tác tạo/đổi lịch để chuyển deadlock thành APPOINTMENT_CONFLICT (409), kể cả khi xảy ra ở truy vấn trước bước lưu. Bộ kiểm tra C8 tranh chấp giờ yêu cầu chỉ một lịch thành công và các yêu cầu còn lại nhận đúng lỗi xung đột. |
| Thu tiền sổ đồng thời có một yêu cầu trả 500 dù chỉ một hóa đơn được ghi | Chuyển deadlock/xung đột khóa duy nhất của hóa đơn Book và các trường hợp nguồn phí đã thu thành lỗi nghiệp vụ 409; giữ transaction để chỉ ghi nhận một lần thu. |
| Kiểm thử tiếp nhận cũ khẳng định chưa tồn tại Cashier hoặc cố tạo lại vai trò này | Cập nhật các fixture tiếp nhận/C8–C9 để dùng vai trò đã seed; giữ kiểm tra tồn tại vai trò và quyền thanh toán. |
| Runner C8/C9 dùng đường dẫn build tạm không có sẵn và nhãn check-in cũ | Mặc định dùng output Release của Week2Verification; cập nhật xác nhận theo nhãn “Đã check-in tại quầy” đang hiển thị. |

Các thay đổi migration sửa đường khởi tạo/nâng cấp bị lỗi, không tạo migration mới và không tự áp dụng vào database ứng dụng. Database đã áp dụng các migration này không tự chạy lại phần Up; môi trường triển khai cần đối chiếu lịch sử migration trước khi cập nhật. Không chạy lại seed toàn bộ để sửa cấu trúc hoặc bật quyền.

## Phần còn thiếu cần hoàn thiện

1. **Thu ngân và hóa đơn (VII.2–VII.8, II.8):** quầy hiện chỉ có Pending/LabAndConsultation, chưa có hàng chờ Book/Medicine/Final. Xét nghiệm gom theo tài khoản bệnh nhân, AppointmentId = 0; phí khám cố định và tách riêng, chưa xác định phí chưa thu theo lượt. Cần lập khoản mục từ dữ liệu gốc trên server, chống thu trùng, tách lập hóa đơn khỏi thu tiền và lưu từng lần thu/chứng từ/số dư. Portal bệnh nhân chưa có toàn bộ tiền sổ/khám/xét nghiệm và lịch sử thanh toán. [InvoiceService][invoice], [Quầy thu ngân][cashier-page], [Invoice][invoice-entity].
2. **Xét nghiệm theo lượt và điều kiện Paid (V.6, IV.7, IX.2–IX.3):** LabTest.PatientId/DoctorId hiện là ID tài khoản; thiếu AppointmentId/MedicalRecordId và chỉ định cho khách trực tiếp không có User. Hàng chờ mới kiểm tra có InvoiceDetail; API nộp kết quả vẫn chấp nhận chỉ định chưa thu tiền. Còn thiếu bước nhận/bắt đầu và trạng thái đang thực hiện. Thông báo kết quả đã có, nhưng không khắc phục được các thiếu sót này. [LabTestService][lab], [LabTest][lab-entity].
3. **Đối soát thiếu thuốc (VIII.6/VII.8):** đã có dừng toàn đơn và phương án bác sĩ; sau AwaitingBilling chưa có bước Thu ngân đối soát/hoàn tiền, áp dụng phương án rồi mở lại cấp thuốc. Adjustment Invoice chung chưa thay thế được bước này. [Rà soát đơn][stock-review], [Cấp thuốc][dispensing-review].
4. **Nhân sự và hồ sơ bệnh nhân (III.4/VI.2):** API hồ sơ Doctor và API sửa Patient đã có, nhưng cần màn hình sử dụng tương ứng; bổ sung mô hình/quản lý Staff và vị trí công việc. Không còn lỗi form sửa tài khoản chỉ báo thành công. [DoctorService][doctor], [ReceptionPatientsController][reception-api], [Trang tài khoản][users-page].
5. **Cấu hình và báo cáo (III.9/III.12):** cần nguồn cấu hình quản trị cho thông tin phòng khám, phí khám, phí sổ và tham số; Dashboard cần chọn kỳ và dữ liệu lượt khám theo kỳ. Hiện API doanh thu có from/to nhưng giao diện mới dùng summary. [Dashboard][dashboard-page], [API Dashboard][dashboard-api], [Nội dung công khai][public-content].
6. **Danh mục công khai (I.1):** trang /specialties đã hoạt động nhưng hiện dùng Departments để hiển thị chuyên khoa; cần công bố cả Specializations theo khoa hoặc làm rõ lại mô hình nghiệp vụ. Không tính chỉ có route công khai là hoàn thành cả hai danh mục.

Kiểm thử hành trình D9 xác nhận 4 khoảng trống tích hợp: **LAB_VISIT_BINDING, MEDICINE_FINAL_QUEUE, WALKIN_LAB_IDENTITY, LAB_RESULT_PAYMENT_GUARD**. Kết quả 131 kiểm tra đường hiện có đạt không đồng nghĩa luồng đầy đủ đã nghiệm thu; các trạng thái một phần/chưa có phía trên vẫn giữ nguyên.

## Kiểm tra đã chạy ngày 16/11/2026

Các runner tích hợp chỉ tạo database tên ngẫu nhiên và xóa database do chính chúng tạo; không dùng database ứng dụng.

| Kiểm tra | Kết quả | Phạm vi kết luận |
|---|---|---|
| Build backend và hai fixture Release với --no-restore | Đạt, không có lỗi biên dịch | Backend chính và chương trình kiểm thử biên dịch được. Fixture UI có cảnh báo NU1900 như ghi bên dưới. |
| npm run build / npm run lint | Đạt | Frontend đóng gói production và lint thành công. |
| npm test trong frontend | **98/98 đạt**, không bỏ qua | Unit test hiện có, gồm phân quyền hồ sơ Trưởng khoa, chỉ số sinh tồn và điều hướng thông báo. |
| Week2Verification --core-workflow | **100 kiểm tra đạt** | Hồ sơ Doctor/Admin/Patient, Trưởng khoa sửa đúng hồ sơ của mình, lịch/giờ trống, sổ và kiểm tra Paid ở API đổi trạng thái. |
| Week2Verification --migrations-only | **27 kiểm tra đạt** | Database mới, dữ liệu cũ, nâng/hạ cấp migration, Voided/Replaced, người cấp sổ, cấu trúc đã có từ nhánh khác và vai trò có ID tùy chỉnh. |
| Week2Verification --medical-record-vitals | **118 kiểm tra đạt** | Lưu/đọc/xóa chỉ số, kiểm tra dữ liệu, quyền, xung đột và xác nhận sổ cho cả bệnh nhân web lẫn trực tiếp. |
| Week2Verification --hoang | **74 kiểm tra đạt** | Hủy lịch của mình, quyền/phạm vi người dùng, tiếp nhận, yêu cầu/cấp lại sổ và lịch sử. |
| UiRefreshVerification/smoke.mjs --admin-completion --remaining-roles | **47 kiểm tra đạt**, đủ **45 migration** | API Admin/tài khoản/đánh giá, vai trò Cashier, kết quả xét nghiệm, thông báo/SignalR, đồng thời và rollback. Database tạm đã được xóa. |
| tests/ui-regressions.mjs trên bản production | Đạt, UI_REGRESSIONS_SUCCESS | Route công khai, tìm bác sĩ, tạo hồ sơ, chi tiết xét nghiệm, đặt lịch, lịch sử trình duyệt và bố cục 320–1440 px; API được giả lập. |
| Week2Verification --d9 | **131 kiểm tra đường hiện có đạt, còn 4 khoảng trống tích hợp** | Hành trình web/trực tiếp, sổ, khám/kê đơn/cấp thuốc theo FEFO và bảo vệ lịch sử; chưa đạt nghiệm thu D9 đầy đủ. |
| tests/c8c9-ui.mjs | **266 kiểm tra API và 9 kịch bản trình duyệt đạt** | Tranh chấp đặt/đổi lịch, thu tiền sổ đồng thời, tiếp nhận, yêu cầu sổ, Paid, phát sổ, check-in, cho tạo yêu cầu cấp lại sau yêu cầu Issued, tải lại giờ trống và khôi phục kết nối SignalR. |

Để chạy lại kiểm tra database, build `tests/Week2Verification` và `tests/UiRefreshVerification` ở cấu hình Release, rồi dùng `dotnet run --no-build --no-restore -c Release --project tests/Week2Verification -- <tham-số>` với tham số ở bảng. Runner C8/C9 mặc định trỏ tới output Release; có thể đặt `CLINIC_TEST_ASSEMBLY` để chọn output khác. Các runner trình duyệt dùng Edge headless; đặt `PLAYWRIGHT_MODULE` nếu Playwright cài ngoài repository.

Build ban đầu trong sandbox gặp spawn EPERM của Node/Vite; đã chạy lại các lệnh cần tiến trình con với quyền thực thi phù hợp. NU1900 ở fixture UI là cảnh báo không truy cập được dữ liệu kiểm tra lỗ hổng NuGet, không phải lỗi biên dịch. Không coi build/lint/unit test là bằng chứng nghiệm thu toàn bộ 71 chức năng; các chức năng ngoài phạm vi runner được kết luận theo mã nguồn và ghi rõ hạn chế trong từng dòng.

## Thứ tự hoàn thiện đề xuất

1. Nối hóa đơn theo lượt và hàng chờ Book/Medicine/Final; ghi nhận từng lần thanh toán và số dư.
2. Gắn xét nghiệm với hồ sơ/lượt khám, hỗ trợ bệnh nhân trực tiếp và bảo vệ điều kiện Paid ở mọi API thực hiện xét nghiệm.
3. Hoàn tất đối soát/hoàn tiền của đơn thiếu thuốc; bổ sung toàn bộ hóa đơn/lịch sử thu cho bệnh nhân.
4. Hoàn thiện màn hình nhân sự, sửa hồ sơ bệnh nhân tại tiếp nhận, danh mục chuyên khoa công khai, cấu hình phòng khám và báo cáo theo kỳ.

[home]: ../frontend/clinic-management-client/src/pages/patient/HomePage.jsx
[navbar]: ../frontend/clinic-management-client/src/layouts/patient/Navbar.jsx
[routes]: ../frontend/clinic-management-client/src/routes/AppRoutes.jsx
[doctor-search]: ../frontend/clinic-management-client/src/pages/patient/DoctorSearchPage.jsx
[doctor]: ../backend/ClinicManagement/Services/Implementations/DoctorService.cs
[schedule-api]: ../backend/ClinicManagement/Controllers/DoctorSchedulesController.cs
[doctor-card]: ../frontend/clinic-management-client/src/components/patient/PublicDoctorCard.jsx
[auth]: ../backend/ClinicManagement/Services/Implementations/AuthService.cs
[auth-api]: ../backend/ClinicManagement/Controllers/AuthController.cs
[auth-register]: ../backend/ClinicManagement/Services/Implementations/AuthService.cs
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
[lab-submit]: ../backend/ClinicManagement/Services/Implementations/LabTestService.cs
[role-access]: ../frontend/clinic-management-client/src/routes/roleAccess.js
[users-api]: ../backend/ClinicManagement/Controllers/UsersController.cs
[users]: ../backend/ClinicManagement/Services/Implementations/UserService.cs
[rbac]: ../backend/ClinicManagement/Services/Implementations/RbacService.cs
[catalog]: ../backend/ClinicManagement/Services/Implementations/CatalogServices.cs
[catalog-page]: ../frontend/clinic-management-client/src/pages/internal/CatalogManagementPage.jsx
[doctor-api]: ../backend/ClinicManagement/Controllers/DoctorsController.cs
[users-edit]: ../frontend/clinic-management-client/src/pages/internal/admin/UsersPage.jsx
[medicine]: ../backend/ClinicManagement/Services/Implementations/MedicineService.cs
[supplier]: ../backend/ClinicManagement/Services/Implementations/SupplierService.cs
[lab-types]: ../backend/ClinicManagement/Services/Implementations/LabTestTypeService.cs
[lab-types-page]: ../frontend/clinic-management-client/src/pages/internal/LabTestTypesPage.jsx
[purchase]: ../backend/ClinicManagement/Services/Implementations/PurchaseOrderService.cs
[purchase-page]: ../frontend/clinic-management-client/src/pages/internal/admin/PurchaseOrdersPage.jsx
[inventory]: ../backend/ClinicManagement/Services/Implementations/InventoryService.cs
[inventory-page]: ../frontend/clinic-management-client/src/pages/internal/admin/InventoryPage.jsx
[invoice-queue]: ../backend/ClinicManagement/Services/Implementations/InvoiceService.cs
[reception-ui]: ../frontend/clinic-management-client/src/components/internal/ReceptionCheckInDialog.jsx
[reception-book-ui]: ../frontend/clinic-management-client/src/components/internal/ReceptionCheckInDialog.jsx
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
[book-issue]: ../backend/ClinicManagement/Services/Implementations/ReceptionService.cs
[book-entity]: ../backend/ClinicManagement/Data/Entities/PatientBook.cs
[book-status]: ../backend/ClinicManagement/Services/Implementations/PatientBookService.cs
[invoice-api]: ../backend/ClinicManagement/Controllers/InvoicesController.cs
[role-seed]: ../backend/ClinicManagement/Data/ApplicationDbContext.cs
[invoice]: ../backend/ClinicManagement/Services/Implementations/InvoiceService.cs
[cashier-page]: ../frontend/clinic-management-client/src/pages/internal/CashierBillingPage.jsx
[cashier-stages]: ../frontend/clinic-management-client/src/pages/internal/CashierBillingPage.jsx
[dispensing-repository]: ../backend/ClinicManagement/Repositories/Implementations/DispensingRepository.cs
[invoice-create]: ../backend/ClinicManagement/Services/Implementations/InvoiceService.cs
[invoice-paid]: ../backend/ClinicManagement/Services/Implementations/InvoiceService.cs
[invoice-adjust]: ../backend/ClinicManagement/Services/Implementations/InvoiceService.cs
[invoice-map]: ../backend/ClinicManagement/Services/Implementations/InvoiceService.cs
[stock-review]: ../backend/ClinicManagement/Services/Implementations/PrescriptionService.StockReviews.cs
[dispensing]: ../backend/ClinicManagement/Services/Implementations/DispensingService.cs
[dispensing-page]: ../frontend/clinic-management-client/src/pages/internal/pharmacist/DispensingPage.jsx
[dispensing-allocation]: ../backend/ClinicManagement/Services/Implementations/DispensingService.cs
[dispensing-confirm]: ../backend/ClinicManagement/Services/Implementations/DispensingService.cs
[dispensing-review]: ../backend/ClinicManagement/Services/Implementations/DispensingService.cs
[lab-api]: ../backend/ClinicManagement/Controllers/LabTestsController.cs
[lab-pending]: ../backend/ClinicManagement/Services/Implementations/LabTestService.cs
[technician-page]: ../frontend/clinic-management-client/src/pages/internal/technician/TechnicianLabQueuePage.jsx

[progress-source]: <Nhóm16 Tiến độ (2).xlsx>

[public-pages]: ../frontend/clinic-management-client/src/pages/patient/PublicClinicPages.jsx
[public-api]: ../backend/ClinicManagement/Controllers/PublicClinicController.cs
[public-doctor]: ../frontend/clinic-management-client/src/pages/patient/PublicDoctorDetailPage.jsx
[public-content]: ../frontend/clinic-management-client/src/data/publicContent.js
[users-page]: ../frontend/clinic-management-client/src/pages/internal/admin/UsersPage.jsx
[doctor-ratings]: ../frontend/clinic-management-client/src/components/internal/reviews/DoctorRatingsTable.jsx
[vitals-form]: ../frontend/clinic-management-client/src/components/internal/examinations/MedicalRecordFormSections.jsx
[book-requests]: ../backend/ClinicManagement/Services/Implementations/ReceptionService.BookRequests.cs
[cashier-migration]: ../backend/ClinicManagement/Migrations/20261109100000_CompleteCashierRole.cs
[notification-navigation]: ../frontend/clinic-management-client/src/utils/notificationNavigation.js
[catalog-api]: ../backend/ClinicManagement/Controllers/CatalogControllers.cs
