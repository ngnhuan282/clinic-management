// import { useState, useEffect } from 'react';
// import { 
//   Table, 
//   Button, 
//   Card, 
//   Select, 
//   Tag, 
//   Space, 
//   Typography, 
//   message, 
//   Row, 
//   Col, 
//   Divider,
//   Statistic
// } from 'antd';
// import { DollarOutlined, CreditCardOutlined, SolutionOutlined } from '@ant-design/icons';
// import invoiceApi from '../../api/invoiceApi';

// const { Title, Text } = Typography;
// const { Option } = Select;

// export default function CashierBillingPage() {
//   const [messageApi, contextHolder] = message.useMessage();
//   const [stage, setStage] = useState('Pending');
//   const [pendingResult, setPendingResult] = useState(null);
//   const [refreshVersion, setRefreshVersion] = useState(0);
//   const [submitting, setSubmitting] = useState(false);
//   const [selectedRecord, setSelectedRecord] = useState(null);
//   const [paymentMethod, setPaymentMethod] = useState('Cash');
//   const loading = pendingResult?.stage !== stage || pendingResult?.refreshVersion !== refreshVersion;
//   const pendingList = loading ? [] : pendingResult.items;

//   // Lấy danh sách chờ thu tiền theo BillingStage
//   useEffect(() => {
//     let active = true;
//     invoiceApi.getPendingBillings(stage)
//       .then((res) => {
//         if (active) setPendingResult({ stage, refreshVersion, items: res.data });
//       })
//       .catch(() => {
//         if (active) {
//           setPendingResult({ stage, refreshVersion, items: [] });
//           messageApi.error('Lỗi khi tải danh sách chờ thu tiền!');
//         }
//       });
//     return () => { active = false; };
//   }, [stage, refreshVersion, messageApi]);

//   // Xử lý tạo Hóa đơn & Thu tiền
//   const handleCreateInvoice = async () => {
//     if (!selectedRecord) return;

//     setSubmitting(true);
//     try {
//       const dto = {
//         appointmentId: selectedRecord.appointmentId,
//         patientId: selectedRecord.patientId,
//         billingStage: stage,
//         paymentMethod: paymentMethod,
//         items: selectedRecord.items.map((item) => ({
//           sourceType: item.sourceType,
//           sourceId: item.sourceId,
//           itemName: item.itemName,
//           unitPrice: item.unitPrice,
//           quantity: item.quantity,
//         })),
//       };

//       await invoiceApi.createInvoice(dto);
//       messageApi.success('Lập hóa đơn & thu tiền thành công!');
//       setSelectedRecord(null);
//       setRefreshVersion((version) => version + 1);
//     } catch (err) {
//       messageApi.error(err.response?.data?.message || 'Lỗi khi lập hóa đơn!');
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   // Cấu hình cột cho Bảng danh sách chờ thu
//   const pendingColumns = [
//     {
//       title: 'Mã Lịch Hẹn',
//       dataIndex: 'appointmentId',
//       key: 'appointmentId',
//       render: (id) => <Tag color="blue">#{id}</Tag>,
//     },
//     {
//       title: 'Mã Bệnh Nhân',
//       dataIndex: 'patientId',
//       key: 'patientId',
//     },
//     {
//       title: 'Số khoản thu',
//       key: 'itemCount',
//       render: (_, record) => record.items?.length || 0,
//     },
//     {
//       title: 'Hành động',
//       key: 'action',
//       render: (_, record) => (
//         <Button 
//           type={selectedRecord?.appointmentId === record.appointmentId ? 'primary' : 'default'}
//           onClick={() => setSelectedRecord(record)}
//         >
//           Chọn thu tiền
//         </Button>
//       ),
//     },
//   ];

//   // Cấu hình cột cho Bảng chi tiết hóa đơn
//   const detailColumns = [
//     {
//       title: 'Nội dung khoản phí',
//       dataIndex: 'itemName',
//       key: 'itemName',
//     },
//     {
//       title: 'Đơn giá',
//       dataIndex: 'unitPrice',
//       key: 'unitPrice',
//       render: (val) => `${val.toLocaleString()} đ`,
//     },
//     {
//       title: 'SL',
//       dataIndex: 'quantity',
//       key: 'quantity',
//     },
//     {
//       title: 'Thành tiền',
//       dataIndex: 'totalPrice',
//       key: 'totalPrice',
//       render: (val) => <strong>{val.toLocaleString()} đ</strong>,
//     },
//   ];

