# Báo cáo đối chiếu chức năng theo danh sách đăng ký

Ngày cập nhật: **20/11/2026**. Mã nguồn nền sau merge: HEAD **ea3dcde**, kèm các bản sửa trong lần rà soát này trên nhánh **fix/post-merge-audit-2026-11-20**. Giữ tên file có ngày 04/11 để các liên kết hiện có không bị hỏng.

Nguồn yêu cầu: [BB_DoAn_ChucNangtheoDSDK (2).docx](<BB_DoAn_ChucNangtheoDSDK (2).docx>). Đã đọc trực tiếp nội dung DOCX và đối chiếu đủ **71 mục**, giữ nguyên nhóm và thứ tự I.1–IX.5.

**Kết quả hiện tại là 71/71 mục đã có triển khai chính.** Bốn mục hoàn thiện trong đợt này gồm hóa đơn bệnh nhân (**II.8**), báo cáo theo kỳ (**III.12**), điều chỉnh và hoàn tiền (**VII.8**) và đối soát khi thiếu thuốc (**VIII.6**).

Đây là đối chiếu triển khai frontend/API/service/entity/migration, có bổ sung kiểm thử trên database SQL Server LocalDB tạm và trình duyệt. “Đã có” không có nghĩa đã nghiệm thu đầy đủ trên database đang vận hành. Không thay đổi database ứng dụng trong lần rà soát này.

## Cách phân loại

- **Đã có:** có triển khai chính và đường sử dụng tương ứng với yêu cầu, trong điều kiện dữ liệu/quyền được cấu hình đúng.
- **Một phần:** đã có xử lý nhưng thiếu giao diện, điều kiện nghiệp vụ hoặc liên kết cần thiết được nêu rõ trong tài liệu.
- **Chưa có:** chưa có luồng thực tế đáp ứng mục đó; tên quyền, dữ liệu mẫu hoặc API tạo dữ liệu tùy ý chưa đủ.

Mỗi mục tài liệu được tính một lần. Đánh giá V.5 theo bốn chỉ số sinh tồn đã triển khai gồm nhiệt độ, huyết áp, cân nặng và chiều cao. IV.7 và V.6 đã có liên kết lượt khám, hồ sơ bệnh án và hồ sơ bệnh nhân trực tiếp.

## Tổng hợp theo nhóm

| Nhóm | Tổng mục | Đã có | Một phần | Chưa có |
|---|---:|---:|---:|---:|
| I. Khách chưa đăng nhập | 4 | 4 | 0 | 0 |
| II. Bệnh nhân | 10 | 10 | 0 | 0 |
| III. Quản trị viên | 12 | 12 | 0 | 0 |
| IV. Trưởng khoa | 7 | 7 | 0 | 0 |
| V. Bác sĩ | 9 | 9 | 0 | 0 |
| VI. Nhân viên lễ tân | 10 | 10 | 0 | 0 |
| VII. Thu ngân | 8 | 8 | 0 | 0 |
| VIII. Dược sĩ | 6 | 6 | 0 | 0 |
| IX. Kỹ thuật viên xét nghiệm | 5 | 5 | 0 | 0 |
| **Tổng** | **71** | **71** | **0** | **0** |

## Nguồn phân công

Cột người phụ trách lấy **trực tiếp từ DOCX yêu cầu**, không suy ra từ tác giả commit hay người sửa lỗi. Tên viết tắt: Nhuận — Nguyễn Văn Nhuận; Phú — Dương Thạch Phú; Hoàng — Vũ Hoàng; Nguyên — Võ Ngọc Nguyên; Thoại — Trần Đình Minh Thoại.

Bản cũ dùng [bảng tiến độ][progress-source] để suy ra người phụ trách theo module. Khi có khác biệt, bảng hiện tại ưu tiên DOCX: **II.2 và III.9 là Nhuận; V.5 là Thoại, Nguyên; VI.8 là Phú; IX.5 là Thoại**. Những mục **II.7, II.8, VII.4, IX.1** không ghi tên trong DOCX được giữ là “Chưa ghi tên”; đây là khoảng trống phân công, khác với thiếu triển khai. VII.4 đã có triển khai; nhóm vẫn cần thống nhất người phụ trách trong tài liệu yêu cầu.

## Đối chiếu từng chức năng

### I Khách chưa đăng nhập

