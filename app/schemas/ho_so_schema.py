from datetime import date
from typing import Optional

from pydantic import BaseModel, Field, model_validator


class HoSoCreate(BaseModel):
    ma_ho_so: str
    tieu_de_ho_so: str
    file_catalog: Optional[int] = None
    file_notation: Optional[str] = None
    trang_thai: Optional[str] = "DANG_MO"
    thoi_han_bao_quan: Optional[str] = None
    che_do_su_dung: Optional[str] = None
    ngay_bat_dau: Optional[date] = None
    ngay_ket_thuc: Optional[date] = None
    so_luong_trang: Optional[int] = Field(default=0, ge=0)
    so_luong_van_ban: Optional[int] = Field(default=0, ge=0)
    nguoi_lap: Optional[str] = None
    ngon_ngu: Optional[str] = "Tiếng Việt"
    ghi_chu: Optional[str] = None
    vi_tri_id: Optional[int] = None

    @model_validator(mode='after')
    def validate_date_range(self):
        if self.ngay_bat_dau and self.ngay_ket_thuc and self.ngay_ket_thuc < self.ngay_bat_dau:
            raise ValueError("Ngày kết thúc phải cùng hoặc sau ngày bắt đầu")
        return self


class HoSoUpdate(BaseModel):
    tieu_de_ho_so: Optional[str] = None
    file_catalog: Optional[int] = None
    file_notation: Optional[str] = None
    trang_thai: Optional[str] = None
    thoi_han_bao_quan: Optional[str] = None
    che_do_su_dung: Optional[str] = None
    ngay_bat_dau: Optional[date] = None
    ngay_ket_thuc: Optional[date] = None
    so_luong_trang: Optional[int] = Field(default=None, ge=0)
    so_luong_van_ban: Optional[int] = Field(default=None, ge=0)
    nguoi_lap: Optional[str] = None
    ngon_ngu: Optional[str] = None
    ghi_chu: Optional[str] = None
    vi_tri_id: Optional[int] = None

    @model_validator(mode='after')
    def validate_date_range(self):
        if self.ngay_bat_dau and self.ngay_ket_thuc and self.ngay_ket_thuc < self.ngay_bat_dau:
            raise ValueError("Ngày kết thúc phải cùng hoặc sau ngày bắt đầu")
        return self


class HoSoResponse(BaseModel):
    ma_ho_so: str
    tieu_de_ho_so: str
    file_catalog: Optional[int] = None
    file_notation: Optional[str] = None
    trang_thai: Optional[str] = "DANG_MO"
    thoi_han_bao_quan: Optional[str] = None
    che_do_su_dung: Optional[str] = None
    ngay_bat_dau: Optional[date] = None
    ngay_ket_thuc: Optional[date] = None
    so_luong_trang: Optional[int] = None
    so_luong_van_ban: Optional[int] = None
    nguoi_lap: Optional[str] = None
    ngon_ngu: Optional[str] = None
    ghi_chu: Optional[str] = None
    vi_tri_id: Optional[int] = None

    class Config:
        from_attributes = True
