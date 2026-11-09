import { Alert, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField } from "@mui/material";
import { ROLE_LABELS } from "../../../routes/roleAccess";
import DoctorProfilePicker from "./DoctorProfilePicker";

export default function UserAccountDialog({ manager, roles }) {
    const { action, values, errors, error, busy, change, submit, close } = manager;
    const create = action?.type === "create";
    const roleName = roles.find(role => role.roleId === Number(values.roleId))?.roleName;
    const field = name => ({ value: values[name], onChange: event => change(name, event.target.value),
        error: Boolean(errors[name]), helperText: errors[name], disabled: busy, fullWidth: true });
    return <Dialog open={create || action?.type === "edit"} onClose={close} fullWidth maxWidth="sm" aria-labelledby="user-account-title">
        <form onSubmit={submit} noValidate>
            <DialogTitle id="user-account-title">{create ? "Tạo tài khoản nhân viên" : "Sửa thông tin tài khoản"}</DialogTitle>
            <DialogContent><Stack spacing={2.5} sx={{ pt: 1 }}>
                {error && <Alert severity="error">{error}</Alert>}
                {create && <TextField label="Tên đăng nhập" required autoComplete="off" {...field("username")} slotProps={{ htmlInput: { maxLength: 50 } }} />}
                <TextField label="Họ và tên" required {...field("fullName")} slotProps={{ htmlInput: { maxLength: 100 } }} />
                <TextField label="Email" type="email" {...field("email")} slotProps={{ htmlInput: { maxLength: 100 } }} />
                <TextField label="Số điện thoại" type="tel" {...field("phone")} slotProps={{ htmlInput: { maxLength: 15 } }} />
                {create && <><TextField label="Mật khẩu ban đầu" type="password" autoComplete="new-password" required {...field("password")} helperText={errors.password || "Từ 8 ký tự, tối đa 72 byte UTF-8."} />
                    <TextField select label="Vai trò nhân viên" required {...field("roleId")}><MenuItem value="">Chọn vai trò</MenuItem>{roles.filter(role => role.roleName !== "Patient").map(role => <MenuItem key={role.roleId} value={String(role.roleId)}>{ROLE_LABELS[role.roleName] || role.roleName}</MenuItem>)}</TextField>
                    {["Doctor", "DepartmentHead"].includes(roleName) && <DoctorProfilePicker key={roleName} value={values.doctorId} onChange={value => change("doctorId", value)} disabled={busy} error={errors.doctorId} />}
                </>}
            </Stack></DialogContent>
            <DialogActions sx={{ p: 3 }}><Button onClick={close} disabled={busy}>Hủy</Button><Button type="submit" variant="contained" disabled={busy} startIcon={busy ? <CircularProgress size={16} color="inherit" /> : undefined}>{busy ? "Đang lưu…" : create ? "Tạo tài khoản" : "Lưu thông tin"}</Button></DialogActions>
        </form>
    </Dialog>;
}
