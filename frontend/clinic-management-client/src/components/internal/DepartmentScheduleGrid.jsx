import { Fragment } from "react";
import { Box, ButtonBase, Chip, Paper, Typography } from "@mui/material";
import { addDays, formatDay, shortTime } from "../../utils/scheduleCalendar";

function ShiftCard({ item, selectedId, onSelect, sx }) {
    return <ButtonBase onClick={() => onSelect(item.scheduleId)} aria-label={`Ca ${item.doctorName} ${item.workDate} ${shortTime(item.startTime)}`}
        aria-pressed={selectedId === item.scheduleId} sx={{ display: "block", textAlign: "left", width: "100%", borderRadius: 1.5, p: 1,
            bgcolor: "#EFF6FF", border: selectedId === item.scheduleId ? "2px solid #005DAC" : "1px solid #BFDBFE", ...sx }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 0.5, mb: 0.5 }}>
            <Chip label="Đã duyệt" size="small" color="success" variant="outlined" sx={{ height: 22, fontSize: 10 }} />
            <Typography sx={{ fontSize: 11 }}>{shortTime(item.startTime)}–{shortTime(item.endTime)}</Typography>
        </Box>
        <Typography sx={{ fontWeight: 700, fontSize: 12 }}>{item.doctorName}</Typography>
        <Typography color="primary" sx={{ mt: 0.5, fontSize: 11 }}>{item.roomName}</Typography>
    </ButtonBase>;
}

export default function DepartmentScheduleGrid({ mode, start, items, rooms, selectedId, onSelect }) {
    if (mode === "week") {
        const days = Array.from({ length: 7 }, (_, index) => addDays(start, index));
        return <Paper sx={{ overflowX: "auto" }}><Box sx={{ minWidth: 940, display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
            {days.map(day => <Box key={day} sx={{ p: 1.5, bgcolor: "#F1F5F9", borderRight: "1px solid #E5E9F0" }}>
                <Typography sx={{ fontWeight: 700, fontSize: 13 }}>{formatDay(day)}</Typography>
            </Box>)}
            {["Ca sáng", "Ca chiều", "Ca tối"].map((label, shift) => <Fragment key={label}>
                <Box sx={{ gridColumn: "1 / -1", p: 1, bgcolor: "#EFF4FA" }}><Typography sx={{ fontSize: 12, fontWeight: 700 }} color="primary">{label}</Typography></Box>
                {days.map(day => {
                    const shifts = items.filter(item => item.workDate === day && item.shift === shift);
                    return <Box key={`${day}-${shift}`} sx={{ p: 1, minHeight: 125, borderRight: "1px solid #E5E9F0", display: "flex", flexDirection: "column", gap: 1 }}>
                        {shifts.length ? shifts.map(item => <ShiftCard key={item.scheduleId} {...{ item, selectedId, onSelect }} />)
                            : <Typography color="text.secondary" sx={{ mt: 3, textAlign: "center", fontSize: 12 }}>Không có ca</Typography>}
                    </Box>;
                })}
            </Fragment>)}
        </Box></Paper>;
    }
    const times = [...new Set(items.flatMap(item => [item.startTime, item.endTime]))].sort();
    const activeRooms = rooms.filter(room => items.some(item => item.roomId === room.id));
    return <Paper sx={{ p: 2, overflowX: "auto" }}>
        <Typography sx={{ fontWeight: 700, mb: 2 }}>Lịch theo ngày & sơ đồ phòng khám — {formatDay(start)}</Typography>
        <Box sx={{ minWidth: Math.max(650, activeRooms.length * 200), display: "grid", gap: 1,
            gridTemplateColumns: `90px repeat(${activeRooms.length}, minmax(180px, 1fr))`, gridTemplateRows: `auto repeat(${Math.max(0, times.length - 1)}, minmax(90px, auto))` }}>
            <Typography sx={{ fontSize: 12 }}>Khung giờ</Typography>
            {activeRooms.map(room => <Typography key={room.id} sx={{ bgcolor: "#EFF4FA", p: 1, fontSize: 13, fontWeight: 700 }}>{room.name}</Typography>)}
            {times.slice(0, -1).map((time, index) => <Typography key={time} sx={{ gridColumn: 1, gridRow: index + 2, py: 1, fontSize: 12 }}>
                {shortTime(time)}<br />– {shortTime(times[index + 1])}
            </Typography>)}
            {items.map(item => <ShiftCard key={item.scheduleId} {...{ item, selectedId, onSelect }} sx={{ gridColumn: activeRooms.findIndex(room => room.id === item.roomId) + 2,
                gridRow: `${times.indexOf(item.startTime) + 2} / ${times.indexOf(item.endTime) + 2}`, alignSelf: "stretch" }} />)}
        </Box>
    </Paper>;
}
