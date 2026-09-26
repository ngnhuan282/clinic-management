# Báo cáo kiểm tra các module tuần 3 — 27/09/2026

Phạm vi đối chiếu theo các đầu việc A3, B3, C3, D3, E3 trong sheet `Gantt` của `docs/Nhóm16 Tiến độ.xlsx`. Cột T3 trong bảng đang để trống; các đầu việc được xác định theo mã và mô tả module tuần 3.

| Module | Kết quả đã xác minh |
|---|---|
| A3 — Auth/User/Role | Đăng ký Patient, đăng nhập, logout, refresh, khóa/mở khóa, gán vai trò, chặn tự đổi quyền và bảo vệ Admin cuối cùng. Đã kiểm tra JWT cũ bị vô hiệu sau đổi quyền. |
| B3 — Lịch bác sĩ | Tạo ca sáng/chiều, lấy 13 khung giờ, thay đổi ca làm cập nhật khung giờ; đầu vào sai trả 400, lịch trùng bác sĩ hoặc phòng trả 409. |
| C3 — Lịch hẹn lễ tân | Lễ tân xác nhận, đổi giờ, hủy lịch; bệnh nhân không được gọi API xác nhận. Kiểm tra đặt trùng đồng thời: một yêu cầu thành công, bảy yêu cầu nhận 409. |
| D3 — Khám bệnh | Tạo bệnh, tạo/xem/cập nhật hồ sơ bệnh án và chẩn đoán, chặn tạo trùng hồ sơ, chặn Patient đọc API dành cho bác sĩ. |
| E3 — Xét nghiệm | Doctor tạo chỉ định cho Patient hợp lệ; LabTechnician xem hàng chờ và nhập kết quả; Patient chỉ đọc chỉ định/kết quả của mình; nhập kết quả lần hai trả 409. Giao diện Patient hiển thị kết quả thực. |

## Lỗi đã sửa

- Bộ kiểm tra và SQL demo còn dùng cấu trúc `DoctorSchedules` cũ; cập nhật cho `ScheduleId`, `WorkDate` và `TimeSlots` để migration và seed chạy được.
- API đổi lịch hẹn trả 500 khi gắn một entity Doctor không được EF theo dõi vào Appointment đang được theo dõi; cập nhật luồng lưu và trả response.
- API lịch bác sĩ trả 500 với giờ hoặc tham số sai và cho phép lịch chồng lấn; trả 400/409 theo trường hợp.
- API xét nghiệm cho mọi tài khoản đã đăng nhập tạo chỉ định hoặc đọc toàn bộ danh sách; giới hạn theo vai trò và chủ sở hữu. Thêm vai trò LabTechnician bằng migration `AddLabTechnicianRole`, route hàng chờ và trang kết quả của Patient.
- Sửa 11 lỗi lint ở các màn hình bệnh án, danh mục bệnh và xét nghiệm; cập nhật bộ kiểm tra Edge theo menu di động hiện tại.

## Xác minh cuối

- `dotnet run --no-restore --project tests/Week2Verification/Week2Verification.csproj`: **199/199 đạt** trên database LocalDB ngẫu nhiên, được xóa sau khi chạy.
- `node --test tests/auth-storage.test.mjs`: **6/6 đạt**.
- `node tests/auth-ui.mjs` với Playwright và Edge headless: **đạt**, gồm Auth/User/Role, kết quả xét nghiệm của Patient, điều hướng theo vai trò, refresh và bố cục desktop/mobile.
- Backend build, frontend lint/build và `dotnet ef migrations has-pending-model-changes`: **đạt**.

Header và sidebar của Admin giữ nguyên giao diện và danh sách menu so với trước khi sửa. Đã xem ảnh Edge desktop/mobile của trang Admin. Build frontend còn cảnh báo bundle lớn hơn 500 kB; NuGet không truy cập được nguồn dữ liệu audit trong môi trường kiểm tra.
