import { useEffect, useState } from "react";
import { Alert, Box, Button, CircularProgress, MenuItem, Pagination, Stack, TextField, Typography } from "@mui/material";
import { getAvailableDoctorProfiles } from "../../../api/userApi";
import { getApiErrorMessage } from "../../../utils/errorHandler";

export default function DoctorProfilePicker({ value, onChange, disabled, error }) {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [revision, setRevision] = useState(0);
    const [result, setResult] = useState(null);
    const [selected, setSelected] = useState(null);
    const key = JSON.stringify([search, page, revision]);
    useEffect(() => {
        const controller = new AbortController();
        const timer = setTimeout(() => getAvailableDoctorProfiles({ search: search.trim(), pageNumber: page, pageSize: 10 }, controller.signal)
            .then(data => !controller.signal.aborted && setResult({ key, data }))
            .catch(requestError => !controller.signal.aborted && setResult({ key, error: getApiErrorMessage(requestError) })), 250);
        return () => { clearTimeout(timer); controller.abort(); };
    }, [key, search, page]);
    const current = result?.key === key ? result : null;
    const options = current?.data?.items || [];
    const displayed = selected && value === String(selected.doctorId) && !options.some(item => item.doctorId === selected.doctorId) ? [selected, ...options] : options;
    return <Stack spacing={1.5}>
        <Typography variant="body2" color="text.secondary">Tài khoản bác sĩ/trưởng khoa cần liên kết một hồ sơ bác sĩ đang hoạt động.</Typography>
        <TextField label="Tìm hồ sơ bác sĩ" value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} disabled={disabled} fullWidth slotProps={{ htmlInput: { maxLength: 100 } }} />
        {!current ? <Box role="status" aria-label="Đang tải hồ sơ bác sĩ"><CircularProgress size={20} /></Box>
            : current.error ? <Alert severity="error" action={<Button onClick={() => setRevision(number => number + 1)}>Thử lại</Button>}>{current.error}</Alert>
            : <><TextField label="Hồ sơ bác sĩ" select fullWidth required value={value} disabled={disabled} error={Boolean(error)} helperText={error} onChange={event => {
                const doctor = displayed.find(item => String(item.doctorId) === event.target.value);
                setSelected(doctor); onChange(event.target.value);
            }}><MenuItem value="">Chọn hồ sơ chưa liên kết</MenuItem>{displayed.map(item => <MenuItem key={item.doctorId} value={String(item.doctorId)}>{item.fullName} · {item.departmentName}</MenuItem>)}</TextField>
                {!options.length && <Alert severity="info">Không có hồ sơ phù hợp chưa liên kết. Bạn có thể đổi từ khóa tìm kiếm.</Alert>}
                {current.data.totalPages > 1 && <Pagination size="small" page={page} count={current.data.totalPages} onChange={(_, number) => setPage(number)} />}</>}
    </Stack>;
}
