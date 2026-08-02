# Screen Specification - Màn hình Thêm Văn bản đi

## 1. Mục tiêu màn hình
Cho phép người dùng tạo mới một bản ghi văn bản đi với các thông tin cơ bản và các thông tin liên quan đến hồ sơ, đơn vị, loại văn bản.

---

## 2. Công nghệ đề xuất
- Frontend: ReactJS
- UI Library: Ant Design
- Form handling: React Hook Form hoặc Form của Ant Design
- Data fetching: Axios hoặc Fetch API

---

## 3. Layout đề xuất
Màn hình nên dùng layout theo kiểu:
- Header chứa tiêu đề màn hình và nút `Lưu`
- Nội dung chính chia thành 2 cột

### Cột trái (main form)
Chứa các trường chính:
- Số ký hiệu
- Ngày ban hành
- Trích yếu
- Đơn vị soạn thảo
- Loại văn bản
- Ngôn ngữ
- Số trang
- Ghi chú

### Cột phải (metadata / bổ sung)
Chứa các trường phụ:
- Người ký
- Chức vụ người ký
- Nơi nhận
- Mức độ khẩn
- Hạn trả lời
- Số thứ tự trong hồ sơ
- Mã hồ sơ

---

## 4. Chi tiết form

### 4.1 Các trường bắt buộc
- `trich_yeu`
- `don_vi_soan_thao_id`
- `ma_loai_vb_id`

### 4.2 Các trường tùy chọn
- `so_ky_hieu`
- `ngay_ban_hanh`
- `ngon_ngu`
- `so_trang`
- `ghi_chu`
- `nguoi_ky_id`
- `chuc_vu_nguoi_ky`
- `noi_nhan`
- `muc_do_khan`
- `han_tra_loi`
- `stt_trong_ho_so`
- `ma_ho_so`

---

## 5. Gợi ý component UI theo Ant Design

### Input / TextArea
- `Input` cho số ký hiệu, nơi nhận, chức vụ người ký
- `TextArea` cho trích yếu, ghi chú

### DatePicker
- `DatePicker` cho `ngay_ban_hanh` và `han_tra_loi`

### Select / Dropdown
- `Select` cho:
  - đơn vị soạn thảo (`don_vi_soan_thao_id`)
  - loại văn bản (`ma_loai_vb_id`)
  - hồ sơ (`ma_ho_so`)
  - người ký (`nguoi_ky_id`)
  - mức độ khẩn (`muc_do_khan`)

### Radio / Segmented
- Có thể dùng `Radio.Group` hoặc `Segmented` cho trạng thái ưu tiên / mức độ khẩn

### Button
- `Button` lưu dữ liệu
- `Button` hủy / quay lại

---

## 6. API dùng để đổ dữ liệu vào UI

### API dùng cho Dropdown
- `GET /api/co-quan/` → load danh sách đơn vị soạn thảo
- `GET /api/danh-muc/` → load danh sách loại văn bản
- `GET /api/ho-so/` → load danh sách hồ sơ

### API dùng để submit form
- `POST /api/van-ban-di/`

### Header yêu cầu khi submit
- `Authorization: Bearer <token>`

---

## 7. Logic validate ở frontend
- `trich_yeu` bắt buộc nhập
- `don_vi_soan_thao_id` bắt buộc chọn
- `ma_loai_vb_id` bắt buộc chọn
- `ngay_ban_hanh` nếu có thì phải đúng định dạng ngày
- `han_tra_loi` nếu có thì phải không trước ngày ban hành
- `so_trang` phải là số nguyên >= 0
- `muc_do_khan` nếu có thì nằm trong khoảng hợp lệ

---

## 8. UX đề xuất
- Sau khi submit thành công, hiển thị thông báo `Thêm văn bản đi thành công`
- Sau khi lưu xong, tự chuyển về màn hình danh sách văn bản đi
- Nếu lỗi API, hiển thị message lỗi rõ ràng ở phần form
- Có thể dùng `Spin` khi đang load dữ liệu dropdown

---

## 9. Ví dụ cấu trúc form
```tsx
<Form layout="vertical">
  <Row gutter={16}>
    <Col span={12}>
      <Form.Item label="Số ký hiệu" name="so_ky_hieu">
        <Input />
      </Form.Item>
    </Col>
    <Col span={12}>
      <Form.Item label="Ngày ban hành" name="ngay_ban_hanh">
        <DatePicker style={{ width: '100%' }} />
      </Form.Item>
    </Col>
  </Row>

  <Form.Item label="Trích yếu" name="trich_yeu" rules={[{ required: true }]}> 
    <TextArea rows={4} />
  </Form.Item>

  <Row gutter={16}>
    <Col span={12}>
      <Form.Item label="Đơn vị soạn thảo" name="don_vi_soan_thao_id" rules={[{ required: true }]}> 
        <Select options={coQuanOptions} />
      </Form.Item>
    </Col>
    <Col span={12}>
      <Form.Item label="Loại văn bản" name="ma_loai_vb_id" rules={[{ required: true }]}> 
        <Select options={danhMucOptions} />
      </Form.Item>
    </Col>
  </Row>
</Form>
```

### Nút Nộp lưu
- **Vị trí:** Cột Thao tác, chỉ hiện khi `record.trang_thai === 'DA_DONG'`.
- **Component:** Ant Design Button + Popconfirm.
- **Icon:** FileDoneOutlined.
- **Màu sắc:** backgroundColor: '#1677ff' (Blue).
- **Text:** Nộp lưu.
- **Hàm:** `handleNopLuu` (đã được định nghĩa ở trên).
- **Hàm:** `handleCancelNopLuu` (đã được định nghĩa ở trên).

### Nút Hủy
- **Vị trí:** Cột Thao tác, chỉ hiện khi `record.trang_thai === 'DA_DONG'`.
- **Component:** Ant Design Button.
- **Icon:** CloseOutlined.
- **Màu sắc:** backgroundColor: '#f5222d' (Red).
- **Text:** Hủy.

