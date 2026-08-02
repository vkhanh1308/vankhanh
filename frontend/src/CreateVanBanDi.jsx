import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import {
    Button,
    Card,
    Col,
    DatePicker,
    Form,
    Input,
    Row,
    Select,
    Upload,
    message,
    Spin,
    Typography,
    InputNumber
} from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import axios from 'axios';

const { TextArea } = Input;
const { Dragger } = Upload;
const { Title } = Typography;
const BASE_URL = 'http://localhost:8000';

const CreateVanBanDi = () => {
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = Boolean(id);
    const [loading, setLoading] = useState(false);
    const [loadingOptions, setLoadingOptions] = useState(true);
    const [coQuanOptions, setCoQuanOptions] = useState([]);
    const [danhMucOptions, setDanhMucOptions] = useState([]);
    const [hoSoOptions, setHoSoOptions] = useState([]);
    const [fileList, setFileList] = useState([]);
    const [canBoOptions, setCanBoOptions] = useState([]);

    useEffect(() => {
        console.log('CreateVanBanDi fileList state:', fileList);
    }, [fileList]);

    const getAuthHeaders = () => {
        const token = localStorage.getItem('access_token');
        return {
            Authorization: `Bearer ${token}`
        };
    };

    useEffect(() => {
        const fetchOptions = async () => {
            setLoadingOptions(true);
            try {
                const [coQuanRes, danhMucRes, hoSoRes, canBoRes] = await Promise.all([
                    axios.get(`${BASE_URL}/api/co-quan/`, { headers: getAuthHeaders() }),
                    axios.get(`${BASE_URL}/api/danh-muc/`, { headers: getAuthHeaders() }),
                    axios.get(`${BASE_URL}/api/ho-so/`, { headers: getAuthHeaders() }),
                    axios.get(`${BASE_URL}/api/can-bo/`, { headers: getAuthHeaders() })
                ]);

                setCoQuanOptions(
                    (coQuanRes.data || []).map((item) => ({
                        label: item.ten_co_quan,
                        value: item.id
                    }))
                );

                setDanhMucOptions(
                    (danhMucRes.data || []).map((item) => ({
                        label: item.ten_loai_vb,
                        value: item.id
                    }))
                );

                const hoSoArray = Array.isArray(hoSoRes.data) ? hoSoRes.data : (hoSoRes.data?.data || []);

                setHoSoOptions(
                    hoSoArray.map((item) => ({
                        label: item.ma_ho_so,
                        value: item.ma_ho_so
                    }))
                );
                setCanBoOptions((canBoRes.data || []).map(item => ({
                    label: `${item.ho_ten} ${item.chuc_vu ? `(${item.chuc_vu})` : ''}`,
                    value: item.id,
                    chuc_vu: item.chuc_vu
                }))
                );
            } catch (error) {
                message.error('Không thể tải dữ liệu dropdown. Vui lòng đăng nhập lại.');
            } finally {
                setLoadingOptions(false);
            }
        };

        fetchOptions();
    }, []);

    useEffect(() => {
        if (!isEditMode || !id) return;

        const fetchDocument = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`${BASE_URL}/api/van-ban-di/${id}`, {
                    headers: getAuthHeaders()
                });
                const data = response.data || {};

                form.setFieldsValue({
                    so_ky_hieu: data.so_ky_hieu,
                    ngay_ban_hanh: data.ngay_ban_hanh ? dayjs(data.ngay_ban_hanh) : null,
                    trich_yeu: data.trich_yeu,
                    don_vi_soan_thao_id: data.don_vi_soan_thao_id,
                    ma_loai_vb_id: data.ma_loai_vb_id,
                    ngon_ngu: data.ngon_ngu || 'Tiếng Việt',
                    so_trang: data.so_trang,
                    ghi_chu: data.ghi_chu,
                    nguoi_ky_id: data.nguoi_ky_id,
                    chuc_vu_nguoi_ky: data.chuc_vu_nguoi_ky,
                    noi_nhan: data.noi_nhan,
                    muc_do_khan: data.muc_do_khan,
                    so_luong_ban_phat_hanh: data.so_luong_ban_phat_hanh,
                    han_tra_loi: data.han_tra_loi ? dayjs(data.han_tra_loi) : null,
                    stt_trong_ho_so: data.stt_trong_ho_so,
                    ma_ho_so: data.ma_ho_so,
                });

                const formattedFiles = (data.tep_dinh_kems || []).map((f) => ({
                    uid: String(f.id),
                    name: f.ten_file,
                    status: 'done',
                    url: `${BASE_URL}/${f.duong_dan.replaceAll('\\', '/').replace(/^\//, '')}`
                }));
                setFileList(formattedFiles);
            } catch (error) {
                message.error('Không thể tải dữ liệu văn bản để chỉnh sửa.');
            } finally {
                setLoading(false);
            }
        };

        fetchDocument();
    }, [id, isEditMode, form]);

    const handleSubmit = async (values) => {
        setLoading(true);

        try {
            const formData = new FormData();
            const appendIfPresent = (key, value) => {
                if (value !== undefined && value !== null && value !== '') {
                    formData.append(key, value);
                }
            };

            appendIfPresent('so_ky_hieu', values.so_ky_hieu);
            if (values.ngay_ban_hanh) {
                formData.append('ngay_ban_hanh', values.ngay_ban_hanh.format('YYYY-MM-DD'));
            }
            appendIfPresent('trich_yeu', values.trich_yeu);
            appendIfPresent('don_vi_soan_thao_id', values.don_vi_soan_thao_id);
            appendIfPresent('ma_loai_vb_id', values.ma_loai_vb_id);
            appendIfPresent('ngon_ngu', values.ngon_ngu || 'Tiếng Việt');
            appendIfPresent('so_trang', values.so_trang);
            appendIfPresent('ghi_chu', values.ghi_chu);
            appendIfPresent('nguoi_ky_id', values.nguoi_ky_id);
            appendIfPresent('chuc_vu_nguoi_ky', values.chuc_vu_nguoi_ky);
            appendIfPresent('noi_nhan', values.noi_nhan);
            appendIfPresent('muc_do_khan', values.muc_do_khan);
            appendIfPresent('so_luong_ban_phat_hanh', values.so_luong_ban_phat_hanh);
            if (values.han_tra_loi) {
                formData.append('han_tra_loi', values.han_tra_loi.format('YYYY-MM-DD'));
            }
            appendIfPresent('stt_trong_ho_so', values.stt_trong_ho_so);
            appendIfPresent('ma_ho_so', values.ma_ho_so);

            for (const file of fileList) {
                if (file.originFileObj) {
                    try {
                        const original = file.originFileObj;
                        const buffer = await original.arrayBuffer();
                        const safeFile = new File([buffer], original.name, { type: original.type });
                        formData.append('files', safeFile);
                    } catch (e) {
                        formData.append('files', file.originFileObj);
                    }
                }
            }

            if (isEditMode) {
                await axios.put(`${BASE_URL}/api/van-ban-di/${id}`, formData, {
                    headers: {
                        ...getAuthHeaders()
                    }
                });
                message.success('Cập nhật văn bản đi thành công!');
            } else {
                await axios.post(`${BASE_URL}/api/van-ban-di/`, formData, {
                    headers: {
                        ...getAuthHeaders()
                    }
                });
                message.success('Tạo văn bản đi thành công!');
            }

            form.resetFields();
            // After saving, keep server-returned items visible by converting local files to server-style entries if backend returned them.
            // (Backend upload handling already creates URLs when you call upload endpoint.)
            // For Create flow we simply clear local originFileObj flags so list shows as 'done'.
            setFileList((prev) => prev.map((f) => ({ ...f, status: 'done' })));
            navigate('/van-ban-di');
        } catch (error) {
            const errorMsg =
                error?.response?.data?.detail ||
                'Có lỗi xảy ra khi lưu văn bản đi.';
            message.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card title={isEditMode ? 'Chỉnh sửa Văn bản đi' : 'Thêm Văn bản đi'} style={{ borderRadius: 12 }}>
            <Spin spinning={loadingOptions}>
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    initialValues={{
                        ngon_ngu: 'Tiếng Việt'
                    }}
                >
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label="Số ký hiệu" name="so_ky_hieu">
                                <Input placeholder="VD: VB/2026/001" />
                            </Form.Item>

                            <Form.Item label="Ngày ban hành" name="ngay_ban_hanh">
                                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
                            </Form.Item>

                            <Form.Item
                                label="Trích yếu"
                                name="trich_yeu"
                                rules={[{ required: true, message: 'Vui lòng nhập trích yếu' }]}
                            >
                                <TextArea rows={4} placeholder="Nhập trích yếu nội dung văn bản" />
                            </Form.Item>

                            <Form.Item
                                label="Đơn vị soạn thảo"
                                name="don_vi_soan_thao_id"
                                rules={[{ required: true, message: 'Vui lòng chọn đơn vị soạn thảo' }]}
                            >
                                <Select
                                    options={coQuanOptions}
                                    placeholder="Chọn đơn vị soạn thảo"
                                    showSearch
                                    filterOption={(input, option) =>
                                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                    }
                                />
                            </Form.Item>

                            <Form.Item
                                label="Loại văn bản"
                                name="ma_loai_vb_id"
                                rules={[{ required: true, message: 'Vui lòng chọn loại văn bản' }]}
                            >
                                <Select
                                    options={danhMucOptions}
                                    placeholder="Chọn loại văn bản"
                                    showSearch
                                    filterOption={(input, option) =>
                                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                    }
                                />
                            </Form.Item>

                            <Form.Item label="Ngôn ngữ" name="ngon_ngu">
                                <Input placeholder="Ví dụ: Tiếng Việt" />
                            </Form.Item>

                            <Form.Item
                                label="Số trang"
                                name="so_trang"
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
                                {/* Xóa min={0} ở đây để nó không tự ép về 0 nữa */}
                                <InputNumber precision={0} style={{ width: '100%' }} placeholder="Nhập số trang" />
                            </Form.Item>

                            <Form.Item label="Ghi chú" name="ghi_chu">
                                <TextArea rows={3} placeholder="Ghi chú thêm" />
                            </Form.Item>
                        </Col>

                        <Col span={12}>
                            <Form.Item name="nguoi_ky_id" label="Người ký">
                                <Select
                                    showSearch
                                    options={canBoOptions}
                                    placeholder="Chọn người ký văn bản"
                                    filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                                    allowClear
                                    onChange={(value, option) => {
                                        // Phép thuật Auto-fill nằm ở đây:
                                        form.setFieldsValue({ chuc_vu_nguoi_ky: option?.chuc_vu || '' });
                                    }}
                                />
                            </Form.Item>

                            <Form.Item label="Chức vụ người ký" name="chuc_vu_nguoi_ky">
                                <Input placeholder="Hệ thống tự điền..." readOnly style={{ backgroundColor: '#f5f5f5' }} />
                            </Form.Item>

                            <Form.Item label="Nơi nhận" name="noi_nhan">
                                <Input placeholder="Ví dụ: Phòng Đào tạo" />
                            </Form.Item>

                            <Form.Item label="Mức độ khẩn" name="muc_do_khan">
                                <Select
                                    placeholder="Chọn mức độ khẩn"
                                    options={[
                                        { label: '1', value: 1 },
                                        { label: '2', value: 2 },
                                        { label: '3', value: 3 },
                                        { label: '4', value: 4 },
                                        { label: '5', value: 5 }
                                    ]}
                                />
                            </Form.Item>

                            <Form.Item
                                label="Số lượng bản phát hành"
                                name="so_luong_ban_phat_hanh"
                                rules={[
                                    () => ({
                                        validator(_, value) {
                                            if (value !== undefined && value !== null && value < 0) {
                                                return Promise.reject(new Error('Số lượng không được là số âm!'));
                                            }
                                            return Promise.resolve();
                                        },
                                    }),
                                ]}
                            >
                                <Input type="number" placeholder="Ví dụ: 10" />
                            </Form.Item>

                            <Form.Item
                                label="Hạn trả lời"
                                name="han_tra_loi"
                                dependencies={['ngay_ban_hanh']}
                                rules={[
                                    ({ getFieldValue }) => ({
                                        validator(_, value) {
                                            if (!value || !getFieldValue('ngay_ban_hanh')) return Promise.resolve();

                                            if (value.isBefore(getFieldValue('ngay_ban_hanh'), 'day')) {
                                                return Promise.reject(new Error('Hạn trả lời KHÔNG ĐƯỢC trước Ngày ban hành!'));
                                            }
                                            return Promise.resolve();
                                        },
                                    }),
                                ]}
                            >
                                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                            </Form.Item>

                            <Form.Item label="Số thứ tự trong hồ sơ" name="stt_trong_ho_so">
                                <Input type="number" placeholder="Ví dụ: 1" />
                            </Form.Item>

                            <Form.Item label="Mã hồ sơ" name="ma_ho_so">
                                <Select
                                    options={hoSoOptions}
                                    placeholder="Chọn mã hồ sơ"
                                    showSearch
                                    filterOption={(input, option) =>
                                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                    }
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row>
                        <Col span={24}>
                            <Title level={5} style={{ marginBottom: 12 }}>
                                Tệp đính kèm
                            </Title>
                            <Dragger
                                accept=".pdf,.doc,.docx"
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
                                    console.log('CreateVanBanDi beforeUpload file:', file);
                                    return false;
                                }}
                                onChange={(info) => {
                                    console.log('CreateVanBanDi onChange info:', info);
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
                                    console.log('CreateVanBanDi onRemove file:', file);
                                    setFileList((prev) => prev.filter((item) => item.uid !== String(file.uid)));
                                }}
                            >
                                <p className="ant-upload-drag-icon">
                                    <InboxOutlined />
                                </p>
                                <p className="ant-upload-text">
                                    Kéo thả tệp vào đây hoặc bấm để chọn file
                                </p>
                                <p className="ant-upload-hint">
                                    Chỉ chấp nhận file PDF, DOC, DOCX
                                </p>
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

                    <Row style={{ marginTop: 16 }}>
                        <Col span={24} style={{ textAlign: 'right' }}>
                            <Button
                                type="default"
                                style={{ marginRight: 8 }}
                                onClick={() => navigate('/van-ban-di')}
                            >
                                Hủy
                            </Button>
                            <Button type="primary" htmlType="submit" loading={loading}>
                                {isEditMode ? 'Cập nhật' : 'Lưu'}
                            </Button>
                        </Col>
                    </Row>
                </Form>
            </Spin>
        </Card>
    );
};

export default CreateVanBanDi;