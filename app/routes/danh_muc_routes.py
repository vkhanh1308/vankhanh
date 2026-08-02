from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from config.database import get_db

from app.models.core import DanhMucLoaiVb
from app.schemas.danh_muc_schema import DanhMucCreate, DanhMucResponse
from app.dependencies import lay_nguoi_dung_hien_tai
from app.models.auth import TaiKhoan

router = APIRouter(
    prefix="/api/danh-muc",
    tags=["Quản lý Danh mục"]
)


@router.post("/", response_model=DanhMucResponse)
def tao_danh_muc(
    danh_muc: DanhMucCreate,
    db: Session = Depends(get_db),
    nguoi_dung: TaiKhoan = Depends(lay_nguoi_dung_hien_tai)
):
    kiem_tra = db.query(DanhMucLoaiVb).filter(
        DanhMucLoaiVb.ten_loai_vb == danh_muc.ten_loai_vb).first()
    if kiem_tra:
        raise HTTPException(
            status_code=400, detail="Tên loại văn bản đã tồn tại!")

    danh_muc_moi = DanhMucLoaiVb(**danh_muc.model_dump())
    db.add(danh_muc_moi)
    db.commit()
    db.refresh(danh_muc_moi)
    return danh_muc_moi


@router.get("/", response_model=list[DanhMucResponse])
def lay_danh_sach_danh_muc(
    db: Session = Depends(get_db),
    nguoi_dung: TaiKhoan = Depends(lay_nguoi_dung_hien_tai)
):
    return db.query(DanhMucLoaiVb).all()

from app.schemas.danh_muc_schema import DanhMucUpdate  # Đảm bảo có khai báo schema này nếu cần

# 1. API Lấy thông tin chi tiết của 1 danh mục loại văn bản theo ID
@router.get("/{id}", response_model=DanhMucResponse)
def lay_chi_tiet_danh_muc(id: int, db: Session = Depends(get_db)):
    danh_muc = db.query(DanhMucLoaiVb).filter(DanhMucLoaiVb.id == id).first()
    if not danh_muc:
        raise HTTPException(status_code=404, detail="Không tìm thấy danh mục loại văn bản này!")
    return danh_muc

# 2. API Cập nhật/Sửa đổi tên hoặc mô tả loại văn bản
@router.put("/{id}", response_model=DanhMucResponse)
def cap_nhat_danh_muc(
    id: int,
    danh_muc_update: DanhMucUpdate,
    db: Session = Depends(get_db),
    nguoi_dung: TaiKhoan = Depends(lay_nguoi_dung_hien_tai)
):
    danh_muc = db.query(DanhMucLoaiVb).filter(DanhMucLoaiVb.id == id).first()
    if not danh_muc:
        raise HTTPException(status_code=404, detail="Không tìm thấy danh mục để cập nhật!")
    
    # Kiểm tra xem tên loại văn bản mới có bị trùng với loại khác đã tồn tại không
    if danh_muc_update.ten_loai_vb != danh_muc.ten_loai_vb:
        kiem_tra_trung = db.query(DanhMucLoaiVb).filter(DanhMucLoaiVb.ten_loai_vb == danh_muc_update.ten_loai_vb).first()
        if kiem_tra_trung:
            raise HTTPException(status_code=400, detail="Tên loại văn bản mới này đã tồn tại ở danh mục khác!")

    # Cập nhật thông tin khớp với Model
    danh_muc.ten_loai_vb = danh_muc_update.ten_loai_vb
    danh_muc.mo_ta = danh_muc_update.mo_ta
    
    db.commit()
    db.refresh(danh_muc)
    return danh_muc

# 3. API Xóa danh mục loại văn bản (Chỉ xóa được khi chưa có văn bản nào sử dụng loại này)
@router.delete("/{id}")
def xoa_danh_muc(
    id: int,
    db: Session = Depends(get_db),
    nguoi_dung: TaiKhoan = Depends(lay_nguoi_dung_hien_tai)
):
    danh_muc = db.query(DanhMucLoaiVb).filter(DanhMucLoaiVb.id == id).first()
    if not danh_muc:
        raise HTTPException(status_code=404, detail="Không tìm thấy danh mục để xóa!")
    
    try:
        db.delete(danh_muc)
        db.commit()
        return {"message": "Xóa danh mục loại văn bản thành công!"}
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=400, 
            detail="Không thể xóa danh mục này do đã có dữ liệu Văn Bản Đến hoặc Văn Bản Đi liên kết dữ liệu khóa ngoại!"
        )