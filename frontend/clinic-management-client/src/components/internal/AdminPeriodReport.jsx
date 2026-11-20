import { useEffect, useState } from "react";
import {
    Alert, Box, Button, LinearProgress, Paper, Stack, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, TextField, Typography,
} from "@mui/material";
import adminDashboardApi from "../../api/adminDashboardApi";
import getApiErrorMessage from "../../utils/errorHandler";
import { clinicToday } from "../../utils/scheduleCalendar";
import { clinicFieldSx, clinicSurfaceSx } from "../common/clinicUi";

const money = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 2 });
const count = new Intl.NumberFormat("vi-VN");
const calendarDay = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeZone: "UTC" });

function DailyReport({ appointments, revenue }) {
    const visitsByDay = new Map(appointments.dailyAppointments.map(row => [row.date.slice(0, 10), row]));
    const revenueByDay = new Map(revenue.dailyRevenue.map(row => [row.date.slice(0, 10), row]));
    const days = [...new Set([...visitsByDay.keys(), ...revenueByDay.keys()])].sort();
    return (
        <Stack spacing={2}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 1, sm: 3 }}>
                <Typography>Tổng lịch hẹn <strong>{count.format(appointments.summary.totalAppointments)}</strong></Typography>
                <Typography>Đã hoàn tất <strong>{count.format(appointments.summary.completedCount)}</strong></Typography>
                <Typography>Đang khám <strong>{count.format(appointments.summary.inProgressCount)}</strong></Typography>
                <Typography>Đã hủy <strong>{count.format(appointments.summary.cancelledCount)}</strong></Typography>
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 1, sm: 3 }}>
                <Typography>Tổng doanh thu <strong>{money.format(revenue.summary.totalRevenue)}</strong></Typography>
                <Typography>Thực thu sau hoàn tiền <strong>{money.format(revenue.summary.patientPayments)}</strong></Typography>
                <Typography>BHYT ghi trên chứng từ <strong>{money.format(revenue.summary.insurancePayments)}</strong></Typography>
            </Stack>
            {days.length ? (
                <TableContainer sx={{ maxHeight: 460 }}>
                    <Table stickyHeader size="small" aria-label="Doanh thu và lượt khám theo ngày" sx={{ minWidth: 620 }}>
                        <TableHead>
                            <TableRow>
                                <TableCell>Ngày</TableCell>
                                <TableCell align="right">Lịch hẹn</TableCell>
                                <TableCell align="right">Đã khám</TableCell>
                                <TableCell align="right">Thực thu</TableCell>
                                <TableCell align="right">BHYT</TableCell>
                                <TableCell align="right">Doanh thu</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {days.map(day => {
                                const visits = visitsByDay.get(day);
                                const amounts = revenueByDay.get(day);
                                return <TableRow key={day}>
                                    <TableCell component="th" scope="row">{calendarDay.format(new Date(day))}</TableCell>
                                    <TableCell align="right">{count.format(visits?.totalAppointments ?? 0)}</TableCell>
                                    <TableCell align="right">{count.format(visits?.completedCount ?? 0)}</TableCell>
                                    <TableCell align="right">{money.format(amounts?.patientPayments ?? 0)}</TableCell>
                                    <TableCell align="right">{money.format(amounts?.insurancePayments ?? 0)}</TableCell>
                                    <TableCell align="right">{money.format(amounts?.totalRevenue ?? 0)}</TableCell>
                                </TableRow>;
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            ) : <Alert severity="info">Không có lượt khám hoặc chứng từ trong kỳ này.</Alert>}
        </Stack>
    );
}

export default function AdminPeriodReport({ userId, revision }) {
    const [period, setPeriod] = useState(() => {
        const today = clinicToday();
        return { from: `${today.slice(0, 7)}-01`, to: today };
    });
    const [filters, setFilters] = useState(period);
    const [retry, setRetry] = useState(0);
    const [state, setState] = useState(null);
    const { from, to } = filters;
    const key = `${userId}:${from}:${to}:${revision}:${retry}`;
    const current = state?.key === key ? state : null;
    const valid = period.from && period.to && period.from <= period.to
        && (Date.parse(period.to) - Date.parse(period.from)) / 86400000 < 366;

    useEffect(() => {
        const request = new AbortController();
        adminDashboardApi.getPeriod(from, to, request.signal).then(data => {
            if (!request.signal.aborted) setState({ key, data });
        }).catch(error => {
            if (!request.signal.aborted) setState({ key, error: getApiErrorMessage(error, "Không thể tải báo cáo theo kỳ.") });
        });
        return () => request.abort();
    }, [from, to, key]);

    return (
        <Paper variant="outlined" sx={{ ...clinicSurfaceSx, p: { xs: 2, md: 3 }, minWidth: 0 }}>
            <Stack spacing={2}>
                <Typography component="h2" variant="h6">Báo cáo theo kỳ</Typography>
                <Stack component="form" direction={{ xs: "column", sm: "row" }} gap={1.5}
                    onSubmit={event => { event.preventDefault(); if (valid) setFilters(period); }}>
                    <TextField required label="Từ ngày" type="date" size="small" value={period.from}
                        onChange={event => setPeriod({ ...period, from: event.target.value })} slotProps={{ inputLabel: { shrink: true } }} sx={clinicFieldSx} />
                    <TextField required label="Đến ngày" type="date" size="small" value={period.to}
                        onChange={event => setPeriod({ ...period, to: event.target.value })} slotProps={{ inputLabel: { shrink: true } }} sx={clinicFieldSx} />
                    <Button type="submit" variant="contained" disabled={!valid}>Xem báo cáo</Button>
                </Stack>
                {!valid && <Alert severity="warning">Chọn khoảng ngày hợp lệ, tối đa 366 ngày.</Alert>}
                <Box aria-live="polite">
                    {!current && <LinearProgress aria-label="Đang tải báo cáo" />}
                    {current?.error && <Alert severity="error" action={<Button onClick={() => setRetry(v => v + 1)}>Thử lại</Button>}>{current.error}</Alert>}
                    {current?.data && <>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                            {calendarDay.format(new Date(from))} – {calendarDay.format(new Date(to))}
                        </Typography>
                        <DailyReport {...current.data} />
                    </>}
                </Box>
            </Stack>
        </Paper>
    );
}
