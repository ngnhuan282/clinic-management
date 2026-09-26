import { useState } from "react";
import {
    Alert,
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Paper,
    Snackbar,
    Stack,
    Typography,
} from "@mui/material";
import AddCircleOutlineOutlinedIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import MedicalInformationOutlinedIcon from "@mui/icons-material/MedicalInformationOutlined";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";

import DiseaseFilters from "../../components/internal/diseases/DiseaseFilters";
import DiseaseFormDialog from "../../components/internal/diseases/DiseaseFormDialog";
import DiseasesTable from "../../components/internal/diseases/DiseasesTable";
import Loading from "../../components/common/Loading";
import useDiseases from "../../hooks/useDiseases";

function DiseasesPage() {
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
    const [successMessage, setSuccessMessage] = useState("");

    const handleCreate = () => {
        setActionError("");
        setSuccessMessage("");
        setSelectedDisease(null);
        setFormOpen(true);
    };

    const handleEdit = (disease) => {
        setActionError("");
        setSuccessMessage("");
        setSelectedDisease(disease);
        setFormOpen(true);
    };

    const handleSave = async (payload, diseaseId = null) => {
        await saveDisease(payload, diseaseId);
        setSuccessMessage(
            diseaseId
                ? "Đã cập nhật bệnh thành công."
                : "Đã thêm bệnh thành công."
        );
    };

    const handleDelete = async () => {
        if (!deleteTarget) {
            return;
        }

        setActionError("");
        setSuccessMessage("");

        try {
            await removeDisease(deleteTarget.diseaseId);
            setDeleteTarget(null);
            setSuccessMessage("Đã xóa bệnh thành công.");
        } catch (err) {
            setActionError(err.message);
        }
    };

    return (
        <>
            <Stack spacing={3}>
                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 2.5, md: 3.5 },
                        borderRadius: 2,
                        border: "1px solid #E5E9F0",
                        backgroundColor: "#FFFFFF",
                    }}
                >
                    <Stack
                        direction={{ xs: "column", md: "row" }}
                        spacing={2}
                        alignItems={{ xs: "stretch", md: "center" }}
                    >
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Stack
                                direction="row"
                                spacing={1}
                                alignItems="center"
                                flexWrap="wrap"
                                useFlexGap
                            >
                                <Typography
                                    variant="caption"
                                    sx={{
                                        color: "#6B7280",
                                        fontWeight: 700,
                                    }}
                                >
                                    Khám bệnh / Danh mục nền
                                </Typography>

                                <Chip
                                    icon={
                                        <VerifiedOutlinedIcon fontSize="small" />
                                    }
                                    label="Chuẩn hóa chẩn đoán"
                                    size="small"
                                    sx={{
                                        height: 24,
                                        color: "#047857",
                                        backgroundColor: "#ECFDF5",
                                        border:
                                            "1px solid #A7F3D0",
                                        fontWeight: 700,
                                    }}
                                />
                            </Stack>

                            <Typography
                                variant="h4"
                                component="h1"
                                sx={{
                                    mt: 1.5,
                                    color: "#111827",
                                    fontWeight: 900,
                                    lineHeight: 1.2,
                                }}
                            >
                                Danh mục bệnh
                            </Typography>

                            <Typography
                                variant="body2"
                                sx={{
                                    mt: 1,
                                    maxWidth: 820,
                                    color: "#6B7280",
                                    lineHeight: 1.7,
                                }}
                            >
                                Quản lý mã bệnh dùng cho chẩn đoán
                                trong hồ sơ bệnh án. Bác sĩ chọn dữ
                                liệu này khi lập hồ sơ khám.
                            </Typography>
                        </Box>

                        <Button
                            variant="contained"
                            startIcon={<AddCircleOutlineOutlinedIcon />}
                            onClick={handleCreate}
                            sx={{
                                minWidth: "auto",
                                height: 42,
                                px: 2.25,
                                flexShrink: 0,
                                alignSelf: {
                                    xs: "flex-start",
                                    md: "center",
                                },
                                whiteSpace: "nowrap",
                                fontWeight: 800,
                                boxShadow:
                                    "0 8px 18px rgba(25, 118, 210, 0.18)",
                            }}
                        >
                            Thêm bệnh mới
                        </Button>
                    </Stack>
                </Paper>

                <DiseaseFilters
                    filters={filters}
                    onChange={updateFilters}
                    onReset={resetFilters}
                />

                {actionError && (
                    <Alert
                        severity="error"
                        onClose={() => setActionError("")}
                    >
                        {actionError}
                    </Alert>
                )}

                {error && (
                    <Alert
                        severity="error"
                        action={
                            <Button
                                color="inherit"
                                size="small"
                                onClick={loadDiseases}
                            >
                                Thử lại
                            </Button>
                        }
                    >
                        {error}
                    </Alert>
                )}

                {loading ? (
                    <Loading />
                ) : (
                    <DiseasesTable
                        diseases={diseases}
                        pagination={pagination}
                        filters={filters}
                        onPageChange={(pageNumber) =>
                            updateFilters({ pageNumber })
                        }
                        onPageSizeChange={(pageSize) =>
                            updateFilters({
                                pageSize,
                                pageNumber: 1,
                            })
                        }
                        onEdit={handleEdit}
                        onDelete={setDeleteTarget}
                    />
                )}

                <DiseaseFormDialog
                    open={formOpen}
                    disease={selectedDisease}
                    saving={saving}
                    onClose={() => setFormOpen(false)}
                    onSubmit={handleSave}
                />

                <Dialog
                    open={Boolean(deleteTarget)}
                    onClose={
                        saving
                            ? undefined
                            : () => setDeleteTarget(null)
                    }
                    fullWidth
                    maxWidth="xs"
                >
                    <DialogTitle>
                        <Stack
                            direction="row"
                            alignItems="center"
                            spacing={1.25}
                        >
                            <MedicalInformationOutlinedIcon
                                sx={{ color: "#E11D48" }}
                            />
                            <Typography
                                variant="h6"
                                sx={{ fontWeight: 800 }}
                            >
                                Xóa bệnh
                            </Typography>
                        </Stack>
                    </DialogTitle>

                    <DialogContent>
                        <DialogContentText>
                            {deleteTarget
                                ? `Bạn có chắc muốn xóa "${deleteTarget.diseaseCode} - ${deleteTarget.diseaseName}"? Chỉ xóa được bệnh chưa dùng trong hồ sơ chẩn đoán.`
                                : ""}
                        </DialogContentText>
                    </DialogContent>

                    <DialogActions sx={{ px: 3, pb: 2 }}>
                        <Button
                            onClick={() => setDeleteTarget(null)}
                            disabled={saving}
                            variant="outlined"
                        >
                            Hủy bỏ
                        </Button>

                        <Button
                            onClick={handleDelete}
                            variant="contained"
                            color="error"
                            disabled={saving}
                        >
                            {saving ? "Đang xóa..." : "Xóa bệnh"}
                        </Button>
                    </DialogActions>
                </Dialog>

                <Snackbar
                    open={Boolean(successMessage)}
                    autoHideDuration={3000}
                    onClose={() => setSuccessMessage("")}
                    anchorOrigin={{
                        vertical: "top",
                        horizontal: "right",
                    }}
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
        </>
    );
}

export default DiseasesPage;
