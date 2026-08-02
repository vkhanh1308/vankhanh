import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Input, Modal, Form, Select, message, Popconfirm, Tooltip, Tag, Card, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined, PhoneOutlined, MailOutlined } from '@ant-design/icons';
import axios from 'axios';

const BASE_URL = 'http://localhost:8000';
const API_URL = `${BASE_URL}/api/can-bo/`;
const { Search } = Input;

const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token');
    return { Authorization: `Bearer ${token}` };
};

const ListCanBo = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [coQuanOptions, setCoQuanOptions] = useState([]);
    const [form] = Form.useForm();

    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });

    const fetchCoQuanOptions = async () => {
        try {
            const response = await axios.get(`${BASE_URL}/api/co-quan/`, { headers: getAuthHeaders() });
            const options = (response.data || []).map(item => ({ label: item.ten_co_quan, value: item.id }));
            setCoQuanOptions(options);
        } catch (error) {
            console.warn('Không tải được danh sách cơ quan:', error.message);
        }
    };

    const fetchData = async (page = 1, size = 10, keyword = searchText) => {
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
            message.error('Lỗi khi tải danh sách cán bộ!');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCoQuanOptions();
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
        setEditingRecord(null);
        form.resetFields();
        setIsModalVisible(true);
    };

    const handleEdit = (record) => {
        setEditingRecord(record);
        form.setFieldsValue(record);
        setIsModalVisible(true);
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`${API_URL}${id}`, { headers: getAuthHeaders() });
            message.success('Xóa cán bộ thành công!');
            fetchData(pagination.current, pagination.pageSize, searchText);
        } catch (error) {
            message.error(error.response?.data?.detail || 'Lỗi khi xóa cán bộ!');
        }
    };

    const handleSubmit = async (values) => {
        try {
            if (editingRecord) {
                await axios.put(`${API_URL}${editingRecord.id}`, values, { headers: getAuthHeaders() });
                message.success('Cập nhật cán bộ thành công!');
            } else {
                await axios.post(API_URL, values, { headers: getAuthHeaders() });
                message.success('Thêm mới cán bộ thành công!');
            }

            setIsModalVisible(false);
            form.resetFields();
            fetchData(pagination.current, pagination.pageSize, searchText);
        } catch (error) {
            const errorMsg = error.response?.data?.detail || 'Lỗi hệ thống khi lưu cán bộ!';
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
            title: 'Họ và tên',
            dataIndex: 'ho_ten',
            key: 'ho_ten',
            width: 160,
            render: (text) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <UserOutlined style={{ fontSize: 16, color: '#1677ff' }} />
                    <strong>{text}</strong>
                </div>
            )
        },
        {
            title: 'Chức vụ',
            dataIndex: 'chuc_vu',
            key: 'chuc_vu',
            width: 200,
            render: (text) => {
                if (!text) return <span style={{ color: '#8c8c8c' }}>Chưa cập nhật</span>;
                let color = 'default';
                if (text.toLowerCase().includes('giám đốc') || text.toLowerCase().includes('lãnh đạo')) color = 'red';
                else if (text.toLowerCase().includes('chánh')) color = 'purple';
                else if (text.toLowerCase().includes('chuyên viên')) color = 'blue';
                return <Tag color={color}>{text}</Tag>;
            }
        },
        {
            title: 'Đơn vị',
            dataIndex: 'co_quan_id',
            key: 'co_quan_id',
            width: 250,
            render: (id) => {
                const coQuan = coQuanOptions.find(item => item.value === id);
                return (
                    <Tooltip title={coQuan?.label || '---'}>
                        <span>{coQuan?.label || '---'}</span>
                    </Tooltip>
                );
            }
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
                            title="Xóa cán bộ" 
                            description="Bạn có chắc muốn xóa cán bộ này?" 
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
                        placeholder="🔍 Tìm kiếm theo tên cán bộ..."
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
                title={editingRecord ? 'Cập nhật thông tin cán bộ' : 'Thêm mới cán bộ'}
                open={isModalVisible}
                onOk={() => form.submit()}
                onCancel={() => {
                    setIsModalVisible(false);
                    form.resetFields();
                }}
                okText="Lưu"
                cancelText="Hủy"
                width={600}
            >
                <Form layout="vertical" form={form} onFinish={handleSubmit}>
                    <Form.Item 
                        label="Họ và tên" 
                        name="ho_ten" 
                        rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
                    >
                        <Input placeholder="Ví dụ: Nguyễn Văn A" />
                    </Form.Item>
                    <Form.Item label="Chức vụ" name="chuc_vu">
                        <Select
                            placeholder="Chọn hoặc nhập chức vụ"
                            allowClear
                            showSearch
                            options={[
                                { label: 'Lãnh đạo', value: 'Lãnh đạo' },
                                { label: 'Giám đốc', value: 'Giám đốc' },
                                { label: 'Chánh văn phòng', value: 'Chánh văn phòng' },
                                { label: 'Trưởng phòng', value: 'Trưởng phòng' },
                                { label: 'Phó phòng', value: 'Phó phòng' },
                                { label: 'Chuyên viên', value: 'Chuyên viên' }
                            ]}
                        />
                    </Form.Item>
                    <Form.Item 
                        label="Đơn vị/Cơ quan" 
                        name="co_quan_id" 
                        rules={[{ required: true, message: 'Vui lòng chọn cơ quan' }]}
                    >
                        <Select 
                            options={coQuanOptions} 
                            placeholder="Chọn cơ quan" 
                            showSearch
                            filterOption={(input, option) =>
                                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                            }
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default ListCanBo;
