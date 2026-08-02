import React, { useEffect, useState } from 'react';
import { PaperClipOutlined, UploadOutlined, CheckOutlined, RollbackOutlined, CloudUploadOutlined, StopOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Table, Button, Space, Input, Modal, Select, message, Popconfirm, Tooltip, Tag, Card } from 'antd';
const { Search } = Input;
const BASE_URL = 'http://localhost:8000';

const apiClient = axios.create({ baseURL: BASE_URL });
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token && token !== 'null' && token !== 'undefined' && token.trim() !== '') {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

const ListVanBanDi = () => {
    const navigate = useNavigate();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [reasonModalVisible, setReasonModalVisible] = useState(false);
    const [currentAction, setCurrentAction] = useState('');
    const [reasonText, setReasonText] = useState('');
    const [selectedId, setSelectedId] = useState(null);

    // 1. State phân trang
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });

    const getAuthHeaders = () => {
        const token = localStorage.getItem('access_token');
        if (!token || token === 'null' || token === 'undefined' || token.trim() === '') {
            return null;
        }
        return { Authorization: `Bearer ${token}` };
    };

    const handleMissingAuth = () => {
        message.error('Phiên đăng nhập không còn hiệu lực. Vui lòng đăng nhập lại.');
        localStorage.removeItem('access_token');
        navigate('/login');
    };

    // 2. Hàm fetchData mới: Nhận page, size và keyword
    const fetchVanBanDi = async (page = 1, size = 10, keyword = '') => {
        const headers = getAuthHeaders();
        if (!headers) {
            handleMissingAuth();
            return;
        }

        setLoading(true);
        try {
            const response = await apiClient.get('/api/van-ban-di/', {
                headers,
                params: { page, size, keyword }
            });
            setData(response.data.data || []);
            setPagination(prev => ({
                ...prev,
                current: page,
                total: response.data.total
            }));
        } catch (error) {
            if (error.response && error.response.status === 401) {
                handleMissingAuth();
                return;
            }
            message.error('Không thể tải danh sách văn bản đi.');
        } finally {
            setLoading(false);
        }
    };

    const handleTableChange = (paginationConfig) => {
        fetchVanBanDi(paginationConfig.current, paginationConfig.pageSize, searchText);
    };

    const handleSearch = (value) => {
        setSearchText(value);
        fetchVanBanDi(1, pagination.pageSize, value);
    };

    const handleDelete = async (id) => {
        const headers = getAuthHeaders();
        if (!headers) {
            handleMissingAuth();
            return;
        }
        try {
            await apiClient.delete(`/api/van-ban-di/${id}`, { headers });
            message.success('Đã xóa văn bản thành công!');
            fetchVanBanDi(pagination.current, pagination.pageSize, searchText);
        } catch (error) {
            if (error.response && error.response.status === 401) {
                handleMissingAuth();
                return;
            }
            message.error('Lỗi khi xóa văn bản. Vui lòng thử lại!');
        }
    };

    const handleSubmit = async (id) => {
        const headers = getAuthHeaders();
        if (!headers) {
            handleMissingAuth();
            return;
        }
        try {
            await apiClient.post(`/api/van-ban-di/${id}/submit`, {}, { headers });
            message.success('Trình duyệt văn bản thành công!');
            fetchVanBanDi(pagination.current, pagination.pageSize, searchText);
        } catch (error) {
            if (error.response && error.response.status === 401) {
                handleMissingAuth();
                return;
            }
            message.error('Lỗi khi trình duyệt văn bản. Vui lòng thử lại!');
        }
    };

    const handleApprove = async (id) => {
        const headers = getAuthHeaders();
        if (!headers) {
            handleMissingAuth();
            return;
        }
        try {
            await apiClient.post(`/api/van-ban-di/${id}/approve`, {}, { headers });
            message.success('Phê duyệt văn bản thành công!');
            fetchVanBanDi(pagination.current, pagination.pageSize, searchText);
        } catch (error) {
            if (error.response && error.response.status === 401) {
                handleMissingAuth();
                return;
            }
            message.error('Lỗi khi phê duyệt văn bản. Vui lòng thử lại!');
        }
    };

    const handleRequestChanges = async (id, reason) => {
        const headers = getAuthHeaders();
        if (!headers) {
            handleMissingAuth();
            return;
        }
        try {
            await apiClient.post(`/api/van-ban-di/${id}/request-changes`, { reason }, { headers });
            message.success('Đã trả lại văn bản để yêu cầu sửa đổi!');
            fetchVanBanDi(pagination.current, pagination.pageSize, searchText);
        } catch (error) {
            if (error.response && error.response.status === 401) {
                handleMissingAuth();
                return;
            }
            message.error('Lỗi khi gửi yêu cầu sửa đổi. Vui lòng thử lại!');
        }
    };

    const handlePublish = async (id) => {
        const headers = getAuthHeaders();
        if (!headers) {
            handleMissingAuth();
            return;
        }
        try {
            await apiClient.post(`/api/van-ban-di/${id}/publish`, {}, { headers });
            message.success('Phát hành văn bản thành công!');
            fetchVanBanDi(pagination.current, pagination.pageSize, searchText);
        } catch (error) {
            if (error.response && error.response.status === 401) {
                handleMissingAuth();
                return;
            }
            message.error('Lỗi khi phát hành văn bản. Vui lòng thử lại!');
        }
    };

    const handleRevoke = async (id, reason) => {
        const headers = getAuthHeaders();
        if (!headers) {
            handleMissingAuth();
            return;
        }
        try {
            await apiClient.post(`/api/van-ban-di/${id}/revoke`, { reason }, { headers });
            message.success('Đã thu hồi văn bản!');
            fetchVanBanDi(pagination.current, pagination.pageSize, searchText);
        } catch (error) {
            if (error.response && error.response.status === 401) {
                handleMissingAuth();
                return;
            }
            message.error('Lỗi khi thu hồi văn bản. Vui lòng thử lại!');
        }
    };

    const openReasonModal = (id, action) => {
        setSelectedId(id);
        setCurrentAction(action);
        setReasonText('');
        setReasonModalVisible(true);
    };

    const handleReasonModalOk = async () => {
        if (!reasonText.trim()) {
            message.error('Vui lòng nhập lý do.');
            return;
        }

        if (currentAction === 'requestChanges') {
            await handleRequestChanges(selectedId, reasonText);
        } else if (currentAction === 'revoke') {
            await handleRevoke(selectedId, reasonText);
        }

        setReasonModalVisible(false);
    };

    const handleReasonModalCancel = () => {
        setReasonModalVisible(false);
        setCurrentAction('');
        setSelectedId(null);
        setReasonText('');
    };

    const handleStatusFilterChange = (value) => {
        setStatusFilter(value);
    };

    useEffect(() => {
        fetchVanBanDi(pagination.current, pagination.pageSize);
    }, []);

    const filteredData = data.filter((item) => {
        const matchesKeyword =
            (item.so_ky_hieu || '').toLowerCase().includes(searchText.toLowerCase()) ||
            (item.trich_yeu || '').toLowerCase().includes(searchText.toLowerCase());

        const matchesStatus =
            statusFilter === 'ALL' || item.trang_thai === statusFilter;

        return matchesKeyword && matchesStatus;
    });

    const columns = [
        {
            title: 'Trạng thái',
            dataIndex: 'trang_thai',
            key: 'trang_thai',
            width: 140,
            render: (text) => {
                let color = 'default';
                if (text === 'DRAFT') color = 'default';
                if (text === 'PENDING_APPROVAL') color = 'warning';
                if (text === 'APPROVED') color = 'blue';
                if (text === 'PUBLISHED') color = 'success';
                if (text === 'REVOKED') color = 'error';
                return <Tag color={color}>{text || 'DRAFT'}</Tag>;
            }
        },
        { title: 'Số ký hiệu', dataIndex: 'so_ky_hieu', key: 'so_ky_hieu', width: 180 },
        { title: 'Trích yếu', dataIndex: 'trich_yeu', key: 'trich_yeu', ellipsis: true, render: (text) => text || '--' },
        { title: 'Mã hồ sơ', dataIndex: 'ma_ho_so', key: 'ma_ho_so', width: 180, render: (value) => value ? <Tag color="blue">{value}</Tag> : <Tag color="default">--</Tag> },
        {
            title: 'Tệp đính kèm',
            dataIndex: 'tep_dinh_kems',
            key: 'tep_dinh_kems',
            width: 250,
            render: (tep_dinh_kems) => {
                const files = tep_dinh_kems || [];
                if (!files.length) return 'Không có file';

                return (
                    <Space direction="vertical" size="mini">
                        {files.map((file) => {
                            const fileUrl = `${BASE_URL}/${file.duong_dan.replaceAll('\\', '/').replace(/^\//, '')}`;
                            return (
                                <Tooltip title={file.ten_file} key={file.id || file.ten_file} placement="topLeft">
                                    <a href={fileUrl} target="_blank" rel="noreferrer">
                                        <PaperClipOutlined style={{ marginRight: 6 }} />
                                        {file.ten_file}
                                    </a>
                                </Tooltip>
                            );
                        })}
                    </Space>
                );
            }
        },
        {
            title: 'Hành động',
            key: 'action',
            width: 200,
            align: 'center',
            render: (_, record) => (
                <Space size="small" style={{ whiteSpace: 'nowrap' }}>
                    {/* LUỒNG NGHIỆP VỤ: Ẩn/Hiện nút theo Trạng thái */}

                    {/* 1. Nếu là DRAFT -> Hiện nút Trình duyệt + Sửa/Xóa */}
                    {(!record.trang_thai || record.trang_thai === 'DRAFT') && (
                        <>
                            <Tooltip title="Trình duyệt văn bản">
                                <Button
                                    type="primary"
                                    icon={<UploadOutlined />}
                                    onClick={() => handleSubmit(record.id)}
                                />
                            </Tooltip>
                            <Tooltip title="Chỉnh sửa">
                                <Button
                                    type="primary"
                                    icon={<EditOutlined />}
                                    style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                                    onClick={() => navigate(`/sua-van-ban/${record.id}`)}
                                />
                            </Tooltip>
                            <Tooltip title="Xóa">
                                <Popconfirm title="Xóa văn bản đi" onConfirm={() => handleDelete(record.id)}>
                                    <Button
                                        type="primary"
                                        danger
                                        icon={<DeleteOutlined />}
                                    />
                                </Popconfirm>
                            </Tooltip>
                        </>
                    )}

                    {/* 2. Nếu là PENDING_APPROVAL -> Hiện nút Phê duyệt / Yêu cầu sửa đổi */}
                    {record.trang_thai === 'PENDING_APPROVAL' && (
                        <>
                            <Tooltip title="Phê duyệt văn bản">
                                <Button
                                    type="primary"
                                    icon={<CheckOutlined />}
                                    style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                                    onClick={() => handleApprove(record.id)}
                                />
                            </Tooltip>
                            <Tooltip title="Yêu cầu sửa đổi">
                                <Button
                                    type="primary"
                                    danger
                                    icon={<RollbackOutlined />}
                                    onClick={() => openReasonModal(record.id, 'requestChanges')}
                                />
                            </Tooltip>
                        </>
                    )}

                    {/* 3. Nếu là APPROVED -> Hiện nút Phát hành */}
                    {record.trang_thai === 'APPROVED' && (
                        <Tooltip title="Phát hành văn bản">
                            <Button
                                type="primary"
                                icon={<CloudUploadOutlined />}
                                style={{ backgroundColor: '#722ed1', borderColor: '#722ed1' }}
                                onClick={() => handlePublish(record.id)}
                            />
                        </Tooltip>
                    )}

                    {/* 4. Nếu là PUBLISHED -> Hiện nút Thu hồi */}
                    {record.trang_thai === 'PUBLISHED' && (
                        <Tooltip title="Thu hồi văn bản">
                            <Button
                                type="primary"
                                danger
                                icon={<StopOutlined />}
                                onClick={() => openReasonModal(record.id, 'revoke')}
                            />
                        </Tooltip>
                    )}

                    {/* 5. Hiện nút Xem chi tiết cho mọi trạng thái */}
                    <Tooltip title="Xem chi tiết">
                        <Button
                            type="primary"
                            icon={<EyeOutlined />}
                            onClick={() => navigate(`/sua-van-ban/${record.id}`)}
                        />
                    </Tooltip>
                </Space>
            )
        }
    ];

    return (
        <Card
            title="Danh sách Văn bản đi"
            extra={
                <Space>
                    <Search
                        placeholder="Tìm theo số ký hiệu, trích yếu..."
                        allowClear
                        onSearch={handleSearch}
                        style={{ width: 300 }}
                    />
                    <Select
                        value={statusFilter}
                        onChange={handleStatusFilterChange}
                        style={{ width: 180 }}
                        options={[
                            { value: 'ALL', label: 'Tất cả trạng thái' },
                            { value: 'DRAFT', label: 'Nháp' },
                            { value: 'PENDING_APPROVAL', label: 'Chờ duyệt' },
                            { value: 'APPROVED', label: 'Đã duyệt' },
                            { value: 'PUBLISHED', label: 'Đã phát hành' },
                            { value: 'REVOKED', label: 'Đã thu hồi' },
                        ]}
                    />
                    <Button type="primary" onClick={() => navigate('/them-van-ban')}>Thêm mới</Button>
                </Space>
            }
        >
            <Table
                rowKey="id"
                columns={columns}
                dataSource={filteredData}
                loading={loading}
                pagination={pagination} // Truyền config phân trang vào
                onChange={handleTableChange} // Bắt sự kiện đổi trang
                scroll={{ x: 'max-content' }}
            />

            <Modal
                title={currentAction === 'revoke' ? 'Thu hồi văn bản' : 'Yêu cầu sửa đổi văn bản'}
                open={reasonModalVisible}
                onOk={handleReasonModalOk}
                onCancel={handleReasonModalCancel}
                okText="Xác nhận"
                cancelText="Hủy"
            >
                <p>Vui lòng nhập lý do để gửi yêu cầu.</p>
                <Input.TextArea
                    rows={4}
                    value={reasonText}
                    onChange={(e) => setReasonText(e.target.value)}
                    placeholder="Nhập lý do..."
                />
            </Modal>
        </Card>
    );
};
export default ListVanBanDi;