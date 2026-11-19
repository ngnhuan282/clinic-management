import { Alert, Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";
import { useLocation, useNavigate } from "react-router-dom";
import ErrorState from "../../../components/common/ErrorState";
import Loading from "../../../components/common/Loading";
import DispensingFilters from "../../../components/internal/pharmacy/DispensingFilters";
import DispensingStatCards from "../../../components/internal/pharmacy/DispensingStatCards";
import DispensingTable from "../../../components/internal/pharmacy/DispensingTable";
import useAuth from "../../../hooks/useAuth";
import useDispensing from "../../../hooks/useDispensing";

function DispensingPage() {
    const { filters, queueItems, pagination, summary, loading, error, refreshWarning, updateFilters, resetFilters, loadQueue } = useDispensing();
    const { userId } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const openDetail = (item) => navigate(`/internal/pharmacy/dispensing/${item.prescriptionId}${location.search}`, {
        state: { dispensingReturn: { userId } },
    });

    return (
        <Stack spacing={3} sx={{ minWidth: 0 }}>
            <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3.5 }, borderRadius: 2, border: "1px solid #E5E9F0" }}>
                <Box sx={{ minWidth: 0 }}>
                    <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap", alignItems: "center" }}>
                        <Typography variant="caption" sx={{ color: "#6B7280", fontWeight: 700 }}>Dược sĩ / Quầy cấp thuốc</Typography>
                        <Chip icon={<VerifiedOutlinedIcon fontSize="small" />} label="Cấp thuốc theo FEFO" size="small"
                            sx={{ height: 24, color: "#047857", bgcolor: "#ECFDF5", border: "1px solid #A7F3D0", fontWeight: 700 }} />
                    </Stack>
                    <Typography component="h1" variant="h4" sx={{ mt: 1.5, color: "#111827", fontWeight: 800, lineHeight: 1.25 }}>Quầy cấp thuốc ngoại trú</Typography>
                    <Typography variant="body2" sx={{ mt: 1, maxWidth: 820, color: "#6B7280", lineHeight: 1.7 }}>
                        Kiểm tra đơn đã thanh toán, đối chiếu các lô còn hạn và xác nhận giao thuốc trong một giao dịch.
                    </Typography>
                </Box>
            </Paper>
            <DispensingStatCards summary={summary} />
            <DispensingFilters filters={filters} onChange={updateFilters} onReset={resetFilters} onRefresh={loadQueue} refreshing={loading} />
            {error && <ErrorState message={error} onRetry={loadQueue} />}
            {refreshWarning && <Alert severity="warning" action={<Button color="inherit" onClick={() => loadQueue({ background: true })}>Thử lại</Button>}>
                Chưa cập nhật được dữ liệu quầy. Đang hiển thị dữ liệu đã tải trước đó. {refreshWarning}
            </Alert>}
            {loading ? <Paper elevation={0} sx={{ border: "1px solid #E5E9F0", borderRadius: 2 }}><Loading /></Paper> :
                <DispensingTable items={queueItems} pagination={pagination} filters={filters} onSelect={openDetail}
                    onPageChange={(pageNumber) => updateFilters({ pageNumber })}
                    onPageSizeChange={(pageSize) => updateFilters({ pageSize, pageNumber: 1 })} />}
        </Stack>
    );
}

export default DispensingPage;
