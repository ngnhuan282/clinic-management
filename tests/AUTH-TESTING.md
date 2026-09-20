# Kiểm thử đăng nhập và đăng ký

Giao diện nằm tại `/login` và `/register`; `/internal/login` dùng cùng form. Bệnh nhân đăng nhập thành công sẽ tới `/booking`, nhân viên tới `/internal/dashboard`. Form sử dụng API `/api/auth/login`, `/register`, `/refresh` và `/logout` của backend hiện tại.

Frontend đọc `VITE_API_BASE_URL` (mặc định `http://localhost:5212/api`). Đăng nhập dùng **tên đăng nhập**, không dùng số điện thoại hoặc PID. Đăng ký gửi tên đăng nhập, họ tên, số điện thoại, email và mật khẩu; tài khoản mới có vai trò Patient.

“Ghi nhớ đăng nhập” lưu phiên trong localStorage; nếu không chọn, phiên ở sessionStorage. “Quên mật khẩu?” hướng dẫn liên hệ phòng khám: backend chưa có API tự đặt lại mật khẩu hoặc OTP.

Chạy từ thư mục gốc repository:

```powershell
node --test tests/auth-storage.test.mjs
```

Kiểm thử tích hợp yêu cầu .NET 8, SQL Server LocalDB, dependencies frontend đã cài, Playwright và Microsoft Edge. Nếu Playwright không nằm trên module path, đặt `PLAYWRIGHT_MODULE` thành URL `file:///.../playwright/index.mjs` của bản đã cài. Có thể đặt `BROWSER_CHANNEL=chrome` để dùng Chrome.

```powershell
node tests/auth-ui.mjs
```

Harness tạo database riêng `ClinicWeek2Test_<GUID>`, khởi động API trên cổng tự chọn và Vite trên cổng 5190, rồi kiểm tra:

- Đăng ký qua trình duyệt và đối chiếu họ tên, điện thoại, email trong SQL Server.
- Kiểm tra dữ liệu bắt buộc, xác nhận mật khẩu, tài khoản/email trùng và mật khẩu sai.
- Khôi phục phiên sau khi tải lại, ghi nhớ đăng nhập qua tab mới, đăng xuất và thu hồi refresh token.
- Điều hướng theo vai trò và tự làm mới JWT qua API thật.
- Đăng xuất quản trị từ thanh bên trên màn hình thấp và từ menu tài khoản trên điện thoại; kiểm tra thu hồi refresh token, xóa phiên đã ghi nhớ, chặn truy cập lại trang quản trị và xóa phiên cục bộ khi API không kết nối được.
- Không tràn ngang ở chiều rộng 320, 390, 768 và 1024 px; ảnh desktop/mobile lưu trong `.tmp/auth-*.png`.

Database kiểm thử và tiến trình được dọn sau khi chạy; không dùng database làm việc của dự án.
