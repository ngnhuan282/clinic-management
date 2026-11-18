import { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Chip,
    LinearProgress,
    Paper,
    Stack,
    Typography,
} from "@mui/material";
import {
    AccountCircleRounded,
    AdminPanelSettingsRounded,
    ArrowForwardRounded,
    AssignmentIndRounded,
    BarChartRounded,
    BiotechRounded,
    CalendarMonthRounded,
    DashboardRounded,
    DomainRounded,
    EditCalendarRounded,
    EventAvailableRounded,
    EventNoteRounded,
    FactCheckRounded,
    Inventory2Rounded,
    LocalPharmacyRounded,
    ManageAccountsRounded,
    MedicalInformationRounded,
    MedicalServicesRounded,
    MeetingRoomRounded,
    MenuBookRounded,
    MedicationRounded,
    PaymentsRounded,
    ScienceRounded,
    SettingsRounded,
    ShieldOutlined,
    StarOutlineRounded,
    WarningAmberRounded,
} from "@mui/icons-material";
import { Link } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import ClinicPageHeader, { AdminStatCard } from "../../components/common/ClinicPageHeader";
import {
    AdminRefreshIcon,
    adminAccents,
    clinicColors,
    clinicSecondaryButtonSx,
    clinicSurfaceSx,
} from "../../components/common/clinicUi";
import useAuth from "../../hooks/useAuth";
import { INTERNAL_PAGES, ROLE_LABELS, canSeePage } from "../../routes/roleAccess";
import getApiErrorMessage from "../../utils/errorHandler";

const formatCurrency = (value) =>
    new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(value ?? 0);

const formatNumber = (value) =>
    new Intl.NumberFormat("vi-VN").format(value ?? 0);

const PAGE_CARD_META = {
    "/internal/appointments": { icon: EventAvailableRounded, tone: "blue", desc: "Tiếp nhận, xác nhận lịch khám trực tuyến và check-in tại quầy." },
    "/internal/patient-books": { icon: MenuBookRounded, tone: "teal", desc: "Quản lý cấp mới, đối chiếu và cấp lại sổ khám bệnh giấy." },
    "/internal/cashier/billing": { icon: PaymentsRounded, tone: "emerald", desc: "Thu phí khám, xét nghiệm, tính BHYT và lập chứng từ điều chỉnh." },
    "/internal/examinations": { icon: MedicalServicesRounded, tone: "blue", desc: "Theo dõi hàng chờ khám, ghi nhận sinh hiệu, chẩn đoán và kê đơn." },
    "/internal/doctor/lab-orders": { icon: BiotechRounded, tone: "sky", desc: "Chỉ định xét nghiệm cận lâm sàng và xem kết quả trả về theo thời gian thực." },
    "/internal/technician/lab-queue": { icon: ScienceRounded, tone: "purple", desc: "Tiếp nhận mẫu xét nghiệm đã thanh toán và cập nhật kết quả." },
    "/internal/doctor/stock-reviews": { icon: FactCheckRounded, tone: "amber", desc: "Phản hồi và điều chỉnh đơn thuốc khi kho dược báo thiếu tồn." },
    "/internal/doctor/schedule-requests": { icon: EditCalendarRounded, tone: "teal", desc: "Đăng ký ca trực và theo dõi trạng thái phê duyệt." },
    "/internal/department-schedules": { icon: EventNoteRounded, tone: "sky", desc: "Xem lịch trực đã phê duyệt của các bác sĩ và buồng khám trong khoa." },
    "/internal/department-statistics": { icon: BarChartRounded, tone: "purple", desc: "Thống kê lượt khám và tiến độ duyệt ca trực của khoa phụ trách." },
    "/internal/doctor-schedules": { icon: CalendarMonthRounded, tone: "blue", desc: "Sắp xếp ca trực bác sĩ theo tuần, phòng khám và khung giờ nhận bệnh." },
    "/internal/schedule-requests": { icon: FactCheckRounded, tone: "amber", desc: "Xem xét, phê duyệt hoặc từ chối yêu cầu đăng ký lịch trực." },
    "/internal/departments": { icon: DomainRounded, tone: "blue", desc: "Quản lý danh mục khoa chuyên môn và trạng thái hoạt động." },
    "/internal/specializations": { icon: MedicalInformationRounded, tone: "sky", desc: "Cấu hình chuyên khoa trực thuộc từng khoa lâm sàng." },
    "/internal/rooms": { icon: MeetingRoomRounded, tone: "teal", desc: "Quản lý buồng khám, vị trí tầng và phân bổ khoa phụ trách." },
    "/internal/diseases": { icon: MedicalInformationRounded, tone: "purple", desc: "Danh mục mã bệnh ICD và tên bệnh chuẩn hóa cho hồ sơ bệnh án." },
    "/internal/lab-test-types": { icon: ScienceRounded, tone: "sky", desc: "Danh mục dịch vụ xét nghiệm, đơn giá và trạng thái triển khai." },
    "/internal/pharmacy/dispensing": { icon: LocalPharmacyRounded, tone: "emerald", desc: "Đối chiếu hóa đơn, xuất thuốc theo FEFO và gửi yêu cầu rà soát." },
    "/internal/medicines": { icon: MedicationRounded, tone: "emerald", desc: "Quản lý thuốc, danh mục, nhà cung cấp, tồn kho và phiếu nhập lô." },
    "/internal/pharmacy/inventory": { icon: Inventory2Rounded, tone: "teal", desc: "Tra cứu số lượng tồn khả dụng, hạn dùng và cảnh báo lô thuốc." },
    "/internal/users": { icon: ManageAccountsRounded, tone: "blue", desc: "Quản lý tài khoản nhân sự, gán vai trò, liên kết bác sĩ và xuất CSV." },
    "/internal/roles-permissions": { icon: AdminPanelSettingsRounded, tone: "purple", desc: "Thiết lập ma trận phân quyền chi tiết và nhật ký kiểm toán RBAC." },
    "/internal/reviews": { icon: StarOutlineRounded, tone: "amber", desc: "Tổng hợp điểm hài lòng theo bác sĩ và kiểm duyệt nhận xét công khai." },
    "/internal/settings": { icon: SettingsRounded, tone: "blue", desc: "Cấu hình thông tin phòng khám, giá khám mặc định, giá sổ và ngưỡng kho." },
    "/internal/doctor/profile": { icon: AssignmentIndRounded, tone: "sky", desc: "Cập nhật học hàm, học vị, kinh nghiệm và tiểu sử hiển thị công khai." },
    "/internal/profile": { icon: AccountCircleRounded, tone: "teal", desc: "Cập nhật họ tên, email và số điện thoại liên hệ của tài khoản." },
};

