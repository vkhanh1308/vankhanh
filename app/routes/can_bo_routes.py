from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.orm import Session
from typing import List
from config.database import get_db
from app.models.auth import CanBo
from app.schemas.can_bo_schema import CanBoCreate, CanBoResponse, CanBoUpdate
from app.dependencies import lay_nguoi_dung_hien_tai, require_roles
from app.models.auth import TaiKhoan

router = APIRouter(
    prefix="/api/can-bo",
    tags=["Quản lý Cán bộ"]
)


@router.get("/", response_model=List[CanBoResponse])
def lay_danh_sach_can_bo(
    db: Session = Depends(get_db),
    nguoi_dung: TaiKhoan = Depends(lay_nguoi_dung_hien_tai)
):
<<<<<<< HEAD
    return db.query(CanBo).all()


from fastapi import HTTPException
from app.schemas.can_bo_schema import CanBoCreate, CanBoUpdate  # Đảm bảo có khai báo các schema này nếu cần
from datetime import datetime

# 1. API Lấy thông tin chi tiết của 1 Cán bộ theo ID
@router.get("/{id}", response_model=CanBoResponse)
def lay_chi_tiet_can_bo(
    id: int, 
    db: Session = Depends(get_db),
    nguoi_dung: TaiKhoan = Depends(lay_nguoi_dung_hien_tai)
):
    can_bo = db.query(CanBo).filter(CanBo.id == id).first()
    if not can_bo:
        raise HTTPException(status_code=404, detail="Không tìm thấy cán bộ này!")
    return can_bo

# 2. API Lọc danh sách cán bộ theo từng cơ quan/phòng ban (Dùng khi phân công văn bản)
@router.get("/co-quan/{co_quan_id}", response_model=List[CanBoResponse])
def lay_can_bo_theo_co_quan(
    co_quan_id: int,
    db: Session = Depends(get_db),
    nguoi_dung: TaiKhoan = Depends(lay_nguoi_dung_hien_tai)
):
    # Lọc cán bộ theo trường co_quan_id khớp với database
    return db.query(CanBo).filter(CanBo.co_quan_id == co_quan_id).all()

# 3. API Thêm mới một Cán bộ
@router.post("/", response_model=CanBoResponse)
def them_can_bo(
    data: CanBoCreate, 
    db: Session = Depends(get_db),
    nguoi_dung: TaiKhoan = Depends(lay_nguoi_dung_hien_tai)
):
    can_bo_moi = CanBo(
        ho_ten=data.ho_ten,
        chuc_vu=data.chuc_vu,
        co_quan_id=data.co_quan_id
    )
    db.add(can_bo_moi)
    db.commit()
    db.refresh(can_bo_moi)
    return can_bo_moi

# 4. API Cập nhật thông tin Cán bộ
@router.put("/{id}", response_model=CanBoResponse)
def cap_nhat_can_bo(
    id: int,
    data: CanBoUpdate,
    db: Session = Depends(get_db),
    nguoi_dung: TaiKhoan = Depends(lay_nguoi_dung_hien_tai)
):
    can_bo = db.query(CanBo).filter(CanBo.id == id).first()
    if not can_bo:
        raise HTTPException(status_code=404, detail="Không tìm thấy cán bộ để cập nhật!")
    
    can_bo.ho_ten = data.ho_ten
    can_bo.chuc_vu = data.chuc_vu
    can_bo.co_quan_id = data.co_quan_id
    
    db.commit()
    db.refresh(can_bo)
    return can_bo
=======
    return db.query(CanBo).order_by(CanBo.id.desc()).all()


@router.post("/", response_model=CanBoResponse, status_code=status.HTTP_201_CREATED)
def tao_can_bo(
    payload: CanBoCreate,
    db: Session = Depends(get_db),
    nguoi_dung: TaiKhoan = Depends(require_roles(["ADMIN", "VAN_THU"]))
):
    can_bo = CanBo(**payload.model_dump())
    db.add(can_bo)
    db.commit()
    db.refresh(can_bo)
    return can_bo


@router.put("/{id}", response_model=CanBoResponse)
def cap_nhat_can_bo(
    id: int,
    payload: CanBoUpdate,
    db: Session = Depends(get_db),
    nguoi_dung: TaiKhoan = Depends(require_roles(["ADMIN", "VAN_THU"]))
):
    can_bo = db.query(CanBo).filter(CanBo.id == id).first()
    if not can_bo:
        raise HTTPException(status_code=404, detail="Không tìm thấy cán bộ")

    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(can_bo, key, value)

    db.commit()
    db.refresh(can_bo)
    return can_bo


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def xoa_can_bo(
    id: int,
    db: Session = Depends(get_db),
    nguoi_dung: TaiKhoan = Depends(require_roles(["ADMIN", "VAN_THU"]))
):
    can_bo = db.query(CanBo).filter(CanBo.id == id).first()
    if not can_bo:
        raise HTTPException(status_code=404, detail="Không tìm thấy cán bộ")

    db.delete(can_bo)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
