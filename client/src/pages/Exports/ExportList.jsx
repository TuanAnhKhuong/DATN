import { useState, useEffect, useCallback } from 'react';
import {
    Table,
    Button,
    Modal,
    Form,
    Select,
    InputNumber,
    Input,
    Space,
    Tag,
    Card,
    Row,
    Col,
    Statistic,
    Popconfirm,
    Descriptions,
    Divider,
    message,
    DatePicker,
    Tooltip,
} from 'antd';
import {
    PlusOutlined,
    EyeOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    ExportOutlined,
    DeleteOutlined,
    SearchOutlined,
    FileTextOutlined,
    DownloadOutlined,
} from '@ant-design/icons';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';
import * as XLSX from 'xlsx';

const { Option } = Select;
const { TextArea } = Input;

const ExportList = () => {
    const [exports, setExports] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedExport, setSelectedExport] = useState(null);
    const [stats, setStats] = useState({});
    const [filterStatus, setFilterStatus] = useState('');
    const [filterType, setFilterType] = useState('');
    const [searchText, setSearchText] = useState('');
    const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
    const [submitting, setSubmitting] = useState(false);
    const [exportMonth, setExportMonth] = useState(null);
    const [exporting, setExporting] = useState(false);
    // Lưu thông tin SP đã chọn theo field index: { [fieldName]: product }
    const [selectedProductsMap, setSelectedProductsMap] = useState({});
    const [form] = Form.useForm();
    const { user } = useAuth();
    const isStaff = user?.role === 'staff';

    const typeConfig = {
        sale: { color: 'blue', text: 'Bán hàng' },
        return_supplier: { color: 'orange', text: 'Trả NCC' },
        damaged: { color: 'red', text: 'Hàng hỏng' },
        transfer: { color: 'purple', text: 'Chuyển kho' },
        other: { color: 'default', text: 'Khác' },
    };

    const statusConfig = {
        draft: { color: 'default', text: 'Nháp' },
        pending: { color: 'orange', text: 'Chờ duyệt' },
        completed: { color: 'green', text: 'Đã xuất' },
        cancelled: { color: 'red', text: 'Đã hủy' },
    };

    const fetchExports = useCallback(
        async (page = 1) => {
            setLoading(true);
            try {
                const params = { page, limit: pagination.pageSize };
                if (searchText) params.search = searchText;
                if (filterStatus) params.status = filterStatus;
                if (filterType) params.type = filterType;
                const res = await axiosClient.get('/exports', { params });
                setExports(res.metadata.exports);
                setPagination((prev) => ({ ...prev, current: page, total: res.metadata.total }));
            } catch (error) {
                message.error('Lỗi khi tải danh sách phiếu xuất');
            } finally {
                setLoading(false);
            }
        },
        [searchText, filterStatus, filterType, pagination.pageSize],
    );

    const fetchDropdownData = async () => {
        try {
            const [prodRes, statsRes] = await Promise.all([
                axiosClient.get('/products', { params: { limit: 500 } }),
                axiosClient.get('/exports/stats'),
            ]);
            setProducts(prodRes.metadata.products || prodRes.metadata);
            setStats(statsRes.metadata);
        } catch (error) {
            console.error('Error loading data:', error);
        }
    };

    useEffect(() => {
        fetchDropdownData();
    }, []);
    useEffect(() => {
        fetchExports(1);
    }, [searchText, filterStatus, filterType]);

    // Xuất Excel theo tháng
    const handleExportExcel = async () => {
        if (!exportMonth) {
            message.warning('Vui lòng chọn tháng cần xuất');
            return;
        }
        setExporting(true);
        try {
            const year = exportMonth.year();
            const month = exportMonth.month(); // 0-indexed
            const startDate = new Date(year, month, 1).toISOString().split('T')[0];
            const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];
            const res = await axiosClient.get('/exports', {
                params: { startDate, endDate, limit: 10000, page: 1 },
            });
            const data = res.metadata.exports || [];
            if (data.length === 0) {
                message.info('Không có phiếu xuất nào trong tháng này');
                return;
            }

            const typeLabel = {
                sale: 'Bán hàng',
                return_supplier: 'Trả NCC',
                damaged: 'Hàng hỏng',
                transfer: 'Chuyển kho',
                other: 'Khác',
            };
            const statusLabel = { draft: 'Nháp', pending: 'Chờ duyệt', completed: 'Đã xuất', cancelled: 'Đã hủy' };

            // Sheet 1: Danh sách phiếu xuất
            const summaryRows = data.map((exp, idx) => ({
                STT: idx + 1,
                'Mã phiếu': exp.code,
                'Loại xuất': typeLabel[exp.type] || exp.type,
                'Người nhận': exp.receiver || '',
                'Số sản phẩm': exp.items?.length || 0,
                'Tổng số lượng': exp.totalItems,
                'Tổng tiền (VNĐ)': exp.totalAmount,
                'Trạng thái': statusLabel[exp.status] || exp.status,
                'Người tạo': exp.createdBy?.fullName || '',
                'Ngày xuất kho': exp.exportDate
                    ? new Date(exp.exportDate).toLocaleString('vi-VN')
                    : exp.createdAt
                      ? new Date(exp.createdAt).toLocaleString('vi-VN')
                      : '',
                'Ghi chú': exp.note || '',
            }));

            // Sheet 2: Chi tiết từng sản phẩm
            const detailRows = [];
            data.forEach((exp) => {
                (exp.items || []).forEach((item) => {
                    detailRows.push({
                        'Mã phiếu': exp.code,
                        'Ngày xuất kho': exp.exportDate
                            ? new Date(exp.exportDate).toLocaleString('vi-VN')
                            : exp.createdAt
                              ? new Date(exp.createdAt).toLocaleString('vi-VN')
                              : '',
                        'Loại xuất': typeLabel[exp.type] || exp.type,
                        'Người nhận': exp.receiver || '',
                        'Mã SP': item.sku,
                        'Tên sản phẩm': item.productName,
                        'Số lượng': item.quantity,
                        'Đơn giá xuất (VNĐ)': item.exportPrice,
                        'Thành tiền (VNĐ)': item.totalPrice,
                        'Trạng thái phiếu': statusLabel[exp.status] || exp.status,
                    });
                });
            });

            const wb = XLSX.utils.book_new();
            const ws1 = XLSX.utils.json_to_sheet(summaryRows);
            const ws2 = XLSX.utils.json_to_sheet(detailRows);

            ws1['!cols'] = [
                { wch: 5 },
                { wch: 14 },
                { wch: 12 },
                { wch: 20 },
                { wch: 10 },
                { wch: 12 },
                { wch: 16 },
                { wch: 12 },
                { wch: 16 },
                { wch: 20 },
                { wch: 24 },
            ];
            ws2['!cols'] = [
                { wch: 14 },
                { wch: 20 },
                { wch: 12 },
                { wch: 20 },
                { wch: 10 },
                { wch: 28 },
                { wch: 10 },
                { wch: 18 },
                { wch: 18 },
                { wch: 14 },
            ];

            XLSX.utils.book_append_sheet(wb, ws1, 'Danh sách phiếu xuất');
            XLSX.utils.book_append_sheet(wb, ws2, 'Chi tiết sản phẩm');

            const monthStr = `${String(month + 1).padStart(2, '0')}-${year}`;
            XLSX.writeFile(wb, `Xuat_Kho_Thang_${monthStr}.xlsx`);
            message.success(`Đã xuất Excel tháng ${month + 1}/${year} (${data.length} phiếu)`);
        } catch (e) {
            message.error('Xuất Excel thất bại');
        } finally {
            setExporting(false);
        }
    };

    const formatCurrency = (value) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);
    const formatDate = (date) =>
        new Date(date).toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });

    const handleSubmit = async (values) => {
        if (!values.items || values.items.length === 0) {
            message.warning('Vui lòng thêm ít nhất 1 sản phẩm');
            return;
        }
        setSubmitting(true);
        try {
            // Gom nhóm item trùng sản phẩm: cộng dồn số lượng, lấy giá xuất mới nhất (hoặc do người dùng nhập sau)
            const mergedMap = {};
            for (const item of values.items) {
                if (!item?.product) continue;
                if (!mergedMap[item.product]) {
                    mergedMap[item.product] = {
                        product: item.product,
                        quantity: 0,
                        exportPrice: item.exportPrice,
                    };
                }
                mergedMap[item.product].quantity += item.quantity || 0;
                mergedMap[item.product].exportPrice = item.exportPrice; // Ưu tiên giá của dòng cuối cùng nhập
            }
            const mergedItems = Object.values(mergedMap);

            await axiosClient.post('/exports', {
                type: values.type,
                receiver: values.receiver || '',
                items: mergedItems,
                note: values.note || '',
                status: values.status || 'pending',
                exportDate: values.exportDate ? values.exportDate.format('YYYY-MM-DDTHH:mm:ss') : null,
            });
            message.success('Tạo phiếu xuất thành công');
            setModalOpen(false);
            form.resetFields();
            fetchExports(pagination.current);
            fetchDropdownData();
        } catch (error) {
            message.error(error.response?.data?.message || 'Tạo phiếu xuất thất bại');
        } finally {
            setSubmitting(false);
        }
    };

    const handleApprove = async (id) => {
        try {
            await axiosClient.patch(`/exports/${id}/approve`);
            message.success('Duyệt phiếu xuất thành công — đã trừ tồn kho');
            fetchExports(pagination.current);
            fetchDropdownData();
            if (detailOpen) {
                const res = await axiosClient.get(`/exports/${id}`);
                setSelectedExport(res.metadata);
            }
        } catch (error) {
            message.error(error.response?.data?.message || 'Duyệt thất bại');
        }
    };

    const handleCancel = async (id) => {
        try {
            await axiosClient.patch(`/exports/${id}/cancel`);
            message.success('Đã hủy phiếu xuất');
            fetchExports(pagination.current);
            fetchDropdownData();
            if (detailOpen) {
                const res = await axiosClient.get(`/exports/${id}`);
                setSelectedExport(res.metadata);
            }
        } catch (error) {
            message.error(error.response?.data?.message || 'Hủy thất bại');
        }
    };

    const handleView = async (record) => {
        try {
            const res = await axiosClient.get(`/exports/${record._id}`);
            setSelectedExport(res.metadata);
            setDetailOpen(true);
        } catch (error) {
            message.error('Lỗi khi tải chi tiết');
        }
    };

    const handleProductSelect = (value, fieldName) => {
        const product = products.find((p) => p._id === value);
        if (product) {
            const items = form.getFieldValue('items') || [];
            items[fieldName] = {
                ...items[fieldName],
                exportPrice: product.salePrice,
                product: value,
                quantity: undefined,
            };
            form.setFieldsValue({ items });
            setSelectedProductsMap((prev) => ({ ...prev, [fieldName]: product }));

            // Kiểm tra có dòng khác cùng sản phẩm không
            const duplicateCount = items.filter((it, idx) => idx !== fieldName && it?.product === value).length;
            if (duplicateCount > 0) {
                message.warning(
                    `Sản phẩm “${product.name}” đã có trong phiếu! → Số lượng sẽ được cộng gộp khi lưu.`,
                    4,
                );
            }
        }
    };

    // Reset map khi đóng modal
    const handleCloseModal = () => {
        setModalOpen(false);
        form.resetFields();
        setSelectedProductsMap({});
    };

    const columns = [
        {
            title: 'Mã phiếu',
            dataIndex: 'code',
            key: 'code',
            width: 110,
            render: (code) => <span style={{ fontWeight: 600, color: '#7C3AED' }}>{code}</span>,
        },
        {
            title: 'Loại xuất',
            dataIndex: 'type',
            key: 'type',
            width: 100,
            align: 'center',
            render: (t) => <Tag color={typeConfig[t]?.color}>{typeConfig[t]?.text}</Tag>,
        },
        {
            title: 'Người nhận',
            dataIndex: 'receiver',
            key: 'receiver',
            ellipsis: true,
            render: (v) => v || '—',
        },
        {
            title: 'Số SP',
            dataIndex: 'items',
            key: 'itemCount',
            width: 75,
            align: 'center',
            render: (items) => items?.length || 0,
        },
        {
            title: 'Tổng SL',
            dataIndex: 'totalItems',
            key: 'totalItems',
            width: 80,
            align: 'center',
            render: (v) => <span className="font-semibold">{v}</span>,
        },
        {
            title: 'Tổng tiền',
            dataIndex: 'totalAmount',
            key: 'totalAmount',
            width: 140,
            align: 'right',
            render: (v) => <span className="font-semibold">{formatCurrency(v)}</span>,
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            width: 110,
            align: 'center',
            render: (s) => <Tag color={statusConfig[s]?.color}>{statusConfig[s]?.text}</Tag>,
        },
        {
            title: 'Ngày xuất kho',
            key: 'exportDate',
            width: 150,
            render: (_, record) => formatDate(record.exportDate || record.createdAt),
            responsive: ['lg'],
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 140,
            align: 'center',
            render: (_, record) => (
                <Space>
                    <Button
                        type="text"
                        icon={<EyeOutlined />}
                        onClick={() => handleView(record)}
                        style={{ color: '#06B6D4' }}
                    />
                    {record.status === 'pending' && !isStaff && (
                        <>
                            <Popconfirm
                                title="Duyệt phiếu xuất?"
                                description="Tồn kho sẽ bị trừ"
                                onConfirm={() => handleApprove(record._id)}
                                okText="Duyệt"
                                cancelText="Hủy"
                            >
                                <Button type="text" icon={<CheckCircleOutlined />} style={{ color: '#10B981' }} />
                            </Popconfirm>
                            <Popconfirm
                                title="Hủy phiếu xuất?"
                                onConfirm={() => handleCancel(record._id)}
                                okText="Hủy phiếu"
                                cancelText="Không"
                                okButtonProps={{ danger: true }}
                            >
                                <Button type="text" icon={<CloseCircleOutlined />} danger />
                            </Popconfirm>
                        </>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <div>
            <div className="page-header">
                <h2>Quản lý xuất kho</h2>
                <p>Tạo và quản lý phiếu xuất kho hàng hóa</p>
            </div>

            {/* Stats */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={12} sm={6}>
                    <div className="stat-card">
                        <Statistic
                            title={<span style={{ color: '#64748B', fontSize: 12 }}>Tổng phiếu</span>}
                            value={stats.total || 0}
                            prefix={<FileTextOutlined style={{ color: '#7C3AED' }} />}
                            valueStyle={{ fontSize: 20, fontWeight: 700 }}
                        />
                    </div>
                </Col>
                <Col xs={12} sm={6}>
                    <div className="stat-card">
                        <Statistic
                            title={<span style={{ color: '#64748B', fontSize: 12 }}>Chờ duyệt</span>}
                            value={stats.pending || 0}
                            prefix={<ExportOutlined style={{ color: '#F59E0B' }} />}
                            valueStyle={{ fontSize: 20, fontWeight: 700, color: '#F59E0B' }}
                        />
                    </div>
                </Col>
                <Col xs={12} sm={6}>
                    <div className="stat-card">
                        <Statistic
                            title={<span style={{ color: '#64748B', fontSize: 12 }}>Đã xuất</span>}
                            value={stats.completed || 0}
                            prefix={<CheckCircleOutlined style={{ color: '#10B981' }} />}
                            valueStyle={{ fontSize: 20, fontWeight: 700, color: '#10B981' }}
                        />
                    </div>
                </Col>
                <Col xs={12} sm={6}>
                    <div className="stat-card">
                        <Statistic
                            title={<span style={{ color: '#64748B', fontSize: 12 }}>Tổng giá trị xuất</span>}
                            value={stats.totalValue || 0}
                            formatter={(val) => formatCurrency(val)}
                            valueStyle={{ fontSize: 16, fontWeight: 700, color: '#7C3AED' }}
                        />
                    </div>
                </Col>
            </Row>

            <Card>
                <div className="flex justify-between items-center flex-wrap gap-2" style={{ marginBottom: 16 }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#1E293B' }}>Danh sách phiếu xuất</h3>
                    <Space wrap>
                        <DatePicker
                            picker="month"
                            placeholder="Chọn tháng xuất Excel"
                            value={exportMonth}
                            onChange={setExportMonth}
                            format="MM/YYYY"
                            style={{ width: 180 }}
                        />
                        <Tooltip title="Xuất Excel tất cả phiếu xuất trong tháng đã chọn">
                            <Button
                                icon={<DownloadOutlined />}
                                onClick={handleExportExcel}
                                loading={exporting}
                                style={{ borderColor: '#7C3AED', color: '#7C3AED' }}
                            >
                                Xuất Excel
                            </Button>
                        </Tooltip>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => {
                                form.resetFields();
                                setModalOpen(true);
                            }}
                            style={{ background: '#7C3AED', borderColor: '#7C3AED' }}
                        >
                            Tạo phiếu xuất
                        </Button>
                    </Space>
                </div>

                <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
                    <Col xs={24} sm={12} md={8}>
                        <Input
                            placeholder="Tìm mã phiếu, người nhận..."
                            prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            allowClear
                        />
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                        <Select
                            placeholder="Loại xuất"
                            value={filterType || undefined}
                            onChange={(v) => setFilterType(v || '')}
                            allowClear
                            style={{ width: '100%' }}
                        >
                            <Option value="sale">Bán hàng</Option>
                            <Option value="return_supplier">Trả NCC</Option>
                            <Option value="damaged">Hàng hỏng</Option>
                            <Option value="transfer">Chuyển kho</Option>
                            <Option value="other">Khác</Option>
                        </Select>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                        <Select
                            placeholder="Trạng thái"
                            value={filterStatus || undefined}
                            onChange={(v) => setFilterStatus(v || '')}
                            allowClear
                            style={{ width: '100%' }}
                        >
                            <Option value="pending">Chờ duyệt</Option>
                            <Option value="completed">Đã xuất</Option>
                            <Option value="cancelled">Đã hủy</Option>
                        </Select>
                    </Col>
                </Row>

                <Table
                    columns={columns}
                    dataSource={exports}
                    rowKey="_id"
                    loading={loading}
                    pagination={{
                        ...pagination,
                        showSizeChanger: false,
                        showTotal: (total) => `Tổng ${total} phiếu`,
                        onChange: (page) => fetchExports(page),
                    }}
                    locale={{ emptyText: 'Chưa có phiếu xuất nào' }}
                    scroll={{ x: 950 }}
                />
            </Card>

            {/* Modal Tạo phiếu xuất */}
            <Modal
                title="Tạo phiếu xuất kho"
                open={modalOpen}
                onCancel={handleCloseModal}
                footer={null}
                destroyOnClose
                width={860}
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false} className="mt-2">
                    <Row gutter={16}>
                        <Col span={6}>
                            <Form.Item name="type" label="Loại xuất" initialValue="sale" rules={[{ required: true }]}>
                                <Select>
                                    <Option value="sale">Bán hàng</Option>
                                    <Option value="return_supplier">Trả NCC</Option>
                                    <Option value="damaged">Hàng hỏng</Option>
                                    <Option value="transfer">Chuyển kho</Option>
                                    <Option value="other">Khác</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item name="receiver" label="Người nhận / Khách hàng">
                                <Input placeholder="Tên người nhận" />
                            </Form.Item>
                        </Col>
                        <Col span={isStaff ? 12 : 6}>
                            <Form.Item name="exportDate" label="Ngày & giờ xuất kho">
                                <DatePicker
                                    style={{ width: '100%' }}
                                    showTime={{ format: 'HH:mm' }}
                                    format="DD/MM/YYYY HH:mm"
                                    placeholder="Chọn ngày & giờ xuất"
                                />
                            </Form.Item>
                        </Col>
                        {!isStaff && (
                            <Col span={6}>
                                <Form.Item name="status" label="Trạng thái" initialValue="pending">
                                    <Select>
                                        <Option value="pending">Chờ duyệt</Option>
                                        <Option value="completed">Xuất kho ngay</Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                        )}
                        {/* Ẩn với staff: mặc định pending */}
                        {isStaff && (
                            <Form.Item name="status" initialValue="pending" hidden>
                                <Input />
                            </Form.Item>
                        )}
                    </Row>

                    <Divider orientation="left" style={{ fontSize: 13, color: '#64748B' }}>
                        Danh sách sản phẩm xuất
                    </Divider>

                    <Form.List
                        name="items"
                        rules={[
                            {
                                validator: async (_, items) => {
                                    if (!items || items.length < 1) throw new Error('Thêm ít nhất 1 sản phẩm');
                                },
                            },
                        ]}
                    >
                        {(fields, { add, remove }, { errors }) => (
                            <>
                                {fields.length > 0 && (
                                    <Row
                                        gutter={12}
                                        style={{ marginBottom: 8, fontSize: 12, color: '#64748B', fontWeight: 600 }}
                                    >
                                        <Col span={9}>Sản phẩm</Col>
                                        <Col span={4}>Tồn kho</Col>
                                        <Col span={4}>Số lượng</Col>
                                        <Col span={5}>Giá xuất (VNĐ)</Col>
                                        <Col span={2}></Col>
                                    </Row>
                                )}
                                {fields.map(({ key, name, ...restField }) => {
                                    const selProd = selectedProductsMap[name];
                                    const stock = selProd?.quantity ?? null;
                                    const stockColor =
                                        stock === null
                                            ? '#94A3B8'
                                            : stock === 0
                                              ? '#EF4444'
                                              : stock <= (selProd?.minStock || 10)
                                                ? '#F59E0B'
                                                : '#10B981';
                                    return (
                                        <Row gutter={12} key={key} align="middle" style={{ marginBottom: 10 }}>
                                            <Col span={9}>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'product']}
                                                    noStyle
                                                    rules={[{ required: true, message: 'Chọn SP' }]}
                                                >
                                                    <Select
                                                        placeholder="Chọn sản phẩm"
                                                        showSearch
                                                        filterOption={(input, option) =>
                                                            option?.children
                                                                ?.join('')
                                                                .toLowerCase()
                                                                .includes(input.toLowerCase())
                                                        }
                                                        onChange={(val) => handleProductSelect(val, name)}
                                                        style={{ width: '100%' }}
                                                    >
                                                        {products.map((p) => (
                                                            <Option key={p._id} value={p._id}>
                                                                {p.sku} - {p.name}
                                                            </Option>
                                                        ))}
                                                    </Select>
                                                </Form.Item>
                                            </Col>
                                            <Col span={4}>
                                                {/* Hiển thị tồn kho sau khi chọn */}
                                                {stock !== null ? (
                                                    <div
                                                        style={{
                                                            background: stockColor + '18',
                                                            border: `1px solid ${stockColor}40`,
                                                            borderRadius: 6,
                                                            padding: '4px 8px',
                                                            textAlign: 'center',
                                                            fontWeight: 700,
                                                            color: stockColor,
                                                            fontSize: 13,
                                                        }}
                                                    >
                                                        {stock === 0 ? 'Hết hàng' : stock}
                                                    </div>
                                                ) : (
                                                    <div
                                                        style={{ color: '#CBD5E1', textAlign: 'center', fontSize: 12 }}
                                                    >
                                                        —
                                                    </div>
                                                )}
                                            </Col>
                                            <Col span={4}>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'quantity']}
                                                    noStyle
                                                    rules={[
                                                        { required: true, message: 'Nhập SL' },
                                                        {
                                                            validator(_, value) {
                                                                if (!selProd) return Promise.resolve();
                                                                if (value > selProd.quantity) {
                                                                    return Promise.reject(
                                                                        new Error(
                                                                            `Tồn kho chỉ còn ${selProd.quantity}`,
                                                                        ),
                                                                    );
                                                                }
                                                                return Promise.resolve();
                                                            },
                                                        },
                                                    ]}
                                                >
                                                    <InputNumber
                                                        style={{ width: '100%' }}
                                                        min={1}
                                                        max={stock ?? undefined}
                                                        placeholder="SL"
                                                        disabled={stock === 0}
                                                    />
                                                </Form.Item>
                                            </Col>
                                            <Col span={5}>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'exportPrice']}
                                                    noStyle
                                                    rules={[{ required: true, message: 'Nhập giá' }]}
                                                >
                                                    <InputNumber
                                                        style={{ width: '100%' }}
                                                        min={0}
                                                        placeholder="Giá xuất"
                                                        formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                                        parser={(v) => v.replace(/,/g, '')}
                                                    />
                                                </Form.Item>
                                            </Col>
                                            <Col span={2}>
                                                <DeleteOutlined
                                                    onClick={() => {
                                                        remove(name);
                                                        setSelectedProductsMap((prev) => {
                                                            const next = { ...prev };
                                                            delete next[name];
                                                            return next;
                                                        });
                                                    }}
                                                    style={{ color: '#EF4444', fontSize: 16, cursor: 'pointer' }}
                                                />
                                            </Col>
                                        </Row>
                                    );
                                })}
                                <Button
                                    type="dashed"
                                    onClick={() => add()}
                                    icon={<PlusOutlined />}
                                    block
                                    style={{ marginTop: 4 }}
                                >
                                    Thêm sản phẩm
                                </Button>
                                <Form.ErrorList errors={errors} />
                            </>
                        )}
                    </Form.List>

                    <Form.Item name="note" label="Ghi chú" style={{ marginTop: 16 }}>
                        <TextArea rows={2} placeholder="Ghi chú phiếu xuất..." />
                    </Form.Item>

                    <div className="flex justify-end gap-2" style={{ borderTop: '1px solid #E2E8F0', paddingTop: 16 }}>
                        <Button onClick={handleCloseModal}>Hủy</Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={submitting}
                            style={{ background: '#7C3AED', borderColor: '#7C3AED' }}
                        >
                            Tạo phiếu xuất
                        </Button>
                    </div>
                </Form>
            </Modal>

            {/* Modal Chi tiết */}
            <Modal
                title={
                    <div className="flex items-center gap-2">
                        Chi tiết phiếu xuất
                        {selectedExport && (
                            <>
                                <Tag color={statusConfig[selectedExport.status]?.color}>
                                    {statusConfig[selectedExport.status]?.text}
                                </Tag>
                                <Tag color={typeConfig[selectedExport.type]?.color}>
                                    {typeConfig[selectedExport.type]?.text}
                                </Tag>
                            </>
                        )}
                    </div>
                }
                open={detailOpen}
                onCancel={() => setDetailOpen(false)}
                footer={
                    <Space>
                        {selectedExport?.status === 'pending' && !isStaff && (
                            <>
                                <Popconfirm
                                    title="Duyệt phiếu xuất?"
                                    description="Tồn kho sẽ bị trừ"
                                    onConfirm={() => handleApprove(selectedExport._id)}
                                    okText="Duyệt"
                                    cancelText="Hủy"
                                >
                                    <Button
                                        type="primary"
                                        icon={<CheckCircleOutlined />}
                                        style={{ background: '#10B981', borderColor: '#10B981' }}
                                    >
                                        Duyệt phiếu
                                    </Button>
                                </Popconfirm>
                                <Popconfirm
                                    title="Hủy phiếu xuất?"
                                    onConfirm={() => handleCancel(selectedExport._id)}
                                    okText="Hủy phiếu"
                                    cancelText="Không"
                                    okButtonProps={{ danger: true }}
                                >
                                    <Button danger>Hủy phiếu</Button>
                                </Popconfirm>
                            </>
                        )}
                        <Button onClick={() => setDetailOpen(false)}>Đóng</Button>
                    </Space>
                }
                width={780}
            >
                {selectedExport && (
                    <div className="mt-4">
                        <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
                            <Descriptions.Item label="Mã phiếu">
                                <span style={{ fontWeight: 600, color: '#7C3AED' }}>{selectedExport.code}</span>
                            </Descriptions.Item>
                            <Descriptions.Item label="Ngày tạo">
                                {formatDate(selectedExport.createdAt)}
                            </Descriptions.Item>
                            <Descriptions.Item label="Ngày xuất kho">
                                <strong style={{ color: '#7C3AED' }}>
                                    {selectedExport.exportDate
                                        ? new Date(selectedExport.exportDate).toLocaleDateString('vi-VN')
                                        : new Date(selectedExport.createdAt).toLocaleDateString('vi-VN')}
                                </strong>
                            </Descriptions.Item>
                            <Descriptions.Item label="Loại xuất">
                                <Tag color={typeConfig[selectedExport.type]?.color}>
                                    {typeConfig[selectedExport.type]?.text}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Người nhận">{selectedExport.receiver || '—'}</Descriptions.Item>
                            <Descriptions.Item label="Người tạo">
                                {selectedExport.createdBy?.fullName || '—'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Tổng số lượng">
                                <span className="font-semibold">{selectedExport.totalItems}</span>
                            </Descriptions.Item>
                            <Descriptions.Item label="Tổng tiền" span={2}>
                                <span className="font-semibold" style={{ color: '#7C3AED', fontSize: 15 }}>
                                    {formatCurrency(selectedExport.totalAmount)}
                                </span>
                            </Descriptions.Item>
                            {selectedExport.note && (
                                <Descriptions.Item label="Ghi chú" span={2}>
                                    {selectedExport.note}
                                </Descriptions.Item>
                            )}
                        </Descriptions>

                        <Divider orientation="left" style={{ fontSize: 13 }}>
                            Chi tiết sản phẩm ({selectedExport.items?.length || 0})
                        </Divider>
                        <Table
                            dataSource={selectedExport.items}
                            rowKey="_id"
                            size="small"
                            pagination={false}
                            columns={[
                                {
                                    title: 'Mã SP',
                                    dataIndex: 'sku',
                                    width: 90,
                                    render: (sku) => <span style={{ color: '#7C3AED', fontWeight: 600 }}>{sku}</span>,
                                },
                                { title: 'Tên sản phẩm', dataIndex: 'productName', ellipsis: true },
                                {
                                    title: 'Số lượng',
                                    dataIndex: 'quantity',
                                    width: 80,
                                    align: 'center',
                                    render: (v) => <span className="font-semibold">{v}</span>,
                                },
                                {
                                    title: 'Đơn giá xuất',
                                    dataIndex: 'exportPrice',
                                    width: 130,
                                    align: 'right',
                                    render: (v) => formatCurrency(v),
                                },
                                {
                                    title: 'Thành tiền',
                                    dataIndex: 'totalPrice',
                                    width: 140,
                                    align: 'right',
                                    render: (v) => <span className="font-semibold">{formatCurrency(v)}</span>,
                                },
                            ]}
                            summary={() => (
                                <Table.Summary.Row>
                                    <Table.Summary.Cell index={0} colSpan={2}>
                                        <strong>Tổng cộng</strong>
                                    </Table.Summary.Cell>
                                    <Table.Summary.Cell index={2} align="center">
                                        <strong>{selectedExport.totalItems}</strong>
                                    </Table.Summary.Cell>
                                    <Table.Summary.Cell index={3}></Table.Summary.Cell>
                                    <Table.Summary.Cell index={4} align="right">
                                        <strong style={{ color: '#7C3AED' }}>
                                            {formatCurrency(selectedExport.totalAmount)}
                                        </strong>
                                    </Table.Summary.Cell>
                                </Table.Summary.Row>
                            )}
                        />
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default ExportList;
