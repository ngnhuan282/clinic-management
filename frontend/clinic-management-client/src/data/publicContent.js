// Shared clinic fallback defaults; runtime values are loaded from /api/public/clinic-settings.
const LEGACY_CLINIC_NAMES = new Set([
    "clinicmanagementsystem",
    "clinic management system",
    "medclinic",
    "mediflow",
]);

const LEGACY_CLINIC_EMAILS = new Set([
    "contact@medclinic-system.vn",
]);

export function resolveClinicName(value, fallback = "Phòng khám Đa khoa") {
    const trimmed = String(value || "").trim();
    if (!trimmed) return fallback;
    if (LEGACY_CLINIC_NAMES.has(trimmed.toLowerCase())) return fallback;
    return trimmed;
}

function resolveClinicEmail(value, fallback = "lienhe@phongkhamdakhoa.vn") {
    const trimmed = String(value || "").trim();
    if (!trimmed) return fallback;
    if (LEGACY_CLINIC_EMAILS.has(trimmed.toLowerCase())) return fallback;
    return trimmed;
}

export const CLINIC = {
    name: "Phòng khám Đa khoa",
    tagline: "Hệ thống quản lý phòng khám đa khoa",
    description: "Kết nối người bệnh với các chuyên khoa, bác sĩ uy tín và dịch vụ y tế chuẩn mực. Lựa chọn giờ khám và nhận hỗ trợ nhanh chóng.",
    phone: "1900 6868",
    phoneHref: "tel:19006868",
    email: "lienhe@phongkhamdakhoa.vn",
    hours: "07:30 – 20:00, Thứ Hai – Chủ Nhật",
    defaultExaminationFee: 150000,
    patientBookFee: 10000,
    defaultSlotDurationMinutes: 30,
    locations: [
        { name: "Cơ sở TP. Hồ Chí Minh", address: "128 Nguyễn Trãi, Quận 1, TP. Hồ Chí Minh" },
        { name: "Cơ sở Hà Nội", address: "54 Tràng Thi, Hoàn Kiếm, Hà Nội" },
    ],
};

export function toPhoneHref(phone) {
    const cleaned = String(phone || "").replace(/[^\d+]/g, "");
    return cleaned ? `tel:${cleaned}` : CLINIC.phoneHref;
}

export function normalizeClinicInfo(settings) {
    if (!settings) return CLINIC;
    const locations = Array.isArray(settings.locations) && settings.locations.length > 0
        ? settings.locations.filter(item => item?.name && item?.address)
        : [
            settings.primaryLocationName && settings.primaryLocationAddress
                ? { name: settings.primaryLocationName, address: settings.primaryLocationAddress }
                : null,
            settings.secondaryLocationName && settings.secondaryLocationAddress
                ? { name: settings.secondaryLocationName, address: settings.secondaryLocationAddress }
                : null,
        ].filter(Boolean);
    const phone = settings.phone?.trim() || CLINIC.phone;
    return {
        name: resolveClinicName(settings.clinicName, CLINIC.name),
        tagline: settings.tagline?.trim() || CLINIC.tagline,
        description: settings.description?.trim() || CLINIC.description,
        phone,
        phoneHref: toPhoneHref(phone),
        email: resolveClinicEmail(settings.email, CLINIC.email),
        hours: settings.workingHours?.trim() || CLINIC.hours,
        defaultExaminationFee: Number(settings.defaultExaminationFee) > 0
            ? Number(settings.defaultExaminationFee)
            : CLINIC.defaultExaminationFee,
        patientBookFee: Number(settings.patientBookFee) > 0
            ? Number(settings.patientBookFee)
            : CLINIC.patientBookFee,
        defaultSlotDurationMinutes: Number(settings.defaultSlotDurationMinutes) > 0
            ? Number(settings.defaultSlotDurationMinutes)
            : CLINIC.defaultSlotDurationMinutes,
        locations: locations.length > 0 ? locations : CLINIC.locations,
    };
}