| Mã | Chức năng theo tài liệu | Phụ trách trong tài liệu | Trạng thái | Đã có và phần còn thiếu |
|---|---|---|---|---|
| I.1 | Xem thông tin công khai | Nhuận | **Đã có** | Có trang chủ, giới thiệu, dịch vụ, bảng giá, hướng dẫn, liên hệ và thông tin phòng khám đọc trực tiếp từ cấu hình quản trị. Đã mở công khai GET /api/specializations/public, GET /api/departments/public, bổ sung danh sách Specializations trực thuộc trong GET /api/appointments/departments và hiển thị đầy đủ cả Khoa lẫn Chuyên khoa theo quan hệ khoa–chuyên khoa tại trang chủ, /specialties và /specialties/{departmentId}. [Trang công khai][public-pages], [API danh mục][catalog-api], [API công khai][public-api]. |
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
| II.8 | Xem hóa đơn và thanh toán đã ghi nhận | Chưa ghi tên | **Đã có** | Menu bệnh nhân có trang Hóa đơn của tôi. Danh sách có phân trang và hiển thị tiền sổ, khám, xét nghiệm, thuốc, chứng từ điều chỉnh, từng lần thu/hoàn và số còn phải trả. API kiểm tra tài khoản sở hữu lượt khám hoặc hồ sơ. Hóa đơn sổ cũ xuất hiện một lần, kèm ngày và số đã thu nếu dữ liệu cũ có ghi nhận. [Trang hóa đơn][patient-invoices-page], [API bệnh nhân][patient-invoices-api]. |
| II.9 | Đánh giá bác sĩ | Nhuận | **Đã có** | Chỉ Patient sở hữu lịch Completed được đánh giá; kiểm tra trùng theo AppointmentId và xử lý xung đột khi ghi. [ReviewService][review], [Trang đánh giá][patient-reviews]. |
| II.10 | Nhận thông báo | Nhuận | **Đã có** | Thay đổi lịch đã lưu Notifications và phát SignalR. Hoàn tất xét nghiệm lưu thông báo cho đúng bệnh nhân/bác sĩ, phát LabResultChanged để tải lại danh sách/chi tiết; có xem lịch sử, mở kết quả và đánh dấu đã đọc. Kiểm tra API/SignalR xác minh phạm vi người nhận và rollback khi lưu thông báo lỗi. [NotificationService][notifications], [API thông báo][notification-api], [Lưu kết quả][lab-submit]. |

### III Quản trị viên

| Mã | Chức năng theo tài liệu | Phụ trách trong tài liệu | Trạng thái | Đã có và phần còn thiếu |
|---|---|---|---|---|
| III.1 | Truy cập trang quản trị | Nhuận | **Đã có** | Có đăng nhập nội bộ, menu và route theo Admin, bảo vệ API theo vai trò hoặc quyền. [Routes][routes], [Quyền giao diện][role-access]. |
| III.2 | Quản lý tài khoản và vai trò | Nhuận | **Đã có** | Có tìm/lọc/phân trang, khóa/mở khóa, gán vai trò và quản lý quyền. Đã bổ sung tạo tài khoản nhân viên, lưu sửa họ tên/email/điện thoại qua API riêng, thống kê thật và liên kết hồ sơ bác sĩ. [UsersController][users-api], [UserService][users], [Trang tài khoản][users-page]. |
| III.3 | Quản lý tổ chức phòng khám | Phú | **Đã có** | Có thêm, sửa, tra cứu, trạng thái hoạt động cho khoa, chuyên khoa, phòng; thông tin loại phòng và vị trí. [CatalogServices][catalog], [Trang danh mục][catalog-page]. |
| III.4 | Quản lý hồ sơ nhân sự | Phú | **Đã có** | Đã có màn hình /internal/doctors-management và /internal/staff-management, API thêm/sửa/tra cứu/trạng thái hồ sơ Doctor và Staff; liên kết tài khoản, khoa, chuyên khoa hoặc vị trí công việc. Có bảng, migration và danh mục JobPositions. Kiểm tra core xác minh lưu hồ sơ và liên kết tài khoản đúng quyền. [Quản lý bác sĩ][doctor-management-page], [Quản lý nhân viên][staff-page], [StaffService][staff-service], [StaffController][staff-api]. |
| III.5 | Quản lý danh mục thuốc | Phú, Nguyên | **Đã có** | Có quản lý thuốc, nhóm thuốc, nhà cung cấp, đơn vị và giá. [MedicineService][medicine], [SupplierService][supplier], [Routes][routes]. |
| III.6 | Quản lý loại xét nghiệm | Thoại | **Đã có** | Có thêm, sửa, tra cứu loại xét nghiệm, mô tả, giá và trạng thái. [LabTestTypeService][lab-types], [Trang loại xét nghiệm][lab-types-page]. |
| III.7 | Quản lý nhập kho thuốc | Nguyên | **Đã có** | Phiếu nhập nhiều dòng thuốc/lô; số lượng, giá nhập, số lô, hạn dùng; nhận hàng cập nhật tồn trong giao dịch, kiểm tra phiếu đã nhận và lô hết hạn. [PurchaseOrderService][purchase], [Trang phiếu nhập][purchase-page]. |
| III.8 | Theo dõi tồn kho | Nguyên | **Đã có** | Có tra cứu theo thuốc/lô và phân loại còn hàng, ít hàng, hết hàng, gần hết hạn, hết hạn. [InventoryService][inventory], [Trang tồn kho][inventory-page]. |
| III.9 | Cấu hình phòng khám | Nhuận | **Đã có** | Đã bổ sung bảng/migration ClinicSettings, API GET/PUT /api/clinic-settings (chỉ Admin, lưu vết RbacAudits), GET /api/public/clinic-settings và trang /internal/settings quản trị thông tin phòng khám, cơ sở, giờ làm việc, giá khám mặc định, giá sổ khám và tham số vận hành (thời lượng khung giờ, số bệnh nhân tối đa/khung giờ, ngưỡng tồn thấp và ngày cận hạn). Phí khám tại InvoiceService, phí sổ mặc định tại ReceptionService, duyệt ca khám và cảnh báo kho đọc trực tiếp từ cấu hình. [ClinicSettingsService][clinic-settings-service], [ClinicSettingsController][clinic-settings-api], [Trang cấu hình][clinic-settings-page]. |
| III.10 | Duyệt lịch của Trưởng khoa | Nhuận | **Đã có** | Có Admin duyệt/từ chối yêu cầu lịch của Trưởng khoa, kiểm tra trùng bác sĩ/phòng/thời gian, bắt buộc lý do từ chối và chặn tự duyệt. [ScheduleReviewService][schedule-review], [Trang duyệt lịch][schedule-review-page]. |
| III.11 | Quản lý đánh giá | Nhuận | **Đã có** | Có quản lý ẩn/hiện và API /api/reviews/admin/statistics: số lượng, điểm trung bình tất cả/công khai theo bác sĩ; lọc và phân trang độc lập. Không có đánh giá trả null. [ReviewService][review], [Trang đánh giá][review-admin], [Bảng điểm][doctor-ratings]. |
| III.12 | Xem báo cáo toàn phòng khám | Thoại | **Đã có** | Dashboard Admin hiển thị tồn kho hiện tại và cho chọn kỳ doanh thu, lượt khám từ 1 đến 366 ngày. Có tổng hợp và chi tiết theo ngày, trạng thái kỳ rỗng và thông báo lỗi khi tải. Thực thu tính theo ngày thu và ngày hoàn tiền theo giờ phòng khám. Phần BHYT lấy ngày ghi chứng từ. [API Dashboard][dashboard-api], [Báo cáo theo kỳ][admin-period-report]. |

