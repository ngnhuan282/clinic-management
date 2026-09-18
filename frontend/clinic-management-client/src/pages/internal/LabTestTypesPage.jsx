import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { labTestTypeApi } from '../../api/labTestTypeApi';
import LabTestTypeModal from './LabTestTypeModal';

const formatCurrency = (val) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
};

export default function LabTestTypesPage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await labTestTypeApi.getAll(true);
      
      // Log kiểm tra cấu trúc dữ liệu trả về từ backend
      console.log('API Response:', res);

      // Xử lý trích xuất mảng an toàn (phòng trường hợp backend bọc dữ liệu trong data/items)
      const rawData = res?.data?.data || res?.data?.items || res?.data;
      const dataArray = Array.isArray(rawData) ? rawData : [];

      setList(dataArray);
    } catch (err) {
      console.error('Lỗi khi tải danh sách loại xét nghiệm:', err);
      setList([]); // Tránh rò rỉ state hỏng nếu API lỗi
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleOpenCreate = () => {
    setSelectedItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn ngưng sử dụng (ẩn) loại xét nghiệm này?')) {
      return;
    }

    try {
      await labTestTypeApi.delete(id);
      await fetchList();
    } catch (err) {
      console.error('Lỗi xóa:', err);
    }
  };

  const handleFormSubmit = async (data) => {
    try {
      if (selectedItem) {
        await labTestTypeApi.update(selectedItem.id, data);
      } else {
        await labTestTypeApi.create(data);
      }
      setIsModalOpen(false);
      await fetchList();
    } catch (err) {
      console.error('Lỗi lưu dữ liệu:', err);
    }
  };

  // Kiểm tra an toàn biến list có phải là mảng không trước khi render
  const safeList = Array.isArray(list) ? list : [];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F5F9FD', p: 3 }}>
      {/* Header Section */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { md: 'center' }, gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1F2937' }}>
            Danh Mục Loại Xét Nghiệm
          </Typography>
          <Typography variant="body2" sx={{ color: '#6B7280' }}>
            Quản lý bảng giá và thông tin dịch vụ xét nghiệm cận lâm sàng
          </Typography>
        </Box>
        <Button
          variant="contained"
          onClick={handleOpenCreate}
          sx={{
            bgcolor: '#1976D2',
            '&:hover': { bgcolor: '#1565C0' },
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 2,
            px: 2.5,
            py: 1,
            boxShadow: 'none',
          }}
        >
          + Thêm Loại Xét Nghiệm
        </Button>
      </Box>

      {/* Main Table Card */}
      <TableContainer component={Paper} sx={{ borderRadius: 3, border: '1px solid #E5E9F0', boxShadow: '0 1px 3px rgba(15,23,42,0.04)', overflow: 'hidden' }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ bgcolor: '#F8FAFC' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, color: '#6B7280', fontSize: '0.75rem', textTransform: 'uppercase', width: 64 }}>Mã ID</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#6B7280', fontSize: '0.75rem', textTransform: 'uppercase' }}>Tên Loại Xét Nghiệm</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#6B7280', fontSize: '0.75rem', textTransform: 'uppercase' }}>Mô Tả</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, color: '#6B7280', fontSize: '0.75rem', textTransform: 'uppercase' }}>Đơn Giá</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600, color: '#6B7280', fontSize: '0.75rem', textTransform: 'uppercase', width: 128 }}>Trạng Thái</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600, color: '#6B7280', fontSize: '0.75rem', textTransform: 'uppercase', width: 112 }}>Thao Tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4, color: '#6B7280', fontSize: '0.875rem' }}>
                  Đang tải dữ liệu...
                </TableCell>
              </TableRow>
            ) : (
              safeList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4, color: '#6B7280', fontSize: '0.875rem' }}>
                    Chưa có dữ liệu xét nghiệm.
                  </TableCell>
                </TableRow>
              ) : (
                safeList.map((item) => (
                  <TableRow key={item.id} hover sx={{ '&:hover': { bgcolor: '#F5F9FD' } }}>
                    <TableCell sx={{ fontWeight: 500, color: '#6B7280', fontSize: '0.875rem', fontVariantNumeric: 'tabular-nums' }}>
                      #{item.id}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#1F2937', fontSize: '0.875rem' }}>
                      {item.name}
                    </TableCell>
                    <TableCell sx={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#374151', fontSize: '0.875rem' }} title={item.description}>
                      {item.description || '-'}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#1F2937', fontSize: '0.875rem', fontVariantNumeric: 'tabular-nums' }}>
                      {formatCurrency(item.price)}
                    </TableCell>
                    <TableCell align="center">
                      {item.isActive ? (
                        <Chip
                          label="Hoạt động"
                          size="small"
                          sx={{ bgcolor: '#ECFDF5', color: '#10B981', fontWeight: 600, borderRadius: '4px', height: 24, fontSize: '0.75rem' }}
                        />
                      ) : (
                        <Chip
                          label="Ngừng dùng"
                          size="small"
                          sx={{ bgcolor: '#FEF2F2', color: '#EF4444', fontWeight: 600, borderRadius: '4px', height: 24, fontSize: '0.75rem' }}
                        />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                        <Button
                          size="small"
                          onClick={() => handleOpenEdit(item)}
                          sx={{ color: '#1976D2', '&:hover': { color: '#1565C0' }, fontWeight: 600, textTransform: 'none', minWidth: 'auto', p: 0.5 }}
                        >
                          Sửa
                        </Button>
                        {item.isActive && (
                          <Button
                            size="small"
                            onClick={() => handleDelete(item.id)}
                            sx={{ color: '#EF4444', '&:hover': { color: '#B91C1C' }, fontWeight: 600, textTransform: 'none', minWidth: 'auto', p: 0.5 }}
                          >
                            Ẩn
                          </Button>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Modal Thêm/Sửa */}
      <LabTestTypeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={selectedItem}
      />
    </Box>
  );
}