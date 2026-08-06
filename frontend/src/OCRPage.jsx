import React, { useState, useEffect } from 'react';
import { Button, Card, Upload, message, Typography, Row, Col, Spin, Tag, Space, Modal } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Dragger } = Upload;
const { Title, Paragraph } = Typography;
const BASE_URL = 'http://localhost:8000';

const OCRPage = () => {
    const [fileList, setFileList] = useState([]);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [job, setJob] = useState(null);
    const [imageSize, setImageSize] = useState({ naturalWidth: 0, naturalHeight: 0, displayWidth: 0, displayHeight: 0 });
    const [modalVisible, setModalVisible] = useState(false);

    const extractedItems = Array.isArray(job?.extracted_items) ? job.extracted_items : [];
    const boxColors = [
        'rgba(24, 144, 255, 0.85)',
        'rgba(82, 196, 26, 0.85)',
        'rgba(250, 139, 22, 0.85)',
        'rgba(19, 194, 194, 0.85)',
        'rgba(114, 46, 209, 0.85)',
        'rgba(245, 34, 45, 0.85)'
    ];

    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const getAuthHeaders = () => {
        const token = localStorage.getItem('access_token');
        return {
            Authorization: `Bearer ${token}`
        };
    };

    const handleChange = ({ fileList: nextFileList }) => {
        const selected = nextFileList.slice(-1);
        setFileList(selected);

        if (selected.length && selected[0]?.originFileObj) {
            const url = URL.createObjectURL(selected[0].originFileObj);
            setPreviewUrl((current) => {
                if (current) URL.revokeObjectURL(current);
                return url;
            });
        } else {
            setPreviewUrl(null);
        }
    };

    const handleRemove = () => {
        setFileList([]);
        setJob(null);
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }
    };

    const handleImageLoad = (event) => {
        const { naturalWidth, naturalHeight, clientWidth, clientHeight } = event.target;
        setImageSize({ naturalWidth, naturalHeight, displayWidth: clientWidth, displayHeight: clientHeight });
    };

    const handleProcess = async () => {
        if (!fileList.length || !fileList[0]?.originFileObj) {
            message.warning('Vui lòng chọn một file ảnh để xử lý.');
            return;
        }

        const formData = new FormData();
        formData.append('file', fileList[0].originFileObj);

        setProcessing(true);
        setJob(null);

        try {
            const response = await axios.post(`${BASE_URL}/api/ocr/process`, formData, {
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'multipart/form-data'
                }
            });
            setJob(response.data);
            message.success('OCR đã xử lý xong. Kết quả đã lưu vào cơ sở dữ liệu.');
        } catch (error) {
            const detail = error?.response?.data?.detail || 'Có lỗi khi xử lý OCR.';
            message.error(detail);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <Card title="OCR Văn bản" style={{ borderRadius: 12 }}>
            <Row gutter={24} align="top">
                <Col xs={24} lg={10}>
                    <Card
                        type="inner"
                        title="Tải ảnh và xem trước"
                        style={{ minHeight: 520, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                    >
                        <div>
                            <Paragraph>
                                Tải ảnh tài liệu lên để hệ thống nhận diện. Ảnh sẽ hiển thị ngay trong khung bên dưới.
                            </Paragraph>
                            <Dragger
                                accept=".jpg,.jpeg,.png,.bmp,.tif,.tiff"
                                customRequest={() => null}
                                fileList={fileList}
                                onChange={handleChange}
                                onRemove={handleRemove}
                                beforeUpload={() => false}
                                maxCount={1}
                                showUploadList={false}
                                style={{ padding: 16, minHeight: 420, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
                            >
                                {previewUrl ? (
                                    <div style={{ width: '100%', textAlign: 'center' }}>
                                        <img
                                            src={previewUrl}
                                            alt="Ảnh đã chọn"
                                            onLoad={handleImageLoad}
                                            style={{ maxWidth: '100%', maxHeight: 360, objectFit: 'contain', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                                        />
                                        <div style={{ marginTop: 12, color: '#595959' }}>
                                            Nhấn vào vùng này để chọn ảnh khác.
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center' }}>
                                        <InboxOutlined style={{ fontSize: 32, color: '#1890ff' }} />
                                        <p className="ant-upload-text" style={{ marginTop: 12, fontSize: 16 }}>
                                            Kéo thả hoặc click để chọn ảnh tài liệu
                                        </p>
                                        <p className="ant-upload-hint" style={{ color: '#8c8c8c' }}>
                                            Hỗ trợ JPG, PNG, BMP, TIFF.
                                        </p>
                                    </div>
                                )}
                            </Dragger>
                        </div>
                        <Space direction="horizontal" size="middle" style={{ marginTop: 20, width: '100%', justifyContent: 'space-between' }}>
                            <Button onClick={handleRemove} disabled={!fileList.length || processing}>
                                Xóa ảnh
                            </Button>
                            <Button type="primary" onClick={handleProcess} disabled={!fileList.length || processing}>
                                {processing ? 'Đang xử lý...' : 'Bắt đầu OCR'}
                            </Button>
                        </Space>
                    </Card>
                </Col>
                <Col xs={24} lg={14}>
                    <Card type="inner" title="Kết quả OCR" style={{ minHeight: 520 }}>
                        {processing ? (
                            <div style={{ textAlign: 'center', paddingTop: 48 }}>
                                <Spin size="large" />
                            </div>
                        ) : !job ? (
                            <Paragraph type="secondary">Kết quả sẽ hiển thị sau khi xử lý.</Paragraph>
                        ) : (
                            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                                <div style={{ marginBottom: 16 }}>
                                    <Tag color={job.status === 'COMPLETED' ? 'green' : 'red'}>{job.status}</Tag>
                                    <div><strong>File:</strong> {job.file_name}</div>
                                    <div><strong>Ngày xử lý:</strong> {new Date(job.processed_at).toLocaleString()}</div>
                                </div>

                                <Card size="small" style={{ borderRadius: 10, padding: 20, background: '#ffffff', borderColor: '#f0f0f0' }}>
                                    <div style={{ marginBottom: 16 }}>
                                        <div style={{ fontWeight: 700, fontSize: 16, color: '#111827' }}>Ảnh đã được OCR</div>
                                        <div style={{ color: '#595959', marginTop: 8 }}>{extractedItems.length} mục</div>
                                    </div>
                                    <div style={{ width: '100%', textAlign: 'center' }}>
                                        <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
                                            <img
                                                src={previewUrl}
                                                alt="Ảnh OCR"
                                                style={{ maxWidth: '100%', maxHeight: 320, objectFit: 'contain', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                                            />
                                            {extractedItems.length > 0 && imageSize.naturalWidth > 0 && (
                                                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                                                    {extractedItems.map((item, idx) => {
                                                            const scaleX = imageSize.displayWidth / imageSize.naturalWidth;
                                                            const scaleY = imageSize.displayHeight / imageSize.naturalHeight;
                                                            const left = item.x1 * scaleX;
                                                            const top = item.y1 * scaleY;
                                                            const width = (item.x2 - item.x1) * scaleX;
                                                            const height = (item.y2 - item.y1) * scaleY;
                                                            const color = boxColors[idx % boxColors.length];
                                                            return (
                                                                <div
                                                                    key={idx}
                                                                    style={{
                                                                        position: 'absolute',
                                                                        left,
                                                                        top,
                                                                        width,
                                                                        height,
                                                                        border: `2px solid ${color}`,
                                                                        boxSizing: 'border-box',
                                                                        borderRadius: 6,
                                                                    }}
                                                                >
                                                                    <div style={{
                                                                        position: 'absolute',
                                                                        top: 0,
                                                                        left: 0,
                                                                        background: color,
                                                                        color: '#fff',
                                                                        fontSize: 11,
                                                                        fontWeight: 700,
                                                                        padding: '3px 6px',
                                                                        borderRadius: '0 0 6px 0'
                                                                    }}>
                                                                        {item.label || 'N/A'}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'center', marginTop: 20 }}>
                                        <Button type="primary" onClick={() => setModalVisible(true)} disabled={!extractedItems.length}>
                                            Xem chi tiết
                                        </Button>
                                    </div>
                                </Card>
                            </Space>
                        )}
                    </Card>
                </Col>
            </Row>
            <Modal
                title="Chi tiết mục trích xuất"
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={null}
                width={760}
            >
                <div style={{ marginBottom: 18 }}>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>Danh sách mục đã trích xuất</div>
                    <div style={{ color: '#595959' }}>{extractedItems.length} mục</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr 180px', gap: 12, padding: '12px 12px 8px', borderBottom: '2px solid #f0f0f0', fontWeight: 700, color: '#111827' }}>
                    <div>Mục</div>
                    <div>Nội dung</div>
                    <div>Vùng</div>
                </div>
                <div style={{ maxHeight: 'calc(80vh - 120px)', overflowY: 'auto' }}>
                    {extractedItems.map((item) => (
                        <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '160px 1fr 180px', gap: 12, padding: '12px 12px', borderBottom: '1px solid #f0f0f0' }}>
                            <div style={{ color: '#595959', fontWeight: 700 }}>{item.label || 'Không xác định'}</div>
                            <div style={{ color: '#111827', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{item.text || '-'}</div>
                            <div style={{ color: '#111827' }}>{`[${item.x1}, ${item.y1}, ${item.x2}, ${item.y2}]`}</div>
                        </div>
                    ))}
                </div>
            </Modal>
        </Card>
    );
};

export default OCRPage;
