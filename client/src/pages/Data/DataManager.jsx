import { useState } from 'react';
import { Card, Button, Row, Col, Upload, Table, Tag, Space, Select, message, Modal, Descriptions, Input } from 'antd';
import {
    DownloadOutlined,
    UploadOutlined,
    FileExcelOutlined,
    ShoppingOutlined,
    ImportOutlined,
    ExportOutlined,
    TeamOutlined,
    CheckCircleOutlined,
    WarningOutlined,
} from '@ant-design/icons';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import axiosClient from '../../api/axiosClient';

const DataManager = () => {
    const [importing, setImporting] = useState(false);
    const [previewData, setPreviewData] = useState(null);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewType, setPreviewType] = useState('');
    const [importResult, setImportResult] = useState(null);

    // Export Modal States
    const [exportModalOpen, setExportModalOpen] = useState(false);
    const [productsList, setProductsList] = useState([]);
    const [selectedProductKeys, setSelectedProductKeys] = useState([]);
    const [exportSearchText, setExportSearchText] = useState('');

    const formatCurrency = (v) => new Intl.NumberFormat('vi-VN').format(v || 0);

    // ==================== EXPORT ====================
    const openExportModal = async () => {
        try {
            message.loading({ content: 'Đang tải danh sách sản phẩm...', key: 'export' });
            const res = await axiosClient.get('/products', { params: { limit: 9999 } });
            const products = res.metadata.products || res.metadata;
            setProductsList(products);
            setSelectedProductKeys([]); // Không tự động chọn tất cả
            setExportModalOpen(true);
            message.success({ content: 'Sẵn sàng export', key: 'export' });
        } catch (e) {
            message.error({ content: 'Tải danh sách thất bại', key: 'export' });
        }
    };
    const exportAllProducts = async () => {
    try {
        message.loading({
            content: 'Đang xuất toàn bộ sản phẩm...',
            key: 'export',
        });

        const res = await axiosClient.get(
            '/products',
            { params: { limit: 9999 } }
        );

        const products =
            res.metadata.products ||
            res.metadata;

        const data = products.map((p, i) => ({
            STT: i + 1,
            'Mã SP': p.sku,
            'Tên sản phẩm': p.name,
            'Danh mục': p.category?.name || '',
            'Nhà cung cấp': p.supplier?.name || '',
            'Tồn kho': p.quantity,
            'Giá nhập': p.importPrice,
            'Giá bán': p.salePrice,
        }));

        downloadExcel(
            data,
            'Danh_sach_san_pham'
        );

        message.success({
            content: `Đã xuất ${data.length} sản phẩm`,
            key: 'export',
        });

    } catch {
        message.error({
            content: 'Xuất thất bại',
            key: 'export',
        });
        }
    };
    const handleConfirmExport = () => {
        const selected = productsList.filter((p) => selectedProductKeys.includes(p._id));
        if (selected.length === 0) {
            message.warning('Vui lòng chọn ít nhất 1 sản phẩm để xuất');
            return;
        }

        // Chỉ xuất các cột phục vụ cho việc cập nhật số lượng tồn kho
        const data = selected.map((p, i) => ({
            STT: i + 1,
            'Mã SP': p.sku,
            'Tên sản phẩm': p.name,
            'Tồn kho hiện tại': p.quantity,
            'Số lượng nhập thêm': 0, // Cột dành để người dùng nhập số để cộng thêm vào kho
        }));

        downloadExcel(data, 'Danh_sach_cap_nhat_ton_kho');
        setExportModalOpen(false);
        message.success({ content: `Đã xuất ${data.length} sản phẩm để cập nhật`, key: 'export' });
    };

    const exportImports = async () => {
        try {
            message.loading({ content: 'Đang xuất dữ liệu...', key: 'export' });
            const res = await axiosClient.get('/imports', { params: { limit: 9999 } });
            const imports = res.metadata.imports;

            const data = imports.map((d, i) => ({
                STT: i + 1,
                'Mã phiếu': d.code,
                'Nhà cung cấp': d.supplier?.name || '',
                'Số SP': d.items?.length || 0,
                'Tổng SL': d.totalItems,
                'Tổng tiền': d.totalAmount,
                'Trạng thái':
                    d.status === 'completed'
                        ? 'Đã nhập'
                        : d.status === 'pending'
                          ? 'Chờ duyệt'
                          : d.status === 'cancelled'
                            ? 'Đã hủy'
                            : d.status,
                'Ngày tạo': new Date(d.createdAt).toLocaleDateString('vi-VN'),
            }));

            downloadExcel(data, 'Phieu_nhap_kho');
            message.success({ content: `Đã xuất ${data.length} phiếu nhập`, key: 'export' });
        } catch (e) {
            message.error({ content: 'Xuất thất bại', key: 'export' });
        }
    };

    const exportExports = async () => {
        try {
            message.loading({ content: 'Đang xuất dữ liệu...', key: 'export' });
            const res = await axiosClient.get('/exports', { params: { limit: 9999 } });
            const exports = res.metadata.exports;

            const typeLabels = {
                sale: 'Bán hàng',
                return_supplier: 'Trả NCC',
                damaged: 'Hàng hỏng',
                transfer: 'Chuyển kho',
                other: 'Khác',
            };
            const data = exports.map((d, i) => ({
                STT: i + 1,
                'Mã phiếu': d.code,
                'Loại xuất': typeLabels[d.type] || d.type,
                'Người nhận': d.receiver || '',
                'Số SP': d.items?.length || 0,
                'Tổng SL': d.totalItems,
                'Tổng tiền': d.totalAmount,
                'Trạng thái':
                    d.status === 'completed'
                        ? 'Đã xuất'
                        : d.status === 'pending'
                          ? 'Chờ duyệt'
                          : d.status === 'cancelled'
                            ? 'Đã hủy'
                            : d.status,
                'Ngày tạo': new Date(d.createdAt).toLocaleDateString('vi-VN'),
            }));

            downloadExcel(data, 'Phieu_xuat_kho');
            message.success({ content: `Đã xuất ${data.length} phiếu xuất`, key: 'export' });
        } catch (e) {
            message.error({ content: 'Xuất thất bại', key: 'export' });
        }
    };

    const exportInventory = async () => {
        try {
            message.loading({ content: 'Đang xuất dữ liệu...', key: 'export' });
            const res = await axiosClient.get('/inventory/stock', { params: { limit: 9999 } });
            const products = res.metadata.products;

            const data = products.map((p, i) => ({
                STT: i + 1,
                'Mã SP': p.sku,
                'Tên sản phẩm': p.name,
                'Thương hiệu': p.brand || '',
                'Danh mục': p.category?.name || '',
                'Tồn kho': p.quantity,
                'Tối thiểu': p.minStock,
                'Đơn vị': p.unit || 'Chiếc',
                'Giá nhập': p.importPrice,
                'Giá bán': p.salePrice,
                'Giá trị tồn': p.importPrice * p.quantity,
                'Trạng thái': p.quantity <= 0 ? 'Hết hàng' : p.quantity <= p.minStock ? 'Sắp hết' : 'Đủ hàng',
            }));

            downloadExcel(data, 'Ton_kho');
            message.success({ content: `Đã xuất ${data.length} sản phẩm`, key: 'export' });
        } catch (e) {
            message.error({ content: 'Xuất thất bại', key: 'export' });
        }
    };

    // ==================== IMPORT ====================
    const handleFileUpload = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const wb = XLSX.read(e.target.result, { type: 'array' });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(ws);

                if (jsonData.length === 0) {
                    message.warning('File Excel không có dữ liệu');
                    return;
                }

                setPreviewData(jsonData);
                setPreviewType('products');
                setPreviewOpen(true);
            } catch (err) {
                message.error('File không hợp lệ. Vui lòng kiểm tra lại');
            }
        };
        reader.readAsArrayBuffer(file);
        return false; // prevent auto upload
    };

    const handleImportProducts = async () => {
    if (!previewData || previewData.length === 0) return;

    setImporting(true);

    let success = 0;
    let failed = 0;
    const errors = [];

    let allProductsMap = [];

    try {
        const res = await axiosClient.get('/products', {
            params: { limit: 9999 },
        });

        allProductsMap =
            res.metadata.products ||
            res.metadata ||
            [];

    } catch {
        message.error(
            'Không tải được danh sách sản phẩm'
        );

        setImporting(false);
        return;
    }

    try {

        const items = [];

        for (const row of previewData) {

            const sku =
                (row['Mã SP'] ||
                    row['sku'] ||
                    '')
                    .toString()
                    .trim();

            const name =
                (row['Tên sản phẩm'] ||
                    row['name'] ||
                    '')
                    .toString()
                    .trim();

            const quantity = Number(
                row['Số lượng nhập thêm'] ||
                row['Tồn kho'] ||
                row['quantity'] ||
                0
            );

            if (quantity <= 0)
                continue;

            let product = null;

            if (sku) {
                product =
                    allProductsMap.find(
                        p => p.sku === sku
                    );
            }

            if (!product && name) {
                product =
                    allProductsMap.find(
                        p =>
                        p.name
                        ?.trim()
                        .toLowerCase()
                        ===
                        name
                        .trim()
                        .toLowerCase()
                    );
            }

            if (!product) {

                failed++;

                errors.push(
                    `Không tìm thấy ${
                        sku || name
                    }`
                );

                continue;
            }

            items.push({

                product:
                    product._id,

                quantity,

                importPrice:
                    product.importPrice || 0,

                totalPrice:
                    quantity *
                    (product.importPrice || 0)

            });

            success++;
        }

        if (items.length === 0) {

            message.warning(
                'Không có dữ liệu hợp lệ'
            );

            return;
        }

        // lấy supplier đầu tiên

        const firstProduct =
            allProductsMap.find(
                p =>
                p._id ===
                items[0].product
            );

        await axiosClient.post(
            '/imports',
            {

                supplier:
                    firstProduct
                    ?.supplier?._id ||
                    firstProduct
                    ?.supplier,

                items,

                totalItems:
                    items.reduce(
                        (a,b)=>
                        a+b.quantity,
                        0
                    ),

                totalAmount:
                    items.reduce(
                        (a,b)=>
                        a+b.totalPrice,
                        0
                    ),

                status:
                    'completed',

                importDate:
                    new Date(),

                note:
                'Nhập kho hàng loạt từ Excel'

            }
        );

        setImportResult({
            success,
            failed,
            errors
        });

        setPreviewOpen(false);

        message.success(
            `Đã nhập ${success} sản phẩm`
        );

        } catch(e){

             message.error(
            e.response?.data?.message ||
            'Import thất bại'
        );

        } finally {

        setImporting(false);

        }
    };

    // ==================== UTILS ====================
    const downloadExcel = (data, filename) => {
        const ws = XLSX.utils.json_to_sheet(data);

        // Auto width
        const colWidths = Object.keys(data[0] || {}).map((key) => {
            const maxLen = Math.max(key.length, ...data.map((r) => String(r[key] || '').length));
            return { wch: Math.min(maxLen + 2, 40) };
        });
        ws['!cols'] = colWidths;

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Data');
        const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        saveAs(
            new Blob([buf], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
            }),
            `${filename}_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.xlsx`,
        );
    };

    const downloadTemplate = openExportModal;

    const exportCards = [
        {
            title: 'Sản phẩm',
            desc: 'Xuất toàn bộ danh sách sản phẩm',
            icon: <ShoppingOutlined />,
            color: '#4F46E5',
            action: exportAllProducts,
        },
        {
            title: 'Phiếu nhập kho',
            desc: 'Xuất danh sách phiếu nhập',
            icon: <ImportOutlined />,
            color: '#10B981',
            action: exportImports,
        },
        {
            title: 'Phiếu xuất kho',
            desc: 'Xuất danh sách phiếu xuất',
            icon: <ExportOutlined />,
            color: '#7C3AED',
            action: exportExports,
        },
        {
            title: 'Tồn kho',
            desc: 'Xuất báo cáo tồn kho hiện tại',
            icon: <FileExcelOutlined />,
            color: '#F59E0B',
            action: exportInventory,
        },
    ];

    return (
        <div>
            <div className="page-header">
                <h2>Import / Export dữ liệu</h2>
                <p>Xuất báo cáo Excel và nhập dữ liệu hàng loạt</p>
            </div>

            {/* Export Section */}
            <Card style={{ marginBottom: 24 }}>
                <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600, color: '#1E293B' }}>
                    <DownloadOutlined style={{ marginRight: 8, color: '#4F46E5' }} />
                    Xuất dữ liệu ra Excel
                </h3>
                <Row gutter={[16, 16]}>
                    {exportCards.map((c, i) => (
                        <Col xs={24} sm={12} md={6} key={i}>
                            <Card
                                hoverable
                                size="small"
                                style={{ textAlign: 'center', borderTop: `3px solid ${c.color}` }}
                                onClick={c.action}
                            >
                                <div style={{ fontSize: 28, color: c.color, marginBottom: 8 }}>{c.icon}</div>
                                <div className="font-semibold" style={{ fontSize: 14 }}>
                                    {c.title}
                                </div>
                                <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>{c.desc}</div>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </Card>

            {/* Import Section */}
            <Card>
                <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 600, color: '#1E293B' }}>
                    <UploadOutlined style={{ marginRight: 8, color: '#10B981' }} />
                    Nhập sản phẩm từ Excel
                </h3>
                <p style={{ color: '#94A3B8', fontSize: 13, marginBottom: 16 }}>
                    Upload file Excel (.xlsx) để cập nhật hàng loạt số lượng sản phẩm trong kho. Tải file mẫu nếu cần.
                </p>

                <Space>
                    <Upload accept=".xlsx,.xls" showUploadList={false} beforeUpload={handleFileUpload}>
                        <Button type="primary" icon={<UploadOutlined />}>
                            Chọn file Excel cập nhật tồn kho
                        </Button>
                    </Upload>
                    <Button icon={<DownloadOutlined />} onClick={downloadTemplate}>
                        Tải file mẫu
                    </Button>
                </Space>

                {/* Import result */}
                {importResult && (
                    <Card size="small" style={{ marginTop: 16, background: '#F8FAFC' }}>
                        <Descriptions column={2} size="small">
                            <Descriptions.Item label="Thành công">
                                <Tag color="green" icon={<CheckCircleOutlined />}>
                                    {importResult.success}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Thất bại">
                                <Tag color="red" icon={<WarningOutlined />}>
                                    {importResult.failed}
                                </Tag>
                            </Descriptions.Item>
                        </Descriptions>
                        {importResult.errors.length > 0 && (
                            <div
                                style={{
                                    marginTop: 8,
                                    maxHeight: 150,
                                    overflow: 'auto',
                                    fontSize: 12,
                                    color: '#EF4444',
                                }}
                            >
                                {importResult.errors.map((e, i) => (
                                    <div key={i}>• {e}</div>
                                ))}
                            </div>
                        )}
                    </Card>
                )}
            </Card>

            {/* Preview Modal */}
            <Modal
                title={`Xem trước dữ liệu (${previewData?.length || 0} dòng)`}
                open={previewOpen}
                onCancel={() => setPreviewOpen(false)}
                width={900}
                footer={
                    <Space>
                        <Button onClick={() => setPreviewOpen(false)}>Hủy</Button>
                        <Button
                            type="primary"
                            icon={<UploadOutlined />}
                            loading={importing}
                            onClick={handleImportProducts}
                        >
                            Import {previewData?.length || 0} sản phẩm
                        </Button>
                    </Space>
                }
            >
                {previewData && (
                    <Table
                        dataSource={previewData.slice(0, 50)}
                        rowKey={(_, i) => i}
                        size="small"
                        scroll={{ x: 800, y: 400 }}
                        pagination={false}
                        columns={Object.keys(previewData[0] || {}).map((key) => ({
                            title: key,
                            dataIndex: key,
                            key,
                            ellipsis: true,
                            width: 120,
                            render: (v) =>
                                typeof v === 'number' && v > 10000 ? formatCurrency(v) : v?.toString() || '',
                        }))}
                    />
                )}
                {previewData && previewData.length > 50 && (
                    <div style={{ textAlign: 'center', padding: 8, color: '#94A3B8', fontSize: 12 }}>
                        Hiển thị 50/{previewData.length} dòng đầu
                    </div>
                )}
            </Modal>

            {/* Selection Export Modal */}
            <Modal
                title={`Chọn sản phẩm để xuất Excel (${selectedProductKeys.length}/${productsList.length})`}
                open={exportModalOpen}
                onCancel={() => setExportModalOpen(false)}
                width={800}
                footer={
                    <Space>
                        <Button onClick={() => setExportModalOpen(false)}>Hủy</Button>
                        <Button type="primary" icon={<DownloadOutlined />} onClick={handleConfirmExport}>
                            Xuất {selectedProductKeys.length} sản phẩm
                        </Button>
                    </Space>
                }
            >
                <Input.Search
                    placeholder="Tìm kiếm sản phẩm theo tên hoặc mã SP..."
                    allowClear
                    onChange={(e) => setExportSearchText(e.target.value)}
                    style={{ marginBottom: 16 }}
                />
                <Table
                    rowSelection={{
                        selectedRowKeys: selectedProductKeys,
                        onChange: (selectedKeys) => setSelectedProductKeys(selectedKeys),
                    }}
                    dataSource={productsList.filter(
                        (p) =>
                            !exportSearchText ||
                            p.name.toLowerCase().includes(exportSearchText.toLowerCase()) ||
                            p.sku.toLowerCase().includes(exportSearchText.toLowerCase()),
                    )}
                    rowKey="_id"
                    size="small"
                    pagination={{ pageSize: 10 }}
                    columns={[
                        { title: 'Mã SP', dataIndex: 'sku', key: 'sku', width: 100 },
                        { title: 'Tên sản phẩm', dataIndex: 'name', key: 'name' },
                        { title: 'Tồn kho', dataIndex: 'quantity', key: 'quantity', width: 100 },
                    ]}
                />
            </Modal>
        </div>
    );
};

export default DataManager;
