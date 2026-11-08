export function clinicToday(now = new Date()) {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit",
    }).formatToParts(now);
    const value = type => parts.find(part => part.type === type).value;
    return `${value("year")}-${value("month")}-${value("day")}`;
}

export function validateGuestBooking(values, today = clinicToday()) {
    const errors = {};
    if (!values.departmentId) errors.departmentId = "Vui lòng chọn chuyên khoa.";
    if (!values.doctorId) errors.doctorId = "Vui lòng chọn bác sĩ.";
    const parsed = new Date(`${values.date}T00:00:00Z`);
    const validDate = /^\d{4}-\d{2}-\d{2}$/.test(values.date) && !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === values.date;
    if (!validDate || values.date < today) errors.date = "Vui lòng chọn ngày khám từ hôm nay.";
    if (!values.startTime) errors.startTime = "Vui lòng chọn giờ khám còn trống.";
    if (!values.patientName.trim() || values.patientName.trim().length > 100) errors.patientName = "Vui lòng nhập họ tên, tối đa 100 ký tự.";
    if (!/^(?:0\d{9}|\+84\d{9})$/.test(values.patientPhone.trim())) errors.patientPhone = "Nhập số điện thoại 10 chữ số hoặc dạng +84.";
    if (!values.reason.trim() || values.reason.trim().length > 500) errors.reason = "Vui lòng nhập lý do khám, tối đa 500 ký tự.";
    if (!values.consent) errors.consent = "Vui lòng đồng ý để phòng khám liên hệ xác nhận lịch khám.";
    return errors;
}
