from pydantic import BaseModel, Field, model_validator
from typing import Optional, List, Literal
from datetime import date, datetime


class FileDinhKemResponse(BaseModel):
    id: int
    loai_van_ban: str
    van_ban_id: int
    ten_file: str
    duong_dan: str
    dinh_dang: Optional[str] = None
    dung_luong: Optional[float] = None

    class Config:
        from_attributes = True


class VanBanDiCreate(BaseModel):
    so_ky_hieu: Optional[str] = None
    ngay_ban_hanh: Optional[date] = None
    trich_yeu: str
    don_vi_soan_thao_id: int
    ma_loai_vb_id: int
    ngon_ngu: Optional[str] = "Tiếng Việt"
    so_trang: Optional[int] = Field(default=None, ge=0)
    ghi_chu: Optional[str] = None
    nguoi_ky_id: Optional[int] = None
    chuc_vu_nguoi_ky: Optional[str] = None
    noi_nhan: Optional[str] = None
    muc_do_khan: Optional[int] = Field(default=None, ge=1, le=5)
    trang_thai: Optional[Literal['DRAFT', 'PENDING_APPROVAL',
                                 'APPROVED', 'PUBLISHED', 'REVOKED']] = "DRAFT"
    han_tra_loi: Optional[date] = None
    stt_trong_ho_so: Optional[int] = None
    ma_ho_so: Optional[str] = None
    so_luong_ban_phat_hanh: Optional[int] = Field(default=None, ge=0)

    @model_validator(mode='after')
    def validate_deadline(self):
        if self.han_tra_loi and self.ngay_ban_hanh and self.han_tra_loi < self.ngay_ban_hanh:
            raise ValueError("Hạn trả lời không được trước Ngày ban hành")
        return self


class VanBanDiResponse(BaseModel):
    id: int
    so_ky_hieu: Optional[str] = None
    ngay_ban_hanh: Optional[date] = None
    trich_yeu: str
    don_vi_soan_thao_id: int
    ma_loai_vb_id: int
    ngon_ngu: Optional[str] = None
    so_trang: Optional[int] = None
    ghi_chu: Optional[str] = None
    nguoi_ky_id: Optional[int] = None
    chuc_vu_nguoi_ky: Optional[str] = None
    noi_nhan: Optional[str] = None
    muc_do_khan: Optional[int] = None
    han_tra_loi: Optional[date] = None
    stt_trong_ho_so: Optional[int] = None
    ma_ho_so: Optional[str] = None
    trang_thai: Optional[Literal['DRAFT', 'PENDING_APPROVAL',
                                 'APPROVED', 'PUBLISHED', 'REVOKED']] = None
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    submitted_at: Optional[datetime] = None
    revoke_reason: Optional[str] = None
    tep_dinh_kems: List[FileDinhKemResponse] = []
    so_luong_ban_phat_hanh: Optional[int] = None

    class Config:
        from_attributes = True


class TrangThaiUpdate(BaseModel):
    trang_thai: str

    class Config:
        from_attributes = True


class ReasonRequest(BaseModel):
    reason: str

    class Config:
        from_attributes = True
