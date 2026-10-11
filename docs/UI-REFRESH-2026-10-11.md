# Giao diện Clinic Management và sửa lỗi — 11/10/2026

Nhánh `feature/friendly-clinic-pages`. Đã đọc RULES, DESIGN, đặc tả hiện hành, contract duyệt ca và code từng trang; lấy Quản lý tài khoản làm mẫu. Không thay endpoint, API client, route, payload hoặc mã nguồn BE trong đợt làm giao diện này.

## Kết quả theo trang

Các đường dẫn FE dưới đây tính từ `frontend/clinic-management-client/src/`.

| Trang | File sửa | Giao diện và chức năng đã kiểm tra với BE thật | Thao tác mẫu không áp dụng |
| --- | --- | --- | --- |
| Lịch bác sĩ | `pages/internal/DoctorScheduleManagementPage.jsx` thay bản `.tsx` | Tiêu đề, thẻ lọc chuyên khoa/tuần, điều hướng tuần, lịch ca, chi tiết ca và dialog tạo lịch. GET `/doctor-schedules`, `/doctors`, catalog phòng/chuyên khoa; POST tạo ca, tải lại, lọc, xem chi tiết. Hiển thị đủ ca cùng ngày/ca trực; màn hình nhỏ cuộn trong lịch. | Không có sửa/xóa/khóa hoặc Excel trong contract trang hiện tại. Lịch tuần không dùng phân trang bảng. |
| Xét nghiệm | `pages/internal/LabTestTypesPage.jsx`, `LabTestTypeModal.jsx` | Thẻ lọc, select trạng thái, bảng/phân trang, form và xác nhận ẩn. GET `/LabTestTypes?includeInactive=true`; tạo, sửa, ẩn bằng DELETE hiện có, bật lại qua form sửa và GET lại dữ liệu. Lọc/phân trang phía FE vì API trả mảng. Doctor chỉ xem; thao tác quản trị cần quyền hiện có. | Không xóa vĩnh viễn/khóa tài khoản/Excel. Icon ẩn phản ánh nghiệp vụ soft hide. |
| Duyệt ca khám | `pages/internal/ScheduleReviewPage.jsx` | Tab trạng thái, bộ lọc, bảng, chi tiết và dialog duyệt/từ chối. GET `/schedule-requests` phân trang server; POST `/{id}/approve`, `/{id}/reject` và tải lại. Nút theo `canReview` từ BE; kiểm tra không tự duyệt. Tìm kiếm/ngày/phòng được ghi rõ áp dụng trên trang đang xem. | Bỏ nút xuất và bộ lọc “của tôi” không có nghiệp vụ tương ứng trên trang Admin; không sửa/xóa/khóa/Excel. |
| Danh mục bệnh | `pages/internal/DiseasesPage.jsx`, `components/internal/diseases/{DiseaseFilters,DiseasesTable,DiseaseFormDialog}.jsx`, `hooks/useDiseases.js` | Header, thẻ lọc, refresh/reset, bảng/phân trang, icon sửa/xóa và dialog. GET/POST `/diseases`, PUT/DELETE `/{id}`; lọc/phân trang server, tạo/sửa/xóa và reload. Kiểm tra phản hồi GET cũ đến muộn không ghi đè bộ lọc mới. | Không khóa/nhập hoặc xuất Excel vì chưa có API. |
| Hồ sơ cá nhân | `components/common/AccountProfile.jsx`, `pages/patient/PatientProfilePage.jsx`, `pages/internal/AccountProfilePage.jsx`, `hooks/useMyProfile.js` | Form có nhóm thông tin, loading/error/retry, bố cục một/hai cột. GET/PUT `/auth/me`, `/patients/me`; lưu/reload đúng phản hồi chuẩn hóa BE, kể cả khi chỉ thay khoảng trắng. Thử overposting `userId`/role bị 400. Kiểm tra component dùng chung ở Admin và Doctor. Tài khoản chưa có hồ sơ khám vẫn sửa tài khoản được và thấy trạng thái trống đúng nghiệp vụ. | Không thao tác tài khoản người khác/xóa/khóa/Excel. Hồ sơ khám chưa tồn tại phải được tiếp nhận xác nhận. |
| Kết quả xét nghiệm | `pages/patient/LabResultsPage.jsx` | Thẻ kết quả, trạng thái, tìm kiếm/phân trang cục bộ, chi tiết lấy qua GET `/labtests/{id}`. GET `/labtests` chỉ trả dữ liệu bệnh nhân hiện tại; ID của bệnh nhân khác trả 404. Kiểm tra Pending/Completed, chi tiết, refresh, trống và mobile. Trạng thái Cancelled có cách hiển thị riêng; chưa seed ca Cancelled để kiểm tra browser. | Chỉ xem; không sửa/xóa/khóa/Excel. API hiện trả mảng và không có phân trang/bộ lọc server. |
| Đánh giá sau khám | `pages/patient/ReviewsPage.jsx`, `components/patient/ReviewDialog.jsx` | Thẻ lượt khám, sao/nhận xét, trạng thái ẩn, phân trang server và dialog. GET `/reviews/my-appointments`, POST `/reviews`, GET công khai `/reviews`. Gửi rồi tải lại, trùng lịch 409, chưa Completed 400, sai bệnh nhân 403; review ẩn còn trong danh sách riêng và không xuất hiện công khai. | Bệnh nhân không sửa/xóa/ẩn hiện hoặc Excel. Chỉ nút gửi lần đầu trên lịch Completed của chính mình theo contract hiện tại. |

