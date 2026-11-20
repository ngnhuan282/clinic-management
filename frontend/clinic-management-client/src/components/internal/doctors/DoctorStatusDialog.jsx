import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from "@mui/material";

export default function DoctorStatusDialog({ manager }) {
    const { action, error, busy, submit, close } = manager;
    const status = action?.type === "status";
    const locking = Boolean(action?.doctor?.isActive);

    return (
        <Dialog open={status} onClose={close} fullWidth maxWidth="sm" aria-labelledby="doctor-status-title">
            <form onSubmit={submit}>
                <DialogTitle id="doctor-status-title">{locking ? "Khóa hồ sơ bác sĩ" : "Mở khóa hồ sơ bác sĩ"}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ pt: 1 }}>
                        {error && <Alert severity="error">{error}</Alert>}
                        <Typography>
                            {action?.doctor?.fullName} · {action?.doctor?.title}
                        </Typography>
                        <Alert severity="info">
                            {locking
                                ? "Hồ sơ bị khóa sẽ không còn hiển thị khi đặt lịch khám hoặc đăng ký ca mới."
                                : "Mở khóa để hồ sơ hiển thị lại khi đặt lịch khám và đăng ký ca."}
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
