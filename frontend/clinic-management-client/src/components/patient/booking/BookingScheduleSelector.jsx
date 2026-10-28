import { Avatar, Box, Button, Chip, Paper, Skeleton, Stack, TextField, Typography } from "@mui/material";
import { AccessTimeOutlined, CalendarMonthOutlined, RefreshOutlined } from "@mui/icons-material";
import { bookingColors as colors, bookingFieldSx, bookingPanelSx, bookingSectionTitleSx, bookingSecondaryButtonSx } from "./bookingUi";

function getDateCards(today) {
    return Array.from({ length: 6 }, (_, index) => {
        const date = new Date(`${today}T12:00:00Z`);
        date.setUTCDate(date.getUTCDate() + index);
        const value = date.toISOString().slice(0, 10);
        return { value,
            dayName: date.getUTCDay() === 0 ? "CN" : `Thứ ${date.getUTCDay() + 1}`,
            date: `${value.slice(8, 10)}/${value.slice(5, 7)}` };
    });
}

function SlotGroup({ title, slots, booking }) {
    if (!slots.length) return null;
    return <Box>
        <Typography component="h3" sx={{ mb: 1.5, fontSize: 15, fontWeight: 800, color: colors.heading }}>{title}</Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(3, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" }, gap: 1.25 }}>
            {slots.map(slot => {
                const selected = booking.selectedSlot?.startTime === slot.startTime;
                return <Button key={slot.startTime} disabled={!slot.isAvailable} aria-pressed={selected}
                    onClick={() => booking.setSelectedSlot(slot)} sx={{ minWidth: 0, height: 62, borderRadius: 2, textTransform: "none",
                        px: 0.5, border: "1px solid", borderColor: selected ? colors.primary : slot.isAvailable ? colors.greenBorder : colors.border,
                        bgcolor: selected ? colors.primary : slot.isAvailable ? colors.greenSoft : colors.occupied,
                        color: selected ? colors.onPrimary : slot.isAvailable ? colors.greenText : colors.muted,
                        "&:hover": { bgcolor: selected ? colors.primaryDark : colors.greenSoft },
                        "&.Mui-disabled": { bgcolor: colors.occupied, color: colors.muted, borderColor: colors.border } }}>
                    <Stack spacing={0.25} sx={{ alignItems: "center" }}>
                        <Typography component="span" sx={{ fontSize: 14, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{slot.startTime.slice(0, 5)}</Typography>
                        <Typography component="span" sx={{ fontSize: 11 }}>{selected ? "Đang chọn" : slot.isAvailable ? "Còn chỗ" : "Đã kín chỗ"}</Typography>
                    </Stack>
                </Button>;
            })}
        </Box>
    </Box>;
}

export default function BookingScheduleSelector({ booking }) {
    const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date());
    const availableCount = booking.slots.filter(slot => slot.isAvailable).length;
    return <Stack spacing={3}>
        <Paper elevation={0} sx={bookingPanelSx}>
            <Stack spacing={2.5}>
                <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: colors.blueSoft, color: colors.primary }}><CalendarMonthOutlined fontSize="small" /></Avatar>
                    <Box>
                        <Typography component="h2" sx={bookingSectionTitleSx}>3. Chọn Ngày Khám Bệnh</Typography>
                        <Typography sx={{ color: colors.muted, fontSize: 13 }}>Chọn ngày để xem giờ khám còn trống</Typography>
                    </Box>
                </Stack>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(3, minmax(0, 1fr))", md: "repeat(6, minmax(0, 1fr))" }, gap: 1.5, pt: 0.5 }}>
                    {getDateCards(today).map((card, index) => {
                        const selected = booking.selectedDate === card.value;
                        return <Button key={card.value} variant="outlined" disabled={!booking.selectedDoctorId}
                            aria-pressed={selected} onClick={() => booking.setSelectedDate(card.value)}
                            sx={{ minWidth: 0, height: 82, px: 0.5, py: 1, position: "relative", borderRadius: 2, textTransform: "none",
                                bgcolor: selected ? colors.blueSoft : colors.paper, borderColor: selected ? colors.primary : colors.borderStrong,
                                "&:hover": { borderColor: colors.primary, bgcolor: colors.blueSoft } }}>
                            {index === 0 && <Chip component="span" label="Hôm nay" size="small" sx={{ position: "absolute", top: -12, height: 20, bgcolor: colors.primary, color: colors.onPrimary, fontSize: 10, fontWeight: 800 }} />}
                            <Stack spacing={0.25} sx={{ alignItems: "center" }}>
                                <Typography component="span" sx={{ fontSize: 12, color: colors.muted }}>{card.dayName}</Typography>
                                <Typography component="span" sx={{ fontSize: 18, fontWeight: 800, color: colors.heading, fontVariantNumeric: "tabular-nums" }}>{card.date}</Typography>
                                <Typography component="span" sx={{ fontSize: 11, fontWeight: 600, color: selected ? colors.greenText : colors.muted }}>
                                    {selected ? booking.loading.slots ? "Đang tải…" : `${availableCount} khung` : "Chọn để xem"}
                                </Typography>
                            </Stack>
                        </Button>;
                    })}
                </Box>
                <TextField type="date" size="small" label="Ngày khám khác" value={booking.selectedDate} disabled={!booking.selectedDoctorId}
                    onChange={event => booking.setSelectedDate(event.target.value)} sx={{ ...bookingFieldSx, maxWidth: { sm: 240 } }}
                    slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: today } }} />
            </Stack>
        </Paper>
        <Paper elevation={0} sx={bookingPanelSx}>
            <Stack spacing={2.5}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ justifyContent: "space-between", alignItems: { sm: "center" } }}>
                    <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: colors.blueSoft, color: colors.primary }}><AccessTimeOutlined fontSize="small" /></Avatar>
                        <Box>
                            <Typography component="h2" sx={bookingSectionTitleSx}>4. Chọn Giờ Khám</Typography>
                            <Typography sx={{ color: colors.muted, fontSize: 13 }}>Mỗi khung giờ 30 phút</Typography>
                        </Box>
                    </Stack>
                    <Button startIcon={<RefreshOutlined />} size="small" disabled={!booking.selectedDate || !booking.selectedDoctorId || booking.loading.slots}
                        onClick={() => booking.refreshSlots(true)} sx={bookingSecondaryButtonSx}>Làm mới</Button>
                </Stack>
                <Stack direction="row" spacing={1.5} useFlexGap sx={{ flexWrap: "wrap" }}>
                    {[[colors.primary, "Đang chọn"], [colors.green, "Còn chỗ trống"], [colors.borderStrong, "Đã kín lịch"]].map(([color, label]) => <Stack key={label} direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
                        <Box component="span" sx={{ width: 11, height: 11, borderRadius: 0.75, bgcolor: color }} />
                        <Typography component="span" sx={{ fontSize: 12, color: colors.body }}>{label}</Typography>
                    </Stack>)}
                </Stack>
                {booking.loading.slots ? <Skeleton variant="rounded" height={112} aria-label="Đang tải khung giờ" />
                    : !booking.selectedDate || !booking.selectedDoctorId ? <Typography sx={{ fontSize: 14, color: colors.muted }}>Chọn bác sĩ và ngày khám để xem khung giờ.</Typography>
                        : !booking.slots.length ? <Typography sx={{ fontSize: 14, color: colors.muted }}>Chưa có khung giờ cho ngày này. Bạn có thể chọn ngày khác.</Typography>
                            : <>
                                <SlotGroup title="Buổi sáng" slots={booking.slots.filter(slot => Number(slot.startTime.slice(0, 2)) < 12)} booking={booking} />
                                <SlotGroup title="Buổi chiều" slots={booking.slots.filter(slot => Number(slot.startTime.slice(0, 2)) >= 12)} booking={booking} />
                            </>}
            </Stack>
        </Paper>
    </Stack>;
}
