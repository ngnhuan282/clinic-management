import { Alert, Button, Paper, Rating, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { formatRating } from "../../../utils/formatRating";

export default function DoctorRatingsTable({ data, onSelect }) {
    if (!data?.items.length) return <Alert severity="info">Chưa có điểm đánh giá để tổng hợp.</Alert>;
    return <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}><Table aria-label="Điểm đánh giá theo bác sĩ" sx={{ minWidth: 780 }}>
        <TableHead><TableRow><TableCell>Bác sĩ</TableCell><TableCell align="right">Tổng đánh giá</TableCell><TableCell align="right">Công khai / Đã ẩn</TableCell><TableCell>Điểm tất cả</TableCell><TableCell>Điểm công khai</TableCell><TableCell /></TableRow></TableHead>
        <TableBody>{data.items.map(item => <TableRow key={item.doctorId}>
            <TableCell><Typography sx={{ fontWeight: 650 }}>{item.doctorName}</Typography><Typography variant="body2" color="text.secondary">{item.departmentName}</Typography></TableCell>
            <TableCell align="right">{item.totalReviews}</TableCell><TableCell align="right">{item.visibleReviews} / {item.hiddenReviews}</TableCell>
            <TableCell><Stack spacing={0.5}><Rating size="small" readOnly precision={0.1} value={item.averageRating || 0} /><Typography variant="body2">{formatRating(item.averageRating)}</Typography></Stack></TableCell>
            <TableCell><Typography variant="body2">{formatRating(item.publicAverageRating)}</Typography></TableCell>
            <TableCell><Button onClick={() => onSelect(item.doctorId)}>Xem đánh giá</Button></TableCell>
        </TableRow>)}</TableBody>
    </Table></TableContainer>;
}
