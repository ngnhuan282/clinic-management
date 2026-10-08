// src/utils/errorHandler.js

const API_ERROR_MESSAGES = {
    2007: "Bạn không thể tự khóa tài khoản hoặc đổi vai trò của mình.",
    2008: "Hệ thống cần ít nhất một quản trị viên đang hoạt động.",
    2009: "Quyền tài khoản vừa thay đổi. Vui lòng tải lại và thử lại.",
    9999: "Đã có lỗi không xác định. Vui lòng thử lại.",
    1001: "Yêu cầu không hợp lệ.",
    1002: "Bạn chưa đăng nhập.",
    1003: "Bạn không có quyền thực hiện thao tác này.",
    2001: "Tài khoản đã tồn tại.",
    2002: "Không tìm thấy người dùng.",
    2003: "Tên đăng nhập hoặc mật khẩu không đúng.",
    2004: "Tài khoản đã bị khóa.",
    2005: "Không tìm thấy vai trò.",
    2006: "Email đã tồn tại.",
    3001: "Không tìm thấy bác sĩ.",
    4001: "Không tìm thấy bệnh nhân.",
    4006: "Số sổ đã được sử dụng hoặc bệnh nhân đã có sổ đang sử dụng.",
    4009: "Số CCCD này đã thuộc về bệnh nhân khác.",
    5001: "Không tìm thấy lịch hẹn.",
    5002: "Bác sĩ đã có lịch hẹn trong khung giờ này.",
    5003: "Trạng thái lịch hẹn không hợp lệ.",
    6001: "Không tìm thấy thuốc.",
    6002: "Không tìm thấy danh mục thuốc.",
    6003: "Không tìm thấy nhà cung cấp.",
    6004: "Tên thuốc đã tồn tại.",
    6005: "Thuốc đã có dữ liệu tồn kho nên không thể xóa.",
    6006: "Tên danh mục thuốc đã tồn tại.",
    6007: "Danh mục đã có thuốc nên không thể xóa.",
    6008: "Tên nhà cung cấp đã tồn tại.",
    6009: "Nhà cung cấp đã liên kết thuốc nên không thể xóa.",
    6010: "Không tìm thấy lô tồn kho.",
    6011: "Lô tồn kho đã tồn tại cho thuốc và hạn dùng này.",
    7001: "Không tìm thấy bệnh.",
    7002: "Mã bệnh đã tồn tại.",
    7003: "Tên bệnh đã tồn tại.",
    7004: "Bệnh đã được dùng trong hồ sơ chẩn đoán nên không thể xóa.",
    7005: "Bệnh đang tạm ngưng.",
    7101: "Không tìm thấy hồ sơ bệnh án.",
    7102: "Lượt khám này đã có hồ sơ bệnh án.",
    7103: "Không tìm thấy sổ khám giấy.",
    7104: "Cần có sổ khám giấy trước khi hoàn tất khám.",
    7105: "Cần xác nhận đã ghi sổ giấy trước khi hoàn tất khám.",
    7106: "Trạng thái sổ khám giấy không hợp lệ.",
    7401: "Không tìm thấy đơn thuốc.",
    7402: "Hồ sơ bệnh án này đã có đơn thuốc.",
    7403: "Trạng thái đơn thuốc không hợp lệ.",
    7301: "Bác sĩ hoặc phòng đã có lịch trong khoảng thời gian này.",
    7302: "Không tìm thấy yêu cầu đăng ký lịch.",
    7303: "Yêu cầu này không còn ở trạng thái chờ duyệt.",
};

const API_MESSAGE_TRANSLATIONS = {
    "Cannot connect to the server.":
        "Không thể kết nối tới máy chủ.",
    "Invalid request.": "Yêu cầu không hợp lệ.",
    "You are not authenticated.": "Bạn chưa đăng nhập.",
    "You do not have permission.":
        "Bạn không có quyền thực hiện thao tác này.",
    "The requested resource was not found.":
        "Không tìm thấy dữ liệu yêu cầu.",
    "This operation conflicts with existing data.":
        "Thao tác bị trùng hoặc xung đột với dữ liệu hiện có.",
    "Internal server error.":
        "Máy chủ đang gặp lỗi. Vui lòng thử lại sau.",
    "Medicine name already exists": "Tên thuốc đã tồn tại.",
    "Medicine category name already exists":
        "Tên danh mục thuốc đã tồn tại.",
    "Supplier name already exists":
        "Tên nhà cung cấp đã tồn tại.",
    "Inventory batch already exists for this medicine and expiry date":
        "Lô tồn kho đã tồn tại cho thuốc và hạn dùng này.",
    "Disease not found": "Không tìm thấy bệnh.",
    "Disease code already exists": "Mã bệnh đã tồn tại.",
    "Disease name already exists": "Tên bệnh đã tồn tại.",
    "Disease already has medical record diagnoses":
        "Bệnh đã được dùng trong hồ sơ chẩn đoán nên không thể xóa.",
    "Disease is inactive": "Bệnh đang tạm ngưng.",
    "Medical record not found": "Không tìm thấy hồ sơ bệnh án.",
    "Medical record already exists for this appointment":
        "Lượt khám này đã có hồ sơ bệnh án.",
    "Patient book not found": "Không tìm thấy sổ khám giấy.",
    "Patient book is required before completing the examination":
        "Cần có sổ khám giấy trước khi hoàn tất khám.",
    "Paper book update confirmation is required before completing the examination":
        "Cần xác nhận đã ghi sổ giấy trước khi hoàn tất khám.",
    "Patient book status is invalid":
        "Trạng thái sổ khám giấy không hợp lệ.",
    "Prescription not found": "Không tìm thấy đơn thuốc.",
    "Prescription already exists for this medical record":
        "Hồ sơ bệnh án này đã có đơn thuốc.",
    "Invalid prescription status":
        "Trạng thái đơn thuốc không hợp lệ.",
};

function translateMessage(message) {
    return API_MESSAGE_TRANSLATIONS[message] || message;
}

export function getApiErrorMessage(
    error,
    fallback = "Đã có lỗi xảy ra."
) {
    const response = error?.response;

    if (!response) {
        return "Không thể kết nối tới máy chủ.";
    }

    const data = response.data;

    if (data?.code && API_ERROR_MESSAGES[data.code]) {
        return API_ERROR_MESSAGES[data.code];
    }

    if (typeof data?.message === "string") {
        return translateMessage(data.message);
    }

    if (typeof data?.title === "string") {
        return translateMessage(data.title);
    }

    if (data?.errors) {
        if (Array.isArray(data.errors)) {
            return data.errors
                .map(translateMessage)
                .join(", ");
        }

        if (
            typeof data.errors === "object"
        ) {
            return Object.values(data.errors)
                .flat()
                .map(translateMessage)
                .join(", ");
        }
    }

    switch (response.status) {
        case 400:
            return "Yêu cầu không hợp lệ.";

        case 401:
            return "Bạn chưa đăng nhập.";

        case 403:
            return "Bạn không có quyền thực hiện thao tác này.";

        case 404:
            return "Không tìm thấy dữ liệu yêu cầu.";

        case 409:
            return "Thao tác bị trùng hoặc xung đột với dữ liệu hiện có.";

        case 500:
            return "Máy chủ đang gặp lỗi. Vui lòng thử lại sau.";

        default:
            return fallback;
    }
}

export default getApiErrorMessage;