### IV Trưởng khoa

| Mã | Chức năng theo tài liệu | Phụ trách trong tài liệu | Trạng thái | Đã có và phần còn thiếu |
|---|---|---|---|---|
| IV.1 | Truy cập cổng nội bộ theo khoa | Nhuận | **Đã có** | Có DepartmentHead, route theo vai trò và xác định khoa qua hồ sơ Doctor đang hoạt động. [Quyền giao diện][role-access], [DepartmentScope][department-scope]. |
| IV.2 | Xử lý yêu cầu đăng ký ca | Nhuận | **Đã có** | Duyệt/từ chối trong khoa, bắt buộc lý do từ chối, chặn duyệt khác khoa, tự duyệt và duyệt lịch của Trưởng khoa khác. [ScheduleReviewService][schedule-review]. |
| IV.3 | Kiểm tra lịch trước khi duyệt | Phú | **Đã có** | Kiểm tra trùng bác sĩ, thời gian, phòng; chỉ yêu cầu Pending được xử lý và chỉ ca Approved được đưa ra đặt khám. Hiện chưa có API sửa/xóa ca đã duyệt, nên không có đường sửa ca đang gắn lịch hẹn qua các API này. [Duyệt lịch][schedule-review], [DoctorRepository][doctor-repository], [API lịch][schedule-api]. |
| IV.4 | Đăng ký lịch của bản thân | Nhuận | **Đã có** | DepartmentHead dùng chung luồng gửi/theo dõi yêu cầu ca; thông báo yêu cầu của Trưởng khoa chuyển Admin và khoa không được tự duyệt. [DoctorScheduleService][schedule], [Người nhận yêu cầu lịch][notifications]. |
| IV.5 | Xem lịch trực trong khoa | Nhuận | **Đã có** | Có lịch ngày/tuần, lọc bác sĩ/phòng trong khoa và chỉ hiển thị ca đã duyệt. [DepartmentScheduleService][department-schedule], [Trang lịch khoa][department-schedule-page]. |
| IV.6 | Xem thống kê khoa | Nhuận | **Đã có** | Có lượt khám, số yêu cầu chờ/đã duyệt theo khoảng ngày, giới hạn khoa được phân công và kiểm tra tham số ngày. [DepartmentStatisticsService][department-statistics], [Trang thống kê khoa][department-statistics-page]. |
| IV.7 | Thực hiện nghiệp vụ bác sĩ | Cả nhóm | **Đã có** | Trưởng khoa dùng các chức năng bác sĩ: hồ sơ chuyên môn, khám, chỉ số sinh tồn, kê đơn, ghi sổ, chỉ định và xem kết quả xét nghiệm. Xét nghiệm đã lưu AppointmentId/MedicalRecordId/PatientProfileId; giới hạn chỉ định theo DoctorId hồ sơ được phân công. Bệnh nhân trực tiếp không cần tạo tài khoản. [DoctorsController][doctor-api], [MedicalRecordService][record], [LabTestService][lab]. |

### V Bác sĩ

