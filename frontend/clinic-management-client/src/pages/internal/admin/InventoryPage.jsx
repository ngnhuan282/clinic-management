import { useState } from "react";
import {
    Alert,
    Box,
    Button,
    Chip,
    Paper,
    Snackbar,
    Stack,
    Typography,
} from "@mui/material";
import AddCircleOutlineOutlinedIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";

import ConfirmDialog from "../../../components/common/ConfirmDialog";
import ErrorState from "../../../components/common/ErrorState";
import Loading from "../../../components/common/Loading";
import InventoryFilters from "../../../components/internal/medicines/InventoryFilters";
import InventoryFormDialog from "../../../components/internal/medicines/InventoryFormDialog";
import InventoryStatCards from "../../../components/internal/medicines/InventoryStatCards";
import InventoryTable from "../../../components/internal/medicines/InventoryTable";
import PharmacyModuleTabs from "../../../components/internal/medicines/PharmacyModuleTabs";
import useInventory from "../../../hooks/useInventory";

function InventoryPage() {
    const {
        filters,
        inventoryItems,
        pagination,
        summary,
        medicines,
        categories,
        suppliers,
        loading,
        saving,
        error,
        updateFilters,
        resetFilters,
        loadInventory,
        saveInventory,
        removeInventory,
    } = useInventory();

    const [formOpen, setFormOpen] = useState(false);
    const [selectedInventory, setSelectedInventory] =
        useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [actionError, setActionError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const handleCreate = () => {
        setActionError("");
        setSuccessMessage("");
        setSelectedInventory(null);
        setFormOpen(true);
    };

    const handleEdit = (inventoryItem) => {
        setActionError("");
        setSuccessMessage("");
        setSelectedInventory(inventoryItem);
        setFormOpen(true);
    };

    const handleSaveInventory = async (
        payload,
        inventoryId = null
    ) => {
        await saveInventory(payload, inventoryId);
        setSuccessMessage(
            inventoryId
                ? "Đã cập nhật lô tồn kho thành công."
                : "Đã thêm lô tồn kho thành công."
        );
    };

    const handleDelete = async () => {
        if (!deleteTarget) {
            return;
        }

        setActionError("");
        setSuccessMessage("");

        try {
            await removeInventory(deleteTarget.inventoryId);
            setDeleteTarget(null);
            setSuccessMessage(
                "Đã xóa lô tồn kho thành công."
            );
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
                        alignItems={{
                            xs: "flex-start",
                            md: "center",
                        }}
                        justifyContent="space-between"
                        gap={2}
                        sx={{ width: "100%" }}
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
                                    Quản trị / Kho dược & Vật tư
                                </Typography>

                                <Chip
                                    icon={
                                        <VerifiedOutlinedIcon fontSize="small" />
                                    }
                                    label="Chuẩn GSP - FEFO"
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
                                sx={{
                                    mt: 1.5,
                                    color: "#111827",
                                    fontWeight: 800,
                                    lineHeight: 1.25,
                                }}
                            >
                                Quản lý tồn kho theo lô thuốc
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
                                Theo dõi số lô, số lượng tồn và hạn dùng
                                để cảnh báo tồn thấp, hết hạn và chuẩn bị
                                kiểm tra tồn khi bác sĩ kê đơn.
                            </Typography>
                        </Box>

                        <Button
                            variant="contained"
                            startIcon={
                                <AddCircleOutlineOutlinedIcon />
                            }
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
                                ml: { md: "auto" },
                                whiteSpace: "nowrap",
                                fontWeight: 800,
                                boxShadow:
                                    "0 8px 18px rgba(25, 118, 210, 0.18)",
                            }}
                        >
                            Thêm lô tồn
                        </Button>
                    </Stack>
                </Paper>

                <PharmacyModuleTabs active="inventory" />

                <InventoryStatCards summary={summary} />

                <InventoryFilters
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
                        onRetry={loadInventory}
                    />
                )}

                {loading ? (
                    <Loading />
                ) : (
                    <InventoryTable
                        inventoryItems={inventoryItems}
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

                <InventoryFormDialog
                    open={formOpen}
                    inventoryItem={selectedInventory}
                    medicines={medicines}
                    saving={saving}
                    onClose={() => setFormOpen(false)}
                    onSubmit={handleSaveInventory}
                />

                <ConfirmDialog
                    open={Boolean(deleteTarget)}
                    title="Xóa lô tồn kho"
                    message={
                        deleteTarget
                            ? `Bạn có chắc muốn xóa lô "${deleteTarget.batchNumber}" của thuốc "${deleteTarget.medicineName}"?`
                            : ""
                    }
                    confirmText="Xóa lô tồn"
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

export default InventoryPage;
