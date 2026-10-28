import { Box, Button, Skeleton, Stack, TextField, Typography } from "@mui/material";
import { RefreshOutlined } from "@mui/icons-material";
import { appointmentButtonSx, appointmentColors as colors, appointmentFieldSx } from "../../appointments/appointmentUi";

function getDateCards(today) {
    return Array.from({ length: 6 }, (_, index) => {
        const date = new Date(`${today}T12:00:00Z`);
        date.setUTCDate(date.getUTCDate() + index);
        const value = date.toISOString().slice(0, 10);
        return { value, label: index === 0 ? "Hôm nay" : date.getUTCDay() === 0 ? "CN" : `Thứ ${date.getUTCDay() + 1}`,
            date: `${value.slice(8, 10)}/${value.slice(5, 7)}` };
    });
}

function SlotGroup({ title, slots, booking }) {
    if (!slots.length) return null;
    return <Box>
        <Typography component="h3" sx={{ mb: 1, fontSize: 14, fontWeight: 600, color: colors.heading }}>{title}</Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(3, minmax(0, 1fr))", sm: "repeat(4, minmax(0, 1fr))", md: "repeat(6, minmax(0, 1fr))" }, gap: 1 }}>
            {slots.map(slot => {
                const selected = booking.selectedSlot?.startTime === slot.startTime;
                return <Button key={slot.startTime} disabled={!slot.isAvailable} aria-pressed={selected}
                    onClick={() => booking.setSelectedSlot(slot)} sx={{ ...appointmentButtonSx, minWidth: 0, minHeight: 54,
                        px: 0.5, border: "1px solid", borderColor: selected ? colors.primary : colors.borderSoft,
                        bgcolor: selected ? colors.primary : colors.canvas, color: selected ? colors.onPrimary : colors.heading,
                        "&:hover": { bgcolor: selected ? colors.primaryDark : colors.primarySoft },
                        "&.Mui-disabled": { bgcolor: colors.canvas, color: colors.muted, borderColor: colors.borderSoft } }}>
                    <Stack spacing={0.25} alignItems="center">
                        <Typography component="span" sx={{ fontSize: 14, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{slot.startTime.slice(0, 5)}</Typography>
                        <Typography component="span" sx={{ fontSize: 11 }}>{selected ? "Đang chọn" : slot.isAvailable ? "Còn chỗ" : "Đã kín chỗ"}</Typography>
                    </Stack>
                </Button>;
            })}
        </Box>
    </Box>;
}

export default function BookingScheduleSelector({ booking }) {
    const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date());
    return <Stack spacing={2}>
        <Typography component="h2" sx={{ fontSize: 18, fontWeight: 600, color: colors.heading }}>3. Chọn ngày khám</Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(3, minmax(0, 1fr))", sm: "repeat(6, minmax(0, 1fr))" }, gap: 1 }}>
            {getDateCards(today).map(card => <Button key={card.value} variant="outlined" disabled={!booking.selectedDoctorId}
                aria-pressed={booking.selectedDate === card.value} onClick={() => booking.setSelectedDate(card.value)}
                sx={{ ...appointmentButtonSx, minWidth: 0, px: 0.5, py: 1,
                    bgcolor: booking.selectedDate === card.value ? colors.primarySoft : colors.paper,
                    borderColor: booking.selectedDate === card.value ? colors.primary : colors.border }}>
                <Stack spacing={0.25}><Typography component="span" sx={{ fontSize: 12, color: colors.muted }}>{card.label}</Typography>
                    <Typography component="span" sx={{ fontSize: 15, fontWeight: 600, color: colors.heading }}>{card.date}</Typography></Stack>
            </Button>)}
        </Box>
        <TextField type="date" size="small" label="Ngày khám khác" value={booking.selectedDate} disabled={!booking.selectedDoctorId}
            onChange={event => booking.setSelectedDate(event.target.value)} sx={{ ...appointmentFieldSx, maxWidth: { sm: 240 } }}
            slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: today } }} />
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
            <Typography component="h2" sx={{ fontSize: 18, fontWeight: 600, color: colors.heading }}>4. Chọn giờ khám</Typography>
            <Button startIcon={<RefreshOutlined />} size="small" disabled={!booking.selectedDate || !booking.selectedDoctorId || booking.loading.slots}
                onClick={() => booking.refreshSlots(true)} sx={appointmentButtonSx}>Làm mới</Button>
        </Stack>
        {booking.loading.slots ? <Skeleton variant="rounded" height={112} aria-label="Đang tải khung giờ" />
            : !booking.selectedDate || !booking.selectedDoctorId ? <Typography sx={{ fontSize: 14, color: colors.muted }}>Chọn bác sĩ và ngày khám để xem khung giờ.</Typography>
                : !booking.slots.length ? <Typography sx={{ fontSize: 14, color: colors.muted }}>Chưa có khung giờ cho ngày này. Bạn có thể chọn ngày khác.</Typography>
                    : <>
                        <Typography sx={{ fontSize: 13, color: colors.muted }}>Mỗi khung giờ 30 phút. Khung đã kín chỗ không thể chọn.</Typography>
                        <SlotGroup title="Buổi sáng" slots={booking.slots.filter(slot => Number(slot.startTime.slice(0, 2)) < 12)} booking={booking} />
                        <SlotGroup title="Buổi chiều" slots={booking.slots.filter(slot => Number(slot.startTime.slice(0, 2)) >= 12)} booking={booking} />
                    </>}
    </Stack>;
}
