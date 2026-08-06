import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Progress, Tag, Spin, Typography, message, Button, Space } from 'antd';
import { FileTextOutlined, InboxOutlined, FolderOpenOutlined, ArrowUpOutlined, ReloadOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;
const BASE_URL = 'http://localhost:8000';

const Dashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const getAuthHeaders = () => {
        const token = localStorage.getItem('access_token');
        return { Authorization: `Bearer ${token}` };
    };

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`${BASE_URL}/api/thong-ke/tong-quan`, { headers: getAuthHeaders() });
            setData(response.data);
        } catch (error) {
            console.error("Lỗi tải dữ liệu thống kê", error);
            const detail = error?.response?.data?.detail || 'Không thể tải dữ liệu thống kê';
            setError(detail);
            message.error(detail);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (loading) return (
        <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" tip="Đang tải dữ liệu..." />
        </div>
    );

    if (error) return (
        <div style={{ textAlign: 'center', padding: '50px' }}>
            <p style={{ marginBottom: 16, color: '#ff4d4f' }}>Lỗi khi tải dữ liệu: {error}</p>
            <Button type="primary" onClick={fetchData}>Thử lại</Button>
        </div>
    );

    if (!data) return null;

    const calcPercent = (value, total) => total === 0 ? 0 : Math.round((value / total) * 100);

    return (
        <div style={{ padding: '0' }}>
            {/* Header */}
            <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
                <Col xs={24}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <Title level={2} style={{ margin: 0, color: '#001529' }}>
                                📊 Tổng quan Hệ thống
                            </Title>
                            <Text type="secondary">Cập nhật lúc: {new Date().toLocaleTimeString('vi-VN')}</Text>
                        </div>
                        <Button 
                            type="primary" 
                            icon={<ReloadOutlined />} 
                            onClick={fetchData}
                            loading={loading}
                        >
                            Tải lại
                        </Button>
                    </div>
                </Col>
            </Row>

            {/* Statistics Cards */}
            <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
                <Col xs={24} sm={12} lg={8}>
                    <Card
                        hoverable
                        style={{ 
                            borderTop: '4px solid #1677ff',
                            borderRadius: '8px',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                        }}
                    >
                        <Statistic
                            title="Tổng Văn bản đi"
                            value={data.van_ban_di.tong}
                            prefix={<FileTextOutlined style={{ color: '#1677ff', marginRight: 8 }} />}
                            suffix="văn bản"
                            valueStyle={{ color: '#1677ff', fontSize: 24, fontWeight: 600 }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={8}>
                    <Card
                        hoverable
                        style={{ 
                            borderTop: '4px solid #52c41a',
                            borderRadius: '8px',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                        }}
                    >
                        <Statistic
                            title="Tổng Văn bản đến"
                            value={data.van_ban_den.tong}
                            prefix={<InboxOutlined style={{ color: '#52c41a', marginRight: 8 }} />}
                            suffix="văn bản"
                            valueStyle={{ color: '#52c41a', fontSize: 24, fontWeight: 600 }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={8}>
                    <Card
                        hoverable
                        style={{ 
                            borderTop: '4px solid #faad14',
                            borderRadius: '8px',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                        }}
                    >
                        <Statistic
                            title="Tổng Hồ sơ lưu trữ"
                            value={data.ho_so.tong}
                            prefix={<FolderOpenOutlined style={{ color: '#faad14', marginRight: 8 }} />}
                            suffix="hồ sơ"
                            valueStyle={{ color: '#faad14', fontSize: 24, fontWeight: 600 }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Details */}
            <Row gutter={[24, 24]}>
                {/* Văn bản đi */}
                <Col xs={24} lg={8}>
                    <Card title="📤 Trạng thái Văn bản đi" bordered={false} style={{ borderRadius: '8px' }}>
                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <Text>Nháp (DRAFT)</Text>
                                <Tag color="default">{data.van_ban_di.trang_thai.DRAFT}</Tag>
                            </div>
                            <Progress 
                                percent={calcPercent(data.van_ban_di.trang_thai.DRAFT, data.van_ban_di.tong)} 
                                size="small" 
                                status="normal" 
                            />
                        </div>
                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <Text>Chờ duyệt (PENDING)</Text>
                                <Tag color="warning">{data.van_ban_di.trang_thai.PENDING_APPROVAL}</Tag>
                            </div>
                            <Progress 
                                percent={calcPercent(data.van_ban_di.trang_thai.PENDING_APPROVAL, data.van_ban_di.tong)} 
                                size="small" 
                                status="active" 
                                strokeColor="#faad14" 
                            />
                        </div>
                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <Text>Phê duyệt (APPROVED)</Text>
                                <Tag color="success">{data.van_ban_di.trang_thai.APPROVED}</Tag>
                            </div>
                            <Progress 
                                percent={calcPercent(data.van_ban_di.trang_thai.APPROVED, data.van_ban_di.tong)} 
                                size="small" 
                                status="success" 
                            />
                        </div>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <Text>Công bố (PUBLISHED)</Text>
                                <Tag color="blue">{data.van_ban_di.trang_thai.PUBLISHED}</Tag>
                            </div>
                            <Progress 
                                percent={calcPercent(data.van_ban_di.trang_thai.PUBLISHED, data.van_ban_di.tong)} 
                                size="small" 
                            />
                        </div>
                    </Card>
                </Col>

                {/* Văn bản đến */}
                <Col xs={24} lg={8}>
                    <Card title="📥 Trạng thái Văn bản đến" bordered={false} style={{ borderRadius: '8px' }}>
                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <Text>Chờ xử lý</Text>
                                <Tag color="orange">{data.van_ban_den.trang_thai.CHO_XU_LY}</Tag>
                            </div>
                            <Progress 
                                percent={calcPercent(data.van_ban_den.trang_thai.CHO_XU_LY, data.van_ban_den.tong)} 
                                size="small" 
                                status="active" 
                                strokeColor="#faad14"
                            />
                        </div>
                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <Text>Đang xử lý</Text>
                                <Tag color="processing">{data.van_ban_den.trang_thai.DANG_XU_LY}</Tag>
                            </div>
                            <Progress 
                                percent={calcPercent(data.van_ban_den.trang_thai.DANG_XU_LY, data.van_ban_den.tong)} 
                                size="small" 
                                status="active" 
                            />
                        </div>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <Text>Đã xử lý</Text>
                                <Tag color="success">{data.van_ban_den.trang_thai.DA_XU_LY}</Tag>
                            </div>
                            <Progress 
                                percent={calcPercent(data.van_ban_den.trang_thai.DA_XU_LY, data.van_ban_den.tong)} 
                                size="small" 
                                status="success" 
                            />
                        </div>
                    </Card>
                </Col>

                {/* Hồ sơ */}
                <Col xs={24} lg={8}>
                    <Card title="📁 Trạng thái Hồ sơ" bordered={false} style={{ borderRadius: '8px' }}>
                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <Text>Đang tiếp nhận</Text>
                                <Tag color="processing">{data.ho_so.trang_thai.DANG_TIEN_NHAN}</Tag>
                            </div>
                            <Progress 
                                percent={calcPercent(data.ho_so.trang_thai.DANG_TIEN_NHAN, data.ho_so.tong)} 
                                size="small" 
                                status="active" 
                            />
                        </div>
                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <Text>Đang xử lý</Text>
                                <Tag color="warning">{data.ho_so.trang_thai.DANG_XU_LY}</Tag>
                            </div>
                            <Progress 
                                percent={calcPercent(data.ho_so.trang_thai.DANG_XU_LY, data.ho_so.tong)} 
                                size="small" 
                                status="active" 
                                strokeColor="#faad14"
                            />
                        </div>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <Text>Đã đóng</Text>
                                <Tag color="success">{data.ho_so.trang_thai.DA_DONG}</Tag>
                            </div>
                            <Progress 
                                percent={calcPercent(data.ho_so.trang_thai.DA_DONG, data.ho_so.tong)} 
                                size="small" 
                                status="success" 
                            />
                        </div>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default Dashboard;
