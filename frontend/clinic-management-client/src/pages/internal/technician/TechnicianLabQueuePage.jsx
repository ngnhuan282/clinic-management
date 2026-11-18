import { useState, useEffect } from 'react';
import {
  Box, Button, Card, CardContent, Container, Grid, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Typography, Alert, Snackbar, Divider,
  IconButton, Tooltip, Chip, Stack
} from '@mui/material';
import EditNoteIcon from '@mui/icons-material/EditNote';
import ScienceIcon from '@mui/icons-material/Science';
import RefreshIcon from '@mui/icons-material/Refresh';
import SaveIcon from '@mui/icons-material/Save';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import labTestApi from '../../../api/labTestApi';
import getApiErrorMessage from '../../../utils/errorHandler';

export default function TechnicianLabQueuePage() {
  const [pendingList, setPendingList] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);
  const [resultSummary, setResultSummary] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [startingId, setStartingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await labTestApi.getPendingList();
      const items = res.data || [];
      setPendingList(items);
      if (selectedTest) {
        const updatedSelected = items.find((i) => i.id === selectedTest.id);
        setSelectedTest(updatedSelected || null);
      }
    } catch (err) {
      setToast({
        open: true,
        message: getApiErrorMessage(err) || 'Không thể tải danh sách hàng chờ!',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => { void fetchPending(); }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleSelectTest = (item) => {
    setSelectedTest(item);
    setResultSummary('');
    setNote('');
  };

  // IX.2 & IX.3: Tiếp nhận chỉ định & bắt đầu thực hiện xét nghiệm
  const handleStartTest = async (item) => {
    if (startingId) return;
    setStartingId(item.id);
    try {
      const res = await labTestApi.startTest(item.id);
      const updated = res.data;
      setToast({
        open: true,
        message: `Đã tiếp nhận và bắt đầu thực hiện ca XN #${item.id}.`,
        severity: 'info',
      });
      setPendingList((prev) => prev.map((x) => (x.id === item.id ? updated : x)));
      setSelectedTest(updated);
      setResultSummary('');
      setNote('');
    } catch (err) {
      setToast({
        open: true,
        message: getApiErrorMessage(err) || 'Không thể tiếp nhận ca xét nghiệm này!',
        severity: 'error',
      });
    } finally {
      setStartingId(null);
    }
  };

  // IX.3: Lưu kết quả (có bảo vệ LAB_RESULT_PAYMENT_GUARD ở backend)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTest || submitting) return;
    if (!resultSummary.trim()) {
      setToast({ open: true, message: 'Vui lòng nhập kết quả / thông số chi tiết!', severity: 'warning' });
      return;
    }

    setSubmitting(true);
    try {
      await labTestApi.submitResult({
        labTestId: selectedTest.id,
        resultSummary,
        note,
      });
      setToast({
        open: true,
        message: `Đã lưu kết quả cho ca #${selectedTest.id} thành công!`,
        severity: 'success',
      });
      setSelectedTest(null);
      setResultSummary('');
      setNote('');
      fetchPending();
    } catch (err) {
      setToast({
        open: true,
        message: getApiErrorMessage(err) || 'Lỗi khi lưu kết quả xét nghiệm!',
        severity: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold" color="primary" gutterBottom>
            Kỹ thuật viên: Hàng chờ Xét nghiệm
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Tiếp nhận mẫu đã thanh toán đủ, chuyển trạng thái thực hiện và cập nhật kết quả cận lâm sàng.
          </Typography>
        </Box>
        <Tooltip title="Làm mới danh sách">
          <IconButton color="primary" onClick={fetchPending} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Grid container spacing={3}>
        {/* Danh sách Hàng chờ (IX.2) */}
        <Grid item xs={12} md={7}>
          <Card elevation={3} sx={{ borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ScienceIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" fontWeight="bold">
                  Danh sách Chỉ định Đã Thanh Toán ({pendingList.length})
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1 }}>
                <Table size="small">
                  <TableHead sx={{ backgroundColor: (theme) => theme.palette.grey[100] }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Mã XN / Lượt khám</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Bệnh nhân</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Loại Xét nghiệm</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Trạng thái</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="center">Thao tác</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pendingList.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                          {loading ? 'Đang tải dữ liệu...' : 'Hiện không có ca xét nghiệm nào đã thanh toán đủ đang chờ.'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      pendingList.map((item) => {
                        const isSelected = selectedTest?.id === item.id;
                        const isInProgress = item.status === 'InProgress';
                        return (
                          <TableRow
                            key={item.id}
                            hover
                            selected={isSelected}
                            sx={{ '&.Mui-selected': { backgroundColor: 'action.selected' } }}
                          >
                            <TableCell>
                              <Stack spacing={0.5}>
                                <Typography variant="body2" fontWeight="bold">XN #{item.id}</Typography>
                                {item.appointmentId > 0 && (
                                  <Chip label={`Lượt #${item.appointmentId}`} size="small" color="info" variant="outlined" />
                                )}
                              </Stack>
                            </TableCell>
                            <TableCell>
                              <Stack spacing={0.2}>
                                <Typography variant="body2" fontWeight="600">
                                  {item.patientName || `Bệnh nhân #${item.patientId}`}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  BN #{item.patientId} {item.patientPhone ? `· ${item.patientPhone}` : ''}
                                </Typography>
                              </Stack>
                            </TableCell>
                            <TableCell>
                              <Stack spacing={0.2}>
                                <Typography variant="body2" fontWeight="500">{item.labTestTypeName}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                  BS: {item.doctorName || `#${item.doctorId}`}
                                </Typography>
                              </Stack>
                            </TableCell>
                            <TableCell>
                              <Stack spacing={0.5} alignItems="flex-start">
                                <Chip
                                  icon={<CheckCircleIcon />}
                                  label="Đã thanh toán"
                                  color="success"
                                  size="small"
                                  variant="outlined"
                                />
                                {isInProgress ? (
                                  <Chip
                                    icon={<PlayArrowIcon />}
                                    label="Đang thực hiện"
                                    color="warning"
                                    size="small"
                                  />
                                ) : (
                                  <Chip
                                    icon={<HourglassEmptyIcon />}
                                    label="Chờ tiếp nhận"
                                    size="small"
                                  />
                                )}
                              </Stack>
                            </TableCell>
                            <TableCell align="center">
                              <Stack direction="column" spacing={0.75}>
                                {!isInProgress && (
                                  <Button
                                    variant="contained"
                                    color="warning"
                                    size="small"
                                    startIcon={<PlayArrowIcon />}
                                    disabled={startingId === item.id}
                                    onClick={() => handleStartTest(item)}
                                  >
                                    {startingId === item.id ? 'Đang nhận...' : 'Tiếp nhận'}
                                  </Button>
                                )}
                                <Button
                                  variant={isSelected ? 'contained' : 'outlined'}
                                  size="small"
                                  startIcon={<EditNoteIcon />}
                                  onClick={() => handleSelectTest(item)}
                                >
                                  {isSelected ? 'Đang chọn' : 'Nhập KQ'}
                                </Button>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Form Thực hiện & Nhập kết quả (IX.3) */}
        <Grid item xs={12} md={5}>
          <Card elevation={3} sx={{ borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <EditNoteIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6" fontWeight="bold">
                    {selectedTest ? `Xử lý Ca XN #${selectedTest.id}` : 'Nhập Kết quả'}
                  </Typography>
                </Box>
                {selectedTest && (
                  <Chip
                    label={selectedTest.status === 'InProgress' ? 'Đang thực hiện' : 'Chờ tiếp nhận'}
                    color={selectedTest.status === 'InProgress' ? 'warning' : 'default'}
                    size="small"
                  />
                )}
              </Box>
              <Divider sx={{ mb: 3 }} />

              {selectedTest ? (
                <Box component="form" onSubmit={handleSubmit} noValidate>
                  <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1, border: '1px solid', borderColor: 'grey.200' }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Bệnh nhân: <strong>{selectedTest.patientName}</strong> (BN #{selectedTest.patientId}
                      {selectedTest.patientPhone ? ` · ${selectedTest.patientPhone}` : ''})
                    </Typography>
                    <Typography variant="subtitle2" color="text.secondary">
                      Lượt khám: <strong>{selectedTest.appointmentId ? `#${selectedTest.appointmentId}` : 'Chưa gắn lượt'}</strong>
                      {' · '}Bác sĩ chỉ định: <strong>{selectedTest.doctorName}</strong>
                    </Typography>
                    <Typography variant="subtitle2" color="text.secondary">
                      Xét nghiệm: <strong>{selectedTest.labTestTypeName}</strong>
                    </Typography>
                    {selectedTest.clinicalDiagnosis && (
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                        Chẩn đoán lâm sàng: {selectedTest.clinicalDiagnosis}
                      </Typography>
                    )}
                    {selectedTest.startedAt && (
                      <Typography variant="caption" color="warning.dark" display="block" sx={{ mt: 0.5 }}>
                        Tiếp nhận thực hiện lúc: {new Date(selectedTest.startedAt).toLocaleString('vi-VN')}
                      </Typography>
                    )}
                  </Box>

                  {selectedTest.status === 'Pending' && (
                    <Alert
                      severity="info"
                      sx={{ mb: 2 }}
                      action={
                        <Button
                          size="small"
                          color="warning"
                          variant="contained"
                          disabled={startingId === selectedTest.id}
                          onClick={() => handleStartTest(selectedTest)}
                        >
                          Tiếp nhận ngay
                        </Button>
                      }
                    >
                      Ca này chưa được bấm tiếp nhận. Bạn có thể bấm "Tiếp nhận ngay" để chuyển sang trạng thái đang thực hiện.
                    </Alert>
                  )}

                  <TextField
                    fullWidth
                    label="Kết quả / Thông số chi tiết"
                    multiline
                    rows={4}
                    value={resultSummary}
                    onChange={(e) => setResultSummary(e.target.value)}
                    required
                    margin="normal"
                    variant="outlined"
                    placeholder="Nhập kết luận hoặc các chỉ số đo đạc được..."
                  />
                  <TextField
                    fullWidth
                    label="Ghi chú kỹ thuật viên"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    margin="normal"
                    variant="outlined"
                    placeholder="Ghi chú thêm (ví dụ: mẫu huyết thanh đục, cần thử lại...)"
                  />
                  <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                    <Button fullWidth variant="outlined" color="inherit" onClick={() => setSelectedTest(null)}>
                      Hủy bỏ
                    </Button>
                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      color="primary"
                      disabled={submitting}
                      startIcon={<SaveIcon />}
                    >
                      {submitting ? 'Đang lưu...' : 'Lưu & Hoàn tất'}
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
                  <Typography variant="body1">
                    Vui lòng chọn một ca xét nghiệm từ danh sách bên trái để tiếp nhận hoặc nhập kết quả.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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