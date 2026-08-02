# API Specification - Hệ thống Quản lý Tài liệu Điện tử

## 1. Cấu hình xác thực
Tất cả API cần thiết có header xác thực:

- `Authorization: Bearer <access_token>`

Token được trả về từ API đăng nhập.

---

## 2. API Xác thực & Đăng nhập

### 2.1 Đăng nhập
- **Method:** `POST`
- **URL:** `/api/auth/login`
- **Content-Type:** `application/x-www-form-urlencoded`
- **Body:**
  - `username` (string, required)
  - `password` (string, required)
- **Response thành công (200):**
  ```json
  {
    "access_token": "<jwt_token>",
    "token_type": "bearer",
    "tai_khoan_id": 1,
    "ten_dang_nhap": "admin"
  }
  ```
- **Response lỗi:**
  - `401`: tài khoản không tồn tại hoặc mật khẩu sai
  - `403`: tài khoản bị khóa

---

## 3. API Quản lý Cơ quan

### 3.1 Tạo cơ quan
- **Method:** `POST`
- **URL:** `/api/co-quan/`
- **Header:** `Authorization: Bearer <token>`
- **Body:**
  ```json
  {
    "ten_co_quan": "Trường Đại học ABC",
    "organ_id": "ORG001",
    "dia_chi": "Đường 3/2, Q.Ninh Kiều"
  }
  ```
- **Response thành công (200):**
  ```json
  {
    "id": 1,
    "ten_co_quan": "Trường Đại học ABC",
    "organ_id": "ORG001",
    "dia_chi": "Đường 3/2, Q.Ninh Kiều"
  }
  ```
- **Response lỗi:**
  - `400`: `organ_id` đã tồn tại

### 3.2 Lấy danh sách cơ quan
- **Method:** `GET`
- **URL:** `/api/co-quan/`
- **Header:** `Authorization: Bearer <token>` (nếu API đang bảo vệ)
- **Response thành công (200):**
  ```json
  [
    {
      "id": 1,
      "ten_co_quan": "Trường Đại học ABC",
      "organ_id": "ORG001",
      "dia_chi": "Đường 3/2, Q.Ninh Kiều"
    }
  ]
  ```

---

## 4. API Quản lý Danh mục Văn bản

### 4.1 Tạo danh mục
- **Method:** `POST`
- **URL:** `/api/danh-muc/`
- **Header:** `Authorization: Bearer <token>`
- **Body:**
  ```json
  {
    "ten_loai_vb": "Quyết định",
    "mo_ta": "Danh mục văn bản quyết định"
  }
  ```
- **Response thành công (200):**
  ```json
  {
    "id": 1,
    "ten_loai_vb": "Quyết định",
    "mo_ta": "Danh mục văn bản quyết định"
  }
  ```

### 4.2 Lấy danh sách danh mục
- **Method:** `GET`
- **URL:** `/api/danh-muc/`
- **Header:** `Authorization: Bearer <token>`
- **Response thành công (200):**
  ```json
  [
    {
      "id": 1,
      "ten_loai_vb": "Quyết định",
      "mo_ta": "Danh mục văn bản quyết định"
    }
  ]
  ```

---

## 5. API Quản lý Hồ sơ

### 5.1 Tạo hồ sơ
- **Method:** `POST`
- **URL:** `/api/ho-so/`
- **Header:** `Authorization: Bearer <token>`
- **Body:**
  ```json
  {
    "ma_ho_so": "HS001",
    "tieu_de_ho_so": "Hồ sơ công tác năm 2026",
    "thoi_han_bao_quan": "5 năm",
    "che_do_su_dung": "Mở",
    "ngay_bat_dau": "2026-01-01",
    "ngay_ket_thuc": "2026-12-31",
    "so_luong_trang": 120,
    "so_luong_van_ban": 15,
    "nguoi_lap": "Nguyễn Văn A",
    "ngon_ngu": "Tiếng Việt",
    "ghi_chu": "Hồ sơ dùng cho kiểm tra nội bộ",
    "vi_tri_id": 1
  }
  ```
- **Response thành công (200):**
  ```json
  {
    "ma_ho_so": "HS001",
    "tieu_de_ho_so": "Hồ sơ công tác năm 2026",
    "ngay_bat_dau": "2026-01-01",
    "ngay_ket_thuc": "2026-12-31",
    "vi_tri_id": 1
  }
  ```

### 5.2 Lấy danh sách hồ sơ
- **Method:** `GET`
- **URL:** `/api/ho-so/`
- **Header:** `Authorization: Bearer <token>`
- **Response thành công (200):**
  ```json
  [
    {
      "ma_ho_so": "HS001",
      "tieu_de_ho_so": "Hồ sơ công tác năm 2026",
      "ngay_bat_dau": "2026-01-01",
      "ngay_ket_thuc": "2026-12-31",
      "vi_tri_id": 1
    }
  ]
  ```
### 5.3 Nộp lưu hồ sơ (MỚI)
- **Method:** PATCH `/api/ho-so/{ma_ho_so}/nop-luu`
- **Auth:** Bearer Token
- **Response:** { "message": "Nộp lưu hồ sơ thành công!" }
- **Error 400:** "Chỉ hồ sơ đã đóng mới được nộp lưu", "Hồ sơ rỗng không được nộp lưu"

---

## 6. API Quản lý Văn bản đi

### 6.1 Tạo văn bản đi
- **Method:** `POST`
- **URL:** `/api/van-ban-di/`
- **Header:** `Authorization: Bearer <token>`
- **Body:**
  ```json
  {
    "so_ky_hieu": "VB/2026/001",
    "ngay_ban_hanh": "2026-06-17",
    "trich_yeu": "Thông báo lịch học học kỳ hè",
    "don_vi_soan_thao_id": 1,
    "ma_loai_vb_id": 1,
    "ngon_ngu": "Tiếng Việt",
    "so_trang": 2,
    "ghi_chu": "Gửi đến các khoa",
    "nguoi_ky_id": 1,
    "chuc_vu_nguoi_ky": "Hiệu trưởng",
    "noi_nhan": "Phòng Đào tạo",
    "muc_do_khan": 2,
    "han_tra_loi": "2026-06-25",
    "stt_trong_ho_so": 1,
    "ma_ho_so": "HS001"
  }
  ```
- **Response thành công (200):**
  ```json
  {
    "id": 1,
    "so_ky_hieu": "VB/2026/001",
    "trich_yeu": "Thông báo lịch học học kỳ hè",
    "don_vi_soan_thao_id": 1,
    "ma_loai_vb_id": 1,
    "ma_ho_so": "HS001"
  }
  ```

### 6.2 Lấy danh sách văn bản đi
- **Method:** `GET`
- **URL:** `/api/van-ban-di/`
- **Header:** `Authorization: Bearer <token>`
- **Response thành công (200):**
  ```json
  [
    {
      "id": 1,
      "so_ky_hieu": "VB/2026/001",
      "trich_yeu": "Thông báo lịch học học kỳ hè",
      "don_vi_soan_thao_id": 1,
      "ma_loai_vb_id": 1,
      "ma_ho_so": "HS001"
    }
  ]
  ```

---

## 7. Ghi chú cho Frontend
- Khi gọi API cần thêm header:
  - `Authorization: Bearer <token>`
- Đối với form tạo văn bản đi, frontend nên:
  - gọi `/api/co-quan/` để load danh sách đơn vị soạn thảo
  - gọi `/api/danh-muc/` để load loại văn bản
  - gọi `/api/ho-so/` để load hồ sơ
  - gọi `/api/auth/login` để lấy token trước khi thao tác
