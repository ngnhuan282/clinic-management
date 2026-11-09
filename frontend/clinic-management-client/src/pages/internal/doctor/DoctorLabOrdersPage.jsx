import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Chip,
  Alert,
  Snackbar,
  Divider
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ListAltIcon from '@mui/icons-material/ListAlt';
import labTestApi from '../../../api/labTestApi';
import useLabOrders from '../../../hooks/useLabOrders';
import LabResultDialog from '../../../components/common/LabResultDialog';
import { positiveId } from '../../../utils/notificationNavigation';

export default function DoctorLabOrdersPage() {
  const [patientId, setPatientId] = useState('');
  const [labTestTypeId, setLabTestTypeId] = useState('');
  const [clinicalDiagnosis, setClinicalDiagnosis] = useState('');

  // Quản lý danh sách chỉ định đã tạo
  const { orders, loading, error, reload: fetchOrders } = useLabOrders();
  const [params, setParams] = useSearchParams();
  const selectedLabId = positiveId(params.get('labTestId'));

  // Quản lý thông báo (Snackbar)
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await labTestApi.createOrder({
        patientId: Number(patientId),
        labTestTypeId: Number(labTestTypeId),
        clinicalDiagnosis,
      });

      setToast({
        open: true,
        message: 'Tạo chỉ định xét nghiệm thành công!',
        severity: 'success',
      });

      // Reset form & reload danh sách
      setPatientId('');
      setLabTestTypeId('');
      setClinicalDiagnosis('');
      fetchOrders();
    } catch {
      setToast({
        open: true,
        message: 'Lỗi khi tạo chỉ định xét nghiệm!',
        severity: 'error',
      });
    }
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'Completed':
        return <Chip label="Đã hoàn thành" color="success" size="small" />;
      case 'Processing':
        return <Chip label="Đang xử lý" color="info" size="small" />;
      default:
        return <Chip label="Đang chờ" color="warning" size="small" />;
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }} color="primary" gutterBottom>
          Bác sĩ: Chỉ định Xét nghiệm
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Tạo y lệnh xét nghiệm mới cho bệnh nhân và theo dõi tiến độ xử lý từ phòng Lab.
        </Typography>
      </Box>
      {error && <Alert severity="error" action={<Button onClick={fetchOrders}>Thử lại</Button>} sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3}>
        {/* Form Tạo chỉ định */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card elevation={3} sx={{ borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AssignmentIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" fontWeight="bold">
                  Tạo Y lệnh Mới
                </Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />

              <Box component="form" onSubmit={handleSubmit} noValidate>
                <TextField
                  fullWidth
                  label="Mã Bệnh nhân (Patient ID)"
                  type="number"
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  required
                  margin="normal"
                  variant="outlined"
                  placeholder="Nhập ID bệnh nhân..."
                />

                <TextField
                  fullWidth
                  label="Mã Loại Xét nghiệm (LabTestType ID)"
                  type="number"
                  value={labTestTypeId}
                  onChange={(e) => setLabTestTypeId(e.target.value)}
                  required
                  margin="normal"
                  variant="outlined"
                  placeholder="Nhập mã loại xét nghiệm..."
                  helperText="Tham chiếu từ danh mục xét nghiệm"
                />

                <TextField
                  fullWidth
                  label="Chẩn đoán lâm sàng"
                  multiline
                  rows={3}
                  value={clinicalDiagnosis}
                  onChange={(e) => setClinicalDiagnosis(e.target.value)}
                  margin="normal"
                  variant="outlined"
                  placeholder="Mô tả triệu chứng hoặc lý do chỉ định..."
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  endIcon={<SendIcon />}
                  sx={{ mt: 3, py: 1.2, fontWeight: 'bold' }}
                >
                  Gửi chỉ định
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Danh sách Chỉ định đã phát */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card elevation={3} sx={{ borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ListAltIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" fontWeight="bold">
                  Danh sách Y lệnh Đã phát
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />

              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1 }}>
                <Table>
                  <TableHead sx={{ backgroundColor: (theme) => theme.palette.grey[100] }}>
                    <TableRow>
                      <TableCell fontWeight="bold">Mã Y lệnh</TableCell>
                      <TableCell fontWeight="bold">Mã BN</TableCell>
                      <TableCell fontWeight="bold">Loại Xét nghiệm</TableCell>
                      <TableCell fontWeight="bold">Chẩn đoán</TableCell>
                      <TableCell fontWeight="bold">Trạng thái</TableCell>
                      <TableCell fontWeight="bold">Kết quả</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {orders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                          {loading ? 'Đang tải dữ liệu...' : 'Chưa có chỉ định xét nghiệm nào.'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      orders.map((row) => (
                        <TableRow key={row.id} hover>
                          <TableCell>#{row.id}</TableCell>
                          <TableCell>{row.patientId}</TableCell>
                          <TableCell>{row.labTestTypeName || `Loại #${row.labTestTypeId}`}</TableCell>
                          <TableCell>{row.clinicalDiagnosis || '---'}</TableCell>
                          <TableCell>{getStatusChip(row.status)}</TableCell>
                          <TableCell sx={{ maxWidth: 200 }}>
                            <Button size="small" aria-label={`Xem chi tiết xét nghiệm #${row.id}`} onClick={() => setParams(current => { current.set('labTestId', String(row.id)); return current; })}>Xem chi tiết</Button>
                            {row.result ? (
                              <Typography variant="body2" color="text.primary" noWrap>
                                {row.result.resultSummary}
                              </Typography>
                            ) : (
                              <Typography variant="caption" color="text.secondary" italic>
                                Chưa có kết quả
                              </Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <LabResultDialog id={selectedLabId} onClose={() => setParams(current => { current.delete('labTestId'); return current; })} />

      {/* Thông báo Alert */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={toast.severity} onClose={() => setToast({ ...toast, open: false })}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
