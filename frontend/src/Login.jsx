import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Form, Input, message, Row, Col, Typography, Space } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined, FileOutlined } from '@ant-design/icons';
import axios from 'axios';
import logo from './assets/CTU_logo.png';

const { Title, Text, Paragraph } = Typography;

const Login = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const onFinish = async (values) => {
        setLoading(true);
        const params = new URLSearchParams();
        params.append('username', values.username);
        params.append('password', values.password);

        try {
            const response = await axios.post(
                'http://localhost:8000/api/auth/login',
                params,
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );

            if (response.status === 200) {
                localStorage.setItem('access_token', response.data.access_token);
                localStorage.setItem('user_roles', JSON.stringify(response.data.vai_tros || []));

                message.success('Đăng nhập thành công! 🎉');
                navigate('/dashboard');
            }
        } catch (error) {
            message.error('Sai tài khoản hoặc mật khẩu!');
            console.error('Lỗi đăng nhập:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
                position: 'relative'
            }}
        >
            <Row gutter={[32, 32]} style={{ width: '100%', maxWidth: 1000 }} justify="center" align="middle">
                {/* Left Section - Branding */}
                <Col xs={24} md={12} style={{ textAlign: 'center', color: 'white' }}>
                    {/* Logo CTU */}
                    <img
                        src={logo}
                        alt="Logo CTU"
                        style={{
                            height: '120px',
                            objectFit: 'contain',
                            marginBottom: '32px',
                            marginTop: '-20px'
                        }}
                    />

                    <div style={{ marginBottom: '32px' }}>
                        <FileOutlined style={{ fontSize: '64px', marginBottom: '16px', display: 'block' }} />
                        <Title level={1} style={{ color: 'white', margin: '16px 0 8px 0' }}>
                            Document Management System
                        </Title>
                        <Paragraph style={{ color: 'rgba(255,255,255,0.8)', fontSize: '16px' }}>
                            Quản lý tài liệu theo Nghị định 30/2020/NĐ-CP
                        </Paragraph>
                    </div>

                    <Space direction="vertical" style={{ width: '100%', textAlign: 'center', marginTop: '32px' }}>
                        <div style={{ display: 'flex', gap: '12px', color: 'rgba(255,255,255,0.9)', justifyContent: 'center' }}>
                            <span style={{ fontSize: '20px' }}>✓</span>
                            <span>Quản lý văn bản đến/đi hiệu quả</span>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', color: 'rgba(255,255,255,0.9)', justifyContent: 'center' }}>
                            <span style={{ fontSize: '20px' }}>✓</span>
                            <span>Lưu trữ hồ sơ an toàn và bảo mật</span>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', color: 'rgba(255,255,255,0.9)', justifyContent: 'center' }}>
                            <span style={{ fontSize: '20px' }}>✓</span>
                            <span>Phân phối công việc theo quy trình</span>
                        </div>
                    </Space>
                </Col>

                {/* Right Section - Login Form */}
                <Col xs={24} md={12}>
                    <Card
                        style={{
                            borderRadius: '12px',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                            padding: '40px',
                            border: 'none'
                        }}
                    >
                        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                            <Title level={2} style={{ margin: '0 0 8px 0', color: '#001529' }}>
                                Đăng nhập
                            </Title>
                            <Text type="secondary" style={{ fontSize: '14px' }}>
                                Vào hệ thống quản lý tài liệu
                            </Text>
                        </div>

                        <Form layout="vertical" onFinish={onFinish} size="large" autoComplete="off">
                            <Form.Item
                                label="Tên đăng nhập"
                                name="username"
                                rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập' }]}
                            >
                                <Input
                                    prefix={<UserOutlined />}
                                    placeholder="Nhập tên đăng nhập"
                                    style={{ borderRadius: '6px', padding: '8px 12px' }}
                                />
                            </Form.Item>

                            <Form.Item
                                label="Mật khẩu"
                                name="password"
                                rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
                            >
                                <Input.Password
                                    prefix={<LockOutlined />}
                                    placeholder="Nhập mật khẩu"
                                    style={{ borderRadius: '6px', padding: '8px 12px' }}
                                />
                            </Form.Item>

                            <Form.Item>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={loading}
                                    block
                                    size="large"
                                    icon={<LoginOutlined />}
                                    style={{
                                        borderRadius: '6px',
                                        fontWeight: 600,
                                        height: '44px',
                                        fontSize: '16px'
                                    }}
                                >
                                    Đăng nhập
                                </Button>
                            </Form.Item>
                        </Form>

                        <Paragraph
                            type="secondary"
                            style={{
                                textAlign: 'center',
                                marginTop: '20px',
                                fontSize: '12px',
                                color: '#8c8c8c'
                            }}
                        >
                            Hệ thống quản lý tài liệu - Mọi quyền được bảo lưu ©2024
                        </Paragraph>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default Login;