import { Box, Chip, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import LocalPharmacyOutlinedIcon from "@mui/icons-material/LocalPharmacyOutlined";
import formatDate from "../../../utils/formatDate";

const statusLabels = { Issued: "Đã phát hành", Dispensed: "Đã cấp thuốc", Cancelled: "Đã hủy" };

function MedicalHistoryPrescriptionSection({ prescription, embedded = false }) {
    const Surface = embedded ? Box : Paper;
    return (
        <Surface {...(embedded ? {} : { elevation: 0 })} sx={{ border: embedded ? 0 : "1px solid #E5E9F0", borderRadius: embedded ? 0 : 2, overflow: "hidden" }}>
            <Stack direction="row" sx={{ gap: 1.25, px: 2.5, py: embedded ? 2 : 2.5, alignItems: "center", flexWrap: "wrap",
                bgcolor: embedded ? "#F8FAFC" : "transparent", borderBottom: embedded ? "1px solid #E5E9F0" : 0 }}>
                <LocalPharmacyOutlinedIcon sx={{ color: "#005DAC", fontSize: embedded ? 20 : 24, flexShrink: 0 }} />
                <Typography component={embedded ? "h3" : "h2"} variant={embedded ? "subtitle2" : "subtitle1"} sx={{ color: "#111827", fontWeight: 800 }}>Đơn thuốc</Typography>
                {prescription && <Chip size="small" label={statusLabels[prescription.status] || prescription.status}
                    sx={{ ml: "auto", borderRadius: 1, fontWeight: 700, bgcolor: prescription.status === "Cancelled" ? "#FFFBEB" : "#ECFDF5",
                        color: prescription.status === "Cancelled" ? "#B45309" : "#047857" }} />}
            </Stack>
            {!prescription ? <Typography variant="body2" color="text.secondary" sx={{ px: 2.5, pb: 2.5, pt: embedded ? 2.5 : 0 }}>Lượt khám này không có đơn thuốc.</Typography> : <>
                <Stack direction="row" sx={{ gap: 2, px: 2.5, pb: 2, pt: embedded ? 2.5 : 0, flexWrap: "wrap" }}>
                    <Typography variant="body2" sx={{ color: "#005DAC", fontWeight: 800 }}>{prescription.prescriptionCode}</Typography>
                    <Typography variant="body2" color="text.secondary">Ngày kê: {formatDate(prescription.prescriptionDate)}</Typography>
                </Stack>
                <Box sx={{ px: 2.5, pb: prescription.notes ? 0 : 2.5 }}>
                    <TableContainer sx={{ border: "1px solid #E5E9F0", borderRadius: 1 }}>
                        <Table aria-label="Đơn thuốc của lượt khám" sx={{ minWidth: 620 }}>
                            <TableHead><TableRow sx={{ bgcolor: "#F8FAFC" }}>
                                {["Thuốc", "Số lượng", "Liều dùng", "Cách dùng"].map((label) => <TableCell key={label} sx={{ color: "#6B7280", fontWeight: 800, fontSize: 12, textTransform: "uppercase" }}>{label}</TableCell>)}
                            </TableRow></TableHead>
                            <TableBody>{prescription.details.map((detail) => <TableRow key={detail.prescriptionDetailId} sx={{ "& td": { verticalAlign: "top" }, "&:last-child td": { borderBottom: 0 } }}>
                                <TableCell sx={{ width: "32%" }}><Typography variant="body2" sx={{ color: "#111827", fontWeight: 700 }}>{detail.medicineName}</Typography>
                                    <Typography variant="caption" color="text.secondary">{detail.medicineCode}</Typography></TableCell>
                                <TableCell sx={{ whiteSpace: "nowrap", fontWeight: 700 }}>{detail.quantity} {detail.unit}</TableCell>
                                <TableCell sx={{ width: "22%", whiteSpace: "pre-wrap" }}>{detail.dosage || "—"}</TableCell>
                                <TableCell sx={{ whiteSpace: "pre-wrap" }}>{detail.instructions || "—"}</TableCell>
                            </TableRow>)}</TableBody>
                        </Table>
                    </TableContainer>
                </Box>
                {prescription.notes && <Box sx={embedded ? { mx: 2.5, my: 2.5, p: 2, borderLeft: "3px solid #90CAF9", bgcolor: "#F8FAFC" } : { p: 2.5 }}>
                    <Typography component="h3" variant="caption" sx={{ color: "#6B7280", fontWeight: 800,
                        borderBottom: embedded ? "1px solid #E5E9F0" : 0, pb: embedded ? 1 : 0 }}>LỜI DẶN</Typography>
                    <Typography variant="body2" sx={{ mt: embedded ? 1 : 0.75, whiteSpace: "pre-wrap", overflowWrap: "anywhere", color: "#374151", lineHeight: 1.7 }}>{prescription.notes}</Typography>
                </Box>}
            </>}
        </Surface>
    );
}

export default MedicalHistoryPrescriptionSection;
