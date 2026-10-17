import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";

function StockShortageTable({ medicines, ariaLabel = "Đối chiếu thuốc thiếu" }) {
    return (
        <TableContainer sx={{ border: "1px solid #E5E9F0", borderRadius: 1, overflowX: "auto" }}>
            <Table size="small" sx={{ tableLayout: "fixed", width: "100%", "& .MuiTableCell-root": { px: { xs: 0.5, sm: 1 }, overflowWrap: "anywhere" } }} aria-label={ariaLabel}>
                <TableHead sx={{ bgcolor: "#F8FAFC" }}><TableRow>
                    {["Thuốc", "SL kê", "Còn hạn", "Thiếu"].map((title, index) => <TableCell key={title} align={index ? "right" : "left"}
                        sx={{ width: index ? "20%" : "40%", fontSize: 12, color: "#6B7280", fontWeight: 700, letterSpacing: 0 }}>{title}</TableCell>)}
                </TableRow></TableHead>
                <TableBody>{medicines.map((medicine) => <TableRow key={medicine.prescriptionDetailId ?? medicine.medicineId}>
                    <TableCell><Typography variant="body2" sx={{ fontWeight: 700 }}>{medicine.medicineName}</Typography>
                        <Typography variant="caption" sx={{ color: "#6B7280" }}>{medicine.unit}</Typography></TableCell>
                    <TableCell align="right">{medicine.quantityPrescribed}</TableCell>
                    <TableCell align="right">{medicine.quantityAvailable}</TableCell>
                    <TableCell align="right" sx={{ color: "#B91C1C", fontWeight: 800 }}>{Math.max(medicine.quantityPrescribed - medicine.quantityAvailable, 0)}</TableCell>
                </TableRow>)}</TableBody>
            </Table>
        </TableContainer>
    );
}

export default StockShortageTable;
