import { useMemo, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    MenuItem,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import AddCircleOutlineOutlinedIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import InventoryOutlinedIcon from "@mui/icons-material/InventoryOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";

import formatCurrency from "../../../utils/formatCurrency";
import { getPurchaseOrderStatusConfig } from "./purchaseOrderStatus";

function toDateInput(value) {
    if (!value) {
        return "";
    }

    return String(value).slice(0, 10);
}

function todayInput() {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60_000;
    return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function createRow(detail = {}) {
    return {
        rowId: detail.purchaseOrderDetailId ||
            `${Date.now()}-${Math.random()}`,
        medicineId: detail.medicineId || "",
        batchNumber: detail.batchNumber || "",
        expiryDate: toDateInput(detail.expiryDate),
        quantity: detail.quantity || 1,
        unitPrice: detail.unitPrice || "",
    };
}

function buildInitialForm(purchaseOrder) {
    return {
        supplierId: purchaseOrder?.supplierId || "",
        orderDate: toDateInput(purchaseOrder?.orderDate) || todayInput(),
        notes: purchaseOrder?.notes || "",
        details: purchaseOrder?.details?.length
            ? purchaseOrder.details.map(createRow)
            : [createRow()],
    };
}

const fieldSx = {
    "& .MuiOutlinedInput-root": {
        borderRadius: 1.5,
        backgroundColor: "#FFFFFF",
    },
};

function SectionTitle({ icon: Icon, number, title, action = null }) {
    return (
        <Stack
            direction={{ xs: "column", sm: "row" }}
            gap={1.25}
            sx={{
                pb: 1.25,
                alignItems: { xs: "stretch", sm: "center" },
                justifyContent: "space-between",
                borderBottom: "1px solid #E5E9F0",
            }}
        >
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <Icon sx={{ fontSize: 18, color: "#005DAC" }} />
                <Typography
                    variant="subtitle2"
                    sx={{
                        color: "#64748B",
                        fontWeight: 800,
                        letterSpacing: 0,
                        textTransform: "uppercase",
                    }}
                >
                    {number}. {title}
                </Typography>
            </Stack>

            {action}
        </Stack>
    );
}

function PurchaseOrderFormDialog({
    open,
    mode = "create",
    purchaseOrder,
    suppliers,
    medicines,
    saving,
    onClose,
    onSubmit,
}) {
    const [form, setForm] = useState(() =>
        buildInitialForm(purchaseOrder)
    );
    const [error, setError] = useState("");

    const readOnly = mode === "view";
    const isEditing = mode === "edit";
    const totalAmount = useMemo(
        () => form.details.reduce(
            (sum, detail) => sum +
                Number(detail.quantity || 0) *
                Number(detail.unitPrice || 0),
            0
        ),
        [form.details]
    );
    const availableMedicines = useMemo(
        () => medicines.filter((medicine) =>
            medicine.supplierId === Number(form.supplierId)
        ),
        [form.supplierId, medicines]
    );
    const status = purchaseOrder
        ? getPurchaseOrderStatusConfig(purchaseOrder.status)
        : null;

    const handleFieldChange = (field) => (event) => {
        setForm((current) => ({
            ...current,
            [field]: event.target.value,
        }));
    };

    const handleSupplierChange = (event) => {
        const supplierId = event.target.value;

        setForm((current) => ({
            ...current,
            supplierId,
            details: current.details.map((detail) => ({
                ...detail,
                medicineId: medicines.some((medicine) =>
                    medicine.medicineId === Number(detail.medicineId) &&
                    medicine.supplierId === Number(supplierId)
                )
                    ? detail.medicineId
                    : "",
            })),
        }));
    };

    const handleDetailChange = (rowId, field) => (event) => {
        setForm((current) => ({
            ...current,
            details: current.details.map((detail) =>
                detail.rowId === rowId
                    ? { ...detail, [field]: event.target.value }
                    : detail
            ),
        }));
    };

    const addDetail = () => {
        setForm((current) => ({
            ...current,
            details: [...current.details, createRow()],
        }));
    };

    const removeDetail = (rowId) => {
        setForm((current) => ({
            ...current,
            details: current.details.filter(
                (detail) => detail.rowId !== rowId
            ),
        }));
    };

    const validate = () => {
        if (!form.supplierId) {
            return "Vui lòng chọn nhà cung cấp.";
        }

        if (!form.orderDate) {
            return "Vui lòng chọn ngày nhập phiếu.";
        }

        if (form.details.length === 0) {
            return "Phiếu nhập cần có ít nhất một dòng thuốc.";
        }

        if (form.details.some((detail) => !detail.medicineId)) {
            return "Vui lòng chọn thuốc cho tất cả các dòng.";
        }

        if (form.details.some((detail) => !detail.batchNumber.trim())) {
            return "Vui lòng nhập số lô cho tất cả các dòng.";
        }

        if (form.details.some((detail) => !detail.expiryDate)) {
            return "Vui lòng chọn hạn dùng cho tất cả các lô.";
        }

        if (form.details.some((detail) => detail.expiryDate < todayInput())) {
            return "Không thể nhập lô thuốc đã hết hạn.";
        }

        if (form.details.some((detail) => Number(detail.quantity) <= 0)) {
            return "Số lượng của mỗi dòng phải lớn hơn 0.";
        }

        if (form.details.some((detail) => Number(detail.unitPrice) <= 0)) {
            return "Đơn giá của mỗi dòng phải lớn hơn 0.";
        }

        const keys = form.details.map((detail) =>
            `${detail.medicineId}-${detail.batchNumber.trim().toUpperCase()}`
        );

        if (new Set(keys).size !== keys.length) {
            return "Một thuốc và số lô không được lặp lại trong cùng phiếu.";
        }

        return "";
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");

        const validationMessage = validate();
        if (validationMessage) {
            setError(validationMessage);
            return;
        }

        const payload = {
            supplierId: Number(form.supplierId),
            orderDate: `${form.orderDate}T00:00:00`,
            notes: form.notes.trim() || null,
            details: form.details.map((detail) => ({
                medicineId: Number(detail.medicineId),
                quantity: Number(detail.quantity),
                unitPrice: Number(detail.unitPrice),
                batchNumber: detail.batchNumber.trim(),
                expiryDate: detail.expiryDate,
            })),
        };

        try {
            await onSubmit(payload, purchaseOrder?.purchaseOrderId || null);
            onClose();
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={saving ? undefined : onClose}
            fullWidth
            maxWidth="lg"
            slotProps={{
                paper: {
                    sx: {
                        width: "min(1180px, calc(100vw - 32px))",
                        borderRadius: 2.5,
                        overflow: "hidden",
                        boxShadow: "0 24px 48px rgba(15, 23, 42, 0.22)",
                    },
                },
            }}
        >
            <DialogTitle
                sx={{
                    px: 3,
                    py: 2.25,
                    borderBottom: "1px solid #E5E9F0",
                    backgroundColor: "#FFFFFF",
                }}
            >
                <Stack
                    direction="row"
                    spacing={2}
                    sx={{ alignItems: "center" }}
                >
                    <Box
                        sx={{
                            width: 46,
                            height: 46,
                            flexShrink: 0,
                            borderRadius: 2,
                            display: "grid",
                            placeItems: "center",
                            color: "#005DAC",
                            backgroundColor: "#EFF6FF",
                        }}
                    >
                        <ReceiptLongOutlinedIcon />
                    </Box>

                    <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Stack
                            direction="row"
                            spacing={1}
                            useFlexGap
                            sx={{
                                alignItems: "center",
                                flexWrap: "wrap",
                            }}
                        >
                            <Typography variant="h5" sx={{ fontWeight: 800 }}>
                                {readOnly
                                    ? purchaseOrder?.purchaseOrderCode
                                    : isEditing
                                    ? "Chỉnh sửa phiếu nhập"
                                    : "Tạo phiếu nhập mới"}
                            </Typography>

                            {status && (
                                <Box
                                    component="span"
                                    sx={{
                                        px: 1,
                                        py: 0.35,
                                        borderRadius: 1,
                                        color: status.color,
                                        backgroundColor: status.backgroundColor,
                                        border: `1px solid ${status.borderColor}`,
                                        fontSize: 12,
                                        fontWeight: 800,
                                    }}
                                >
                                    {status.label}
                                </Box>
                            )}
                        </Stack>

                        <Typography variant="body2" sx={{ mt: 0.5, color: "#64748B" }}>
                            Mỗi dòng ghi nhận một thuốc, số lô và hạn dùng cụ thể.
                        </Typography>
                    </Box>

                    <IconButton
                        aria-label="Đóng"
                        onClick={onClose}
                        disabled={saving}
                        sx={{ color: "#94A3B8" }}
                    >
                        <CloseOutlinedIcon />
                    </IconButton>
                </Stack>
            </DialogTitle>

            <DialogContent
                sx={{
                    px: 3,
                    pt: "32px !important",
                    pb: 2.5,
                    backgroundColor: "#FFFFFF",
                }}
            >
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <Box
                    component="form"
                    id="purchase-order-form"
                    onSubmit={handleSubmit}
                >
                    <SectionTitle
                        icon={ReceiptLongOutlinedIcon}
                        number="1"
                        title="Thông tin phiếu nhập"
                    />

                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: {
                                xs: "1fr",
                                md: "minmax(0, 1.5fr) minmax(190px, 0.7fr)",
                            },
                            gap: 2,
                            mt: 2,
                        }}
                    >
                        <TextField
                            select
                            label="Nhà cung cấp"
                            value={form.supplierId}
                            onChange={handleSupplierChange}
                            fullWidth
                            required
                            disabled={readOnly}
                            sx={fieldSx}
                        >
                            {suppliers.map((supplier) => (
                                <MenuItem
                                    key={supplier.supplierId}
                                    value={supplier.supplierId}
                                >
                                    {supplier.supplierName}
                                </MenuItem>
                            ))}
                        </TextField>

                        <TextField
                            label="Ngày lập phiếu"
                            type="date"
                            value={form.orderDate}
                            onChange={handleFieldChange("orderDate")}
                            fullWidth
                            required
                            disabled={readOnly}
                            slotProps={{ inputLabel: { shrink: true } }}
                            sx={fieldSx}
                        />
                    </Box>

                    <TextField
                        label="Ghi chú"
                        value={form.notes}
                        onChange={handleFieldChange("notes")}
                        fullWidth
                        multiline
                        minRows={2}
                        slotProps={{
                            htmlInput: { maxLength: 500 },
                        }}
                        disabled={readOnly}
                        sx={{ ...fieldSx, mt: 2 }}
                    />

                    <Box sx={{ mt: 3 }}>
                        <SectionTitle
                            icon={InventoryOutlinedIcon}
                            number="2"
                            title="Chi tiết lô thuốc"
                            action={!readOnly ? (
                                <Button
                                    variant="outlined"
                                    startIcon={<AddCircleOutlineOutlinedIcon />}
                                    onClick={addDetail}
                                    sx={{ whiteSpace: "nowrap" }}
                                >
                                    Thêm dòng thuốc
                                </Button>
                            ) : null}
                        />
                    </Box>

                    <Stack spacing={1.5} sx={{ mt: 2 }}>
                        {form.details.map((detail, index) => {
                            const medicine = medicines.find(
                                (item) => item.medicineId === Number(detail.medicineId)
                            );
                            const lineTotal = Number(detail.quantity || 0) *
                                Number(detail.unitPrice || 0);

                            return (
                                <Box
                                    key={detail.rowId}
                                    sx={{
                                        p: 2,
                                        borderRadius: 2,
                                        border: "1px solid #E5E9F0",
                                        backgroundColor: "#F8FAFC",
                                    }}
                                >
                                    <Stack
                                        direction="row"
                                        sx={{
                                            mb: 1.5,
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                        }}
                                    >
                                        <Typography variant="body2" sx={{ fontWeight: 800 }}>
                                            Dòng {index + 1}
                                        </Typography>

                                        {!readOnly && form.details.length > 1 && (
                                            <IconButton
                                                size="small"
                                                color="error"
                                                aria-label={`Xóa dòng thuốc ${index + 1}`}
                                                onClick={() => removeDetail(detail.rowId)}
                                            >
                                                <DeleteOutlineOutlinedIcon fontSize="small" />
                                            </IconButton>
                                        )}
                                    </Stack>

                                    <Box
                                        sx={{
                                            display: "grid",
                                            gridTemplateColumns: {
                                                xs: "1fr",
                                                md: "minmax(220px, 1.8fr) minmax(130px, 1fr) minmax(145px, 1fr)",
                                                lg: "minmax(210px, 1.7fr) minmax(120px, 0.9fr) minmax(140px, 0.9fr) minmax(105px, 0.7fr) minmax(135px, 0.9fr) minmax(140px, 0.9fr)",
                                            },
                                            gap: 1.5,
                                            alignItems: "start",
                                        }}
                                    >
                                        <TextField
                                            select
                                            label="Thuốc"
                                            value={detail.medicineId}
                                            onChange={handleDetailChange(detail.rowId, "medicineId")}
                                            fullWidth
                                            required
                                            disabled={readOnly || !form.supplierId}
                                            size="small"
                                            sx={fieldSx}
                                        >
                                            {availableMedicines.map((item) => (
                                                <MenuItem key={item.medicineId} value={item.medicineId}>
                                                    {item.medicineCode} - {item.medicineName}
                                                </MenuItem>
                                            ))}
                                        </TextField>

                                        <TextField
                                            label="Số lô"
                                            value={detail.batchNumber}
                                            onChange={handleDetailChange(detail.rowId, "batchNumber")}
                                            fullWidth
                                            required
                                            disabled={readOnly}
                                            size="small"
                                            slotProps={{
                                                htmlInput: { maxLength: 50 },
                                            }}
                                            sx={fieldSx}
                                        />

                                        <TextField
                                            label="Hạn dùng"
                                            type="date"
                                            value={detail.expiryDate}
                                            onChange={handleDetailChange(detail.rowId, "expiryDate")}
                                            fullWidth
                                            required
                                            disabled={readOnly}
                                            size="small"
                                            slotProps={{
                                                inputLabel: { shrink: true },
                                                htmlInput: { min: todayInput() },
                                            }}
                                            sx={fieldSx}
                                        />

                                        <TextField
                                            label={`Số lượng${medicine?.unit ? ` (${medicine.unit})` : ""}`}
                                            type="number"
                                            value={detail.quantity}
                                            onChange={handleDetailChange(detail.rowId, "quantity")}
                                            fullWidth
                                            required
                                            disabled={readOnly}
                                            size="small"
                                            slotProps={{
                                                htmlInput: { min: 1, step: 1 },
                                            }}
                                            sx={fieldSx}
                                        />

                                        <TextField
                                            label="Đơn giá"
                                            type="number"
                                            value={detail.unitPrice}
                                            onChange={handleDetailChange(detail.rowId, "unitPrice")}
                                            fullWidth
                                            required
                                            disabled={readOnly}
                                            size="small"
                            slotProps={{
                                htmlInput: { min: 1, step: 1 },
                            }}
                                            sx={fieldSx}
                                        />

                                        <TextField
                                            label="Thành tiền"
                                            value={formatCurrency(lineTotal)}
                                            fullWidth
                                            disabled
                                            size="small"
                                            sx={fieldSx}
                                        />
                                    </Box>
                                </Box>
                            );
                        })}
                    </Stack>

                    <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1}
                        sx={{
                            mt: 2.5,
                            justifyContent: "flex-end",
                            alignItems: { xs: "stretch", sm: "center" },
                        }}
                    >
                        <Typography color="text.secondary">
                            Tổng giá trị phiếu
                        </Typography>
                        <Typography
                            variant="h6"
                            sx={{ color: "#005DAC", fontWeight: 800 }}
                        >
                            {formatCurrency(totalAmount)}
                        </Typography>
                    </Stack>

                    {readOnly && purchaseOrder?.receivedAt && (
                        <Alert
                            severity="success"
                            icon={<InventoryOutlinedIcon />}
                            sx={{ mt: 2.5 }}
                        >
                            Phiếu đã được nhập vào tồn kho bởi {purchaseOrder.receivedByName}.
                        </Alert>
                    )}
                </Box>
            </DialogContent>

            <DialogActions
                sx={{
                    px: 3,
                    py: 2,
                    borderTop: "1px solid #E5E9F0",
                    backgroundColor: "#F8FAFC",
                }}
            >
                <Button
                    onClick={onClose}
                    disabled={saving}
                    variant="outlined"
                    sx={{ minWidth: 96 }}
                >
                    {readOnly ? "Đóng" : "Hủy bỏ"}
                </Button>

                {!readOnly && (
                    <Button
                        type="submit"
                        form="purchase-order-form"
                        variant="contained"
                        startIcon={<SaveOutlinedIcon />}
                        disabled={
                            saving ||
                            suppliers.length === 0 ||
                            medicines.length === 0
                        }
                        sx={{ minWidth: 150 }}
                    >
                        {saving ? "Đang lưu..." : "Lưu bản nháp"}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
}

export default PurchaseOrderFormDialog;
