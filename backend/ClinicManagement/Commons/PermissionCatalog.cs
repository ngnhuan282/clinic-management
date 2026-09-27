namespace ClinicManagement.Commons;

public static class PermissionCodes
{
    public const string AccountsView = "accounts.view";
    public const string AccountsCreate = "accounts.create";
    public const string AccountsUpdate = "accounts.update";
    public const string AccountsAssignRole = "accounts.assignRole";
    public const string AccountsManageRoles = "accounts.manageRoles";
    public const string CatalogManage = "catalog.manage";
    public const string SchedulesManage = "schedules.manage";
    public const string AppointmentsView = "appointments.view";
    public const string AppointmentsViewOwn = "appointments.viewOwn";
    public const string AppointmentsBookSelf = "appointments.bookSelf";
    public const string AppointmentsCreateWalkIn = "appointments.createWalkIn";
    public const string AppointmentsCancelOwn = "appointments.cancelOwn";
    public const string AppointmentsConfirm = "appointments.confirm";
    public const string AppointmentsReschedule = "appointments.reschedule";
    public const string AppointmentsCheckIn = "appointments.checkIn";
    public const string AppointmentsStartExamination = "appointments.startExamination";
    public const string ClinicalViewAssigned = "clinical.viewAssigned";
    public const string ClinicalViewOwn = "clinical.viewOwn";
    public const string ClinicalWriteRecord = "clinical.writeRecord";
    public const string ClinicalEditDiagnosis = "clinical.editDiagnosis";
    public const string ClinicalManageDiseases = "clinical.manageDiseases";
    public const string PharmacyViewInventory = "pharmacy.viewInventory";
    public const string PharmacyManageInventory = "pharmacy.manageInventory";
    public const string PharmacyViewCatalog = "pharmacy.viewCatalog";
    public const string PharmacyManageCatalog = "pharmacy.manageCatalog";
    public const string PharmacyPrescribe = "pharmacy.prescribe";
    public const string PharmacyDispense = "pharmacy.dispense";
    public const string PharmacyViewOwnPrescription = "pharmacy.viewOwnPrescription";
    public const string LabsViewTypes = "labs.viewTypes";
    public const string LabsManageTypes = "labs.manageTypes";
    public const string LabsViewOrders = "labs.viewOrders";
    public const string LabsViewPending = "labs.viewPending";
    public const string LabsOrder = "labs.order";
    public const string LabsStart = "labs.start";
    public const string LabsEnterResult = "labs.enterResult";
    public const string LabsViewOwnResult = "labs.viewOwnResult";
    public const string BillingView = "billing.view";
    public const string BillingCreate = "billing.create";
    public const string BillingRecordPayment = "billing.recordPayment";
    public const string BillingViewOwn = "billing.viewOwn";
    public const string ReportsOperations = "reports.operations";
    public const string ReportsRevenue = "reports.revenue";
}

public record PermissionDefinition(string Code, string Module, string Name, string Kind, string? Scope = null,
    bool IsImplemented = true);

