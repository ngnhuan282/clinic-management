import { useEffect, useState } from "react";
import { Box, Button, Chip, IconButton, InputAdornment, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Tooltip, Typography } from "@mui/material";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import { Link, useSearchParams } from "react-router-dom";
import { getDoctorStockReviews } from "../../../api/stockReviewApi";
import ClinicPageHeader, { ClinicPagination } from "../../../components/common/ClinicPageHeader";
import { AdminRefreshIcon, AdminSearchIcon, AdminViewIcon, clinicNumericCellSx, clinicSecondaryButtonSx, clinicSurfaceSx, clinicTableSx } from "../../../components/common/clinicUi";
import ErrorState from "../../../components/common/ErrorState";
import EmptyState from "../../../components/common/EmptyState";
import Loading from "../../../components/common/Loading";
import useAuth from "../../../hooks/useAuth";
import getApiErrorMessage from "../../../utils/errorHandler";
import { getStockReviewStatusConfig, getStockReviewWorkflowStatus } from "../../../utils/stockReviewWorkflow";

const formatTime = value => new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", dateStyle: "short", timeStyle: "short" }).format(new Date(value));

export default function DoctorStockReviewsPage() {
    const { userId } = useAuth();
    const [params, setParams] = useSearchParams();
    const search = params.get("search") || "";
    const status = ["", "Pending", "Resolved", "StillShortage"].includes(params.get("status")) ? params.get("status") : "Pending";
    const parsedPage = Number(params.get("page"));
    const pageNumber = Number.isSafeInteger(parsedPage) && parsedPage > 0 && parsedPage <= 2147483647 ? parsedPage : 1;
    const pageSize = [10, 25, 50].includes(Number(params.get("size"))) ? Number(params.get("size")) : 10;
    const [version, setVersion] = useState(0);
    const key = JSON.stringify([userId, search, status, pageNumber, pageSize, version]);
    const [result, setResult] = useState(null);
    const current = result?.key === key ? result : null;
    const loading = !current || current.loading;
    useEffect(() => {
        let active = true;
        async function load() {
            setResult({ key, loading: true });
            try {
                const data = await getDoctorStockReviews({ search, status, pageNumber, pageSize });
                if (active) setResult({ key, data });
            } catch (error) { if (active) setResult({ key, error: getApiErrorMessage(error) }); }
        }
        const timer = setTimeout(load, 200);
        return () => { active = false; clearTimeout(timer); };
    }, [key, search, status, pageNumber, pageSize]);
    function filter(name, value) {
        const next = new URLSearchParams(params);
        next.set(name, String(value));
        if (name !== "page") next.delete("page");
        setParams(next, { replace: true });
    }
    return <Stack spacing={3} sx={{ p: { xs: 2, md: 3 }, minWidth: 0, "& *": { letterSpacing: 0 } }}>
        <ClinicPageHeader
            icon={FactCheckOutlinedIcon}
            eyebrow="Bác sĩ / Đơn thuốc"
            title="Rà soát thuốc thiếu"
            description="Theo dõi và phản hồi các yêu cầu rà soát thuốc thiếu tồn kho từ quầy dược."
        />
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 1fr) 220px auto" }, gap: 1.5 }}>
            <TextField size="small" value={search} onChange={event => filter("search", event.target.value)} placeholder="Tìm mã đơn, tên bệnh nhân hoặc số điện thoại..."
                slotProps={{ htmlInput: { maxLength: 200, "aria-label": "Tìm yêu cầu rà soát" }, input: { startAdornment: <InputAdornment position="start"><AdminSearchIcon fontSize="small" /></InputAdornment> } }} />
            <TextField select size="small" label="Trạng thái" value={status} onChange={event => filter("status", event.target.value)}>
                <MenuItem value="Pending">Đang rà soát</MenuItem><MenuItem value="Resolved">Đã đối chiếu đủ tồn</MenuItem><MenuItem value="StillShortage">Vẫn thiếu thuốc</MenuItem><MenuItem value="">Tất cả</MenuItem>
            </TextField>
            <Tooltip title="Tải lại danh sách"><span><IconButton aria-label="Tải lại danh sách" disabled={loading} onClick={() => setVersion(value => value + 1)} sx={{ border: "1px solid #D6DAE2", borderRadius: 1, color: "primary.main", width: 42, height: 42 }}><AdminRefreshIcon /></IconButton></span></Tooltip>
        </Box>
        {loading ? <Loading /> : current.error ? <ErrorState message={current.error} onRetry={() => setVersion(value => value + 1)} /> :
            <Paper elevation={0} sx={{ ...clinicSurfaceSx, overflow: "hidden", minWidth: 0 }}>
                <TableContainer><Table sx={{ ...clinicTableSx, minWidth: 850, "& td": { verticalAlign: "top" } }}>
                    <TableHead><TableRow>{["Yêu cầu / Đơn thuốc", "Bệnh nhân", "Người gửi / Thời gian", "Thuốc thiếu", "Xử lý", "Thao tác"].map(label => <TableCell key={label}>{label}</TableCell>)}</TableRow></TableHead>
                    <TableBody>{!current.data.items.length ? <TableRow><TableCell colSpan={6}><EmptyState message="Không có yêu cầu rà soát phù hợp." /></TableCell></TableRow> : current.data.items.map(item =>
                        <TableRow key={item.reviewId} hover>
                            <TableCell><Typography variant="body2" color="primary" sx={{ fontWeight: 700 }}>{item.prescriptionCode}</Typography><Typography variant="caption" color="text.secondary">RS-{String(item.reviewId).padStart(5, "0")}</Typography></TableCell>
                            <TableCell><Typography variant="body2" sx={{ fontWeight: 700 }}>{item.patientName}</Typography><Typography variant="caption" color="text.secondary">SĐT: {item.patientPhone}</Typography></TableCell>
                            <TableCell><Typography variant="body2">{item.createdByName}</Typography><Typography variant="caption" color="text.secondary">{formatTime(item.createdAt)}</Typography></TableCell>
                            <TableCell sx={clinicNumericCellSx}>{item.shortageItems} loại</TableCell>
                            <TableCell><Chip size="small" label={getStockReviewStatusConfig(item).label} sx={{ bgcolor: getStockReviewStatusConfig(item).background, color: getStockReviewStatusConfig(item).color }} /></TableCell>
                            <TableCell><Button variant="outlined" component={Link} to={`${item.reviewId}${params.size ? `?${params}` : ""}`} startIcon={<AdminViewIcon />} sx={{ ...clinicSecondaryButtonSx, whiteSpace: "nowrap" }}>{getStockReviewWorkflowStatus(item) === "PendingDoctor" ? "Xử lý" : "Xem chi tiết"}</Button></TableCell>
                        </TableRow>)}</TableBody>
                </Table></TableContainer>
                <ClinicPagination
                    page={pageNumber}
                    pageSize={pageSize}
                    totalItems={current.data.totalItems}
                    pageSizeOptions={[10, 25, 50]}
                    label="yêu cầu"
                    navLabel="Phân trang rà soát thuốc thiếu"
                    disabled={loading}
                    onPageChange={page => filter("page", page)}
                    onPageSizeChange={size => filter("size", size)}
                />
            </Paper>}
    </Stack>;
}
