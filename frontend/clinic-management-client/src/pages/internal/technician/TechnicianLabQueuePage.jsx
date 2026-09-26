import React, { useState, useEffect } from 'react';
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
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import EditNoteIcon from '@mui/icons-material/EditNote';
import ScienceIcon from '@mui/icons-material/Science';
import RefreshIcon from '@mui/icons-material/Refresh';
import SaveIcon from '@mui/icons-material/Save';
import labTestApi from '../../../api/labTestApi';

export default function TechnicianLabQueuePage() {
  const [pendingList, setPendingList] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);
  const [resultSummary, setResultSummary] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  // Quản lý thông báo
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await labTestApi.getPendingList();
      setPendingList(res.data || []);
    } catch (err) {
      console.error("Lỗi tải danh sách hàng chờ:", err);
      setToast({
        open: true,
        message: 'Không thể tải danh sách hàng chờ!',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleSelectTest = (item) => {
    setSelectedTest(item);
    setResultSummary('');
    setNote('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTest) return;

    try {
      await labTestApi.submitResult({
        labTestId: selectedTest.id,
        resultSummary,
        note
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
      console.error("Lỗi nhập kết quả:", err);
      setToast({
        open: true,
        message: 'Lỗi khi lưu kết quả xét nghiệm!',
        severity: 'error',
      });
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold" color="primary" gutterBottom>
            Kỹ thuật viên: Hàng chờ Xét nghiệm
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Tiếp nhận mẫu, thực hiện xét nghiệm và cập nhật kết quả cho các chỉ định đang chờ.
          </Typography>
        </Box>
        <Tooltip title="Làm mới danh sách">
          <IconButton color="primary" onClick={fetchPending} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Grid container spacing={3}>
        {/* Danh sách Hàng chờ */}
        <Grid item xs={12} md={7}>
          <Card elevation={3} sx={{ borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ScienceIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" fontWeight="bold">
                  Danh sách Cần Thực Hiện ({pendingList.length})
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />

              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1 }}>
                <Table>
                  <TableHead sx={{ backgroundColor: (theme) => theme.palette.grey[100] }}>
                    <TableRow>
                      <TableCell fontweight="bold">Mã XN</TableCell>
                      <TableCell fontweight="bold">Mã BN</TableCell>
                      <TableCell fontweight="bold">Loại Xét nghiệm</TableCell>
                      <TableCell fontweight="bold">Chẩn đoán</TableCell>
                      <TableCell fontweight="bold" align="center">Thao tác</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pendingList.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                          {loading ? 'Đang tải dữ liệu...' : 'Hiện không có ca xét nghiệm nào đang chờ.'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      pendingList.map((item) => {
                        const isSelected = selectedTest?.id === item.id;
                        return (
                          <TableRow
                            key={item.id}
                            hover
                            selected={isSelected}
                            sx={{ '&.Mui-selected': { backgroundColor: 'action.selected' } }}
                          >
                            <TableCell fontweight="bold">#{item.id}</TableCell>
                            <TableCell>{item.patientId}</TableCell>
                            <TableCell>{item.labTestTypeName || `Loại #${item.labTestTypeId}`}</TableCell>
                            <TableCell sx={{ maxWidth: 180 }}>{item.clinicalDiagnosis || '---'}</TableCell>
                            <TableCell align="center">
                              <Button
                                variant={isSelected ? "contained" : "outlined"}
                                size="small"
                                startIcon={<EditNoteIcon />}
                                onClick={() => handleSelectTest(item)}
                              >
                                {isSelected ? 'Đang chọn' : 'Nhập KQ'}
                              </Button>
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

        {/* Form Nhập kết quả */}
        <Grid item xs={12} md={5}>
          <Card elevation={3} sx={{ borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <EditNoteIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" fontWeight="bold">
                  {selectedTest ? `Nhập Kết quả Ca #${selectedTest.id}` : 'Nhập Kết quả'}
                </Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />

              {selectedTest ? (
                <Box component="form" onSubmit={handleSubmit} noValidate>
                  <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1, border: '1px solid', borderColor: 'grey.200' }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Bệnh nhân ID: <strong>{selectedTest.patientId}</strong>
                    </Typography>
                    <Typography variant="subtitle2" color="text.secondary">
                      Xét nghiệm: <strong>{selectedTest.labTestTypeName || `#${selectedTest.labTestTypeId}`}</strong>
                    </Typography>
                    {selectedTest.clinicalDiagnosis && (
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                        Chẩn đoán: {selectedTest.clinicalDiagnosis}
                      </Typography>
                    )}
                  </Box>

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
                    <Button
                      fullWidth
                      variant="outlined"
                      color="inherit"
                      onClick={() => setSelectedTest(null)}
                    >
                      Hủy bỏ
                    </Button>
                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      color="primary"
                      startIcon={<SaveIcon />}
                    >
                      Lưu & Hoàn tất
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
                  <Typography variant="body1">
                    Vui lòng chọn một ca xét nghiệm từ danh sách bên trái để bắt đầu nhập kết quả.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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