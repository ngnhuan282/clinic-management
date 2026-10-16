import { Button, InputAdornment, Paper, TextField } from "@mui/material";
import RestartAltOutlinedIcon from "@mui/icons-material/RestartAltOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";

function MedicalHistoryFilters({ filters, onChange, onReset }) {
    const handleChange = (key) => (event) => onChange({ [key]: event.target.value, pageNumber: 1 });
    return (
        <Paper elevation={0} sx={{ p: 2, border: "1px solid #E5E9F0", borderRadius: 2,
            display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))", lg: "minmax(0, 1fr) 158px 158px 112px" }, gap: 1.5 }}>
            <TextField size="small" fullWidth placeholder="Tìm mã hồ sơ, bác sĩ hoặc chẩn đoán…"
                value={filters.search} onChange={handleChange("search")}
                sx={{ gridColumn: { sm: "1 / -1", lg: "auto" } }}
                slotProps={{ htmlInput: { "aria-label": "Tìm lịch sử khám", maxLength: 200 }, input: { startAdornment:
                    <InputAdornment position="start"><SearchOutlinedIcon fontSize="small" sx={{ color: "#9CA3AF" }} /></InputAdornment> } }} />
            <TextField size="small" label="Từ ngày" type="date" value={filters.fromDate} onChange={handleChange("fromDate")}
                slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: filters.toDate || undefined } }} />
            <TextField size="small" label="Đến ngày" type="date" value={filters.toDate} onChange={handleChange("toDate")}
                slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: filters.fromDate || undefined } }} />
            <Button variant="outlined" startIcon={<RestartAltOutlinedIcon />} onClick={onReset}
                sx={{ minHeight: 40, whiteSpace: "nowrap", gridColumn: { sm: "1 / -1", lg: "auto" } }}>Đặt lại</Button>
        </Paper>
    );
}

export default MedicalHistoryFilters;