//   const totalAmount = selectedRecord?.items?.reduce((sum, item) => sum + item.totalPrice, 0) || 0;

//   return (
//     <div style={{ padding: 24, background: '#f5f5f5', minHeight: '100vh' }}>
//       {contextHolder}
//       <Card style={{ marginBottom: 20 }}>
//         <Row justify="space-between" align="middle">
//           <Col>
//             <Title level={3} style={{ margin: 0 }}>
//               <DollarOutlined /> Thu Ngân: Quản Lý Hóa Đơn & Thanh Toán
//             </Title>
//           </Col>
//           <Col>
//             <Space>
//               <Text strong>Chọn Sổ thu tiền (Billing Stage):</Text>
//               <Select 
//                 value={stage} 
//                 onChange={(val) => { setStage(val); setSelectedRecord(null); }}
//                 disabled={submitting}
//                 style={{ width: 280 }}
//                 size="large"
//               >
//                 <Option value="Pending">1. Sổ Pending (Phí khám ban đầu)</Option>
//                 <Option value="LabAndConsultation">2. Sổ LabAndConsultation (Xét nghiệm)</Option>
//               </Select>
//             </Space>
//           </Col>
//         </Row>
//       </Card>

//       <Row gutter={20}>
//         {/* Cột trái: Danh sách hàng chờ */}
//         <Col span={11}>
//           <Card title={`Danh sách chờ thu tiền - Sổ ${stage}`} loading={loading}>
//             <Table 
//               dataSource={pendingList} 
//               columns={pendingColumns} 
//               rowKey="appointmentId"
//               pagination={{ pageSize: 6 }}
//             />
//           </Card>
//         </Col>

//         {/* Cột phải: Chi tiết thanh toán */}
//         <Col span={13}>
//           <Card title="Chi tiết Hóa đơn Thanh toán">
//             {selectedRecord ? (
//               <>
//                 <Space direction="vertical" style={{ width: '100%' }} size="middle">
//                   <div>
//                     <Text type="secondary">Mã Lịch hẹn:</Text> <Tag color="volcano">#{selectedRecord.appointmentId}</Tag>
//                     <Text type="secondary" style={{ marginLeft: 16 }}>Mã Bệnh nhân:</Text> <Tag color="green">#{selectedRecord.patientId}</Tag>
//                   </div>

//                   <Table 
//                     dataSource={selectedRecord.items} 
//                     columns={detailColumns} 
//                     rowKey="sourceId" 
//                     pagination={false}
//                     size="small"
//                   />

//                   <Divider style={{ margin: '12px 0' }} />

//                   <Row justify="space-between" align="middle">
//                     <Col>
//                       <Statistic title="Tổng tiền thanh toán" value={totalAmount} precision={0} suffix="VNĐ" />
//                     </Col>
//                     <Col>
//                       <Space direction="vertical">
//                         <Text strong>Phương thức thanh toán:</Text>
//                         <Select 
//                           value={paymentMethod} 
//                           onChange={(val) => setPaymentMethod(val)} 
//                           style={{ width: 180 }}
//                         >
//                           <Option value="Cash">Tiền mặt</Option>
//                           <Option value="Transfer">Chuyển khoản</Option>
//                           <Option value="CreditCard">Thẻ ngân hàng</Option>
//                         </Select>
//                       </Space>
//                     </Col>
//                   </Row>

//                   <Button 
//                     type="primary" 
//                     icon={<CreditCardOutlined />} 
//                     size="large" 
//                     block 
//                     loading={submitting}
//                     onClick={handleCreateInvoice}
//                     style={{ marginTop: 16, backgroundColor: '#52c41a', borderColor: '#52c41a' }}
//                   >
//                     Xác Nhận Thu Tiền & Xuất Hóa Đơn
//                   </Button>
//                 </Space>
//               </>
//             ) : (
//               <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
//                 <SolutionOutlined style={{ fontSize: 48, marginBottom: 12 }} />
//                 <p>Vui lòng chọn một bản ghi từ danh sách bên trái để xem chi tiết và lập hóa đơn.</p>
//               </div>
//             )}
//           </Card>
//         </Col>
//       </Row>
//     </div>
//   );
// }

import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Card, Select, Tag, Space, Typography, 
  message, Row, Col, Divider, Statistic, InputNumber, Tabs, Modal, Form, Input 
} from 'antd';
import { 
  DollarOutlined, CreditCardOutlined, SolutionOutlined, 
  SafetyCertificateOutlined, HistoryOutlined, EditOutlined, SearchOutlined 
} from '@ant-design/icons';
import invoiceApi from '../../api/invoiceApi';

