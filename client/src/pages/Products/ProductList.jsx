import { useState, useEffect } from 'react';
import {
    Table,
    Button,
    Modal,
    Form,
    Input,
    Select,
    InputNumber,
    Space,
    Tag,
    Popconfirm,
    Card,
    Row,
    Col,
    Descriptions,
    Image,
    Statistic,
    Upload,
    Tabs,
    Switch,
    Divider,
    message,
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    SearchOutlined,
    EyeOutlined,
    ShoppingOutlined,
    WarningOutlined,
    StarOutlined,
    MinusCircleOutlined,
} from '@ant-design/icons';
import axiosClient from '../../api/axiosClient';
import Barcode from 'react-barcode';

const { Option } = Select;
const { TextArea } = Input;

const ProductList = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [editingProduct, setEditingProduct] = useState(null);
    const [searchText, setSearchText] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterSupplier, setFilterSupplier] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [stats, setStats] = useState({});
    const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
    const [fileList, setFileList] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [form] = Form.useForm();

    const fetchProducts = async (page = 1) => {
        setLoading(true);
        try {
            const params = { page, limit: pagination.pageSize };
            if (searchText) params.search = searchText;
            if (filterCategory) params.category = filterCategory;
            if (filterSupplier) params.supplier = filterSupplier;
            if (filterStatus) params.status = filterStatus;
            const res = await axiosClient.get('/products', { params });
            setProducts(res.metadata.products);
            setPagination((prev) => ({ ...prev, current: page, total: res.metadata.total }));
        } catch (error) {
            message.error('Lỗi khi tải sản phẩm');
        } finally {
            setLoading(false);
        }
    };

    const fetchDropdownData = async () => {
        try {
            const [catRes, supRes, statsRes] = await Promise.all([
                axiosClient.get('/categories'),
                axiosClient.get('/suppliers/simple'),
                axiosClient.get('/products/stats'),
            ]);
            setCategories(catRes.metadata);
            setSuppliers(supRes.metadata);
            setStats(statsRes.metadata);
        } catch (error) {
            console.error('Error loading dropdown data:', error);
        }
    };

    useEffect(() => {
        fetchDropdownData();
    }, []);
    useEffect(() => {
        fetchProducts(1);
    }, [searchText, filterCategory, filterSupplier, filterStatus]);

    const uploadImages = async () => {
        const newFiles = fileList.filter((f) => f.originFileObj);
        if (newFiles.length === 0) return fileList.map((f) => f.url).filter(Boolean);
        setUploading(true);
        try {
            const formData = new FormData();
            newFiles.forEach((file) => formData.append('images', file.originFileObj));
            formData.append('folder', 'ql-kho/products');
            const res = await axiosClient.post('/upload/multiple', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const existingUrls = fileList.filter((f) => !f.originFileObj && f.url).map((f) => f.url);
            const newUrls = res.metadata.map((img) => img.url);
            return [...existingUrls, ...newUrls];
        } catch (error) {
            message.error('Upload ảnh thất bại');
            throw error;
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (values) => {
        try {
            const images = await uploadImages();
            const productData = {
                ...values,
                images,
                thumbnail: images[0] || '',
                // Xử lý attributes từ dynamic fields
                attributes: (values.attrList || []).reduce((acc, item) => {
                    if (item?.key && item?.value) acc[item.key] = item.value;
                    return acc;
                }, {}),
            };
            delete productData.attrList;

            if (editingProduct) {
                await axiosClient.put(`/products/${editingProduct._id}`, productData);
                message.success('Cập nhật sản phẩm thành công');
            } else {
                await axiosClient.post('/products', productData);
                message.success('Tạo sản phẩm thành công');
            }
            setModalOpen(false);
            form.resetFields();
            setFileList([]);
            setEditingProduct(null);
            fetchProducts(pagination.current);
            fetchDropdownData();
        } catch (error) {
            message.error(error.response?.data?.message || 'Thao tác thất bại');
        }
    };

    const handleEdit = (record) => {
        setEditingProduct(record);
        // Chuyển attributes object thành mảng cho dynamic fields
        const attrList = record.attributes
            ? Object.entries(record.attributes).map(([key, value]) => ({ key, value }))
            : [];
        form.setFieldsValue({
            ...record,
            category: record.category?._id,
            supplier: record.supplier?._id,
            attrList,
        });
        const existingImages = (record.images || []).map((url, idx) => ({
            uid: `existing-${idx}`,
            name: `Ảnh ${idx + 1}`,
            status: 'done',
            url,
        }));
        setFileList(existingImages);
        setModalOpen(true);
    };

    const handleDelete = async (id) => {
        try {
            await axiosClient.delete(`/products/${id}`);
            message.success('Xóa sản phẩm thành công');
            fetchProducts(pagination.current);
            fetchDropdownData();
        } catch (error) {
            message.error(error.response?.data?.message || 'Xóa thất bại');
        }
    };

    const handleAdd = () => {
        setEditingProduct(null);
        form.resetFields();
        setFileList([]);
        setModalOpen(true);
    };

    const handleView = async (record) => {
        try {
            const res = await axiosClient.get(`/products/${record._id}`);
            setSelectedProduct(res.metadata);
            setDetailOpen(true);
        } catch (error) {
            message.error('Lỗi khi tải chi tiết sản phẩm');
        }
    };

    const formatCurrency = (value) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);

    const statusConfig = {
        active: { color: 'green', text: 'Đang bán' },
        inactive: { color: 'default', text: 'Ngừng bán' },
        out_of_stock: { color: 'red', text: 'Hết hàng' },
    };

    const unitOptions = ['Cái', 'Chiếc', 'Đôi', 'Bộ', 'Hộp', 'Thùng', 'Kg', 'Túi', 'Chai', 'Gói', 'Cuốn', 'Tấm'];

    const columns = [
        {
            title: 'Ảnh',
            dataIndex: 'thumbnail',
            key: 'thumbnail',
            width: 65,
            render: (thumb) =>
                thumb ? (
                    <Image
                        src={thumb}
                        width={44}
                        height={44}
                        style={{ objectFit: 'cover', borderRadius: 8 }}
                        preview={false}
                    />
                ) : (
                    <div
                        style={{
                            width: 44,
                            height: 44,
                            borderRadius: 8,
                            background: '#F1F5F9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#94A3B8',
                            fontSize: 18,
                        }}
                    >
                        <ShoppingOutlined />
                    </div>
                ),
        },
        {
            title: 'Mã SP',
            dataIndex: 'sku',
            key: 'sku',
            width: 95,
            render: (sku) => (
                <span className="font-semibold" style={{ color: '#4F46E5' }}>
                    {sku}
                </span>
            ),
        },
        {
            title: 'Tên sản phẩm',
            dataIndex: 'name',
            key: 'name',
            width: 200,
            ellipsis: true,
            sorter: (a, b) => a.name.localeCompare(b.name),
            render: (name, record) => (
                <div>
                    <div className="font-medium">{name}</div>
                    {record.brand && <span style={{ fontSize: 12, color: '#94A3B8' }}>{record.brand}</span>}
                </div>
            ),
        },
        {
            title: 'Danh mục',
            dataIndex: ['category', 'name'],
            key: 'category',
            width: 120,
            responsive: ['lg'],
        },
        {
            title: 'Giá bán',
            dataIndex: 'salePrice',
            key: 'salePrice',
            width: 120,
            align: 'right',
            sorter: (a, b) => a.salePrice - b.salePrice,
            render: (val, record) => (
                <div>
                    <div className="font-semibold">{formatCurrency(val)}</div>
                    {record.discountPercent > 0 && (
                        <Tag color="red" style={{ fontSize: 11 }}>
                            -{record.discountPercent}%
                        </Tag>
                    )}
                </div>
            ),
        },
        {
            title: 'Tồn kho',
            dataIndex: 'quantity',
            key: 'quantity',
            width: 85,
            align: 'center',
            sorter: (a, b) => a.quantity - b.quantity,
            render: (qty, record) => (
                <span className="font-semibold" style={{ color: qty <= record.minStock ? '#EF4444' : '#1E293B' }}>
                    {qty} <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 400 }}>{record.unit}</span>
                </span>
            ),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            width: 100,
            align: 'center',
            render: (status, record) => (
                <div>
                    <Tag color={statusConfig[status]?.color || 'default'}>{statusConfig[status]?.text || status}</Tag>
                    {record.isFeatured && <StarOutlined style={{ color: '#F59E0B', marginLeft: 4 }} />}
                </div>
            ),
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 120,
            align: 'center',
            render: (_, record) => (
                <Space>
                    <Button
                        type="text"
                        icon={<EyeOutlined />}
                        onClick={() => handleView(record)}
                        style={{ color: '#06B6D4' }}
                    />
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                        style={{ color: '#4F46E5' }}
                    />
                    <Popconfirm
                        title="Xóa sản phẩm"
                        description="Bạn có chắc muốn xóa?"
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

    const uploadProps = {
        fileList,
        onChange: ({ fileList: newList }) => setFileList(newList),
        beforeUpload: () => false,
        listType: 'picture-card',
        accept: 'image/*',
        multiple: true,
        maxCount: 10,
    };

    // ===== FORM TABS =====
    const formTabItems = [
        {
            key: 'basic',
            label: 'Thông tin cơ bản',
            children: (
                <>
                    <Row gutter={16}>
                        <Col span={16}>
                            <Form.Item
                                name="name"
                                label="Tên sản phẩm"
                                rules={[{ required: true, message: 'Vui lòng nhập tên' }]}
                            >
                                <Input placeholder="VD: iPhone 15 Pro Max 256GB" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="brand" label="Thương hiệu">
                                <Input placeholder="VD: Apple, Nike..." />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="category"
                                label="Danh mục"
                                rules={[{ required: true, message: 'Chọn danh mục' }]}
                            >
                                <Select placeholder="Chọn danh mục" showSearch optionFilterProp="children">
                                    {categories.map((c) => (
                                        <Option key={c._id} value={c._id}>
                                            {c.name}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="supplier"
                                label="Nhà cung cấp"
                                rules={[{ required: true, message: 'Chọn NCC' }]}
                            >
                                <Select placeholder="Chọn NCC" showSearch optionFilterProp="children">
                                    {suppliers.map((s) => (
                                        <Option key={s._id} value={s._id}>
                                            {s.name}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={6}>
                            <Form.Item
                                name="importPrice"
                                label="Giá nhập"
                                rules={[{ required: true, message: 'Nhập giá nhập' }]}
                            >
                                <InputNumber
                                    style={{ width: '100%' }}
                                    min={0}
                                    formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    parser={(v) => v.replace(/,/g, '')}
                                    placeholder="0"
                                />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item
                                name="salePrice"
                                label="Giá bán"
                                rules={[{ required: true, message: 'Nhập giá bán' }]}
                            >
                                <InputNumber
                                    style={{ width: '100%' }}
                                    min={0}
                                    formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    parser={(v) => v.replace(/,/g, '')}
                                    placeholder="0"
                                />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item name="discountPercent" label="Giảm giá (%)" initialValue={0}>
                                <InputNumber style={{ width: '100%' }} min={0} max={100} placeholder="0" />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item name="minStock" label="Tồn tối thiểu" initialValue={10}>
                                <InputNumber style={{ width: '100%' }} min={0} placeholder="10" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item name="description" label="Mô tả sản phẩm">
                        <TextArea rows={3} placeholder="Mô tả chi tiết sản phẩm..." showCount maxLength={5000} />
                    </Form.Item>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="tags" label="Nhãn (tags)">
                                <Select mode="tags" placeholder="Nhập nhãn và Enter: sale, hot, new..." />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item name="isFeatured" label="Nổi bật" valuePropName="checked" initialValue={false}>
                                <Switch checkedChildren="Có" unCheckedChildren="Không" />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item name="status" label="Trạng thái" initialValue="active">
                                <Select>
                                    <Option value="active">Đang bán</Option>
                                    <Option value="inactive">Ngừng bán</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
                </>
            ),
        },
        {
            key: 'details',
            label: 'Chi tiết & Thuộc tính',
            children: (
                <>
                    <Row gutter={16}>
                        <Col span={6}>
                            <Form.Item name="unit" label="Đơn vị tính" initialValue="Cái">
                                <Select showSearch>
                                    {unitOptions.map((u) => (
                                        <Option key={u} value={u}>
                                            {u}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item name="weight" label="Trọng lượng (g)">
                                <InputNumber style={{ width: '100%' }} min={0} placeholder="0" />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item name="origin" label="Xuất xứ">
                                <Input placeholder="VD: Việt Nam" />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item name="warranty" label="Bảo hành">
                                <Input placeholder="VD: 12 tháng" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item name="barcode" label="Mã vạch / Barcode">
                        <Input placeholder="Nhập mã vạch" style={{ maxWidth: 300 }} />
                    </Form.Item>

                    <Divider orientation="left" style={{ fontSize: 13, color: '#64748B' }}>
                        Thuộc tính linh hoạt
                    </Divider>
                    <p style={{ fontSize: 12, color: '#94A3B8', marginBottom: 12 }}>
                        Thêm thuộc tính đặc thù cho sản phẩm. VD: Điện thoại → RAM, CPU, Màn hình | Giày → Chất liệu,
                        Kiểu dáng | Quần áo → Chất vải, Mùa
                    </p>
                    <Form.List name="attrList">
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map(({ key, name, ...restField }) => (
                                    <Row gutter={12} key={key} align="middle" style={{ marginBottom: 8 }}>
                                        <Col span={10}>
                                            <Form.Item
                                                {...restField}
                                                name={[name, 'key']}
                                                noStyle
                                                rules={[{ required: true, message: 'Nhập tên' }]}
                                            >
                                                <Input placeholder="Tên thuộc tính (VD: RAM)" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item
                                                {...restField}
                                                name={[name, 'value']}
                                                noStyle
                                                rules={[{ required: true, message: 'Nhập giá trị' }]}
                                            >
                                                <Input placeholder="Giá trị (VD: 8GB)" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={2}>
                                            <MinusCircleOutlined
                                                onClick={() => remove(name)}
                                                style={{ color: '#EF4444', fontSize: 18, cursor: 'pointer' }}
                                            />
                                        </Col>
                                    </Row>
                                ))}
                                <Button
                                    type="dashed"
                                    onClick={() => add()}
                                    icon={<PlusOutlined />}
                                    block
                                    style={{ marginTop: 4 }}
                                >
                                    Thêm thuộc tính
                                </Button>
                            </>
                        )}
                    </Form.List>
                </>
            ),
        },
        {
            key: 'images',
            label: 'Hình ảnh',
            children: (
                <div>
                    <Upload {...uploadProps}>
                        {fileList.length < 10 && (
                            <div>
                                <PlusOutlined />
                                <div style={{ marginTop: 8, fontSize: 13, color: '#64748B' }}>Tải ảnh lên</div>
                            </div>
                        )}
                    </Upload>
                    <p style={{ marginTop: 12, fontSize: 12, color: '#94A3B8' }}>
                        Ảnh đầu tiên sẽ là ảnh đại diện. Tối đa 10 ảnh, mỗi ảnh ≤ 5MB. Hỗ trợ JPG, PNG, WEBP.
                    </p>
                </div>
            ),
        },
    ];

    return (
        <div>
            <div className="page-header">
                <h2>Quản lý sản phẩm</h2>
                <p>Quản lý thông tin sản phẩm trong kho hàng</p>
            </div>

            {/* Stats */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={12} sm={6}>
                    <div className="stat-card">
                        <Statistic
                            title={<span style={{ color: '#64748B', fontSize: 12 }}>Tổng SP</span>}
                            value={stats.totalProducts || 0}
                            prefix={<ShoppingOutlined style={{ color: '#4F46E5' }} />}
                            valueStyle={{ fontSize: 20, fontWeight: 700 }}
                        />
                    </div>
                </Col>
                <Col xs={12} sm={6}>
                    <div className="stat-card">
                        <Statistic
                            title={<span style={{ color: '#64748B', fontSize: 12 }}>Sắp hết</span>}
                            value={stats.lowStock || 0}
                            prefix={<WarningOutlined style={{ color: '#F59E0B' }} />}
                            valueStyle={{ fontSize: 20, fontWeight: 700, color: '#F59E0B' }}
                        />
                    </div>
                </Col>
                <Col xs={12} sm={6}>
                    <div className="stat-card">
                        <Statistic
                            title={<span style={{ color: '#64748B', fontSize: 12 }}>Hết hàng</span>}
                            value={stats.outOfStock || 0}
                            prefix={<WarningOutlined style={{ color: '#EF4444' }} />}
                            valueStyle={{ fontSize: 20, fontWeight: 700, color: '#EF4444' }}
                        />
                    </div>
                </Col>
                <Col xs={12} sm={6}>
                    <div className="stat-card">
                        <Statistic
                            title={<span style={{ color: '#64748B', fontSize: 12 }}>Giá trị kho</span>}
                            value={stats.totalImportValue || 0}
                            formatter={(val) => formatCurrency(val)}
                            valueStyle={{ fontSize: 16, fontWeight: 700, color: '#10B981' }}
                        />
                    </div>
                </Col>
            </Row>

            <Card>
                {/* Toolbar */}
                <div className="flex justify-between items-center" style={{ marginBottom: 16 }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#1E293B' }}>Danh sách sản phẩm</h3>
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                        Thêm sản phẩm
                    </Button>
                </div>

                {/* Filters */}
                <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
                    <Col xs={24} sm={12} md={6}>
                        <Input
                            placeholder="Tìm kiếm SP..."
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
                            placeholder="Nhà cung cấp"
                            value={filterSupplier || undefined}
                            onChange={(v) => setFilterSupplier(v || '')}
                            allowClear
                            style={{ width: '100%' }}
                        >
                            {suppliers.map((s) => (
                                <Option key={s._id} value={s._id}>
                                    {s.name}
                                </Option>
                            ))}
                        </Select>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Select
                            placeholder="Trạng thái"
                            value={filterStatus || undefined}
                            onChange={(v) => setFilterStatus(v || '')}
                            allowClear
                            style={{ width: '100%' }}
                        >
                            <Option value="active">Đang bán</Option>
                            <Option value="inactive">Ngừng bán</Option>
                            <Option value="out_of_stock">Hết hàng</Option>
                        </Select>
                    </Col>
                </Row>

                <Table
                    columns={columns}
                    dataSource={products}
                    rowKey="_id"
                    loading={loading}
                    pagination={{
                        ...pagination,
                        showSizeChanger: false,
                        showTotal: (total) => `Tổng ${total} sản phẩm`,
                        onChange: (page) => fetchProducts(page),
                    }}
                    locale={{ emptyText: 'Chưa có sản phẩm nào' }}
                    scroll={{ x: 950 }}
                />
            </Card>

            {/* Modal Thêm/Sửa */}
            <Modal
                title={editingProduct ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}
                open={modalOpen}
                onCancel={() => {
                    setModalOpen(false);
                    form.resetFields();
                    setEditingProduct(null);
                    setFileList([]);
                }}
                footer={null}
                destroyOnClose
                width={780}
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false} className="mt-2">
                    <Tabs items={formTabItems} size="small" />
                    <div
                        className="flex justify-end gap-2"
                        style={{ marginTop: 16, borderTop: '1px solid #E2E8F0', paddingTop: 16 }}
                    >
                        <Button
                            onClick={() => {
                                setModalOpen(false);
                                form.resetFields();
                                setFileList([]);
                            }}
                        >
                            Hủy
                        </Button>
                        <Button type="primary" htmlType="submit" loading={uploading}>
                            {editingProduct ? 'Cập nhật' : 'Tạo mới'}
                        </Button>
                    </div>
                </Form>
            </Modal>

            {/* Modal Chi tiết */}
            <Modal
                title={
                    <div className="flex items-center gap-2">
                        Chi tiết sản phẩm
                        {selectedProduct?.isFeatured && (
                            <Tag color="gold" icon={<StarOutlined />}>
                                Nổi bật
                            </Tag>
                        )}
                    </div>
                }
                open={detailOpen}
                onCancel={() => setDetailOpen(false)}
                footer={<Button onClick={() => setDetailOpen(false)}>Đóng</Button>}
                width={780}
            >
                {selectedProduct && (
                    <div className="mt-4">
                        {/* Gallery ảnh + Barcode */}
                        <div className="flex gap-4 flex-wrap" style={{ marginBottom: 20 }}>
                            {selectedProduct.images && selectedProduct.images.length > 0 && (
                                <Image.PreviewGroup>
                                    <div className="flex gap-2 flex-wrap">
                                        {selectedProduct.images.map((img, idx) => (
                                            <Image
                                                key={idx}
                                                src={img}
                                                width={90}
                                                height={90}
                                                style={{
                                                    objectFit: 'cover',
                                                    borderRadius: 8,
                                                    border: '1px solid #E2E8F0',
                                                }}
                                            />
                                        ))}
                                    </div>
                                </Image.PreviewGroup>
                            )}
                            <div
                                style={{
                                    textAlign: 'center',
                                    padding: '8px 16px',
                                    background: '#F8FAFC',
                                    borderRadius: 8,
                                    border: '1px solid #E2E8F0',
                                }}
                            >
                                <Barcode
                                    value={selectedProduct.barcode || selectedProduct.sku}
                                    width={1.5}
                                    height={45}
                                    fontSize={12}
                                    margin={5}
                                    displayValue={true}
                                />
                            </div>
                        </div>

                        <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
                            <Descriptions.Item label="Mã SP">{selectedProduct.sku}</Descriptions.Item>
                            <Descriptions.Item label="Tên SP">{selectedProduct.name}</Descriptions.Item>
                            <Descriptions.Item label="Thương hiệu">{selectedProduct.brand || '—'}</Descriptions.Item>
                            <Descriptions.Item label="Danh mục">
                                {selectedProduct.category?.name || '—'}
                            </Descriptions.Item>
                            <Descriptions.Item label="NCC">{selectedProduct.supplier?.name || '—'}</Descriptions.Item>
                            <Descriptions.Item label="Đơn vị">{selectedProduct.unit || '—'}</Descriptions.Item>
                            <Descriptions.Item label="Giá nhập">
                                {formatCurrency(selectedProduct.importPrice)}
                            </Descriptions.Item>
                            <Descriptions.Item label="Giá bán">
                                {formatCurrency(selectedProduct.salePrice)}
                                {selectedProduct.discountPercent > 0 && (
                                    <Tag color="red" style={{ marginLeft: 8 }}>
                                        -{selectedProduct.discountPercent}%
                                    </Tag>
                                )}
                            </Descriptions.Item>
                            <Descriptions.Item label="Tồn kho">
                                {selectedProduct.quantity} {selectedProduct.unit}
                            </Descriptions.Item>
                            <Descriptions.Item label="Tồn tối thiểu">{selectedProduct.minStock}</Descriptions.Item>
                            <Descriptions.Item label="Trọng lượng">
                                {selectedProduct.weight ? `${selectedProduct.weight}g` : '—'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Xuất xứ">{selectedProduct.origin || '—'}</Descriptions.Item>
                            <Descriptions.Item label="Bảo hành">{selectedProduct.warranty || '—'}</Descriptions.Item>
                            <Descriptions.Item label="Mã vạch">{selectedProduct.barcode || '—'}</Descriptions.Item>
                            <Descriptions.Item label="Trạng thái">
                                <Tag color={statusConfig[selectedProduct.status]?.color}>
                                    {statusConfig[selectedProduct.status]?.text}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Lượt xem">{selectedProduct.viewCount || 0}</Descriptions.Item>
                        </Descriptions>

                        {/* Thuộc tính linh hoạt */}
                        {selectedProduct.attributes && Object.keys(selectedProduct.attributes).length > 0 && (
                            <>
                                <Divider orientation="left" style={{ fontSize: 13 }}>
                                    Thuộc tính sản phẩm
                                </Divider>
                                <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
                                    {Object.entries(selectedProduct.attributes).map(([key, value]) => (
                                        <Descriptions.Item key={key} label={key}>
                                            {String(value)}
                                        </Descriptions.Item>
                                    ))}
                                </Descriptions>
                            </>
                        )}

                        {/* Tags */}
                        {selectedProduct.tags && selectedProduct.tags.length > 0 && (
                            <div style={{ marginBottom: 16 }}>
                                <span style={{ fontSize: 13, color: '#64748B', marginRight: 8 }}>Nhãn:</span>
                                {selectedProduct.tags.map((tag) => (
                                    <Tag key={tag} color="blue">
                                        {tag}
                                    </Tag>
                                ))}
                            </div>
                        )}

                        {/* Biến thể */}
                        {selectedProduct.hasVariants && selectedProduct.variants?.length > 0 && (
                            <>
                                <Divider orientation="left" style={{ fontSize: 13 }}>
                                    Biến thể ({selectedProduct.variants.length})
                                </Divider>
                                <Table
                                    dataSource={selectedProduct.variants}
                                    rowKey="_id"
                                    size="small"
                                    pagination={false}
                                    columns={[
                                        { title: 'SKU', dataIndex: 'sku', width: 100 },
                                        { title: 'Tên biến thể', dataIndex: 'name' },
                                        {
                                            title: 'Giá nhập',
                                            dataIndex: 'importPrice',
                                            render: (v) => formatCurrency(v),
                                            width: 120,
                                            align: 'right',
                                        },
                                        {
                                            title: 'Giá bán',
                                            dataIndex: 'salePrice',
                                            render: (v) => formatCurrency(v),
                                            width: 120,
                                            align: 'right',
                                        },
                                        { title: 'Tồn kho', dataIndex: 'quantity', width: 80, align: 'center' },
                                        {
                                            title: 'Trạng thái',
                                            dataIndex: 'isActive',
                                            width: 90,
                                            align: 'center',
                                            render: (v) => <Tag color={v ? 'green' : 'red'}>{v ? 'Bật' : 'Tắt'}</Tag>,
                                        },
                                    ]}
                                />
                            </>
                        )}

                        {/* Mô tả */}
                        {selectedProduct.description && (
                            <>
                                <Divider orientation="left" style={{ fontSize: 13 }}>
                                    Mô tả
                                </Divider>
                                <p style={{ color: '#475569', whiteSpace: 'pre-wrap' }}>
                                    {selectedProduct.description}
                                </p>
                            </>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default ProductList;
