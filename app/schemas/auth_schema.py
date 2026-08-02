from pydantic import BaseModel
# Dữ liệu người dùng gửi lên để đăng nhập


class LoginRequest(BaseModel):
    ten_dang_nhap: str
    mat_khau: str

# Dữ liệu hệ thống trả về (Thẻ Token)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    tai_khoan_id: int
    ten_dang_nhap: str
    vai_tros: list[str] = []
