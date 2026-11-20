import { useState } from "react";
import {
    Alert,
    Button,
    Chip,
    Snackbar,
    Stack,
} from "@mui/material";
import InventoryOutlinedIcon from "@mui/icons-material/InventoryOutlined";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";

import ClinicPageHeader from "../../../components/common/ClinicPageHeader";
import { AdminAddIcon, clinicPrimaryButtonSx } from "../../../components/common/clinicUi";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import ErrorState from "../../../components/common/ErrorState";
import Loading from "../../../components/common/Loading";
import PharmacyModuleTabs from "../../../components/internal/medicines/PharmacyModuleTabs";
import PurchaseOrderFilters from "../../../components/internal/medicines/PurchaseOrderFilters";
import PurchaseOrderFormDialog from "../../../components/internal/medicines/PurchaseOrderFormDialog";
import PurchaseOrderStatCards from "../../../components/internal/medicines/PurchaseOrderStatCards";
import PurchaseOrdersTable from "../../../components/internal/medicines/PurchaseOrdersTable";
import usePurchaseOrders from "../../../hooks/usePurchaseOrders";

function PurchaseOrdersPage() {
    const {
        filters,
        purchaseOrders,
        pagination,
        summary,
        suppliers,
        medicines,
        loading,
        saving,
        error,
        updateFilters,
        resetFilters,
        loadPurchaseOrders,
        loadPurchaseOrder,
        savePurchaseOrder,
        receiveOrder,
        cancelOrder,
    } = usePurchaseOrders();

    const [dialog, setDialog] = useState({
        open: false,
        mode: "create",
        purchaseOrder: null,
    });
    const [receiveTarget, setReceiveTarget] = useState(null);
    const [cancelTarget, setCancelTarget] = useState(null);
    const [actionError, setActionError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const clearMessages = () => {
        setActionError("");
        setSuccessMessage("");
    };

    const handleCreate = () => {
        clearMessages();
        setDialog({
            open: true,
            mode: "create",
            purchaseOrder: null,
        });
    };

    const openExistingOrder = async (order, mode) => {
        clearMessages();

        try {
            const fullOrder = await loadPurchaseOrder(
                order.purchaseOrderId
            );
            setDialog({ open: true, mode, purchaseOrder: fullOrder });
        } catch (err) {
            setActionError(err.message);
        }
    };

    const handleSave = async (payload, purchaseOrderId) => {
        await savePurchaseOrder(payload, purchaseOrderId);
        setSuccessMessage(
            purchaseOrderId
                ? "Đã cập nhật phiếu nhập kho."
                : "Đã tạo bản nháp phiếu nhập kho."
        );
    };

    const handleReceive = async () => {
        if (!receiveTarget) {
            return;
        }

        clearMessages();

        try {
            await receiveOrder(receiveTarget.purchaseOrderId);
            setReceiveTarget(null);
            setSuccessMessage(
                "Đã nhập các lô thuốc vào tồn kho thành công."
            );
        } catch (err) {
            setReceiveTarget(null);
            setActionError(err.message);
        }
    };

    const handleCancel = async () => {
        if (!cancelTarget) {
            return;
        }

        clearMessages();

        try {
            await cancelOrder(cancelTarget.purchaseOrderId);
            setCancelTarget(null);
            setSuccessMessage("Đã hủy phiếu nhập kho.");
        } catch (err) {
            setCancelTarget(null);
            setActionError(err.message);
        }
    };

    return (
        <Stack spacing={3}>
            <ClinicPageHeader
                icon={ReceiptLongRoundedIcon}
                eyebrow="Quản trị / Kho dược & Vật tư"
                title="Phiếu nhập kho"
                description="Lập phiếu nhập theo từng lô thuốc và hạn dùng. Tồn kho chỉ tăng khi phiếu được xác nhận nhập kho."
                badge={
                    <Chip
                        icon={<InventoryOutlinedIcon fontSize="small" />}
                        label="Theo lô & hạn dùng"
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
                        Tạo phiếu nhập
                    </Button>
                }
            />

            <PharmacyModuleTabs active="purchaseOrders" />

            <PurchaseOrderStatCards summary={summary} />

            <PurchaseOrderFilters
                filters={filters}
                suppliers={suppliers}
                onChange={updateFilters}
                onReset={resetFilters}
            />

            {actionError && (
                <Alert severity="error" onClose={() => setActionError("")}>
                    {actionError}
                </Alert>
            )}

            {error && (
                <ErrorState
                    message={error}
                    onRetry={loadPurchaseOrders}
                />
            )}

            {loading ? (
                <Loading />
            ) : (
                <PurchaseOrdersTable
                    purchaseOrders={purchaseOrders}
                    pagination={pagination}
                    filters={filters}
                    onPageChange={(pageNumber) =>
                        updateFilters({ pageNumber })
                    }
                    onPageSizeChange={(pageSize) =>
                        updateFilters({ pageSize, pageNumber: 1 })
                    }
                    onView={(order) => openExistingOrder(order, "view")}
                    onEdit={(order) => openExistingOrder(order, "edit")}
                    onReceive={setReceiveTarget}
                    onCancel={setCancelTarget}
                />
            )}

            <PurchaseOrderFormDialog
                key={`${dialog.open}-${dialog.mode}-${dialog.purchaseOrder?.purchaseOrderId || "new"}`}
                open={dialog.open}
                mode={dialog.mode}
                purchaseOrder={dialog.purchaseOrder}
                suppliers={suppliers}
                medicines={medicines}
                saving={saving}
                onClose={() => setDialog((current) => ({
                    ...current,
                    open: false,
                }))}
                onSubmit={handleSave}
            />

            <ConfirmDialog
                open={Boolean(receiveTarget)}
                title="Xác nhận nhập kho"
                message={receiveTarget
                    ? `Xác nhận nhập phiếu ${receiveTarget.purchaseOrderCode}? Các lô thuốc sẽ được cộng vào tồn kho và không thể sửa lại phiếu.`
                    : ""}
                confirmText="Nhập kho"
                cancelText="Quay lại"
                confirmColor="success"
                loading={saving}
                onCancel={() => setReceiveTarget(null)}
                onConfirm={handleReceive}
            />

            <ConfirmDialog
                open={Boolean(cancelTarget)}
                title="Hủy phiếu nhập kho"
                message={cancelTarget
                    ? `Bạn có chắc muốn hủy phiếu ${cancelTarget.purchaseOrderCode}? Phiếu hủy sẽ không làm thay đổi tồn kho.`
                    : ""}
                confirmText="Hủy phiếu"
                cancelText="Quay lại"
                loading={saving}
                onCancel={() => setCancelTarget(null)}
                onConfirm={handleCancel}
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

export default PurchaseOrdersPage;
