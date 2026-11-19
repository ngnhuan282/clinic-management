import { Alert, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, Switch, TextField, Typography } from "@mui/material";

export default function StaffFormDialog({ manager, jobPositions }) {
    const { action, values, errors, error, busy, change, submit, close } = manager;
    const create = action?.type === "create";
    const edit = action?.type === "edit";
    const field = name => ({
        value: values[name],
        onChange: event => change(name, event.target.value),
        error: Boolean(errors[name]),
        helperText: errors[name],
        disabled: busy,
        fullWidth: true,
    });

    const current = action?.staff;
    const options = edit && current && !jobPositions.some(item => item.jobPositionId === current.jobPositionId)
        ? [...jobPositions, { jobPositionId: current.jobPositionId, name: `${current.jobPositionName} (đã khóa)` }]
        : jobPositions;

    return (
        <Dialog open={create || edit} onClose={close} fullWidth maxWidth="sm" aria-labelledby="staff-form-title">
            <form onSubmit={submit} noValidate>
                <DialogTitle id="staff-form-title">{create ? "Thêm hồ sơ nhân viên" : "Sửa hồ sơ nhân viên"}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2.5} sx={{ pt: 1 }}>
                        {error && <Alert severity="error">{error}</Alert>}
                        <TextField label="Họ và tên" required {...field("fullName")} slotProps={{ htmlInput: { maxLength: 100 } }} />
                        <TextField select label="Vị trí công việc" required {...field("jobPositionId")}>
                            <MenuItem value="">Chọn vị trí công việc</MenuItem>
                            {options.map(item => (
                                <MenuItem key={item.jobPositionId} value={String(item.jobPositionId)}>
                                    {item.name}
                                </MenuItem>
                            ))}
                        </TextField>
                        {edit && (
                            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                                <Switch checked={values.isActive} disabled={busy} onChange={event => change("isActive", event.target.checked)} />
                                <Typography variant="body2">{values.isActive ? "Hồ sơ đang hoạt động" : "Hồ sơ đang bị khóa"}</Typography>
                            </Stack>
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={close} disabled={busy}>
                        Hủy
                    </Button>
                    <Button type="submit" variant="contained" disabled={busy} startIcon={busy ? <CircularProgress size={16} color="inherit" /> : undefined}>
                        {busy ? "Đang lưu…" : create ? "Tạo hồ sơ" : "Lưu thông tin"}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
