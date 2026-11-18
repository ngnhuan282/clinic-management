import { useState, useEffect } from 'react';
import {
  Table, Button, Card, Select, Tag, Space, Typography, message,
  Row, Col, Divider, Statistic, InputNumber, Tabs, Modal, Form, Input, Alert, Radio, Descriptions
} from 'antd';
import {
  DollarOutlined, CreditCardOutlined, SolutionOutlined, SafetyCertificateOutlined,
  HistoryOutlined, EditOutlined, SearchOutlined, PrinterOutlined, FileTextOutlined, PlusCircleOutlined
} from '@ant-design/icons';
import invoiceApi from '../../api/invoiceApi';
import getApiErrorMessage from '../../utils/errorHandler';
import useAuth from '../../hooks/useAuth';

const { Title, Text } = Typography;
const { Option } = Select;

const STAGE_LABELS = {
  Book: 'Sổ khám bệnh (Book)',
  Pending: 'Phí khám ban đầu (Pending)',
  LabAndConsultation: 'Khám & Xét nghiệm (LabAndConsultation)',
  Medicine: 'Đơn thuốc đã chốt (Medicine)',
  Final: 'Tổng hợp cuối lượt (Final)',
};

const STATUS_CONFIG = {
  Unpaid: { color: 'red', label: 'Chưa thanh toán' },
  PartiallyPaid: { color: 'orange', label: 'Thanh toán một phần' },
  Paid: { color: 'green', label: 'Đã thanh toán đủ' },
  Refunded: { color: 'purple', label: 'Đã hoàn tiền' },
};