Component/style mới: `components/common/ClinicPageHeader.jsx`, `clinicUi.js`. Icon của các thao tác tương ứng dùng cùng bộ MUI, có nhãn truy cập/tooltip; không đổi component Header chung đang được các module khác sử dụng.

## Sửa lỗi Hồ sơ, Đánh giá và Thu ngân

- API thật `http://localhost:5212` đang dùng `ClinicManagementDb` chỉ có **23/31 migration**. Thiếu `Patients.UserId`, bảng Reviews và một số thay đổi Invoice; GET `/api/reviews` trả 500/code 9999. Đã tạo backup COPY_ONLY/CHECKSUM và chạy RESTORE VERIFYONLY, khôi phục bản sao `ClinicRepairTrial_1a12bc954d1`, áp dụng chuỗi **EF migration thật** thành công trên bản sao rồi mới áp dụng cho DB đang dùng. Không tạo schema trực tiếp từ model.
- DB hiện có **31 migration**. Số bản ghi sau cập nhật vẫn là Users 22, Appointments 24, Patients 0, PatientBooks 0, Invoices 0. GET `/api/reviews` trên DB thật đã trả **200/code 1000**. Giữ backup tại `.tmp/db-repair/ClinicManagementDb-before-fixes.bak`; bản sao thử migration đã được dọn.
- `PatientProfilePage` xử lý chính xác 404/code 4001 thành thông báo chưa có hồ sơ khám; lỗi 401/403/500 và lỗi kết nối vẫn được xử lý như lỗi. `ReviewDialog` hướng dẫn liên hệ tiếp nhận khi lịch cũ thiếu liên kết hồ sơ; không bỏ qua điều kiện BE.
- `pages/internal/CashierBillingPage.jsx` trước đó dùng biến `loading` và `pendingList` chưa khai báo nên crash. Đã sửa trạng thái tải/hàng chờ, error/retry, reset lựa chọn/BHYT khi đổi sổ/làm mới, khóa thao tác khi đang lưu và bố cục mobile. Giữ nguyên GET `/invoices/pending?stage=...`, POST `/invoices` và DTO thu tiền. Browser kiểm tra bằng Admin và **role Cashier thật**, hai sổ thu, lựa chọn, BHYT, tạo hóa đơn và loại bản ghi đã thu khỏi hàng chờ. Chỉ thu tiền trên DB tạm; Invoices DB thật vẫn bằng 0.

## Kiểm chứng

- `npm run build`: đạt; còn cảnh báo bundle lớn của ứng dụng.
- `npm run lint -- --max-warnings 0`: đạt trên toàn FE.
- `npm test`: **14/14 đạt**.
- Edge headless chạy từng trang với API thật và SQL Server LocalDB dựng bằng `Database.MigrateAsync()` từ trống, **31 migration**; không dùng `EnsureCreated`. Các trang và dialog chính có ảnh desktop 1440px/mobile 390px trong `.tmp/ui-refresh/`; các lượt kiểm tra hoàn tất không có lỗi runtime `pageerror` và không tràn ngang trang.
- Kiểm tra 401 cho anonymous/JWT sai, 403 cho tài khoản thiếu quyền, phạm vi phòng/bác sĩ/ID khác khoa và không tự duyệt trong fixture. Hồ sơ, Reviews và Thu ngân đã kiểm tra thêm loading bằng trì hoãn GET thật, lỗi mạng bằng ngắt request và nút thử lại trả GET 200; không dùng response mock.
- Fixture và driver: `tests/UiRefreshVerification/`, `tests/ui-refresh.mjs`, `tests/ui-refresh-stages.mjs`, `tests/ui-refresh-states.mjs`. DB/browser/process thử nghiệm đã dọn; API và Vite người dùng đang chạy được giữ lại.

## Giới hạn và phụ thuộc

DB đang dùng có PatientBooks bằng 0 nên lỗi A5 PatientBooks/Check-in **không chặn lần cập nhật này**. Các blocker đã ghi trong [WEEK6-A6.md](WEEK6-A6.md) vẫn cần module liên quan giải quyết nếu nâng cấp DB có `PatientBooks.Status='Voided'`, dữ liệu sổ không hợp lệ hoặc custom role chiếm ID cố định của migration Dược. Đợt này không sửa các migration đó.

DB đang dùng có 16 lịch Completed cũ nhưng chưa có hồ sơ Patients. Review của các lịch thiếu `PatientProfileId` vẫn cần module tiếp nhận/Appointment liên kết hồ sơ đúng trên server; không tự suy đoán liên kết bằng tên/điện thoại. Các lịch Completed trong fixture là dữ liệu kiểm tra được chèn **sau migration thật**; kết quả không xác nhận toàn bộ hành trình đặt lịch–check-in–khám–thanh toán E2E của các module khác.
