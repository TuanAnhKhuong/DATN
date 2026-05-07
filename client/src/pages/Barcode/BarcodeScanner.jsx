import { useState, useEffect, useRef } from 'react';
import { Card, Input, Button, Descriptions, Tag, Image, Space, Row, Col, Divider, Empty, message } from 'antd';
import { ScanOutlined, SearchOutlined, ShoppingOutlined, PrinterOutlined } from '@ant-design/icons';
import Barcode from 'react-barcode';
import axiosClient from '../../api/axiosClient';

const BarcodeScanner = () => {
    const [scanning, setScanning] = useState(false);
    const [manualCode, setManualCode] = useState('');
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(false);
    const scannerRef = useRef(null);
    const html5QrCodeRef = useRef(null);

    const formatCurrency = (value) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);

    const statusConfig = {
        active: { color: 'green', text: 'Đang bán' },
        inactive: { color: 'default', text: 'Ngừng bán' },
        out_of_stock: { color: 'red', text: 'Hết hàng' },
        draft: { color: 'orange', text: 'Nháp' },
    };

    // Tìm sản phẩm qua barcode/SKU
    const lookupProduct = async (code) => {
        if (!code) return;
        setLoading(true);
        try {
            const res = await axiosClient.get(`/products/barcode/${code}`);
            setProduct(res.metadata);
            message.success('Tìm thấy sản phẩm!');
        } catch (error) {
            setProduct(null);
            message.error(error.response?.data?.message || 'Không tìm thấy sản phẩm');
        } finally {
            setLoading(false);
        }
    };

    // Bật camera quét mã vạch
    const startScanner = async () => {
        setScanning(true);
        try {
            const { Html5Qrcode } = await import('html5-qrcode');
            // Chờ DOM render rồi mới init
            setTimeout(async () => {
                const scanner = new Html5Qrcode('barcode-reader');
                html5QrCodeRef.current = scanner;
                await scanner.start(
                    { facingMode: 'environment' },
                    {
                        fps: 10,
                        qrbox: { width: 300, height: 150 },
                        aspectRatio: 1.777,
                    },
                    (decodedText) => {
                        // Quét thành công
                        stopScanner();
                        setManualCode(decodedText);
                        lookupProduct(decodedText);
                    },
                    () => {}, // Ignore errored scan
                );
            }, 300);
        } catch (error) {
            message.error('Không thể mở camera. Hãy cấp quyền camera cho trình duyệt.');
            setScanning(false);
        }
    };

    const stopScanner = async () => {
        if (html5QrCodeRef.current) {
            try {
                await html5QrCodeRef.current.stop();
                html5QrCodeRef.current.clear();
            } catch (e) { /* ignored */ }
            html5QrCodeRef.current = null;
        }
        setScanning(false);
    };

    useEffect(() => {
        return () => { stopScanner(); };
    }, []);

    // In mã vạch
    const handlePrint = () => {
        const printContent = document.getElementById('barcode-print-area');
        if (!printContent) return;
        const win = window.open('', '', 'width=400,height=300');
        win.document.write(`
            <html>
            <head><title>In mã vạch</title>
            <style>
                body { display: flex; flex-direction: column; align-items: center; justify-content: center; 
                       min-height: 100vh; margin: 0; font-family: Arial, sans-serif; }
                .product-name { font-size: 14px; font-weight: bold; margin-bottom: 4px; text-align: center; }
                .product-price { font-size: 12px; color: #666; margin-bottom: 8px; }
            </style>
            </head>
            <body>
                ${printContent.innerHTML}
            </body>
            </html>
        `);
        win.document.close();
        win.print();
        win.close();
    };

    return (
        <div>
            <div className="page-header">
                <h2>Quét mã vạch</h2>
                <p>Quét mã vạch hoặc nhập mã để tra cứu sản phẩm</p>
            </div>

            <Row gutter={[24, 24]}>
                {/* Cột trái: Scanner + Input */}
                <Col xs={24} lg={10}>
                    <Card>
                        <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: '#1E293B' }}>
                            Nhập hoặc quét mã
                        </h3>

                        <Space.Compact style={{ width: '100%', marginBottom: 16 }}>
                            <Input
                                placeholder="Nhập mã vạch hoặc mã SP..."
                                prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
                                value={manualCode}
                                onChange={(e) => setManualCode(e.target.value)}
                                onPressEnter={() => lookupProduct(manualCode)}
                                size="large"
                                allowClear
                            />
                            <Button type="primary" size="large" loading={loading}
                                onClick={() => lookupProduct(manualCode)}>
                                Tìm
                            </Button>
                        </Space.Compact>

                        {!scanning ? (
                            <Button icon={<ScanOutlined />} block size="large" onClick={startScanner}
                                style={{ borderColor: '#4F46E5', color: '#4F46E5' }}>
                                Mở camera quét mã vạch
                            </Button>
                        ) : (
                            <div>
                                <div id="barcode-reader" style={{ width: '100%', borderRadius: 8, overflow: 'hidden', marginBottom: 12 }} />
                                <Button danger block onClick={stopScanner}>Tắt camera</Button>
                            </div>
                        )}
                    </Card>
                </Col>

                {/* Cột phải: Kết quả */}
                <Col xs={24} lg={14}>
                    {product ? (
                        <Card>
                            <div className="flex justify-between items-start" style={{ marginBottom: 16 }}>
                                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#1E293B' }}>
                                    Thông tin sản phẩm
                                </h3>
                                <Button icon={<PrinterOutlined />} onClick={handlePrint}>
                                    In mã vạch
                                </Button>
                            </div>

                            {/* Ảnh + Mã vạch */}
                            <div className="flex gap-4 flex-wrap" style={{ marginBottom: 16 }}>
                                {product.thumbnail && (
                                    <Image src={product.thumbnail} width={120} height={120}
                                        style={{ objectFit: 'cover', borderRadius: 8, border: '1px solid #E2E8F0' }} />
                                )}
                                <div id="barcode-print-area" style={{ textAlign: 'center' }}>
                                    <div className="product-name">{product.name}</div>
                                    <div className="product-price">{formatCurrency(product.salePrice)}</div>
                                    <Barcode
                                        value={product.barcode || product.sku}
                                        width={1.5}
                                        height={50}
                                        fontSize={13}
                                        margin={5}
                                        displayValue={true}
                                    />
                                </div>
                            </div>

                            <Descriptions column={2} bordered size="small">
                                <Descriptions.Item label="Mã SP">{product.sku}</Descriptions.Item>
                                <Descriptions.Item label="Mã vạch">{product.barcode || '—'}</Descriptions.Item>
                                <Descriptions.Item label="Tên SP" span={2}>{product.name}</Descriptions.Item>
                                <Descriptions.Item label="Thương hiệu">{product.brand || '—'}</Descriptions.Item>
                                <Descriptions.Item label="Danh mục">{product.category?.name || '—'}</Descriptions.Item>
                                <Descriptions.Item label="Giá nhập">{formatCurrency(product.importPrice)}</Descriptions.Item>
                                <Descriptions.Item label="Giá bán">
                                    <span className="font-semibold" style={{ color: '#4F46E5' }}>
                                        {formatCurrency(product.salePrice)}
                                    </span>
                                    {product.discountPercent > 0 && (
                                        <Tag color="red" style={{ marginLeft: 8 }}>-{product.discountPercent}%</Tag>
                                    )}
                                </Descriptions.Item>
                                <Descriptions.Item label="Tồn kho">
                                    <span style={{ color: product.quantity <= product.minStock ? '#EF4444' : '#1E293B', fontWeight: 600 }}>
                                        {product.quantity} {product.unit}
                                    </span>
                                </Descriptions.Item>
                                <Descriptions.Item label="Trạng thái">
                                    <Tag color={statusConfig[product.status]?.color}>
                                        {statusConfig[product.status]?.text}
                                    </Tag>
                                </Descriptions.Item>
                                <Descriptions.Item label="NCC">{product.supplier?.name || '—'}</Descriptions.Item>
                                <Descriptions.Item label="Xuất xứ">{product.origin || '—'}</Descriptions.Item>
                            </Descriptions>

                            {/* Thuộc tính */}
                            {product.attributes && Object.keys(product.attributes).length > 0 && (
                                <>
                                    <Divider orientation="left" style={{ fontSize: 13 }}>Thuộc tính</Divider>
                                    <div className="flex gap-2 flex-wrap">
                                        {Object.entries(product.attributes).map(([key, value]) => (
                                            <Tag key={key} color="blue">{key}: {String(value)}</Tag>
                                        ))}
                                    </div>
                                </>
                            )}
                        </Card>
                    ) : (
                        <Card>
                            <Empty
                                image={<ShoppingOutlined style={{ fontSize: 48, color: '#CBD5E1' }} />}
                                description={<span style={{ color: '#94A3B8' }}>Nhập hoặc quét mã vạch để tra cứu sản phẩm</span>}
                            />
                        </Card>
                    )}
                </Col>
            </Row>
        </div>
    );
};

export default BarcodeScanner;
