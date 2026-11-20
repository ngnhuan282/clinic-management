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
import { AdminEditIcon, AdminLockIcon, AdminUnlockIcon, clinicColors, clinicTableSx } from "../../common/clinicUi";

export default function DoctorsTable({ items, canManage, onAction }) {
    return (
        <TableContainer sx={{ overflowX: "auto" }}>
            <Table aria-label="Danh sách hồ sơ bác sĩ" sx={{ ...clinicTableSx, minWidth: 880 }}>
                <TableHead>
                    <TableRow>
                        <TableCell>Bác sĩ</TableCell>
                        <TableCell>Khoa / Chuyên khoa</TableCell>
                        <TableCell>Kinh nghiệm</TableCell>
                        <TableCell>Tài khoản liên kết</TableCell>
                        <TableCell>Trạng thái</TableCell>
                        <TableCell align="right">Thao tác</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {items.map(doctor => (
                        <TableRow key={doctor.doctorId} hover>
                            <TableCell>
                                <Typography sx={{ fontWeight: 700, color: clinicColors.heading, overflowWrap: "anywhere", maxWidth: 220 }}>
                                    {doctor.fullName}
                                </Typography>
                                <Typography variant="body2" sx={{ color: "#64748B", fontSize: 13 }}>
                                    {doctor.title}
                                </Typography>
                            </TableCell>

                            <TableCell>
                                <Typography sx={{ fontSize: 13.5, fontWeight: 650, color: clinicColors.heading }}>
                                    {doctor.departmentName}
                                </Typography>
                                <Typography variant="caption" sx={{ color: "#64748B" }}>
                                    {doctor.specializationName}
                                </Typography>
                            </TableCell>

                            <TableCell sx={{ whiteSpace: "nowrap" }}>{doctor.experienceYears} năm</TableCell>

                            <TableCell>
                                <Typography variant="body2" color={doctor.userId ? "text.primary" : "text.secondary"}>
                                    {doctor.userId ? `#${doctor.userId}` : "Chưa liên kết"}
                                </Typography>
                            </TableCell>

                            <TableCell>
                                <Chip
                                    size="small"
                                    label={doctor.isActive ? "Hoạt động" : "Đã khóa"}
                                    sx={{
                                        bgcolor: doctor.isActive ? "#DCFCE7" : "#F1F5F9",
                                        color: doctor.isActive ? "#065F46" : "#475569",
                                        border: `1px solid ${doctor.isActive ? "#86EFAC" : "#CBD5E1"}`,
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
                                        aria-label={`Sửa hồ sơ ${doctor.fullName}`}
                                        onClick={() => onAction("edit", doctor)}
                                        sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 650, fontSize: 12.5, borderColor: "#BFDBFE", color: clinicColors.primary, bgcolor: "#F8FBFF" }}
                                    >
                                        Sửa
                                    </Button>
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        color={doctor.isActive ? "warning" : "success"}
                                        startIcon={doctor.isActive ? <AdminLockIcon sx={{ fontSize: 16 }} /> : <AdminUnlockIcon sx={{ fontSize: 16 }} />}
                                        disabled={!canManage}
                                        aria-label={`${doctor.isActive ? "Khóa" : "Mở khóa"} ${doctor.fullName}`}
                                        onClick={() => onAction("status", doctor)}
                                        sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 650, fontSize: 12.5 }}
                                    >
                                        {doctor.isActive ? "Khóa" : "Mở khóa"}
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
