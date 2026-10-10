import { useState } from "react";
import {
    Alert,
    Box,
    Chip,
    Paper,
    Snackbar,
    Stack,
    Typography,
} from "@mui/material";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";

import ErrorState from "../../../components/common/ErrorState";
import Loading from "../../../components/common/Loading";
import DispensingConfirmDialog from "../../../components/internal/pharmacy/DispensingConfirmDialog";
import DispensingDetailPanel from "../../../components/internal/pharmacy/DispensingDetailPanel";
import DispensingFilters from "../../../components/internal/pharmacy/DispensingFilters";
import DispensingStatCards from "../../../components/internal/pharmacy/DispensingStatCards";
import DispensingTable from "../../../components/internal/pharmacy/DispensingTable";
import useDispensing from "../../../hooks/useDispensing";

function DispensingPage() {
    const {
        filters,
        queueItems,
        pagination,
        summary,
        detail,
        loading,
        detailLoading,
        confirming,
        error,
        updateFilters,
        resetFilters,
        loadQueue,
        loadDetail,
        clearDetail,
        dispense,
    } = useDispensing();

    const [selectedId, setSelectedId] = useState(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [actionError, setActionError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const closeDetail = () => {
        setSelectedId(null);
        clearDetail();
    };

    const handleFiltersChange = (nextFilters) => {
        closeDetail();
        updateFilters(nextFilters);
    };

    const handleResetFilters = () => {
        closeDetail();
        resetFilters();
    };

    const handleSelect = async (item) => {
        setActionError("");
        setSuccessMessage("");
        setSelectedId(item.prescriptionId);

        try {
            await loadDetail(item.prescriptionId);
        } catch (err) {
            setSelectedId(null);
            clearDetail();
            setActionError(err.message);
        }
    };

    const handleConfirm = async () => {
        if (!detail) return;

        setActionError("");

        try {
            await dispense(detail.prescriptionId);
            setConfirmOpen(false);
            setSuccessMessage(
                `Đã giao thuốc và trừ kho cho đơn ${detail.prescriptionCode}.`
            );
        } catch (err) {
            setConfirmOpen(false);
            setActionError(err.message);

            try {
                await loadDetail(detail.prescriptionId);
            } catch {
                // Keep the original business error visible.
            }
        }
    };

    return (
        <Stack spacing={3}>
            <Paper
                elevation={0}
                sx={{
                    p: { xs: 2.5, md: 3.5 },
                    borderRadius: 2,
                    border: "1px solid #E5E9F0",
                }}
            >
                <Box sx={{ minWidth: 0 }}>
                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
                        <Typography variant="caption" sx={{ color: "#6B7280", fontWeight: 700 }}>
                            Dược sĩ / Quầy cấp thuốc
                        </Typography>
                        <Chip
                            icon={<VerifiedOutlinedIcon fontSize="small" />}
                            label="Cấp thuốc theo FEFO"
                            size="small"
                            sx={{
                                height: 24,
                                color: "#047857",
                                backgroundColor: "#ECFDF5",
                                border: "1px solid #A7F3D0",
                                fontWeight: 700,
                            }}
                        />
                    </Stack>

                    <Typography
                        variant="h4"
                        sx={{ mt: 1.5, color: "#111827", fontWeight: 800, lineHeight: 1.25 }}
                    >
                        Quầy cấp thuốc ngoại trú
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{ mt: 1, maxWidth: 820, color: "#6B7280", lineHeight: 1.7 }}
                    >
                        Kiểm tra đơn đã thanh toán, đối chiếu các lô còn hạn và xác nhận giao thuốc trong một giao dịch.
                    </Typography>
                </Box>
            </Paper>

            <DispensingStatCards summary={summary} />

            <DispensingFilters
                filters={filters}
                onChange={handleFiltersChange}
                onReset={handleResetFilters}
            />

            {actionError && (
                <Alert severity="error" onClose={() => setActionError("")}>
                    {actionError}
                </Alert>
            )}

            {error && <ErrorState message={error} onRetry={loadQueue} />}

            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: {
                        xs: "minmax(0, 1fr)",
                        lg: "minmax(0, 1.45fr) minmax(420px, 0.72fr)",
                        xl: "minmax(0, 1.65fr) minmax(460px, 0.75fr)",
                    },
                    alignItems: "start",
                    gap: 2,
                }}
            >
                <Box sx={{ minWidth: 0 }}>
                    {loading ? (
                        <Paper elevation={0} sx={{ border: "1px solid #E5E9F0", borderRadius: 2 }}>
                            <Loading />
                        </Paper>
                    ) : (
                        <DispensingTable
                            items={queueItems}
                            pagination={pagination}
                            filters={filters}
                            selectedId={selectedId}
                            onSelect={handleSelect}
                            onPageChange={(pageNumber) => handleFiltersChange({ pageNumber })}
                            onPageSizeChange={(pageSize) => handleFiltersChange({ pageSize, pageNumber: 1 })}
                        />
                    )}
                </Box>

                <DispensingDetailPanel
                    selected={Boolean(selectedId)}
                    detail={detail}
                    loading={detailLoading}
                    onClose={closeDetail}
                    onConfirm={() => setConfirmOpen(true)}
                />
            </Box>

            <DispensingConfirmDialog
                key={`${detail?.prescriptionId || "none"}-${confirmOpen}`}
                open={confirmOpen}
                detail={detail}
                loading={confirming}
                onCancel={() => setConfirmOpen(false)}
                onConfirm={handleConfirm}
            />

            <Snackbar
                open={Boolean(successMessage)}
                autoHideDuration={3000}
                onClose={() => setSuccessMessage("")}
                anchorOrigin={{ vertical: "top", horizontal: "right" }}
            >
                <Alert
                    severity="success"
                    variant="filled"
                    onClose={() => setSuccessMessage("")}
                    sx={{ width: "100%" }}
                >
                    {successMessage}
                </Alert>
            </Snackbar>
        </Stack>
    );
}

export default DispensingPage;
