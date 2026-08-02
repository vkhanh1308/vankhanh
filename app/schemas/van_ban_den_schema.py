from datetime import date
from typing import Optional, List

from pydantic import BaseModel, Field, model_validator

from app.schemas.tep_dinh_kem_schema import TepDinhKemResponse


class VanBanDenBase(BaseModel):
    so_den: int = Field(gt=0)
    ky_hieu: Optional[str] = None
    ngay_den: date
    ngay_ban_hanh: Optional[date] = None
    co_quan_ban_hanh_id: Optional[int] = None
    ma_loai_vb_id: int
    trich_yeu: str
    ngon_ngu: Optional[str] = "Tiếng Việt"
    so_trang: Optional[int] = Field(default=None, ge=0)
    ho_ten_nguoi_ky: Optional[str] = None
    chuc_vu_nguoi_ky: Optional[str] = None
    linh_vuc: Optional[str] = None
    do_khan: Optional[int] = Field(default=None, ge=1, le=5)
    don_vi_nhan: Optional[str] = None
    han_giai_quyet: Optional[date] = None
    y_kien_chi_dao: Optional[str] = None
    trang_thai_xu_ly: Optional[str] = "CHO_XU_LY"
    stt_trong_ho_so: Optional[int] = None
    ma_ho_so: Optional[str] = None

    @model_validator(mode='after')
    def validate_deadline(self):
        if self.han_giai_quyet and self.ngay_den and self.han_giai_quyet < self.ngay_den:
            raise ValueError("Hạn giải quyết không được trước Ngày đến")
        return self


class VanBanDenCreate(VanBanDenBase):
    pass


class VanBanDenUpdate(BaseModel):
    so_den: Optional[int] = Field(default=None, gt=0)
    ky_hieu: Optional[str] = None
    ngay_den: Optional[date] = None
    ngay_ban_hanh: Optional[date] = None
    co_quan_ban_hanh_id: Optional[int] = None
    ma_loai_vb_id: Optional[int] = None
    trich_yeu: Optional[str] = None
    ngon_ngu: Optional[str] = None
    so_trang: Optional[int] = Field(default=None, ge=0)
    ho_ten_nguoi_ky: Optional[str] = None
    chuc_vu_nguoi_ky: Optional[str] = None
    linh_vuc: Optional[str] = None
    do_khan: Optional[int] = Field(default=None, ge=1, le=5)
    don_vi_nhan: Optional[str] = None
    han_giai_quyet: Optional[date] = None
    y_kien_chi_dao: Optional[str] = None
    trang_thai_xu_ly: Optional[str] = None
    stt_trong_ho_so: Optional[int] = None
    ma_ho_so: Optional[str] = None

    @model_validator(mode='after')
    def validate_deadline(self):
        if self.han_giai_quyet and self.ngay_den and self.han_giai_quyet < self.ngay_den:
            raise ValueError("Hạn giải quyết không được trước Ngày đến")
        return self


class FileDinhKemResponse(BaseModel):
    id: int
    ten_file: str
    duong_dan: str

    class Config:
        from_attributes = True


class VanBanDenResponse(VanBanDenBase):
    id: int
    nguoi_xu_ly_id: Optional[int] = None
    tep_dinh_kems: List[TepDinhKemResponse] = []

    class Config:
        from_attributes = True


class PhanPhoiInput(BaseModel):
    nguoi_xu_ly_id: int


class TienDoInput(BaseModel):
    trang_thai_xu_ly: str
