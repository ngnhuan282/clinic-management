import { useState } from "react";
import {
    Alert,
    Button,
    Chip,
    Snackbar,
    Stack,
} from "@mui/material";
import LocalPharmacyRoundedIcon from "@mui/icons-material/LocalPharmacyRounded";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";

import ClinicPageHeader from "../../../components/common/ClinicPageHeader";
import { AdminAddIcon, clinicPrimaryButtonSx } from "../../../components/common/clinicUi";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import ErrorState from "../../../components/common/ErrorState";
import Loading from "../../../components/common/Loading";
import MedicineFilters from "../../../components/internal/medicines/MedicineFilters";
import MedicineFormDialog from "../../../components/internal/medicines/MedicineFormDialog";
import MedicineStatCards from "../../../components/internal/medicines/MedicineStatCards";
import MedicinesTable from "../../../components/internal/medicines/MedicinesTable";
import PharmacyModuleTabs from "../../../components/internal/medicines/PharmacyModuleTabs";
import useMedicines from "../../../hooks/useMedicines";

function MedicinesPage() {
    const {
        filters,
        medicines,
        pagination,
        summary,
        categories,
        suppliers,
        loading,
        saving,
        error,
        updateFilters,
        resetFilters,
        loadMedicines,
        saveMedicine,
        removeMedicine,
    } = useMedicines();

    const [formOpen, setFormOpen] = useState(false);
    const [selectedMedicine, setSelectedMedicine] =
        useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [actionError, setActionError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const handleCreate = () => {
        setActionError("");
        setSuccessMessage("");
        setSelectedMedicine(null);
        setFormOpen(true);
    };

    const handleEdit = (medicine) => {
        setActionError("");
        setSuccessMessage("");
        setSelectedMedicine(medicine);
        setFormOpen(true);
    };

    const handleSaveMedicine = async (
        payload,
        medicineId = null
    ) => {
        await saveMedicine(payload, medicineId);
        setSuccessMessage(
            medicineId
                ? "Đã cập nhật thuốc thành công."
                : "Đã thêm thuốc mới thành công."
        );
    };

    const handleDelete = async () => {
        if (!deleteTarget) {
            return;
        }

        setActionError("");
        setSuccessMessage("");

        try {
            await removeMedicine(deleteTarget.medicineId);
            setDeleteTarget(null);
            setSuccessMessage("Đã xóa thuốc thành công.");
        } catch (err) {
            setActionError(err.message);
        }
    };

    return (
        <>
            <Stack spacing={3}>
            <ClinicPageHeader
                icon={LocalPharmacyRoundedIcon}
                eyebrow="Quản trị / Kho dược & Vật tư"
                title="Danh mục Thuốc & Dược phẩm"
                description="Quản lý thuốc theo danh mục, nhà cung cấp, đơn vị tính, giá bán và tồn kho tổng hợp để chuẩn bị dữ liệu cho kê đơn."
                badge={
                    <Chip
                        icon={<VerifiedOutlinedIcon fontSize="small" />}
                        label="Chuẩn GPP"
                        size="small"
                        sx={{
                            height: 24,
                            color: "#047857",
                            backgroundColor: "#ECFDF5",
                            border: "1px solid #A7F3D0",
                            fontWeight: 700,
                        }}
                    />
                }
                actions={
                    <Button
                        variant="contained"
                        startIcon={<AdminAddIcon />}
                        onClick={handleCreate}
                        sx={{ ...clinicPrimaryButtonSx, whiteSpace: "nowrap" }}
                    >
                        Thêm thuốc mới
                    </Button>
                }
            />

            <PharmacyModuleTabs active="medicines" />

            <MedicineStatCards summary={summary} />

            <MedicineFilters
                filters={filters}
                categories={categories}
                suppliers={suppliers}
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
                <ErrorState
                    message={error}
                    onRetry={loadMedicines}
                />
            )}

            {loading ? (
                <Loading />
            ) : (
                <MedicinesTable
                    medicines={medicines}
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

            <MedicineFormDialog
                    key={`${formOpen}-${selectedMedicine ? JSON.stringify(selectedMedicine) : "new"}`}
                open={formOpen}
                medicine={selectedMedicine}
                categories={categories}
                suppliers={suppliers}
                saving={saving}
                onClose={() => setFormOpen(false)}
                onSubmit={handleSaveMedicine}
            />

            <ConfirmDialog
                open={Boolean(deleteTarget)}
                title="Xóa thuốc"
                message={
                    deleteTarget
                        ? `Bạn có chắc muốn xóa thuốc "${deleteTarget.medicineName}"? Thuốc đã có tồn kho sẽ không thể xóa.`
                        : ""
                }
                confirmText="Xóa thuốc"
                cancelText="Hủy"
                loading={saving}
                onCancel={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
            />

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

export default MedicinesPage;
