from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session, joinedload  # Bổ sung joinedload
from passlib.context import CryptContext
import jwt
from datetime import datetime, timedelta
from config.database import get_db
from app.models.auth import TaiKhoan
from app.schemas.auth_schema import TokenResponse
from app.dependencies import SECRET_KEY, ALGORITHM

router = APIRouter(
    prefix="/api/auth",
    tags=["Xác thực & Đăng nhập"]
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24


@router.post("/login", response_model=TokenResponse)
def dang_nhap(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # ĐÃ SỬA: Dùng joinedload để lôi bằng được danh sách quyền từ DB lên
    user = db.query(TaiKhoan).options(joinedload(TaiKhoan.vai_tros)).filter(
        TaiKhoan.ten_dang_nhap == form_data.username).first()

    if not user:
        raise HTTPException(status_code=401, detail="Tài khoản không tồn tại!")

    if user.trang_thai != 'ACTIVE':
        raise HTTPException(status_code=403, detail="Tài khoản đã bị khóa!")

    mat_khau_dung = pwd_context.verify(form_data.password, user.mat_khau_hash)
    if not mat_khau_dung:
        raise HTTPException(
            status_code=401, detail="Mật khẩu không chính xác!")

    thoi_gian_het_han = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    thong_tin_luu_trong_the = {
        "sub": user.ten_dang_nhap,
        "id": user.id,
        "exp": thoi_gian_het_han
    }
    access_token = jwt.encode(thong_tin_luu_trong_the,
                              SECRET_KEY, algorithm=ALGORITHM)

    # ĐÃ SỬA: Trích xuất các quyền (VD: ['ADMIN', 'VAN_THU'])
    danh_sach_vai_tro = [
        vt.ma_vai_tro for vt in user.vai_tros] if user.vai_tros else []

    # Bắn trả về cho Frontend kèm theo quyền
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "tai_khoan_id": user.id,
        "ten_dang_nhap": user.ten_dang_nhap,
        "vai_tros": danh_sach_vai_tro
    }


from app.models.auth import CanBo  # Nhớ đảm bảo đầu file hoặc ở đây đã import CanBo để liên kết bảng
from app.dependencies import lay_nguoi_dung_hien_tai  # Dependency lấy tài khoản từ token 
from pydantic import BaseModel

# Khai báo cấu trúc dữ liệu Frontend gửi lên khi đổi mật khẩu
class DoiMatKhauRequest(BaseModel):
    mat_khau_cu: str
    mat_khau_moi: str

# 1. API lấy thông tin chi tiết của người đang đăng nhập (Frontend cần dùng khi tải lại trang)
@router.get("/me")
def lay_thong_tin_ca_nhan(current_user: TaiKhoan = Depends(lay_nguoi_dung_hien_tai), db: Session = Depends(get_db)):
    ho_ten_can_bo = None
    chuc_vu = None
    
    # Kiểm tra nếu tài khoản này có gắn liền với một Cán bộ trong cơ quan
    if current_user.can_bo_id:
        can_bo = db.query(CanBo).filter(CanBo.id == current_user.can_bo_id).first()
        if can_bo:
            ho_ten_can_bo = can_bo.ho_ten
            chuc_vu = can_bo.chuc_vu

    # Lấy danh sách các mã vai trò của tài khoản này (ví dụ: ['ADMIN', 'VAN_THU'])
    roles = [role.ma_vai_tro for role in current_user.vai_tros]

    return {
        "id": current_user.id,
        "ten_dang_nhap": current_user.ten_dang_nhap,
        "ho_ten": ho_ten_can_bo,
        "chuc_vu": chuc_vu,
        "roles": roles,
        "trang_thai": current_user.trang_thai
    }

# 2. API Đổi mật khẩu tài khoản
@router.put("/change-password")
def doi_mat_khau(data: DoiMatKhauRequest, current_user: TaiKhoan = Depends(lay_nguoi_dung_hien_tai), db: Session = Depends(get_db)):
    # Xác minh mật khẩu cũ có đúng với hash trong database không
    if not pwd_context.verify(data.mat_khau_cu, current_user.mat_khau_hash):
        raise HTTPException(status_code=400, detail="Mật khẩu cũ không chính xác!")
    
    # Băm mật khẩu mới và cập nhật thời gian sửa đổi
    current_user.mat_khau_hash = pwd_context.hash(data.mat_khau_moi)
    current_user.ngay_cap_nhat = datetime.utcnow()
    
    db.commit()
    return {"message": "Đổi mật khẩu thành công!"}