| Mã | Chức năng theo tài liệu | Phụ trách trong tài liệu | Trạng thái | Đã có và phần còn thiếu |
|---|---|---|---|---|
| V.1 | Truy cập và xem hồ sơ cá nhân | Phú | **Đã có** | Có đăng nhập nội bộ, xem/sửa thông tin bác sĩ gồm họ tên, học vị, kinh nghiệm, giới thiệu; khoa và chuyên khoa chỉ đọc. [DoctorService][doctor], [Trang hồ sơ bác sĩ][doctor-profile]. |
| V.2 | Đăng ký ca khám | Phú | **Đã có** | Có ngày, giờ bắt đầu/kết thúc, phòng; theo dõi Pending/Approved/Rejected và lý do. Kiểm tra phòng thuộc khoa và xung đột. [DoctorScheduleService][schedule], [Trang đăng ký ca][schedule-request-page]. |
| V.3 | Xem lịch và danh sách chờ khám | Phú | **Đã có** | Có yêu cầu/lịch làm việc của mình, lịch hẹn và hàng đợi bệnh nhân đã check-in, bắt đầu khám. [Trang ca làm][schedule-request-page], [Danh sách khám][doctor-queue], [MedicalRecordService][record]. |
| V.4 | Tra cứu lịch sử bệnh nhân | Nguyên | **Đã có** | Có lịch sử khám, chẩn đoán, đơn thuốc; xác minh lượt hiện tại thuộc bác sĩ và đã check-in/xác minh sổ trước khi tra cứu. [MedicalHistoryService][history], [Trang lịch sử bệnh nhân][doctor-history]. |
| V.5 | Khám và lập hồ sơ bệnh án | Thoại, Nguyên | **Đã có** | Có bắt đầu khám, triệu chứng, chẩn đoán, ghi chú, kết luận và 4 chỉ số: nhiệt độ, huyết áp, cân nặng, chiều cao. Dữ liệu đi xuyên entity/DTO/migration/form/lịch sử; thay đổi chỉ số làm mất xác nhận ghi sổ cũ. 118 kiểm tra API chỉ số sinh tồn đã đạt. Tài liệu không quy định danh sách chỉ số bắt buộc; chưa coi mạch/SpO2 là yêu cầu đã đăng ký riêng. [MedicalRecordService][record], [MedicalRecord][record-entity], [Chỉ số sinh tồn][vitals-form]. |
| V.6 | Chỉ định xét nghiệm | Thoại | **Đã có** | Có chọn loại xét nghiệm, gắn mã lượt khám/hồ sơ bệnh án, theo dõi Pending/InProgress/Completed và xem kết quả. API hỗ trợ hồ sơ bệnh nhân trực tiếp, kiểm tra bác sĩ được phân công và lưu riêng PatientProfileId để tránh nhầm với UserId. Đã sửa truy vấn ngày gây 500 và kiểm tra khác bác sĩ/trùng mã hồ sơ với tài khoản. Giao diện hiện nhập mã lượt/hồ sơ thủ công. [LabTestService][lab], [LabTest][lab-entity], [Trang chỉ định][lab-orders-page], [Hồi quy sau merge][post-merge-checks]. |
| V.7 | Kê đơn thuốc | Nguyên | **Đã có** | Có thuốc, số lượng, liều, hướng dẫn, cảnh báo tồn; chưa trừ kho lúc kê đơn. Có quản lý phiên bản, chặn sửa đơn đã cấp và chặn đổi thuốc/số lượng khi đã có hóa đơn. [PrescriptionService][prescription], [Trang kê đơn][prescription-page]. |
| V.8 | Đối chiếu và ghi sổ khám | Nguyên | **Đã có** | Có xác nhận ghi sổ; bắt buộc có sổ và xác nhận trước khi hoàn thành, cùng chẩn đoán và kết luận. Sửa nội dung/đơn thuốc làm mất xác nhận cũ để cần đối chiếu lại. [MedicalRecordService][record], [PrescriptionService][prescription], [Trang hồ sơ khám][record-page]. |
| V.9 | Nhận thông báo thời gian thực | Nhuận | **Đã có** | Có thông báo check-in và kết quả xét nghiệm cho bác sĩ đặt chỉ định, gồm Trưởng khoa khi thực hiện nghiệp vụ bác sĩ; lưu lịch sử và tự cập nhật dữ liệu qua SignalR. API/SignalR đã kiểm tra không phát cho bác sĩ không liên quan. [ReceptionService][reception], [NotificationService][notifications], [Lưu kết quả][lab-submit]. |

### VI Nhân viên lễ tân

