from sqlalchemy import Column, Integer, String, Text, Date, ForeignKey, Float, DateTime
from sqlalchemy.orm import relationship
from config.database import Base
from datetime import datetime


class VanBanDen(Base):
    __tablename__ = "van_ban_den"
    id = Column(Integer, primary_key=True, index=True)
    so_den = Column(Integer, nullable=False)
    ky_hieu = Column(String(100))
    ngay_den = Column(Date, nullable=False)
    ngay_ban_hanh = Column(Date)
    co_quan_ban_hanh_id = Column(Integer, ForeignKey(
        "co_quan_to_chuc.id", ondelete="SET NULL"))
    ma_loai_vb_id = Column(Integer, ForeignKey(
        "danh_muc_loai_vb.id", ondelete="RESTRICT"), nullable=False)
    trich_yeu = Column(Text, nullable=False)
    ngon_ngu = Column(String(30))
    so_trang = Column(Integer)
    trang_thai_xu_ly = Column(String(50), default="CHO_XU_LY")
    ho_ten_nguoi_ky = Column(String(50))
    nguoi_xu_ly_id = Column(Integer, ForeignKey(
        "can_bo.id", ondelete="SET NULL"))
    chuc_vu_nguoi_ky = Column(String(100))
    linh_vuc = Column(Text)
    do_khan = Column(Integer)
    don_vi_nhan = Column(Text)
    han_giai_quyet = Column(Date)
    y_kien_chi_dao = Column(Text)
    stt_trong_ho_so = Column(Integer)
    ma_ho_so = Column(String(50), ForeignKey(
        "ho_so.ma_ho_so", ondelete="SET NULL"))
    tep_dinh_kems = relationship(
        "FileDinhKem",
        primaryjoin="and_(VanBanDen.id == foreign(FileDinhKem.van_ban_id), FileDinhKem.loai_van_ban == 'VAN_BAN_DEN')",
        viewonly=True
    )


