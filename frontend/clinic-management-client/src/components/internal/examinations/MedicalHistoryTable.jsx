import { Box, Button, Chip, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, Typography } from "@mui/material";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import EmptyState from "../../common/EmptyState";
import formatDate from "../../../utils/formatDate";

function MedicalHistoryTable({ items, pagination, filters, latestMedicalRecordId, onChange, onView }) {
    return (
        <Paper elevation={0} sx={{ border: "1px solid #E5E9F0", borderRadius: 2, overflow: "hidden", minWidth: 0 }}>
            <TableContainer>
                <Table sx={{ minWidth: 980 }} aria-label="Lịch sử khám của bệnh nhân">
                    <TableHead>
                        <TableRow sx={{ bgcolor: "#F8FAFC" }}>
                            {["Ngày khám", "Mã hồ sơ", "Bác sĩ / Khoa", "Chẩn đoán chính", "Đơn thuốc", "Thao tác"].map((label) => (
                                <TableCell key={label} align={label === "Thao tác" ? "center" : "left"}
                                    sx={{ color: "#6B7280", fontWeight: 800, fontSize: 12, textTransform: "uppercase", py: 2 }}>{label}</TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {!items.length ? <TableRow><TableCell colSpan={6}>
                            <EmptyState message="Chưa có lượt khám đã hoàn tất phù hợp với bộ lọc." />
                        </TableCell></TableRow> : items.map((item) => {
                            const primary = item.diagnoses.find((diagnosis) => diagnosis.isPrimary) || item.diagnoses[0];
                            const secondary = item.diagnoses.filter((diagnosis) => diagnosis !== primary);
                            const cancelled = item.prescriptionStatus === "Cancelled";
                            return (
                                <TableRow key={item.medicalRecordId} hover
                                    sx={{ "& td": { py: 2.25, verticalAlign: "top", borderColor: "#EDF1F7" } }}>
                                    <TableCell sx={{ width: 150 }}>
                                        <Typography variant="body2" sx={{ color: "#111827", fontWeight: 800, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>{formatDate(item.examinationDate)}</Typography>
                                        <Stack direction="row" sx={{ gap: 1, mt: 0.75, flexWrap: "wrap", alignItems: "center" }}>
                                            <Typography variant="caption" color="text.secondary">{String(item.startTime).slice(0, 5)}</Typography>
                                            {item.medicalRecordId === latestMedicalRecordId && <Chip size="small" label="Gần nhất" sx={{ height: 22, borderRadius: 1, bgcolor: "#ECFDF5", color: "#047857", fontWeight: 700 }} />}
                                        </Stack>
                                    </TableCell>
                                    <TableCell sx={{ width: 115 }}><Typography variant="body2" sx={{ color: "#005DAC", fontWeight: 800, whiteSpace: "nowrap" }}>HS-{String(item.medicalRecordId).padStart(5, "0")}</Typography></TableCell>
                                    <TableCell sx={{ width: "20%" }}>
                                        <Typography variant="body2" sx={{ color: "#111827", fontWeight: 700 }}>{item.doctorName}</Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5, lineHeight: 1.6 }}>{item.departmentName}</Typography>
                                    </TableCell>
                                    <TableCell sx={{ width: "27%" }}>
                                        {primary ? <Stack sx={{ gap: 0.75 }}>
                                            <Typography variant="body2" sx={{ color: "#111827", fontWeight: 700 }}>{primary.diseaseCode} – {primary.diseaseName}</Typography>
                                            {secondary.slice(0, 1).map((diagnosis) => <Typography key={diagnosis.diseaseId} variant="caption" color="text.secondary">{diagnosis.diseaseCode} – {diagnosis.diseaseName}</Typography>)}
                                            {secondary.length > 1 && <Typography variant="caption" color="text.secondary">+{secondary.length - 1} chẩn đoán khác</Typography>}
                                        </Stack> : <Typography variant="body2" color="text.secondary">Chưa có chẩn đoán</Typography>}
                                    </TableCell>
                                    <TableCell sx={{ width: "19%" }}>
                                        <Chip size="small" label={cancelled ? "Đơn đã hủy" : item.prescriptionItemCount ? `${item.prescriptionItemCount} loại thuốc` : "Không có đơn thuốc"}
                                            sx={{ height: 24, borderRadius: 1, fontWeight: 700,
                                                color: cancelled ? "#B45309" : item.prescriptionItemCount ? "#047857" : "#6B7280",
                                                bgcolor: cancelled ? "#FFFBEB" : item.prescriptionItemCount ? "#ECFDF5" : "#F3F4F6" }} />
                                        {!cancelled && item.medicineNames.length > 0 && <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75, lineHeight: 1.6 }}>{item.medicineNames.join(", ")}{item.prescriptionItemCount > item.medicineNames.length ? ", …" : ""}</Typography>}
                                    </TableCell>
                                    <TableCell align="center" sx={{ width: 160 }}>
                                        <Button variant="outlined" size="small"
                                            startIcon={<VisibilityOutlinedIcon />} onClick={() => onView(item)} sx={{ minHeight: 36, whiteSpace: "nowrap" }}>Xem chi tiết</Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
            <Box sx={{ borderTop: "1px solid #E5E9F0", overflowX: "auto" }}>
                <TablePagination component="div" count={pagination?.totalItems || 0} page={filters.pageNumber - 1}
                    rowsPerPage={filters.pageSize} rowsPerPageOptions={[5, 10, 20, 50]}
                    onPageChange={(_, page) => onChange({ pageNumber: page + 1 })}
                    onRowsPerPageChange={(event) => onChange({ pageSize: Number(event.target.value), pageNumber: 1 })}
                    labelRowsPerPage="Số dòng/trang" labelDisplayedRows={({ from, to, count }) => `${from}-${to} trong ${count}`}
                    getItemAriaLabel={(type) => type === "next" ? "Trang sau" : "Trang trước"} />
            </Box>
        </Paper>
    );
}

export default MedicalHistoryTable;
