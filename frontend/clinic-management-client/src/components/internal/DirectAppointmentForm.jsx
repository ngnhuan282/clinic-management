import { useEffect, useRef, useState } from "react";
import { Alert, Box, Button, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { findPatientMatches } from "../../api/receptionApi";
import { getApiErrorMessage } from "../../utils/errorHandler";
import { formatDate } from "../../utils/formatDate";
import { appointmentButtonSx, appointmentColors as colors, appointmentFieldSx, appointmentPrimaryButtonSx, appointmentSecondaryButtonSx } from "../appointments/appointmentUi";

function addDays(dateText, days) {
    const date = new Date(`${dateText}T12:00:00`);
    date.setDate(date.getDate() + days);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

const timeLabel = value => String(value).slice(0, 5);
const sectionSx = { minWidth: 0, pt: 2, borderTop: "1px solid", borderColor: colors.borderSoft };
const headingSx = { mb: 1.5, color: colors.heading, fontSize: 16, fontWeight: 600 };

export default function DirectAppointmentForm({ form, setForm, departments, doctors, slots, slotsLoading, saving, today, createDisabled, onDepartmentChange, onDoctorChange, onDateChange }) {
    const [matches, setMatches] = useState([]);
    const [matching, setMatching] = useState(false);
    const [matchError, setMatchError] = useState("");
    const [searched, setSearched] = useState(false);
    const matchRequest = useRef(0);
    useEffect(() => () => { matchRequest.current += 1; }, []);

    async function findMatches() {
        const request = ++matchRequest.current;
        setMatching(true);
        setMatchError("");
        try {
            const result = await findPatientMatches(form.patientPhone.trim());
            if (request !== matchRequest.current) return;
            setMatches(result);
            setSearched(true);
        } catch (err) {
            if (request === matchRequest.current) setMatchError(getApiErrorMessage(err));
        } finally {
            if (request === matchRequest.current) setMatching(false);
        }
    }

    const selectedDepartment = departments.find(item => String(item.departmentId) === String(form.departmentId));
    const selectedDoctor = doctors.find(item => String(item.doctorId) === String(form.doctorId));
    const steps = [
        { label: "Chuyên khoa", complete: Boolean(form.departmentId) },
        { label: "Bác sĩ", complete: Boolean(form.doctorId) },
        { label: "Ngày khám", complete: Boolean(form.appointmentDate) },
        { label: "Khung giờ", complete: Boolean(form.startTime) },
        { label: "Bệnh nhân", complete: Boolean(form.patientName.trim() && form.patientPhone.trim() && form.reason.trim()) },
        { label: "Xác nhận lịch", complete: !createDisabled },
    ];
    const firstIncomplete = steps.findIndex(step => !step.complete);
    const activeStep = firstIncomplete < 0 ? steps.length - 1 : firstIncomplete;
    const dateOptions = [today, addDays(today, 1), addDays(today, 2)];

    return <Stack spacing={2.5} sx={{ "& .MuiTextField-root": appointmentFieldSx }}>
        <Box component="ol" aria-label="Tiến trình đặt lịch trực tiếp" sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(3, minmax(0, 1fr))", md: "repeat(6, minmax(0, 1fr))" }, gap: 1, m: 0, p: 0, listStyle: "none" }}>
            {steps.map((step, index) => <Box component="li" key={step.label} aria-current={index === activeStep ? "step" : undefined} sx={{ display: "flex", gap: 0.75, alignItems: "center", minWidth: 0 }}>
                <Box sx={{ width: 24, height: 24, borderRadius: "50%", display: "grid", placeItems: "center", flexShrink: 0, fontSize: 12, fontWeight: 600,
                    bgcolor: step.complete || index === activeStep ? colors.primary : colors.canvas, color: step.complete || index === activeStep ? colors.onPrimary : colors.muted }}>{index + 1}</Box>
                <Typography sx={{ fontSize: 12, color: index === activeStep ? colors.primary : colors.muted }}>{step.label}</Typography>
            </Box>)}
        </Box>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "repeat(2, minmax(0, 1fr))" }, gap: 3 }}>
            <Box sx={sectionSx}>
                <Typography component="h3" sx={headingSx}>1 & 2. Chuyên khoa và bác sĩ</Typography>
                <Stack spacing={2}>
                    <TextField select size="small" label="1. Chọn Chuyên khoa khám" value={form.departmentId} disabled={saving} required onChange={event => onDepartmentChange(event.target.value)}>
                        <MenuItem value="">Chọn chuyên khoa</MenuItem>
                        {departments.map(item => <MenuItem key={item.departmentId} value={item.departmentId}>{item.name}</MenuItem>)}
                    </TextField>
                    <TextField select size="small" label="2. Chọn Bác sĩ phụ trách" value={form.doctorId} disabled={saving || !form.departmentId} required onChange={event => onDoctorChange(event.target.value)}>
                        <MenuItem value="">Chọn bác sĩ</MenuItem>
                        {doctors.map(item => <MenuItem key={item.doctorId} value={item.doctorId}>{item.title} {item.fullName}</MenuItem>)}
                    </TextField>
                    <Typography variant="body2" sx={{ color: colors.muted }}>{selectedDoctor ? `${selectedDoctor.title || ""} ${selectedDoctor.fullName}` : "Chọn chuyên khoa để xem bác sĩ phụ trách."}</Typography>
                </Stack>
            </Box>
            <Box sx={sectionSx}>
                <Typography component="h3" sx={headingSx}>3 & 4. Ngày và khung giờ</Typography>
                <Stack spacing={2}>
                    <TextField size="small" label="Ngày khám" type="date" value={form.appointmentDate} disabled={saving} onChange={event => onDateChange(event.target.value)} slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: today } }} />
                    <Stack direction="row" useFlexGap sx={{ flexWrap: "wrap", gap: 1 }}>
                        {dateOptions.map((date, index) => <Button key={date} size="small" disabled={saving} variant={form.appointmentDate === date ? "contained" : "outlined"} sx={form.appointmentDate === date ? appointmentPrimaryButtonSx : appointmentSecondaryButtonSx} onClick={() => onDateChange(date)}>
                            {index === 0 ? `Hôm nay (${date.slice(8)}/${date.slice(5, 7)})` : index === 1 ? `Ngày mai (${date.slice(8)}/${date.slice(5, 7)})` : formatDate(date)}
                        </Button>)}
                    </Stack>
                    <Box>
                        <Typography component="p" sx={{ mb: 1, fontSize: 13, color: colors.muted }}>{slotsLoading ? "Đang tải khung giờ..." : "Khung giờ còn trống"}</Typography>
                        <Box role="group" aria-label="Khung giờ tiếp nhận" aria-busy={slotsLoading} sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(70px, 1fr))", gap: 1 }}>
                            {!slotsLoading && slots.map(slot => <Button key={slot.startTime} size="small" aria-pressed={form.startTime === slot.startTime} disabled={saving || form.appointmentDate < today} variant={form.startTime === slot.startTime ? "contained" : "outlined"} sx={form.startTime === slot.startTime ? appointmentPrimaryButtonSx : appointmentSecondaryButtonSx} onClick={() => setForm(current => ({ ...current, startTime: slot.startTime }))}>{timeLabel(slot.startTime)}</Button>)}
                        </Box>
                        {!slotsLoading && !slots.length && <Typography variant="body2" sx={{ color: colors.muted }}>{form.doctorId ? "Không có khung giờ trống cho ngày đã chọn." : "Chọn bác sĩ để xem giờ khám."}</Typography>}
                    </Box>
                </Stack>
            </Box>
        </Box>
        <Box sx={sectionSx}>
            <Typography component="h3" sx={headingSx}>5. Thông tin bệnh nhân</Typography>
            <Typography variant="body2" sx={{ mb: 2, color: colors.muted }}>Đối chiếu thông tin trên giấy tờ bệnh nhân cung cấp trước khi tạo hoặc liên kết hồ sơ.</Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))" }, gap: 2 }}>
                <TextField size="small" label="Họ và tên bệnh nhân" value={form.patientName} disabled={saving || Boolean(form.patientProfileId)} required slotProps={{ htmlInput: { maxLength: 100 } }} onChange={event => setForm(current => ({ ...current, patientName: event.target.value }))} />
                <TextField size="small" label="Số điện thoại liên hệ" value={form.patientPhone} disabled={saving || Boolean(form.patientProfileId)} required slotProps={{ htmlInput: { maxLength: 15 } }} onChange={event => {
                    matchRequest.current += 1; setMatches([]); setMatching(false); setSearched(false); setMatchError("");
                    setForm(current => ({ ...current, patientPhone: event.target.value }));
                }} />
                <Box sx={{ gridColumn: { sm: "1 / -1" }, minWidth: 0 }}>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mb: 1 }}>
                        <Button size="small" sx={appointmentButtonSx} disabled={saving || matching || form.patientPhone.trim().length < 2} onClick={findMatches}>{matching ? "Đang đối chiếu..." : "Đối chiếu Patient cũ"}</Button>
                        {form.patientProfileId && <Button size="small" sx={appointmentButtonSx} disabled={saving} onClick={() => {
                            matchRequest.current += 1;
                            setMatching(false); setMatchError("");
                            setForm(current => ({ ...current, patientProfileId: "", patientName: "", patientPhone: "", birthDate: "", identityNumber: "", insuranceCode: "" }));
                            setMatches([]); setSearched(false);
                        }}>Bỏ chọn hồ sơ</Button>}
                    </Stack>
                    {matchError && <Alert severity="error">{matchError}</Alert>}
                    {matches.length > 0 && <TextField select size="small" fullWidth label="Chọn hồ sơ đã đối chiếu" value={form.patientProfileId} disabled={saving} onChange={event => {
                        const patient = matches.find(item => item.patientId === Number(event.target.value));
                        setForm(current => ({ ...current, patientProfileId: patient?.patientId || "", patientName: patient?.fullName || current.patientName,
                            patientPhone: patient?.phone || current.patientPhone, birthDate: patient?.birthDate?.slice(0, 10) || "", identityNumber: patient?.identityNumber || "", insuranceCode: patient?.insuranceCode || "" }));
                    }}>
                        <MenuItem value="">Tạo Patient mới</MenuItem>
                        {matches.map(patient => <MenuItem key={patient.patientId} value={patient.patientId}>#{patient.patientId}: {patient.fullName}, {patient.phone}</MenuItem>)}
                    </TextField>}
                    {!matches.length && <Typography variant="body2" sx={{ color: colors.muted }}>{searched ? "Không tìm thấy hồ sơ theo số điện thoại này. Kiểm tra thông tin trước khi tạo hồ sơ mới." : "Tìm theo số điện thoại để tránh tạo trùng hồ sơ bệnh nhân."}</Typography>}
                </Box>
                <TextField size="small" label="Ngày sinh" type="date" value={form.birthDate} disabled={saving || Boolean(form.patientProfileId)} slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: today } }} onChange={event => setForm(current => ({ ...current, birthDate: event.target.value }))} />
                <TextField size="small" label="Số CCCD / Định danh (VNeID)" value={form.identityNumber} disabled={saving || Boolean(form.patientProfileId)} slotProps={{ htmlInput: { maxLength: 20 } }} onChange={event => setForm(current => ({ ...current, identityNumber: event.target.value }))} />
                <TextField size="small" label="Mã thẻ BHYT" value={form.insuranceCode} disabled={saving || Boolean(form.patientProfileId)} slotProps={{ htmlInput: { maxLength: 30 } }} onChange={event => setForm(current => ({ ...current, insuranceCode: event.target.value }))} />
                <TextField sx={{ gridColumn: { sm: "1 / -1" } }} size="small" label="Lý do khám / Triệu chứng ban đầu" value={form.reason} disabled={saving} required multiline minRows={3} slotProps={{ htmlInput: { maxLength: 500 } }} onChange={event => setForm(current => ({ ...current, reason: event.target.value }))} />
            </Box>
        </Box>
        <Box sx={sectionSx}>
            <Typography component="h3" sx={headingSx}>6. Tóm tắt lịch hẹn</Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))" }, gap: 2 }}>
                {[ ["Chuyên khoa", selectedDepartment?.name || "Chưa chọn"], ["Bác sĩ", selectedDoctor?.fullName || "Chưa chọn"],
                    ["Thời gian hẹn", form.startTime ? `${timeLabel(form.startTime)}, ${formatDate(form.appointmentDate)}` : "Chưa chọn"],
                    ["Hồ sơ bệnh nhân", form.patientProfileId ? `#${form.patientProfileId}: hồ sơ cũ` : "Tạo hồ sơ mới"] ].map(([label, value]) => <Box key={label}><Typography sx={{ color: colors.muted, fontSize: 13 }}>{label}</Typography><Typography sx={{ color: colors.heading, fontSize: 14, fontWeight: 600 }}>{value}</Typography></Box>)}
            </Box>
        </Box>
    </Stack>;
}
