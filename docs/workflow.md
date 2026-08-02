# Workflow nghiệp vụ - Hệ thống Quản lý Tài liệu Điện tử

## 1. Luồng Đăng nhập

### Mục tiêu
Cho phép người dùng xác thực tài khoản để sử dụng hệ thống.

### Các bước
1. Người dùng mở màn hình đăng nhập.
2. Người dùng nhập:
   - `username`
   - `password`
3. Frontend gọi API:
   - `POST /api/auth/login`
4. Server kiểm tra:
   - tài khoản có tồn tại không
   - mật khẩu có đúng không
   - tài khoản có đang ở trạng thái `ACTIVE` không
5. Nếu hợp lệ, backend trả về JWT token gồm:
   - `access_token`
   - `token_type`
   - `tai_khoan_id`
   - `ten_dang_nhap`
6. Frontend lưu token vào local storage hoặc cookie.
7. Mỗi lần gọi API cần gửi token trong header:
   - `Authorization: Bearer <token>`
8. Nếu token hết hạn hoặc không hợp lệ, hệ thống báo lỗi `401` và yêu cầu đăng nhập lại.

### Kết quả mong đợi
- Người dùng đăng nhập thành công và được phép truy cập các API có bảo vệ.

---

## 2. Luồng Thêm mới Văn bản đi

### Mục tiêu
Cho phép người dùng tạo mới một văn bản đi và lưu vào hệ thống.

### Các bước
1. Người dùng vào màn hình "Thêm Văn bản đi".
2. Hệ thống tải dữ liệu cần thiết cho form:
   - danh sách đơn vị soạn thảo (`/api/co-quan/`)
   - danh sách loại văn bản (`/api/danh-muc/`)
   - danh sách hồ sơ (`/api/ho-so/`)
3. Người dùng nhập các thông tin cần thiết:
   - số ký hiệu
   - ngày ban hành
   - trích yếu
   - đơn vị soạn thảo
   - loại văn bản
   - ngôn ngữ
   - số trang
   - người ký / chức vụ người ký
   - nơi nhận
   - mức độ khẩn
   - hạn trả lời
   - số thứ tự trong hồ sơ
   - mã hồ sơ
4. Frontend kiểm tra các trường bắt buộc trước khi gọi API.
5. Frontend gọi API:
   - `POST /api/van-ban-di/`
6. Backend thực hiện:
   - kiểm tra dữ liệu đầu vào
   - tạo bản ghi mới trong bảng `van_ban_di`
7. Nếu thành công, API trả về thông tin văn bản vừa tạo.
8. Frontend hiển thị thông báo thành công và quay về danh sách văn bản đi.

### Điều kiện cần
- Người dùng phải đăng nhập thành công.
- Token phải hợp lệ.
- Các trường bắt buộc phải được điền đầy đủ.

### Kết quả mong đợi
- Một bản ghi văn bản đi mới được tạo và hiển thị trên danh sách.

## 3. Luồng Nộp lưu Hồ sơ
### Mục tiêu
Chuyển hồ sơ đã đóng vào kho lưu trữ vĩnh viễn.
### Điều kiện cần
- Hồ sơ phải ở trạng thái `DA_DONG`.
- Hồ sơ phải chứa ít nhất 1 Văn bản đến hoặc Văn bản đi.
### Các bước
1. Người dùng bấm nút "Nộp lưu" tại cột Thao tác.
2. Hệ thống hiện Popconfirm xác nhận.
3. Gọi API PATCH `/nop-luu`.
4. Backend kiểm tra Guard clauses (Trạng thái, Rỗng).
5. Cập nhật DB, trả về thông báo thành công.
### Kết quả mong đợi
Trạng thái hồ sơ chuyển thành `DA_NOP_LUU`, nút "Nộp lưu" bị ẩn đi trên UI.
