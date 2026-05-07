import { useState, useEffect } from 'react';
import {
    Table, Button, Modal, Form, Input, Select, Space, Tag,
    Popconfirm, Card, Row, Col, Descriptions, message,
} from 'antd';
import {
    PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined,
    EyeOutlined, PhoneOutlined, MailOutlined, EnvironmentOutlined,
} from '@ant-design/icons';
import axiosClient from '../../api/axiosClient';

const { Option } = Select;

const SupplierList = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [editingSupplier, setEditingSupplier] = useState(null);
    const [searchText, setSearchText] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
    const [form] = Form.useForm();

    const fetchSuppliers = async (page = 1) => {
        setLoading(true);
        try {
            const params = { page, limit: pagination.pageSize };
            if (searchText) params.search = searchText;
            if (filterStatus) params.status = filterStatus;
            const res = await axiosClient.get('/suppliers', { params });
            setSuppliers(res.metadata.suppliers);
            setPagination((prev) => ({ ...prev, current: page, total: res.metadata.total }));
        } catch (error) {
            message.error('Lỗi khi tải nhà cung cấp');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSuppliers(1);
    }, [searchText, filterStatus]);

    const handleSubmit = async (values) => {
        try {
            if (editingSupplier) {
                await axiosClient.put(`/suppliers/${editingSupplier._id}`, values);
                message.success('Cập nhật nhà cung cấp thành công');
            } else {
                await axiosClient.post('/suppliers', values);
                message.success('Tạo nhà cung cấp thành công');
            }
            setModalOpen(false);
            form.resetFields();
            setEditingSupplier(null);
            fetchSuppliers(pagination.current);
        } catch (error) {
            message.error(error.response?.data?.message || 'Thao tác thất bại');
        }
    };

    const handleEdit = (record) => {
        setEditingSupplier(record);
        form.setFieldsValue(record);
        setModalOpen(true);
    };

    const handleDelete = async (id) => {
        try {
            await axiosClient.delete(`/suppliers/${id}`);
            message.success('Xóa nhà cung cấp thành công');
            fetchSuppliers(pagination.current);
        } catch (error) {
            message.error(error.response?.data?.message || 'Xóa thất bại');
        }
    };

    const handleAdd = () => {
        setEditingSupplier(null);
        form.resetFields();
        setModalOpen(true);
    };

    const handleView = (record) => {
        setSelectedSupplier(record);
        setDetailOpen(true);
    };

    const columns = [
        {
            title: 'Mã NCC',
            dataIndex: 'code',
            key: 'code',
            width: 110,
            render: (code) => <span className="font-semibold" style={{ color: '#4F46E5' }}>{code}</span>,
        },
        {
            title: 'Tên nhà cung cấp',
            dataIndex: 'name',
            key: 'name',
            sorter: (a, b) => a.name.localeCompare(b.name),
        },
        {
            title: 'Người liên hệ',
            dataIndex: 'contactPerson',
            key: 'contactPerson',
            responsive: ['md'],
        },
        {
            title: 'Số điện thoại',
            dataIndex: 'phone',
            key: 'phone',
            width: 140,
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            responsive: ['lg'],
            ellipsis: true,
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            width: 130,
            align: 'center',
            render: (status) => (
                <Tag color={status === 'active' ? 'green' : 'red'}>
                    {status === 'active' ? 'Đang hợp tác' : 'Ngừng hợp tác'}
                </Tag>
            ),
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 140,
            align: 'center',
            render: (_, record) => (
                <Space>
                    <Button type="text" icon={<EyeOutlined />} onClick={() => handleView(record)} style={{ color: '#06B6D4' }} />
                    <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} style={{ color: '#4F46E5' }} />
                    <Popconfirm
                        title="Xóa nhà cung cấp"
                        description="Bạn có chắc muốn xóa nhà cung cấp này?"
                        onConfirm={() => handleDelete(record._id)}
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                    >
                        <Button type="text" icon={<DeleteOutlined />} danger />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <div className="page-header">
                <h2>Quản lý nhà cung cấp</h2>
                <p>Quản lý thông tin nhà cung cấp hàng hóa</p>
            </div>

            <Card>
                <div className="flex justify-between items-center" style={{ marginBottom: 16 }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#1E293B' }}>
                        Danh sách nhà cung cấp
                    </h3>
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                        Thêm NCC
                    </Button>
                </div>
                <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
                    <Col xs={24} sm={12} md={8}>
                        <Input
                            placeholder="Tìm kiếm NCC..."
                            prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            allowClear
                        />
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Select
                            placeholder="Trạng thái"
                            value={filterStatus || undefined}
                            onChange={(val) => setFilterStatus(val || '')}
                            allowClear
                            style={{ width: '100%' }}
                        >
                            <Option value="active">Đang hợp tác</Option>
                            <Option value="inactive">Ngừng hợp tác</Option>
                        </Select>
                    </Col>
                </Row>

                <Table
                    columns={columns}
                    dataSource={suppliers}
                    rowKey="_id"
                    loading={loading}
                    pagination={{
                        ...pagination,
                        showSizeChanger: false,
                        showTotal: (total) => `Tổng ${total} nhà cung cấp`,
                        onChange: (page) => fetchSuppliers(page),
                    }}
                    locale={{ emptyText: 'Chưa có nhà cung cấp nào' }}
                />
            </Card>

            {/* Modal Thêm/Sửa */}
            <Modal
                title={editingSupplier ? 'Sửa nhà cung cấp' : 'Thêm nhà cung cấp mới'}
                open={modalOpen}
                onCancel={() => { setModalOpen(false); form.resetFields(); setEditingSupplier(null); }}
                footer={null}
                destroyOnClose
                width={600}
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false} className="mt-4">
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="name"
                                label="Tên nhà cung cấp"
                                rules={[{ required: true, message: 'Vui lòng nhập tên' }]}
                            >
                                <Input placeholder="Nhập tên NCC" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="contactPerson" label="Người liên hệ">
                                <Input placeholder="Nhập tên người liên hệ" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="phone" label="Số điện thoại">
                                <Input prefix={<PhoneOutlined />} placeholder="Nhập SĐT" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="email" label="Email" rules={[{ type: 'email', message: 'Email không hợp lệ' }]}>
                                <Input prefix={<MailOutlined />} placeholder="Nhập email" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item name="address" label="Địa chỉ">
                        <Input prefix={<EnvironmentOutlined />} placeholder="Nhập địa chỉ" />
                    </Form.Item>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="taxCode" label="Mã số thuế">
                                <Input placeholder="Nhập MST" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="status" label="Trạng thái" initialValue="active">
                                <Select>
                                    <Option value="active">Đang hợp tác</Option>
                                    <Option value="inactive">Ngừng hợp tác</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item name="note" label="Ghi chú">
                        <Input.TextArea rows={2} placeholder="Ghi chú (tùy chọn)" />
                    </Form.Item>
                    <div className="flex justify-end gap-2">
                        <Button onClick={() => { setModalOpen(false); form.resetFields(); }}>Hủy</Button>
                        <Button type="primary" htmlType="submit">
                            {editingSupplier ? 'Cập nhật' : 'Tạo mới'}
                        </Button>
                    </div>
                </Form>
            </Modal>

            {/* Modal Chi tiết */}
            <Modal
                title="Chi tiết nhà cung cấp"
                open={detailOpen}
                onCancel={() => setDetailOpen(false)}
                footer={<Button onClick={() => setDetailOpen(false)}>Đóng</Button>}
                width={600}
            >
                {selectedSupplier && (
                    <Descriptions column={1} bordered size="small" className="mt-4">
                        <Descriptions.Item label="Mã NCC">{selectedSupplier.code}</Descriptions.Item>
                        <Descriptions.Item label="Tên">{selectedSupplier.name}</Descriptions.Item>
                        <Descriptions.Item label="Người liên hệ">{selectedSupplier.contactPerson || '—'}</Descriptions.Item>
                        <Descriptions.Item label="Số điện thoại">{selectedSupplier.phone || '—'}</Descriptions.Item>
                        <Descriptions.Item label="Email">{selectedSupplier.email || '—'}</Descriptions.Item>
                        <Descriptions.Item label="Địa chỉ">{selectedSupplier.address || '—'}</Descriptions.Item>
                        <Descriptions.Item label="Mã số thuế">{selectedSupplier.taxCode || '—'}</Descriptions.Item>
                        <Descriptions.Item label="Trạng thái">
                            <Tag color={selectedSupplier.status === 'active' ? 'green' : 'red'}>
                                {selectedSupplier.status === 'active' ? 'Đang hợp tác' : 'Ngừng hợp tác'}
                            </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Ghi chú">{selectedSupplier.note || '—'}</Descriptions.Item>
                    </Descriptions>
                )}
            </Modal>
        </div>
    );
};

export default SupplierList;
