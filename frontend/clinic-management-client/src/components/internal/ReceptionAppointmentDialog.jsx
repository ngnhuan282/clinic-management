import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { CloseOutlined } from "@mui/icons-material";
import { formatDate } from "../../utils/formatDate";
import DirectAppointmentForm from "./DirectAppointmentForm";
import { appointmentButtonSx, appointmentColors as colors, appointmentDialogActionsSx, appointmentDialogPaperSx, appointmentDialogTitleSx, appointmentFieldSx, appointmentPrimaryButtonSx } from "../appointments/appointmentUi";

const timeLabel = value => String(value).slice(0, 5);

export default function ReceptionAppointmentDialog({ action, form, setForm, departments, doctors, slots, setDoctors, setSlots, slotsLoading, saving, error, today, onClose, onSubmit }) {
    const isCreate = action?.type === "create";
    const isReschedule = action?.type === "reschedule";
    const title = isCreate ? "Đặt Lịch Khám Trực Tiếp Tại Quầy" : isReschedule ? "Đổi lịch hẹn" : action?.type === "cancel" ? "Hủy lịch hẹn" : "Xác nhận lịch hẹn";
    const scheduleDisabled = slotsLoading || !form.doctorId || !form.appointmentDate || form.appointmentDate < today || !form.startTime;
    const createDisabled = scheduleDisabled || !form.patientName.trim() || !form.patientPhone.trim() || !form.reason.trim();

    function changeDepartment(value) {
        setDoctors([]); setSlots([]);
        setForm(current => ({ ...current, departmentId: value, doctorId: "", startTime: "" }));
    }

    function changeDoctor(value) {
        setSlots([]);
        setForm(current => ({ ...current, doctorId: value, startTime: "" }));
    }

    function changeDate(value) {
        setSlots([]);
        setForm(current => ({ ...current, appointmentDate: value, startTime: "" }));
    }

    return <Dialog open={Boolean(action)} onClose={saving ? undefined : onClose} fullWidth maxWidth={isCreate ? "md" : isReschedule ? "sm" : "xs"}
        slotProps={{ paper: { className: "appointment-dialog", sx: appointmentDialogPaperSx } }}>
        <DialogTitle sx={{ ...appointmentDialogTitleSx, pr: 6 }}>
            {title}
            <IconButton aria-label={isCreate ? "Đóng form đặt lịch" : "Đóng hộp thoại lịch hẹn"} disabled={saving} onClick={onClose} sx={{ position: "absolute", right: 12, top: 12 }}><CloseOutlined /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ px: { xs: 2, sm: 3 }, py: 2.5, "&.MuiDialogContent-root": { pt: 2.5 }, "& .MuiTextField-root": appointmentFieldSx }}>
            <Stack spacing={2.5}>
                {error && <Alert severity="error">{error}</Alert>}
                {isCreate ? <DirectAppointmentForm form={form} setForm={setForm} departments={departments} doctors={doctors} slots={slots} slotsLoading={slotsLoading} saving={saving} today={today} createDisabled={createDisabled} onDepartmentChange={changeDepartment} onDoctorChange={changeDoctor} onDateChange={changeDate} /> : <>
                    {action?.appointment && <Box>
                        <Typography sx={{ fontWeight: 600, color: colors.heading }}>{action.appointment.patientName}</Typography>
                        <Typography variant="body2" sx={{ mt: 0.5, color: colors.muted }}>{formatDate(action.appointment.appointmentDate)}, {timeLabel(action.appointment.startTime)}<br />{action.appointment.doctorName}</Typography>
                    </Box>}
                    {action?.type === "confirm" && <Typography variant="body2">Lịch hẹn sẽ chuyển sang trạng thái đã xác nhận để bệnh nhân đến khám đúng giờ.</Typography>}
                    {action?.type === "cancel" && <Typography variant="body2">Lịch hẹn bị hủy sẽ nhả khung giờ để bệnh nhân khác có thể đặt lại.</Typography>}
                    {isReschedule && <>
                        <TextField select label="Khoa" value={form.departmentId} disabled={saving} onChange={event => changeDepartment(event.target.value)}>
                            <MenuItem value="">Chọn khoa</MenuItem>
                            {departments.map(item => <MenuItem key={item.departmentId} value={item.departmentId}>{item.name}</MenuItem>)}
                        </TextField>
                        <TextField select label="Bác sĩ" value={form.doctorId} disabled={saving || !form.departmentId} onChange={event => changeDoctor(event.target.value)}>
                            <MenuItem value="">Chọn bác sĩ</MenuItem>
                            {doctors.map(item => <MenuItem key={item.doctorId} value={item.doctorId}>{item.title} {item.fullName}</MenuItem>)}
                        </TextField>
                        <TextField label="Ngày khám" type="date" value={form.appointmentDate} disabled={saving} onChange={event => changeDate(event.target.value)} slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: today } }} />
                        <TextField select label="Khung giờ còn trống" value={form.startTime} disabled={saving || slotsLoading || !slots.length} onChange={event => setForm(current => ({ ...current, startTime: event.target.value }))}>
                            <MenuItem value="">Chọn giờ khám</MenuItem>
                            {slots.map(slot => <MenuItem key={slot.startTime} value={slot.startTime}>{timeLabel(slot.startTime)} - {timeLabel(slot.endTime)}</MenuItem>)}
                        </TextField>
                        {slotsLoading ? <Typography variant="body2" sx={{ color: colors.muted }}>Đang tải khung giờ…</Typography> : form.doctorId && form.appointmentDate && !slots.length && <Alert severity="info">Không có khung giờ trống cho ngày đã chọn.</Alert>}
                    </>}
                </>}
            </Stack>
        </DialogContent>
        <DialogActions sx={{ ...appointmentDialogActionsSx, justifyContent: "space-between" }}>
            {isCreate && <Typography sx={{ fontSize: 13, color: colors.muted }}>Check-in sau khi kiểm tra sổ khám.</Typography>}
            <Stack direction="row" spacing={1} sx={{ ml: "auto" }}>
                <Button sx={appointmentButtonSx} disabled={saving} onClick={onClose}>{isCreate ? "Hủy" : "Đóng"}</Button>
                <Button variant="contained" color={action?.type === "cancel" ? "error" : "primary"} sx={action?.type === "cancel" ? appointmentButtonSx : appointmentPrimaryButtonSx}
                    disabled={saving || (isCreate && createDisabled) || (isReschedule && scheduleDisabled)} onClick={onSubmit}>{saving ? "Đang lưu..." : "Xác nhận"}</Button>
            </Stack>
        </DialogActions>
    </Dialog>;
}
