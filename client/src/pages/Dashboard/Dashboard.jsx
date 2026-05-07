import { useState, useEffect } from 'react';
import { Card, Row, Col, Table, Tag, Spin, Space, Image, Progress, Tooltip, Empty } from 'antd';
import {
    ShoppingOutlined,
    ImportOutlined,
    ExportOutlined,
    WarningOutlined,
    AppstoreOutlined,
    TeamOutlined,
    ArrowUpOutlined,
    ArrowDownOutlined,
    DatabaseOutlined,
    ExclamationCircleOutlined,
    RiseOutlined,
    FallOutlined,
    ClockCircleOutlined,
    DollarOutlined,
    InboxOutlined,
    SendOutlined,
    FireOutlined,
    ThunderboltOutlined,
} from '@ant-design/icons';
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RTooltip,
    ResponsiveContainer,
    Legend,
    PieChart,
    Pie,
    Cell,
} from 'recharts';
import axiosClient from '../../api/axiosClient';

/* ─── Color Palette ─── */
const COLORS = {
    primary: '#6366F1',
    primaryLight: '#EEF2FF',
    success: '#10B981',
    successLight: '#D1FAE5',
    info: '#06B6D4',
    infoLight: '#CFFAFE',
    warning: '#F59E0B',
    warningLight: '#FEF3C7',
    danger: '#EF4444',
    dangerLight: '#FEE2E2',
    purple: '#8B5CF6',
    purpleLight: '#F5F3FF',
    pink: '#EC4899',
    pinkLight: '#FCE7F3',
    slate: '#64748B',
    dark: '#0F172A',
    cardBg: '#FFFFFF',
    pageBg: '#F8FAFC',
};

const PIE_COLORS = [
    '#6366F1',
    '#06B6D4',
    '#10B981',
    '#F59E0B',
    '#EF4444',
    '#8B5CF6',
    '#EC4899',
    '#14B8A6',
    '#F97316',
    '#3B82F6',
];

/* ─── Glassmorphism card style ─── */
const glassCard = {
    background: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.85))',
    backdropFilter: 'blur(20px)',
    borderRadius: 16,
    border: '1px solid rgba(255,255,255,0.6)',
    boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
    transition: 'all 0.3s ease',
};

/* ─── Stat Card Component ─── */
const StatCard = ({ icon, iconBg, iconColor, title, value, suffix, trend, trendLabel, borderColor }) => (
    <div
        style={{
            ...glassCard,
            padding: '20px 20px 16px',
            borderTop: `3px solid ${borderColor || iconColor}`,
            cursor: 'default',
            position: 'relative',
            overflow: 'hidden',
        }}
        className="dashboard-stat-card"
    >
        <div
            style={{
                position: 'absolute',
                top: -20,
                right: -20,
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: iconBg,
                opacity: 0.3,
            }}
        />
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div
                style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: iconBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                    color: iconColor,
                    flexShrink: 0,
                }}
            >
                {icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: COLORS.slate, fontWeight: 500, marginBottom: 4 }}>{title}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.dark, lineHeight: 1.1 }}>
                    {value}
                    {suffix && (
                        <span style={{ fontSize: 13, fontWeight: 500, color: COLORS.slate, marginLeft: 4 }}>
                            {suffix}
                        </span>
                    )}
                </div>
                {trend !== undefined && trend !== 0 && (
                    <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 2,
                                fontSize: 12,
                                fontWeight: 600,
                                color: trend > 0 ? COLORS.success : COLORS.danger,
                                background: trend > 0 ? COLORS.successLight : COLORS.dangerLight,
                                padding: '2px 8px',
                                borderRadius: 20,
                            }}
                        >
                            {trend > 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                            {Math.abs(trend)}%
                        </span>
                        {trendLabel && <span style={{ fontSize: 11, color: COLORS.slate }}>{trendLabel}</span>}
                    </div>
                )}
            </div>
        </div>
    </div>
);

/* ─── Section Title Component ─── */
const SectionTitle = ({ icon, title, subtitle }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.dark }}>{title}</div>
            {subtitle && <div style={{ fontSize: 12, color: COLORS.slate }}>{subtitle}</div>}
        </div>
    </div>
);

