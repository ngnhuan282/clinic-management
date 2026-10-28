# Rà soát đặt lịch và tiếp đón của Hoàng

Ngày kiểm tra: 28/10/2026. Phạm vi đối chiếu: các task C1–C9 của thành viên 3 trong `Nhóm16 Tiến độ (2).xlsx`, code hiện tại và kiểm thử tích hợp.

## Phạm vi chức năng đã có

| Task | Chức năng và bằng chứng trong code |
| --- | --- |
| C1 | DTO/API và trạng thái lịch hẹn; chờ khám biểu diễn bằng `Confirmed` kèm `CheckedInAt`, không thêm enum khác. |
| C2 | Slot 30 phút lấy từ ca Approved; chặn đặt trùng tại DB; hủy/đổi lịch giải phóng slot. |
| C3 | Lễ tân xác nhận, đổi, hủy và xác nhận hàng loạt; kiểm tra trạng thái và quyền phía backend. |
| C4 | Walk-in tạo hoặc đối chiếu Patient; check-in yêu cầu sổ đúng người, còn hiệu lực, đã Paid nếu có hóa đơn, đã kiểm tra sổ thực tế. |
| C5 | SignalR cập nhật lịch hẹn, slot, Book Paid, sổ và check-in; gửi đúng các vai trò liên quan. |
| C6 | Bệnh nhân xem/lọc/phân trang lịch của mình; lễ tân phát/cấp lại sổ sau Paid, giữ liên kết sổ cũ. |
| C7 | Bộ lọc tại quầy; xử lý có/chưa có/mất/quên sổ; chặn Pending/Unpaid trước check-in. |
| C8 | Có kiểm thử race và trạng thái đặt lịch, đổi lịch, xác nhận/hủy, check-in/cấp lại; **còn lỗi race thanh toán Book của module tài chính bên dưới**. |
| C9 | Có kiểm thử luồng bệnh nhân mới, walk-in, tái khám không thêm phí Book, cấp lại sổ, check-in và liên kết MedicalRecord. |

Việc gọi API ca bác sĩ hoặc bệnh án trong test là bằng chứng tích hợp, không phải nhận phần triển khai các module đó cho Hoàng. Nhánh Lost và ngày đến khám trong các tình huống chạy muộn được chuẩn bị trong DB thử. Tài liệu này không xác nhận hoàn tất C10/C11 hoặc nghiệm thu toàn hệ thống.

## Các lỗi đã sửa trong đợt này

- Trả lỗi nghiệp vụ cho giờ ngoài ngày và offset phân trang quá lớn, tránh lỗi 500 do tràn số.
- Khi cấp lại từ một yêu cầu Pending cũ, `PreviousBookId` trỏ đúng sổ Issued thực sự bị thay thế; giữ chuỗi Lost khi không có sổ Issued.
- Sau SignalR reconnect, tải lại slot đang xem kể cả khi sự kiện slot gần nhất thuộc bác sĩ/ngày khác.
- Xác nhận hàng loạt luôn tải lại kết quả; báo rõ số thành công/thất bại, giữ các lịch thất bại để thử lại.
- Chặn khoảng ngày ngược; xóa danh sách cũ khi tải lỗi; phân biệt lỗi thống kê/danh mục/sổ với đang tải và có thao tác thử lại.
- Không để phản hồi danh mục hoặc đối chiếu Patient cũ ghi đè lựa chọn mới; đưa phân trang về trang hợp lệ sau cập nhật.
- Walk-in hiển thị đầy đủ slot trả về từ API và cho chọn ngày ngoài các nút gợi ý.
- Bảng lễ tân trên điện thoại hiển thị trạng thái và thao tác theo từng lượt khám; chiều cao hàng tự giãn để tránh xung đột với theme chung. Bộ lọc desktop được thu gọn.

## Giao diện và giới hạn thay đổi

