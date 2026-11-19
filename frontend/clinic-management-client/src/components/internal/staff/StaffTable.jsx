import {
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
import { LinkRounded, LockOpenRounded, LockOutlined } from "@mui/icons-material";
import { AdminEditIcon, clinicColors, clinicTableSx } from "../../common/clinicUi";

export default function StaffTable({ items, canManage, canLink, onAction }) {
    return (
        <TableContainer sx={{ overflowX: "auto" }}>
            <Table aria-label="Danh sách hồ sơ nhân viên" sx={{ ...clinicTableSx, minWidth: 820 }}>
                <TableHead>
                    <TableRow>
                        <TableCell>Nhân viên</TableCell>
                        <TableCell>Vị trí công việc</TableCell>
                        <TableCell>Tài khoản liên kết</TableCell>
                        <TableCell>Trạng thái</TableCell>
                        <TableCell align="right">Thao tác</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {items.map(staff => (
                        <TableRow key={staff.staffId} hover>
                            <TableCell>
                                <Typography sx={{ fontWeight: 700, color: clinicColors.heading, overflowWrap: "anywhere", maxWidth: 240 }}>
                                    {staff.fullName}
                                </Typography>
                            </TableCell>

                            <TableCell>{staff.jobPositionName}</TableCell>

                            <TableCell>
                                {staff.userId ? (
                                    <Typography variant="body2">@{staff.username}</Typography>
                                ) : (
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        startIcon={<LinkRounded sx={{ fontSize: 16 }} />}
                                        disabled={!canLink}
                                        aria-label={`Liên kết tài khoản cho ${staff.fullName}`}
                                        onClick={() => onAction("link", staff)}
                                        sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 650, fontSize: 12.5 }}
                                    >
                                        Liên kết tài khoản
                                    </Button>
                                )}
                            </TableCell>

                            <TableCell>
                                <Chip
                                    size="small"
                                    label={staff.isActive ? "Hoạt động" : "Đã khóa"}
                                    sx={{
                                        bgcolor: staff.isActive ? "#DCFCE7" : "#F1F5F9",
                                        color: staff.isActive ? "#065F46" : "#475569",
                                        border: `1px solid ${staff.isActive ? "#86EFAC" : "#CBD5E1"}`,
                                        fontWeight: 650,
                                    }}
                                />
                            </TableCell>

                            <TableCell align="right">
                                <Stack direction="row" spacing={0.75} useFlexGap sx={{ justifyContent: "flex-end", flexWrap: "wrap" }}>
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        startIcon={<AdminEditIcon sx={{ fontSize: 16 }} />}
                                        disabled={!canManage}
                                        aria-label={`Sửa hồ sơ ${staff.fullName}`}
                                        onClick={() => onAction("edit", staff)}
                                        sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 650, fontSize: 12.5, borderColor: "#BFDBFE", color: clinicColors.primary, bgcolor: "#F8FBFF" }}
                                    >
                                        Sửa
                                    </Button>
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        color={staff.isActive ? "warning" : "success"}
                                        startIcon={staff.isActive ? <LockOutlined sx={{ fontSize: 16 }} /> : <LockOpenRounded sx={{ fontSize: 16 }} />}
                                        disabled={!canManage}
                                        aria-label={`${staff.isActive ? "Khóa" : "Mở khóa"} ${staff.fullName}`}
                                        onClick={() => onAction("status", staff)}
                                        sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 650, fontSize: 12.5 }}
                                    >
                                        {staff.isActive ? "Khóa" : "Mở khóa"}
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
