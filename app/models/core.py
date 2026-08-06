from sqlalchemy import Column, Integer, String, Text, Date, ForeignKey, Float, DateTime
from config.database import Base
from datetime import datetime


class DanhMucLoaiVb(Base):
    __tablename__ = "danh_muc_loai_vb"
    id = Column(Integer, primary_key=True, index=True)
    ten_loai_vb = Column(String(100), unique=True, nullable=False)
    mo_ta = Column(Text)


class CoQuanToChuc(Base):
    __tablename__ = "co_quan_to_chuc"
    id = Column(Integer, primary_key=True, index=True)
    ten_co_quan = Column(String(255), nullable=False)
    organ_id = Column(String(13), unique=True, nullable=False)
    dia_chi = Column(String(500))


class ViTriLuuTru(Base):
    __tablename__ = "vi_tri_luu_tru"
    id = Column(Integer, primary_key=True, index=True)
    toa_nha = Column(String(255))
    phong = Column(String(100))
    ke_tu = Column(String(100))
    ngan_tang = Column(String(100))
    so_hop = Column(String(100))
    ghi_chu = Column(Text)


class HoSo(Base):
    __tablename__ = "ho_so"
    ma_ho_so = Column(String(50), primary_key=True)
    tieu_de_ho_so = Column(String(500), nullable=False)

    # --- THÊM 2 DÒNG NÀY VÀO ---
    file_catalog = Column(Integer, nullable=True)
    file_notation = Column(String(50), nullable=True)
    # ---------------------------
    trang_thai = Column(String(50), default="DANG_MO")
    thoi_han_bao_quan = Column(String(50))
    che_do_su_dung = Column(String(50))
    ngay_bat_dau = Column(Date)
    ngay_ket_thuc = Column(Date)
    so_luong_trang = Column(Integer, default=0)
    so_luong_van_ban = Column(Integer, default=0)
    nguoi_lap = Column(String(100))
    ngon_ngu = Column(String(50))
    ghi_chu = Column(Text)
    vi_tri_id = Column(Integer, ForeignKey(
        "vi_tri_luu_tru.id", ondelete="SET NULL"))