Áp dụng [Hallmark](https://github.com/Nutlope/hallmark/blob/main/skills/hallmark/SKILL.md) theo `DESIGN.md`: giữ xanh dương, form và danh sách rõ nghiệp vụ, focus bàn phím, chế độ giảm chuyển động, bố cục desktop/mobile. Tách BookingPage và các phần tiếp đón thành component riêng.

Form đặt lịch web chỉ giữ dữ liệu mà API thực sự lưu: bác sĩ, ngày/giờ, tên, điện thoại, lý do khám. Bỏ trường ngày sinh/giới tính/BHYT/tải tệp chưa gửi API, thông tin phí/địa chỉ/hotline chưa có nguồn và nút quay lại chưa có xử lý. Học vị và kinh nghiệm bác sĩ lấy từ API vẫn được giữ. Form walk-in vẫn giữ dữ liệu định danh mà API hiện tại hỗ trợ.

Trạng thái hóa đơn hiển thị tiếng Việt `Chưa thanh toán`/`Đã thanh toán`; kiểm thử vẫn xác nhận `Unpaid`/`Paid` từ API và điều kiện cấp sổ/check-in, không chỉ kiểm tra nhãn. Mật khẩu fixture C6/C7 truyền qua stdin riêng thay vì stdout.

Không sửa Admin, Navbar/layout chung, quản lý ca bác sĩ, CRUD Patient, bệnh án, InvoiceService, schema, migration hoặc dependencies. Các stylesheet mới chỉ áp dụng cho vùng đặt lịch/tiếp đón và dialog của chúng.

Các rule liên quan được áp dụng: validator riêng (#11), AppException (#12), phân trang (#14), không in mật khẩu fixture (#17), tách component/hook/API (#19, #22–24), error handler chung (#27), branch riêng và giữ phạm vi (#40). Đây không phải tuyên bố mọi code cũ trong repo đã tuân thủ toàn bộ RULES.

## Kiểm tra đã chạy

| Kiểm tra | Kết quả |
| --- | --- |
| Build backend và bộ kiểm tra | Đạt, 0 cảnh báo, 0 lỗi |
| Build frontend | Đạt |
| ESLint trên các file UI/JS thay đổi | Đạt |
| Frontend unit tests hiện có | 71/71 |
| C6/C7 API | 90 kiểm tra đạt |
| Core workflow API | 43 kiểm tra đạt |
| Clinic realtime API | 69 kiểm tra đạt |
| C9 API riêng | 150 kiểm tra đạt |
| C6/C7 trình duyệt | 9 kiểm tra đạt, gồm mobile không chồng hàng và nút check-in nhận được thao tác chạm |
| C9 và hồi quy trình duyệt | 13 kiểm tra đạt, gồm gửi form web/walk-in thật, Paid/check-in/MedicalRecord, reconnect và xác nhận hàng loạt một phần |
| Hallmark static | 0 FAIL, 0 REFLEX, 0 WARN |
| C8/C9 đầy đủ | Không đạt: race tài chính `POST /invoices` trả `200,500` |

Test dùng DB SQL Server LocalDB riêng, áp dụng migration thật và dọn DB sau khi chạy. Không áp dụng bản vá tài chính thử trong `.tmp` vào code chạy thật.

Ảnh so sánh cục bộ: `.tmp/hoang-ui/compare.html`; ảnh gốc trong `.tmp/hoang-ui/before` và `.tmp/hoang-ui/after`, ở 1440px và 390px. Đây là artifact sinh ra để kiểm tra, không đưa vào commit.

Đã kiểm tra 8 ảnh sau sửa, không tràn ngang trang. Rà soát giao diện độc lập phát hiện hai điểm: thao tác bảng bị khuất trên mobile và bộ lọc desktop quá cao. Cả hai đã sửa, chụp lại và đối chiếu; hồi quy mobile kiểm tra thêm chiều cao chứa đủ các ô và hit testing của nút check-in.

Chạy lại từ thư mục gốc (browser runner cần Playwright và Edge; đặt `PLAYWRIGHT_MODULE` thành module URL nếu Playwright không được cài tại gốc):

```powershell
dotnet build tests/Week2Verification/Week2Verification.csproj -o .tmp/hoang-check-build
dotnet .tmp/hoang-check-build/Week2Verification.dll --c6c7
dotnet .tmp/hoang-check-build/Week2Verification.dll --core-workflow
dotnet .tmp/hoang-check-build/Week2Verification.dll --clinic-realtime
$env:CLINIC_TEST_ASSEMBLY = '.tmp/hoang-check-build/Week2Verification.dll'
node tests/c6c7-ui.mjs
node tests/c8c9-ui.mjs --c9
dotnet .tmp/hoang-check-build/Week2Verification.dll --c8c9
```

`--c9` là lựa chọn công khai để kiểm tra riêng C9; không truyền tùy chọn này thì bộ kiểm tra C8/C9 đầy đủ vẫn chạy và vẫn phát hiện lỗi race tài chính.

## Lỗi còn lại cần chủ module tài chính xử lý

Hai thu ngân cùng `POST /invoices` cho một hóa đơn Book: một yêu cầu thành công, yêu cầu còn lại trả 500. Kiểm thử vẫn báo thất bại; không sửa test để chấp nhận 500. Theo quyết định trước đó của người dùng, `InvoiceService.cs` được giữ nguyên. Vì vậy không thể ghi C8 hoặc toàn bộ C8/C9 là hoàn tất không còn lỗi.

Hallmark static được kiểm tra riêng; render tier của Hallmark chưa chạy do môi trường chưa có harness Puppeteer cho các route cần đăng nhập. Ảnh giao diện và kiểm thử render thật dùng Playwright/Edge với tài khoản và dữ liệu thử, không thay thế kết quả render tier bằng một tuyên bố pass.