public static class PermissionCatalog
{
    public static readonly PermissionDefinition[] All =
    [
        new(PermissionCodes.AccountsView, "Tài khoản", "Xem tài khoản", "Xem"),
        new(PermissionCodes.AccountsCreate, "Tài khoản", "Tạo tài khoản nhân viên", "Tạo", IsImplemented: false),
        new(PermissionCodes.AccountsUpdate, "Tài khoản", "Khóa hoặc mở khóa tài khoản", "Sửa"),
        new(PermissionCodes.AccountsAssignRole, "Tài khoản", "Gán vai trò", "Phân quyền"),
        new(PermissionCodes.AccountsManageRoles, "Tài khoản", "Quản lý vai trò và quyền", "Phân quyền"),
        new(PermissionCodes.CatalogManage, "Danh mục", "Quản lý khoa, chuyên khoa và phòng", "Sửa"),
        new(PermissionCodes.SchedulesManage, "Lịch bác sĩ", "Tạo lịch bác sĩ", "Tạo"),
        new(PermissionCodes.AppointmentsView, "Lịch hẹn", "Xem lịch tiếp nhận", "Xem"),
        new(PermissionCodes.AppointmentsViewOwn, "Lịch hẹn", "Xem lịch của bản thân", "Xem", "Chỉ lịch của bệnh nhân đăng nhập", false),
        new(PermissionCodes.AppointmentsBookSelf, "Lịch hẹn", "Đặt lịch cho bản thân", "Tạo", "Chỉ tạo lịch của bệnh nhân đăng nhập"),
        new(PermissionCodes.AppointmentsCreateWalkIn, "Lịch hẹn", "Tiếp nhận walk-in", "Tạo"),
        new(PermissionCodes.AppointmentsCancelOwn, "Lịch hẹn", "Hủy lịch của bản thân", "Nghiệp vụ", IsImplemented: false),
        new(PermissionCodes.AppointmentsConfirm, "Lịch hẹn", "Xác nhận lịch", "Nghiệp vụ"),
        new(PermissionCodes.AppointmentsReschedule, "Lịch hẹn", "Đổi hoặc hủy lịch", "Nghiệp vụ"),
        new(PermissionCodes.AppointmentsCheckIn, "Lịch hẹn", "Check-in bệnh nhân", "Nghiệp vụ", IsImplemented: false),
        new(PermissionCodes.AppointmentsStartExamination, "Lịch hẹn", "Bắt đầu khám", "Nghiệp vụ"),
        new(PermissionCodes.ClinicalViewAssigned, "Khám bệnh", "Xem hồ sơ trong phạm vi được giao", "Xem", "Chỉ hồ sơ thuộc lượt khám được giao"),
        new(PermissionCodes.ClinicalViewOwn, "Khám bệnh", "Xem bệnh án bản thân", "Xem", "Chỉ hồ sơ của bệnh nhân đăng nhập", false),
        new(PermissionCodes.ClinicalWriteRecord, "Khám bệnh", "Lập bệnh án", "Tạo"),
        new(PermissionCodes.ClinicalEditDiagnosis, "Khám bệnh", "Cập nhật chẩn đoán", "Sửa"),
        new(PermissionCodes.ClinicalManageDiseases, "Khám bệnh", "Quản lý danh mục bệnh", "Sửa"),
        new(PermissionCodes.PharmacyViewInventory, "Đơn thuốc và kho", "Xem tồn kho", "Xem"),
        new(PermissionCodes.PharmacyManageInventory, "Đơn thuốc và kho", "Nhập và điều chỉnh tồn", "Sửa"),
        new(PermissionCodes.PharmacyViewCatalog, "Đơn thuốc và kho", "Xem danh mục thuốc", "Xem"),
        new(PermissionCodes.PharmacyManageCatalog, "Đơn thuốc và kho", "Quản lý danh mục thuốc", "Sửa"),
        new(PermissionCodes.PharmacyPrescribe, "Đơn thuốc và kho", "Kê đơn", "Tạo", IsImplemented: false),
        new(PermissionCodes.PharmacyDispense, "Đơn thuốc và kho", "Xác nhận cấp thuốc", "Nghiệp vụ", IsImplemented: false),
        new(PermissionCodes.PharmacyViewOwnPrescription, "Đơn thuốc và kho", "Xem đơn thuốc bản thân", "Xem", IsImplemented: false),
        new(PermissionCodes.LabsViewTypes, "Xét nghiệm", "Xem loại xét nghiệm", "Xem"),
        new(PermissionCodes.LabsManageTypes, "Xét nghiệm", "Quản lý loại xét nghiệm", "Sửa"),
        new(PermissionCodes.LabsViewOrders, "Xét nghiệm", "Xem chỉ định và kết quả", "Xem", "Theo phạm vi công việc hoặc bệnh nhân"),
        new(PermissionCodes.LabsViewPending, "Xét nghiệm", "Xem hàng chờ thực hiện", "Xem"),
        new(PermissionCodes.LabsOrder, "Xét nghiệm", "Chỉ định xét nghiệm", "Tạo"),
        new(PermissionCodes.LabsStart, "Xét nghiệm", "Nhận thực hiện xét nghiệm", "Nghiệp vụ", IsImplemented: false),
        new(PermissionCodes.LabsEnterResult, "Xét nghiệm", "Nhập kết quả", "Nghiệp vụ"),
        new(PermissionCodes.LabsViewOwnResult, "Xét nghiệm", "Xem kết quả bản thân", "Xem", "Chỉ kết quả của bệnh nhân đăng nhập"),
        new(PermissionCodes.BillingView, "Hóa đơn và thanh toán", "Xem hóa đơn", "Xem", "Theo công việc được giao", false),
        new(PermissionCodes.BillingCreate, "Hóa đơn và thanh toán", "Lập hóa đơn", "Tạo", IsImplemented: false),
        new(PermissionCodes.BillingRecordPayment, "Hóa đơn và thanh toán", "Ghi nhận thanh toán", "Nghiệp vụ", IsImplemented: false),
        new(PermissionCodes.BillingViewOwn, "Hóa đơn và thanh toán", "Xem hóa đơn bản thân", "Xem", "Chỉ hóa đơn của bệnh nhân đăng nhập", false),
        new(PermissionCodes.ReportsOperations, "Báo cáo", "Xem báo cáo lượt khám", "Xem", IsImplemented: false),
        new(PermissionCodes.ReportsRevenue, "Báo cáo", "Xem báo cáo doanh thu", "Xem", IsImplemented: false),
    ];

