import { Alert, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, Switch, TextField, Typography } from "@mui/material";

export default function DoctorFormDialog({ manager, departments, specializations }) {
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
    const availableSpecializations = specializations.filter(item => String(item.departmentId) === String(values.departmentId));

    return (
        <Dialog open={create || edit} onClose={close} fullWidth maxWidth="sm" aria-labelledby="doctor-form-title">
            <form onSubmit={submit} noValidate>
                <DialogTitle id="doctor-form-title">{create ? "Thêm hồ sơ bác sĩ" : "Sửa hồ sơ bác sĩ"}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2.5} sx={{ pt: 1 }}>
                        {error && <Alert severity="error">{error}</Alert>}
                        <TextField label="Họ và tên" required {...field("fullName")} slotProps={{ htmlInput: { maxLength: 100 } }} />
                        <TextField label="Học vị / Chức danh" required {...field("title")} slotProps={{ htmlInput: { maxLength: 50 } }} />
                        <TextField
                            label="Số năm kinh nghiệm"
                            type="number"
                            required
                            {...field("experienceYears")}
                            slotProps={{ htmlInput: { min: 0, max: 70 } }}
                        />
                        <TextField
                            label="Giới thiệu"
                            multiline
                            minRows={3}
                            {...field("biography")}
                            slotProps={{ htmlInput: { maxLength: 500 } }}
                        />
                        <TextField select label="Khoa" required {...field("departmentId")}>
                            <MenuItem value="">Chọn khoa</MenuItem>
                            {departments.map(item => (
                                <MenuItem key={item.departmentId} value={String(item.departmentId)}>
                                    {item.name}
                                </MenuItem>
                            ))}
                        </TextField>
                        <TextField select label="Chuyên khoa" required disabled={busy || !values.departmentId} {...field("specializationId")}>
                            <MenuItem value="">Chọn chuyên khoa</MenuItem>
                            {availableSpecializations.map(item => (
                                <MenuItem key={item.specializationId} value={String(item.specializationId)}>
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
