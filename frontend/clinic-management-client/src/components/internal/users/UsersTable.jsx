import {
    Box,
    Button,
    Chip,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from "@mui/material";
import { ManageAccountsRounded } from "@mui/icons-material";
import { AdminEditIcon, AdminLockIcon, AdminUnlockIcon, clinicColors, clinicTableSx } from "../../common/clinicUi";
import { ROLE_LABELS } from "../../../routes/roleAccess";

const date = (value) =>
    new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(value));

export default function UsersTable({ items, userId, canEdit, canAssignRole, onAction }) {
    return (
        <TableContainer sx={{ overflowX: "auto" }}>
            <Table aria-label="Danh sách tài khoản" sx={{ ...clinicTableSx, minWidth: 960 }}>
                <TableHead>
                    <TableRow>
                        <TableCell>Tài khoản</TableCell>
                        <TableCell>Vai trò</TableCell>
                        <TableCell>Hồ sơ bác sĩ / Khoa</TableCell>
                        <TableCell>Liên hệ</TableCell>
                        <TableCell>Trạng thái</TableCell>
                        <TableCell>Ngày tạo</TableCell>
                        <TableCell align="right">Thao tác</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {items.map((user) => (
                        <TableRow key={user.userId} hover>
                            <TableCell>
                                <Typography
                                    sx={{
                                        fontWeight: 700,
                                        color: clinicColors.heading,
                                        overflowWrap: "anywhere",
                                        maxWidth: 230,
                                    }}
                                >
                                    {user.fullName}
                                </Typography>
                                <Typography variant="body2" sx={{ color: "#64748B", fontSize: 13 }}>
                                    @{user.username}
                                    {user.userId === userId ? " · Bạn" : ""}
                                </Typography>
                            </TableCell>

                            <TableCell>
                                <Chip
                                    size="small"
                                    label={ROLE_LABELS[user.role] || user.role}
                                    sx={{
                                        bgcolor: "#E8F2FC",
                                        color: clinicColors.primary,
                                        border: "1px solid #BFDBFE",
                                        fontWeight: 650,
                                    }}
                                />
                            </TableCell>

                            <TableCell>
                                {user.doctorId ? (
                                    <Box>
                                        <Typography sx={{ fontSize: 13.5, fontWeight: 650, color: clinicColors.heading }}>
                                            {user.doctorName}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: "#64748B" }}>
                                            {user.departmentName}
                                        </Typography>
                                    </Box>
                                ) : (
                                    <Typography variant="body2" color="text.secondary">
                                        {["Doctor", "DepartmentHead"].includes(user.role)
                                            ? "Chưa liên kết hồ sơ bác sĩ"
                                            : "—"}
                                    </Typography>
                                )}
                            </TableCell>

                            <TableCell sx={{ overflowWrap: "anywhere", maxWidth: 230 }}>
                                <Typography sx={{ fontSize: 13.5 }}>{user.email || "—"}</Typography>
                                <Typography variant="caption" sx={{ color: "#64748B" }}>
                                    {user.phone || "Chưa có số điện thoại"}
                                </Typography>
                            </TableCell>

                            <TableCell>
                                <Chip
                                    size="small"
                                    label={user.status ? "Hoạt động" : "Đã khóa"}
                                    sx={{
                                        bgcolor: user.status ? "#DCFCE7" : "#F1F5F9",
                                        color: user.status ? "#065F46" : "#475569",
                                        border: `1px solid ${user.status ? "#86EFAC" : "#CBD5E1"}`,
                                        fontWeight: 650,
                                    }}
                                />
                            </TableCell>

                            <TableCell sx={{ whiteSpace: "nowrap", color: "#475569" }}>
                                {date(user.createdAt)}
                            </TableCell>

                            <TableCell align="right">
                                <Stack
                                    direction="row"
                                    spacing={0.75}
                                    useFlexGap
                                    sx={{ justifyContent: "flex-end", flexWrap: "wrap" }}
                                >
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        startIcon={<AdminEditIcon sx={{ fontSize: 16 }} />}
                                        disabled={!canEdit}
                                        aria-label={`Sửa thông tin ${user.username}`}
                                        onClick={() => onAction("edit", user)}
                                        sx={{
                                            borderRadius: "8px",
                                            textTransform: "none",
                                            fontWeight: 650,
                                            fontSize: 12.5,
                                            borderColor: "#BFDBFE",
                                            color: clinicColors.primary,
                                            bgcolor: "#F8FBFF",
                                        }}
                                    >
                                        Sửa
                                    </Button>

                                    <Button
                                        size="small"
                                        variant="outlined"
                                        startIcon={<ManageAccountsRounded sx={{ fontSize: 16 }} />}
                                        disabled={!canAssignRole || user.userId === userId}
                                        aria-label={`Đổi vai trò ${user.username}`}
                                        onClick={() => onAction("role", user)}
                                        sx={{
                                            borderRadius: "8px",
                                            textTransform: "none",
                                            fontWeight: 650,
                                            fontSize: 12.5,
                                            borderColor: "#CBD5E1",
                                            color: "#334155",
                                        }}
                                    >
                                        Vai trò
                                    </Button>

                                    <Button
                                        size="small"
                                        variant="outlined"
                                        color={user.status ? "warning" : "success"}
                                        startIcon={
                                            user.status ? (
                                                <AdminLockIcon sx={{ fontSize: 16 }} />
                                            ) : (
                                                <AdminUnlockIcon sx={{ fontSize: 16 }} />
                                            )
                                        }
                                        disabled={!canEdit || user.userId === userId}
                                        aria-label={`${user.status ? "Khóa" : "Mở khóa"} ${user.username}`}
                                        onClick={() => onAction("status", user)}
                                        sx={{
                                            borderRadius: "8px",
                                            textTransform: "none",
                                            fontWeight: 650,
                                            fontSize: 12.5,
                                        }}
                                    >
                                        {user.status ? "Khóa" : "Mở khóa"}
                                    </Button>
                                </Stack>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
