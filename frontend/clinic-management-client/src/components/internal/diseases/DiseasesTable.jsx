import { Chip, IconButton, LinearProgress, Paper, Skeleton, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, Tooltip, Typography } from "@mui/material";
import { DeleteOutlineOutlined, EditOutlined } from "@mui/icons-material";
import EmptyState from "../../common/EmptyState";
import { clinicColors, clinicSurfaceSx, clinicTableSx } from "../../common/clinicUi";

const activeStatus = {
    true: { label: "Đang áp dụng", color: "#047857", backgroundColor: "#ECFDF5" },
    false: { label: "Tạm ngưng", color: "#B45309", backgroundColor: "#FFFBEB" },
};
const formatDate = value => value ? new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value)) : "–";

export default function DiseasesTable({ diseases, pagination, filters, loading, saving, error, onPageChange, onPageSizeChange, onEdit, onDelete }) {
    const totalItems = pagination?.totalItems || 0;
    const currentPage = Math.min(Math.max(filters.pageNumber - 1, 0), Math.max(0, Math.ceil(totalItems / filters.pageSize) - 1));
    return <Paper variant="outlined" sx={{ ...clinicSurfaceSx, overflow: "hidden" }} aria-busy={loading}>
        <Stack direction="row" spacing={1} sx={{ p: 2.5, alignItems: "center", borderBottom: "1px solid #E2E8F0" }}>
            <Typography sx={{ fontWeight: 600 }}>Danh sách bệnh</Typography>
            {!loading && !error && <Chip size="small" label={`${totalItems} bệnh`} sx={{ bgcolor: "#F0F9FF", color: "#0369A1" }} />}
        </Stack>
        {loading && <LinearProgress aria-label="Đang tải danh mục bệnh" />}
        <Typography sx={{ px: 2.5, pt: 1.5, display: { xs: "block", md: "none" }, fontSize: 12, color: clinicColors.muted }}>Vuốt ngang bảng để xem đầy đủ thông tin và thao tác.</Typography>
        <TableContainer sx={{ overflowX: "auto" }}><Table aria-label="Danh sách bệnh" sx={{ ...clinicTableSx, minWidth: 980 }}><TableHead><TableRow>
            {["Mã bệnh", "Tên bệnh", "Mô tả / ghi chú", "Trạng thái", "Ngày tạo", "Thao tác"].map(label => <TableCell key={label} align={label === "Thao tác" ? "right" : "left"}>{label}</TableCell>)}
        </TableRow></TableHead><TableBody>
            {loading ? Array.from({ length: 5 }, (_, index) => <TableRow key={index}>{Array.from({ length: 6 }, (_, cell) => <TableCell key={cell}><Skeleton /></TableCell>)}</TableRow>) : error ? <TableRow><TableCell colSpan={6}><EmptyState message="Chưa tải được danh mục bệnh. Hãy thử tải lại dữ liệu." /></TableCell></TableRow> : diseases.length ? diseases.map(disease => {
                const status = activeStatus[String(disease.isActive)] || activeStatus.false;
                return <TableRow hover key={disease.diseaseId}>
                    <TableCell sx={{ color: "#0284C7", fontWeight: 600, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{disease.diseaseCode}</TableCell>
                    <TableCell sx={{ minWidth: 180, maxWidth: 250 }}><Typography sx={{ fontSize: 14, fontWeight: 600, color: clinicColors.heading, overflowWrap: "anywhere" }}>{disease.diseaseName}</Typography></TableCell>
                    <TableCell sx={{ maxWidth: 360 }}><Typography sx={{ fontSize: 13, color: clinicColors.muted, lineHeight: 1.65, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{disease.description || "Chưa có mô tả"}</Typography></TableCell>
                    <TableCell><Chip size="small" label={status.label} sx={{ color: status.color, bgcolor: status.backgroundColor, fontWeight: 500, whiteSpace: "nowrap" }} /></TableCell>
                    <TableCell sx={{ color: clinicColors.muted, whiteSpace: "nowrap" }}>{formatDate(disease.createdAt)}</TableCell>
                    <TableCell align="right"><Stack direction="row" spacing={0.5} sx={{ justifyContent: "flex-end" }}>
                        <Tooltip title="Sửa bệnh"><span><IconButton size="small" aria-label={`Sửa bệnh ${disease.diseaseCode}`} disabled={saving} onClick={() => onEdit(disease)} sx={{ color: "#0284C7" }}><EditOutlined fontSize="small" /></IconButton></span></Tooltip>
                        <Tooltip title="Xóa bệnh"><span><IconButton size="small" aria-label={`Xóa bệnh ${disease.diseaseCode}`} disabled={saving} onClick={() => onDelete(disease)} sx={{ color: "#DC2626" }}><DeleteOutlineOutlined fontSize="small" /></IconButton></span></Tooltip>
                    </Stack></TableCell>
                </TableRow>;
            }) : <TableRow><TableCell colSpan={6}><EmptyState message="Không có bệnh phù hợp. Hãy đổi bộ lọc hoặc thêm bệnh mới." /></TableCell></TableRow>}
        </TableBody></Table></TableContainer>
        <TablePagination component="div" count={totalItems} page={currentPage} rowsPerPage={filters.pageSize} onPageChange={(_, page) => onPageChange(page + 1)} onRowsPerPageChange={event => onPageSizeChange(Number(event.target.value))} rowsPerPageOptions={[5, 10, 20, 50]} labelRowsPerPage="Số dòng:" labelDisplayedRows={({ from, to, count }) => `${from}–${to} / ${count} bệnh`} getItemAriaLabel={type => type === "next" ? "Trang tiếp" : "Trang trước"} disabled={loading || saving} sx={{ borderTop: "1px solid #E2E8F0", "& .MuiTablePagination-toolbar": { flexWrap: "wrap", px: 2 }, "& .MuiTablePagination-spacer": { display: { xs: "none", sm: "block" } }, "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": { fontSize: 13 } }} />
    </Paper>;
}
