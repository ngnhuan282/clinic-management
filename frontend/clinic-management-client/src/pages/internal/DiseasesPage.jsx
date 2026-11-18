import { useEffect, useRef, useState } from "react";
import {
    Alert,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Stack,
    Typography,
} from "@mui/material";
import { MedicalInformationRounded } from "@mui/icons-material";
import ClinicPageHeader from "../../components/common/ClinicPageHeader";
import {
    AdminAddIcon,
    AdminDeleteIcon,
    clinicButtonSx,
    clinicDialogActionsSx,
    clinicDialogPaperSx,
    clinicDialogTitleSx,
    clinicPrimaryButtonSx,
    clinicSecondaryButtonSx,
    clinicToast,
} from "../../components/common/clinicUi";
import DiseaseFilters from "../../components/internal/diseases/DiseaseFilters";
import DiseaseFormDialog from "../../components/internal/diseases/DiseaseFormDialog";
import DiseasesTable from "../../components/internal/diseases/DiseasesTable";
import useDiseases from "../../hooks/useDiseases";

export default function DiseasesPage() {
    const {
        filters,
        diseases,
        pagination,
        loading,
        saving,
        error,
        updateFilters,
        resetFilters,
        loadDiseases,
        saveDisease,
        removeDisease,
    } = useDiseases();
    const [formOpen, setFormOpen] = useState(false);
    const [selectedDisease, setSelectedDisease] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [actionError, setActionError] = useState("");
    const deleting = useRef(false);

    useEffect(() => {
        if (loading || !pagination) return undefined;
        const lastPage = Math.max(1, pagination.totalPages);
        if (filters.pageNumber <= lastPage) return undefined;
        const timer = setTimeout(() => updateFilters({ pageNumber: lastPage }), 0);
        return () => clearTimeout(timer);
    }, [filters.pageNumber, loading, pagination, updateFilters]);

    const openForm = (disease) => {
        setActionError("");
        setSelectedDisease(disease);
        setFormOpen(true);
    };

    const handleSave = async (payload, diseaseId = null) => {
        await saveDisease(payload, diseaseId);
        clinicToast.success(
            diseaseId ? "Đã cập nhật bệnh thành công." : "Đã thêm bệnh thành công."
        );
    };

    const handleDelete = async () => {
        if (saving || deleting.current || !deleteTarget) return;
        deleting.current = true;
        setActionError("");
        try {
            await removeDisease(deleteTarget.diseaseId);
            setDeleteTarget(null);
            clinicToast.success("Đã xóa bệnh khỏi danh mục thành công.");
        } catch (requestError) {
            setActionError(requestError.message);
            clinicToast.error(requestError.message);
        } finally {
            deleting.current = false;
        }
    };

    return (
        <Stack spacing={3} sx={{ pb: 4, minWidth: 0 }}>
            <ClinicPageHeader
                title="Danh mục bệnh"
                icon={MedicalInformationRounded}
                description="Quản lý mã bệnh, tên bệnh và ghi chú chuyên môn để bác sĩ sử dụng thống nhất khi lập hồ sơ chẩn đoán."
                actions={
                    <Button
                        variant="contained"
                        startIcon={<AdminAddIcon />}
                        onClick={() => openForm(null)}
                        sx={clinicPrimaryButtonSx}
                    >
                        Thêm bệnh mới
                    </Button>
                }
            />

            {error && (
                <Alert
                    severity="error"
                    action={
                        <Button color="inherit" size="small" disabled={loading} onClick={loadDiseases}>
                            Thử lại
                        </Button>
                    }
                    sx={{ borderRadius: "12px" }}
                >
                    {error}
                </Alert>
            )}

            <DiseaseFilters
                filters={filters}
                onChange={updateFilters}
                onReset={resetFilters}
                onRefresh={loadDiseases}
                loading={loading}
            />

            <DiseasesTable
                diseases={diseases}
                pagination={pagination}
                filters={filters}
                loading={loading}
                saving={saving}
                error={error}
                onPageChange={(pageNumber) => updateFilters({ pageNumber })}
                onPageSizeChange={(pageSize) => updateFilters({ pageSize, pageNumber: 1 })}
                onEdit={(disease) => openForm(disease)}
                onDelete={(disease) => {
                    setActionError("");
                    setDeleteTarget(disease);
                }}
            />

            <DiseaseFormDialog
                key={`${formOpen}-${selectedDisease?.diseaseId ?? "new"}`}
                open={formOpen}
                disease={selectedDisease}
                saving={saving}
                onClose={() => setFormOpen(false)}
                onSubmit={handleSave}
            />

            <Dialog
                open={Boolean(deleteTarget)}
                onClose={saving ? undefined : () => setDeleteTarget(null)}
                fullWidth
                maxWidth="xs"
                aria-labelledby="delete-disease-title"
                slotProps={{ paper: { sx: clinicDialogPaperSx } }}
            >
                <DialogTitle id="delete-disease-title" sx={clinicDialogTitleSx}>
                    Xóa bệnh khỏi danh mục
                </DialogTitle>
                <DialogContent sx={{ px: 3, pb: 2.5 }}>
                    <Stack spacing={2}>
                        {actionError && <Alert severity="error">{actionError}</Alert>}
                        <Typography sx={{ fontSize: 14.5, lineHeight: 1.7 }}>
                            Bạn có chắc muốn xóa “{deleteTarget?.diseaseCode} – {deleteTarget?.diseaseName}”? Chỉ xóa được bệnh chưa dùng trong hồ sơ chẩn đoán.
                        </Typography>
                    </Stack>
                </DialogContent>
                <DialogActions sx={clinicDialogActionsSx}>
                    <Button
                        onClick={() => setDeleteTarget(null)}
                        disabled={saving}
                        variant="outlined"
                        sx={clinicSecondaryButtonSx}
                    >
                        Hủy
                    </Button>
                    <Button
                        onClick={handleDelete}
                        variant="contained"
                        color="error"
                        disabled={saving}
                        startIcon={<AdminDeleteIcon />}
                        sx={clinicButtonSx}
                    >
                        {saving ? "Đang xóa..." : "Xóa bệnh"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Stack>
    );
}