| Mã | Chức năng theo tài liệu | Phụ trách trong tài liệu | Trạng thái | Đã có và phần còn thiếu |
|---|---|---|---|---|
| VI.1 | Truy cập cổng tiếp nhận | Nhuận | **Đã có** | Có vai trò, menu tiếp nhận, route và quyền xử lý lịch/sổ/check-in. [Quyền giao diện][role-access], [Danh mục quyền][permissions]. |
| VI.2 | Tiếp nhận và quản lý hồ sơ bệnh nhân | Phú | **Đã có** | Có tra cứu, đối chiếu, tạo và liên kết hồ sơ khi tiếp nhận. Hộp thoại check-in đã có tải/sửa/lưu họ tên, điện thoại, ngày sinh, giấy tờ và BHYT qua GET/PUT /api/patients/{patientId}; kiểm tra trùng giấy tờ ở server. Đã sửa JSX bị mất sau merge để form và luồng liên kết hồ sơ hoạt động. [ReceptionPatientsController][reception-api], [Hộp thoại tiếp nhận][reception-ui], [Kiểm tra core][core-checks]. |
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
| VII.2 | Lập hóa đơn tiền sổ | Thoại | **Đã có** | Quầy Thu ngân có hàng chờ Book từ PatientBookRequest/BookInvoice, lập hóa đơn riêng và thu tiền. Thanh toán đủ đồng bộ BookInvoice, thông báo Lễ tân và cho phát sổ; chưa thu/thu một phần vẫn chặn. Giá mặc định đọc cấu hình. Đã chống lập trùng cùng khoản phí qua hai tên nguồn BookRequest và Book. [InvoiceService][invoice], [Trang thu ngân][cashier-page], [Hồi quy][post-merge-checks]. |
| VII.3 | Lập hóa đơn khám và xét nghiệm | Thoại | **Đã có** | Hàng chờ LabAndConsultation ghép xét nghiệm theo AppointmentId đã lưu và phí khám chưa lập hóa đơn của đúng lượt, không suy đoán sang lịch gần nhất. Server kiểm tra nguồn phí/lượt/bệnh nhân và giá danh mục. Kỹ thuật viên chỉ nhận, bắt đầu hoặc nộp kết quả khi hóa đơn Standard tương ứng Paid. [Hàng chờ hóa đơn][invoice-queue], [LabTestService][lab], [Hành trình D9][journey-checks]. |
| VII.4 | Lập hóa đơn thuốc hoặc cuối lượt | Chưa ghi tên | **Đã có** | Đã có hàng chờ và thao tác Medicine/Final. Medicine lấy các dòng đơn Issued chưa lập hóa đơn; Final lấy lượt Completed và phần phí chưa lập hóa đơn, gồm khám và thuốc nếu có. Không đưa lịch chưa khám vào hàng chờ cuối lượt. Hành trình D9 kiểm tra thu Medicine cho lượt có xét nghiệm và Final cho lượt trực tiếp không xét nghiệm, sau đó cấp thuốc. [InvoiceService][invoice], [Trang thu ngân][cashier-page], [Hành trình D9][journey-checks]. |
| VII.5 | Tính và đối chiếu chi phí | Thoại | **Đã có** | Server dựng lại giá/số lượng từ lượt khám, danh mục xét nghiệm, đơn thuốc và sổ; kiểm tra trùng nguồn phí cả trong một yêu cầu lẫn hóa đơn đã có, kiểm tra đúng lượt/bệnh nhân/giai đoạn. Áp dụng tỷ lệ BHYT mô phỏng và tính tiền bệnh nhân. Kiểm thử sửa giá/số lượng phía client, sai lượt, trùng dòng và hai tên nguồn sổ đều bị ngăn. [Tạo hóa đơn][invoice-create], [Hồi quy][post-merge-checks]. |
| VII.6 | Ghi nhận thanh toán | Thoại | **Đã có** | Lập hóa đơn với số thu ban đầu 0, một phần hoặc đủ; POST /api/invoices/{id}/payments ghi các lần thu tiếp, phương thức, mã đối chiếu, ghi chú, số phiếu, Thu ngân và thời điểm. Tính PaidAmount/RemainingAmount, chuyển Unpaid/PartiallyPaid/Paid, chặn thu vượt hoặc thu lại hóa đơn đủ tiền và kiểm tra riêng quyền thu tiền. Migration bổ sung sửa các cột thanh toán bị thiếu sau merge. [InvoiceService][invoice], [InvoicePayment][payment-entity], [Migration sửa thanh toán][payment-repair], [Hồi quy][post-merge-checks]. |
| VII.7 | Tra cứu hóa đơn và phiếu thu | Thoại | **Đã có** | Có lịch sử, tìm theo mã bệnh nhân/lượt/hóa đơn/phiếu thu, chi tiết khoản mục, các lần thanh toán và mã chứng từ. Có in toàn bộ hóa đơn hoặc từng phiếu thu/hoàn tiền. Đã escape nội dung động khi tạo HTML in để tên bệnh nhân/dịch vụ/ghi chú không được thực thi như mã. [Trang thu ngân][cashier-page], [InvoiceService][invoice], [Escape phiếu thu][receipt-html], [Kiểm thử HTML][receipt-tests]. |
| VII.8 | Điều chỉnh và hoàn tiền | Thoại | **Đã có** | Thu ngân xem trước số dư, giảm hoặc hủy toàn bộ phí và xác nhận số phải hoàn. Khoản giảm trừ vào số chưa thu trước. Phần vượt quá nghĩa vụ mới mới lập phiếu hoàn. Phí tăng hoặc số còn thiếu được thu qua hóa đơn gốc. Chứng từ lưu lý do, liên kết, người lập và giữ nguyên các phiếu thu trước. Nếu số dư thay đổi sau khi xem trước, thu ngân phải kiểm tra lại. [Chứng từ điều chỉnh][invoice-adjustments], [Trang thu ngân][cashier-page], [Hồi quy][post-merge-checks]. |

### VIII Dược sĩ

| Mã | Chức năng theo tài liệu | Phụ trách trong tài liệu | Trạng thái | Đã có và phần còn thiếu |
|---|---|---|---|---|
| VIII.1 | Truy cập quầy thuốc | Nguyên | **Đã có** | Có vai trò Pharmacist, menu/route cấp thuốc, bảo vệ bằng quyền pharmacy.dispense. [Quyền giao diện][role-access], [Routes][routes]. |
| VIII.2 | Tiếp nhận đơn thuốc | Nguyên | **Đã có** | Có danh sách, tìm kiếm, bộ lọc, chi tiết bệnh nhân/thuốc/liều/hướng dẫn và tình trạng hóa đơn tương ứng. [DispensingService][dispensing], [Trang cấp thuốc][dispensing-page]. |
| VIII.3 | Kiểm tra và chọn lô thuốc | Nguyên | **Đã có** | Tự phân bổ theo lô còn hạn, còn tồn, ưu tiên hạn dùng sớm; một dòng đơn có thể dùng nhiều lô. [Phân bổ lô][dispensing-allocation]. |
| VIII.4 | Xác nhận giao thuốc | Nguyên | **Đã có** | Chỉ bàn giao khi hóa đơn Medicine/Final tương ứng đã thanh toán đủ, đúng lượt/bệnh nhân/nguồn đơn thuốc, cùng điều kiện sổ và tồn kho. Với đơn điều chỉnh sau thu, phải có chứng từ đã đối soát, bác sĩ áp dụng phương án, cập nhật sổ và dược sĩ kiểm lại tồn. [Xác nhận cấp][dispensing-confirm], [Đối chiếu hóa đơn][dispensing-repository], [Kiểm tra cấp thuốc][dispensing-checks]. |
| VIII.5 | Ghi nhận cấp thuốc và xuất kho | Nguyên | **Đã có** | Lưu lô/số lượng, người cấp/thời điểm; trừ tồn và đổi trạng thái Dispensed trong giao dịch. Chặn cấp lặp, thiếu tồn, lô hết hạn và xử lý xung đột. [Xác nhận cấp][dispensing-confirm], [Phân bổ lô][dispensing-allocation]. |
| VIII.6 | Xử lý thiếu thuốc | Nguyên | **Đã có** | Khi thiếu thuốc, dược sĩ dừng giao toàn đơn và gửi rà soát. Với hóa đơn đã lập, quầy Thu ngân mở phương án từ hóa đơn gốc và xem chênh lệch do hệ thống tính. Nếu còn thiếu, các lần thu tiếp ghi vào hóa đơn gốc. Nếu đã trả vượt giá mới, ghi phiếu hoàn phần vượt. Sau khi đối soát đủ, bác sĩ nhận thông báo và áp dụng phương án. Dược sĩ kiểm lại tồn và sổ trước khi giao. [Rà soát đơn][stock-review], [Chứng từ][invoice-adjustments], [Hồi quy][post-merge-checks], [Cấp thuốc][dispensing-checks]. |

