import { useState } from 'react';
import logoImg from '../../assets/logo.png';
import { Link } from 'react-router-dom';
import { Form, Input, Button, Steps } from 'antd';
import { MailOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons';
import axiosClient from '../../api/axiosClient';
import { toast } from 'react-toastify';

const ForgotPassword = () => {
    const [current, setCurrent] = useState(0);
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');

    // Bước 1: Gửi email
    const onSendEmail = async (values) => {
        setLoading(true);
        try {
            await axiosClient.post('/users/forgot-password', { email: values.email });
            setEmail(values.email);
            toast.success('Mã OTP đã được gửi đến email của bạn');
            setCurrent(1);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Gửi email thất bại');
        } finally {
            setLoading(false);
        }
    };

    // Bước 2: Nhập OTP + mật khẩu mới
    const onResetPassword = async (values) => {
        setLoading(true);
        try {
            await axiosClient.post('/users/reset-password', {
                otp: values.otp,
                newPassword: values.newPassword,
            });
            toast.success('Đặt lại mật khẩu thành công!');
            setCurrent(2);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Đặt lại mật khẩu thất bại');
        } finally {
            setLoading(false);
        }
    };

    const steps = [
        { title: 'Nhập email' },
        { title: 'Xác nhận OTP' },
        { title: 'Hoàn tất' },
    ];

    return (
        <div className="auth-container">
            <div className="auth-card" style={{ maxWidth: 480 }}>
                <div className="auth-logo">
                    <img
                        src={logoImg}
                        alt="Hải Hương"
                        style={{ height: 90, objectFit: 'contain', display: 'block', margin: '0 auto 8px' }}
                    />
                    <h1>Hải Hương</h1>
                    <p>Quên mật khẩu — Khôi phục tài khoản của bạn</p>
                </div>

                <Steps current={current} items={steps} size="small" className="mb-8" />

                {current === 0 && (
                    <Form
                        name="forgot-email"
                        onFinish={onSendEmail}
                        layout="vertical"
                        size="large"
                        requiredMark={false}
                    >
                        <Form.Item
                            name="email"
                            label="Email đã đăng ký"
                            rules={[
                                { required: true, message: 'Vui lòng nhập email' },
                                { type: 'email', message: 'Email không hợp lệ' },
                            ]}
                        >
                            <Input prefix={<MailOutlined />} placeholder="Nhập email của bạn" />
                        </Form.Item>
                        <Form.Item>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                                block
                                style={{ height: 46, fontWeight: 600, borderRadius: 10 }}
                            >
                                Gửi mã OTP
                            </Button>
                        </Form.Item>
                    </Form>
                )}

                {current === 1 && (
                    <Form
                        name="reset-password"
                        onFinish={onResetPassword}
                        layout="vertical"
                        size="large"
                        requiredMark={false}
                    >
                        <p className="text-sm mb-4" style={{ color: '#64748B' }}>
                            Mã OTP đã được gửi đến <strong>{email}</strong>
                        </p>
                        <Form.Item
                            name="otp"
                            label="Mã OTP"
                            rules={[{ required: true, message: 'Vui lòng nhập mã OTP' }]}
                        >
                            <Input prefix={<SafetyOutlined />} placeholder="Nhập mã OTP 6 số" maxLength={6} />
                        </Form.Item>
                        <Form.Item
                            name="newPassword"
                            label="Mật khẩu mới"
                            rules={[
                                { required: true, message: 'Vui lòng nhập mật khẩu mới' },
                                { min: 6, message: 'Mật khẩu ít nhất 6 ký tự' },
                            ]}
                        >
                            <Input.Password prefix={<LockOutlined />} placeholder="Nhập mật khẩu mới" />
                        </Form.Item>
                        <Form.Item
                            name="confirmPassword"
                            label="Xác nhận mật khẩu"
                            dependencies={['newPassword']}
                            rules={[
                                { required: true, message: 'Vui lòng xác nhận mật khẩu' },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value || getFieldValue('newPassword') === value) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject(new Error('Mật khẩu không khớp'));
                                    },
                                }),
                            ]}
                        >
                            <Input.Password prefix={<LockOutlined />} placeholder="Nhập lại mật khẩu" />
                        </Form.Item>
                        <Form.Item>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                                block
                                style={{ height: 46, fontWeight: 600, borderRadius: 10 }}
                            >
                                Đặt lại mật khẩu
                            </Button>
                        </Form.Item>
                    </Form>
                )}

                {current === 2 && (
                    <div className="text-center py-6">
                        <div
                            className="mx-auto mb-4 flex items-center justify-center"
                            style={{
                                width: 64,
                                height: 64,
                                borderRadius: '50%',
                                background: '#ECFDF5',
                                color: '#10B981',
                                fontSize: 28,
                            }}
                        >
                            ✓
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Thành công!</h3>
                        <p className="text-sm mb-6" style={{ color: '#64748B' }}>
                            Mật khẩu đã được đặt lại. Bạn có thể đăng nhập bằng mật khẩu mới.
                        </p>
                        <Link to="/login">
                            <Button
                                type="primary"
                                block
                                style={{ height: 46, fontWeight: 600, borderRadius: 10 }}
                            >
                                Đăng nhập ngay
                            </Button>
                        </Link>
                    </div>
                )}

                {current < 2 && (
                    <p className="text-center text-sm mt-6" style={{ color: '#64748B' }}>
                        Quay lại{' '}
                        <Link to="/login" style={{ color: '#4F46E5', fontWeight: 600 }}>
                            Đăng nhập
                        </Link>
                    </p>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;
