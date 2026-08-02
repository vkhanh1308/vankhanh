from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session, joinedload  # <--- Bổ sung joinedload
import jwt
from config.database import get_db
from app.models.auth import TaiKhoan
from typing import List

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

SECRET_KEY = "DMS_CHIA_KHOA_BI_MAT_CUA_NHUT_CUC_KY_AN_TOAN_2026"
ALGORITHM = "HS256"


def lay_nguoi_dung_hien_tai(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    loi_xac_thuc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Không thể xác thực thông tin (Token không hợp lệ hoặc đã hết hạn)",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        ten_dang_nhap: str = payload.get("sub")
        if ten_dang_nhap is None:
            raise loi_xac_thuc
    except jwt.PyJWTError:
        raise loi_xac_thuc

    # ĐÃ SỬA: Thêm joinedload(TaiKhoan.vai_tros) để nạp sẵn quyền vào bộ nhớ
    user = db.query(TaiKhoan).options(joinedload(TaiKhoan.vai_tros)).filter(
        TaiKhoan.ten_dang_nhap == ten_dang_nhap).first()

    if user is None or user.trang_thai != 'ACTIVE':
        raise loi_xac_thuc

    return user


def require_roles(allowed_roles: List[str]):
    def role_checker(current_user: TaiKhoan = Depends(lay_nguoi_dung_hien_tai)):
        user_roles = [vt.ma_vai_tro for vt in current_user.vai_tros]
        if not any(role in allowed_roles for role in user_roles):
            # In ra lỗi chi tiết để debug
            raise HTTPException(
                status_code=403,
                detail=f"Quyền của bạn là {user_roles}, nhưng chức năng này yêu cầu {allowed_roles}"
            )
        return current_user
    return role_checker
