import React, { useState } from 'react';
import { Layout, Menu, Button, message, Avatar, Dropdown } from 'antd';
import {
    DashboardOutlined,
    FileTextOutlined,
    SendOutlined,
    FolderOpenOutlined,
    ApartmentOutlined,
    LogoutOutlined,
    UserOutlined,
    BankOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    FileOutlined
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

const { Sider, Header, Content } = Layout;

const AdminLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(false);

    const userRoles = JSON.parse(localStorage.getItem('user_roles') || '[]') || [];
    const isAdmin = userRoles.includes('ADMIN');

    const menuItems = [
        { key: '/dashboard', icon: <DashboardOutlined />, label: 'Bảng điều khiển' },
        { key: '/van-ban-den', icon: <FileTextOutlined />, label: 'Văn bản đến' },
        { key: '/van-ban-di', icon: <SendOutlined />, label: 'Văn bản đi' },
        { key: '/ho-so', icon: <FolderOpenOutlined />, label: 'Hồ sơ lưu trữ' },
        { key: '/can-bo', icon: <UserOutlined />, label: 'Cán bộ' },
        { key: '/co-quan', icon: <BankOutlined />, label: 'Cơ quan' },
        isAdmin ? {
            key: '/tai-khoan',
            icon: <UserOutlined />,
            label: 'Quản lý tài khoản',
        } : null
    ].filter(Boolean);

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_roles');

        message.success('Đăng xuất thành công');
        navigate('/login');
    };

    const userMenu = [
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: 'Đăng xuất',
            onClick: handleLogout,
        }
    ];

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider
                collapsible
                collapsed={collapsed}
                onCollapse={setCollapsed}
                width={260}
                style={{
                    background: 'linear-gradient(135deg, #4c63d2 0%, #5a3d7d 100%)',
                    position: 'fixed',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    zIndex: 1000,
                    boxShadow: '4px 0 12px rgba(76, 99, 210, 0.15)'
                }}
                trigger={null}
            >
                <div
                    style={{
                        height: 72,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontWeight: 900,
                        fontSize: collapsed ? 18 : 24,
                        borderBottom: '2px solid rgba(255,255,255,0.2)',
                        background: 'rgba(0,0,0,0.2)',
                        letterSpacing: 1,
                        textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                    }}
                >
                    <FileOutlined style={{ marginRight: collapsed ? 0 : 12, fontSize: collapsed ? 20 : 28 }} />
                    {!collapsed && 'DMS'}
                </div>

                <Menu
                    theme="dark"
                    mode="inline"
                    selectedKeys={[location.pathname]}
                    items={menuItems}
                    onClick={({ key }) => navigate(key)}
                    style={{
                        background: 'transparent',
                        border: 'none'
                    }}
                    itemLabelRender={(label, item) => (
                        <span style={{ fontSize: 15, fontWeight: 500 }}>{label}</span>
                    )}
                />
            </Sider>

            <Layout
                style={{
                    marginLeft: collapsed ? 80 : 260,
                    transition: 'all 0.2s'
                }}
            >
                <Header
                    style={{
                        background: '#fff',
                        padding: '0 28px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: '2px solid #f0f0f0',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        height: 72,
                        position: 'sticky',
                        top: 0,
                        zIndex: 999
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <Button
                            type="text"
                            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                            onClick={() => setCollapsed(!collapsed)}
                            style={{ fontSize: 20, color: '#1890ff' }}
                        />
                        <span style={{ fontSize: 17, fontWeight: 700, color: '#1890ff', letterSpacing: 0.5 }}>
                            {menuItems.find((item) => item.key === location.pathname)?.label || 'Bảng điều khiển'}
                        </span>
                    </div>

                    <Dropdown menu={{ items: userMenu }} placement="bottomRight">
                        <Button type="text" style={{ padding: 0 }}>
                            <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff', cursor: 'pointer', width: 40, height: 40, fontSize: 18 }} />
                        </Button>
                    </Dropdown>
                </Header>

                <Content
                    style={{
                        margin: 24,
                        minHeight: 280,
                        background: '#f5f7fb',
                        borderRadius: 8
                    }}
                >
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    );
};

export default AdminLayout;
