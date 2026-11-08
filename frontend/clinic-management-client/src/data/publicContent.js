// Shared clinic information previously displayed in the patient portal footer.
export const CLINIC = {
    name: "Clinic Management System",
    phone: "1900 6868",
    phoneHref: "tel:19006868",
    email: "contact@medclinic-system.vn",
    hours: "07:30 – 20:00, Thứ Hai – Chủ Nhật",
    locations: [
        { name: "Cơ sở TP. Hồ Chí Minh", address: "128 Nguyễn Trãi, Quận 1, TP. Hồ Chí Minh" },
        { name: "Cơ sở Hà Nội", address: "54 Tràng Thi, Hoàn Kiếm, Hà Nội" },
    ],
};

export const GUIDES = [
    {
        slug: "dat-lich-kham", title: "Đặt lịch khám trực tuyến như thế nào?", category: "Đặt lịch",
        summary: "Chọn chuyên khoa, bác sĩ và giờ khám phù hợp ngay trên website.",
        sections: [
            ["1. Chọn chuyên khoa và bác sĩ", "Mở trang Đặt lịch khám, chọn chuyên khoa và bác sĩ. Bạn có thể xem hồ sơ bác sĩ và các đánh giá công khai trước khi lựa chọn."],
            ["2. Chọn ngày và giờ khám", "Lịch trống được cập nhật từ lịch làm việc của phòng khám. Nếu ngày đã chọn chưa có giờ trống, hãy chọn ngày khác hoặc bác sĩ khác."],
            ["3. Gửi thông tin đăng ký", "Điền họ tên, số điện thoại và lý do khám. Khách chưa có tài khoản vẫn có thể gửi đăng ký. Lưu mã lịch hẹn sau khi gửi thành công."],
            ["4. Chờ xác nhận", "Đăng ký được tiếp nhận ở trạng thái Chờ xác nhận. Phòng khám sẽ liên hệ qua số điện thoại đã cung cấp. Bạn có thể gọi tổng đài và cung cấp mã lịch hẹn nếu cần hỗ trợ."],
        ],
    },
    {
        slug: "chuan-bi-truoc-khi-kham", title: "Chuẩn bị trước khi đến phòng khám", category: "Hướng dẫn khách hàng",
        summary: "Những thông tin và giấy tờ nên chuẩn bị để việc tiếp đón thuận tiện hơn.",
        sections: [
            ["Lưu thông tin lịch hẹn", "Ghi lại mã lịch hẹn, tên bác sĩ, ngày và giờ khám. Đối chiếu với thông tin xác nhận từ phòng khám trước khi đến."],
            ["Mang giấy tờ và hồ sơ liên quan", "Chuẩn bị giấy tờ định danh, thẻ bảo hiểm nếu có, sổ khám, đơn thuốc và các kết quả trước đây để trao đổi với nhân viên tiếp đón và bác sĩ."],
            ["Xác nhận yêu cầu chuẩn bị riêng", "Nếu đăng ký xét nghiệm hoặc dịch vụ có yêu cầu chuẩn bị, hãy liên hệ phòng khám để nhận hướng dẫn phù hợp với dịch vụ đã chọn."],
            ["Đến quầy tiếp đón", "Cung cấp mã lịch hẹn và thông tin người khám để lễ tân đối chiếu hồ sơ. Thông báo nếu thông tin liên hệ có thay đổi."],
        ],
    },
    {
        slug: "quan-ly-lich-hen", title: "Theo dõi lịch hẹn và kết quả khám", category: "Cổng bệnh nhân",
        summary: "Phân biệt đăng ký với tư cách khách và đặt lịch bằng tài khoản bệnh nhân.",
        sections: [
            ["Đăng ký với tư cách khách", "Lưu mã lịch hẹn để liên hệ tổng đài khi cần xác nhận, đổi hoặc hủy lịch. Lịch khách không tự động liên kết với tài khoản được tạo sau đó."],
            ["Đặt lịch bằng tài khoản", "Đăng nhập tài khoản bệnh nhân trước khi đặt lịch để theo dõi trạng thái tại Lịch hẹn của tôi và sử dụng các chức năng được cấp cho tài khoản."],
            ["Bảo vệ thông tin cá nhân", "Hồ sơ khám và kết quả xét nghiệm yêu cầu đăng nhập. Không chia sẻ mật khẩu và hãy đăng xuất khi sử dụng thiết bị dùng chung."],
        ],
    },
];

export const FAQS = [
    ["Tôi có cần tài khoản để đăng ký khám không?", "Bạn có thể gửi đăng ký với tư cách khách. Nếu muốn quản lý lịch hẹn trực tuyến, hãy đăng nhập tài khoản bệnh nhân trước khi đặt lịch."],
    ["Gửi đăng ký có nghĩa là lịch đã được xác nhận?", "Lịch mới gửi ở trạng thái Chờ xác nhận. Vui lòng đợi phòng khám liên hệ xác nhận qua số điện thoại đã cung cấp."],
    ["Tôi muốn đổi hoặc hủy lịch đã đăng ký với tư cách khách?", "Hãy liên hệ tổng đài và cung cấp mã lịch hẹn. Các lịch được đặt bằng tài khoản có thể theo dõi trong Lịch hẹn của tôi."],
    ["Vì sao không có giờ khám trong ngày tôi chọn?", "Bác sĩ có thể chưa có lịch được công bố hoặc các giờ khám đã được đặt. Hãy chọn ngày khác, bác sĩ khác hoặc liên hệ tổng đài để được hỗ trợ."],
];