/* ─── Custom Tooltip for Charts ─── */
const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload) return null;
    return (
        <div
            style={{
                background: 'rgba(15, 23, 42, 0.9)',
                backdropFilter: 'blur(10px)',
                borderRadius: 10,
                padding: '10px 14px',
                border: 'none',
                boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            }}
        >
            <div style={{ color: '#fff', fontWeight: 600, fontSize: 12, marginBottom: 6 }}>
                Tháng {label?.replace('T', '')}
            </div>
            {payload.map((p, i) => (
                <div
                    key={i}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 12,
                        color: '#E2E8F0',
                        marginBottom: 2,
                    }}
                >
                    <span
                        style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: p.color,
                            display: 'inline-block',
                        }}
                    />
                    <span>{p.name === 'import' ? 'Nhập kho' : 'Xuất kho'}:</span>
                    <span style={{ fontWeight: 700, color: '#fff' }}>{fmt(p.value)}</span>
                </div>
            ))}
        </div>
    );
};

/* ─── Format helpers ─── */
const fmt = (v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0);
const fmtShort = (v) => {
    if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
    return v?.toString() || '0';
};
const fmtDate = (d) => new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

/* ─── Main Dashboard ─── */
const Dashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [slowMoving, setSlowMoving] = useState([]);
    const [ageBuckets, setAgeBuckets] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axiosClient.get('/dashboard/stats');
                setData(res.metadata);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();

        const fetchAge = async () => {
            try {
                const res = await axiosClient.get('/inventory/stock', {
                    params: { limit: 500, sortBy: 'lastImportDate', sortOrder: 'asc' },
                });
                const products = (res.metadata?.products || []).filter((p) => p.lastImportDate && p.quantity > 0);
                const now = Date.now();
                const getDays = (d) => Math.floor((now - new Date(d).getTime()) / 86400000);

                const buckets = [
                    { label: '< 30 ngày', count: 0, color: COLORS.success },
                    { label: '30–60 ngày', count: 0, color: COLORS.warning },
                    { label: '60–90 ngày', count: 0, color: '#F97316' },
                    { label: '> 90 ngày', count: 0, color: COLORS.danger },
                ];
                products.forEach((p) => {
                    const d = getDays(p.lastImportDate);
                    if (d < 30) buckets[0].count++;
                    else if (d < 60) buckets[1].count++;
                    else if (d < 90) buckets[2].count++;
                    else buckets[3].count++;
                });
                setAgeBuckets(buckets.filter((b) => b.count > 0));

                const slow = products
                    .map((p) => ({ ...p, daysInStock: getDays(p.lastImportDate) }))
                    .sort((a, b) => b.daysInStock - a.daysInStock)
                    .slice(0, 10);
                setSlowMoving(slow);
            } catch (e) {
                console.error(e);
            }
        };
        fetchAge();
    }, []);

    const statusColors = { draft: 'default', pending: 'orange', completed: 'green', cancelled: 'red' };
    const statusLabels = { draft: 'Nháp', pending: 'Chờ duyệt', completed: 'Hoàn thành', cancelled: 'Đã hủy' };
    const exportTypes = {
        sale: 'Bán hàng',
        return_supplier: 'Trả NCC',
        damaged: 'Hàng hỏng',
        transfer: 'Chuyển kho',
        other: 'Khác',
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center" style={{ height: '60vh' }}>
                <Spin size="large" />
            </div>
        );
    }
    if (!data) return null;

    const { overview: ov, thisMonth: tm } = data;
    const totalAgeBuckets = ageBuckets.reduce((s, b) => s + b.count, 0);

    return (
        <div style={{ minHeight: '100vh' }}>
            {/* ── Header ── */}
            <div style={{ marginBottom: 28 }}>
                <h2 style={{ fontSize: 26, fontWeight: 800, color: COLORS.dark, margin: 0, letterSpacing: -0.5 }}>
                    Tổng quan hệ thống
                </h2>
                <p style={{ color: COLORS.slate, fontSize: 14, margin: '4px 0 0' }}>
                    Dashboard quản lý kho hàng — Cập nhật real-time
                </p>
            </div>

            {/* ═══════════════════════  ROW 1: Overview Stats ═══════════════════════ */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={12} sm={8} lg={4}>
                    <StatCard
                        icon={<ShoppingOutlined />}
                        iconBg={COLORS.primaryLight}
                        iconColor={COLORS.primary}
                        title="Tổng sản phẩm"
                        value={ov.totalProducts}
                    />
                </Col>
                <Col xs={12} sm={8} lg={4}>
                    <StatCard
                        icon={<DatabaseOutlined />}
                        iconBg={COLORS.infoLight}
                        iconColor={COLORS.info}
                        title="Tổng tồn kho"
                        value={ov.totalQuantity?.toLocaleString('vi-VN')}
                        suffix="SP"
                    />
                </Col>
                <Col xs={12} sm={8} lg={4}>
                    <StatCard
                        icon={<DollarOutlined />}
                        iconBg={COLORS.successLight}
                        iconColor={COLORS.success}
                        title="Giá trị tồn kho"
                        value={fmtShort(ov.stockValue)}
                    />
                </Col>
                <Col xs={12} sm={8} lg={4}>
                    <StatCard
                        icon={<AppstoreOutlined />}
                        iconBg={COLORS.purpleLight}
                        iconColor={COLORS.purple}
                        title="Danh mục"
                        value={ov.totalCategories}
                    />
                </Col>
                <Col xs={12} sm={8} lg={4}>
                    <StatCard
                        icon={<WarningOutlined />}
                        iconBg={COLORS.warningLight}
                        iconColor={COLORS.warning}
                        title="Sắp hết hàng"
                        value={ov.lowStock}
                        borderColor={ov.lowStock > 0 ? COLORS.warning : undefined}
                    />
                </Col>
                <Col xs={12} sm={8} lg={4}>
                    <StatCard
                        icon={<ExclamationCircleOutlined />}
                        iconBg={COLORS.dangerLight}
                        iconColor={COLORS.danger}
                        title="Hết hàng"
                        value={ov.outOfStock}
                        borderColor={ov.outOfStock > 0 ? COLORS.danger : undefined}
                    />
                </Col>
            </Row>

            {/* ═══════════════════════  ROW 2: Nhập / Xuất / Lợi nhuận tháng ═══════════════════════ */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} md={8}>
                    <div
                        style={{
                            ...glassCard,
                            padding: 20,
                            background: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)',
                            position: 'relative',
                            overflow: 'hidden',
                        }}
                    >
                        <div
                            style={{
                                position: 'absolute',
                                top: -30,
                                right: -30,
                                width: 100,
                                height: 100,
                                borderRadius: '50%',
                                background: 'rgba(16,185,129,0.15)',
                            }}
                        />
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                            <InboxOutlined style={{ fontSize: 18, color: '#059669' }} />
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#065F46' }}>Nhập kho tháng này</span>
                        </div>
                        <div style={{ fontSize: 28, fontWeight: 800, color: '#065F46', lineHeight: 1.1 }}>
                            {fmt(tm.importTotal)}
                        </div>
                        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 12, fontSize: 12 }}>
                            <span style={{ color: '#065F46', fontWeight: 500 }}>
                                📦 {tm.importCount} phiếu · {tm.importItems} SP
                            </span>
                            {tm.importGrowth != 0 && (
                                <span
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 2,
                                        fontWeight: 700,
                                        color: tm.importGrowth > 0 ? '#065F46' : COLORS.danger,
                                        background: 'rgba(255,255,255,0.5)',
                                        padding: '2px 8px',
                                        borderRadius: 20,
                                        fontSize: 11,
                                    }}
                                >
                                    {tm.importGrowth > 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                                    {Math.abs(tm.importGrowth)}%
                                </span>
                            )}
                        </div>
                    </div>
                </Col>
                <Col xs={24} md={8}>
                    <div
                        style={{
                            ...glassCard,
                            padding: 20,
                            background: 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)',
                            position: 'relative',
                            overflow: 'hidden',
                        }}
                    >
                        <div
                            style={{
                                position: 'absolute',
                                top: -30,
                                right: -30,
                                width: 100,
                                height: 100,
                                borderRadius: '50%',
                                background: 'rgba(59,130,246,0.15)',
                            }}
                        />
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                            <SendOutlined style={{ fontSize: 18, color: '#1D4ED8' }} />
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#1E3A5F' }}>Xuất kho tháng này</span>
                        </div>
                        <div style={{ fontSize: 28, fontWeight: 800, color: '#1E3A5F', lineHeight: 1.1 }}>
                            {fmt(tm.exportTotal)}
                        </div>
                        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 12, fontSize: 12 }}>
                            <span style={{ color: '#1E3A5F', fontWeight: 500 }}>
                                📤 {tm.exportCount} phiếu · {tm.exportItems} SP
                            </span>
                            {tm.exportGrowth != 0 && (
                                <span
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 2,
                                        fontWeight: 700,
                                        color: tm.exportGrowth > 0 ? '#1E3A5F' : COLORS.danger,
                                        background: 'rgba(255,255,255,0.5)',
                                        padding: '2px 8px',
                                        borderRadius: 20,
                                        fontSize: 11,
                                    }}
                                >
                                    {tm.exportGrowth > 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                                    {Math.abs(tm.exportGrowth)}%
                                </span>
                            )}
                        </div>
                    </div>
                </Col>
                <Col xs={24} md={8}>
                    <div
                        style={{
                            ...glassCard,
                            padding: 20,
                            background:
                                tm.profit >= 0
                                    ? 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)'
                                    : 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)',
                            position: 'relative',
                            overflow: 'hidden',
                        }}
                    >
                        <div
                            style={{
                                position: 'absolute',
                                top: -30,
                                right: -30,
                                width: 100,
                                height: 100,
                                borderRadius: '50%',
                                background: tm.profit >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                            }}
                        />
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                            {tm.profit >= 0 ? (
                                <RiseOutlined style={{ fontSize: 18, color: COLORS.success }} />
                            ) : (
                                <FallOutlined style={{ fontSize: 18, color: COLORS.danger }} />
                            )}
                            <span
                                style={{ fontSize: 13, fontWeight: 600, color: tm.profit >= 0 ? '#065F46' : '#991B1B' }}
                            >
                                Lợi nhuận tháng này
                            </span>
                        </div>
                        <div
                            style={{
                                fontSize: 28,
                                fontWeight: 800,
                                color: tm.profit >= 0 ? '#065F46' : '#991B1B',
                                lineHeight: 1.1,
                            }}
                        >
                            {fmt(tm.profit)}
                        </div>
                        <div
                            style={{
                                marginTop: 10,
                                fontSize: 12,
                                color: tm.profit >= 0 ? '#065F46' : '#991B1B',
                                fontWeight: 500,
                            }}
                        >
                            💰 Giá trị tồn kho: {fmt(ov.stockValue)}
                        </div>
                    </div>
                </Col>
            </Row>

            {/* ═══════════════════════  ROW 3: Biểu đồ + Danh mục ═══════════════════════ */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                {/* ── Bar Chart ── */}
                <Col xs={24} lg={16}>
                    <div style={{ ...glassCard, padding: '20px 20px 16px' }}>
                        <SectionTitle
                            icon="📈"
                            title="Biến động nhập / xuất kho"
                            subtitle="Thống kê 6 tháng gần nhất"
                        />
                        {data.chartData && data.chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={310}>
                                <BarChart
                                    data={data.chartData}
                                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                                    barCategoryGap="30%"
                                    barGap={4}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                                    <XAxis
                                        dataKey="month"
                                        fontSize={12}
                                        tick={{ fill: COLORS.slate }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        fontSize={11}
                                        tick={{ fill: COLORS.slate }}
                                        tickFormatter={fmtShort}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <RTooltip content={<CustomTooltip />} />
                                    <Legend
                                        formatter={(v) => (v === 'import' ? 'Nhập kho' : 'Xuất kho')}
                                        iconType="circle"
                                        wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                                    />
                                    <Bar
                                        dataKey="import"
                                        name="import"
                                        fill={COLORS.success}
                                        radius={[6, 6, 0, 0]}
                                        maxBarSize={52}
                                    />
                                    <Bar
                                        dataKey="export"
                                        name="export"
                                        fill={COLORS.primary}
                                        radius={[6, 6, 0, 0]}
                                        maxBarSize={52}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div
                                className="flex items-center justify-center"
                                style={{ height: 310, color: COLORS.slate }}
                            >
                                <Empty description="Chưa có dữ liệu nhập xuất" />
                            </div>
                        )}
                    </div>
                </Col>

                {/* ── Pie Chart: Category Stock ── */}
                <Col xs={24} lg={8}>
                    <div style={{ ...glassCard, padding: '20px 20px 16px' }}>
                        <SectionTitle title="Tồn kho theo danh mục" />
                        {data.categoryStock && data.categoryStock.length > 0 ? (
                            <>
                                <ResponsiveContainer width="100%" height={220}>
                                    <PieChart>
                                        <Pie
                                            data={data.categoryStock}
                                            dataKey="qty"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={85}
                                            innerRadius={55}
                                            strokeWidth={2}
                                            stroke="#fff"
                                        >
                                            {data.categoryStock.map((_, idx) => (
                                                <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <RTooltip
                                            formatter={(v, name) => [`${v} SP`, name]}
                                            contentStyle={{
                                                borderRadius: 10,
                                                border: '1px solid #E2E8F0',
                                                fontSize: 12,
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                                    {data.categoryStock.slice(0, 6).map((cat, idx) => (
                                        <span
                                            key={idx}
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 5,
                                                fontSize: 11,
                                                color: COLORS.slate,
                                                background: '#F8FAFC',
                                                padding: '3px 8px',
                                                borderRadius: 8,
                                            }}
                                        >
                                            <span
                                                style={{
                                                    width: 8,
                                                    height: 8,
                                                    borderRadius: 2,
                                                    background: PIE_COLORS[idx % PIE_COLORS.length],
                                                    display: 'inline-block',
                                                }}
                                            />
                                            {cat.name} ({cat.qty})
                                        </span>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div
                                className="flex items-center justify-center"
                                style={{ height: 260, color: COLORS.slate }}
                            >
                                <Empty description="Chưa có dữ liệu" />
                            </div>
                        )}
                    </div>
                </Col>
            </Row>

            {/* ═══════════════════════  ROW 4: Top bán chạy + Phiếu gần đây ═══════════════════════ */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }} align="stretch">
                {/* ── Top sản phẩm bán chạy ── */}
                <Col xs={24} lg={12} style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ ...glassCard, padding: '20px 20px 8px', flex: 1 }}>
                        <SectionTitle
                            icon="🏆"
                            title="Top sản phẩm bán chạy"
                            subtitle="Xếp hạng theo số lượng đã bán"
                        />
                        <Table
                            dataSource={data.topSelling}
                            rowKey="_id"
                            size="small"
                            pagination={false}
                            locale={{
                                emptyText: (
                                    <Empty
                                        description="Chưa có dữ liệu bán hàng"
                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    />
                                ),
                            }}
                            columns={[
                                {
                                    title: '#',
                                    width: 36,
                                    align: 'center',
                                    render: (_, __, i) => {
                                        const medals = ['🥇', '🥈', '🥉'];
                                        return i < 3 ? (
                                            <span style={{ fontSize: 16 }}>{medals[i]}</span>
                                        ) : (
                                            <span style={{ fontWeight: 600, color: COLORS.slate, fontSize: 12 }}>
                                                {i + 1}
                                            </span>
                                        );
                                    },
                                },
                                {
                                    title: 'Sản phẩm',
                                    dataIndex: 'name',
                                    ellipsis: true,
                                    render: (name, r) => (
                                        <Space size={10}>
                                            {r.thumbnail ? (
                                                <Image
                                                    src={r.thumbnail}
                                                    width={36}
                                                    height={36}
                                                    style={{ objectFit: 'cover', borderRadius: 8 }}
                                                    preview={false}
                                                />
                                            ) : (
                                                <div
                                                    style={{
                                                        width: 36,
                                                        height: 36,
                                                        borderRadius: 8,
                                                        background: COLORS.primaryLight,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                    }}
                                                >
                                                    <ShoppingOutlined style={{ color: COLORS.primary, fontSize: 14 }} />
                                                </div>
                                            )}
                                            <div>
                                                <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.dark }}>
                                                    {name}
                                                </div>
                                                <div style={{ fontSize: 11, color: COLORS.slate }}>{r.sku}</div>
                                            </div>
                                        </Space>
                                    ),
                                },
                                {
                                    title: 'Đã bán',
                                    dataIndex: 'soldCount',
                                    width: 75,
                                    align: 'center',
                                    render: (v) => (
                                        <span
                                            style={{
                                                fontWeight: 700,
                                                color: COLORS.success,
                                                background: COLORS.successLight,
                                                padding: '2px 10px',
                                                borderRadius: 20,
                                                fontSize: 13,
                                            }}
                                        >
                                            {v}
                                        </span>
                                    ),
                                },
                                {
                                    title: 'Tồn',
                                    dataIndex: 'quantity',
                                    width: 60,
                                    align: 'center',
                                    render: (v) => (
                                        <span
                                            style={{
                                                fontWeight: 600,
                                                color: v <= 5 ? COLORS.danger : COLORS.slate,
                                                fontSize: 13,
                                            }}
                                        >
                                            {v}
                                        </span>
                                    ),
                                },
                                {
                                    title: 'Giá',
                                    dataIndex: 'salePrice',
                                    width: 110,
                                    align: 'right',
                                    render: (v) => <span style={{ fontSize: 12, fontWeight: 500 }}>{fmt(v)}</span>,
                                    responsive: ['md'],
                                },
                            ]}
                        />
                    </div>
                </Col>

                {/* ── Phiếu gần đây ── */}
                <Col xs={24} lg={12} style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ ...glassCard, padding: '20px 20px 8px', flex: 1 }}>
                        <SectionTitle
                            icon="📋"
                            title="Phiếu nhập / xuất gần đây"
                            subtitle="5 phiếu mới nhất mỗi loại"
                        />

                        {/* Nhập kho */}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: '8px 12px',
                                marginBottom: 8,
                                background: COLORS.successLight,
                                borderRadius: 10,
                            }}
                        >
                            <InboxOutlined style={{ color: COLORS.success, fontSize: 14 }} />
                            <span style={{ fontWeight: 700, fontSize: 13, color: '#065F46' }}>Nhập kho</span>
                            <Tag color="green" style={{ marginLeft: 'auto', fontSize: 11, borderRadius: 20 }}>
                                {data.recentImports?.length || 0} phiếu
                            </Tag>
                        </div>
                        <Table
                            dataSource={data.recentImports}
                            rowKey="_id"
                            size="small"
                            pagination={false}
                            locale={{
                                emptyText: <span style={{ color: '#CBD5E1', fontSize: 12 }}>Chưa có phiếu nhập</span>,
                            }}
                            style={{ marginBottom: 16 }}
                            columns={[
                                {
                                    title: 'Mã phiếu',
                                    dataIndex: 'code',
                                    width: 100,
                                    render: (v) => (
                                        <span
                                            style={{
                                                fontWeight: 700,
                                                fontSize: 12,
                                                color: COLORS.primary,
                                                background: COLORS.primaryLight,
                                                padding: '3px 8px',
                                                borderRadius: 6,
                                            }}
                                        >
                                            {v}
                                        </span>
                                    ),
                                },
                                {
                                    title: 'Nhà cung cấp',
                                    dataIndex: ['supplier', 'name'],
                                    ellipsis: true,
                                    render: (v) => <span style={{ fontSize: 12, color: '#374151' }}>{v || '—'}</span>,
                                },
                                {
                                    title: 'Giá trị',
                                    dataIndex: 'totalAmount',
                                    width: 115,
                                    align: 'right',
                                    render: (v) => (
                                        <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.success }}>
                                            {fmt(v)}
                                        </span>
                                    ),
                                },
                                {
                                    title: 'Ngày nhập',
                                    dataIndex: 'createdAt',
                                    width: 90,
                                    align: 'center',
                                    render: (v) => (
                                        <span style={{ fontSize: 11, color: COLORS.slate }}>{fmtDate(v)}</span>
                                    ),
                                },
                                {
                                    title: 'Trạng thái',
                                    dataIndex: 'status',
                                    width: 95,
                                    align: 'center',
                                    render: (s) => (
                                        <Tag
                                            color={statusColors[s]}
                                            style={{ fontSize: 11, margin: 0, borderRadius: 20 }}
                                        >
                                            {statusLabels[s]}
                                        </Tag>
                                    ),
                                },
                            ]}
                        />

                        {/* Xuất kho */}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: '8px 12px',
                                marginBottom: 8,
                                background: COLORS.primaryLight,
                                borderRadius: 10,
                            }}
                        >
                            <SendOutlined style={{ color: COLORS.primary, fontSize: 14 }} />
                            <span style={{ fontWeight: 700, fontSize: 13, color: '#312E81' }}>Xuất kho</span>
                            <Tag color="purple" style={{ marginLeft: 'auto', fontSize: 11, borderRadius: 20 }}>
                                {data.recentExports?.length || 0} phiếu
                            </Tag>
                        </div>
                        <Table
                            dataSource={data.recentExports}
                            rowKey="_id"
                            size="small"
                            pagination={false}
                            locale={{
                                emptyText: <span style={{ color: '#CBD5E1', fontSize: 12 }}>Chưa có phiếu xuất</span>,
                            }}
                            columns={[
                                {
                                    title: 'Mã phiếu',
                                    dataIndex: 'code',
                                    width: 100,
                                    render: (v) => (
                                        <span
                                            style={{
                                                fontWeight: 700,
                                                fontSize: 12,
                                                color: COLORS.purple,
                                                background: COLORS.purpleLight,
                                                padding: '3px 8px',
                                                borderRadius: 6,
                                            }}
                                        >
                                            {v}
                                        </span>
                                    ),
                                },
                                {
                                    title: 'Loại xuất',
                                    dataIndex: 'type',
                                    ellipsis: true,
                                    render: (v) => (
                                        <span style={{ fontSize: 12, color: '#374151' }}>{exportTypes[v] || v}</span>
                                    ),
                                },
                                {
                                    title: 'Giá trị',
                                    dataIndex: 'totalAmount',
                                    width: 115,
                                    align: 'right',
                                    render: (v) => (
                                        <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.primary }}>
                                            {fmt(v)}
                                        </span>
                                    ),
                                },
                                {
                                    title: 'Ngày xuất',
                                    dataIndex: 'createdAt',
                                    width: 90,
                                    align: 'center',
                                    render: (v) => (
                                        <span style={{ fontSize: 11, color: COLORS.slate }}>{fmtDate(v)}</span>
                                    ),
                                },
                                {
                                    title: 'Trạng thái',
                                    dataIndex: 'status',
                                    width: 95,
                                    align: 'center',
                                    render: (s) => (
                                        <Tag
                                            color={statusColors[s]}
                                            style={{ fontSize: 11, margin: 0, borderRadius: 20 }}
                                        >
                                            {statusLabels[s]}
                                        </Tag>
                                    ),
                                },
                            ]}
                        />
                    </div>
                </Col>
            </Row>

            {/* ═══════════════════════  ROW 5: Tồn kho theo thời gian ═══════════════════════ */}
            {(ageBuckets.length > 0 || slowMoving.length > 0) && (
                <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                    {/* ── Age Distribution ── */}
                    <Col xs={24} lg={10}>
                        <div style={{ ...glassCard, padding: 20 }}>
                            <SectionTitle
                                icon="⏱️"
                                title="Phân phối tồn kho theo thời gian"
                                subtitle="Dựa trên ngày nhập gần nhất"
                            />
                            {ageBuckets.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8 }}>
                                    {ageBuckets.map((b, i) => (
                                        <div key={i}>
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    marginBottom: 4,
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        fontSize: 13,
                                                        fontWeight: 600,
                                                        color: COLORS.dark,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 6,
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            width: 10,
                                                            height: 10,
                                                            borderRadius: 3,
                                                            background: b.color,
                                                            display: 'inline-block',
                                                        }}
                                                    />
                                                    {b.label}
                                                </span>
                                                <span style={{ fontSize: 13, fontWeight: 700, color: b.color }}>
                                                    {b.count} SP
                                                </span>
                                            </div>
                                            <Progress
                                                percent={
                                                    totalAgeBuckets > 0
                                                        ? Math.round((b.count / totalAgeBuckets) * 100)
                                                        : 0
                                                }
                                                strokeColor={b.color}
                                                trailColor="#F1F5F9"
                                                showInfo={true}
                                                size="small"
                                                format={(pct) => (
                                                    <span style={{ fontSize: 11, color: COLORS.slate }}>{pct}%</span>
                                                )}
                                            />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <Empty description="Chưa có dữ liệu ngày nhập" />
                            )}
                            <div
                                style={{
                                    display: 'flex',
                                    gap: 14,
                                    flexWrap: 'wrap',
                                    marginTop: 20,
                                    paddingTop: 14,
                                    borderTop: `1px solid #F1F5F9`,
                                }}
                            >
                                {[
                                    { c: COLORS.success, l: 'Bình thường' },
                                    { c: COLORS.warning, l: 'Cần theo dõi' },
                                    { c: '#F97316', l: 'Cần KM' },
                                    { c: COLORS.danger, l: 'Tồn lâu' },
                                ].map((x) => (
                                    <span
                                        key={x.c}
                                        style={{
                                            fontSize: 11,
                                            color: COLORS.slate,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 5,
                                        }}
                                    >
                                        <span
                                            style={{
                                                width: 8,
                                                height: 8,
                                                borderRadius: '50%',
                                                background: x.c,
                                                display: 'inline-block',
                                            }}
                                        />
                                        {x.l}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </Col>

                    {/* ── Slow-moving products ── */}
                    <Col xs={24} lg={14}>
                        <div style={{ ...glassCard, padding: '20px 20px 8px' }}>
                            <SectionTitle
                                icon="⚠️"
                                title="Sản phẩm tồn kho lâu nhất"
                                subtitle="Top 10 sản phẩm cần xử lý sớm"
                            />
                            <Table
                                dataSource={slowMoving}
                                rowKey="_id"
                                size="small"
                                pagination={false}
                                locale={{
                                    emptyText: (
                                        <Empty
                                            description="Chưa có sản phẩm cần cảnh báo"
                                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                                        />
                                    ),
                                }}
                                columns={[
                                    {
                                        title: '#',
                                        width: 32,
                                        align: 'center',
                                        render: (_, __, i) => (
                                            <span style={{ color: COLORS.slate, fontSize: 12 }}>{i + 1}</span>
                                        ),
                                    },
                                    {
                                        title: 'Sản phẩm',
                                        dataIndex: 'name',
                                        ellipsis: true,
                                        render: (name, r) => (
                                            <div>
                                                <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.dark }}>
                                                    {name}
                                                </div>
                                                <div style={{ fontSize: 11, color: COLORS.slate }}>{r.sku}</div>
                                            </div>
                                        ),
                                    },
                                    {
                                        title: 'Tồn kho',
                                        dataIndex: 'quantity',
                                        width: 70,
                                        align: 'center',
                                        render: (v, r) => (
                                            <span
                                                style={{
                                                    fontWeight: 700,
                                                    color: v <= (r.minStock || 10) ? COLORS.danger : COLORS.dark,
                                                    fontSize: 13,
                                                }}
                                            >
                                                {v}
                                            </span>
                                        ),
                                    },
                                    {
                                        title: 'Thời gian',
                                        dataIndex: 'daysInStock',
                                        width: 100,
                                        align: 'center',
                                        render: (days) => {
                                            const color =
                                                days >= 90
                                                    ? COLORS.danger
                                                    : days >= 60
                                                      ? '#F97316'
                                                      : days >= 30
                                                        ? COLORS.warning
                                                        : COLORS.success;
                                            return (
                                                <Tooltip title={`Tồn kho ${days} ngày`}>
                                                    <span
                                                        style={{
                                                            fontWeight: 700,
                                                            color,
                                                            fontSize: 12,
                                                            background: color + '15',
                                                            padding: '3px 10px',
                                                            borderRadius: 20,
                                                            display: 'inline-block',
                                                        }}
                                                    >
                                                        {days} ngày
                                                    </span>
                                                </Tooltip>
                                            );
                                        },
                                    },
                                    {
                                        title: 'Ngày nhập',
                                        dataIndex: 'lastImportDate',
                                        width: 90,
                                        align: 'center',
                                        render: (d) => (
                                            <span style={{ fontSize: 11, color: COLORS.slate }}>{fmtDate(d)}</span>
                                        ),
                                    },
                                ]}
                            />
                        </div>
                    </Col>
                </Row>
            )}

            {/* ── Inject hover styles ── */}
            <style>{`
                .dashboard-stat-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 32px rgba(0,0,0,0.08) !important;
                }
            `}</style>
        </div>
    );
};

export default Dashboard;
