import {
    Box, Chip, Paper, Stack, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Typography,
} from "@mui/material";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import NotesOutlinedIcon from "@mui/icons-material/NotesOutlined";

function formatUnit(value) {
    const units = { vien: "viên", binh: "bình", goi: "gói", hop: "hộp", but: "bút" };
    return units[value?.trim()?.toLowerCase()] || value || "đơn vị";
}

export function PrescriptionMedicineSummary({ medicine, index, dispensed = false, quantityDispensed = 0,
    hasShortage = medicine.availableQuantity < medicine.quantity, children }) {
    const unit = formatUnit(medicine.unit);
    const shortage = !dispensed && hasShortage;
    const titleId = `medicine-${medicine.prescriptionDetailId || medicine.medicineId}`;
    const instructions = [
        { label: "Liều dùng", value: medicine.dosage || "Chưa ghi" },
        { label: "Hướng dẫn", value: medicine.instructions || "Chưa ghi" },
    ];
    const quantities = [
        { label: "Kê đơn", value: medicine.quantity },
        { label: dispensed ? "Đã giao" : "Tồn còn hạn", value: dispensed ? quantityDispensed : medicine.availableQuantity },
        ...(!dispensed ? [{ label: "Thiếu", value: Math.max(medicine.quantity - medicine.availableQuantity, 0), color: shortage ? "#B91C1C" : "#111827" }] : []),
    ];
    const tableSx = {
        width: "100%", tableLayout: "fixed",
        "& .MuiTableCell-root": { px: { xs: 1, sm: 1.5 }, py: 1.25, fontSize: 16, lineHeight: 1.5, overflowWrap: "anywhere", fontVariantNumeric: "tabular-nums" },
        "& .MuiTableCell-head": { fontSize: 14, fontWeight: 600, color: "#51647D", letterSpacing: 0, textTransform: "none" },
        "& .MuiTableRow-root": { height: 44 },
        "& tbody tr:last-child > *": { borderBottom: 0 },
    };

    return <Paper component="article" aria-labelledby={titleId} elevation={0}
        sx={{ p: { xs: 2, sm: 2.5 }, border: "1px solid #D9E2EF", borderRadius: 2, boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)", minWidth: 0 }}>
        <Stack direction="row" useFlexGap sx={{ gap: 1.5, mb: 2.5, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
            <Stack direction="row" spacing={1.5} sx={{ minWidth: 0, flex: "1 1 180px", alignItems: "center" }}>
                <Box sx={{ width: 28, height: 28, flexShrink: 0, display: "grid", placeItems: "center", bgcolor: "#F0F4F8", border: "1px solid #D9E2EF", color: "#005DAC", borderRadius: 1, fontSize: 14, fontWeight: 600 }}>{index + 1}</Box>
                <Box sx={{ minWidth: 0 }}>
                    <Typography id={titleId} component="h3" variant="subtitle1" sx={{ fontSize: 18, fontWeight: 600, color: "#111827", overflowWrap: "anywhere" }}>{medicine.medicineName}</Typography>
                    <Typography variant="caption" sx={{ fontSize: 14, color: "#6B7280", overflowWrap: "anywhere" }}>{medicine.medicineCode}</Typography>
                </Box>
            </Stack>
            <Chip size="small" label={shortage ? `Thiếu ${Math.max(medicine.quantity - medicine.availableQuantity, 0)} ${unit}` : dispensed ? "Đã giao" : "Đủ tồn"}
                sx={{ maxWidth: "100%", bgcolor: shortage ? "#FEF2F2" : "#ECFDF5", border: `1px solid ${shortage ? "#FECACA" : "#A7F3D0"}`, color: shortage ? "#B91C1C" : "#047857", fontSize: 13, fontWeight: 500 }} />
        </Stack>
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "repeat(2, minmax(0, 1fr))" }, alignItems: "start" }}>
            <Box sx={{ minWidth: 0 }}>
                <Stack direction="row" spacing={1} sx={{ mb: 1, alignItems: "center" }}>
                    <NotesOutlinedIcon color="primary" fontSize="small" />
                    <Typography component="h4" variant="body2" sx={{ fontSize: 16, fontWeight: 700 }}>Thông tin kê đơn</Typography>
                </Stack>
                <TableContainer sx={{ border: "1px solid #D9E2EF", borderRadius: 1 }}>
                    <Table size="small" aria-label={`Thông tin kê đơn ${medicine.medicineName}`} sx={tableSx}>
                        <TableBody>{instructions.map(field => <TableRow key={field.label}>
                            <TableCell component="th" scope="row" sx={{ width: "34%", color: "#51647D", borderRight: "1px solid #E5E9F0", fontWeight: 500 }}>{field.label}</TableCell>
                            <TableCell sx={{ whiteSpace: "pre-wrap" }}>{field.value}</TableCell>
                        </TableRow>)}</TableBody>
                    </Table>
                </TableContainer>
            </Box>
            <Box sx={{ minWidth: 0 }}>
                <Stack direction="row" spacing={1} sx={{ mb: 1, alignItems: "center" }}>
                    <FactCheckOutlinedIcon color="primary" fontSize="small" />
                    <Typography component="h4" variant="body2" sx={{ fontSize: 16, fontWeight: 700 }}>{dispensed ? "Số lượng đã giao" : "Đối chiếu số lượng"}</Typography>
                </Stack>
                <TableContainer sx={{ border: "1px solid #D9E2EF", borderRadius: 1 }}>
                    <Table size="small" aria-label={`Đối chiếu số lượng ${medicine.medicineName}`} sx={tableSx}>
                        <TableHead><TableRow>{quantities.map(field => <TableCell key={field.label}>{field.label}</TableCell>)}</TableRow></TableHead>
                        <TableBody><TableRow>{quantities.map(field => <TableCell key={field.label} sx={{ color: field.color || "#111827", fontWeight: field.color === "#B91C1C" ? 600 : 500 }}>{field.value} {unit}</TableCell>)}</TableRow></TableBody>
                    </Table>
                </TableContainer>
            </Box>
        </Box>
        {children}
    </Paper>;
}

export function PrescriptionNotes({ notes }) {
    if (!notes) return null;

    return <Box component="section" aria-label="Lời dặn bác sĩ" sx={{ minWidth: 0, bgcolor: "#FFFFFF", border: "1px solid #D9E2EF", borderRadius: 1, overflow: "hidden" }}>
        <Stack direction="row" spacing={1} sx={{ p: 2, alignItems: "center", bgcolor: "#F8FAFC", borderBottom: "1px solid #E5E9F0" }}>
            <NotesOutlinedIcon color="primary" fontSize="small" />
            <Typography component="h3" variant="body2" sx={{ fontSize: 16, fontWeight: 600 }}>Lời dặn bác sĩ</Typography>
        </Stack>
        <Typography variant="body2" sx={{ p: 2, fontSize: 16, lineHeight: 1.5, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{notes}</Typography>
    </Box>;
}
