import { Box, Button, Chip, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { ROLE_LABELS } from "../../../routes/roleAccess";

const date = value => new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(value));

export default function UsersTable({ items, userId, canEdit, canAssignRole, onAction }) {
    return <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
        <Table aria-label="Danh sách tài khoản" sx={{ minWidth: 900 }}>
            <TableHead><TableRow><TableCell>Tài khoản</TableCell><TableCell>Vai trò</TableCell><TableCell>Hồ sơ bác sĩ / Khoa</TableCell><TableCell>Liên hệ</TableCell><TableCell>Trạng thái</TableCell><TableCell>Ngày tạo</TableCell><TableCell align="right">Thao tác</TableCell></TableRow></TableHead>
            <TableBody>{items.map(user => <TableRow key={user.userId}>
                <TableCell><Typography sx={{ fontWeight: 650, overflowWrap: "anywhere", maxWidth: 220 }}>{user.fullName}</Typography><Typography variant="body2" color="text.secondary">{user.username}{user.userId === userId ? " · Bạn" : ""}</Typography></TableCell>
                <TableCell><Chip size="small" label={ROLE_LABELS[user.role] || user.role} variant="outlined" /></TableCell>
                <TableCell>{user.doctorId ? <Box><Typography variant="body2">{user.doctorName}</Typography><Typography variant="caption" color="text.secondary">{user.departmentName}</Typography></Box> : <Typography variant="body2" color="text.secondary">{["Doctor", "DepartmentHead"].includes(user.role) ? "Chưa liên kết hồ sơ bác sĩ" : "—"}</Typography>}</TableCell>
                <TableCell sx={{ overflowWrap: "anywhere", maxWidth: 220 }}><Typography variant="body2">{user.email || "—"}</Typography><Typography variant="caption" color="text.secondary">{user.phone || "Chưa có số điện thoại"}</Typography></TableCell>
                <TableCell><Chip size="small" label={user.status ? "Hoạt động" : "Đã khóa"} color={user.status ? "success" : "default"} /></TableCell>
                <TableCell sx={{ whiteSpace: "nowrap" }}>{date(user.createdAt)}</TableCell>
                <TableCell align="right"><Stack spacing={0.5} sx={{ alignItems: "flex-end" }}>
                    <Button size="small" disabled={!canEdit} aria-label={`Sửa thông tin ${user.username}`} onClick={() => onAction("edit", user)}>Sửa thông tin</Button>
                    <Button size="small" disabled={!canAssignRole || user.userId === userId} aria-label={`Đổi vai trò ${user.username}`} onClick={() => onAction("role", user)}>Đổi vai trò</Button>
                    <Button size="small" color={user.status ? "warning" : "success"} disabled={!canEdit || user.userId === userId} aria-label={`${user.status ? "Khóa" : "Mở khóa"} ${user.username}`} onClick={() => onAction("status", user)}>{user.status ? "Khóa" : "Mở khóa"}</Button>
                </Stack></TableCell>
            </TableRow>)}</TableBody>
        </Table>
    </TableContainer>;
}
