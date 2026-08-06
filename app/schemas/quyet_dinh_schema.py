from datetime import date, datetime
from typing import Optional, List

from pydantic import BaseModel


class ThanhPhanQuyetDinhBase(BaseModel):
    ho_ten: str
    ten_don_vi: Optional[str] = None
    chuc_vu: Optional[str] = None
    vai_tro_quyet_dinh_id: int
    noi_dung_lien_quan: Optional[str] = None
    thu_tu: Optional[int] = 1
    ghi_chu: Optional[str] = None


class ThanhPhanQuyetDinhCreate(ThanhPhanQuyetDinhBase):
    can_bo_id: Optional[int] = None


class ThanhPhanQuyetDinhResponse(ThanhPhanQuyetDinhBase):
    id: int

    class Config:
        from_attributes = True


class QuyetDinhBase(BaseModel):
    van_ban_di_id: int
    loai_quyet_dinh_id: int
    ngay_hieu_luc: Optional[date] = None
    trang_thai: Optional[str] = "DRAFT"


class QuyetDinhCreate(QuyetDinhBase):
    nguoi_tao_id: Optional[int] = None
    thanh_phan: Optional[List[ThanhPhanQuyetDinhCreate]] = []


class QuyetDinhResponse(QuyetDinhBase):
    id: int
    nguoi_tao_id: int
    nguoi_duyet_id: Optional[int] = None
    ngay_trinh_duyet: Optional[datetime] = None
    ngay_duyet: Optional[datetime] = None
    ly_do_tu_choi: Optional[str] = None
    ngay_tao: datetime
    ngay_cap_nhat: datetime
    thanh_phan: List[ThanhPhanQuyetDinhResponse] = []

    class Config:
        from_attributes = True
