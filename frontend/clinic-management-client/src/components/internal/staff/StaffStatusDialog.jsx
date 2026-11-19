import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from "@mui/material";

export default function StaffStatusDialog({ manager }) {
    const { action, error, busy, submit, close } = manager;
    const status = action?.type === "status";
    const locking = Boolean(action?.staff?.isActive);

    return (
        <Dialog open={status} onClose={close} fullWidth maxWidth="sm" aria-labelledby="staff-status-title">
            <form onSubmit={submit}>
                <DialogTitle id="staff-status-title">{locking ? "Khóa hồ sơ nhân viên" : "Mở khóa hồ sơ nhân viên"}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ pt: 1 }}>
                        {error && <Alert severity="error">{error}</Alert>}
                        <Typography>
                            {action?.staff?.fullName} · {action?.staff?.jobPositionName}
                        </Typography>
                        <Alert severity="info">
                            {locking
                                ? "Hồ sơ bị khóa được đánh dấu ngừng hoạt động trong danh sách nhân sự."
                                : "Mở khóa để hồ sơ hoạt động trở lại trong danh sách nhân sự."}
                        </Alert>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={close} disabled={busy}>
                        Hủy
                    </Button>
                    <Button type="submit" variant="contained" disabled={busy}>
                        {busy ? "Đang lưu…" : "Xác nhận"}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