export default function DashboardPage() {
    const { user, role, userId } = useAuth();
    const isAdmin = role === "Admin";

    const pages = useMemo(
        () =>
            INTERNAL_PAGES.filter(
                (page) => canSeePage(user, page) && !page.path.endsWith("dashboard")
            ),
        [user]
    );

    const groupedModules = useMemo(() => {
        const groups = [];
        const map = new Map();
        pages.forEach((page) => {
            const groupName = page.group || "Chức năng nghiệp vụ";
            if (!map.has(groupName)) {
                const section = { title: groupName, items: [] };
                map.set(groupName, section);
                groups.push(section);
            }
            map.get(groupName).items.push(page);
        });
        return groups;
    }, [pages]);

    const [state, setState] = useState(null);
    const [revision, setRevision] = useState(0);
    const requestKey = JSON.stringify({ userId, isAdmin, revision });
    const visible = state?.requestKey === requestKey ? state : null;
    const summary = visible?.summary;
    const loading = isAdmin && !visible;
    const error = visible?.error;
    const loadDashboard = () => setRevision((value) => value + 1);

    useEffect(() => {
        if (!JSON.parse(requestKey).isAdmin) return undefined;
        const controller = new AbortController();
        axiosClient
            .get("/admin-dashboard/summary", { signal: controller.signal })
            .then((response) => {
                if (!controller.signal.aborted) {
                    const data = response.data?.result ?? response.data;
                    setState({ requestKey, summary: data });
                }
            })
            .catch((err) => {
                if (!controller.signal.aborted && err.name !== "CanceledError") {
                    setState({
                        requestKey,
                        error: getApiErrorMessage(
                            err,
                            "Không thể tải dữ liệu tổng quan phòng khám."
                        ),
                    });
                }
            });
        return () => controller.abort();
    }, [requestKey]);

    const appointmentStats = summary?.appointments;
    const revenueStats = summary?.revenue;
    const inventoryStats = summary?.inventory;

    const totalRevenue = Number(revenueStats?.totalThisMonth || 0);
    const patientPaid = Number(revenueStats?.patientPaymentsThisMonth || 0);
    const insurancePaid = Number(revenueStats?.insurancePaymentsThisMonth || 0);
    const patientRatio = totalRevenue > 0 ? Math.min(100, Math.round((patientPaid / totalRevenue) * 100)) : 0;
    const insuranceRatio = totalRevenue > 0 ? Math.max(0, 100 - patientRatio) : 0;

    return (
        <Stack spacing={3.5} sx={{ pb: 4, minWidth: 0 }}>
            <ClinicPageHeader
                eyebrow={`Không gian làm việc · ${ROLE_LABELS[role] || role}`}
                title={`Xin chào, ${user?.fullName || "bạn"}`}
                description="Theo dõi nhanh chỉ số vận hành trong ngày và truy cập trực tiếp các phân hệ nghiệp vụ theo quyền hạn được cấp."
                icon={DashboardRounded}
                actions={
                    isAdmin ? (
                        <Button
                            variant="outlined"
                            startIcon={<AdminRefreshIcon />}
                            onClick={loadDashboard}
                            disabled={loading}
                            sx={clinicSecondaryButtonSx}
                        >
                            Làm mới dữ liệu
                        </Button>
                    ) : null
                }
            />

            {isAdmin && (
                <Stack spacing={2.5}>
                    {error && (
                        <Alert
                            severity="error"
                            action={
                                <Button color="inherit" size="small" onClick={loadDashboard}>
                                    Thử lại
                                </Button>
                            }
                            sx={{ borderRadius: "12px" }}
                        >
                            {error}
                        </Alert>
                    )}

                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: {
                                xs: "1fr",
                                sm: "repeat(2, minmax(0, 1fr))",
                                xl: "repeat(4, minmax(0, 1fr))",
                            },
                            gap: 2.25,
                        }}
                    >
                        <AdminStatCard
                            title="Doanh thu tháng này"
                            value={formatCurrency(revenueStats?.totalThisMonth)}
                            subtitle="Tổng giá trị hóa đơn đã thanh toán"
                            icon={PaymentsRounded}
                            tone="blue"
                            loading={loading && !summary}
                        />

                        <AdminStatCard
                            title="Hoàn tất khám hôm nay"
                            value={formatNumber(appointmentStats?.completedToday)}
                            subtitle="Số ca đã kết thúc hồ sơ khám trong ngày"
                            icon={EventAvailableRounded}
                            tone="emerald"
                            loading={loading && !summary}
                        />

                        <AdminStatCard
                            title="Đang khám hôm nay"
                            value={formatNumber(appointmentStats?.inProgressToday)}
                            subtitle="Bệnh nhân đang được bác sĩ tiếp nhận"
                            icon={MedicalServicesRounded}
                            tone="sky"
                            loading={loading && !summary}
                        />

                        <AdminStatCard
                            title="Tổng đơn vị thuốc tồn"
                            value={formatNumber(inventoryStats?.totalStockQuantity)}
                            subtitle="Tổng tồn thực tế trong các lô dược phẩm"
                            icon={Inventory2Rounded}
                            tone="purple"
                            loading={loading && !summary}
                        />
                    </Box>

                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: {
                                xs: "1fr",
                                md: "repeat(3, minmax(0, 1fr))",
                            },
                            gap: 2.25,
                        }}
                    >
                        <AdminStatCard
                            title="Lượt khám hoàn tất tháng này"
                            value={formatNumber(appointmentStats?.completedThisMonth)}
                            subtitle="Tổng hợp theo lịch hẹn trong tháng hiện tại"
                            icon={CalendarMonthRounded}
                            tone="teal"
                            loading={loading && !summary}
                        />

                        <AdminStatCard
                            title="Thuốc sắp chạm ngưỡng hết"
                            value={formatNumber(inventoryStats?.lowStockMedicines)}
                            subtitle="Các mặt hàng có tổng tồn ≤ ngưỡng cảnh báo"
                            icon={WarningAmberRounded}
                            tone="amber"
                            loading={loading && !summary}
                        />

                        <AdminStatCard
                            title="Lô thuốc đã hết hạn"
                            value={formatNumber(inventoryStats?.expiredBatches)}
                            subtitle="Lô có hạn dùng trước ngày hôm nay cần xử lý"
                            icon={WarningAmberRounded}
                            tone="rose"
                            loading={loading && !summary}
                        />
                    </Box>

                    {summary && (
                        <Paper variant="outlined" sx={{ ...clinicSurfaceSx, p: { xs: 2.5, md: 3 } }}>
                            <Stack
                                direction={{ xs: "column", sm: "row" }}
                                spacing={1.5}
                                sx={{ justifyContent: "space-between", alignItems: { sm: "center" }, mb: 2.5 }}
                            >
                                <Box>
                                    <Typography sx={{ fontSize: 17, fontWeight: 800, color: clinicColors.heading }}>
                                        Cơ cấu doanh thu tháng hiện tại
                                    </Typography>
                                    <Typography sx={{ fontSize: 13.5, color: clinicColors.muted, mt: 0.25 }}>
                                        Phân bổ giữa chi phí người bệnh tự chi trả và quỹ Bảo hiểm Y tế thanh toán.
                                    </Typography>
                                </Box>
                                <Chip
                                    label={`Tổng cộng: ${formatCurrency(totalRevenue)}`}
                                    sx={{
                                        bgcolor: "#E8F2FC",
                                        color: clinicColors.primary,
                                        fontWeight: 750,
                                        borderRadius: "9px",
                                    }}
                                />
                            </Stack>

                            <Box
                                sx={{
                                    display: "grid",
                                    gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
                                    gap: 2,
                                }}
                            >
                                <Paper
                                    variant="outlined"
                                    sx={{
                                        p: 2,
                                        borderRadius: "12px",
                                        bgcolor: "#F8FAFC",
                                        borderColor: "#E2ECF5",
                                    }}
                                >
                                    <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: "#64748B" }}>
                                        Tổng doanh thu ghi nhận
                                    </Typography>
                                    <Typography sx={{ mt: 0.75, fontSize: 21, fontWeight: 800, color: clinicColors.primary }}>
                                        {formatCurrency(totalRevenue)}
                                    </Typography>
                                    <LinearProgress
                                        variant="determinate"
                                        value={totalRevenue > 0 ? 100 : 0}
                                        sx={{
                                            mt: 1.5,
                                            height: 6,
                                            borderRadius: 99,
                                            bgcolor: "#DCE8F5",
                                            "& .MuiLinearProgress-bar": { bgcolor: clinicColors.primary },
                                        }}
                                    />
                                </Paper>

                                <Paper
                                    variant="outlined"
                                    sx={{
                                        p: 2,
                                        borderRadius: "12px",
                                        bgcolor: "#F8FAFC",
                                        borderColor: "#E2ECF5",
                                    }}
                                >
                                    <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                                        <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: "#64748B" }}>
                                            Bệnh nhân thực trả
                                        </Typography>
                                        <Typography sx={{ fontSize: 12.5, fontWeight: 750, color: "#0284C7" }}>
                                            {patientRatio}%
                                        </Typography>
                                    </Stack>
                                    <Typography sx={{ mt: 0.75, fontSize: 21, fontWeight: 800, color: "#0284C7" }}>
                                        {formatCurrency(patientPaid)}
                                    </Typography>
                                    <LinearProgress
                                        variant="determinate"
                                        value={patientRatio}
                                        sx={{
                                            mt: 1.5,
                                            height: 6,
                                            borderRadius: 99,
                                            bgcolor: "#E0F2FE",
                                            "& .MuiLinearProgress-bar": { bgcolor: "#0284C7" },
                                        }}
                                    />
                                </Paper>

                                <Paper
                                    variant="outlined"
                                    sx={{
                                        p: 2,
                                        borderRadius: "12px",
                                        bgcolor: "#F8FAFC",
                                        borderColor: "#E2ECF5",
                                    }}
                                >
                                    <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                                        <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: "#64748B" }}>
                                            Bảo hiểm Y tế chi trả
                                        </Typography>
                                        <Typography sx={{ fontSize: 12.5, fontWeight: 750, color: "#059669" }}>
                                            {insuranceRatio}%
                                        </Typography>
                                    </Stack>
                                    <Typography sx={{ mt: 0.75, fontSize: 21, fontWeight: 800, color: "#059669" }}>
                                        {formatCurrency(insurancePaid)}
                                    </Typography>
                                    <LinearProgress
                                        variant="determinate"
                                        value={insuranceRatio}
                                        sx={{
                                            mt: 1.5,
                                            height: 6,
                                            borderRadius: 99,
                                            bgcolor: "#DCFCE7",
                                            "& .MuiLinearProgress-bar": { bgcolor: "#059669" },
                                        }}
                                    />
                                </Paper>
                            </Box>
                        </Paper>
                    )}
                </Stack>
            )}

            {groupedModules.map((section) => (
                <Box key={section.title}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1.75 }}>
                        <Box
                            sx={{
                                width: 6,
                                height: 20,
                                borderRadius: 99,
                                bgcolor: clinicColors.primary,
                            }}
                        />
                        <Typography component="h2" sx={{ fontSize: 18, fontWeight: 800, color: clinicColors.heading }}>
                            {section.title}
                        </Typography>
                        <Chip
                            size="small"
                            label={`${section.items.length} mục`}
                            sx={{
                                height: 22,
                                fontSize: 11.5,
                                fontWeight: 700,
                                bgcolor: "#E8F2FC",
                                color: clinicColors.primary,
                            }}
                        />
                    </Stack>

                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: {
                                xs: "1fr",
                                sm: "repeat(2, minmax(0, 1fr))",
                                lg: "repeat(3, minmax(0, 1fr))",
                            },
                            gap: 2,
                        }}
                    >
                        {section.items.map((page) => {
                            const meta = PAGE_CARD_META[page.path] || {
                                icon: DashboardRounded,
                                tone: "blue",
                                desc: "Truy cập và thao tác dữ liệu nghiệp vụ.",
                            };
                            const Icon = meta.icon;
                            const accent = adminAccents[meta.tone] || adminAccents.blue;

                            return (
                                <Paper
                                    key={page.path}
                                    component={Link}
                                    to={page.to || page.path}
                                    variant="outlined"
                                    sx={{
                                        ...clinicSurfaceSx,
                                        p: 2.5,
                                        textDecoration: "none",
                                        color: "inherit",
                                        display: "flex",
                                        flexDirection: "column",
                                        justifyContent: "space-between",
                                        gap: 2,
                                        transition: "border-color 0.16s ease, transform 0.16s ease, box-shadow 0.16s ease",
                                        "&:hover": {
                                            borderColor: clinicColors.primary,
                                            transform: "translateY(-2px)",
                                            boxShadow: "0 10px 24px rgba(11, 79, 138, 0.08)",
                                        },
                                    }}
                                >
                                    <Stack direction="row" spacing={1.75} sx={{ alignItems: "flex-start" }}>
                                        <Box
                                            sx={{
                                                width: 44,
                                                height: 44,
                                                borderRadius: "12px",
                                                flexShrink: 0,
                                                display: "grid",
                                                placeItems: "center",
                                                bgcolor: accent.soft,
                                                color: accent.main,
                                                border: `1px solid ${accent.border}`,
                                            }}
                                        >
                                            <Icon sx={{ fontSize: 22 }} />
                                        </Box>

                                        <Box sx={{ minWidth: 0 }}>
                                            <Typography
                                                sx={{
                                                    fontSize: 16,
                                                    fontWeight: 750,
                                                    color: clinicColors.heading,
                                                    lineHeight: 1.35,
                                                }}
                                            >
                                                {page.label}
                                            </Typography>
                                            <Typography
                                                sx={{
                                                    mt: 0.5,
                                                    fontSize: 13.5,
                                                    color: clinicColors.muted,
                                                    lineHeight: 1.55,
                                                }}
                                            >
                                                {meta.desc}
                                            </Typography>
                                        </Box>
                                    </Stack>

                                    <Stack
                                        direction="row"
                                        spacing={0.5}
                                        sx={{
                                            alignItems: "center",
                                            color: clinicColors.primary,
                                            fontSize: 13.5,
                                            fontWeight: 700,
                                        }}
                                    >
                                        <span>Mở chức năng</span>
                                        <ArrowForwardRounded sx={{ fontSize: 17 }} />
                                    </Stack>
                                </Paper>
                            );
                        })}
                    </Box>
                </Box>
            ))}

            {!pages.length && !isAdmin && (
                <Paper variant="outlined" sx={{ ...clinicSurfaceSx, p: 4 }}>
                    <ShieldOutlined sx={{ color: clinicColors.primary, fontSize: 28 }} />
                    <Typography variant="h6" sx={{ mt: 1, fontWeight: 750 }}>
                        Chưa có chức năng khả dụng
                    </Typography>
                    <Typography color="text.secondary" sx={{ mt: 0.75 }}>
                        Vai trò này chưa có quyền truy cập các chức năng được triển khai. Hãy liên hệ quản trị viên nếu cần cấp quyền.
                    </Typography>
                </Paper>
            )}
        </Stack>
    );
}