### IX Kỹ thuật viên xét nghiệm

| Mã | Chức năng theo tài liệu | Phụ trách trong tài liệu | Trạng thái | Đã có và phần còn thiếu |
|---|---|---|---|---|
| IX.1 | Truy cập cổng xét nghiệm | Chưa ghi tên | **Đã có** | Có LabTechnician, route hàng chờ và quyền xem/nhập kết quả. [Routes][routes], [API xét nghiệm][lab-api]. |
| IX.2 | Tiếp nhận chỉ định | Thoại | **Đã có** | Hàng chờ chỉ lấy Pending/InProgress có nguồn LabTest trong hóa đơn Standard Paid; có bệnh nhân, điện thoại, lượt khám và trạng thái thanh toán. Ca đã bắt đầu vẫn xuất hiện sau tải lại. Dữ liệu bệnh nhân trực tiếp được lấy theo PatientProfileId riêng, không dò lẫn UserId. [Hàng chờ xét nghiệm][lab-pending], [Giao diện kỹ thuật viên][technician-page], [Hồi quy][post-merge-checks]. |
| IX.3 | Thực hiện xét nghiệm | Thoại | **Đã có** | Có thao tác tiếp nhận/bắt đầu, trạng thái InProgress, ReceivedByTechnicianId và StartedAt. Start và SubmitResult đều kiểm tra hóa đơn thanh toán đủ ở server; yêu cầu chưa thu hoặc mới thu một phần bị từ chối. Hoàn tất kết quả chuyển Completed. [LabTestService][lab], [API xét nghiệm][lab-api], [Hồi quy][post-merge-checks]. |
| IX.4 | Nhập và hoàn tất kết quả | Thoại | **Đã có** | Có nội dung kết quả, ghi chú, URL tệp nếu có, người thực hiện, thời điểm; cập nhật trạng thái và chặn nhập trùng. API nhập kết quả được kiểm soát bằng quyền xét nghiệm, không cập nhật chẩn đoán/hồ sơ bác sĩ. [Lưu kết quả][lab-submit], [API xét nghiệm][lab-api]. |
| IX.5 | Thông báo kết quả | Thoại | **Đã có** | Lưu thông báo trong cùng transaction với kết quả rồi phát NotificationReceived/LabResultChanged cho đúng bệnh nhân và bác sĩ có quyền. Phân biệt hồ sơ trực tiếp với tài khoản để không gửi nhầm khi hai ID bằng nhau. Kiểm tra SignalR, đồng thời, trùng kết quả và rollback khi lỗi lưu thông báo đều đạt. [LabTestService][lab], [NotificationService][notifications], [Hồi quy][post-merge-checks]. |

## Các lỗi đã sửa trong lần rà soát ngày 20/11/2026