export function validateClinicSettings(values) {
    const errors = {};
    const text = (key, max, label) => {
        const val = String(values?.[key] ?? "").trim();
        if (!val) errors[key] = `Vui lòng nhập ${label}.`;
        else if (val.length > max) errors[key] = `Tối đa ${max} ký tự.`;
    };
    text("clinicName", 150, "tên phòng khám");
    text("tagline", 200, "khẩu hiệu phòng khám");
    text("description", 600, "mô tả giới thiệu");
    text("workingHours", 150, "giờ làm việc");
    text("primaryLocationName", 150, "tên cơ sở chính");
    text("primaryLocationAddress", 255, "địa chỉ cơ sở chính");

    const phone = String(values?.phone ?? "").trim();
    const digits = phone.replace(/\D/g, "");
    if (!phone) errors.phone = "Vui lòng nhập số tổng đài.";
    else if (phone.length > 30 || digits.length < 6 || digits.length > 15 || !/^[\d\s+\-()]+$/.test(phone)) {
        errors.phone = "Số điện thoại gồm 6–15 chữ số, có thể chứa dấu +, khoảng trắng hoặc dấu gạch ngang.";
    }

    const email = String(values?.email ?? "").trim();
    if (!email) errors.email = "Vui lòng nhập email liên hệ.";
    else if (email.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.email = "Email liên hệ không hợp lệ.";
    }

    const secName = String(values?.secondaryLocationName ?? "").trim();
    const secAddr = String(values?.secondaryLocationAddress ?? "").trim();
    if (secName.length > 150) errors.secondaryLocationName = "Tối đa 150 ký tự.";
    if (secAddr.length > 255) errors.secondaryLocationAddress = "Tối đa 255 ký tự.";
    if (Boolean(secName) !== Boolean(secAddr)) {
        if (!secName) errors.secondaryLocationName = "Nhập tên cơ sở phụ hoặc xóa địa chỉ cơ sở phụ.";
        if (!secAddr) errors.secondaryLocationAddress = "Nhập địa chỉ cơ sở phụ hoặc xóa tên cơ sở phụ.";
    }

    const examFee = Number(values?.defaultExaminationFee);
    if (!Number.isFinite(examFee) || examFee <= 0 || examFee > 100000000) {
        errors.defaultExaminationFee = "Giá khám mặc định phải lớn hơn 0 và không vượt quá 100.000.000 đ.";
    }

    const bookFee = Number(values?.patientBookFee);
    if (!Number.isFinite(bookFee) || bookFee <= 0 || bookFee > 10000000) {
        errors.patientBookFee = "Giá sổ khám phải lớn hơn 0 và không vượt quá 10.000.000 đ.";
    }

    const slotMinutes = Number(values?.defaultSlotDurationMinutes);
    if (![15, 20, 30].includes(slotMinutes)) {
        errors.defaultSlotDurationMinutes = "Thời lượng mỗi khung giờ khám phải là 15, 20 hoặc 30 phút.";
    }

    const slotCap = Number(values?.defaultMaxPatientsPerSlot);
    if (!Number.isInteger(slotCap) || slotCap < 1 || slotCap > 20) {
        errors.defaultMaxPatientsPerSlot = "Số bệnh nhân tối đa mỗi khung giờ phải từ 1 đến 20.";
    }

    const lowStock = Number(values?.lowStockThreshold);
    if (!Number.isInteger(lowStock) || lowStock < 1 || lowStock > 10000) {
        errors.lowStockThreshold = "Ngưỡng cảnh báo tồn kho thấp phải từ 1 đến 10.000.";
    }

    const nearExpiry = Number(values?.nearExpiryDays);
    if (!Number.isInteger(nearExpiry) || nearExpiry < 1 || nearExpiry > 365) {
        errors.nearExpiryDays = "Số ngày cảnh báo gần hết hạn phải từ 1 đến 365 ngày.";
    }

    return errors;
}

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
