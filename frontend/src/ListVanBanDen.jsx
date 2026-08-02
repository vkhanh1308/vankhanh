import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Input, Modal, Form, DatePicker, InputNumber, Select, message, Popconfirm, Row, Col, Upload, Tooltip, Tag } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, SearchOutlined, InboxOutlined, PaperClipOutlined, UserAddOutlined, CheckCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Dragger } = Upload;
const BASE_URL = 'http://localhost:8000';

const ListVanBanDen = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [form] = Form.useForm();
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });
    // State mới để chứa File tải lên
    const [fileList, setFileList] = useState([]);
    useEffect(() => {
        console.log('ListVanBanDen fileList state:', fileList);
    }, [fileList]);
    // State cho Modal Phân phối
    const [isPhanPhoiModalVisible, setIsPhanPhoiModalVisible] = useState(false);
    const [phanPhoiRecord, setPhanPhoiRecord] = useState(null);
    const [formPhanPhoi] = Form.useForm();
    //
    const [coQuanOptions, setCoQuanOptions] = useState([]);
    const [danhMucOptions, setDanhMucOptions] = useState([]);
    const [hoSoOptions, setHoSoOptions] = useState([]);
    const [canBoOptions, setCanBoOptions] = useState([]);
    const apiUrl = `${BASE_URL}/api/van-ban-den/`;

    const getAuthHeaders = () => {
        const token = localStorage.getItem('access_token');
        return { Authorization: `Bearer ${token}` };
    };

    const fetchOptions = async () => {
        // Tách riêng từng API để nếu 1 cái lỗi (VD: chưa code xong Backend), các dropdown khác vẫn có dữ liệu bình thường
        try {
            const coQuanRes = await axios.get(`${BASE_URL}/api/co-quan/`, { headers: getAuthHeaders() });
            setCoQuanOptions((coQuanRes.data || []).map(item => ({ label: item.ten_co_quan, value: item.id })));
        } catch (e) { console.warn("Lỗi tải Cơ quan:", e.message); }

        try {
            const danhMucRes = await axios.get(`${BASE_URL}/api/danh-muc/`, { headers: getAuthHeaders() });
            setDanhMucOptions((danhMucRes.data || []).map(item => ({ label: item.ten_loai_vb, value: item.id })));
        } catch (e) { console.warn("Lỗi tải Danh mục:", e.message); }

        try {
            const hoSoRes = await axios.get(`${BASE_URL}/api/ho-so/`, { headers: getAuthHeaders() });
            const hoSoArray = Array.isArray(hoSoRes.data) ? hoSoRes.data : (hoSoRes.data?.data || []);
            setHoSoOptions(hoSoArray.map(item => ({ label: item.ma_ho_so, value: item.ma_ho_so })));
        } catch (e) { console.warn("Lỗi tải Hồ sơ:", e.message); }

        try {
            const canBoRes = await axios.get(`${BASE_URL}/api/can-bo/`, { headers: getAuthHeaders() });
            setCanBoOptions((canBoRes.data || []).map(item => ({
                label: `${item.ho_ten} ${item.chuc_vu ? `(${item.chuc_vu})` : ''}`,
                value: item.id
            })));
        } catch (e) { console.warn("Lỗi tải Cán bộ:", e.message); }
    };

    const fetchData = async (page = 1, size = 10, keyword = searchText) => {
        setLoading(true);
        try {
            const response = await axios.get(apiUrl, {
                headers: getAuthHeaders(),
                params: { page, size, keyword } // Gửi keyword lên Backend
            });
            setData(response.data.data || []);
            setPagination(prev => ({ ...prev, current: page, total: response.data.total }));
        } catch (error) {
            message.error('Lỗi khi tải dữ liệu!');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOptions();
        fetchData(pagination.current, pagination.pageSize);
    }, []);

    const handleTableChange = (paginationConfig) => {
        fetchData(paginationConfig.current, paginationConfig.pageSize);
    };

    const handleSearch = (value) => {
        setSearchText(value);
        fetchData(1, pagination.pageSize, value); // Đã sửa tên hàm và truyền thêm value
    };

    const handlePhanPhoi = async (values) => {
        try {
            await axios.patch(`${BASE_URL}/api/van-ban-den/${phanPhoiRecord.id}/phan-phoi`, values, {
                headers: getAuthHeaders()
            });
            message.success("Phân phối văn bản thành công!");
            setIsPhanPhoiModalVisible(false);
            formPhanPhoi.resetFields();
            fetchData(pagination.current, pagination.pageSize, searchText); // Gọi đúng hàm fetchData
        } catch (error) {
            message.error(error.response?.data?.detail || "Lỗi khi phân phối!");
        }
    };

    const handleHoanThanh = async (record) => {
        try {
            await axios.patch(`${BASE_URL}/api/van-ban-den/${record.id}/tien-do`,
                { trang_thai_xu_ly: 'DA_XU_LY' },
                { headers: getAuthHeaders() });
            message.success("Đã đánh dấu xử lý xong!");
            fetchData(pagination.current, pagination.pageSize, searchText);
        } catch (error) {
            message.error(error.response?.data?.detail || "Lỗi cập nhật tiến độ!");
        }
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`${BASE_URL}/api/van-ban-den/${id}`, { headers: getAuthHeaders() });
            message.success('Xóa văn bản đến thành công!');
            fetchData();
        } catch (error) {
            message.error('Lỗi khi xóa văn bản đến!');
        }
    };

    const handleSubmit = async (values) => {
        try {
            const payload = {
                ...values,
                ngay_den: values.ngay_den ? values.ngay_den.format('YYYY-MM-DD') : null,
                ngay_ban_hanh: values.ngay_ban_hanh ? values.ngay_ban_hanh.format('YYYY-MM-DD') : null,
                han_giai_quyet: values.han_giai_quyet ? values.han_giai_quyet.format('YYYY-MM-DD') : null,
            };

            let vanBanId = null;

            if (editingRecord) {
                const putUrl = `${BASE_URL}/api/van-ban-den/${editingRecord.id}`;
                await axios.put(putUrl, payload, { headers: getAuthHeaders() });
                vanBanId = editingRecord.id;
                message.success('Cập nhật nội dung thành công!');
            } else {
                const res = await axios.post(apiUrl, payload, { headers: getAuthHeaders() });
                vanBanId = res.data.id; // Chộp ngay cái ID vừa được DB cấp
                message.success('Thêm mới văn bản thành công!');
            }

            // --- NẾU CÓ CHỌN FILE THÌ ĐẨY LÊN BẰNG API RIÊNG ---
            if (fileList.length > 0 && vanBanId) {
                const formData = new FormData();
                // Only append real files (local selections)
                const filesToUpload = fileList.filter((f) => f.originFileObj);
                // Read each file fully and append a fresh File instance to avoid upload-change errors
                for (const file of filesToUpload) {
                    try {
                        const original = file.originFileObj;
                        const buffer = await original.arrayBuffer();
                        const safeFile = new File([buffer], original.name, { type: original.type });
                        formData.append('files', safeFile);
                    } catch (e) {
                        formData.append('files', file.originFileObj);
                    }
                }

                if (filesToUpload.length > 0) {
                    const uploadRes = await axios.post(`${BASE_URL}/api/van-ban-den/${vanBanId}/upload`, formData, {
                        headers: {
                            ...getAuthHeaders(),
                            'Content-Type': 'multipart/form-data'
                        }
                    });

                    // If backend returns stored file info, map them to Upload items so UI shows names/links
                    const returned = uploadRes.data?.files || [];
                    const serverFiles = returned.map((f) => ({
                        uid: String(f.id || `server-${Date.now()}-${Math.random()}`),
                        name: f.ten_file,
                        status: 'done',
                        url: `${BASE_URL}/${f.duong_dan.replaceAll('\\', '/').replace(/^\//, '')}`
                    }));

                    // Keep any pre-existing server items + newly uploaded serverFiles
                    const existingServer = fileList.filter((f) => !f.originFileObj).map((f) => ({
                        uid: String(f.uid), name: f.name, status: f.status || 'done', url: f.url
                    }));

                    setFileList([...existingServer, ...serverFiles]);
                    message.success('Đã tải lên tệp đính kèm!');
                }
            }

            setIsModalVisible(false);
            // do not clear fileList here — keep server-side entries for visibility
            fetchData();
        } catch (error) {
            // Trích xuất thông báo lỗi chi tiết (detail) mà Backend gửi về
            const errorMessage = error.response?.data?.detail || 'Lỗi hệ thống khi lưu văn bản!';

            // Có thể FastAPI trả về mảng lỗi (Validation Error)
            if (Array.isArray(errorMessage)) {
                message.error(`Dữ liệu không hợp lệ: ${errorMessage[0].msg}`);
            } else {
                message.error(errorMessage);
            }
        }
    };

    const showEditModal = (record) => {
        setEditingRecord(record);
        form.setFieldsValue({
            ...record,
            ngay_den: record.ngay_den ? dayjs(record.ngay_den) : null,
            ngay_ban_hanh: record.ngay_ban_hanh ? dayjs(record.ngay_ban_hanh) : null,
            han_giai_quyet: record.han_giai_quyet ? dayjs(record.han_giai_quyet) : null,
        });

        const formattedFiles = (record.tep_dinh_kems || []).map((f) => ({
            uid: String(f.id),
            name: f.ten_file,
            status: 'done',
            url: `${BASE_URL}/${f.duong_dan.replaceAll('\\', '/').replace(/^\//, '')}`
        }));
        setFileList(formattedFiles);
        setIsModalVisible(true);
    };

    const showCreateModal = () => {
        setEditingRecord(null);
        form.resetFields();
        form.setFieldsValue({ ngon_ngu: 'Tiếng Việt' });
        setFileList([]);
        setIsModalVisible(true);
    };

    const filteredData = data.filter((item) => {
        if (!searchText) return true;
        const lowerSearch = searchText.toLowerCase();
        return (
            String(item.so_den).toLowerCase().includes(lowerSearch) ||
            (item.ky_hieu && item.ky_hieu.toLowerCase().includes(lowerSearch)) ||
            (item.trich_yeu && item.trich_yeu.toLowerCase().includes(lowerSearch))
        );
    });

    const columns = [
        {
            title: 'Trạng thái xử lý',
            dataIndex: 'trang_thai_xu_ly',
            key: 'trang_thai_xu_ly',
            width: 150,
            render: (text) => {
                let color = text === 'CHO_XU_LY' ? 'warning' : (text === 'DANG_XU_LY' ? 'processing' : 'success');
                return <Tag color={color}>{text || 'CHO_XU_LY'}</Tag>;
            }
        },
        {
            title: 'Người xử lý',
            dataIndex: 'nguoi_xu_ly_id',
            key: 'nguoi_xu_ly_id',
            width: 150,
            render: (id) => {
                if (!id) return <span style={{ color: '#bfbfbf' }}>Chưa phân phối</span>;
                // Tìm tên cán bộ từ danh sách Options đã load từ API
                const canBo = canBoOptions.find(opt => opt.value === id);
                return (
                    <Tag color="blue" icon={<UserAddOutlined />}>
                        {canBo ? canBo.label : `ID: ${id}`}
                    </Tag>
                );
            }
        },
        { title: 'Số đến', dataIndex: 'so_den', width: 90 },
        { title: 'Ký hiệu', dataIndex: 'ky_hieu', width: 130 },
        { title: 'Ngày đến', dataIndex: 'ngay_den', render: (text) => text ? dayjs(text).format('DD/MM/YYYY') : '', width: 110 },
        {
            title: 'Cơ quan ban hành',
            dataIndex: 'co_quan_ban_hanh_id',
            width: 220,
            ellipsis: true,
            render: (id) => {
                const tenCoQuan = coQuanOptions.find(opt => opt.value === id)?.label || 'Chưa xác định';
                return (
                    <Tooltip title={tenCoQuan} placement="topLeft" color="blue">
                        <span>{tenCoQuan}</span>
                    </Tooltip>
                );
            }
        },
        {
            title: 'Trích yếu',
            dataIndex: 'trich_yeu',
            width: 280,
            ellipsis: true,
            render: (text) => (
                <Tooltip title={text} placement="topLeft" color="blue">
                    <span style={{ cursor: 'pointer' }}>{text || '--'}</span>
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
            title: 'Hạn giải quyết',
            dataIndex: 'han_giai_quyet',
            width: 170,
            render: (text) => {
                if (!text) return <span style={{ color: '#bfbfbf' }}>Không có hạn</span>;

                const deadline = dayjs(text);
                const today = dayjs().startOf('day');
                const diffDays = deadline.diff(today, 'day');

                const formattedDate = deadline.format('DD/MM/YYYY');

                if (diffDays < 0) {
                    return <Tag color="error">Quá hạn ({formattedDate})</Tag>;
                } else if (diffDays <= 3) {
                    return <Tag color="warning">Sắp hết ({formattedDate})</Tag>;
                } else {
                    return <Tag color="success">Còn hạn ({formattedDate})</Tag>;
                }
            }
        },
        {
            title: 'Hành động',
            key: 'action',
            align: 'center',
            width: 180, // Tăng width để chứa đủ 3 nút
            render: (_, record) => (
                <Space size="small" style={{ whiteSpace: 'nowrap' }}>
                    {/* Nút Phân phối - Chỉ hiện khi CHO_XU_LY */}
                    {record.trang_thai_xu_ly === 'CHO_XU_LY' && (
                        <Tooltip title="Phân phối xử lý">
                            <Button
                                type="primary"
                                style={{ backgroundColor: '#722ed1' }} // Màu tím khối vuông
                                icon={<UserAddOutlined />}
                                onClick={() => {
                                    setPhanPhoiRecord(record);
                                    setIsPhanPhoiModalVisible(true);
                                }}
                            />
                        </Tooltip>
                    )}

                    {/* Nút Hoàn thành - Chỉ hiện khi DANG_XU_LY */}
                    {record.trang_thai_xu_ly === 'DANG_XU_LY' && (
                        <Tooltip title="Xác nhận hoàn thành">
                            <Popconfirm
                                title="Xác nhận đã xử lý xong văn bản này?"
                                onConfirm={() => handleHoanThanh(record)}
                                okText="Đồng ý"
                                cancelText="Hủy"
                            >
                                <Button
                                    type="primary"
                                    style={{ backgroundColor: '#52c41a' }} // Màu xanh lá khối vuông
                                    icon={<CheckCircleOutlined />}
                                />
                            </Popconfirm>
                        </Tooltip>
                    )}

                    <Tooltip title="Sửa">
                        <Button type="primary" icon={<EditOutlined />} onClick={() => showEditModal(record)} />
                    </Tooltip>

                    <Tooltip title="Xóa">
                        <Popconfirm title="Bạn có chắc muốn xóa?" onConfirm={() => handleDelete(record.id)}>
                            <Button type="primary" danger icon={<DeleteOutlined />} />
                        </Popconfirm>
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: '24px', background: '#fff', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <Input.Search
                    placeholder="Tìm kiếm..."
                    onSearch={(value) => fetchData(1, pagination.pageSize, value)}
                    onChange={(e) => setSearchText(e.target.value)}
                    style={{ width: 400 }}
                />
                <Button type="primary" icon={<PlusOutlined />} onClick={showCreateModal}>
                    Thêm mới
                </Button>
            </div>

            <Table
                columns={columns}
                dataSource={data}
                rowKey="id"
                loading={loading}
                pagination={pagination}
                onChange={handleTableChange}
                scroll={{ x: 'max-content' }}
                size="middle"
            />

            <Modal title={editingRecord ? "Cập nhật Văn bản đến" : "Thêm mới Văn bản đến"} open={isModalVisible} onCancel={() => setIsModalVisible(false)} onOk={() => form.submit()} okText="Lưu" cancelText="Hủy" width={850}>
                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="so_den" label="Số đến" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} /></Form.Item>
                            <Form.Item name="ky_hieu" label="Ký hiệu"><Input placeholder="Ví dụ: 123/QĐ-UBND" /></Form.Item>
                            <Form.Item name="ngay_den" label="Ngày đến" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" /></Form.Item>
                            <Form.Item name="ngay_ban_hanh" label="Ngày ban hành"><DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" /></Form.Item>
                            <Form.Item name="ma_loai_vb_id" label="Loại văn bản" rules={[{ required: true }]}>
                                <Select showSearch options={danhMucOptions} placeholder="Chọn loại văn bản" filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())} />
                            </Form.Item>
                            <Form.Item name="co_quan_ban_hanh_id" label="Cơ quan ban hành">
                                <Select showSearch options={coQuanOptions} placeholder="Chọn cơ quan ban hành" filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())} />
                            </Form.Item>
                            <Form.Item name="trich_yeu" label="Trích yếu" rules={[{ required: true }]}><Input.TextArea rows={3} /></Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="ngon_ngu" label="Ngôn ngữ"><Input /></Form.Item>
                            <Form.Item name="linh_vuc" label="Lĩnh vực">
                                <Input placeholder="Ví dụ: Giáo dục, Y tế, Xây dựng..." />
                            </Form.Item>
                            <Form.Item
                                name="so_trang"
                                label="Số trang"
                                rules={[
                                    () => ({
                                        validator(_, value) {
                                            if (value !== undefined && value !== null && value < 0) {
                                                return Promise.reject(new Error('Số trang không được là số âm!'));
                                            }
                                            return Promise.resolve();
                                        },
                                    }),
                                ]}
                            >
                                <InputNumber style={{ width: '100%' }} precision={0} />
                            </Form.Item>
                            <Form.Item name="ho_ten_nguoi_ky" label="Họ tên người ký"><Input placeholder="Ví dụ: Nguyễn Văn A" /></Form.Item>
                            <Form.Item name="chuc_vu_nguoi_ky" label="Chức vụ người ký"><Input placeholder="Ví dụ: Giám đốc" /></Form.Item>
                            <Form.Item name="don_vi_nhan" label="Nơi nhận nội bộ"><Input placeholder="Phòng Hành chính, Phòng Kế toán..." /></Form.Item>
                            <Form.Item name="do_khan" label="Mức độ khẩn">
                                <Select allowClear placeholder="Chọn mức độ khẩn">
                                    <Select.Option value={1}>Thường</Select.Option><Select.Option value={2}>Khẩn</Select.Option><Select.Option value={3}>Thượng khẩn</Select.Option><Select.Option value={4}>Hỏa tốc</Select.Option>
                                </Select>
                            </Form.Item>
                            <Form.Item
                                name="han_giai_quyet"
                                label="Hạn giải quyết"
                                dependencies={['ngay_den']}
                                rules={[
                                    ({ getFieldValue }) => ({
                                        validator(_, value) {
                                            // Nếu chưa chọn 1 trong 2 ngày thì bỏ qua không báo lỗi vội
                                            if (!value || !getFieldValue('ngay_den')) return Promise.resolve();

                                            // Nếu Hạn giải quyết < Ngày đến => Bật báo động đỏ!
                                            if (value.isBefore(getFieldValue('ngay_den'), 'day')) {
                                                return Promise.reject(new Error('Hạn giải quyết KHÔNG ĐƯỢC trước Ngày đến!'));
                                            }
                                            return Promise.resolve();
                                        },
                                    }),
                                ]}
                            >
                                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                            </Form.Item>
                            <Form.Item name="ma_ho_so" label="Đưa vào hồ sơ">
                                <Select showSearch options={hoSoOptions} placeholder="Chọn mã hồ sơ lưu trữ" allowClear filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())} />
                            </Form.Item>
                        </Col>
                    </Row>

                    {/* KHUNG KÉO THẢ FILE CỦA ANT DESIGN */}
                    <Row style={{ marginTop: '16px' }}>
                        <Col span={24}>
                            <h4 style={{ marginBottom: 8 }}>Tệp đính kèm</h4>
                            <Dragger
                                multiple
                                listType="text"
                                fileList={fileList}
                                showUploadList={true}
                                itemRender={(originNode, file) => {
                                    const displayName = file.name || (file.originFileObj && file.originFileObj.name) || 'Tệp';
                                    const href = file.url || undefined; // only link server files
                                    return (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            {href ? (
                                                <a href={href} target="_blank" rel="noreferrer">{displayName}</a>
                                            ) : (
                                                <span>{displayName}</span>
                                            )}
                                        </div>
                                    );
                                }}
                                beforeUpload={(file) => {
                                    // Prevent Auto Upload — let onChange manage the controlled fileList
                                    console.log('ListVanBanDen beforeUpload file:', file);
                                    return false;
                                }}
                                onChange={(info) => {
                                    console.log('ListVanBanDen onChange info:', info);
                                    // Always sync controlled list from Upload's info.fileList
                                    const normalized = info.fileList.map((f) => ({
                                        ...f,
                                        uid: String(f.uid),
                                        name: f.name,
                                        status: f.status || 'done',
                                        originFileObj: f.originFileObj || f,
                                    }));
                                    setFileList(normalized);
                                }}
                                onRemove={(file) => {
                                    console.log('ListVanBanDen onRemove file:', file);
                                    setFileList((prev) => prev.filter((item) => item.uid !== String(file.uid)));
                                }}
                            >
                                <p className="ant-upload-drag-icon"><InboxOutlined /></p>
                                <p className="ant-upload-text">Kéo thả hoặc click để chọn tệp (PDF, Word...)</p>
                            </Dragger>
                            <div style={{ marginTop: 12, padding: '8px', background: '#f5f5f5', borderRadius: 6 }}>
                                <strong>Debug fileList:</strong> {fileList.length} file(s)
                                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginTop: 8 }}>
                                    {JSON.stringify(fileList.map((file) => ({ uid: file.uid, name: file.name, status: file.status })), null, 2)}
                                </pre>
                                <div style={{ marginTop: 8 }}>
                                    <strong>Tệp đã chọn:</strong>
                                    <ul style={{ marginTop: 6 }}>
                                        {fileList.length === 0 && <li style={{ color: '#888' }}>Chưa có tệp</li>}
                                        {fileList.map((f) => (
                                            <li key={String(f.uid)} style={{ wordBreak: 'break-word' }}>{f.name || (f.originFileObj && f.originFileObj.name) || 'Tệp'}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </Col>
                    </Row>
                </Form>
            </Modal>
            <Modal
                title={`Phân phối Văn bản đến (ID: ${phanPhoiRecord?.id || ''})`}
                open={isPhanPhoiModalVisible}
                onCancel={() => {
                    setIsPhanPhoiModalVisible(false);
                    formPhanPhoi.resetFields();
                }}
                onOk={() => formPhanPhoi.submit()}
                okText="Phân phối"
                cancelText="Hủy"
                width={500}
            >
                <Form form={formPhanPhoi} layout="vertical" onFinish={handlePhanPhoi}>
                    <Form.Item
                        name="nguoi_xu_ly_id"
                        label="Chọn Cán bộ xử lý"
                        rules={[{ required: true, message: 'Vui lòng chọn cán bộ!' }]}
                    >
                        <Select
                            placeholder="Chọn cán bộ..."
                            options={canBoOptions}
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

export default ListVanBanDen;