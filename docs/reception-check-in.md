# Tiếp nhận và check-in tại quầy

- Lễ tân xác nhận, đổi hoặc hủy **lịch hẹn** qua `/api/appointments`. Đây là nghiệp vụ khác với duyệt **lịch làm việc bác sĩ**.
- Walk-in dùng `POST /api/appointments/direct`. Lễ tân tìm Patient cũ qua `GET /api/patients/matches?search=...` và gửi `patientProfileId` khi đã đối chiếu. Nếu không chọn hồ sơ, hệ thống tạo Patient mới; tên + số điện thoại hoặc số định danh trùng hồ sơ cũ sẽ bị từ chối để tránh tạo trùng.
- Với lịch online chưa có hồ sơ Patient, lễ tân dùng `PATCH /api/appointments/{id}/patient-profile` để liên kết hồ sơ cũ hoặc tạo hồ sơ từ thông tin lịch hẹn.
- Sổ cũ mang theo được ghi nhận bằng `POST /api/patients/{id}/books/existing` sau khi lễ tân xác nhận đã kiểm tra sổ. Sổ mới cần `POST /api/patients/{id}/book-invoices`, `PATCH /api/book-invoices/{id}/pay`, rồi `POST /api/book-invoices/{id}/issue-book`. Phí sổ do lễ tân nhập vào hóa đơn; dự án chưa có bảng giá sổ.
- `PATCH /api/appointments/{id}/check-in` chỉ nhận lịch `Confirmed` đúng ngày, Patient đã đối chiếu và sổ `Issued` thuộc Patient đó. Sổ cũ còn yêu cầu `bookPresented=true`; sổ mới cần hóa đơn sổ `Paid`. Khi thành công, lịch lưu `PatientBookId`, `BookVerifiedAt` và `CheckedInAt`. Bác sĩ chỉ bắt đầu khám/lập bệnh án sau mốc này.
- Migration `AddReceptionCheckInBooks` tạo Patient, sổ, hóa đơn sổ và các khóa liên quan. Chạy `dotnet ef database update --project backend/ClinicManagement` trước khi gọi API mới.
