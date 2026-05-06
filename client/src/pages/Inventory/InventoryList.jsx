import { useState, useEffect, useCallback } from 'react';
import {
    Table,
    Button,
    Modal,
    Select,
    Input,
    Tag,
    Card,
    Row,
    Col,
    Statistic,
    Progress,
    Space,
    Image,
    Descriptions,
    Divider,
    message,
    Badge,
    Tooltip,
} from 'antd';
import {
    DatabaseOutlined,
    WarningOutlined,
    ExclamationCircleOutlined,
    DollarOutlined,
    SearchOutlined,
    ShoppingOutlined,
    HistoryOutlined,
    ArrowUpOutlined,
    ArrowDownOutlined,
} from '@ant-design/icons';
import axiosClient from '../../api/axiosClient';

const { Option } = Select;

const InventoryList = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [overview, setOverview] = useState({});
    const [loading, setLoading] = useState(false);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [historyData, setHistoryData] = useState(null);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterStock, setFilterStock] = useState('');
    const [filterAge, setFilterAge] = useState('');
    const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });

    const fetchOverview = async () => {
        try {
            const res = await axiosClient.get('/inventory/overview');
            setOverview(res.metadata);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchStock = useCallback(
        async (page = 1) => {
            setLoading(true);
            try {
                const params = { page, limit: pagination.pageSize, sortBy: 'quantity', sortOrder: 'asc' };
                if (searchText) params.search = searchText;
                if (filterCategory) params.category = filterCategory;
                if (filterStock) params.stockStatus = filterStock;
                const res = await axiosClient.get('/inventory/stock', { params });
                setProducts(res.metadata.products);
                setPagination((prev) => ({ ...prev, current: page, total: res.metadata.total }));
            } catch (e) {
                message.error('Lỗi tải tồn kho');
            } finally {
                setLoading(false);
            }
        },
        [searchText, filterCategory, filterStock, pagination.pageSize],
    );

    const fetchCategories = async () => {
        try {
            const res = await axiosClient.get('/categories');
            setCategories(res.metadata);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchOverview();
        fetchCategories();
    }, []);
    useEffect(() => {
        fetchStock(1);
    }, [searchText, filterCategory, filterStock]);

    const formatCurrency = (v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0);
    const formatDate = (d) =>
        new Date(d).toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });

    // Lịch sử xuất nhập
    const handleViewHistory = async (productId) => {
        setHistoryLoading(true);
        setHistoryOpen(true);
        try {
            const res = await axiosClient.get(`/inventory/history/${productId}`, { params: { limit: 50 } });
            setHistoryData(res.metadata);
        } catch (e) {
            message.error('Lỗi tải lịch sử');
        } finally {
            setHistoryLoading(false);
        }
    };

    // Stock level color
    const getStockLevel = (qty, min) => {
        if (qty <= 0) return { color: '#EF4444', text: 'Hết hàng', status: 'exception' };
        if (qty <= min) return { color: '#F59E0B', text: 'Sắp hết', status: 'normal' };
        return { color: '#10B981', text: 'Đủ hàng', status: 'success' };
    };

    // Tính số ngày tồn kho
    const getInventoryAge = (lastImportDate) => {
        if (!lastImportDate) return null;
        const days = Math.floor((Date.now() - new Date(lastImportDate).getTime()) / (1000 * 60 * 60 * 24));
        return days;
    };

    const getAgeBadge = (days) => {
        if (days === null) return null;
        if (days >= 60)
            return { color: '#EF4444', label: 'Cần KM gấp', tip: 'Tồn lâu! Cần chương trình khuyến mãi ngay' };
        if (days >= 30) return { color: '#F59E0B', label: 'Nên KM', tip: 'Hàng tồn > 30 ngày, nên cân nhắc giảm giá' };
        return null;
    };

    const columns = [
        {
            title: 'Ảnh',
            dataIndex: 'thumbnail',
            key: 'thumb',
            width: 55,
            render: (v) =>
                v ? (
                    <Image
                        src={v}
                        width={40}
                        height={40}
                        style={{ objectFit: 'cover', borderRadius: 6 }}
                        preview={false}
                    />
                ) : (
                    <div
                        style={{
                            width: 40,
                            height: 40,
                            borderRadius: 6,
                            background: '#F1F5F9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <ShoppingOutlined style={{ color: '#94A3B8' }} />
                    </div>
                ),
        },
        {
            title: 'Mã SP',
            dataIndex: 'sku',
            key: 'sku',
            width: 90,
            render: (v) => <span style={{ fontWeight: 600, color: '#4F46E5' }}>{v}</span>,
        },
        {
            title: 'Tên sản phẩm',
            dataIndex: 'name',
            key: 'name',
            ellipsis: true,
            width: 150,
            render: (name, r) => (
                <div>
                    <div className="font-medium">{name}</div>
                    {r.brand && <span style={{ fontSize: 12, color: '#94A3B8' }}>{r.brand}</span>}
                </div>
            ),
        },
        { title: 'Danh mục', dataIndex: ['category', 'name'], key: 'cat', width: 110, responsive: ['lg'] },
        {
            title: 'Tồn kho',
            dataIndex: 'quantity',
            key: 'qty',
            width: 130,
            align: 'center',
            sorter: (a, b) => a.quantity - b.quantity,
            render: (qty, r) => {
                const lvl = getStockLevel(qty, r.minStock);
                const pct = r.minStock > 0 ? Math.min((qty / (r.minStock * 3)) * 100, 100) : 100;
                return (
                    <div>
                        <div className="font-semibold" style={{ color: lvl.color }}>
                            {qty} <span style={{ fontSize: 11, fontWeight: 400, color: '#94A3B8' }}>{r.unit}</span>
                        </div>
                        <Progress
                            percent={pct}
                            size="small"
                            showInfo={false}
                            strokeColor={lvl.color}
                            style={{ margin: 0, lineHeight: 1 }}
                        />
                    </div>
                );
            },
        },
        {
            title: 'Tối thiểu',
            dataIndex: 'minStock',
            key: 'min',
            width: 80,
            align: 'center',
            render: (v) => <span style={{ color: '#64748B' }}>{v}</span>,
        },
        {
            title: 'Trạng thái',
            key: 'stockStatus',
            width: 95,
            align: 'center',
            render: (_, r) => {
                const lvl = getStockLevel(r.quantity, r.minStock);
                return (
                    <Tag color={lvl.color === '#10B981' ? 'green' : lvl.color === '#F59E0B' ? 'orange' : 'red'}>
                        {lvl.text}
                    </Tag>
                );
            },
        },
        {
            title: 'Giá trị tồn',
            key: 'value',
            width: 130,
            align: 'right',
            responsive: ['md'],
            render: (_, r) => <span className="font-medium">{formatCurrency(r.importPrice * r.quantity)}</span>,
        },
        {
            title: 'Ngày nhập',
            dataIndex: 'lastImportDate',
            key: 'lastImportDate',
            width: 110,
            align: 'center',
            responsive: ['xl'],
            render: (d) =>
                d ? (
                    <span style={{ fontSize: 12, color: '#64748B' }}>{new Date(d).toLocaleDateString('vi-VN')}</span>
                ) : (
                    <span style={{ color: '#CBD5E1', fontSize: 12 }}>—</span>
                ),
        },
        {
            title: 'Tồn bao lâu',
            key: 'inventoryAge',
            width: 115,
            align: 'center',
            sorter: (a, b) => {
                const da = getInventoryAge(a.lastImportDate) ?? -1;
                const db = getInventoryAge(b.lastImportDate) ?? -1;
                return db - da;
            },
            render: (_, r) => {
                const days = getInventoryAge(r.lastImportDate);
                if (days === null) return <span style={{ color: '#CBD5E1', fontSize: 12 }}>—</span>;
                const badge = getAgeBadge(days);
                const color = days >= 60 ? '#EF4444' : days >= 30 ? '#F59E0B' : '#10B981';
                return (
                    <Tooltip title={badge?.tip || `Nhập kho cách đây ${days} ngày`}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                            <span style={{ fontWeight: 700, color, fontSize: 13 }}>{days} ngày</span>
                            {badge && (
                                <Tag
                                    color={badge.color === '#EF4444' ? 'red' : 'orange'}
                                    style={{ fontSize: 10, lineHeight: '16px', padding: '0 4px', margin: 0 }}
                                >
                                    {badge.label}
                                </Tag>
                            )}
                        </div>
                    </Tooltip>
                );
            },
        },
        {
            title: '',
            key: 'action',
            width: 50,
            align: 'center',
            render: (_, r) => (
                <Button
                    type="text"
                    icon={<HistoryOutlined />}
                    onClick={() => handleViewHistory(r._id)}
                    style={{ color: '#6366F1' }}
                    title="Lịch sử xuất nhập"
                />
            ),
        },
    ];

    const exportTypeLabel = {
        sale: 'Bán hàng',
        return_supplier: 'Trả NCC',
        damaged: 'Hàng hỏng',
        transfer: 'Chuyển kho',
        other: 'Khác',
    };

    return (
        <div>
            <div className="page-header">
                <h2>Quản lý tồn kho</h2>
                <p>Theo dõi tồn kho, cảnh báo sắp hết, lịch sử xuất nhập</p>
            </div>

            {/* Stats */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={12} sm={8} md={4}>
                    <div className="stat-card">
                        <Statistic
                            title={<span style={{ color: '#64748B', fontSize: 12 }}>Tổng SP</span>}
                            value={overview.totalProducts || 0}
                            prefix={<DatabaseOutlined style={{ color: '#4F46E5' }} />}
                            valueStyle={{ fontSize: 20, fontWeight: 700 }}
                        />
                    </div>
                </Col>
                <Col xs={12} sm={8} md={4}>
                    <div className="stat-card">
                        <Statistic
                            title={<span style={{ color: '#64748B', fontSize: 12 }}>Tổng SL tồn</span>}
                            value={overview.totalQuantity || 0}
                            prefix={<ShoppingOutlined style={{ color: '#06B6D4' }} />}
                            valueStyle={{ fontSize: 20, fontWeight: 700 }}
                        />
                    </div>
                </Col>
                <Col xs={12} sm={8} md={4}>
                    <div className="stat-card">
                        <Statistic
                            title={<span style={{ color: '#64748B', fontSize: 12 }}>Sắp hết</span>}
                            value={overview.lowStock || 0}
                            prefix={<WarningOutlined style={{ color: '#F59E0B' }} />}
                            valueStyle={{ fontSize: 20, fontWeight: 700, color: '#F59E0B' }}
                        />
                    </div>
                </Col>
                <Col xs={12} sm={8} md={4}>
                    <div className="stat-card">
                        <Statistic
                            title={<span style={{ color: '#64748B', fontSize: 12 }}>Hết hàng</span>}
                            value={overview.outOfStock || 0}
                            prefix={<ExclamationCircleOutlined style={{ color: '#EF4444' }} />}
                            valueStyle={{ fontSize: 20, fontWeight: 700, color: '#EF4444' }}
                        />
                    </div>
                </Col>
                <Col xs={12} sm={8} md={4}>
                    <div className="stat-card">
                        <Statistic
                            title={<span style={{ color: '#64748B', fontSize: 12 }}>GT vốn tồn</span>}
                            value={overview.totalImportValue || 0}
                            formatter={(v) => formatCurrency(v)}
                            valueStyle={{ fontSize: 14, fontWeight: 700, color: '#4F46E5' }}
                        />
                    </div>
                </Col>
                <Col xs={12} sm={8} md={4}>
                    <div className="stat-card">
                        <Statistic
                            title={<span style={{ color: '#64748B', fontSize: 12 }}>GT bán tồn</span>}
                            value={overview.totalSaleValue || 0}
                            formatter={(v) => formatCurrency(v)}
                            valueStyle={{ fontSize: 14, fontWeight: 700, color: '#10B981' }}
                        />
                    </div>
                </Col>
            </Row>

            {/* Cảnh báo sắp hết */}
            {overview.topLowStock && overview.topLowStock.length > 0 && (
                <Card style={{ marginBottom: 24, borderLeft: '4px solid #F59E0B' }}>
                    <div className="flex items-center gap-2" style={{ marginBottom: 12 }}>
                        <WarningOutlined style={{ color: '#F59E0B', fontSize: 18 }} />
                        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#92400E' }}>
                            Cảnh báo sắp hết hàng ({overview.topLowStock.length} sản phẩm)
                        </h3>
                    </div>
                    <div className="flex gap-3 flex-wrap">
                        {overview.topLowStock.map((p) => (
                            <Tag
                                key={p._id}
                                color={p.quantity <= 0 ? 'red' : 'orange'}
                                style={{ padding: '4px 10px', fontSize: 13 }}
                            >
                                {p.sku} — {p.name}:{' '}
                                <strong>
                                    {p.quantity}/{p.minStock} {p.unit}
                                </strong>
                            </Tag>
                        ))}
                    </div>
                </Card>
            )}

            {/* Stock Table */}
            <Card>
                <div className="flex justify-between items-center" style={{ marginBottom: 16 }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#1E293B' }}>Chi tiết tồn kho</h3>
                </div>

                <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
                    <Col xs={24} sm={12} md={6}>
                        <Input
                            placeholder="Tìm SP, mã SP, thương hiệu..."
                            prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            allowClear
                        />
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Select
                            placeholder="Danh mục"
                            value={filterCategory || undefined}
                            onChange={(v) => setFilterCategory(v || '')}
                            allowClear
                            style={{ width: '100%' }}
                        >
                            {categories.map((c) => (
                                <Option key={c._id} value={c._id}>
                                    {c.name}
                                </Option>
                            ))}
                        </Select>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Select
                            placeholder="Tình trạng tồn"
                            value={filterStock || undefined}
                            onChange={(v) => setFilterStock(v || '')}
                            allowClear
                            style={{ width: '100%' }}
                        >
                            <Option value="normal">Đủ hàng</Option>
                            <Option value="low">Sắp hết</Option>
                            <Option value="out">Hết hàng</Option>
                        </Select>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Select
                            placeholder="Hàng tồn lâu"
                            value={filterAge || undefined}
                            onChange={(v) => setFilterAge(v || '')}
                            allowClear
                            style={{ width: '100%' }}
                        >
                            <Option value="30">Tồn &gt; 30 ngày</Option>
                            <Option value="60">Tồn &gt; 60 ngày ⚠️</Option>
                            <Option value="90">Tồn &gt; 90 ngày 🔴</Option>
                        </Select>
                    </Col>
                </Row>

                <Table
                    columns={columns}
                    dataSource={
                        filterAge
                            ? products.filter((p) => {
                                  const days = getInventoryAge(p.lastImportDate);
                                  return days !== null && days > parseInt(filterAge);
                              })
                            : products
                    }
                    rowKey="_id"
                    loading={loading}
                    pagination={{
                        ...pagination,
                        showSizeChanger: false,
                        showTotal: (total) => `Tổng ${total} sản phẩm`,
                        onChange: (page) => fetchStock(page),
                    }}
                    scroll={{ x: 850 }}
                    rowClassName={(r) => {
                        if (r.quantity <= 0) return 'row-out-of-stock';
                        if (r.quantity <= r.minStock) return 'row-low-stock';
                        return '';
                    }}
                />
            </Card>

            {/* Modal Lịch sử xuất nhập */}
            <Modal
                title={
                    historyData ? (
                        <div>
                            <span>Lịch sử xuất nhập — </span>
                            <span style={{ color: '#4F46E5' }}>{historyData.product?.sku}</span>
                            <span> {historyData.product?.name}</span>
                            <div style={{ fontSize: 12, color: '#64748B', fontWeight: 400, marginTop: 4 }}>
                                Tồn hiện tại:{' '}
                                <strong
                                    style={{
                                        color:
                                            historyData.product?.quantity <= historyData.product?.minStock
                                                ? '#EF4444'
                                                : '#10B981',
                                    }}
                                >
                                    {historyData.product?.quantity}
                                </strong>{' '}
                                / Tối thiểu: {historyData.product?.minStock} {historyData.product?.unit}
                            </div>
                        </div>
                    ) : (
                        'Lịch sử xuất nhập'
                    )
                }
                open={historyOpen}
                onCancel={() => {
                    setHistoryOpen(false);
                    setHistoryData(null);
                }}
                footer={<Button onClick={() => setHistoryOpen(false)}>Đóng</Button>}
                width={750}
            >
                {historyData && (
                    <Table
                        dataSource={historyData.history}
                        rowKey={(r) => r._id + r.type}
                        size="small"
                        loading={historyLoading}
                        pagination={{ pageSize: 15, showTotal: (t) => `${t} bản ghi` }}
                        columns={[
                            {
                                title: 'Loại',
                                dataIndex: 'type',
                                width: 90,
                                align: 'center',
                                render: (t) =>
                                    t === 'import' ? (
                                        <Tag color="green" icon={<ArrowDownOutlined />}>
                                            Nhập
                                        </Tag>
                                    ) : (
                                        <Tag color="red" icon={<ArrowUpOutlined />}>
                                            Xuất
                                        </Tag>
                                    ),
                            },
                            {
                                title: 'Mã phiếu',
                                dataIndex: 'code',
                                width: 100,
                                render: (code, r) => (
                                    <span
                                        style={{ fontWeight: 600, color: r.type === 'import' ? '#4F46E5' : '#7C3AED' }}
                                    >
                                        {code}
                                    </span>
                                ),
                            },
                            {
                                title: 'Số lượng',
                                dataIndex: 'quantity',
                                width: 80,
                                align: 'center',
                                render: (q, r) => (
                                    <span
                                        className="font-semibold"
                                        style={{ color: r.type === 'import' ? '#10B981' : '#EF4444' }}
                                    >
                                        {r.type === 'import' ? '+' : '-'}
                                        {q}
                                    </span>
                                ),
                            },
                            {
                                title: 'Đơn giá',
                                dataIndex: 'price',
                                width: 120,
                                align: 'right',
                                render: (v) => formatCurrency(v),
                            },
                            {
                                title: 'Thành tiền',
                                dataIndex: 'total',
                                width: 130,
                                align: 'right',
                                render: (v) => <span className="font-semibold">{formatCurrency(v)}</span>,
                            },
                            { title: 'Người tạo', dataIndex: 'createdBy', width: 100, responsive: ['md'] },
                            { title: 'Thời gian', dataIndex: 'createdAt', width: 140, render: (d) => formatDate(d) },
                        ]}
                    />
                )}
            </Modal>
        </div>
    );
};

export default InventoryList;
