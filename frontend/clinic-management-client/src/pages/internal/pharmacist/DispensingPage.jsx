import { Alert, Button, Chip, Paper, Stack } from "@mui/material";
import LocalPharmacyRoundedIcon from "@mui/icons-material/LocalPharmacyRounded";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";
import { useLocation, useNavigate } from "react-router-dom";
import ClinicPageHeader from "../../../components/common/ClinicPageHeader";
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
            <ClinicPageHeader
                icon={LocalPharmacyRoundedIcon}
                eyebrow="Dược sĩ / Quầy cấp thuốc"
                title="Quầy cấp thuốc ngoại trú"
                description="Kiểm tra đơn đã thanh toán, đối chiếu các lô còn hạn và xác nhận giao thuốc trong một giao dịch."
                badge={
                    <Chip icon={<VerifiedOutlinedIcon fontSize="small" />} label="Cấp thuốc theo FEFO" size="small"
                        sx={{ height: 24, color: "#047857", bgcolor: "#ECFDF5", border: "1px solid #A7F3D0", fontWeight: 700 }} />
                }
            />
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
