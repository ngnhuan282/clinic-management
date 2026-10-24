
import { useEffect, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Stack,
    Typography,
} from "@mui/material";
import {
    ArrowForwardOutlined,
    ShieldOutlined,
    AttachMoneyOutlined,
    EventAvailableOutlined,
    MedicalServicesOutlined,
    Inventory2Outlined,
    WarningAmberOutlined,
    RefreshOutlined,
} from "@mui/icons-material";
import { Link } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import { INTERNAL_PAGES, ROLE_LABELS, canSeePage } from "../../routes/roleAccess";
import axiosClient from "../../api/axiosClient";

const formatCurrency = (value) =>
    new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(value ?? 0);

const formatNumber = (value) =>
    new Intl.NumberFormat("vi-VN").format(value ?? 0);

function StatCard({ title, value, description, icon, loading }) {
    return (
        <Card variant="outlined" sx={{ height: "100%", borderRadius: 3 }}>
            <CardContent sx={{ p: 2.5 }}>
                <Stack
                    direction="row"
                    sx={{ justifyContent: "space-between", alignItems: "flex-start" }}
                    spacing={2}
                >
                    <Box sx={{ minWidth: 0 }}>
                        <Typography color="text.secondary" variant="body2">
                            {title}
                        </Typography>

                        {loading ? (
                            <CircularProgress size={25} sx={{ mt: 2 }} />
                        ) : (
                            <Typography
                                variant="h5"
                                component="p"
                                fontWeight={700}
                                sx={{ mt: 1, overflowWrap: "anywhere" }}
                            >
                                {value}
                            </Typography>
                        )}

                        <Typography
                            color="text.secondary"
                            variant="caption"
                            sx={{ display: "block", mt: 1 }}
                        >
                            {description}
                        </Typography>
                    </Box>

                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            width: 44,
                            height: 44,
                            borderRadius: 2,
                            bgcolor: "action.hover",
                            color: "primary.main",
                        }}
                    >
                        {icon}
                    </Box>
                </Stack>
            </CardContent>
        </Card>
    );
}