const { Title, Text } = Typography;
const { Option } = Select;

export default function CashierBillingPage() {
  const [activeTab, setActiveTab] = useState('1'); // Tab 1: Thu tiền, Tab 2: Lịch sử & Điều chỉnh
  
  // States cho Tab 1
  const [stage, setStage] = useState('Pending');
  const [pendingList, setPendingList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [insuranceDiscountPercent, setInsuranceDiscountPercent] = useState(0);

  // States cho Tab 2 (Lịch sử & Điều chỉnh)
  const [historyList, setHistoryList] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false);
  const [selectedInvoiceForAdjust, setSelectedInvoiceForAdjust] = useState(null);
  const [adjForm] = Form.useForm();

  useEffect(() => {
    setInsuranceDiscountPercent(0);
  }, [selectedRecord]);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await invoiceApi.getPendingBillings(stage);
      setPendingList(res.data);
      setSelectedRecord(null);
    } catch {
      message.error('Lỗi khi tải danh sách chờ thu tiền!');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await invoiceApi.getInvoiceHistory(searchKeyword);
      setHistoryList(res.data);
    } catch {
      message.error('Lỗi khi tải lịch sử hóa đơn!');
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === '1') fetchPending();
    if (activeTab === '2') fetchHistory();
  }, [stage, activeTab]);

  // Tài chính Tab 1
  const rawTotalAmount = selectedRecord?.items?.reduce((sum, item) => sum + item.totalPrice, 0) || 0;
  const insuranceAmount = Math.round((rawTotalAmount * (insuranceDiscountPercent || 0)) / 100);
  const finalPatientAmount = rawTotalAmount - insuranceAmount;

  const handleCreateInvoice = async () => {
    if (!selectedRecord) return;
    setSubmitting(true);
    try {
      const dto = {
        appointmentId: selectedRecord.appointmentId,
        patientId: selectedRecord.patientId,
        billingStage: stage,
        paymentMethod: paymentMethod,
        insuranceDiscountPercent: insuranceDiscountPercent || 0,
        insuranceAmount: insuranceAmount,
        totalAmount: rawTotalAmount,
        patientAmount: finalPatientAmount,
        items: selectedRecord.items.map((item) => ({
          sourceType: item.sourceType,
          sourceId: item.sourceId,
          itemName: item.itemName,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
        })),
      };
      await invoiceApi.createInvoice(dto);
      message.success('Lập hóa đơn & thu tiền thành công!');
      fetchPending();
    } catch (err) {
      message.error(err.response?.data?.message || 'Lỗi khi lập hóa đơn!');
    } finally {
      setSubmitting(false);
    }
  };

  // Mở modal điều chỉnh
  const handleOpenAdjustmentModal = (record) => {
    setSelectedInvoiceForAdjust(record);
    adjForm.setFieldsValue({
      reason: '',
      adjustmentAmount: 0,
      paymentMethod: 'Cash'
    });
    setAdjustmentModalOpen(true);
  };

  // Lập chứng từ điều chỉnh
  const handleCreateAdjustment = async (values) => {
    if (!selectedInvoiceForAdjust) return;
    try {
      const dto = {
        originalInvoiceId: selectedInvoiceForAdjust.id,
        reason: values.reason,
        paymentMethod: values.paymentMethod,
        adjustmentTotalAmount: values.adjustmentAmount,
        adjustmentInsuranceAmount: 0,
        adjustmentPatientAmount: values.adjustmentAmount,
        items: [
          {
            sourceType: 'Adjustment',
            sourceId: selectedInvoiceForAdjust.id,
            itemName: `Điều chỉnh cho Hóa đơn #${selectedInvoiceForAdjust.id}`,
            unitPrice: values.adjustmentAmount,
            quantity: 1
          }
        ]
      };

      await invoiceApi.createAdjustment(dto);
      message.success('Tạo chứng từ điều chỉnh thành công! Dữ liệu hóa đơn gốc vẫn giữ nguyên.');
      setAdjustmentModalOpen(false);
      fetchHistory();
    } catch (err) {
      message.error(err.response?.data?.message || 'Lỗi khi lập chứng từ điều chỉnh!');
    }
  };

  const pendingColumns = [
    { title: 'Mã Lịch Hẹn', dataIndex: 'appointmentId', key: 'appointmentId', render: (id) => <Tag color="blue">#{id}</Tag> },
    { title: 'Mã Bệnh Nhân', dataIndex: 'patientId', key: 'patientId' },
    { title: 'Số khoản thu', key: 'itemCount', render: (_, record) => record.items?.length || 0 },
    {
      title: 'Hành động', key: 'action',
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

  const historyColumns = [
    { title: 'Mã Hóa Đơn', dataIndex: 'id', key: 'id', render: (id) => <Tag color="volcano">#{id}</Tag> },
    { title: 'Mã Bệnh Nhân', dataIndex: 'patientId', key: 'patientId' },
    { title: 'Sổ thu tiền', dataIndex: 'billingStage', key: 'billingStage' },
    { title: 'Tổng tiền', dataIndex: 'totalAmount', key: 'totalAmount', render: (v) => <strong>{v?.toLocaleString()} đ</strong> },
    { title: 'Phương thức', dataIndex: 'paymentMethod', key: 'paymentMethod' },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status', render: (s) => <Tag color="green">{s}</Tag> },
    { title: 'Ngày tạo', dataIndex: 'createdAt', key: 'createdAt', render: (d) => new Date(d).toLocaleString('vi-VN') },
    {
      title: 'Thao tác', key: 'action',
      render: (_, record) => (
        <Button 
          type="dashed" 
          icon={<EditOutlined />} 
          onClick={() => handleOpenAdjustmentModal(record)}
        >
          Lập chứng từ điều chỉnh
        </Button>
      )
    }
  ];

  return (
    <div style={{ padding: 24, background: '#f5f5f5', minHeight: '100vh' }}>
      <Card style={{ marginBottom: 20 }}>
        <Title level={3} style={{ margin: 0 }}>
          <DollarOutlined /> Thu Ngân & Nhóm Nghiệp Vụ Tài Chính
        </Title>
      </Card>

      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        type="card"
        items={[
          {
            key: '1',
            label: <span><DollarOutlined /> Thu Tiền Hàng Chờ</span>,
            children: (
              <>
                <Card style={{ marginBottom: 16 }}>
                  <Space>
                    <Text strong>Chọn Sổ thu tiền (Billing Stage):</Text>
                    <Select value={stage} onChange={(val) => setStage(val)} style={{ width: 280 }} size="large">
                      <Option value="Pending">1. Sổ Pending (Phí khám ban đầu)</Option>
                      <Option value="LabAndConsultation">2. Sổ LabAndConsultation (Xét nghiệm)</Option>
                    </Select>
                  </Space>
                </Card>

                <Row gutter={20}>
                  <Col span={10}>
                    <Card title={`Danh sách chờ thu tiền - Sổ ${stage}`} loading={loading}>
                      <Table dataSource={pendingList} columns={pendingColumns} rowKey="appointmentId" pagination={{ pageSize: 6 }} />
                    </Card>
                  </Col>
                  <Col span={14}>
                    <Card title="Chi tiết Hóa đơn Thanh toán">
                      {selectedRecord ? (
                        <Space direction="vertical" style={{ width: '100%' }} size="middle">
                          <div>
                            <Text type="secondary">Mã Lịch hẹn: </Text><Tag color="volcano">#{selectedRecord.appointmentId}</Tag>
                            <Text type="secondary" style={{ marginLeft: 16 }}>Mã Bệnh nhân: </Text><Tag color="green">#{selectedRecord.patientId}</Tag>
                          </div>
                          <Table 
                            dataSource={selectedRecord.items} 
                            columns={[
                              { title: 'Nội dung khoản phí', dataIndex: 'itemName', key: 'itemName' },
                              { title: 'Đơn giá', dataIndex: 'unitPrice', key: 'unitPrice', render: (v) => `${v.toLocaleString()} đ` },
                              { title: 'SL', dataIndex: 'quantity', key: 'quantity' },
                              { title: 'Thành tiền', dataIndex: 'totalPrice', key: 'totalPrice', render: (v) => <strong>{v.toLocaleString()} đ</strong> }
                            ]} 
                            rowKey="sourceId" 
                            pagination={false} 
                            size="small" 
                          />
                          <Divider style={{ margin: '12px 0' }} />
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
                                  <InputNumber min={0} max={100} value={insuranceDiscountPercent} onChange={(val) => setInsuranceDiscountPercent(val || 0)} formatter={(v) => `${v}%`} parser={(v) => v.replace('%', '')} style={{ width: 100 }} />
                                  <Button size="small" onClick={() => setInsuranceDiscountPercent(0)}>0%</Button>
                                  <Button size="small" onClick={() => setInsuranceDiscountPercent(80)}>80%</Button>
                                  <Button size="small" onClick={() => setInsuranceDiscountPercent(100)}>100%</Button>
                                </Space>
                              </Col>
                            </Row>
                          </Card>
                          <Row gutter={16}>
                            <Col span={8}><Statistic title="Tổng chi phí gốc" value={rawTotalAmount} precision={0} suffix="đ" /></Col>
                            <Col span={8}><Statistic title="BHYT chi trả" value={insuranceAmount} precision={0} suffix="đ" valueStyle={{ color: '#3f8600' }} /></Col>
                            <Col span={8}><Statistic title="Bệnh nhân thực trả" value={finalPatientAmount} precision={0} suffix="đ" valueStyle={{ color: '#cf1322', fontWeight: 'bold' }} /></Col>
                          </Row>
                          <Row justify="space-between" align="middle" style={{ marginTop: 8 }}>
                            <Col>
                              <Space direction="vertical">
                                <Text strong>Phương thức thanh toán:</Text>
                                <Select value={paymentMethod} onChange={setPaymentMethod} style={{ width: 180 }}>
                                  <Option value="Cash">Tiền mặt</Option>
                                  <Option value="Transfer">Chuyển khoản</Option>
                                  <Option value="CreditCard">Thẻ ngân hàng</Option>
                                </Select>
                              </Space>
                            </Col>
                          </Row>
                          <Button type="primary" icon={<CreditCardOutlined />} size="large" block loading={submitting} onClick={handleCreateInvoice} style={{ marginTop: 16, backgroundColor: '#52c41a', borderColor: '#52c41a' }}>
                            Xác Nhận Thu Tiền ({finalPatientAmount.toLocaleString()} VNĐ)
                          </Button>
                        </Space>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                          <SolutionOutlined style={{ fontSize: 48, marginBottom: 12 }} />
                          <p>Vui lòng chọn một bản ghi từ danh sách bên trái để xem chi tiết và lập hóa đơn.</p>
                        </div>
                      )}
                    </Card>
                  </Col>
                </Row>
              </>
            )
          },
          {
            key: '2',
            label: <span><HistoryOutlined /> Lịch Sử & Điều Chỉnh Hóa Đơn</span>,
            children: (
              <Card title="Tra cứu Lịch sử Hóa đơn & Lập chứng từ điều chỉnh">
                <Space style={{ marginBottom: 16 }}>
                  <Input 
                    placeholder="Nhập Mã hóa đơn / Mã bệnh nhân" 
                    value={searchKeyword} 
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    style={{ width: 300 }} 
                  />
                  <Button type="primary" icon={<SearchOutlined />} onClick={fetchHistory}>Tìm kiếm</Button>
                </Space>
                <Table 
                  dataSource={historyList} 
                  columns={historyColumns} 
                  rowKey="id" 
                  loading={historyLoading}
                />
              </Card>
            )
          }
        ]}
      />

      {/* Modal Lập chứng từ điều chỉnh */}
      <Modal
        title={`Lập chứng từ điều chỉnh cho Hóa đơn gốc #${selectedInvoiceForAdjust?.id}`}
        open={adjustmentModalOpen}
        onCancel={() => setAdjustmentModalOpen(false)}
        onOk={() => adjForm.submit()}
        okText="Tạo chứng từ"
        cancelText="Hủy"
      >
        <Form form={adjForm} layout="vertical" onFinish={handleCreateAdjustment}>
          <Form.Item name="reason" label="Lý do điều chỉnh / hoàn tiền" rules={[{ required: true, message: 'Vui lòng nhập lý do!' }]}>
            <Input.TextArea rows={3} placeholder="Ví dụ: Hoàn tiền dịch vụ do bệnh nhân hủy xét nghiệm, hoặc thu thêm chênh lệch..." />
          </Form.Item>

          <Form.Item name="adjustmentAmount" label="Số tiền điều chỉnh (VNĐ)" rules={[{ required: true, message: 'Vui lòng nhập số tiền!' }]}>
            <InputNumber 
              style={{ width: '100%' }} 
              placeholder="Nhập số âm (VD: -50000) nếu hoàn tiền, số dương (VD: 50000) nếu thu thêm" 
            />
          </Form.Item>

          <Form.Item name="paymentMethod" label="Phương thức hoàn/thu tiền" initialValue="Cash">
            <Select>
              <Option value="Cash">Tiền mặt</Option>
              <Option value="Transfer">Chuyển khoản</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