class VanBanDi(Base):
    __tablename__ = "van_ban_di"
    id = Column(Integer, primary_key=True, index=True)
    so_ky_hieu = Column(String(50))
    ngay_ban_hanh = Column(Date)
    trich_yeu = Column(Text, nullable=False)
    don_vi_soan_thao_id = Column(Integer, ForeignKey(
        "co_quan_to_chuc.id", ondelete="RESTRICT"), nullable=False)
    ma_loai_vb_id = Column(Integer, ForeignKey(
        "danh_muc_loai_vb.id", ondelete="RESTRICT"), nullable=False)
    ngon_ngu = Column(String(30))
    so_trang = Column(Integer)
    trang_thai = Column(String(50), default="DRAFT")
    submitted_at = Column(DateTime, nullable=True)
    approved_by = Column(String(100), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    revoke_reason = Column(Text, nullable=True)
    ghi_chu = Column(Text)
    nguoi_ky_id = Column(Integer, ForeignKey("can_bo.id", ondelete="SET NULL"))
    chuc_vu_nguoi_ky = Column(String(100))
    noi_nhan = Column(String(100))
    muc_do_khan = Column(Integer)
    han_tra_loi = Column(Date)
    stt_trong_ho_so = Column(Integer)
    ma_ho_so = Column(String(50), ForeignKey(
        "ho_so.ma_ho_so", ondelete="SET NULL"))
    so_luong_ban_phat_hanh = Column(Integer, nullable=True)
    tep_dinh_kems = relationship(
        "FileDinhKem",
        primaryjoin="and_(VanBanDi.id == foreign(FileDinhKem.van_ban_id), FileDinhKem.loai_van_ban == 'VAN_BAN_DI')",
        viewonly=True
    )


class NoiNhanVanBan(Base):
    __tablename__ = "noi_nhan_van_ban"
    id = Column(Integer, primary_key=True, index=True)
    van_ban_di_id = Column(Integer, ForeignKey(
        "van_ban_di.id", ondelete="CASCADE"), nullable=False)
    co_quan_nhan_id = Column(Integer, ForeignKey(
        "co_quan_to_chuc.id", ondelete="RESTRICT"), nullable=False)
    phuong_thuc_gui = Column(String(100))


class FileDinhKem(Base):
    __tablename__ = "file_dinh_kem"
    id = Column(Integer, primary_key=True, index=True)
    # 'VAN_BAN_DEN' hoặc 'VAN_BAN_DI'
    loai_van_ban = Column(String(20), nullable=False)

    # BỎ ForeignKey ở đây đi, chỉ giữ lại Integer để lưu ID tự do
    van_ban_id = Column(Integer, index=True, nullable=False)

    ten_file = Column(String(255), nullable=False)
    duong_dan = Column(String(500), nullable=False)
    dinh_dang = Column(String(10))
    dung_luong = Column(Float)
    ngay_tao = Column(DateTime, default=datetime.utcnow, nullable=False)


class OCRJob(Base):
    __tablename__ = "ocr_job"
    id = Column(Integer, primary_key=True, index=True)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    status = Column(String(30), nullable=False, default="PENDING")
    loai_van_ban = Column(String(20), nullable=True)
    van_ban_id = Column(Integer, nullable=True)
    full_text = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    processed_at = Column(DateTime, nullable=True)
    extracted_items = relationship("OCRExtractedItem", back_populates="job", order_by="OCRExtractedItem.order", lazy='select')


class OCRExtractedItem(Base):
    __tablename__ = "ocr_extracted_item"
    id = Column(Integer, primary_key=True, index=True)
    ocr_job_id = Column(Integer, ForeignKey("ocr_job.id", ondelete="CASCADE"), nullable=False)
    label = Column(String(150), nullable=False)
    text = Column(Text, nullable=False)
    confidence = Column(Float, nullable=False)
    x1 = Column(Integer, nullable=False)
    y1 = Column(Integer, nullable=False)
    x2 = Column(Integer, nullable=False)
    y2 = Column(Integer, nullable=False)
    order = Column(Integer, nullable=False, default=1)

    job = relationship("OCRJob", back_populates="extracted_items")


class DanhMucLoaiQuyetDinh(Base):
    __tablename__ = "danh_muc_loai_quyet_dinh"
    id = Column(Integer, primary_key=True, index=True)
    ma_loai_quyet_dinh = Column(String(50), unique=True, nullable=False)
    ten_loai_quyet_dinh = Column(String(150), nullable=False)
    mo_ta = Column(Text)


class DanhMucVaiTroQuyetDinh(Base):
    __tablename__ = "danh_muc_vai_tro_quyet_dinh"
    id = Column(Integer, primary_key=True, index=True)
    ma_vai_tro = Column(String(50), unique=True, nullable=False)
    ten_vai_tro = Column(String(150), nullable=False)
    mo_ta = Column(Text)


class QuyetDinh(Base):
    __tablename__ = "quyet_dinh"
    id = Column(Integer, primary_key=True, index=True)
    van_ban_di_id = Column(Integer, ForeignKey(
        "van_ban_di.id", ondelete="RESTRICT"), unique=True, nullable=False)
    loai_quyet_dinh_id = Column(Integer, ForeignKey(
        "danh_muc_loai_quyet_dinh.id", ondelete="RESTRICT"), nullable=False)
    ngay_hieu_luc = Column(Date)
    trang_thai = Column(String(20), default="DRAFT", nullable=False)
    nguoi_tao_id = Column(Integer, ForeignKey(
        "tai_khoan.id", ondelete="RESTRICT"), nullable=False)
    nguoi_duyet_id = Column(Integer, ForeignKey(
        "tai_khoan.id", ondelete="SET NULL"))
    ngay_trinh_duyet = Column(DateTime)
    ngay_duyet = Column(DateTime)
    ly_do_tu_choi = Column(Text)
    ngay_tao = Column(DateTime, default=datetime.utcnow, nullable=False)
    ngay_cap_nhat = Column(DateTime, default=datetime.utcnow,
                           onupdate=datetime.utcnow, nullable=False)
    # Relationship to pull participant snapshots when returning a decision
    thanh_phan = relationship("ThanhPhanQuyetDinh", backref="quyet_dinh", order_by="ThanhPhanQuyetDinh.thu_tu", lazy='select')


class ThanhPhanQuyetDinh(Base):
    __tablename__ = "thanh_phan_quyet_dinh"
    id = Column(Integer, primary_key=True, index=True)
    quyet_dinh_id = Column(Integer, ForeignKey(
        "quyet_dinh.id", ondelete="CASCADE"), nullable=False)

    # Có thể chọn cán bộ đã có trong hệ thống
    can_bo_id = Column(Integer, ForeignKey(
        "can_bo.id", ondelete="SET NULL"))

    # Snapshot fields stored on the decision (to keep historical record)
    ho_ten = Column(String(100), nullable=False)
    don_vi_id = Column(Integer, ForeignKey(
        "co_quan_to_chuc.id", ondelete="SET NULL"))
    ten_don_vi = Column(String(255))
    chuc_vu = Column(String(100))

    # Vai trò trong quyết định (tham chiếu tới bảng danh_muc_vai_tro_quyet_dinh)
    vai_tro_quyet_dinh_id = Column(Integer, ForeignKey(
        "danh_muc_vai_tro_quyet_dinh.id", ondelete="RESTRICT"), nullable=False)
    noi_dung_lien_quan = Column(Text)
    thu_tu = Column(Integer, default=1, nullable=False)
    ghi_chu = Column(Text)


class LichSuQuyetDinh(Base):
    __tablename__ = "lich_su_quyet_dinh"
    id = Column(Integer, primary_key=True, index=True)
    quyet_dinh_id = Column(Integer, ForeignKey(
        "quyet_dinh.id", ondelete="CASCADE"), nullable=False)
    trang_thai_cu = Column(String(20))
    trang_thai_moi = Column(String(20), nullable=False)
    hanh_dong = Column(String(50), nullable=False)
    noi_dung_y_kien = Column(Text)
    nguoi_thuc_hien_id = Column(Integer, ForeignKey(
        "tai_khoan.id", ondelete="SET NULL"))
    thoi_gian = Column(DateTime, default=datetime.utcnow, nullable=False)
