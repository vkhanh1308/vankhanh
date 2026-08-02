from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class VaiTroResponse(BaseModel):
    id: int
    ma_vai_tro: str
    ten_vai_tro: str

    class Config:
        from_attributes = True


class TaiKhoanCreate(BaseModel):
    ten_dang_nhap: str
    mat_khau: str
    can_bo_id: Optional[int] = None
    trang_thai: Optional[str] = "ACTIVE"
    # <--- Trường này rất quan trọng để nhận quyền từ form
    vai_tro_ids: List[int] = []


class TaiKhoanResponse(BaseModel):
    id: int
    ten_dang_nhap: str
    can_bo_id: Optional[int]
    trang_thai: str
    ngay_tao: datetime
    # <--- Trường này để Backend gửi quyền ra Frontend
    vai_tros: List[VaiTroResponse] = []

    class Config:
        from_attributes = True