export default function DashboardPage() {
    const { user, role, userId } = useAuth();

    const pages = INTERNAL_PAGES.filter(
        (page) => canSeePage(user, page) && !page.path.endsWith("dashboard")
    );

    const isAdmin = role === "Admin";

    const [state, setState] = useState(null);
    const [revision, setRevision] = useState(0);
    const requestKey = JSON.stringify({ userId, isAdmin, revision });
    const visible = state?.requestKey === requestKey ? state : null;
    const summary = visible?.summary;
    const loading = isAdmin && !visible;
    const error = visible?.error;
    const loadDashboard = () => setRevision(value => value + 1);

    useEffect(() => {
        if (!JSON.parse(requestKey).isAdmin) return;
        const controller = new AbortController();
        axiosClient.get("/admin-dashboard/summary", { signal: controller.signal })
            .then(response => {
                if (!controller.signal.aborted) setState({ requestKey, summary: response.data });
            }).catch(error => {
                if (!controller.signal.aborted) setState({ requestKey, error: error.response?.data?.message
                    || "Không thể tải dữ liệu Dashboard. Hãy kiểm tra quyền Admin và trạng thái backend." });
            });
        return () => controller.abort();
    }, [requestKey]);

    const appointmentStats = summary?.appointments;
    const revenueStats = summary?.revenue;
    const inventoryStats = summary?.inventory;

    return (
        <Stack spacing={3}>
            <Box>
                <Typography variant="overline" color="primary">
                    {ROLE_LABELS[role] || role}
                </Typography>

                <Typography variant="h4" component="h1" fontWeight={700}>
                    Xin chào, {user?.fullName || "bạn"}
                </Typography>

                <Typography color="text.secondary" sx={{ mt: 1 }}>
                    Tổng quan hoạt động phòng khám và các chức năng dành cho vai trò của bạn.
                </Typography>
            </Box>

            {isAdmin && (
                <Stack spacing={2}>
                    <Stack
                        direction={{ xs: "column", sm: "row" }}
                        sx={{ justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" } }}
                        spacing={1}
                    >
                        <Box>
                            <Typography variant="h5" component="h2" fontWeight={700}>
                                Tổng quan phòng khám
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Số liệu được tải từ hệ thống backend.
                            </Typography>
                        </Box>

                        <Button
                            variant="outlined"
                            startIcon={<RefreshOutlined />}
                            onClick={loadDashboard}
                            disabled={loading}
                        >
                            Làm mới
                        </Button>
                    </Stack>

                    {error && (
                        <Alert
                            severity="error"
                            action={
                                <Button color="inherit" size="small" onClick={loadDashboard}>
                                    Thử lại
                                </Button>
                            }
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
                                lg: "repeat(4, minmax(0, 1fr))",
                            },
                            gap: 2,
                        }}
                    >
                        <StatCard
                            title="Doanh thu tháng này"
                            value={formatCurrency(revenueStats?.totalThisMonth)}
                            description="Tổng hóa đơn đã thanh toán"
                            icon={<AttachMoneyOutlined />}
                            loading={loading && !summary}
                        />

                        <StatCard
                            title="Lượt khám hoàn tất hôm nay"
                            value={formatNumber(appointmentStats?.completedToday)}
                            description="Lịch khám có trạng thái Completed"
                            icon={<EventAvailableOutlined />}
                            loading={loading && !summary}
                        />

                        <StatCard
                            title="Đang khám hôm nay"
                            value={formatNumber(appointmentStats?.inProgressToday)}
                            description="Lịch khám có trạng thái InProgress"
                            icon={<MedicalServicesOutlined />}
                            loading={loading && !summary}
                        />

                        <StatCard
                            title="Tổng số lượng thuốc tồn"
                            value={formatNumber(inventoryStats?.totalStockQuantity)}
                            description="Tổng số đơn vị trong các lô thuốc"
                            icon={<Inventory2Outlined />}
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
                            gap: 2,
                        }}
                    >
                        <StatCard
                            title="Lượt khám hoàn tất tháng này"
                            value={formatNumber(appointmentStats?.completedThisMonth)}
                            description="Tính theo ngày hẹn"
                            icon={<EventAvailableOutlined />}
                            loading={loading && !summary}
                        />

                        <StatCard
                            title="Thuốc tồn kho thấp"
                            value={formatNumber(inventoryStats?.lowStockMedicines)}
                            description="Thuốc có tổng tồn không quá 10 đơn vị"
                            icon={<WarningAmberOutlined />}
                            loading={loading && !summary}
                        />

                        <StatCard
                            title="Lô thuốc đã hết hạn"
                            value={formatNumber(inventoryStats?.expiredBatches)}
                            description="Các lô có ngày hết hạn trước hôm nay"
                            icon={<WarningAmberOutlined />}
                            loading={loading && !summary}
                        />
                    </Box>

                    {summary && (
                        <Card variant="outlined" sx={{ borderRadius: 3 }}>
                            <CardContent>
                                <Typography variant="h6" fontWeight={700}>
                                    Chi tiết doanh thu tháng này
                                </Typography>

                                <Stack
                                    direction={{ xs: "column", sm: "row" }}
                                    spacing={3}
                                    sx={{ mt: 2 }}
                                >
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            Tổng doanh thu
                                        </Typography>
                                        <Typography fontWeight={700}>
                                            {formatCurrency(revenueStats?.totalThisMonth)}
                                        </Typography>
                                    </Box>

                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            Phần bệnh nhân thanh toán
                                        </Typography>
                                        <Typography fontWeight={700}>
                                            {formatCurrency(revenueStats?.patientPaymentsThisMonth)}
                                        </Typography>
                                    </Box>

                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            Phần bảo hiểm
                                        </Typography>
                                        <Typography fontWeight={700}>
                                            {formatCurrency(revenueStats?.insurancePaymentsThisMonth)}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </CardContent>
                        </Card>
                    )}
                </Stack>
            )}

            <Box>
                <Typography variant="h5" component="h2" fontWeight={700} sx={{ mb: 2 }}>
                    Chức năng hệ thống
                </Typography>

                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: {
                            xs: "1fr",
                            md: "repeat(2, minmax(0, 1fr))",
                        },
                        gap: 2,
                    }}
                >
                    {pages.map((page) => (
                        <Card key={page.path} variant="outlined" sx={{ borderRadius: 3 }}>
                            <CardContent>
                                <Typography variant="h6">{page.label}</Typography>

                                <Button
                                    component={Link}
                                    to={page.to || page.path}
                                    endIcon={<ArrowForwardOutlined />}
                                    sx={{ mt: 1 }}
                                >
                                    Mở chức năng
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </Box>
            </Box>

            {!pages.length && !isAdmin && (
                <Card variant="outlined" sx={{ borderRadius: 3 }}>
                    <CardContent sx={{ p: 4 }}>
                        <ShieldOutlined color="primary" />
                        <Typography variant="h6" sx={{ mt: 1 }}>
                            Chưa có chức năng khả dụng
                        </Typography>
                        <Typography color="text.secondary" sx={{ mt: 1 }}>
                            Vai trò này chưa có quyền truy cập các chức năng được triển khai.
                            Hãy liên hệ quản trị viên nếu cần thay đổi quyền.
                        </Typography>
                    </CardContent>
                </Card>
            )}
        </Stack>
    );
}
