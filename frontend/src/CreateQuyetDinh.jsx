import React, { useEffect, useState } from 'react';
import { Card, Form, Input, Button, Select, message, Modal, Table, DatePicker, Space, Typography } from 'antd';
import axios from 'axios';
import dayjs from 'dayjs';

const { Title } = Typography;
const BASE_URL = 'http://localhost:8000';

const CreateQuyetDinh = () => {
  const [form] = Form.useForm();
  const [thanhPhan, setThanhPhan] = useState([]);
  const [danhMucLoai, setDanhMucLoai] = useState([]);
  const [vaiTroOptions, setVaiTroOptions] = useState([]);
  const [vanBanDiOptions, setVanBanDiOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  const authHeaders = () => {
    const token = localStorage.getItem('access_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    const fetch = async () => {
      try {
        const [loaiRes, vaiTroRes, vanBanRes] = await Promise.all([
          axios.get(`${BASE_URL}/api/danh-muc/`, { headers: authHeaders() }),
          axios.get(`${BASE_URL}/api/danh-muc-vai-tro-quyet-dinh/`, { headers: authHeaders() }),
          axios.get(`${BASE_URL}/api/van-ban-di/`, { headers: authHeaders(), params: { page: 1, size: 100 } }),
        ]);

        setDanhMucLoai(loaiRes.data || []);
        setVaiTroOptions(vaiTroRes.data || []);
        const vanBanList = vanBanRes.data?.data || vanBanRes.data || [];
        setVanBanDiOptions(vanBanList.map(v => ({ label: `${v.so_ky_hieu} - ${v.trich_yeu?.slice(0, 40) || ''}`, value: v.id })));
      } catch (e) {
        console.warn('Không tải được danh mục cho quyết định', e);
      }
    };

    fetch();
  }, []);

  const addThanhPhan = (values) => {
    setThanhPhan(prev => [...prev, { ...values, key: String(prev.length + 1) }]);
    Modal.destroyAll();
  };

  const handleAddThanhPhan = () => {
    let tpForm;

    Modal.confirm({
      title: 'Thêm thành phần quyết định',
      content: (
        <Form layout="vertical" ref={(ref) => (tpForm = ref)} onFinish={(vals) => addThanhPhan(vals)}>
          <Form.Item name="ho_ten" label="Họ tên" rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}>
            <Input placeholder="Nhập họ tên" />
          </Form.Item>
          <Form.Item name="ten_don_vi" label="Tên đơn vị">
            <Input placeholder="Nhập đơn vị" />
          </Form.Item>
          <Form.Item name="chuc_vu" label="Chức vụ">
            <Input placeholder="Nhập chức vụ" />
          </Form.Item>
          <Form.Item name="vai_tro_quyet_dinh_id" label="Vai trò" rules={[{ required: true, message: 'Chọn vai trò' }]}>
            <Select placeholder="Chọn vai trò" options={vaiTroOptions.map(v => ({ label: v.ten_vai_tro, value: v.id }))} />
          </Form.Item>
          <Form.Item name="noi_dung_lien_quan" label="Nội dung liên quan">
            <Input.TextArea rows={3} placeholder="Ghi nội dung liên quan" />
          </Form.Item>
        </Form>
      ),
      onOk: () => tpForm && tpForm.submit(),
      okText: 'Thêm',
      width: 650,
    });
  };

  const handleSubmit = async (values) => {
    if (thanhPhan.length === 0) {
      message.warning('Vui lòng thêm ít nhất một thành phần quyết định.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...values,
        ngay_hieu_luc: values.ngay_hieu_luc ? values.ngay_hieu_luc.format('YYYY-MM-DD') : null,
        thanh_phan: thanhPhan.map(p => ({
          ho_ten: p.ho_ten,
          ten_don_vi: p.ten_don_vi,
          chuc_vu: p.chuc_vu,
          vai_tro_quyet_dinh_id: p.vai_tro_quyet_dinh_id,
          noi_dung_lien_quan: p.noi_dung_lien_quan,
        })),
      };

      await axios.post(`${BASE_URL}/api/quyet-dinh/`, payload, { headers: { ...authHeaders(), 'Content-Type': 'application/json' } });
      message.success('Tạo quyết định thành công');
      form.resetFields();
      setThanhPhan([]);
    } catch (error) {
      console.error(error);
      message.error(error.response?.data?.detail || 'Lỗi khi tạo quyết định');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { title: 'Họ tên', dataIndex: 'ho_ten', key: 'ho_ten' },
    { title: 'Đơn vị', dataIndex: 'ten_don_vi', key: 'ten_don_vi' },
    { title: 'Chức vụ', dataIndex: 'chuc_vu', key: 'chuc_vu' },
    { title: 'Vai trò', dataIndex: 'vai_tro_quyet_dinh_id', key: 'vai_tro_quyet_dinh_id', render: (value) => vaiTroOptions.find(v => v.value === value)?.label || value },
    {
      title: 'Hành động', key: 'action', render: (_, record) => (
        <Button danger size="small" onClick={() => setThanhPhan(prev => prev.filter(item => item.key !== record.key))}>
          Xóa
        </Button>
      ),
    },
  ];

  return (
    <Card style={{ borderRadius: 12, minHeight: 520 }}>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Title level={4}>Tạo Quyết định</Title>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="van_ban_di_id" label="Văn bản đi" rules={[{ required: true, message: 'Chọn văn bản đi' }]}>
            <Select placeholder="Chọn văn bản đi" options={vanBanDiOptions} showSearch optionFilterProp="label" />
          </Form.Item>

          <Form.Item name="loai_quyet_dinh_id" label="Loại quyết định" rules={[{ required: true, message: 'Chọn loại quyết định' }]}>
            <Select placeholder="Chọn loại quyết định" options={danhMucLoai.map(d => ({ label: d.ten_loai_quyet_dinh || d.ten_loai_vb, value: d.id }))} />
          </Form.Item>

          <Form.Item name="ngay_hieu_luc" label="Ngày hiệu lực">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item>
            <Button type="dashed" onClick={handleAddThanhPhan} block>
              Thêm thành phần quyết định
            </Button>
          </Form.Item>

          <Table columns={columns} dataSource={thanhPhan} pagination={false} rowKey="key" />

          <Form.Item style={{ marginTop: 20 }}>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Lưu quyết định
            </Button>
          </Form.Item>
        </Form>
      </Space>
    </Card>
  );
};

export default CreateQuyetDinh;
