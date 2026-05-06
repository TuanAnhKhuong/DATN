import { useState } from 'react';
import logoImg from '../../assets/logo.png';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Divider } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const Register = () => {
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const onFinish = async (values) => {
        setLoading(true);
        try {
            await register(values.fullName, values.email, values.password);
            toast.success('Đăng ký thành công!');
            navigate('/dashboard');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Đăng ký thất bại');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-logo">
                    <img
                        src={logoImg}
                        alt="Hải Hương"
                        style={{ height: 90, objectFit: 'contain', display: 'block', margin: '0 auto 8px' }}
                    />
                    <h1>Hải Hương</h1>
                    <p>Tạo tài khoản — Đăng ký để sử dụng hệ thống</p>
                </div>

                <Form
                    name="register"
                    onFinish={onFinish}
                    layout="vertical"
                    size="large"
                    requiredMark={false}
                >
                    <Form.Item
                        name="fullName"
                        label="Họ và tên"
                        rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
                    >
                        <Input prefix={<UserOutlined />} placeholder="Nhập họ và tên" />
                    </Form.Item>

                    <Form.Item
                        name="email"
                        label="Email"
                        rules={[
                            { required: true, message: 'Vui lòng nhập email' },
                            { type: 'email', message: 'Email không hợp lệ' },
                        ]}
                    >
                        <Input prefix={<MailOutlined />} placeholder="Nhập email" />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        label="Mật khẩu"
                        rules={[
                            { required: true, message: 'Vui lòng nhập mật khẩu' },
                            { min: 6, message: 'Mật khẩu ít nhất 6 ký tự' },
                        ]}
                    >
                        <Input.Password prefix={<LockOutlined />} placeholder="Nhập mật khẩu" />
                    </Form.Item>

                    <Form.Item
                        name="confirmPassword"
                        label="Xác nhận mật khẩu"
                        dependencies={['password']}
                        rules={[
                            { required: true, message: 'Vui lòng xác nhận mật khẩu' },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue('password') === value) {
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
                            style={{
                                height: 46,
                                fontSize: 15,
                                fontWeight: 600,
                                borderRadius: 10,
                            }}
                        >
                            Đăng ký
                        </Button>
                    </Form.Item>
                </Form>

                <Divider plain style={{ color: '#94A3B8', fontSize: 13 }}>
                    hoặc
                </Divider>

                <p className="text-center text-sm" style={{ color: '#64748B' }}>
                    Đã có tài khoản?{' '}
                    <Link to="/login" style={{ color: '#4F46E5', fontWeight: 600 }}>
                        Đăng nhập
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
