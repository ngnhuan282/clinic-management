import { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Card, 
  Select, 
  Tag, 
  Space, 
  Typography, 
  message, 
  Row, 
  Col, 
  Divider,
  Statistic
} from 'antd';
import { DollarOutlined, CreditCardOutlined, SolutionOutlined } from '@ant-design/icons';
import invoiceApi from '../../api/invoiceApi';

const { Title, Text } = Typography;
const { Option } = Select;

export default function CashierBillingPage() {
  const [messageApi, contextHolder] = message.useMessage();
  const [stage, setStage] = useState('Pending');
  const [pendingResult, setPendingResult] = useState(null);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const loading = pendingResult?.stage !== stage || pendingResult?.refreshVersion !== refreshVersion;
  const pendingList = loading ? [] : pendingResult.items;

  // Lấy danh sách chờ thu tiền theo BillingStage
  useEffect(() => {
    let active = true;
    invoiceApi.getPendingBillings(stage)
      .then((res) => {
        if (active) setPendingResult({ stage, refreshVersion, items: res.data });
      })
      .catch(() => {
        if (active) {
          setPendingResult({ stage, refreshVersion, items: [] });
          messageApi.error('Lỗi khi tải danh sách chờ thu tiền!');
        }
      });
    return () => { active = false; };
  }, [stage, refreshVersion, messageApi]);

  // Xử lý tạo Hóa đơn & Thu tiền
  const handleCreateInvoice = async () => {
    if (!selectedRecord) return;

    setSubmitting(true);
    try {
      const dto = {
        appointmentId: selectedRecord.appointmentId,
        patientId: selectedRecord.patientId,
        billingStage: stage,
        paymentMethod: paymentMethod,
        items: selectedRecord.items.map((item) => ({
          sourceType: item.sourceType,
          sourceId: item.sourceId,
          itemName: item.itemName,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
        })),
      };

      await invoiceApi.createInvoice(dto);
      messageApi.success('Lập hóa đơn & thu tiền thành công!');
      setSelectedRecord(null);
      setRefreshVersion((version) => version + 1);
    } catch (err) {
      messageApi.error(err.response?.data?.message || 'Lỗi khi lập hóa đơn!');
    } finally {
      setSubmitting(false);
    }
  };

  // Cấu hình cột cho Bảng danh sách chờ thu
  const pendingColumns = [
    {
      title: 'Mã Lịch Hẹn',
      dataIndex: 'appointmentId',
      key: 'appointmentId',
      render: (id) => <Tag color="blue">#{id}</Tag>,
    },
    {
      title: 'Mã Bệnh Nhân',
      dataIndex: 'patientId',
      key: 'patientId',
    },
    {
      title: 'Số khoản thu',
      key: 'itemCount',
      render: (_, record) => record.items?.length || 0,
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Button 
          type={selectedRecord?.appointmentId === record.appointmentId ? 'primary' : 'default'}
          onClick={() => setSelectedRecord(record)}
        >
          Chọn thu tiền
        </Button>
      ),
    },
  ];

  // Cấu hình cột cho Bảng chi tiết hóa đơn
  const detailColumns = [
    {
      title: 'Nội dung khoản phí',
      dataIndex: 'itemName',
      key: 'itemName',
    },
    {
      title: 'Đơn giá',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      render: (val) => `${val.toLocaleString()} đ`,
    },
    {
      title: 'SL',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: 'Thành tiền',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      render: (val) => <strong>{val.toLocaleString()} đ</strong>,
    },
  ];

  const totalAmount = selectedRecord?.items?.reduce((sum, item) => sum + item.totalPrice, 0) || 0;

  return (
    <div style={{ padding: 24, background: '#f5f5f5', minHeight: '100vh' }}>
      {contextHolder}
      <Card style={{ marginBottom: 20 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={3} style={{ margin: 0 }}>
              <DollarOutlined /> Thu Ngân: Quản Lý Hóa Đơn & Thanh Toán
            </Title>
          </Col>
          <Col>
            <Space>
              <Text strong>Chọn Sổ thu tiền (Billing Stage):</Text>
              <Select 
                value={stage} 
                onChange={(val) => { setStage(val); setSelectedRecord(null); }}
                disabled={submitting}
                style={{ width: 280 }}
                size="large"
              >
                <Option value="Pending">1. Sổ Pending (Phí khám ban đầu)</Option>
                <Option value="LabAndConsultation">2. Sổ LabAndConsultation (Xét nghiệm)</Option>
              </Select>
            </Space>
          </Col>
        </Row>
      </Card>

      <Row gutter={20}>
        {/* Cột trái: Danh sách hàng chờ */}
        <Col span={11}>
          <Card title={`Danh sách chờ thu tiền - Sổ ${stage}`} loading={loading}>
            <Table 
              dataSource={pendingList} 
              columns={pendingColumns} 
              rowKey="appointmentId"
              pagination={{ pageSize: 6 }}
            />
          </Card>
        </Col>

        {/* Cột phải: Chi tiết thanh toán */}
        <Col span={13}>
          <Card title="Chi tiết Hóa đơn Thanh toán">
            {selectedRecord ? (
              <>
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  <div>
                    <Text type="secondary">Mã Lịch hẹn:</Text> <Tag color="volcano">#{selectedRecord.appointmentId}</Tag>
                    <Text type="secondary" style={{ marginLeft: 16 }}>Mã Bệnh nhân:</Text> <Tag color="green">#{selectedRecord.patientId}</Tag>
                  </div>

                  <Table 
                    dataSource={selectedRecord.items} 
                    columns={detailColumns} 
                    rowKey="sourceId" 
                    pagination={false}
                    size="small"
                  />

                  <Divider style={{ margin: '12px 0' }} />

                  <Row justify="space-between" align="middle">
                    <Col>
                      <Statistic title="Tổng tiền thanh toán" value={totalAmount} precision={0} suffix="VNĐ" />
                    </Col>
                    <Col>
                      <Space direction="vertical">
                        <Text strong>Phương thức thanh toán:</Text>
                        <Select 
                          value={paymentMethod} 
                          onChange={(val) => setPaymentMethod(val)} 
                          style={{ width: 180 }}
                        >
                          <Option value="Cash">Tiền mặt</Option>
                          <Option value="Transfer">Chuyển khoản</Option>
                          <Option value="CreditCard">Thẻ ngân hàng</Option>
                        </Select>
                      </Space>
                    </Col>
                  </Row>

                  <Button 
                    type="primary" 
                    icon={<CreditCardOutlined />} 
                    size="large" 
                    block 
                    loading={submitting}
                    onClick={handleCreateInvoice}
                    style={{ marginTop: 16, backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                  >
                    Xác Nhận Thu Tiền & Xuất Hóa Đơn
                  </Button>
                </Space>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                <SolutionOutlined style={{ fontSize: 48, marginBottom: 12 }} />
                <p>Vui lòng chọn một bản ghi từ danh sách bên trái để xem chi tiết và lập hóa đơn.</p>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
