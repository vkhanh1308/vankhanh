import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Space, Tag, Tooltip, Popconfirm, Modal, Form, Select, message, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined, LockOutlined } from '@ant-design/icons';
import axios from 'axios';

const BASE_URL = 'http://localhost:8000';
const { Search } = Input;

const ListTaiKhoan = () => {
    const [data, setData] = useState([]);
    const [vaiTros, setVaiTros] = useState([]);
    const [canBos, setCanBos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form] = Form.useForm();
    const [searchText, setSearchText] = useState('');

    const userRoles = JSON.parse(localStorage.getItem('user_roles') || '[]');
    const canEditMasterData = userRoles.includes('ADMIN');

    const getAuthHeaders = () => {
        const token = localStorage.getItem('access_token');
        return { Authorization: `Bearer ${token}` };
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const headers = getAuthHeaders();
            const [tkRes, vtRes, cbRes] = await Promise.all([
                axios.get(`${BASE_URL}/api/tai-khoan/`, { headers }),
                axios.get(`${BASE_URL}/api/tai-khoan/vai-tro`, { headers }),
                axios.get(`${BASE_URL}/api/can-bo/`, { headers })
            ]);
            setData(tkRes.data);
            setVaiTros(vtRes.data);
            setCanBos(cbRes.data);
        } catch (error) {
            message.error('Lỗi tải dữ liệu!');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleOpenModal = (record = null) => {
        setEditingId(record ? record.id : null);
        form.resetFields();
        if (record) {
            form.setFieldsValue({
                ten_dang_nhap: record.ten_dang_nhap,
                can_bo_id: record.can_bo_id,
                vai_tro_ids: record.vai_tros?.map(v => v.id) || [],
            });
        }
        setModalVisible(true);
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            const headers = getAuthHeaders();

            if (editingId) {
                if (!values.mat_khau) delete values.mat_khau;
                await axios.put(`${BASE_URL}/api/tai-khoan/${editingId}`, values, { headers });
                message.success('Cập nhật thành công!');
            } else {
                await axios.post(`${BASE_URL}/api/tai-khoan/`, values, { headers });
                message.success('Tạo tài khoản thành công!');
            }
            setModalVisible(false);
            fetchData();
        } catch (info) {
            if (info.errorFields) message.error('Vui lòng điền đầy đủ thông tin bắt buộc!');
            else if (info.response?.data?.detail) {
                message.error(info.response.data.detail);
            }
        }
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`${BASE_URL}/api/tai-khoan/${id}`, { headers: getAuthHeaders() });
            message.success('Xóa thành công!');
            fetchData();
        } catch (error) {
            if (error.response?.data?.detail) {
                message.error(error.response.data.detail);
            } else {
                message.error('Lỗi khi xóa tài khoản!');
            }
        }
    };

    const filteredData = data.filter(item => {
        if (!searchText) return true;
        return item.ten_dang_nhap.toLowerCase().includes(searchText.toLowerCase());
    });

    const columns = [
        {
            title: 'STT',
            key: 'stt',
            width: 50,
            align: 'center',
            render: (_, __, index) => index + 1
        },
        {
            title: 'Tên đăng nhập',
            dataIndex: 'ten_dang_nhap',
            key: 'ten_dang_nhap',
            width: 180,
            render: (text) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <UserOutlined style={{ fontSize: 16, color: '#1677ff' }} />
                    <strong>{text}</strong>
                </div>
            )
        },
        {
            title: 'Cán bộ gán với',
            dataIndex: 'can_bo_id',
            key: 'can_bo_id',
            width: 220,
            render: (id) => {
                const canBo = canBos.find(cb => cb.id === id);
                return (
                    <Tooltip title={canBo ? `${canBo.ho_ten} (${canBo.chuc_vu || 'N/A'})` : '---'}>
                        <span>{canBo?.ho_ten || '---'}</span>
                    </Tooltip>
                );
            }
        },
        {
            title: 'Vai trò',
            dataIndex: 'vai_tros',
            key: 'vai_tros',
            width: 220,
            render: (vt_list) => {
                if (!vt_list || vt_list.length === 0) return <Tag>Không có vai trò</Tag>;
                return (
                    <Space size="small" wrap>
                        {vt_list.map((vt) => {
                            let color = 'default';
                            if (vt.ten_vai_tro === 'ADMIN') color = 'red';
                            else if (vt.ten_vai_tro === 'MANAGER') color = 'orange';
                            else if (vt.ten_vai_tro === 'USER') color = 'blue';
                            return <Tag key={vt.id} color={color}>{vt.ten_vai_tro}</Tag>;
                        })}
                    </Space>
                );
            }
        },
        {
            title: 'Hành động',
            key: 'action',
            align: 'center',
            width: 130,
            render: (_, record) => (
                canEditMasterData ? (
                    <Space size="small" style={{ whiteSpace: 'nowrap' }}>
                        <Tooltip title="Chỉnh sửa">
                            <Button
                                type="primary"
                                icon={<EditOutlined />}
                                size="small"
                                onClick={() => handleOpenModal(record)}
                            />
                        </Tooltip>
                        <Tooltip title="Xóa">
                            <Popconfirm 
                                title="Xóa tài khoản" 
                                description="Bạn có chắc muốn xóa tài khoản này?"
                                onConfirm={() => handleDelete(record.id)}
                                okText="Đồng ý"
                                cancelText="Hủy"
                            >
                                <Button type="primary" danger icon={<DeleteOutlined />} size="small" />
                            </Popconfirm>
                        </Tooltip>
                    </Space>
                ) : (
                    <span style={{ color: '#999' }}>Không có quyền</span>
                )
            )
        }
    ];

    return (
        <div style={{ padding: '24px', background: '#fff', borderRadius: '8px' }}>
            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                <Col flex="auto">
                    <Search
                        placeholder="🔍 Tìm kiếm theo tên đăng nhập..."
                        allowClear
                        onChange={(e) => setSearchText(e.target.value)}
                        style={{ width: '100%' }}
                        size="large"
                    />
                </Col>
                {canEditMasterData && (
                    <Col>
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()} size="large">
                            Thêm mới
                        </Button>
                    </Col>
                )}
            </Row>

            <Table
                rowKey="id"
                columns={columns}
                dataSource={filteredData}
                loading={loading}
                size="middle"
                bordered
                pagination={{ pageSize: 10 }}
                scroll={{ x: 'max-content' }}
            />

            <Modal
                title={editingId ? 'Cập nhật tài khoản' : 'Tạo tài khoản mới'}
                open={modalVisible}
                onOk={handleSubmit}
                onCancel={() => {
                    setModalVisible(false);
                    form.resetFields();
                }}
                okText="Lưu"
                cancelText="Hủy"
                width={600}
            >
                <Form layout="vertical" form={form}>
                    <Form.Item
                        label="Tên đăng nhập"
                        name="ten_dang_nhap"
                        rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập!' }]}
                    >
                        <Input placeholder="Ví dụ: admin@example.com" disabled={!!editingId} />
                    </Form.Item>

                    {!editingId && (
                        <Form.Item
                            label="Mật khẩu"
                            name="mat_khau"
                            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
                        >
                            <Input.Password placeholder="Nhập mật khẩu" prefix={<LockOutlined />} />
                        </Form.Item>
                    )}

                    <Form.Item
                        label="Cán bộ"
                        name="can_bo_id"
                        rules={[{ required: true, message: 'Vui lòng chọn cán bộ!' }]}
                    >
                        <Select
                            placeholder="Chọn cán bộ"
                            showSearch
                            optionLabelProp="label"
                            options={canBos.map(cb => ({
                                value: cb.id,
                                label: `${cb.ho_ten} (${cb.chuc_vu || 'N/A'})`
                            }))}
                            filterOption={(input, option) =>
                                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                            }
                        />
                    </Form.Item>

                    <Form.Item
                        label="Vai trò"
                        name="vai_tro_ids"
                        rules={[{ required: true, message: 'Vui lòng chọn ít nhất một vai trò!' }]}
                    >
                        <Select
                            mode="multiple"
                            placeholder="Chọn vai trò"
                            options={vaiTros.map(vt => ({
                                value: vt.id,
                                label: vt.ten_vai_tro
                            }))}
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};
export default ListTaiKhoan;