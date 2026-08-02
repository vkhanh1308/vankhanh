from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.orm import Session
from config.database import get_db

# Import model từ file core mới
from app.models.core import CoQuanToChuc
from app.schemas.co_quan_schema import CoQuanCreate, CoQuanResponse

# Gắn thêm bảo vệ
from app.dependencies import lay_nguoi_dung_hien_tai, require_roles
from app.models.auth import TaiKhoan

router = APIRouter(
    prefix="/api/co-quan",
    tags=["Quản lý Cơ quan"]
)


@router.post("/", response_model=CoQuanResponse)
def tao_co_quan(
    co_quan: CoQuanCreate,
    db: Session = Depends(get_db),
    nguoi_dung: TaiKhoan = Depends(require_roles(["ADMIN", "VAN_THU"]))
):
    kiem_tra = db.query(CoQuanToChuc).filter(
        CoQuanToChuc.organ_id == co_quan.organ_id).first()
    if kiem_tra:
        raise HTTPException(
            status_code=400, detail="Mã định danh (organ_id) đã tồn tại!")

    co_quan_moi = CoQuanToChuc(**co_quan.model_dump())
    db.add(co_quan_moi)
    db.commit()
    db.refresh(co_quan_moi)
    return co_quan_moi


@router.get("/", response_model=list[CoQuanResponse])
def lay_danh_sach_co_quan(db: Session = Depends(get_db)):
    return db.query(CoQuanToChuc).all()


from app.schemas.co_quan_schema import CoQuanUpdate  # Đảm bảo có khai báo schema này nếu cần

# 1. API Lấy thông tin chi tiết của 1 Cơ quan theo ID
@router.get("/{id}", response_model=CoQuanResponse)
def lay_chi_tiet_co_quan(id: int, db: Session = Depends(get_db)):
    co_quan = db.query(CoQuanToChuc).filter(CoQuanToChuc.id == id).first()
    if not co_quan:
        raise HTTPException(status_code=404, detail="Không tìm thấy cơ quan này!")
    return co_quan

# 2. API Cập nhật sửa đổi thông tin Cơ quan
@router.put("/{id}", response_model=CoQuanResponse)
def cap_nhat_co_quan(
    id: int,
    co_quan_update: CoQuanUpdate,
    db: Session = Depends(get_db),
    nguoi_dung: TaiKhoan = Depends(lay_nguoi_dung_hien_tai)
):
    co_quan = db.query(CoQuanToChuc).filter(CoQuanToChuc.id == id).first()
    if not co_quan:
        raise HTTPException(status_code=404, detail="Không tìm thấy cơ quan để cập nhật!")
    
    # Kiểm tra xem nếu thay đổi organ_id thì có bị trùng với cơ quan khác không
    if co_quan_update.organ_id != co_quan.organ_id:
        kiem_tra_trung = db.query(CoQuanToChuc).filter(CoQuanToChuc.organ_id == co_quan_update.organ_id).first()
        if kiem_tra_trung:
            raise HTTPException(status_code=400, detail="Mã định danh (organ_id) mới đã bị trùng!")

    # Cập nhật các trường dữ liệu khớp với Model
    co_quan.ten_co_quan = co_quan_update.ten_co_quan
    co_quan.organ_id = co_quan_update.organ_id
    co_quan.dia_chi = co_quan_update.dia_chi
    
    db.commit()
    db.refresh(co_quan)
    return co_quan

# 3. API Xóa cơ quan (Chỉ cho phép xóa khi chưa có cán bộ hay văn bản nào thuộc cơ quan này)
@router.delete("/{id}")
def xoa_co_quan(
    id: int,
    db: Session = Depends(get_db),
    nguoi_dung: TaiKhoan = Depends(lay_nguoi_dung_hien_tai)
):
    co_quan = db.query(CoQuanToChuc).filter(CoQuanToChuc.id == id).first()
    if not co_quan:
        raise HTTPException(status_code=404, detail="Không tìm thấy cơ quan để xóa!")
    
    try:
        db.delete(co_quan)
        db.commit()
        return {"message": "Xóa cơ quan thành công!"}
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=400, 
            detail="Không thể xóa cơ quan này vì đang có dữ liệu Cán bộ hoặc Văn bản liên kết dữ liệu khóa ngoại!"
        )
    return db.query(CoQuanToChuc).order_by(CoQuanToChuc.id.desc()).all()


@router.put("/{id}", response_model=CoQuanResponse)
def cap_nhat_co_quan(
    id: int,
    co_quan: CoQuanCreate,
    db: Session = Depends(get_db),
    nguoi_dung: TaiKhoan = Depends(require_roles(["ADMIN", "VAN_THU"]))
):
    co_quan_hien_tai = db.query(CoQuanToChuc).filter(
        CoQuanToChuc.id == id).first()
    if not co_quan_hien_tai:
        raise HTTPException(status_code=404, detail="Không tìm thấy cơ quan")

    existing = db.query(CoQuanToChuc).filter(
        CoQuanToChuc.organ_id == co_quan.organ_id, CoQuanToChuc.id != id).first()
    if existing:
        raise HTTPException(
            status_code=400, detail="Mã định danh (organ_id) đã tồn tại!")

    co_quan_hien_tai.ten_co_quan = co_quan.ten_co_quan
    co_quan_hien_tai.organ_id = co_quan.organ_id
    co_quan_hien_tai.dia_chi = co_quan.dia_chi

    db.commit()
    db.refresh(co_quan_hien_tai)
    return co_quan_hien_tai


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def xoa_co_quan(
    id: int,
    db: Session = Depends(get_db),
    nguoi_dung: TaiKhoan = Depends(require_roles(["ADMIN", "VAN_THU"]))
):
    co_quan = db.query(CoQuanToChuc).filter(CoQuanToChuc.id == id).first()
    if not co_quan:
        raise HTTPException(status_code=404, detail="Không tìm thấy cơ quan")

    db.delete(co_quan)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
