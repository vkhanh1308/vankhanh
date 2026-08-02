# app/routes/thong_ke_routes.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from config.database import get_db
from app.dependencies import lay_nguoi_dung_hien_tai
from app.models.auth import TaiKhoan
from app.models.document import VanBanDi, VanBanDen
from app.models.core import HoSo

router = APIRouter(
    prefix="/api/thong-ke",
    tags=["Thống kê & Dashboard"]
)


@router.get("/tong-quan")
def thong_ke_tong_quan(
    db: Session = Depends(get_db),
    nguoi_dung: TaiKhoan = Depends(lay_nguoi_dung_hien_tai)
):
    # 1. Thống kê Văn bản đi
    tong_vb_di = db.query(VanBanDi).count()
    vb_di_theo_trang_thai = dict(db.query(VanBanDi.trang_thai, func.count(
        VanBanDi.id)).group_by(VanBanDi.trang_thai).all())

    # 2. Thống kê Văn bản đến
    tong_vb_den = db.query(VanBanDen).count()
    vb_den_theo_trang_thai = dict(db.query(VanBanDen.trang_thai_xu_ly, func.count(
        VanBanDen.id)).group_by(VanBanDen.trang_thai_xu_ly).all())

    # 3. Thống kê Hồ sơ
    tong_ho_so = db.query(HoSo).count()
    ho_so_theo_trang_thai = dict(
        db.query(HoSo.trang_thai, func.count(HoSo.ma_ho_so)).group_by(HoSo.trang_thai).all())
    return {
        "van_ban_di": {
            "tong": tong_vb_di,
            "trang_thai": {
                "DRAFT": vb_di_theo_trang_thai.get("DRAFT", 0),
                "PENDING_APPROVAL": vb_di_theo_trang_thai.get("PENDING_APPROVAL", 0),
                "PUBLISHED": vb_di_theo_trang_thai.get("PUBLISHED", 0),
                "REVOKED": vb_di_theo_trang_thai.get("REVOKED", 0)
            }
        },
        "van_ban_den": {
            "tong": tong_vb_den,
            "trang_thai": {
                "CHO_XU_LY": vb_den_theo_trang_thai.get("CHO_XU_LY", 0),
                "DANG_XU_LY": vb_den_theo_trang_thai.get("DANG_XU_LY", 0),
                "DA_XU_LY": vb_den_theo_trang_thai.get("DA_XU_LY", 0)
            }
        },
        "ho_so": {
            "tong": tong_ho_so,
            "trang_thai": {
                "DANG_MO": ho_so_theo_trang_thai.get("DANG_MO", 0),
                "DA_DONG": ho_so_theo_trang_thai.get("DA_DONG", 0),
                "DA_NOP_LUU": ho_so_theo_trang_thai.get("DA_NOP_LUU", 0)
            }
        }
    }

from app.models.core import DanhMucLoaiVb, CoQuanToChuc

# 1. API Thống kê số lượng Văn bản đến theo từng Loại văn bản (Ví dụ: bao nhiêu Công văn, bao nhiêu Quyết định)
@router.get("/van-ban-den/loai-van-ban")
def thong_ke_vb_den_theo_loai(
    db: Session = Depends(get_db),
    nguoi_dung: TaiKhoan = Depends(lay_nguoi_dung_hien_tai)
):
    # Join bảng VanBanDen với DanhMucLoaiVb để lấy tên loại văn bản hiển thị lên biểu đồ
    ket_qua = db.query(
        DanhMucLoaiVb.ten_loai_vb,
        func.count(VanBanDen.id).label("so_luong")
    ).join(
        VanBanDen, VanBanDen.ma_loai_vb_id == DanhMucLoaiVb.id
    ).group_by(
        DanhMucLoaiVb.ten_loai_vb
    ).all()
    
    return [{"loai_van_ban": item[0], "so_luong": item[1]} for item in ket_qua]

# 2. API Thống kê số lượng Văn bản đến theo Cơ quan ban hành (Biết nguồn văn bản chủ yếu từ đâu tới)
@router.get("/van-ban-den/co-quan")
def thong_ke_vb_den_theo_co_quan(
    db: Session = Depends(get_db),
    nguoi_dung: TaiKhoan = Depends(lay_nguoi_dung_hien_tai)
):
    # Join bảng VanBanDen với CoQuanToChuc
    ket_qua = db.query(
        CoQuanToChuc.ten_co_quan,
        func.count(VanBanDen.id).label("so_luong")
    ).join(
        VanBanDen, VanBanDen.co_quan_ban_hanh_id == CoQuanToChuc.id
    ).group_by(
        CoQuanToChuc.ten_co_quan
    ).all()
    
    return [{"co_quan": item[0], "so_luong": item[1]} for item in ket_qua]

# 3. API Thống kê số lượng văn bản xử lý theo xu hướng thời gian (Theo tháng trong năm hiện tại)
@router.get("/xu-huong-theo-thang")
def thong_ke_xu_huong_theo_thang(
    nam: int = None, #  Chuyển mặc định thành None
    db: Session = Depends(get_db),
    nguoi_dung: TaiKhoan = Depends(lay_nguoi_dung_hien_tai)
):
    #  Nếu người dùng KHÔNG truyền năm lên, hệ thống sẽ TỰ ĐỘNG lấy năm hiện tại của máy tính lúc đó
    if nam is None:
        nam = datetime.now().year 
        
    vb_den_theo_thang = db.query(
        func.extract('month', VanBanDen.ngay_den).label('thang'),
        func.count(VanBanDen.id).label('so_luong')
    ).filter(
        func.extract('year', VanBanDen.ngay_den) == nam
    ).group_by(
        func.extract('month', VanBanDen.ngay_den)
    ).all()

    # Chuyển đổi dữ liệu trả về cho Frontend dễ map vào biểu đồ đường (Line Chart)
    data_den = {int(item[0]): item[1] for item in vb_den_theo_thang}
    
    bieu_do_xu_huong = []
    for m in range(1, 13):
        bieu_do_xu_huong.append({
            "thang": f"Tháng {m}",
            "van_ban_den": data_den.get(m, 0)
        })
        
    return bieu_do_xu_huong