| Lỗi xác nhận được | Bản sửa và bằng chứng |
|---|---|
| Frontend không build được do merge mất đoạn JSX trong ReceptionCheckInDialog, trùng import và thiếu component import | Khôi phục tiêu đề/nội dung dialog, nhánh tìm/liên kết/tạo hồ sơ, giữ form sửa hồ sơ; build, lint và trình duyệt C8/C9 xác minh tiếp nhận và check-in. |
| Trang danh mục giữ trạng thái của tài nguyên trước và gọi cập nhật state trực tiếp trong effect; callback hàng chờ xét nghiệm có dependency thiếu | Tách component theo key tài nguyên, khởi tạo lại trạng thái khi đổi danh mục và đồng bộ callback tải hàng chờ. Lint đạt không lỗi/cảnh báo. |
| Tạo chỉ định xét nghiệm trả 500 do EF không dịch phép trừ DateTime trong OrderBy | Dùng EF.Functions.DateDiffDay; hồi quy cả yêu cầu có mã lượt và yêu cầu cũ theo bệnh nhân. |
| Nhầm DoctorId hồ sơ với UserId khi kiểm tra phân công; hồ sơ trực tiếp có thể trùng UserId người khác | Kiểm tra đúng DoctorId hồ sơ; lưu PatientProfileId; dùng danh tính hồ sơ khi đọc kết quả và chọn người nhận thông báo. Hồi quy tạo va chạm ID, kiểm tra 404/danh sách/thông báo. |
| Hàng chờ kỹ thuật viên hiện ca chưa thu và làm mất ca InProgress sau tải lại | Lọc theo hóa đơn Standard Paid, giữ Pending/InProgress; Start/SubmitResult chặn cả chưa thu và thu một phần. |
| UpgradeBillingModule tạo bảng khác entity, migration bổ sung CashierId/PaidAt để trống; rollback không xóa bảng và lỗi default constraint PaidAmount | Thêm migration 20261120010000_RepairInvoicePayments sửa database đã áp dụng migration cũ, khôi phục số đã thu cho hóa đơn Paid cũ; sửa Down để xóa bảng và constraint đúng thứ tự. Kiểm tra toàn chuỗi nâng/hạ cấp đạt. |
| Billing bị quay về giá cố định sau merge, ghép xét nghiệm sang lượt gần nhất và đưa lịch chưa khám vào Final | Đọc phí từ ClinicSettings, dùng AppointmentId của chỉ định, Final chỉ lấy Completed; bỏ các dòng thuốc đã lập hóa đơn. Hồi quy giá cấu hình và hai lượt cùng bệnh nhân. |
| Lập trùng phí qua hai tên nguồn BookRequest/Book; nhận dòng trùng hoặc nguồn không khớp lượt/giai đoạn | Kiểm tra cả hai tên nguồn cùng khoản sổ, loại khỏi hàng chờ ngay khi đã lập hóa đơn; kiểm tra nguồn/lượt/bệnh nhân và quyền ghi nhận tiền ở server. |
| Chứng từ thu ngân ghi BillingReconciled khác hợp đồng BillingVerified nên bác sĩ không áp dụng được phương án sau hoàn tiền | Gắn xác nhận với đúng đề xuất, hóa đơn gốc và chứng từ điều chỉnh. Hóa đơn chưa thu đủ chỉ chuyển sang BillingVerified khi số dư mới đã được xử lý. |
| Mẫu in phiếu thu chèn trực tiếp tên bệnh nhân/dịch vụ/ghi chú vào HTML | Escape nội dung động, thêm kiểm thử payload HTML/script và tiếng Việt. |

Các bản sửa migration/sổ khám, vai trò Trưởng khoa, giờ trống và tranh chấp lịch từ lần 16–18/11 vẫn có trong mã nguồn. Lần này bổ sung migration sửa thanh toán cho cả database đã chạy các migration lỗi; không sửa dữ liệu database ứng dụng và không chạy lại seed.

## Quy tắc tính số dư và báo cáo

Số phải trả hiện tại bằng số trên hóa đơn gốc cộng các chứng từ điều chỉnh. Số đã thu ròng bằng tổng tiền đã thu trừ số đã hoàn. Khi giảm phí, hệ thống ghi phiếu hoàn đúng phần đã thu vượt mức mới. Hủy toàn bộ phí đưa số phải trả về 0 và giữ chứng từ gốc trong lịch sử. Giao dịch thu và hoàn do thu ngân xác nhận tại quầy.

Ngày báo cáo tuân theo múi giờ phòng khám. Báo cáo kỳ dùng ngày giao dịch cho thực thu ròng và ngày lập chứng từ cho phần BHYT. Với dữ liệu cũ chỉ có tổng tiền đã thu, báo cáo dùng ngày ghi nhận của hóa đơn. Tồn kho trên Dashboard là ảnh chụp hiện tại.

## Kiểm tra đã chạy ngày 20/11/2026

Các runner tích hợp dùng database LocalDB tên ngẫu nhiên và tự xóa database do chúng tạo; không dùng database ứng dụng. Các số kiểm tra dưới đây không tương ứng một-một với số chức năng.

