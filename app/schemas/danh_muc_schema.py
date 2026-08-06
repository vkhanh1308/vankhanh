from pydantic import BaseModel
from typing import Optional


class DanhMucCreate(BaseModel):
    ten_loai_vb: str
    mo_ta: Optional[str] = None


class DanhMucResponse(BaseModel):
    id: int
    ten_loai_vb: str
    mo_ta: Optional[str]

    class Config:
        from_attributes = True

class DanhMucUpdate(DanhMucCreate):
    pass

class DanhMucVaiTroQuyetDinhResponse(BaseModel):
    id: int
    ma_vai_tro: str
    ten_vai_tro: str
    mo_ta: Optional[str]

    class Config:
        from_attributes = True
