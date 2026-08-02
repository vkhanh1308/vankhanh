from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.core import HoSo
from app.models.auth import TaiKhoan
from app.schemas.ho_so_schema import HoSoCreate, HoSoUpdate, HoSoResponse
from app.dependencies import lay_nguoi_dung_hien_tai
from config.database import get_db
from sqlalchemy import or_
from app.models.document import VanBanDen, VanBanDi
from app.schemas.van_ban_den_schema import VanBanDenResponse
from app.schemas.van_ban_di_schema import VanBanDiResponse
router = APIRouter(
    prefix="/api/ho-so",
    tags=["Quản lý Hồ sơ"]
)


@router.post("/", response_model=HoSoResponse)
def tao_ho_so(
    ho_so: HoSoCreate,
    db: Session = Depends(get_db),
    nguoi_dung: TaiKhoan = Depends(lay_nguoi_dung_hien_tai)
):
    kiem_tra = db.query(HoSo).filter(HoSo.ma_ho_so == ho_so.ma_ho_so).first()
    if kiem_tra:
        raise HTTPException(
            status_code=400, detail="Mã hồ sơ này đã tồn tại trên hệ thống!")

    ho_so_moi = HoSo(**ho_so.model_dump())
    db.add(ho_so_moi)
    db.commit()
    db.refresh(ho_so_moi)
    return ho_so_moi


@router.get("/")
def lay_danh_sach_ho_so(
    page: int = 1,
    size: int = 10,
    keyword: str = None,
    db: Session = Depends(get_db),
    nguoi_dung: TaiKhoan = Depends(lay_nguoi_dung_hien_tai)
):
    query = db.query(HoSo)

    # 1. Logic tìm kiếm theo keyword (Mã hồ sơ hoặc Tiêu đề)
    if keyword:
        query = query.filter(
            or_(
                HoSo.ma_ho_so.ilike(f"%{keyword}%"),
                HoSo.tieu_de_ho_so.ilike(f"%{keyword}%")
            )
        )

    # 2. Đếm tổng số bản ghi (phục vụ phân trang UI)
    total = query.count()

    # 3. Áp dụng phân trang
    danh_sach = query.offset((page - 1) * size).limit(size).all()

    # 4. Trả về đúng cấu trúc chuẩn của hệ thống
    return {
        "data": danh_sach,
        "total": total
    }


@router.get("/{ma_ho_so}", response_model=HoSoResponse)
def lay_chi_tiet_ho_so(
    ma_ho_so: str,
    db: Session = Depends(get_db),
    nguoi_dung: TaiKhoan = Depends(lay_nguoi_dung_hien_tai)
):
    ho_so = db.query(HoSo).filter(HoSo.ma_ho_so == ma_ho_so).first()
    if not ho_so:
        raise HTTPException(status_code=404, detail="Không tìm thấy hồ sơ!")
    return ho_so


@router.put("/{ma_ho_so}", response_model=HoSoResponse)
def cap_nhat_ho_so(
    ma_ho_so: str,
    ho_so_update: HoSoUpdate,
    db: Session = Depends(get_db),
    nguoi_dung: TaiKhoan = Depends(lay_nguoi_dung_hien_tai)
):
    ho_so = db.query(HoSo).filter(HoSo.ma_ho_so == ma_ho_so).first()
    if not ho_so:
        raise HTTPException(status_code=404, detail="Không tìm thấy hồ sơ!")

    # Chỉ cập nhật các trường được truyền lên, không ghi đè None
    update_data = ho_so_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(ho_so, key, value)

    db.commit()
    db.refresh(ho_so)
    return ho_so


@router.delete("/{ma_ho_so}")
def xoa_ho_so(
    ma_ho_so: str,
    db: Session = Depends(get_db),
    nguoi_dung: TaiKhoan = Depends(lay_nguoi_dung_hien_tai)
):
    # 1. Tìm hồ sơ
    ho_so = db.query(HoSo).filter(HoSo.ma_ho_so == ma_ho_so).first()
    if not ho_so:
        raise HTTPException(status_code=404, detail="Không tìm thấy hồ sơ!")

    # 2. CHẶN XÓA: Nếu hồ sơ đã đóng hoặc đã nộp lưu thì tuyệt đối không cho xóa
    if ho_so.trang_thai in ["DA_DONG", "DA_NOP_LUU"]:
        raise HTTPException(
            status_code=400,
            detail=f"Không thể xóa hồ sơ đã ở trạng thái {ho_so.trang_thai}!"
        )

    # 3. Thực hiện xóa nếu là hồ sơ DANG_MO
    db.delete(ho_so)
    db.commit()
    return {"message": "Xóa hồ sơ thành công!"}


