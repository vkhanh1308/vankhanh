import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Input, Modal, Form, message, Popconfirm, Tooltip, Row, Col, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, BankOutlined } from '@ant-design/icons';
import axios from 'axios';

const BASE_URL = 'http://localhost:8000';
const API_URL = `${BASE_URL}/api/co-quan/`;
const { Search } = Input;

const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token');
    return { Authorization: `Bearer ${token}` };
};

const ListCoQuan = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [form] = Form.useForm();

    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });

    const fetchData = async (page = 1, size = 10, keyword = '') => {
        setLoading(true);
        try {
            const response = await axios.get(API_URL, {
                headers: getAuthHeaders(),
                params: { page, size, keyword }
            });
            setData(response.data || []);
            setPagination(prev => ({
                ...prev,
                current: page,
                pageSize: size,
                total: response.data?.length || 0
            }));
        } catch (error) {
            message.error('Lỗi khi tải danh sách cơ quan!');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(pagination.current, pagination.pageSize);
    }, []);

    const handleTableChange = (paginationConfig) => {
        fetchData(paginationConfig.current, paginationConfig.pageSize, searchText);
    };

    const handleSearch = (value) => {
        setSearchText(value);
        fetchData(1, pagination.pageSize, value);
    };

    const handleAdd = () => {
        setEditingItem(null);
        form.resetFields();
        setIsModalVisible(true);
    };

    const handleEdit = (record) => {
        setEditingItem(record);
        form.setFieldsValue(record);
        setIsModalVisible(true);
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`${API_URL}${id}`, { headers: getAuthHeaders() });
            message.success('Xóa cơ quan thành công!');
            fetchData(pagination.current, pagination.pageSize, searchText);
        } catch (error) {
            message.error(error.response?.data?.detail || 'Lỗi khi xóa cơ quan!');
        }
    };

    const handleSubmit = async (values) => {
        try {
            if (editingItem) {
                await axios.put(`${API_URL}${editingItem.id}`, values, { headers: getAuthHeaders() });
                message.success('Cập nhật cơ quan thành công!');
            } else {
                await axios.post(API_URL, values, { headers: getAuthHeaders() });
                message.success('Thêm mới cơ quan thành công!');
            }

            setIsModalVisible(false);
            form.resetFields();
            fetchData(pagination.current, pagination.pageSize, searchText);
        } catch (error) {
            const errorMsg = error.response?.data?.detail || 'Lỗi hệ thống khi lưu cơ quan!';
            message.error(errorMsg);
        }
    };

    const columns = [
        {
            title: 'STT',
            key: 'stt',
            width: 50,
            align: 'center',
            render: (_, __, index) => (pagination.current - 1) * pagination.pageSize + index + 1
        },
        {
            title: 'Mã cơ quan',
            dataIndex: 'organ_id',
            key: 'organ_id',
            width: 140,
            render: (text) => (
                <Tag color="blue">{text || 'N/A'}</Tag>
            )
        },
        {
            title: 'Tên cơ quan / Tổ chức',
            dataIndex: 'ten_co_quan',
            key: 'ten_co_quan',
            width: 260,
            render: (text) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <BankOutlined style={{ fontSize: 16, color: '#1677ff' }} />
                    <strong>{text}</strong>
                </div>
            )
        },
        {
            title: 'Địa chỉ',
            dataIndex: 'dia_chi',
            key: 'dia_chi',
            width: 280,
            ellipsis: true,
            render: (text) => (
                <Tooltip title={text || '---'} placement="topLeft" color="blue">
                    <span>{text || '---'}</span>
                </Tooltip>
            )
        },
        {
            title: 'Hành động',
            key: 'action',
            align: 'center',
            width: 130,
            render: (_, record) => (
                <Space size="small" style={{ whiteSpace: 'nowrap' }}>
                    <Tooltip title="Chỉnh sửa">
                        <Button
                            type="primary"
                            icon={<EditOutlined />}
                            size="small"
                            onClick={() => handleEdit(record)}
                        />
                    </Tooltip>
                    <Tooltip title="Xóa">
                        <Popconfirm 
                            title="Xóa cơ quan" 
                            description="Bạn có chắc muốn xóa cơ quan này?" 
                            onConfirm={() => handleDelete(record.id)}
                            okText="Đồng ý"
                            cancelText="Hủy"
                        >
                            <Button type="primary" danger icon={<DeleteOutlined />} size="small" />
                        </Popconfirm>
                    </Tooltip>
                </Space>
            )
        }
    ];

    return (
        <div style={{ padding: '24px', background: '#fff', borderRadius: '8px' }}>
            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                <Col flex="auto">
                    <Search
                        placeholder="🔍 Tìm kiếm theo tên cơ quan..."
                        allowClear
                        onSearch={handleSearch}
                        style={{ width: '100%' }}
                        size="large"
                    />
                </Col>
                <Col>
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} size="large">
                        Thêm mới
                    </Button>
                </Col>
            </Row>

            <Table
                rowKey="id"
                columns={columns}
                dataSource={data}
                loading={loading}
                pagination={pagination}
                onChange={handleTableChange}
                scroll={{ x: 'max-content' }}
                size="middle"
                bordered
            />

            <Modal
                title={editingItem ? 'Cập nhật thông tin cơ quan' : 'Thêm mới cơ quan'}
                open={isModalVisible}
                onOk={() => form.submit()}
                onCancel={() => {
                    setIsModalVisible(false);
                    form.resetFields();
                }}
                okText="Lưu"
                cancelText="Hủy"
                width={650}
            >
                <Form layout="vertical" form={form} onFinish={handleSubmit}>
                    <Form.Item 
                        label="Mã cơ quan" 
                        name="organ_id"
                        rules={[{ required: true, message: 'Vui lòng nhập mã cơ quan' }]}
                    >
                        <Input placeholder="Ví dụ: ORG001" disabled={!!editingItem} />
                    </Form.Item>
                    <Form.Item 
                        label="Tên cơ quan / Tổ chức" 
                        name="ten_co_quan"
                        rules={[{ required: true, message: 'Vui lòng nhập tên cơ quan' }]}
                    >
                        <Input placeholder="Ví dụ: Sở Giáo dục và Đào tạo" />
                    </Form.Item>
                    <Form.Item label="Địa chỉ" name="dia_chi">
                        <Input.TextArea 
                            rows={3}
                            placeholder="Ví dụ: 123 Đường ABC, Phường XYZ, Quận 1, TP HCM"
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default ListCoQuan;