export default function CashierBillingPage() {
  const { userId, permissions } = useAuth();
  const canCreate = permissions.includes('billing.create');
  const canRecordPayment = permissions.includes('billing.recordPayment');

  const [activeTab, setActiveTab] = useState('1');

  // States Tab 1: Lập hóa đơn & Thu tiền
  const [stage, setStage] = useState('Book');
  const [pendingState, setPendingState] = useState(null);
  const [pendingRevision, setPendingRevision] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [selection, setSelection] = useState(null);

  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [insuranceDiscountPercent, setInsuranceDiscountPercent] = useState(0);
  const [paymentMode, setPaymentMode] = useState('full'); // 'full' | 'partial' | 'unpaid'
  const [customPayAmount, setCustomPayAmount] = useState(0);
  const [referenceCode, setReferenceCode] = useState('');
  const [paymentNote, setPaymentNote] = useState('');

  // States Tab 2: Tra cứu, Thu bổ sung, In phiếu thu & Điều chỉnh
  const [historyState, setHistoryState] = useState(null);
  const [historyFilter, setHistoryFilter] = useState({ search: '', revision: 0 });
  const [searchKeyword, setSearchKeyword] = useState('');

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedInvoiceDetail, setSelectedInvoiceDetail] = useState(null);

  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedInvoiceForPay, setSelectedInvoiceForPay] = useState(null);
  const [payForm] = Form.useForm();

  const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false);
  const [selectedInvoiceForAdjust, setSelectedInvoiceForAdjust] = useState(null);
  const [adjForm] = Form.useForm();

  const pendingKey = JSON.stringify({ userId, stage, pendingRevision });
  const historyKey = JSON.stringify({ userId, ...historyFilter });

  const pending = pendingState?.key === pendingKey ? pendingState : null;
  const history = historyState?.key === historyKey ? historyState : null;

  const pendingList = pending?.items || [];
  const historyList = history?.items || [];
  const loading = !pending;
  const historyLoading = !history;

  const getRecordRowKey = (r) => `${r.billingStage}-${r.appointmentId}-${r.patientId}-${r.items?.[0]?.sourceId || 0}`;
  const selectedRecord = selection?.key === pendingKey ? selection.record : null;

  const fetchPending = () => setPendingRevision((v) => v + 1);
  const fetchHistory = () => setHistoryFilter((v) => ({ search: searchKeyword, revision: v.revision + 1 }));

  function selectRecord(record) {
    setSelection({ key: pendingKey, record });
    setInsuranceDiscountPercent(0);
    setPaymentMode('full');
    setCustomPayAmount(0);
    setReferenceCode('');
    setPaymentNote('');
  }

  useEffect(() => {
    if (activeTab !== '1') return;
    const controller = new AbortController();
    const { stage: requestedStage } = JSON.parse(pendingKey);
    invoiceApi.getPendingBillings(requestedStage, { signal: controller.signal })
      .then((res) => {
        if (!controller.signal.aborted) setPendingState({ key: pendingKey, items: res.data });
      })
      .catch((err) => {
        if (!controller.signal.aborted) setPendingState({ key: pendingKey, items: [], error: getApiErrorMessage(err) });
      });
    return () => controller.abort();
  }, [activeTab, pendingKey]);

  useEffect(() => {
    if (activeTab !== '2') return;
    const controller = new AbortController();
    const { search } = JSON.parse(historyKey);
    invoiceApi.getInvoiceHistory(search, { signal: controller.signal })
      .then((res) => {
        if (!controller.signal.aborted) setHistoryState({ key: historyKey, items: res.data });
      })
      .catch((err) => {
        if (!controller.signal.aborted) setHistoryState({ key: historyKey, items: [], error: getApiErrorMessage(err) });
      });
    return () => controller.abort();
  }, [activeTab, historyKey]);

  // Tính toán hiển thị Tab 1 (server sẽ tính chốt lại lần cuối)
  const rawTotalAmount = selectedRecord?.items?.reduce((sum, item) => sum + item.totalPrice, 0) || 0;
  const insuranceAmount = Math.round((rawTotalAmount * (insuranceDiscountPercent || 0)) / 100);
  const finalPatientAmount = rawTotalAmount - insuranceAmount;

  const actualInitialPay =
    paymentMode === 'unpaid' ? 0 :
    paymentMode === 'partial' ? Math.min(customPayAmount || 0, finalPatientAmount) :
    finalPatientAmount;

  const handleCreateInvoice = async () => {
    if (!selectedRecord || !canCreate || submitting) return;
    if (actualInitialPay > 0 && !canRecordPayment) {
      message.warning('Bạn không có quyền ghi nhận thanh toán, vui lòng chọn chế độ Lập hóa đơn chưa thu (0đ).');
      return;
    }

    setSubmitting(true);
    try {
      const dto = {
        appointmentId: selectedRecord.appointmentId,
        patientId: selectedRecord.patientId,
        billingStage: stage,
        paymentMethod,
        insuranceDiscountPercent: insuranceDiscountPercent || 0,
        initialPaymentAmount: actualInitialPay,
        referenceCode,
        paymentNote,
        items: selectedRecord.items.map((item) => ({
          sourceType: item.sourceType,
          sourceId: item.sourceId,
          itemName: item.itemName,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
        })),
      };
      const res = await invoiceApi.createInvoice(dto);
      message.success(
        actualInitialPay > 0
          ? `Lập hóa đơn #${res.data.id} & ghi nhận thu ${actualInitialPay.toLocaleString()} đ thành công!`
          : `Đã lập hóa đơn #${res.data.id} (Chưa thu tiền).`
      );
      setSelection(null);
      fetchPending();
    } catch (err) {
      message.error(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  // Mở modal thu tiền bổ sung (VII.6)
  const handleOpenRecordPayment = (invoice) => {
    setSelectedInvoiceForPay(invoice);
    payForm.setFieldsValue({
      amount: invoice.remainingAmount,
      paymentMethod: 'Cash',
      referenceCode: '',
      note: `Thu tiền bổ sung cho Hóa đơn #${invoice.id}`,
    });
    setPayModalOpen(true);
  };

  const handleSubmitRecordPayment = async (values) => {
    if (!selectedInvoiceForPay || !canRecordPayment) return;
    try {
      const res = await invoiceApi.recordPayment(selectedInvoiceForPay.id, values);
      message.success('Ghi nhận thanh toán thành công!');
      setPayModalOpen(false);
      fetchHistory();
      if (selectedInvoiceDetail?.id === res.data.id) {
        setSelectedInvoiceDetail(res.data);
      }
    } catch (err) {
      message.error(getApiErrorMessage(err));
    }
  };

  // Mở modal điều chỉnh / hoàn tiền (VII.8)
  const handleOpenAdjustmentModal = (record) => {
    setSelectedInvoiceForAdjust(record);
    adjForm.setFieldsValue({
      reason: '',
      adjustmentAmount: 0,
      paymentMethod: 'Cash',
      referenceCode: '',
      prescriptionStockReviewId: undefined,
    });
    setAdjustmentModalOpen(true);
  };

  const handleCreateAdjustment = async (values) => {
    if (!selectedInvoiceForAdjust || !canCreate) return;
    try {
      const dto = {
        originalInvoiceId: selectedInvoiceForAdjust.id,
        prescriptionStockReviewId: values.prescriptionStockReviewId || null,
        reason: values.reason,
        paymentMethod: values.paymentMethod,
        referenceCode: values.referenceCode || null,
        adjustmentTotalAmount: values.adjustmentAmount,
        adjustmentInsuranceAmount: 0,
        adjustmentPatientAmount: values.adjustmentAmount,
        items: [
          {
            sourceType: 'Adjustment',
            sourceId: selectedInvoiceForAdjust.id,
            itemName: `Điều chỉnh cho Hóa đơn #${selectedInvoiceForAdjust.id}`,
            unitPrice: values.adjustmentAmount,
            quantity: 1,
          },
        ],
      };
      await invoiceApi.createAdjustment(dto);
      message.success('Tạo chứng từ điều chỉnh & đối soát thành công!');
      setAdjustmentModalOpen(false);
      fetchHistory();
    } catch (err) {
      message.error(getApiErrorMessage(err));
    }
  };

  // In Phiếu thu / Hóa đơn (VII.7)
  const handlePrintReceipt = (invoice, specificPayment = null) => {
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) {
      message.warning('Trình duyệt đang chặn cửa sổ bật lên (Popup). Vui lòng cho phép mở Popup để in phiếu thu.');
      return;
    }

    const isRefund = specificPayment?.paymentType === 'Refund' || invoice.patientAmount < 0;
    const titleText = specificPayment
      ? (isRefund ? 'PHIẾU CHI HOÀN TIỀN' : 'PHIẾU THU TIỀN DỊCH VỤ Y TẾ')
      : (invoice.invoiceType === 'Adjustment' ? 'CHỨNG TỪ ĐIỀU CHỈNH HÓA ĐƠN' : 'BIÊN LAI THU TIỀN & HÓA ĐƠN KHÁM BỆNH');

    const rowsHtml = invoice.details.map((d, idx) => `
      <tr>
        <td style="text-align:center">${idx + 1}</td>
        <td>${d.itemName}</td>
        <td style="text-align:right">${Number(d.unitPrice).toLocaleString('vi-VN')} đ</td>
        <td style="text-align:center">${d.quantity}</td>
        <td style="text-align:right">${Number(d.totalPrice).toLocaleString('vi-VN')} đ</td>
      </tr>
    `).join('');

    const paymentInfoHtml = specificPayment
      ? `
        <div class="box">
          <p><strong>Số phiếu:</strong> ${specificPayment.receiptNumber}</p>
          <p><strong>Thời gian giao dịch:</strong> ${new Date(specificPayment.paidAt).toLocaleString('vi-VN')}</p>
          <p><strong>Số tiền giao dịch lần này:</strong> <span style="font-size:16px;font-weight:bold">${Number(specificPayment.amount).toLocaleString('vi-VN')} VNĐ</span></p>
          <p><strong>Phương thức:</strong> ${specificPayment.paymentMethod} ${specificPayment.referenceCode ? `(Mã đối chiếu: ${specificPayment.referenceCode})` : ''}</p>
          <p><strong>Ghi chú:</strong> ${specificPayment.note || 'Không có'}</p>
        </div>
      `
      : '';

    printWindow.document.write(`
      <html>
        <head>
          <title>${titleText} - #${invoice.id}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #222; line-height: 1.5; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 12px; margin-bottom: 16px; }
            .header h2 { margin: 0; font-size: 20px; }
            .meta { display: flex; justify-content: space-between; margin-bottom: 16px; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 14px; }
            th, td { border: 1px solid #999; padding: 8px; }
            th { background: #f0f0f0; }
            .summary { text-align: right; font-size: 14px; }
            .box { border: 1px dashed #666; padding: 12px; margin-bottom: 16px; background: #fafafa; }
            .sign { display: flex; justify-content: space-between; margin-top: 40px; text-align: center; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div style="font-weight:bold">PHÒNG KHÁM ĐA KHOA CLINIC MANAGEMENT</div>
            <h2>${titleText}</h2>
            <div>Mã Hóa Đơn: <strong>#${invoice.id}</strong> ${invoice.originalInvoiceId ? `(Gốc: #${invoice.originalInvoiceId})` : ''}</div>
          </div>
          <div class="meta">
            <div>
              <div><strong>Bệnh nhân:</strong> ${invoice.patientName} (Mã BN: #${invoice.patientId})</div>
              <div><strong>Số điện thoại:</strong> ${invoice.patientPhone || '---'}</div>
              <div><strong>Mã lượt khám:</strong> ${invoice.appointmentId ? `#${invoice.appointmentId}` : 'Cấp sổ / Lẻ'}</div>
            </div>
            <div style="text-align:right">
              <div><strong>Ngày lập HĐ:</strong> ${new Date(invoice.createdAt).toLocaleString('vi-VN')}</div>
              <div><strong>Phân hệ thu:</strong> ${STAGE_LABELS[invoice.billingStage] || invoice.billingStage}</div>
              <div><strong>Trạng thái HĐ:</strong> ${STATUS_CONFIG[invoice.status]?.label || invoice.status}</div>
            </div>
          </div>
          ${paymentInfoHtml}
          <table>
            <thead>
              <tr>
                <th style="width:40px">STT</th>
                <th>Nội dung dịch vụ / Thuốc</th>
                <th style="width:120px">Đơn giá</th>
                <th style="width:60px">SL</th>
                <th style="width:130px">Thành tiền</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
          <div class="summary">
            <div>Tổng chi phí gốc: <strong>${Number(invoice.totalAmount).toLocaleString('vi-VN')} đ</strong></div>
            <div>BHYT chi trả (${invoice.insuranceDiscountPercent}%): <strong>-${Number(invoice.insuranceAmount).toLocaleString('vi-VN')} đ</strong></div>
            <div>Bệnh nhân phải trả: <strong>${Number(invoice.patientAmount).toLocaleString('vi-VN')} đ</strong></div>
            <div>Đã thanh toán lũy kế: <strong>${Number(invoice.paidAmount).toLocaleString('vi-VN')} đ</strong></div>
            <div style="font-size:16px;color:#cf1322">Còn lại phải thu: <strong>${Number(invoice.remainingAmount).toLocaleString('vi-VN')} đ</strong></div>
          </div>
          <div class="sign">
            <div><strong>Người nộp tiền</strong><br/><em>(Ký, ghi rõ họ tên)</em></div>
            <div><strong>Thu ngân lập phiếu</strong><br/><em>(Ký, ghi rõ họ tên)</em></div>
          </div>
          <script>window.onload = function() { window.print(); };</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const pendingColumns = [
    {
      title: 'Lượt khám / BN',
      key: 'patient',
      render: (_, r) => (
        <Space direction="vertical" size={0}>
          <Text strong>{r.patientName || `BN #${r.patientId}`}</Text>
          <Space size={4}>
            <Tag color="green">BN #{r.patientId}</Tag>
            {r.appointmentId > 0 && <Tag color="blue">Lượt #{r.appointmentId}</Tag>}
          </Space>
        </Space>
      ),
    },
    {
      title: 'Tổng phí',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (v, r) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ color: '#cf1322' }}>{(v || 0).toLocaleString()} đ</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{r.items?.length || 0} khoản</Text>
        </Space>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Button
          type={selectedRecord && getRecordRowKey(selectedRecord) === getRecordRowKey(record) ? 'primary' : 'default'}
          disabled={submitting || loading}
          onClick={() => selectRecord(record)}
        >
          Chọn
        </Button>
      ),
    },
  ];

  const historyColumns = [
    {
      title: 'Mã HĐ / Loại',
      key: 'id',
      render: (_, r) => (
        <Space direction="vertical" size={2}>
          <Space>
            <Tag color={r.invoiceType === 'Adjustment' ? 'purple' : 'volcano'}>#{r.id}</Tag>
            {r.invoiceType === 'Adjustment' && <Tag color="magenta">Điều chỉnh HĐ #{r.originalInvoiceId}</Tag>}
          </Space>
          <Text type="secondary" style={{ fontSize: 12 }}>{r.billingStage}</Text>
        </Space>
      ),
    },
    {
      title: 'Bệnh nhân',
      key: 'patient',
      render: (_, r) => (
        <Space direction="vertical" size={0}>
          <Text strong>{r.patientName}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>BN #{r.patientId} {r.appointmentId ? `· Lượt #${r.appointmentId}` : ''}</Text>
        </Space>
      ),
    },
    {
      title: 'BN Phải Trả',
      dataIndex: 'patientAmount',
      key: 'patientAmount',
      render: (v) => <strong>{v?.toLocaleString()} đ</strong>,
    },
    {
      title: 'Đã Thu / Còn Lại',
      key: 'paid',
      render: (_, r) => (
        <Space direction="vertical" size={0}>
          <Text style={{ color: '#3f8600' }}>Đã thu: {r.paidAmount?.toLocaleString()} đ</Text>
          {r.remainingAmount > 0 && <Text type="danger">Còn lại: {r.remainingAmount?.toLocaleString()} đ</Text>}
        </Space>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (s) => {
        const cfg = STATUS_CONFIG[s] || { color: 'default', label: s };
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (d) => new Date(d).toLocaleString('vi-VN'),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Space wrap>
          <Button
            size="small"
            icon={<FileTextOutlined />}
            onClick={() => { setSelectedInvoiceDetail(record); setDetailModalOpen(true); }}
          >
            Chi tiết & Phiếu thu
          </Button>
          {record.invoiceType === 'Standard' && record.remainingAmount > 0 && (
            <Button
              size="small"
              type="primary"
              icon={<PlusCircleOutlined />}
              disabled={!canRecordPayment}
              onClick={() => handleOpenRecordPayment(record)}
            >
              Thu thêm
            </Button>
          )}
          {record.invoiceType === 'Standard' && (
            <Button
              size="small"
              type="dashed"
              icon={<EditOutlined />}
              disabled={!canCreate}
              onClick={() => handleOpenAdjustmentModal(record)}
            >
              Điều chỉnh
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24, background: '#f5f5f5', minHeight: '100vh' }}>
      <Card style={{ marginBottom: 20 }}>
        <Title level={3} style={{ margin: 0 }}>
          <DollarOutlined /> Thu Ngân & Quản Lý Hóa Đơn / Phiếu Thu
        </Title>
      </Card>

      {(activeTab === '1' ? pending?.error : history?.error) && (
        <Alert
          type="error"
          showIcon
          message={activeTab === '1' ? pending.error : history.error}
          action={<Button onClick={activeTab === '1' ? fetchPending : fetchHistory}>Thử lại</Button>}
          style={{ marginBottom: 16 }}
        />
      )}

      <Tabs
        activeKey={activeTab}
        onChange={(value) => {
          setActiveTab(value);
          if (value === '1') fetchPending();
          else fetchHistory();
        }}
        type="card"
        items={[
          {
            key: '1',
            label: <span><DollarOutlined /> Lập Hóa Đơn & Thu Tiền</span>,
            children: (
              <>
                <Card style={{ marginBottom: 16 }}>
                  <Space wrap>
                    <Text strong>Chọn Phân Hệ / Sổ Thu Tiền:</Text>
                    <Select value={stage} onChange={(val) => setStage(val)} style={{ width: 340 }} size="large">
                      <Option value="Book">1. Sổ Book (Tiền sổ khám bệnh)</Option>
                      <Option value="Pending">2. Sổ Pending (Phí khám ban đầu)</Option>
                      <Option value="LabAndConsultation">3. Sổ LabAndConsultation (Khám + Xét nghiệm)</Option>
                      <Option value="Medicine">4. Sổ Medicine (Đơn thuốc đã chốt)</Option>
                      <Option value="Final">5. Sổ Final (Tổng hợp cuối lượt khám)</Option>
                    </Select>
                    <Button onClick={fetchPending}>Làm mới danh sách</Button>
                  </Space>
                </Card>

                <Row gutter={20}>
                  <Col span={10}>
                    <Card title={`Hàng chờ - ${STAGE_LABELS[stage] || stage}`} loading={loading}>
                      <Table
                        dataSource={pendingList}
                        columns={pendingColumns}
                        rowKey={getRecordRowKey}
                        pagination={{ pageSize: 6 }}
                      />
                    </Card>
                  </Col>

                  <Col span={14}>
                    <Card title="Chi tiết Hóa đơn & Thanh toán">
                      {selectedRecord ? (
                        <Space direction="vertical" style={{ width: '100%' }} size="middle">
                          <div>
                            <Text strong style={{ fontSize: 16 }}>{selectedRecord.patientName}</Text>
                            <Tag color="green" style={{ marginLeft: 12 }}>BN #{selectedRecord.patientId}</Tag>
                            {selectedRecord.appointmentId > 0 && (
                              <Tag color="volcano">Lượt khám #{selectedRecord.appointmentId}</Tag>
                            )}
                          </div>

                          <Table
                            dataSource={selectedRecord.items}
                            columns={[
                              { title: 'Nội dung khoản phí', dataIndex: 'itemName', key: 'itemName' },
                              { title: 'Đơn giá', dataIndex: 'unitPrice', key: 'unitPrice', render: (v) => `${v.toLocaleString()} đ` },
                              { title: 'SL', dataIndex: 'quantity', key: 'quantity' },
                              { title: 'Thành tiền', dataIndex: 'totalPrice', key: 'totalPrice', render: (v) => <strong>{v.toLocaleString()} đ</strong> },
                            ]}
                            rowKey={(item) => `${item.sourceType}-${item.sourceId}`}
                            pagination={false}
                            size="small"
                          />

                          <Divider style={{ margin: '8px 0' }} />

                          <Card size="small" style={{ background: '#e6f7ff', borderColor: '#91d5ff' }}>
                            <Row align="middle" justify="space-between">
                              <Col>
                                <Space>
                                  <SafetyCertificateOutlined style={{ color: '#1890ff', fontSize: 20 }} />
                                  <Text strong>Tỷ lệ BHYT Chi Trả (%):</Text>
                                </Space>
                              </Col>
                              <Col>
                                <Space>
                                  <InputNumber
                                    min={0}
                                    max={100}
                                    value={insuranceDiscountPercent}
                                    onChange={(val) => setInsuranceDiscountPercent(val || 0)}
                                    style={{ width: 90 }}
                                  />
                                  <Button size="small" onClick={() => setInsuranceDiscountPercent(0)}>0%</Button>
                                  <Button size="small" onClick={() => setInsuranceDiscountPercent(80)}>80%</Button>
                                  <Button size="small" onClick={() => setInsuranceDiscountPercent(100)}>100%</Button>
                                </Space>
                              </Col>
                            </Row>
                          </Card>

                          <Row gutter={16}>
                            <Col span={8}><Statistic title="Tổng chi phí gốc" value={rawTotalAmount} suffix="đ" /></Col>
                            <Col span={8}><Statistic title="BHYT chi trả" value={insuranceAmount} suffix="đ" valueStyle={{ color: '#3f8600' }} /></Col>
                            <Col span={8}><Statistic title="Bệnh nhân phải trả" value={finalPatientAmount} suffix="đ" valueStyle={{ color: '#cf1322', fontWeight: 'bold' }} /></Col>
                          </Row>

                          <Card size="small" title="Hình thức ghi nhận thanh toán">
                            <Space direction="vertical" style={{ width: '100%' }}>
                              <Radio.Group value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
                                <Radio value="full">Thu đủ ngay ({finalPatientAmount.toLocaleString()} đ)</Radio>
                                <Radio value="partial">Thu một phần</Radio>
                                <Radio value="unpaid">Chỉ lập hóa đơn (Chưa thu - 0 đ)</Radio>
                              </Radio.Group>

                              {paymentMode === 'partial' && (
                                <Space>
                                  <Text>Số tiền thu lần này:</Text>
                                  <InputNumber
                                    min={1000}
                                    max={finalPatientAmount}
                                    value={customPayAmount}
                                    onChange={(v) => setCustomPayAmount(v || 0)}
                                    style={{ width: 200 }}
                                    formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    parser={(v) => v.replace(/,/g, '')}
                                  />
                                  <Text type="secondary">Còn nợ: {(finalPatientAmount - actualInitialPay).toLocaleString()} đ</Text>
                                </Space>
                              )}

                              {paymentMode !== 'unpaid' && (
                                <Row gutter={12}>
                                  <Col span={8}>
                                    <Select value={paymentMethod} onChange={setPaymentMethod} style={{ width: '100%' }}>
                                      <Option value="Cash">Tiền mặt</Option>
                                      <Option value="Transfer">Chuyển khoản</Option>
                                      <Option value="CreditCard">Thẻ ngân hàng</Option>
                                    </Select>
                                  </Col>
                                  <Col span={8}>
                                    <Input
                                      placeholder="Mã giao dịch / đối chiếu (nếu có)"
                                      value={referenceCode}
                                      onChange={(e) => setReferenceCode(e.target.value)}
                                    />
                                  </Col>
                                  <Col span={8}>
                                    <Input
                                      placeholder="Ghi chú phiếu thu"
                                      value={paymentNote}
                                      onChange={(e) => setPaymentNote(e.target.value)}
                                    />
                                  </Col>
                                </Row>
                              )}
                            </Space>
                          </Card>

                          <Button
                            type="primary"
                            icon={<CreditCardOutlined />}
                            size="large"
                            block
                            loading={submitting}
                            disabled={!canCreate}
                            onClick={handleCreateInvoice}
                            style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                          >
                            {actualInitialPay > 0
                              ? `Lập Hóa Đơn & Thu ${actualInitialPay.toLocaleString()} VNĐ`
                              : 'Lập Hóa Đơn (Chưa Thu Tiền)'}
                          </Button>
                        </Space>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                          <SolutionOutlined style={{ fontSize: 48, marginBottom: 12 }} />
                          <p>Vui lòng chọn một bản ghi từ danh sách bên trái để lập hóa đơn.</p>
                        </div>
                      )}
                    </Card>
                  </Col>
                </Row>
              </>
            ),
          },
          {
            key: '2',
            label: <span><HistoryOutlined /> Tra Cứu Hóa Đơn, Phiếu Thu & Điều Chỉnh</span>,
            children: (
              <Card title="Lịch sử Hóa đơn, Giao dịch Thanh toán & Điều chỉnh">
                <Space style={{ marginBottom: 16 }}>
                  <Input
                    placeholder="Tìm theo Mã HĐ, Số phiếu thu (PT-...), Mã BN, Tên dịch vụ..."
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    onPressEnter={fetchHistory}
                    style={{ width: 380 }}
                  />
                  <Button type="primary" icon={<SearchOutlined />} onClick={fetchHistory}>Tìm kiếm</Button>
                </Space>
                <Table dataSource={historyList} columns={historyColumns} rowKey="id" loading={historyLoading} />
              </Card>
            ),
          },
        ]}
      />

      {/* Modal 1: Chi tiết Hóa đơn, Lịch sử Thanh toán & In Phiếu Thu (VII.7) */}
      <Modal
        title={`Chi tiết Hóa đơn #${selectedInvoiceDetail?.id || ''}`}
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        width={820}
        footer={[
          <Button key="close" onClick={() => setDetailModalOpen(false)}>Đóng</Button>,
          selectedInvoiceDetail && (
            <Button
              key="print-all"
              type="primary"
              icon={<PrinterOutlined />}
              onClick={() => handlePrintReceipt(selectedInvoiceDetail)}
            >
              In Toàn Bộ Biên Lai / Hóa Đơn
            </Button>
          ),
        ]}
      >
        {selectedInvoiceDetail && (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="Bệnh nhân">{selectedInvoiceDetail.patientName} (#{selectedInvoiceDetail.patientId})</Descriptions.Item>
              <Descriptions.Item label="Loại chứng từ">
                <Tag color={selectedInvoiceDetail.invoiceType === 'Adjustment' ? 'purple' : 'blue'}>
                  {selectedInvoiceDetail.invoiceType === 'Adjustment'
                    ? `Điều chỉnh cho HĐ #${selectedInvoiceDetail.originalInvoiceId}`
                    : 'Hóa đơn chuẩn (Standard)'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Bệnh nhân phải trả"><strong>{selectedInvoiceDetail.patientAmount?.toLocaleString()} đ</strong></Descriptions.Item>
              <Descriptions.Item label="Đã thu / Còn lại">
                <Text style={{ color: '#3f8600' }}>{selectedInvoiceDetail.paidAmount?.toLocaleString()} đ</Text>
                {' / '}
                <Text type="danger">{selectedInvoiceDetail.remainingAmount?.toLocaleString()} đ</Text>
              </Descriptions.Item>
            </Descriptions>

            <Title level={5} style={{ margin: '8px 0 0' }}>Danh sách khoản mục</Title>
            <Table
              dataSource={selectedInvoiceDetail.details}
              rowKey="id"
              size="small"
              pagination={false}
              columns={[
                { title: 'Nguồn', dataIndex: 'sourceType', key: 'sourceType' },
                { title: 'Nội dung', dataIndex: 'itemName', key: 'itemName' },
                { title: 'Đơn giá', dataIndex: 'unitPrice', key: 'unitPrice', render: (v) => `${v?.toLocaleString()} đ` },
                { title: 'SL', dataIndex: 'quantity', key: 'quantity' },
                { title: 'Thành tiền', dataIndex: 'totalPrice', key: 'totalPrice', render: (v) => <strong>{v?.toLocaleString()} đ</strong> },
              ]}
            />

            <Title level={5} style={{ margin: '8px 0 0' }}>Lịch sử phiếu thu / hoàn tiền</Title>
            <Table
              dataSource={selectedInvoiceDetail.payments}
              rowKey="id"
              size="small"
              pagination={false}
              columns={[
                { title: 'Số phiếu', dataIndex: 'receiptNumber', key: 'receiptNumber', render: (v) => <Tag color="cyan">{v}</Tag> },
                {
                  title: 'Loại',
                  dataIndex: 'paymentType',
                  key: 'paymentType',
                  render: (t) => <Tag color={t === 'Refund' ? 'purple' : 'green'}>{t === 'Refund' ? 'Phiếu hoàn' : 'Phiếu thu'}</Tag>,
                },
                { title: 'Số tiền', dataIndex: 'amount', key: 'amount', render: (v) => <strong>{v?.toLocaleString()} đ</strong> },
                { title: 'Phương thức', dataIndex: 'paymentMethod', key: 'paymentMethod' },
                { title: 'Mã đối chiếu', dataIndex: 'referenceCode', key: 'referenceCode', render: (v) => v || '---' },
                { title: 'Thời gian', dataIndex: 'paidAt', key: 'paidAt', render: (d) => new Date(d).toLocaleString('vi-VN') },
                {
                  title: 'In phiếu',
                  key: 'print',
                  render: (_, p) => (
                    <Button size="small" icon={<PrinterOutlined />} onClick={() => handlePrintReceipt(selectedInvoiceDetail, p)}>
                      In phiếu
                    </Button>
                  ),
                },
              ]}
            />
          </Space>
        )}
      </Modal>

      {/* Modal 2: Ghi nhận thanh toán bổ sung (VII.6) */}
      <Modal
        title={`Ghi nhận thanh toán - Hóa đơn #${selectedInvoiceForPay?.id || ''}`}
        open={payModalOpen}
        onCancel={() => setPayModalOpen(false)}
        onOk={() => payForm.submit()}
        okText="Xác nhận thu tiền"
        cancelText="Hủy"
      >
        <Form form={payForm} layout="vertical" onFinish={handleSubmitRecordPayment}>
          <Form.Item
            name="amount"
            label={`Số tiền thu (Tối đa: ${selectedInvoiceForPay?.remainingAmount?.toLocaleString() || 0} đ)`}
            rules={[{ required: true, message: 'Vui lòng nhập số tiền thu!' }]}
          >
            <InputNumber
              min={1}
              max={selectedInvoiceForPay?.remainingAmount || 0}
              style={{ width: '100%' }}
              formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(v) => v.replace(/,/g, '')}
            />
          </Form.Item>
          <Form.Item name="paymentMethod" label="Phương thức thanh toán" initialValue="Cash">
            <Select>
              <Option value="Cash">Tiền mặt</Option>
              <Option value="Transfer">Chuyển khoản</Option>
              <Option value="CreditCard">Thẻ ngân hàng</Option>
            </Select>
          </Form.Item>
          <Form.Item name="referenceCode" label="Mã giao dịch / chứng từ đối chiếu">
            <Input placeholder="VD: FT2632199812..." />
          </Form.Item>
          <Form.Item name="note" label="Ghi chú phiếu thu">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal 3: Lập chứng từ điều chỉnh & Đối soát đơn thuốc (VII.8) */}
      <Modal
        title={`Lập chứng từ điều chỉnh cho Hóa đơn gốc #${selectedInvoiceForAdjust?.id || ''}`}
        open={adjustmentModalOpen}
        onCancel={() => setAdjustmentModalOpen(false)}
        onOk={() => adjForm.submit()}
        okText="Tạo chứng từ điều chỉnh"
        cancelText="Hủy"
      >
        <Form form={adjForm} layout="vertical" onFinish={handleCreateAdjustment}>
          <Form.Item name="reason" label="Lý do điều chỉnh / hoàn tiền" rules={[{ required: true, message: 'Vui lòng nhập lý do!' }]}>
            <Input.TextArea rows={3} placeholder="Ví dụ: Hoàn tiền thuốc thiếu kho theo yêu cầu rà soát của Dược, hoặc thu thêm chênh lệch..." />
          </Form.Item>
          <Form.Item name="adjustmentAmount" label="Số tiền điều chỉnh (VNĐ)" rules={[{ required: true, message: 'Vui lòng nhập số tiền!' }]}>
            <InputNumber
              style={{ width: '100%' }}
              placeholder="Số âm (VD: -50000) nếu hoàn tiền, số dương (VD: 50000) nếu thu thêm"
            />
          </Form.Item>
          <Form.Item name="prescriptionStockReviewId" label="Mã phiếu rà soát tồn kho thuốc (nếu điều chỉnh đơn AwaitingBilling)">
            <InputNumber style={{ width: '100%' }} placeholder="Để trống nếu hệ thống tự tìm theo lượt khám" />
          </Form.Item>
          <Form.Item name="paymentMethod" label="Phương thức hoàn / thu tiền" initialValue="Cash">
            <Select>
              <Option value="Cash">Tiền mặt</Option>
              <Option value="Transfer">Chuyển khoản</Option>
              <Option value="CreditCard">Thẻ ngân hàng</Option>
            </Select>
          </Form.Item>
          <Form.Item name="referenceCode" label="Mã giao dịch / chứng từ đối chiếu">
            <Input placeholder="Mã ủy nhiệm chi / giao dịch hoàn tiền (nếu có)" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}