@router.patch("/{ma_ho_so}/dong")
def dong_ho_so(
    ma_ho_so: str,
    db: Session = Depends(get_db),
    nguoi_dung: TaiKhoan = Depends(lay_nguoi_dung_hien_tai)
):
    ho_so = db.query(HoSo).filter(HoSo.ma_ho_so == ma_ho_so).first()
    if not ho_so:
        raise HTTPException(status_code=404, detail="Không tìm thấy hồ sơ")

    ho_so.trang_thai = "DA_DONG"
    db.commit()
    return {"message": "Đã đóng hồ sơ thành công!"}


@router.patch("/{ma_ho_so}/nop-luu")
def nop_luu_ho_so(
    ma_ho_so: str,
    db: Session = Depends(get_db),
    nguoi_dung: TaiKhoan = Depends(lay_nguoi_dung_hien_tai)
):
    # 1. Kiểm tra hồ sơ tồn tại
    ho_so = db.query(HoSo).filter(HoSo.ma_ho_so == ma_ho_so).first()
    if not ho_so:
        raise HTTPException(status_code=404, detail="Không tìm thấy hồ sơ")

    # 2. Kiểm tra hồ sơ đã đóng chưa
    if ho_so.trang_thai != "DA_DONG":
        raise HTTPException(
            status_code=400, detail="Chỉ hồ sơ đã đóng mới được nộp lưu!")

    # 3. Kiểm tra hồ sơ rỗng
    so_luong_vb_den = db.query(VanBanDen).filter(
        VanBanDen.ma_ho_so == ma_ho_so).count()
    so_luong_vb_di = db.query(VanBanDi).filter(
        VanBanDi.ma_ho_so == ma_ho_so).count()

    if (so_luong_vb_den + so_luong_vb_di) == 0:
        raise HTTPException(
            status_code=400, detail="Hồ sơ rỗng không được nộp lưu!")

    # 4. Cập nhật trạng thái
    ho_so.trang_thai = "DA_NOP_LUU"
    db.commit()

    return {"message": "Nộp lưu hồ sơ thành công!"}


@router.get("/{ma_ho_so}/van-ban")
def lay_van_ban_trong_ho_so(
    ma_ho_so: str,
    db: Session = Depends(get_db),
    nguoi_dung: TaiKhoan = Depends(lay_nguoi_dung_hien_tai)
):
    # Kiểm tra xem hồ sơ có tồn tại không
    ho_so = db.query(HoSo).filter(HoSo.ma_ho_so == ma_ho_so).first()
    if not ho_so:
        raise HTTPException(status_code=404, detail="Không tìm thấy hồ sơ!")

    # Query Văn bản đến
    ds_vb_den = db.query(VanBanDen).filter(
        VanBanDen.ma_ho_so == ma_ho_so).order_by(VanBanDen.so_den).all()

    # Query Văn bản đi
    ds_vb_di = db.query(VanBanDi).filter(
        VanBanDi.ma_ho_so == ma_ho_so).order_by(VanBanDi.id.desc()).all()

    return {
        "van_ban_den": ds_vb_den,
        "van_ban_di": ds_vb_di
    }

from app.models.core import ViTriLuuTru
from pydantic import BaseModel

# Khai báo cấu trúc dữ liệu 
class XepViTriHoSoRequest(BaseModel):
    vi_tri_id: int

# API Xếp vị trí kho lưu trữ cho một Hồ sơ
@router.put("/{ma_ho_so}/xep-vi-tri")
def xep_vi_tri_luu_tru_ho_so(
    ma_ho_so: str,
    data: XepViTriHoSoRequest,
    db: Session = Depends(get_db),
    nguoi_dung: TaiKhoan = Depends(lay_nguoi_dung_hien_tai)
):
    # 1. Kiểm tra xem hồ sơ đó có tồn tại không
    ho_so = db.query(HoSo).filter(HoSo.ma_ho_so == ma_ho_so).first()
    if not ho_so:
        raise HTTPException(status_code=404, detail="Không tìm thấy hồ sơ!")

    # 2. Kiểm tra xem ID vị trí truyền lên có thật trong DB không
    vi_tri = db.query(ViTriLuuTru).filter(ViTriLuuTru.id == data.vi_tri_id).first()
    if not vi_tri:
        raise HTTPException(status_code=400, detail="Vị trí lưu trữ vật lý không tồn tại!")

    # 3. Gán vị trí kho bãi cho hồ sơ (Khớp với khóa ngoại vi_tri_id trong Model)
    ho_so.vi_tri_id = data.vi_tri_id
    db.commit()
    db.refresh(ho_so)

    return {
        "message": "Đã xếp vị trí lưu trữ vật lý cho hồ sơ thành công!",
        "ma_ho_so": ho_so.ma_ho_so,
        "vi_tri_luu_tru": {
            "toa_nha": vi_tri.toa_nha,
            "phong": vi_tri.phong,
            "ke_tu": vi_tri.ke_tu,
            "ngan_tang": vi_tri.ngan_tang
        }
    }