import { useState, useEffect } from 'react';
import { Table, Button, Form, Select, Space, Tag, message, Typography, Modal, Popconfirm } from 'antd';
import { UserOutlined, DeleteOutlined, KeyOutlined } from '@ant-design/icons';
import axiosClient from '../../api/axiosClient';

const { Title } = Typography;
const { Option } = Select;

const UserList = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [roleModalOpen, setRoleModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [form] = Form.useForm();

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await axiosClient.get('/users/admin/users');
            setUsers(res.metadata);
        } catch (error) {
            console.error(error);
            message.error('Lỗi khi tải danh sách người dùng');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleDelete = async (id) => {
        try {
            await axiosClient.delete(`/users/admin/users/${id}`);
            message.success('Xóa người dùng thành công');
            fetchUsers();
        } catch (error) {
            message.error(error.response?.data?.message || 'Lỗi khi xóa người dùng');
        }
    };

    const handleOpenRoleModal = (user) => {
        setSelectedUser(user);
        form?.setFieldsValue({
            role: user.role || 'staff',
        });
        setRoleModalOpen(true);
    };

    const handleRoleSubmit = async (values) => {
        try {
            // Need to pass other required fields as per updateUserAdmin implementation
            const payload = {
                ...selectedUser,
                role: values.role,
            };
            await axiosClient.put(`/users/admin/users/${selectedUser._id}`, payload);
            message.success('Cập nhật quyền thành công');
            setRoleModalOpen(false);
            fetchUsers();
        } catch (error) {
            message.error(error.response?.data?.message || 'Lỗi khi cập nhật quyền');
        }
    };

    const columns = [
        {
            title: 'Họ tên',
            dataIndex: 'fullName',
            key: 'fullName',
            render: (text) => <span style={{ fontWeight: 500 }}>{text}</span>,
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: 'SĐT',
            dataIndex: 'phone',
            key: 'phone',
            render: (text) => text || '—',
        },
        {
            title: 'Kiểu ĐN',
            dataIndex: 'typeLogin',
            key: 'typeLogin',
            render: (type) => <Tag color={type === 'google' ? 'red' : 'blue'}>{type}</Tag>,
        },
        {
            title: 'Quyền',
            dataIndex: 'role',
            key: 'role',
            render: (role) => (
                <Tag
                    color={role === 'admin' ? 'purple' : role === 'manager' ? 'blue' : 'default'}
                    style={{ fontWeight: 500 }}
                >
                    {role ? role.toUpperCase() : 'STAFF'}
                </Tag>
            ),
        },
        {
            title: 'Hành động',
            key: 'actions',
            align: 'center',
            render: (_, record) => (
                <Space>
                    <Button
                        type="primary"
                        size="small"
                        icon={<KeyOutlined />}
                        onClick={() => handleOpenRoleModal(record)}
                        style={{ background: '#3b82f6' }}
                    >
                        Phân quyền
                    </Button>
                    <Popconfirm
                        title="Bạn có chắc chắn muốn xóa người dùng này?"
                        onConfirm={() => handleDelete(record._id)}
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                    >
                        <Button danger size="small" icon={<DeleteOutlined />}>
                            Xóa
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div style={{ background: '#fff', padding: 24, borderRadius: 8, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <Title level={4} style={{ margin: 0, color: '#1E293B' }}>
                        Quản lý người dùng
                    </Title>
                    <span style={{ color: '#64748B', fontSize: 14 }}>Phân quyền và quản lý tài khoản hệ thống</span>
                </div>
                <div
                    style={{
                        background: '#F1F5F9',
                        padding: '8px 16px',
                        borderRadius: 6,
                        color: '#475569',
                        fontSize: 14,
                        fontWeight: 500,
                    }}
                >
                    <UserOutlined style={{ marginRight: 8 }} />
                    Tổng: {users.length} user
                </div>
            </div>

            <Table
                columns={columns}
                dataSource={users}
                rowKey="_id"
                loading={loading}
                pagination={{ pageSize: 15 }}
                size="middle"
            />

            <Modal
                title="Thay đổi quyền người dùng"
                open={roleModalOpen}
                onCancel={() => setRoleModalOpen(false)}
                footer={null}
                destroyOnClose
            >
                <div style={{ marginBottom: 16 }}>
                    <div style={{ fontWeight: 500 }}>Người dùng:</div>
                    <div style={{ color: '#3b82f6', fontSize: 16 }}>
                        {selectedUser?.fullName} ({selectedUser?.email})
                    </div>
                </div>

                {form && (
                    <Form form={form} layout="vertical" onFinish={handleRoleSubmit}>
                        <Form.Item
                            name="role"
                            label="Cấp quyền"
                            rules={[{ required: true, message: 'Vui lòng chọn quyền' }]}
                        >
                            <Select>
                                <Option value="staff">Nhân viên (STAFF)</Option>
                                <Option value="manager">Quản lý (MANAGER)</Option>
                                <Option value="admin">Quản trị viên (ADMIN)</Option>
                            </Select>
                        </Form.Item>
                        <div className="flex justify-end gap-2 mt-4">
                            <Button onClick={() => setRoleModalOpen(false)}>Hủy</Button>
                            <Button type="primary" htmlType="submit">
                                Lưu thay đổi
                            </Button>
                        </div>
                    </Form>
                )}
            </Modal>
        </div>
    );
};

export default UserList;
