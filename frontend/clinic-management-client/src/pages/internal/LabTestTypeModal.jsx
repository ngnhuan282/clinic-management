import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Checkbox,
  Button,
  Box,
  Alert,
  Typography,
} from '@mui/material';

export default function LabTestTypeModal({ isOpen, onClose, onSubmit, initialData, saving, error }) {
  const [formData, setFormData] = useState(initialData || {
    name: '',
    description: '',
    price: 0,
    isActive: true
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog
      open={isOpen}
      onClose={saving ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          border: '1px solid #E5E9F0',
          boxShadow: '0 20px 25px -5px rgba(15,23,42,0.08)',
          overflow: 'hidden',
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          px: 3,
          py: 2,
          bgcolor: '#F8FAFC',
          borderBottom: '1px solid #E5E9F0',
        }}
      >
        <Typography variant="h6" component="div" sx={{ fontWeight: 600, color: '#1F2937', fontSize: '1.125rem' }}>
          {initialData ? 'Cập Nhật Loại Xét Nghiệm' : 'Thêm Loại Xét Nghiệm Mới'}
        </Typography>
      </DialogTitle>

      {/* Body Form */}
      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="Tên xét nghiệm"
            variant="outlined"
            size="small"
            required
            fullWidth
            placeholder="VD: Xét nghiệm máu tổng quát"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            InputLabelProps={{ shrink: true }}
            slotProps={{
              htmlInput: { sx: { color: '#1F2937', fontSize: '0.875rem' } },
            }}
          />

          <TextField
            label="Giá dịch vụ (VNĐ)"
            type="number"
            variant="outlined"
            size="small"
            required
            fullWidth
            inputProps={{ min: 0, step: 1000 }}
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
            InputLabelProps={{ shrink: true }}
            slotProps={{
              htmlInput: {
                sx: {
                  color: '#1F2937',
                  fontSize: '0.875rem',
                  fontVariantNumeric: 'tabular-nums',
                },
              },
            }}
          />

          <TextField
            label="Mô tả"
            variant="outlined"
            size="small"
            multiline
            rows={3}
            fullWidth
            placeholder="Ghi chú thêm về quy trình hoặc loại xét nghiệm..."
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            InputLabelProps={{ shrink: true }}
            slotProps={{
              htmlInput: { sx: { color: '#1F2937', fontSize: '0.875rem' } },
            }}
          />

          {initialData && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  sx={{
                    color: '#90CAF9',
                    '&.Mui-checked': { color: '#1976D2' },
                  }}
                />
              }
              label={
                <Typography variant="body2" sx={{ fontWeight: 500, color: '#374151' }}>
                  Đang áp dụng (Hoạt động)
                </Typography>
              }
            />
          )}
        </DialogContent>

        {/* Footer Actions */}
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #E5E9F0', gap: 1 }}>
          <Button
            type="button"
            onClick={onClose}
            variant="outlined"
            sx={{
              color: '#1976D2',
              borderColor: '#90CAF9',
              '&:hover': { bgcolor: '#F5F9FD', borderColor: '#1976D2' },
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: 2,
              px: 2.5,
              py: 1,
            }}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            disabled={saving}
            variant="contained"
            sx={{
              bgcolor: '#1976D2',
              '&:hover': { bgcolor: '#1565C0' },
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: 2,
              px: 3,
              py: 1,
              boxShadow: 'none',
            }}
          >
            Lưu thông tin
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
