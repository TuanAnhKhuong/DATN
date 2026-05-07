import { useNavigate } from 'react-router-dom';
import { Layout, Button, Dropdown, Avatar, Space, Typography } from 'antd';
import {
    MenuFoldOutlined,
    MenuUnfoldOutlined,

    UserOutlined,
    LogoutOutlined,
    SettingOutlined,
    KeyOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const { Header } = Layout;
const { Text } = Typography;

const roleLabels = {
    admin: 'Quản trị viên',
    manager: 'Quản lý',
    staff: 'Nhân viên kho',
};

const HeaderBar = ({ collapsed, setCollapsed }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout();
            toast.success('Đăng xuất thành công');
            navigate('/login');
        } catch {
            toast.error('Đăng xuất thất bại');
        }
    };

    const dropdownItems = {
        items: [
            {
                key: 'profile',
                icon: <UserOutlined />,
                label: 'Hồ sơ cá nhân',
                onClick: () => navigate('/profile'),
            },
            {
                key: 'change-password',
                icon: <KeyOutlined />,
                label: 'Đổi mật khẩu',
                onClick: () => navigate('/change-password'),
            },
            { type: 'divider' },
            {
                key: 'logout',
                icon: <LogoutOutlined />,
                label: 'Đăng xuất',
                danger: true,
                onClick: handleLogout,
            },
        ],
    };

    return (
        <Header className="layout-header">
            <div className="flex items-center gap-4">
                <Button
                    type="text"
                    icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                    onClick={() => setCollapsed(!collapsed)}
                    style={{ fontSize: '18px', width: 40, height: 40 }}
                />
            </div>

            <div className="flex items-center gap-4">
                <Dropdown menu={dropdownItems} placement="bottomRight" trigger={['click']}>
                    <Space
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                        style={{ padding: '4px 8px', borderRadius: 8 }}
                    >
                        <Avatar
                            size={36}
                            icon={<UserOutlined />}
                            src={user?.avatar || undefined}
                            style={{ backgroundColor: '#4F46E5' }}
                        />
                        <div className="hidden md:flex flex-col">
                            <Text strong style={{ fontSize: 13, lineHeight: '18px' }}>
                                {user?.fullName || 'Người dùng'}
                            </Text>
                            <Text type="secondary" style={{ fontSize: 11, lineHeight: '14px' }}>
                                {roleLabels[user?.role] || 'Nhân viên'}
                            </Text>
                        </div>
                    </Space>
                </Dropdown>
            </div>
        </Header>
    );
};

export default HeaderBar;
