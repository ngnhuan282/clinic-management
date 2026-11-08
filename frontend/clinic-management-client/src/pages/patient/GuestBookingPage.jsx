import { useCallback, useEffect, useRef, useState } from "react";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import { Alert, Box, Button, Checkbox, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Grid, Link, MenuItem, Paper, Stack, TextField, Typography } from "@mui/material";
import { getAvailableSlots, getDepartments, getDoctorsByDepartment } from "../../api/bookingApi";
import { createGuestAppointment } from "../../api/publicApi";
import PublicPage, { ResourceState } from "../../components/patient/PublicPage";
import usePublicResource from "../../hooks/usePublicResource";
import { CLINIC } from "../../data/publicContent";
import { clinicToday, validateGuestBooking } from "../../utils/publicBooking";
import getApiErrorMessage from "../../utils/errorHandler";

const sectionSx = { p: { xs: 2, md: 3 }, borderRadius: 3 };
const time = value => String(value).slice(0, 5);
const dateLabel = value => value?.split("T")[0].split("-").reverse().join("/");

export default function GuestBookingPage() {
    const [params] = useSearchParams();
    const [values, setValues] = useState(() => ({
        departmentId: params.get("departmentId") || "", doctorId: params.get("doctorId") || "",
        date: params.get("date") >= clinicToday() ? params.get("date") : clinicToday(), startTime: "", patientName: "", patientPhone: "", reason: "", consent: false,
    }));
    const [errors, setErrors] = useState({});
    const [error, setError] = useState("");
    const [confirming, setConfirming] = useState(false);
    const [busy, setBusy] = useState(false);
    const [receipt, setReceipt] = useState(null);
    useEffect(() => { window.scrollTo(0, 0); }, [receipt]);
    const submitting = useRef(false);
    const mounted = useRef(true);
    useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
    const departments = usePublicResource(getDepartments);
    const loadDoctors = useCallback(() => values.departmentId ? getDoctorsByDepartment(values.departmentId) : Promise.resolve([]), [values.departmentId]);
    const doctors = usePublicResource(loadDoctors);
    const loadSlots = useCallback(() => values.doctorId && values.date >= clinicToday()
        ? getAvailableSlots(values.doctorId, values.date) : Promise.resolve([]), [values.doctorId, values.date]);
    const slots = usePublicResource(loadSlots);
    const department = departments.data?.find(item => String(item.departmentId) === values.departmentId);
    const doctor = doctors.data?.find(item => String(item.doctorId) === values.doctorId);
    const available = slots.data?.filter(item => item.isAvailable) || [];
    const selectedSlot = available.find(item => item.startTime === values.startTime);
    const ready = Boolean(department && doctor && selectedSlot && !busy);

    const update = (name, value) => {
        setValues(current => ({ ...current, [name]: value,
            ...(name === "departmentId" ? { doctorId: "", startTime: "" } : {}),
            ...(["doctorId", "date"].includes(name) ? { startTime: "" } : {}),
        }));
        setErrors(current => ({ ...current, [name]: undefined }));
        setError("");
    };
    const field = name => ({ value: values[name], onChange: e => update(name, e.target.value), error: Boolean(errors[name]), helperText: errors[name], fullWidth: true, disabled: busy });
    const review = event => {
        event.preventDefault();
        const validation = validateGuestBooking(values);
        if (!department) validation.departmentId = "Vui lòng chọn chuyên khoa đang hoạt động.";
        if (!doctor) validation.doctorId = "Vui lòng chọn bác sĩ trong chuyên khoa.";
        if (!selectedSlot) validation.startTime = "Vui lòng chọn giờ khám còn trống.";
        setErrors(validation);
        if (Object.keys(validation).length) {
            document.getElementById(`guest-${Object.keys(validation)[0]}`)?.focus();
            return;
        }
        setConfirming(true);
    };
    const submit = async () => {
        if (submitting.current || !ready) return;
        submitting.current = true;
        setBusy(true);
        setError("");
        try {
            const result = await createGuestAppointment({
                doctorId: Number(values.doctorId), appointmentDate: values.date, startTime: values.startTime,
                patientName: values.patientName.trim(), patientPhone: values.patientPhone.trim(), reason: values.reason.trim(),
            });
            if (!mounted.current) return;
            setReceipt(result);
            setConfirming(false);
            setValues(current => ({ ...current, patientName: "", patientPhone: "", reason: "", consent: false, startTime: "" }));
        } catch (apiError) {
            if (!mounted.current) return;
            setConfirming(false);
            update("startTime", "");
            setError(getApiErrorMessage(apiError));
            slots.retry();
        } finally {
            submitting.current = false;
            if (mounted.current) setBusy(false);
        }
    };

    if (receipt) return <PublicPage title="Đã tiếp nhận đăng ký khám">
        <Paper variant="outlined" sx={{ ...sectionSx, maxWidth: 760 }}>
            <Alert severity="success" sx={{ mb: 3 }}>Đăng ký của bạn đã được lưu. Vui lòng chờ phòng khám liên hệ xác nhận.</Alert>
            <Stack spacing={2}>
                <Typography component="h2" variant="h5"  sx={{ fontWeight: 750 }}>Mã lịch hẹn: #{receipt.appointmentId}</Typography>
                <Typography>Bác sĩ: {receipt.doctorName}</Typography><Typography>Chuyên khoa: {receipt.departmentName}</Typography>
                <Typography>Ngày khám: {dateLabel(receipt.appointmentDate)} · {time(receipt.startTime)} – {time(receipt.endTime)}</Typography>
                <Chip label="Chờ xác nhận" color="warning" sx={{ alignSelf: "flex-start" }} />
                <Typography color="text.secondary"  sx={{ lineHeight: 1.8 }}>Hãy lưu mã lịch hẹn. Nếu cần đổi hoặc hủy lịch, liên hệ <Link href={CLINIC.phoneHref}>{CLINIC.phone}</Link> và cung cấp mã này. Lịch khách không tự động liên kết với tài khoản tạo sau đó.</Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}><Button component={RouterLink} to="/" variant="outlined">Về trang chủ</Button><Button onClick={() => { setReceipt(null); slots.retry(); }} variant="contained">Đăng ký lịch khác</Button></Stack>
            </Stack>
        </Paper>
    </PublicPage>;

    return <PublicPage title="Đăng ký khám trực tuyến" description="Chọn bác sĩ và giờ khám còn trống. Bạn có thể đăng ký ngay mà chưa cần tài khoản.">
        <Alert severity="info" sx={{ mb: 3 }}><Link component={RouterLink} to="/login" state={{ from: { pathname: "/booking", search: params.size ? `?${params}` : "" } }}>Đăng nhập</Link> hoặc <Link component={RouterLink} to="/register" state={{ from: { pathname: "/booking", search: params.size ? `?${params}` : "" } }}>đăng ký tài khoản</Link> trước khi đặt lịch để quản lý lịch hẹn trực tuyến.</Alert>
        <Box component="form" onSubmit={review} noValidate aria-busy={busy}>
            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 8 }}><Stack spacing={3}>
                    <Paper variant="outlined" sx={sectionSx}>
                        <Typography component="h2" variant="h6"   sx={{ fontWeight: 750, mb: 2 }}>1. Chuyên khoa & bác sĩ</Typography>
                        <ResourceState resource={departments}><TextField id="guest-departmentId" select label="Chuyên khoa" required {...field("departmentId")} value={department ? values.departmentId : ""}>
                            <MenuItem value="">Chọn chuyên khoa</MenuItem>{departments.data?.map(item => <MenuItem key={item.departmentId} value={String(item.departmentId)}>{item.name}</MenuItem>)}
                        </TextField></ResourceState>
                        {departments.status === "ready" && !departments.data?.length && <Alert severity="info" sx={{ mt: 2 }}>Chưa có chuyên khoa đang nhận đăng ký.</Alert>}
                        <Box sx={{ mt: 2 }}><ResourceState resource={doctors}><TextField id="guest-doctorId" select label="Bác sĩ" required {...field("doctorId")} value={doctor ? values.doctorId : ""} disabled={!department || busy}>
                            <MenuItem value="">Chọn bác sĩ</MenuItem>{doctors.data?.map(item => <MenuItem key={item.doctorId} value={String(item.doctorId)}>{item.title} {item.fullName}</MenuItem>)}
                        </TextField></ResourceState></Box>
                        {department && doctors.status === "ready" && !doctors.data?.length && <Alert severity="info" sx={{ mt: 2 }}>Chuyên khoa chưa có bác sĩ nhận đăng ký trực tuyến.</Alert>}
                        {doctor && <Button component={RouterLink} to={`/doctors/${doctor.doctorId}`} sx={{ mt: 1 }}>Xem hồ sơ bác sĩ</Button>}
                    </Paper>
                    <Paper variant="outlined" sx={sectionSx}>
                        <Typography component="h2" variant="h6"   sx={{ fontWeight: 750, mb: 2 }}>2. Ngày & giờ khám</Typography>
                        <TextField id="guest-date" label="Ngày khám" type="date" required {...field("date")} slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: clinicToday() } }} />
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Giờ khám theo múi giờ Việt Nam (UTC+7).</Typography>
                        {doctor && <Box sx={{ mt: 2 }}><ResourceState resource={slots}>
                            {slots.data?.length ? <Stack direction="row"   role="group" aria-label="Giờ khám còn trống" sx={{ flexWrap: "wrap", gap: 1 }}>{slots.data.map(slot => <Button
                                id={slot.startTime === available[0]?.startTime ? "guest-startTime" : undefined}
                                key={slot.startTime} disabled={!slot.isAvailable || busy} variant={values.startTime === slot.startTime ? "contained" : "outlined"}
                                aria-pressed={values.startTime === slot.startTime} onClick={() => update("startTime", slot.startTime)}>{time(slot.startTime)}</Button>)}</Stack> : <Alert severity="info">Chưa có giờ khám trong ngày này. Hãy chọn ngày hoặc bác sĩ khác.</Alert>}
                            {slots.data?.length > 0 && !available.length && <Alert severity="info" sx={{ mt: 2 }}>Các giờ khám đã được đặt. Vui lòng chọn ngày khác.</Alert>}
                        </ResourceState><Button onClick={() => { update("startTime", ""); slots.retry(); }} disabled={busy || slots.status === "loading"} sx={{ mt: 1 }}>Cập nhật giờ trống</Button></Box>}
                        {errors.startTime && <Typography role="alert" color="error"   sx={{ mt: 1, fontSize: 13 }}>{errors.startTime}</Typography>}
                    </Paper>
                    <Paper variant="outlined" sx={sectionSx}>
                        <Typography component="h2" variant="h6"   sx={{ fontWeight: 750, mb: 2 }}>3. Thông tin người khám</Typography>
                        <Stack spacing={2}>
                            <TextField id="guest-patientName" label="Họ và tên" autoComplete="name" required {...field("patientName")} slotProps={{ htmlInput: { maxLength: 100 } }} />
                            <TextField id="guest-patientPhone" label="Số điện thoại" type="tel" autoComplete="tel" required {...field("patientPhone")} slotProps={{ htmlInput: { maxLength: 15 } }} />
                            <TextField id="guest-reason" label="Lý do khám" multiline minRows={3} required {...field("reason")} slotProps={{ htmlInput: { maxLength: 500 } }} />
                            <FormControlLabel control={<Checkbox id="guest-consent" checked={values.consent} onChange={e => update("consent", e.target.checked)} disabled={busy} />} label={<Typography variant="body2">Tôi xác nhận thông tin chính xác và đồng ý để phòng khám liên hệ xác nhận lịch khám. <Link component={RouterLink} to="/privacy">Thông tin cá nhân</Link></Typography>} />
                            {errors.consent && <Typography color="error" role="alert"  sx={{ fontSize: 13 }}>{errors.consent}</Typography>}
                        </Stack>
                    </Paper>
                </Stack></Grid>
                <Grid size={{ xs: 12, md: 4 }}><Paper variant="outlined" sx={{ ...sectionSx, position: { md: "sticky" }, top: 100 }}>
                    <Typography component="h2" variant="h6"   sx={{ fontWeight: 750, mb: 2 }}>Thông tin đăng ký</Typography>
                    <Stack spacing={2}>
                        <Typography>Chuyên khoa: {department?.name || "Chưa chọn"}</Typography><Typography>Bác sĩ: {doctor?.fullName || "Chưa chọn"}</Typography>
                        <Typography>Ngày khám: {dateLabel(values.date) || "Chưa chọn"}</Typography><Typography>Giờ khám: {selectedSlot ? time(selectedSlot.startTime) : "Chưa chọn"}</Typography>
                        <Alert severity="info">Đăng ký sẽ ở trạng thái chờ xác nhận. Phòng khám liên hệ qua số điện thoại bạn cung cấp.</Alert>
                        {error && <Alert severity="error">{error}</Alert>}
                        <Button type="submit" variant="contained" size="large" disabled={busy || departments.status !== "ready" || doctors.status !== "ready" || slots.status !== "ready"}>Kiểm tra đăng ký</Button>
                        <Link href={CLINIC.phoneHref}>Hỗ trợ: {CLINIC.phone}</Link>
                    </Stack>
                </Paper></Grid>
            </Grid>
        </Box>
        <Dialog open={confirming} onClose={() => !busy && setConfirming(false)} fullWidth maxWidth="sm" aria-labelledby="guest-confirm-title">
            <DialogTitle id="guest-confirm-title">Xác nhận thông tin đăng ký</DialogTitle>
            <DialogContent><Stack spacing={1.5}>
                <Typography>Người khám: {values.patientName}</Typography><Typography>Số điện thoại: {values.patientPhone}</Typography>
                <Typography>Bác sĩ: {doctor?.fullName} · {department?.name}</Typography><Typography>Ngày khám: {dateLabel(values.date)}, lúc {time(values.startTime)}</Typography>
                <Typography sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>Lý do khám: {values.reason}</Typography>
                <Alert severity="info">Vui lòng kiểm tra số điện thoại để phòng khám có thể liên hệ xác nhận.</Alert>
            </Stack></DialogContent>
            <DialogActions sx={{ p: 3 }}><Button onClick={() => setConfirming(false)} disabled={busy}>Chỉnh sửa</Button><Button variant="contained" onClick={submit} disabled={!ready} startIcon={busy ? <CircularProgress size={16} color="inherit" /> : undefined}>{busy ? "Đang gửi…" : "Gửi đăng ký khám"}</Button></DialogActions>
        </Dialog>
    </PublicPage>;
}