| Kiểm tra | Kết quả | Phạm vi kết luận |
|---|---|---|
| Build backend và hai fixture Release với --no-restore | Đạt, 0 lỗi biên dịch | UiRefreshVerification có cảnh báo NU1900 do không truy cập được dữ liệu kiểm tra lỗ hổng NuGet. |
| npm run build / npm run lint | Đạt | Build production và lint không lỗi/cảnh báo. |
| npm test | **120/120 đạt**, không bỏ qua | Phân quyền, form nhân sự/bệnh nhân, sinh hiệu, trạng thái khám/đơn thuốc, lỗi nghiệp vụ và escape mẫu in phiếu thu. |
| Week2Verification --core-workflow | **149 kiểm tra đạt** | Hồ sơ Doctor/Staff/Patient, liên kết tài khoản, hồ sơ Trưởng khoa, lịch/giờ trống, sổ và kiểm tra Paid. |
| Week2Verification --migrations-only | **30 kiểm tra đạt** | Đủ **52 migration**, nâng/hạ cấp, dữ liệu cũ, cột thanh toán còn thiếu, số đã thu cũ, sổ và vai trò tùy chỉnh. |
| Week2Verification --post-merge | **194 kiểm tra đạt** | Giá cấu hình, chống trùng và sai nguồn, nhiều lần thu, giảm/hủy phí, hoàn đúng phần vượt, từ chối xác nhận cũ, hóa đơn phân trang đúng chủ, báo cáo theo kỳ và đối soát thuốc từ thu ngân sang bác sĩ và quầy dược. |
| Week2Verification --d8 | **333 kiểm tra đạt** | Cấp thuốc, FEFO, thanh toán, khóa đơn rà soát, bằng chứng đối soát và sổ giấy. Bằng chứng tài chính trong một số ca D8 là dữ liệu fixture; API lập chứng từ thực được kiểm tra riêng bằng --post-merge. |
| Week2Verification --d9-strict | **135 kiểm tra đạt**, **0 khoảng trống D9** | Hành trình web có xét nghiệm, ca trực tiếp thu Final, mua sổ, khám, thanh toán và cấp thuốc. Khi gần hết ngày, bộ kiểm tra đặt lịch ngày kế tiếp rồi đổi ngày đến khám trong dữ liệu thử nghiệm để tiếp tục check-in bằng API. |
| UiRefreshVerification/smoke.mjs --admin-completion --remaining-roles | **56 kiểm tra đạt**, **52 migration** | Admin, nhân sự/tài khoản, cấu hình, danh mục công khai, quyền Thu ngân, kết quả và SignalR. Fixture kết quả thiết lập hóa đơn Paid trước khi kiểm tra thông báo; điều kiện thanh toán được kiểm tra riêng trong --post-merge. |
| tests/ui-regressions.mjs trên production | Đạt, UI_REGRESSIONS_SUCCESS | Giao diện công khai và bệnh nhân từ 320 đến 1440 px, mở hóa đơn từ menu, xem phiếu thu và số dư, chọn kỳ báo cáo Admin, xem chênh lệch và xác nhận hoàn tiền ở quầy với API giả lập. |
| tests/c8c9-ui.mjs | **267 kiểm tra API và 9 kịch bản trình duyệt đạt** | Tranh chấp đặt/đổi lịch, thu tiền sổ, hộp thoại tiếp nhận đã sửa, Paid qua SignalR, phát sổ, kiểm tra sổ, check-in và yêu cầu cấp lại tiếp theo. |

Build các fixture Release rồi chạy: `dotnet run --no-build --no-restore -c Release --project tests/Week2Verification -- <tham-số>`. Chạy smoke bằng `node tests/UiRefreshVerification/smoke.mjs --admin-completion --remaining-roles`. Runner trình duyệt dùng Edge headless; đặt PLAYWRIGHT_MODULE nếu Playwright nằm ngoài repository. Trong sandbox này, Node/Vite/Edge cần quyền tạo tiến trình con; lỗi spawn EPERM ban đầu đã được chạy lại thành công với quyền thực thi phù hợp.

## Cập nhật database khi triển khai

Đã bổ sung migration **20261120010000_RepairInvoicePayments** vì sửa file migration đã áp dụng không tự sửa database hiện hữu. Sau khi kiểm tra môi trường và bản sao lưu, áp dụng theo quy trình triển khai của nhóm:

```powershell
dotnet ef database update --project backend/ClinicManagement
```

Không chạy lại seed để sửa schema. Migration giữ các khoản tiền bảo hiểm, số đã thu và các giao dịch đã có; hóa đơn Paid cũ được khôi phục PaidAmount nhưng không tự tạo các phiếu thu lịch sử chưa từng được ghi nhận. Lần rà soát này chỉ áp dụng trên database kiểm thử tạm.

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
[history-dto]: ../backend/ClinicManagement/DTOs/Responses/MedicalHistory/MedicalHistoryResponses.cs
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
[review-dto]: ../backend/ClinicManagement/DTOs/Responses/Reviews/ReviewResponse.cs
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
[clinic-settings-service]: ../backend/ClinicManagement/Services/Implementations/ClinicSettingsService.cs
[clinic-settings-api]: ../backend/ClinicManagement/Controllers/ClinicSettingsController.cs
[clinic-settings-page]: ../frontend/clinic-management-client/src/pages/internal/admin/ClinicSettingsPage.jsx

[staff-page]: ../frontend/clinic-management-client/src/pages/internal/admin/StaffManagementPage.jsx
[doctor-management-page]: ../frontend/clinic-management-client/src/pages/internal/admin/DoctorsManagementPage.jsx
[staff-service]: ../backend/ClinicManagement/Services/Implementations/StaffService.cs
[staff-api]: ../backend/ClinicManagement/Controllers/StaffController.cs
[payment-entity]: ../backend/ClinicManagement/Data/Entities/InvoicePayment.cs
[payment-repair]: ../backend/ClinicManagement/Migrations/20261120010000_RepairInvoicePayments.cs
[patient-billing-dto]: ../backend/ClinicManagement/DTOs/Responses/Billing/PatientMedicineBillingResponse.cs
[post-merge-checks]: ../tests/Week2Verification/PostMergeChecks.cs
[core-checks]: ../tests/Week2Verification/CoreWorkflowChecks.cs
[journey-checks]: ../tests/Week2Verification/ClinicJourneyChecks.cs
[dispensing-checks]: ../tests/Week2Verification/PrescriptionDispensingChecks.cs
[receipt-html]: ../frontend/clinic-management-client/src/utils/receiptHtml.js
[receipt-tests]: ../frontend/clinic-management-client/tests/receiptHtml.test.mjs
[patient-invoices-page]: ../frontend/clinic-management-client/src/pages/patient/PatientInvoicesPage.jsx
[patient-invoices-api]: ../backend/ClinicManagement/Controllers/PatientInvoicesController.cs
[admin-period-report]: ../frontend/clinic-management-client/src/components/internal/AdminPeriodReport.jsx
[invoice-adjustments]: ../backend/ClinicManagement/Services/Implementations/InvoiceService.Adjustments.cs