>>>>>>> upstream/dms-dhthang
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.orm import Session
from typing import List
from config.database import get_db
from app.models.auth import CanBo
from app.schemas.can_bo_schema import CanBoCreate, CanBoResponse, CanBoUpdate
from app.dependencies import lay_nguoi_dung_hien_tai, require_roles
from app.models.auth import TaiKhoan

router = APIRouter(
    prefix="/api/can-bo",
    tags=["Quản lý Cán bộ"]
)


@router.get("/", response_model=List[CanBoResponse])
def lay_danh_sach_can_bo(
    db: Session = Depends(get_db),
    nguoi_dung: TaiKhoan = Depends(lay_nguoi_dung_hien_tai)
):
    return db.query(CanBo).all()


from fastapi import HTTPException
from app.schemas.can_bo_schema import CanBoCreate, CanBoUpdate  # Đảm bảo có khai báo các schema này nếu cần
from datetime import datetime

# 1. API Lấy thông tin chi tiết của 1 Cán bộ theo ID
@router.get("/{id}", response_model=CanBoResponse)
def lay_chi_tiet_can_bo(
    id: int, 
    db: Session = Depends(get_db),
    nguoi_dung: TaiKhoan = Depends(lay_nguoi_dung_hien_tai)
):
    can_bo = db.query(CanBo).filter(CanBo.id == id).first()
    if not can_bo:
        raise HTTPException(status_code=404, detail="Không tìm thấy cán bộ này!")
    return can_bo

# 2. API Lọc danh sách cán bộ theo từng cơ quan/phòng ban (Dùng khi phân công văn bản)
@router.get("/co-quan/{co_quan_id}", response_model=List[CanBoResponse])
def lay_can_bo_theo_co_quan(
    co_quan_id: int,
    db: Session = Depends(get_db),
    nguoi_dung: TaiKhoan = Depends(lay_nguoi_dung_hien_tai)
):
    # Lọc cán bộ theo trường co_quan_id khớp với database
    return db.query(CanBo).filter(CanBo.co_quan_id == co_quan_id).all()

# 3. API Thêm mới một Cán bộ
@router.post("/", response_model=CanBoResponse)
def them_can_bo(
    data: CanBoCreate, 
    db: Session = Depends(get_db),
    nguoi_dung: TaiKhoan = Depends(lay_nguoi_dung_hien_tai)
):
    can_bo_moi = CanBo(
        ho_ten=data.ho_ten,
        chuc_vu=data.chuc_vu,
        co_quan_id=data.co_quan_id
    )
    db.add(can_bo_moi)
    db.commit()
    db.refresh(can_bo_moi)
    return can_bo_moi

# 4. API Cập nhật thông tin Cán bộ
@router.put("/{id}", response_model=CanBoResponse)
def cap_nhat_can_bo(
    id: int,
    data: CanBoUpdate,
    db: Session = Depends(get_db),
    nguoi_dung: TaiKhoan = Depends(lay_nguoi_dung_hien_tai)
):
    can_bo = db.query(CanBo).filter(CanBo.id == id).first()
    if not can_bo:
        raise HTTPException(status_code=404, detail="Không tìm thấy cán bộ để cập nhật!")
    
    can_bo.ho_ten = data.ho_ten
    can_bo.chuc_vu = data.chuc_vu
    can_bo.co_quan_id = data.co_quan_id
    
    db.commit()
    db.refresh(can_bo)
    return can_bo
    return db.query(CanBo).order_by(CanBo.id.desc()).all()


@router.post("/", response_model=CanBoResponse, status_code=status.HTTP_201_CREATED)
def tao_can_bo(
    payload: CanBoCreate,
    db: Session = Depends(get_db),
    nguoi_dung: TaiKhoan = Depends(require_roles(["ADMIN", "VAN_THU"]))
):
    can_bo = CanBo(**payload.model_dump())
    db.add(can_bo)
    db.commit()
    db.refresh(can_bo)
    return can_bo


@router.put("/{id}", response_model=CanBoResponse)
def cap_nhat_can_bo(
    id: int,
    payload: CanBoUpdate,
    db: Session = Depends(get_db),
    nguoi_dung: TaiKhoan = Depends(require_roles(["ADMIN", "VAN_THU"]))
):
    can_bo = db.query(CanBo).filter(CanBo.id == id).first()
    if not can_bo:
        raise HTTPException(status_code=404, detail="Không tìm thấy cán bộ")

    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(can_bo, key, value)

    db.commit()
    db.refresh(can_bo)
    return can_bo


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def xoa_can_bo(
    id: int,
    db: Session = Depends(get_db),
    nguoi_dung: TaiKhoan = Depends(require_roles(["ADMIN", "VAN_THU"]))
):
    can_bo = db.query(CanBo).filter(CanBo.id == id).first()
    if not can_bo:
        raise HTTPException(status_code=404, detail="Không tìm thấy cán bộ")

    db.delete(can_bo)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
