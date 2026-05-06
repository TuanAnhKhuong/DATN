import { useState, useRef } from 'react';
import { Card, Form, Input, Button, Row, Col, Descriptions, Avatar, Tag, DatePicker, message, Spin, Tooltip } from 'antd';
import dayjs from 'dayjs';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined, HomeOutlined, CalendarOutlined, SaveOutlined, CameraOutlined } from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import axiosClient from '../../api/axiosClient';

const Profile = () => {
    const { user, fetchUser } = useAuth();
    const [editMode, setEditMode] = useState(false);
    const [saving, setSaving] = useState(false);
    const [changingPw, setChangingPw] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [profileForm] = Form.useForm();
    const [pwForm] = Form.useForm();
    const fileInputRef = useRef(null);

    const roleLabels = { admin: 'Quản trị viên', manager: 'Quản lý', staff: 'Nhân viên' };
    const roleColors = { admin: 'red', manager: 'blue', staff: 'green' };

    // Upload avatar
    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            message.error('Vui lòng chọn file ảnh');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            message.error('Ảnh không được vượt quá 5MB');
            return;
        }

        setUploadingAvatar(true);
        try {
            // Bước 1: Upload lên Cloudinary
            const formData = new FormData();
            formData.append('image', file);
            formData.append('folder', 'ql-kho/avatars');
            // axiosClient interceptor tự unwrap response.data, nên dùng uploadRes.metadata trực tiếp
            const uploadRes = await axiosClient.post('/upload/single', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const avatarUrl = uploadRes?.metadata?.url;
            if (!avatarUrl) throw new Error('Không lấy được URL ảnh');

            // Bước 2: Lưu URL avatar vào profile
            await axiosClient.put('/users/update', { avatar: avatarUrl });
            message.success('Cập nhật ảnh đại diện thành công');
            fetchUser();
        } catch (error) {
            message.error(error.response?.data?.message || 'Cập nhật ảnh thất bại');
        } finally {
            setUploadingAvatar(false);
            // Reset input để có thể chọn lại cùng file
            e.target.value = '';
        }
    };

    // Cập nhật hồ sơ
    const handleUpdateProfile = async (values) => {
        setSaving(true);
        try {
            const payload = { ...values, birthDay: values.birthDay ? values.birthDay.toISOString() : '' };
            await axiosClient.put('/users/update', payload);
            message.success('Cập nhật hồ sơ thành công');
            setEditMode(false);
            fetchUser();
        } catch (error) {
            message.error(error.response?.data?.message || 'Cập nhật thất bại');
        } finally {
            setSaving(false);
        }
    };

    // Đổi mật khẩu
    const handleChangePassword = async (values) => {
        setChangingPw(true);
        try {
            await axiosClient.put('/users/change-password', {
                currentPassword: values.currentPassword,
                newPassword: values.newPassword,
            });
            message.success('Đổi mật khẩu thành công');
            pwForm.resetFields();
        } catch (error) {
            message.error(error.response?.data?.message || 'Đổi mật khẩu thất bại');
        } finally {
            setChangingPw(false);
        }
    };

    const startEdit = () => {
        profileForm.setFieldsValue({
            fullName: user?.fullName || '',
            email: user?.email || '',
            phone: user?.phone || '',
            address: user?.address || '',
            birthDay: user?.birthDay ? dayjs(user.birthDay) : null,
        });
        setEditMode(true);
    };

    return (
        <div>
            <div className="page-header">
                <h2>Hồ sơ cá nhân</h2>
                <p>Xem và cập nhật thông tin tài khoản</p>
            </div>

            <Row gutter={[24, 24]}>
                {/* Cột trái: Thông tin cá nhân */}
                <Col xs={24} lg={14}>
                    <Card>
                        {/* Header profile */}
                        <div className="flex items-center gap-4" style={{ marginBottom: 24 }}>
                            {/* Avatar có thể click để đổi ảnh */}
                            <Tooltip title="Bấm để đổi ảnh đại diện">
                                <div
                                    onClick={() => !uploadingAvatar && fileInputRef.current?.click()}
                                    style={{
                                        position: 'relative',
                                        display: 'inline-block',
                                        cursor: uploadingAvatar ? 'default' : 'pointer',
                                        borderRadius: '50%',
                                    }}
                                >
                                    <Avatar
                                        size={72}
                                        icon={<UserOutlined />}
                                        src={user?.avatar}
                                        style={{
                                            background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                                            fontSize: 28,
                                            display: 'block',
                                            opacity: uploadingAvatar ? 0.6 : 1,
                                        }}
                                    />
                                    {/* Overlay camera icon khi hover */}
                                    {!uploadingAvatar && (
                                        <div style={{
                                            position: 'absolute', inset: 0,
                                            borderRadius: '50%',
                                            background: 'rgba(0,0,0,0.45)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            opacity: 0,
                                            transition: 'opacity 0.2s',
                                            color: '#fff', fontSize: 20,
                                        }}
                                            onMouseEnter={e => e.currentTarget.style.opacity = 1}
                                            onMouseLeave={e => e.currentTarget.style.opacity = 0}
                                        >
                                            <CameraOutlined />
                                        </div>
                                    )}
                                    {/* Spinner khi đang upload */}
                                    {uploadingAvatar && (
                                        <div style={{
                                            position: 'absolute', inset: 0,
                                            borderRadius: '50%',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            <Spin size="small" />
                                        </div>
                                    )}
                                </div>
                            </Tooltip>
                            {/* Hidden file input */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={handleAvatarChange}
                            />
                            <div>
                                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1E293B' }}>
                                    {user?.fullName || 'Người dùng'}
                                </h3>
                                <div style={{ color: '#64748B', marginTop: 2 }}>{user?.email}</div>
                                <Tag color={roleColors[user?.role]} style={{ marginTop: 6 }}>
                                    {roleLabels[user?.role] || user?.role}
                                </Tag>
                            </div>
                        </div>

                        {!editMode ? (
                            <>
                                <Descriptions column={1} bordered size="small" labelStyle={{ width: 140, fontWeight: 600, color: '#64748B' }}>
                                    <Descriptions.Item label={<><UserOutlined /> Họ tên</>}>{user?.fullName || '—'}</Descriptions.Item>
                                    <Descriptions.Item label={<><MailOutlined /> Email</>}>{user?.email || '—'}</Descriptions.Item>
                                    <Descriptions.Item label={<><PhoneOutlined /> Điện thoại</>}>{user?.phone || '—'}</Descriptions.Item>
                                    <Descriptions.Item label={<><HomeOutlined /> Địa chỉ</>}>{user?.address || '—'}</Descriptions.Item>
                                    <Descriptions.Item label={<><CalendarOutlined /> Ngày sinh</>}>{user?.birthDay ? dayjs(user.birthDay).format('DD/MM/YYYY') : '—'}</Descriptions.Item>
                                </Descriptions>
                                <Button type="primary" onClick={startEdit} style={{ marginTop: 16 }}>
                                    Chỉnh sửa hồ sơ
                                </Button>
                            </>
                        ) : (
                            <Form form={profileForm} layout="vertical" onFinish={handleUpdateProfile} requiredMark={false}>
                                <Form.Item name="fullName" label="Họ tên" rules={[{ required: true, message: 'Nhập họ tên' }]}>
                                    <Input prefix={<UserOutlined style={{ color: '#94A3B8' }} />} placeholder="Họ và tên" />
                                </Form.Item>
                                <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Email không hợp lệ' }]}>
                                    <Input prefix={<MailOutlined style={{ color: '#94A3B8' }} />} placeholder="Email" />
                                </Form.Item>
                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item name="phone" label="Điện thoại">
                                            <Input prefix={<PhoneOutlined style={{ color: '#94A3B8' }} />} placeholder="Số điện thoại" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item name="birthDay" label="Ngày sinh">
                                            <DatePicker format="DD/MM/YYYY" placeholder="Chọn ngày sinh" style={{ width: '100%' }} />
                                        </Form.Item>
                                    </Col>
                                </Row>
                                <Form.Item name="address" label="Địa chỉ">
                                    <Input prefix={<HomeOutlined style={{ color: '#94A3B8' }} />} placeholder="Địa chỉ" />
                                </Form.Item>
                                <div className="flex gap-2">
                                    <Button type="primary" htmlType="submit" loading={saving} icon={<SaveOutlined />}>
                                        Lưu thay đổi
                                    </Button>
                                    <Button onClick={() => setEditMode(false)}>Hủy</Button>
                                </div>
                            </Form>
                        )}
                    </Card>
                </Col>

                {/* Cột phải: Đổi mật khẩu */}
                <Col xs={24} lg={10}>
                    <Card>
                        <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 600, color: '#1E293B' }}>
                            <LockOutlined style={{ marginRight: 8 }} />
                            Đổi mật khẩu
                        </h3>
                        <p style={{ color: '#94A3B8', fontSize: 13, marginBottom: 20 }}>
                            Mật khẩu mới phải có ít nhất 6 ký tự
                        </p>

                        <Form form={pwForm} layout="vertical" onFinish={handleChangePassword} requiredMark={false}>
                            <Form.Item name="currentPassword" label="Mật khẩu hiện tại"
                                rules={[{ required: true, message: 'Nhập mật khẩu hiện tại' }]}>
                                <Input.Password prefix={<LockOutlined style={{ color: '#94A3B8' }} />} placeholder="Mật khẩu hiện tại" />
                            </Form.Item>

                            <Form.Item name="newPassword" label="Mật khẩu mới"
                                rules={[
                                    { required: true, message: 'Nhập mật khẩu mới' },
                                    { min: 6, message: 'Tối thiểu 6 ký tự' },
                                ]}>
                                <Input.Password prefix={<LockOutlined style={{ color: '#94A3B8' }} />} placeholder="Mật khẩu mới" />
                            </Form.Item>

                            <Form.Item name="confirmPassword" label="Xác nhận mật khẩu mới"
                                dependencies={['newPassword']}
                                rules={[
                                    { required: true, message: 'Xác nhận mật khẩu mới' },
                                    ({ getFieldValue }) => ({
                                        validator(_, value) {
                                            if (!value || getFieldValue('newPassword') === value) return Promise.resolve();
                                            return Promise.reject(new Error('Mật khẩu xác nhận không khớp'));
                                        },
                                    }),
                                ]}>
                                <Input.Password prefix={<LockOutlined style={{ color: '#94A3B8' }} />} placeholder="Nhập lại mật khẩu mới" />
                            </Form.Item>

                            <Button type="primary" htmlType="submit" loading={changingPw} block
                                style={{ background: '#7C3AED', borderColor: '#7C3AED' }}>
                                Đổi mật khẩu
                            </Button>
                        </Form>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default Profile;