    public static readonly IReadOnlyDictionary<string, string[]> DefaultRoles = new Dictionary<string, string[]>
    {
        [RoleConstants.Admin] = All.Select(x => x.Code).Where(x => x != PermissionCodes.ClinicalViewOwn
            && x != PermissionCodes.AppointmentsViewOwn && x != PermissionCodes.AppointmentsBookSelf
            && x != PermissionCodes.AppointmentsCancelOwn && x != PermissionCodes.PharmacyViewOwnPrescription
            && x != PermissionCodes.LabsViewOwnResult && x != PermissionCodes.BillingViewOwn
            && x != PermissionCodes.LabsOrder && x != PermissionCodes.LabsEnterResult
            && x != PermissionCodes.LabsViewPending).ToArray(),
        [RoleConstants.Doctor] = [PermissionCodes.AppointmentsStartExamination, PermissionCodes.ClinicalViewAssigned,
            PermissionCodes.ClinicalWriteRecord, PermissionCodes.ClinicalEditDiagnosis, PermissionCodes.ClinicalManageDiseases,
            PermissionCodes.PharmacyViewInventory, PermissionCodes.PharmacyViewCatalog,
            PermissionCodes.PharmacyPrescribe, PermissionCodes.LabsViewTypes, PermissionCodes.LabsViewOrders, PermissionCodes.LabsOrder],
        [RoleConstants.Receptionist] = [PermissionCodes.AppointmentsView, PermissionCodes.AppointmentsCreateWalkIn,
            PermissionCodes.AppointmentsConfirm, PermissionCodes.AppointmentsReschedule, PermissionCodes.AppointmentsCheckIn,
            PermissionCodes.PharmacyDispense, PermissionCodes.BillingView, PermissionCodes.BillingCreate,
            PermissionCodes.BillingRecordPayment],
        [RoleConstants.LabTechnician] = [PermissionCodes.LabsViewOrders, PermissionCodes.LabsViewPending,
            PermissionCodes.LabsStart, PermissionCodes.LabsEnterResult],
        [RoleConstants.Patient] = [PermissionCodes.AppointmentsViewOwn, PermissionCodes.AppointmentsBookSelf,
            PermissionCodes.AppointmentsCancelOwn, PermissionCodes.ClinicalViewOwn,
            PermissionCodes.PharmacyViewOwnPrescription, PermissionCodes.LabsViewOrders,
            PermissionCodes.LabsViewOwnResult, PermissionCodes.BillingViewOwn],
    };

    public static readonly string[] AdminRequired =
        [PermissionCodes.AccountsView, PermissionCodes.AccountsAssignRole, PermissionCodes.AccountsManageRoles];
}
