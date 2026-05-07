import { useNavigate, useLocation } from 'react-router-dom';
import logoImg from '../../assets/logo.png';
import { Layout, Menu } from 'antd';
import {
    DashboardOutlined,
    ShoppingOutlined,
    AppstoreOutlined,
    TeamOutlined,
    ImportOutlined,
    ExportOutlined,
    DatabaseOutlined,
    BarChartOutlined,
    SearchOutlined,
    BellOutlined,
    FileExcelOutlined,
    RobotOutlined,
    UserOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';

const { Sider } = Layout;

const Sidebar = ({ collapsed }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    const allMenuItems = [
        {
            key: '/dashboard',
            icon: <DashboardOutlined />,
            label: 'Thống kê',
            roles: ['admin', 'manager', 'staff'],
        },
        {
            key: '/products',
            icon: <ShoppingOutlined />,
            label: 'Sản phẩm',
            roles: ['admin', 'manager', 'staff'],
        },
        {
            key: '/categories',
            icon: <AppstoreOutlined />,
            label: 'Danh mục',
            roles: ['admin', 'manager'],
        },
        {
            key: '/suppliers',
            icon: <TeamOutlined />,
            label: 'Nhà cung cấp',
            roles: ['admin', 'manager'],
        },
        {
            key: '/imports',
            icon: <ImportOutlined />,
            label: 'Nhập kho',
            roles: ['admin', 'manager', 'staff'],
        },
        {
            key: '/exports',
            icon: <ExportOutlined />,
            label: 'Xuất kho',
            roles: ['admin', 'manager', 'staff'],
        },
        {
            key: '/inventory',
            icon: <DatabaseOutlined />,
            label: 'Tồn kho',
            roles: ['admin', 'manager', 'staff'],
        },

        {
            key: '/search',
            icon: <SearchOutlined />,
            label: 'Quét mã vạch',
            roles: ['admin', 'manager', 'staff'],
        },
        {
            key: '/data',
            icon: <FileExcelOutlined />,
            label: 'Import/Export',
            roles: ['admin', 'manager'],
        },
        {
            key: '/users',
            icon: <UserOutlined />,
            label: 'Người dùng',
            roles: ['admin'],
        },
        {
            key: '/ai-chat',
            icon: <RobotOutlined />,
            label: 'AI Chatbot',
            roles: ['admin', 'manager', 'staff'],
        },
    ];

    // Lọc menu theo role
    const menuItems = allMenuItems.filter((item) => item.roles.includes(user?.role)).map(({ roles, ...item }) => item);

    const selectedKey = '/' + location.pathname.split('/')[1];

    return (
        <Sider
            trigger={null}
            collapsible
            collapsed={collapsed}
            width={260}
            style={{
                overflow: 'auto',
                height: '100vh',
                position: 'sticky',
                top: 0,
                left: 0,
            }}
        >
            <div className="sidebar-logo" style={{ justifyContent: collapsed ? 'center' : 'flex-start', padding: collapsed ? '16px 8px' : '16px 14px' }}>
                {collapsed ? (
                    <img src={logoImg} alt="Hải Hương" style={{ width: 40, height: 40, objectFit: 'contain' }} />
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <img src={logoImg} alt="Hải Hương" style={{ height: 44, objectFit: 'contain', flexShrink: 0 }} />
                        <span style={{
                            color: '#000',
                            fontWeight: 700,
                            fontSize: 16,
                            lineHeight: 1.3,
                            whiteSpace: 'nowrap',
                        }}>
                            Quản lý kho
                        </span>
                    </div>
                )}
            </div>

            <Menu
                mode="inline"
                selectedKeys={[selectedKey]}
                items={menuItems}
                onClick={({ key }) => navigate(key)}
                style={{ padding: '12px 0' }}
            />
        </Sider>
    );
};

export default Sidebar;
