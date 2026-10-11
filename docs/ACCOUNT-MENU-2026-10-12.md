# Nút và dropdown tài khoản — 12/10/2026

Đã đọc RULES, DESIGN, Navbar, MUI đang cài, `useAuth`, `authSlice`, AuthSession và luồng login/refresh/logout hiện tại. Thay đổi giới hạn ở FE; không sửa BE, DB ứng dụng, cấu hình auth, endpoint hoặc API client.

## File và giao diện

- `frontend/clinic-management-client/src/layouts/patient/Navbar.jsx`: dùng AccountMenu cho tài khoản đã đăng nhập ở desktop và trong drawer mobile. Giữ link/nút của khách, điều hướng theo role và hàm logout hiện có. Drawer dùng `slotProps.paper` tương thích MUI đang cài để giữ chiều rộng dự kiến và giới hạn theo viewport.
- `frontend/clinic-management-client/src/layouts/patient/AccountMenu.jsx`: component trình bày mới, dùng MUI Button/Menu/Tooltip/Avatar và icon MUI hiện có. Nút có icon người dùng, tên và mũi tên; chiều rộng ổn định, ellipsis, tooltip đầy đủ. Dropdown trắng, viền nhẹ, bo 12px, shadow nhẹ, tên đầy đủ xuống dòng ở phần đầu; mỗi mục có icon và vùng bấm tối thiểu 46px. Đăng xuất có divider riêng và màu đỏ trầm. Font dùng Inter/fallback của theme, cỡ 14–15px, weight 500–600 và line-height đủ cho dấu tiếng Việt.

Tên lấy từ **`useAuth().user.fullName`** trong Redux, fallback **`user.username`** nếu tên trống. AuthForm đang đưa User từ response login/register vào auth state; AuthSession xác minh `/auth/me` sau reload; refresh và lưu hồ sơ cũng cập nhật User qua cơ chế sẵn có. Component không gọi API. Trước khi phiên được kiểm tra, không dùng tên lưu cũ; trạng thái chưa có User dùng skeleton cùng kích thước. Component được tạo lại theo UserId và gỡ khi logout để không giữ menu của phiên trước.

Các mục/role giữ đúng hiện trạng: Patient có Đặt lịch khám, Kết quả xét nghiệm, Hồ sơ cá nhân, Đánh giá sau khám, Đăng xuất; tài khoản nội bộ có Trang quản lý, Hồ sơ cá nhân, Đăng xuất. MUI giữ click-away/Escape/focus restore và điều hướng menu bằng bàn phím; nút hỗ trợ ArrowDown để mở.

## Kiểm tra thực tế

- `npm run lint -- --max-warnings 0`: đạt toàn FE.
- `npm test`: 14/14 đạt.
- `npm run build`: đạt; cảnh báo bundle lớn hiện có vẫn còn.
- Edge headless với **BE thật** và DB tạm dựng bằng chuỗi 31 migration: login hiện đúng fullName; chọn cả bốn mục Patient và Trang quản lý cho Admin; lưu tên dài có dấu qua PUT `/auth/me` cập nhật nút ngay; reload chờ GET `/auth/me` thật và giữ đúng tên sau xác minh; logout POST 204, cookie bị xóa và storage rỗng; login tài khoản khác trong cùng browser không hiện tên cũ. Không có lỗi runtime `pageerror`.
- Menu có đủ icon, tooltip/ellipsis, kiểm tra ArrowDown/Home/End/Escape, khôi phục focus và bấm ngoài. Mở/đóng không gọi thêm GET User. Viewport 1440/1360/1024/390/320: không tràn trang, không chồng nút lên link desktop; menu nằm trong viewport và nhận click phía trên drawer mobile.
- Ảnh đã xem/đối chiếu: `.tmp/ui-refresh/AccountMenu-{desktop,long-name-desktop,mobile-390,mobile-320,logged-out,switched-account}.png`. Khi chụp, request font Google được chặn để kiểm tra fallback sans-serif hỗ trợ tiếng Việt; chưa kiểm chứng tải font qua mạng. Chưa kiểm tra trên thiết bị mobile vật lý.

Kiểm chứng được thêm tại `tests/account-menu-stage.mjs`, đăng ký stage `AccountMenu` trong driver hiện có. Lệnh: `node tests/ui-refresh.mjs`, sau đó gửi `{"command":"run","stage":"AccountMenu"}` và `{"command":"stop"}`. Driver cần Playwright/Edge; có thể đặt `PLAYWRIGHT_MODULE` nếu Playwright cài ngoài repo. DB và process thử nghiệm đã dọn sau khi chạy; dữ liệu tài khoản thật đang dùng không bị đổi.
