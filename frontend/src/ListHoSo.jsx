import React, { useState, useEffect } from 'react';
import { Tag, Tabs, Table, Button, Space, Modal, Form, Input, DatePicker, InputNumber, Select, message, Popconfirm, Tooltip } from 'antd';
import axios from 'axios';
import dayjs from 'dayjs';
import { EyeOutlined, FileDoneOutlined, EditOutlined, LockOutlined, DeleteOutlined, PaperClipOutlined } from '@ant-design/icons';
const API_URL = 'http://localhost:8000/api/ho-so/';
const BASE_URL = 'http://localhost:8000';

const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token');
    return { Authorization: `Bearer ${token}` };
};

const ListHoSo = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [form] = Form.useForm();
    const [searchText, setSearchText] = useState('');
    const [viTriOptions, setViTriOptions] = useState([]);

    // State cho Modal chi tiết văn bản
    const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
    const [currentHoSo, setCurrentHoSo] = useState(null);
    const [vbDenData, setVbDenData] = useState([]);
    const [vbDiData, setVbDiData] = useState([]);
    const [modalLoading, setModalLoading] = useState(false);
    const [nopLuuLoading, setNopLuuLoading] = useState(null);
    // 1. Khởi tạo State phân trang
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });

    // 2. Cập nhật hàm fetchData để truyền tham số page, size, keyword
    const fetchData = async (page = 1, size = 10, keyword = '') => {
        setLoading(true);
        try {
            const response = await axios.get(API_URL, {
                headers: getAuthHeaders(),
                params: { page, size, keyword }
            });
            setData(response.data.data || []);
            setPagination(prev => ({
                ...prev,
                current: page,
                pageSize: size,
                total: response.data.total
            }));
        } catch (error) {
            message.error('Lỗi khi tải danh sách hồ sơ!');
        } finally {
            setLoading(false);
        }
    };

    const fetchOptions = async () => {
        try {
            const res = await axios.get(`${BASE_URL}/api/danh-muc-vi-tri/`, { headers: getAuthHeaders() });
            setViTriOptions(res.data.map(item => ({ label: item.ten_vi_tri, value: item.id })));
        } catch (error) {
            console.warn("Không tải được danh mục vị trí (API chưa tồn tại)");
        }
    };

    // 3. Gọi fetch dữ liệu trang 1 khi load
    useEffect(() => {
        fetchData(pagination.current, pagination.pageSize);
        fetchOptions();
    }, []);

    // 4. Xử lý chuyển trang trên Table
    const handleTableChange = (paginationConfig) => {
        fetchData(paginationConfig.current, paginationConfig.pageSize, searchText);
    };

    // 5. Xử lý tìm kiếm
    const handleSearch = (value) => {
        setSearchText(value);
        fetchData(1, pagination.pageSize, value); // Đưa về trang 1 khi có từ khóa mới
    };

    const handleAdd = () => {
        setEditingItem(null);
        form.resetFields();
        setIsModalVisible(true);
    };

    const handleDongHoSo = async (ma_ho_so) => {
        try {
            await axios.patch(`${BASE_URL}/api/ho-so/${ma_ho_so}/dong`, {}, { headers: getAuthHeaders() });
            message.success('Đã đóng hồ sơ thành công!');
            // Tải lại dữ liệu sau khi đóng thành công
            fetchData(pagination.current, pagination.pageSize, searchText);
        } catch (error) {
            message.error('Lỗi khi đóng hồ sơ!');
        }
    };

    const handleNopLuu = async (maHoSo) => {
        try {
            await axios.patch(`${BASE_URL}/api/ho-so/${maHoSo}/nop-luu`, {}, {
                headers: getAuthHeaders()
            });
            message.success("Nộp lưu hồ sơ thành công!");

            fetchData(pagination.current, pagination.pageSize, searchText);
        } catch (error) {
            message.error(error.response?.data?.detail || "Lỗi nộp lưu");
        }
    };

    const handleViewDetails = async (record) => {
        setCurrentHoSo(record);
        setIsDetailModalVisible(true);
        setModalLoading(true);
        setVbDenData([]);
        setVbDiData([]);

        try {
            const response = await axios.get(`${BASE_URL}/api/ho-so/${record.ma_ho_so}/van-ban`, {
                headers: getAuthHeaders()
            });
            setVbDenData(response.data.van_ban_den);
            setVbDiData(response.data.van_ban_di);
        } catch (error) {
            message.error("Lỗi tải danh sách văn bản thuộc hồ sơ");
        } finally {
            setModalLoading(false);
        }
    };

    const handleEdit = (record) => {
        setEditingItem(record);
        form.setFieldsValue({
            ...record,
            ngay_bat_dau: record.ngay_bat_dau ? dayjs(record.ngay_bat_dau) : null,
            ngay_ket_thuc: record.ngay_ket_thuc ? dayjs(record.ngay_ket_thuc) : null,
        });
        setIsModalVisible(true);
    };

    const handleDelete = async (ma_ho_so) => {
        try {
            await axios.delete(`${API_URL}${ma_ho_so}`, { headers: getAuthHeaders() });
            message.success('Xóa hồ sơ thành công!');
            fetchData(1, pagination.pageSize, searchText); // Tải lại dữ liệu sau khi xóa
        } catch (error) {
            message.error(error.response?.data?.detail || 'Lỗi khi xóa hồ sơ!');
        }
    };

    const handleSubmit = async (values) => {
        try {
            const payload = {
                ...values,
                ngay_bat_dau: values.ngay_bat_dau ? values.ngay_bat_dau.format('YYYY-MM-DD') : null,
                ngay_ket_thuc: values.ngay_ket_thuc ? values.ngay_ket_thuc.format('YYYY-MM-DD') : null,
            };

            if (editingItem) {
                await axios.put(`${API_URL}${editingItem.ma_ho_so}`, payload, { headers: getAuthHeaders() });
                message.success('Cập nhật hồ sơ thành công!');
            } else {
                await axios.post(API_URL, payload, { headers: getAuthHeaders() });
                message.success('Tạo hồ sơ thành công!');
            }
            setIsModalVisible(false);
            fetchData(pagination.current, pagination.pageSize, searchText); // Tải lại dữ liệu
        } catch (error) {
            const errorMsg = error?.response?.data?.detail || 'Lỗi hệ thống khi lưu văn bản!';

            if (Array.isArray(errorMsg)) {
                message.error(`Dữ liệu không hợp lệ: ${errorMsg[0].msg}`);
            } else {
                message.error(errorMsg);
            }
        }
    };

    const columns = [
        {
            title: 'Trạng thái',
            dataIndex: 'trang_thai',
            key: 'trang_thai',
            align: 'center',
            width: 120,
            render: (text) => {
                let color = 'default';
                let label = text;

                if (text === 'DANG_MO') {
                    color = 'green';
                    label = 'Đang mở';
                } else if (text === 'DA_DONG') {
                    color = 'red';
                    label = 'Đã đóng';
                } else if (text === 'DA_NOP_LUU') {
                    color = 'blue'; // Màu xanh dương chuyên nghiệp cho kho lưu trữ
                    label = 'Đã nộp lưu';
                }

                return <Tag color={color}>{label || 'Đang mở'}</Tag>;
            }
        },
        {
            title: 'Mã hồ sơ',
            dataIndex: 'ma_ho_so',
            key: 'ma_ho_so',
            width: 140,
            render: (text) => <strong style={{ color: '#1677ff' }}>{text}</strong>
        },
        {
            title: 'Tiêu đề hồ sơ',
            dataIndex: 'tieu_de_ho_so',
            key: 'tieu_de_ho_so',
            ellipsis: true,
            render: (text) => (
                <Tooltip title={text} placement="topLeft" color="blue">
                    <span style={{ cursor: 'pointer' }}>{text}</span>
                </Tooltip>
            )
        },
        {
            title: 'Chế độ sử dụng',
            dataIndex: 'che_do_su_dung',
            key: 'che_do_su_dung',
            align: 'center',
            width: 140,
            render: (text) => {
                if (!text) return '---';
                let color = 'default';
                if (text === 'Mở') color = 'success';
                if (text === 'Hạn chế') color = 'warning';
                if (text === 'Mật') color = 'error';
                return <Tag color={color}>{text}</Tag>;
            }
        },
        {
            title: 'Ngày bắt đầu',
            dataIndex: 'ngay_bat_dau',
            key: 'ngay_bat_dau',
            align: 'center',
            width: 130,
            render: (text) => text ? dayjs(text).format('DD/MM/YYYY') : '---'
        },
        {
            title: 'Ngày kết thúc',
            dataIndex: 'ngay_ket_thuc',
            key: 'ngay_ket_thuc',
            align: 'center',
            width: 130,
            render: (text) => text ? dayjs(text).format('DD/MM/YYYY') : '---'
        },
        {
            title: 'Hành động',
            key: 'action',
            align: 'center',
            width: 280, // Tăng nhẹ width để chứa thêm nút Nộp lưu
            render: (_, record) => (
                <Space size="small" style={{ whiteSpace: 'nowrap' }}>
                    <Tooltip title="Xem văn bản">
                        <Button type="primary" icon={<EyeOutlined />} onClick={() => handleViewDetails(record)} />
                    </Tooltip>

                    <Tooltip title="Sửa hồ sơ">
                        <Button type="primary" style={{ backgroundColor: '#52c41a' }} icon={<EditOutlined />} onClick={() => handleEdit(record)} />
                    </Tooltip>

                    {record.trang_thai === 'DANG_MO' && (
                        <Tooltip title="Đóng hồ sơ">
                            <Popconfirm title="Bạn có chắc muốn đóng hồ sơ này?" onConfirm={() => handleDongHoSo(record.ma_ho_so)}>
                                <Button type="primary" style={{ backgroundColor: '#faad14' }} icon={<LockOutlined />} />
                            </Popconfirm>
                        </Tooltip>
                    )}
                    {record.trang_thai === 'DA_DONG' && (
                        <Tooltip title="Nộp lưu hồ sơ">
                            <Popconfirm
                                title="Xác nhận nộp lưu"
                                description="Bạn có chắc chắn muốn nộp lưu hồ sơ này?"
                                onConfirm={() => handleNopLuu(record.ma_ho_so)}
                                okText="Đồng ý"
                                cancelText="Hủy"
                            >
                                <Button
                                    type="primary"
                                    icon={<FileDoneOutlined />}
                                    loading={nopLuuLoading === record.ma_ho_so}
                                    style={{ backgroundColor: '#1677ff', borderColor: '#1677ff' }}
                                />
                            </Popconfirm>
                        </Tooltip>
                    )}

                    <Tooltip title="Xóa hồ sơ">
                        <Popconfirm title="Chắc chắn xóa hồ sơ này?" onConfirm={() => handleDelete(record.ma_ho_so)}>
                            <Button type="primary" danger icon={<DeleteOutlined />} />
                        </Popconfirm>
                    </Tooltip>
                </Space>
            ),
        },
    ];

    const vbDenColumns = [
        {
            title: 'Số đến',
            dataIndex: 'so_den',
            key: 'so_den',
            width: 80,
            align: 'center',
            render: (text) => <strong>{text}</strong>
        },
        {
            title: 'Ký hiệu',
            dataIndex: 'ky_hieu',
            key: 'ky_hieu',
            width: 140,
            align: 'center',
            render: (text) => <Tag color="blue">{text || '---'}</Tag>
        },
        {
            title: 'Trích yếu',
            dataIndex: 'trich_yeu',
            key: 'trich_yeu',
            ellipsis: true,
            render: (text) => (
                <Tooltip title={text} placement="topLeft" color="blue">
                    <span style={{ cursor: 'pointer' }}>{text}</span>
                </Tooltip>
            )
        },
        {
            title: 'Tệp đính kèm',
            dataIndex: 'tep_dinh_kems',
            key: 'tep_dinh_kems',
            width: 220,
            render: (tep_dinh_kems) => {
                const files = tep_dinh_kems || [];
                if (!files.length) return 'Không có file';
                return (
                    <Space direction="vertical" size="mini">
                        {files.map((file) => (
                            <Tooltip title={file.ten_file} key={file.id || file.ten_file} placement="topLeft">
                                <a href={`${BASE_URL}/${file.duong_dan.replaceAll('\\', '/').replace(/^\//, '')}`} target="_blank" rel="noreferrer">
                                    <PaperClipOutlined style={{ marginRight: 6 }} />
                                    {file.ten_file}
                                </a>
                            </Tooltip>
                        ))}
                    </Space>
                );
            }
        },
        {
            title: 'Ngày đến',
            dataIndex: 'ngay_den',
            key: 'ngay_den',
            width: 120,
            align: 'center',
            render: (text) => text ? dayjs(text).format('DD/MM/YYYY') : '---'
        },
    ];

    const vbDiColumns = [
        {
            title: 'Số ký hiệu',
            dataIndex: 'so_ky_hieu',
            key: 'so_ky_hieu',
            width: 150,
            align: 'center',
            render: (text) => <Tag color="green">{text || '---'}</Tag>
        },
        {
            title: 'Trích yếu',
            dataIndex: 'trich_yeu',
            key: 'trich_yeu',
            ellipsis: true,
            render: (text) => (
                <Tooltip title={text} placement="topLeft" color="green">
                    <span style={{ cursor: 'pointer' }}>{text}</span>
                </Tooltip>
            )
        },
        {
            title: 'Tệp đính kèm',
            dataIndex: 'tep_dinh_kems',
            key: 'tep_dinh_kems',
            width: 220,
            render: (tep_dinh_kems) => {
                const files = tep_dinh_kems || [];
                if (!files.length) return 'Không có file';
                return (
                    <Space direction="vertical" size="mini">
                        {files.map((file) => (
                            <Tooltip title={file.ten_file} key={file.id || file.ten_file} placement="topLeft">
                                <a href={`${BASE_URL}/${file.duong_dan.replaceAll('\\', '/').replace(/^\//, '')}`} target="_blank" rel="noreferrer">
                                    <PaperClipOutlined style={{ marginRight: 6 }} />
                                    {file.ten_file}
                                </a>
                            </Tooltip>
                        ))}
                    </Space>
                );
            }
        },
        {
            title: 'Ngày ban hành',
            dataIndex: 'ngay_ban_hanh',
            key: 'ngay_ban_hanh',
            width: 130,
            align: 'center',
            render: (text) => text ? dayjs(text).format('DD/MM/YYYY') : '---'
        },
    ];

    // Cấu hình Tabs có thêm viền (bordered) và thanh cuộn dọc (scroll y)
    const tabItems = [
        {
            key: '1',
            label: `Văn bản đến (${vbDenData.length})`,
            children: (
                <Table
                    columns={vbDenColumns}
                    dataSource={vbDenData}
                    rowKey="id"
                    pagination={false}
                    size="small"
                    bordered
                    scroll={{ y: 300 }}
                    loading={modalLoading}
                    locale={{ emptyText: 'Hồ sơ chưa có văn bản đến nào' }}
                />
            ),
        },
        {
            key: '2',
            label: `Văn bản đi (${vbDiData.length})`,
            children: (
                <Table
                    columns={vbDiColumns}
                    dataSource={vbDiData}
                    rowKey="id"
                    pagination={false}
                    size="small"
                    bordered
                    scroll={{ y: 300 }}
                    loading={modalLoading}
                    locale={{ emptyText: 'Hồ sơ chưa có văn bản đi nào' }}
                />
            ),
        },
    ];

    return (
        <div>
            <Space style={{ marginBottom: 16 }}>
                <Input.Search
                    placeholder="Tìm kiếm Mã/Tiêu đề..."
                    onSearch={handleSearch}
                    onChange={e => setSearchText(e.target.value)}
                    style={{ width: 300 }}
                />
                <Button type="primary" onClick={handleAdd}>Thêm mới Hồ sơ</Button>
            </Space>

            <Table
                columns={columns}
                dataSource={data}
                rowKey="ma_ho_so"
                loading={loading}
                pagination={pagination}
                onChange={handleTableChange}
                bordered
                scroll={{ x: 'max-content' }}
            />

            <Modal title={editingItem ? "Chỉnh sửa Hồ sơ" : "Tạo mới Hồ sơ"} open={isModalVisible} onCancel={() => setIsModalVisible(false)} onOk={() => form.submit()} width={700}>
                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                    <Form.Item name="ma_ho_so" label="Mã hồ sơ" rules={[{ required: true, message: 'Vui lòng nhập mã hồ sơ!' }]}>
                        <Input disabled={!!editingItem} />
                    </Form.Item>
                    <Form.Item name="tieu_de_ho_so" label="Tiêu đề hồ sơ" rules={[{ required: true, message: 'Vui lòng nhập tiêu đề!' }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="file_notation" label="Số ký hiệu hồ sơ">
                        <Input />
                    </Form.Item>
                    <Form.Item name="file_catalog" label="Năm hình thành (VD: 2026)">
                        <InputNumber style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name="thoi_han_bao_quan" label="Thời hạn bảo quản">
                        <Select allowClear placeholder="Chọn thời hạn">
                            <Select.Option value="5 năm">5 năm</Select.Option>
                            <Select.Option value="10 năm">10 năm</Select.Option>
                            <Select.Option value="Vĩnh viễn">Vĩnh viễn</Select.Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="che_do_su_dung" label="Chế độ sử dụng">
                        <Select allowClear options={[{ value: 'Mở', label: 'Mở' }, { value: 'Hạn chế', label: 'Hạn chế' }, { value: 'Mật', label: 'Mật' }]} />
                    </Form.Item>

                    <Form.Item name="vi_tri_id" label="Vị trí lưu trữ">
                        <Select showSearch allowClear placeholder="Chọn vị trí" options={viTriOptions} filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())} />
                    </Form.Item>
                    <Space style={{ width: '100%' }} direction="horizontal" size={16}>
                        <Form.Item name="ngay_bat_dau" label="Ngày bắt đầu" style={{ width: '50%' }}>
                            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
                        </Form.Item>
                        <Form.Item
                            name="ngay_ket_thuc"
                            label="Ngày kết thúc"
                            style={{ width: '50%' }}
                            dependencies={["ngay_bat_dau"]}
                            rules={[
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        const ngayBatDau = getFieldValue('ngay_bat_dau');
                                        if (!value || !ngayBatDau || value.isSame(ngayBatDau) || value.isAfter(ngayBatDau)) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject(new Error('Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu'));
                                    }
                                })
                            ]}
                        >
                            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
                        </Form.Item>
                    </Space>
                    <Form.Item name="so_luong_trang" label="Số lượng trang" rules={[{ type: 'number', min: 0, message: 'Số trang không được âm!' }]}>

                        <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name="so_luong_van_ban" label="Số lượng văn bản" rules={[{ type: 'number', min: 0, message: 'Số lượng không được âm!' }]}>
                        <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name="nguoi_lap" label="Người lập"><Input /></Form.Item>
                    <Form.Item name="ngon_ngu" label="Ngôn ngữ"><Input /></Form.Item>
                    <Form.Item name="ghi_chu" label="Ghi chú"><Input.TextArea rows={3} /></Form.Item>
                </Form>
            </Modal>
            <Modal
                title={`Chi tiết văn bản thuộc Hồ sơ: ${currentHoSo?.ma_ho_so || ''}`}
                open={isDetailModalVisible}
                onCancel={() => setIsDetailModalVisible(false)}
                footer={null}
                width={1000}
                destroyOnClose
            >
                <div style={{ marginBottom: 16 }}>
                    <strong>Tiêu đề: </strong> {currentHoSo?.tieu_de_ho_so}
                </div>
                <Tabs defaultActiveKey="1" items={tabItems} />
            </Modal>
        </div>
    );
};

export default ListHoSo;