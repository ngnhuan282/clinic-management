import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
} from "@mui/material";
import {
    clinicButtonSx,
    clinicDialogActionsSx,
    clinicDialogPaperSx,
    clinicDialogTitleSx,
    clinicSecondaryButtonSx,
} from "./clinicUi";

function ConfirmDialog({
    open,
    title = "Xác nhận thao tác",
    message = "Bạn có chắc chắn muốn thực hiện thao tác này?",
    confirmText = "Xác nhận",
    cancelText = "Hủy",
    onConfirm,
    onCancel,
    loading = false,
    confirmColor = "error",
}) {
    return (
        <Dialog
            open={open}
            onClose={loading ? undefined : onCancel}
            fullWidth
            maxWidth="xs"
            slotProps={{ paper: { sx: clinicDialogPaperSx } }}
        >
            <DialogTitle sx={clinicDialogTitleSx}>{title}</DialogTitle>

            <DialogContent sx={{ px: 3, pb: 2.5 }}>
                <DialogContentText sx={{ color: "#334155", fontSize: 14.5, lineHeight: 1.65 }}>
                    {message}
                </DialogContentText>
            </DialogContent>

            <DialogActions sx={clinicDialogActionsSx}>
                <Button
                    variant="outlined"
                    onClick={onCancel}
                    disabled={loading}
                    sx={clinicSecondaryButtonSx}
                >
                    {cancelText}
                </Button>

                <Button
                    onClick={onConfirm}
                    variant="contained"
                    color={confirmColor}
                    disabled={loading}
                    sx={clinicButtonSx}
                >
                    {loading ? "Đang xử lý..." : confirmText}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default ConfirmDialog;
