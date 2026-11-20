import { useState } from "react";
import {
    Alert,
    Button,
    Chip,
    Snackbar,
    Stack,
} from "@mui/material";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";

import ClinicPageHeader from "../../../components/common/ClinicPageHeader";
import { AdminAddIcon, clinicPrimaryButtonSx } from "../../../components/common/clinicUi";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import ErrorState from "../../../components/common/ErrorState";
import Loading from "../../../components/common/Loading";
import PharmacyModuleTabs from "../../../components/internal/medicines/PharmacyModuleTabs";
import SupplierFilters from "../../../components/internal/medicines/SupplierFilters";
import SupplierFormDialog from "../../../components/internal/medicines/SupplierFormDialog";
import SupplierStatCards from "../../../components/internal/medicines/SupplierStatCards";
import SuppliersTable from "../../../components/internal/medicines/SuppliersTable";
import useSuppliers from "../../../hooks/useSuppliers";

function SuppliersPage() {
    const {
        filters,
        suppliers,
        pagination,
        summary,
        loading,
        saving,
        error,
        updateFilters,
        resetFilters,
        loadSuppliers,
        saveSupplier,
        removeSupplier,
    } = useSuppliers();

    const [formOpen, setFormOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] =
        useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [actionError, setActionError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const handleCreate = () => {
        setActionError("");
        setSuccessMessage("");
        setSelectedSupplier(null);
        setFormOpen(true);
    };

    const handleEdit = (supplier) => {
        setActionError("");
        setSuccessMessage("");
        setSelectedSupplier(supplier);
        setFormOpen(true);
    };

    const handleSaveSupplier = async (
        payload,
        supplierId = null
    ) => {
        await saveSupplier(payload, supplierId);
        setSuccessMessage(
            supplierId
                ? "Đã cập nhật nhà cung cấp thành công."
                : "Đã thêm nhà cung cấp thành công."
        );
    };

    const handleDelete = async () => {
        if (!deleteTarget) {
            return;
        }

        setActionError("");
        setSuccessMessage("");

        try {
            await removeSupplier(deleteTarget.supplierId);
            setDeleteTarget(null);
            setSuccessMessage(
                "Đã xóa nhà cung cấp thành công."
            );
        } catch (err) {
            setActionError(err.message);
        }
    };

    return (
        <>
            <Stack spacing={3}>
                <ClinicPageHeader
                    icon={StorefrontRoundedIcon}
                    eyebrow="Quản trị / Kho dược & Vật tư"
                    title="Danh sách nhà cung cấp"
                    description="Quản lý đối tác cung ứng thuốc, thông tin liên hệ và dữ liệu liên kết với danh mục thuốc."
                    badge={
                        <Chip
                            icon={<VerifiedOutlinedIcon fontSize="small" />}
                            label="Chuẩn GDP/GSP"
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
                            Thêm nhà cung cấp
                        </Button>
                    }
                />

                <PharmacyModuleTabs active="suppliers" />

                <SupplierStatCards summary={summary} />

                <SupplierFilters
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
                    <ErrorState
                        message={error}
                        onRetry={loadSuppliers}
                    />
                )}

                {loading ? (
                    <Loading />
                ) : (
                    <SuppliersTable
                        suppliers={suppliers}
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

                <SupplierFormDialog
                    key={`${formOpen}-${selectedSupplier ? JSON.stringify(selectedSupplier) : "new"}`}
                    open={formOpen}
                    supplier={selectedSupplier}
                    saving={saving}
                    onClose={() => setFormOpen(false)}
                    onSubmit={handleSaveSupplier}
                />

                <ConfirmDialog
                    open={Boolean(deleteTarget)}
                    title="Xóa nhà cung cấp"
                    message={
                        deleteTarget
                            ? `Bạn có chắc muốn xóa nhà cung cấp "${deleteTarget.supplierName}"? Chỉ xóa được nhà cung cấp chưa liên kết thuốc.`
                            : ""
                    }
                    confirmText="Xóa nhà cung cấp"
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

export default SuppliersPage;
