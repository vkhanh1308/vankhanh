from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from config.database import get_db
from sqlalchemy import func, or_
from app.models.document import VanBanDen
from app.schemas.van_ban_den_schema import VanBanDenCreate, VanBanDenUpdate, VanBanDenResponse, PhanPhoiInput, TienDoInput
from app.dependencies import lay_nguoi_dung_hien_tai
from app.models.auth import TaiKhoan, CanBo
from app.models.document import VanBanDen, FileDinhKem
from app.models.core import HoSo
import os
import shutil
from fastapi import UploadFile, File
from typing import List
from pydantic import BaseModel
router = APIRouter(
    prefix="/api/van-ban-den",
    tags=["Quản lý Văn bản đến"]
)


@router.post("/", response_model=VanBanDenResponse)
def tao_van_ban_den(
    van_ban: VanBanDenCreate,
    db: Session = Depends(get_db),
    nguoi_dung: TaiKhoan = Depends(lay_nguoi_dung_hien_tai)
):
    # 1. Guard: Chặn hồ sơ đã đóng (Giữ nguyên)
    if van_ban.ma_ho_so:
        ho_so = db.query(HoSo).filter(
            HoSo.ma_ho_so == van_ban.ma_ho_so).first()
        if ho_so and ho_so.trang_thai in {"DA_DONG", "DA_NOP_LUU"}:
            raise HTTPException(
                status_code=400,
                detail="Không thể thêm/chỉnh sửa văn bản trong hồ sơ đã đóng hoặc đã nộp lưu!"
            )

    # 2. XỬ LÝ SỐ ĐẾN THÔNG MINH (Thay thế đoạn raise HTTPException cũ)
    kiem_tra = db.query(VanBanDen).filter(
        VanBanDen.so_den == van_ban.so_den).first()
    if kiem_tra:
        # Nếu số người dùng nhập đã bị trùng, hệ thống tự động tìm số lớn nhất và cộng 1
        max_so_den = db.query(func.max(VanBanDen.so_den)).scalar() or 0
        van_ban.so_den = max_so_den + 1
        # (Không báo lỗi 400 cản trở người dùng nữa)

    # --- BLOCK VALIDATE NGHIỆP VỤ (Giữ nguyên phần Ngày tháng, Số trang...) ---
    if van_ban.han_giai_quyet and van_ban.ngay_den:
        if van_ban.han_giai_quyet < van_ban.ngay_den:
            raise HTTPException(
                status_code=400,
                detail="Lỗi nghiệp vụ: Hạn giải quyết KHÔNG ĐƯỢC trước Ngày đến!"
            )

    if van_ban.so_trang is not None and van_ban.so_trang < 0:
        raise HTTPException(
            status_code=400,
            detail="Lỗi dữ liệu: Số trang không được là số âm!"
        )
    # --------------------------------

    van_ban_moi = VanBanDen(**van_ban.model_dump())
    db.add(van_ban_moi)
    db.commit()
    db.refresh(van_ban_moi)
    return van_ban_moi


@router.get("/")
def lay_danh_sach_van_ban_den(
    page: int = 1,
    size: int = 10,
    keyword: str = None,  # Thêm tham số tìm kiếm
    db: Session = Depends(get_db),
    nguoi_dung: TaiKhoan = Depends(lay_nguoi_dung_hien_tai)
):
    query = db.query(VanBanDen).options(joinedload(VanBanDen.tep_dinh_kems))

    # Nếu có từ khóa, lọc dữ liệu
    if keyword:
        query = query.filter(
            VanBanDen.trich_yeu.contains(keyword) |
            VanBanDen.ky_hieu.contains(keyword)
        )

    total = query.count()
    danh_sach = query.offset((page - 1) * size).limit(size).all()
    return {"data": danh_sach, "total": total}


@router.get("/", response_model=list[VanBanDenResponse])
def lay_danh_sach_van_ban_den(db: Session = Depends(get_db)):
    return db.query(VanBanDen).all()

from fastapi import Query
from typing import Optional
from datetime import date

# API 3: Tìm kiếm và lọc Văn bản đến nâng cao
@router.get("/search", response_model=list[VanBanDenResponse])
def tim_kiem_van_ban_den(
    subject: Optional[str] = Query(None, description="Tìm theo trích yếu nội dung"),
    status: Optional[str] = Query(None, description="Lọc theo trạng thái xử lý"),
    priority: Optional[int] = Query(None, description="Lọc theo mức độ khẩn (1-5)"),
    db: Session = Depends(get_db)
):
    query = db.query(VanBanDen)
    
    # Tìm kiếm gần đúng (không phân biệt hoa thường với ilike) theo trích yếu
    if subject:
        query = query.filter(VanBanDen.subject.ilike(f"%{subject}%"))
        
    # Lọc theo trạng thái (Ví dụ: "Chờ xử lý", "Đang xử lý")
    if status:
        query = query.filter(VanBanDen.status == status)
        
    # Lọc theo độ khẩn của công văn
    if priority:
        query = query.filter(VanBanDen.priority == priority)
        
    return query.all()


# API 4: Cập nhật ý kiến chỉ đạo và Hạn giải quyết (Dành cho Lãnh đạo duyệt)
@router.patch("/{vb_id}/chi-dao", response_model=VanBanDenResponse)
def cap_nhat_y_kien_chi_dao(
    vb_id: int, 
    y_kien: str = Query(..., description="Ý kiến phân phối, chỉ đạo của lãnh đạo"),
    han_giai_quyet: Optional[date] = Query(None, description="Thời hạn giải quyết văn bản"),
    db: Session = Depends(get_db)
):
    # Tìm văn bản trong hệ thống theo ID
    vb = db.query(VanBanDen).filter(VanBanDen.id == vb_id).first()
    if not vb:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Không tìm thấy văn bản này cậu ơi!")
        
    # Tiến hành ghi nhận ý kiến và hạn chót xử lý vào các trường dữ liệu tương ứng
    vb.trace_header_list = y_kien
    if han_giai_quyet:
        vb.due_date = han_giai_quyet
        
    # Tự động chuyển trạng thái văn bản sang "Đang xử lý"
    vb.status = "Đang xử lý"
    
    db.commit()
    db.refresh(vb)
    return vb
@router.put("/{van_ban_id}", response_model=VanBanDenResponse)
def cap_nhat_van_ban_den(
    van_ban_id: int,
    van_ban_update: VanBanDenUpdate,
    db: Session = Depends(get_db),
    nguoi_dung: TaiKhoan = Depends(lay_nguoi_dung_hien_tai)
):
    db_van_ban = db.query(VanBanDen).options(joinedload(
        VanBanDen.tep_dinh_kems)).filter(VanBanDen.id == van_ban_id).first()
    if not db_van_ban:
        raise HTTPException(
            status_code=404, detail="Không tìm thấy văn bản đến này!")

    ma_ho_so_moi = van_ban_update.ma_ho_so if van_ban_update.ma_ho_so is not None else db_van_ban.ma_ho_so
    if ma_ho_so_moi:
        ho_so = db.query(HoSo).filter(HoSo.ma_ho_so == ma_ho_so_moi).first()
        if ho_so and ho_so.trang_thai in {"DA_DONG", "DA_NOP_LUU"}:
            raise HTTPException(
                status_code=400,
                detail="Không thể thêm/chỉnh sửa văn bản trong hồ sơ đã đóng hoặc đã nộp lưu!"
            )

    # --- BLOCK VALIDATE NGHIỆP VỤ KHI CẬP NHẬT ---
    ngay_den_check = van_ban_update.ngay_den if van_ban_update.ngay_den else db_van_ban.ngay_den
    han_giai_quyet_check = van_ban_update.han_giai_quyet if van_ban_update.han_giai_quyet else db_van_ban.han_giai_quyet

    if han_giai_quyet_check and ngay_den_check:
        if han_giai_quyet_check < ngay_den_check:
            raise HTTPException(
                status_code=400,
                detail="Lỗi nghiệp vụ: Hạn giải quyết KHÔNG ĐƯỢC trước Ngày đến!"
            )

    so_trang_check = van_ban_update.so_trang if van_ban_update.so_trang is not None else db_van_ban.so_trang
    if so_trang_check is not None and so_trang_check < 0:
        raise HTTPException(
            status_code=400,
            detail="Lỗi dữ liệu: Số trang không được là số âm!"
        )
    # --------------------------------

    # Cập nhật các trường có dữ liệu gửi lên
    update_data = van_ban_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_van_ban, key, value)

    db.commit()
    db.refresh(db_van_ban)
    return db_van_ban


@router.delete("/{van_ban_id}")
def xoa_van_ban_den(
    van_ban_id: int,
    db: Session = Depends(get_db),
    nguoi_dung: TaiKhoan = Depends(lay_nguoi_dung_hien_tai)
):
    db_van_ban = db.query(VanBanDen).filter(VanBanDen.id == van_ban_id).first()
    if not db_van_ban:
        raise HTTPException(
            status_code=404, detail="Không tìm thấy văn bản đến này!")

    db.delete(db_van_ban)
    db.commit()
    return {"message": "Đã xóa văn bản đến thành công!"}


@router.get("/{van_ban_id}", response_model=VanBanDenResponse)
def lay_chi_tiet_van_ban_den(
    van_ban_id: int,
    db: Session = Depends(get_db),
    nguoi_dung: TaiKhoan = Depends(lay_nguoi_dung_hien_tai)
):
    db_van_ban = db.query(VanBanDen).filter(VanBanDen.id == van_ban_id).first()
    if not db_van_ban:
        raise HTTPException(
            status_code=404, detail="Không tìm thấy văn bản đến này!")

    return db_van_ban


# Tạo sẵn thư mục trên ổ cứng để chứa file văn bản đến
UPLOAD_DIR = "uploads/van_ban_den"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/{van_ban_id}/upload", summary="Tải file đính kèm cho Văn bản đến")
def upload_file_van_ban_den(
    van_ban_id: int,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    nguoi_dung: TaiKhoan = Depends(lay_nguoi_dung_hien_tai)
):
    db_van_ban = db.query(VanBanDen).filter(VanBanDen.id == van_ban_id).first()
    if not db_van_ban:
        raise HTTPException(
            status_code=404, detail="Không tìm thấy văn bản để đính kèm!")

    saved_files = []
    file_responses = []
    for file in files:
        # Tạo tên file an toàn: Thêm ID văn bản đằng trước để không bị trùng tên
        file_path = os.path.join(UPLOAD_DIR, f"{van_ban_id}_{file.filename}")

        # Lưu file vật lý vào ổ cứng
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Tính toán định dạng và dung lượng
        ext = file.filename.split(
            ".")[-1].lower() if "." in file.filename else None
        file_size = os.path.getsize(file_path)

        # Đổi dấu \\ thành / để đường dẫn đồng nhất và không bị lỗi hiển thị trên React
        normalized_path = file_path.replace("\\", "/")

        new_file = FileDinhKem(
            ten_file=file.filename,
            duong_dan=normalized_path,
            van_ban_id=van_ban_id,
            loai_van_ban="VAN_BAN_DEN",
            dinh_dang=ext,
            dung_luong=float(file_size / 1024),
        )
        db.add(new_file)
        file_responses.append({
            "id": None,  # sẽ được fill sau commit nếu cần
            "ten_file": file.filename,
            "duong_dan": normalized_path,
            "dinh_dang": ext,
            "dung_luong": float(file_size / 1024),
        })

    db.commit()
    # Refresh để lấy ID cho các file mới tạo
    db.refresh(db_van_ban)
    return {"message": f"Đã tải lên {len(file_responses)} file thành công!", "files": file_responses}

# --- BLOCK API PHÂN PHỐI VÀ XỬ LÝ VĂN BẢN ĐẾN ---


@router.patch("/{id}/phan-phoi")
def phan_phoi_van_ban_den(
    id: int,
    data: PhanPhoiInput,
    db: Session = Depends(get_db),
    nguoi_dung: TaiKhoan = Depends(lay_nguoi_dung_hien_tai)
):
    van_ban = db.query(VanBanDen).filter(VanBanDen.id == id).first()
    if not van_ban:
        raise HTTPException(
            status_code=404, detail="Không tìm thấy văn bản đến!")

    can_bo = db.query(CanBo).filter(CanBo.id == data.nguoi_xu_ly_id).first()
    if not can_bo:
        raise HTTPException(
            status_code=400, detail="Cán bộ xử lý không tồn tại!")

    van_ban.nguoi_xu_ly_id = data.nguoi_xu_ly_id
    van_ban.trang_thai_xu_ly = 'DANG_XU_LY'
    db.commit()
    db.refresh(van_ban)

    return {"message": f"Đã phân phối văn bản cho {can_bo.ho_ten} thành công!"}


@router.patch("/{id}/tien-do")
def cap_nhat_tien_do_van_ban(
    id: int,
    data: TienDoInput,
    db: Session = Depends(get_db),
    nguoi_dung: TaiKhoan = Depends(lay_nguoi_dung_hien_tai)
):
    van_ban = db.query(VanBanDen).filter(VanBanDen.id == id).first()
    if not van_ban:
        raise HTTPException(
            status_code=404, detail="Không tìm thấy văn bản đến!")

    van_ban.trang_thai_xu_ly = data.trang_thai_xu_ly
    db.commit()
    db.refresh(van_ban)

    return {"message": "Cập nhật tiến độ xử lý thành công!"}

from fastapi import Query
from typing import Optional
from datetime import date

# 1. API Tìm kiếm nâng cao 
@router.get("/v2/search", response_model=list[VanBanDenResponse])
def tim_kiem_van_ban_den_chuan(
    trich_yeu: Optional[str] = Query(None, description="Tìm theo trích yếu nội dung"),
    trang_thai: Optional[str] = Query(None, description="Lọc theo trạng thái xử lý (CHO_XU_LY, DANG_XU_LY, DA_XU_LY)"),
    db: Session = Depends(get_db),
    nguoi_dung: TaiKhoan = Depends(lay_nguoi_dung_hien_tai)
):
    query = db.query(VanBanDen)
    
    # Sửa từ .subject.ilike sang .trich_yeu.ilike theo đúng Model
    if trich_yeu:
        query = query.filter(VanBanDen.trich_yeu.ilike(f"%{trich_yeu}%"))
        
    # Sửa từ .status sang .trang_thai_xu_ly theo đúng Model
    if trang_thai:
        query = query.filter(VanBanDen.trang_thai_xu_ly == trang_thai)
        
    return query.all()


# 2. API Cập nhật ý kiến chỉ đạo (Phiên bản vá lỗi - Dành cho Lãnh đạo duyệt phân phối)
@router.patch("/v2/{vb_id}/chi-dao", response_model=VanBanDenResponse)
def cap_nhat_y_kien_chi_dao_chuan(
    vb_id: int, 
    y_kien: str = Query(..., description="Ý kiến phân phối, chỉ đạo của lãnh đạo"),
    han_giai_quyet: Optional[date] = Query(None, description="Thời hạn giải quyết văn bản"),
    db: Session = Depends(get_db),
    nguoi_dung: TaiKhoan = Depends(lay_nguoi_dung_hien_tai)
):
    vb = db.query(VanBanDen).filter(VanBanDen.id == vb_id).first()
    if not vb:
        raise HTTPException(status_code=404, detail="Không tìm thấy văn bản này!")
        
    # Sửa các cột sai tên của Nhựt về chuẩn Model dữ liệu:
    vb.y_kien_chi_dao = y_kien  # (Cũ là trace_header_list)
    if han_giai_quyet:
        vb.han_giai_quyet = han_giai_quyet  # (Cũ là due_date)
        
    vb.trang_thai_xu_ly = "DANG_XU_LY"  # (Cũ là .status = "Đang xử lý")
    
    db.commit()
    db.refresh(vb)
    return vb


# 3. API Đưa văn bản đến nhập kho / xếp vào một Hồ sơ cụ thể
class NhapHoSoInput(BaseModel):
    ma_ho_so: str

@router.put("/{id}/dua-vao-ho-so")
def dua_van_ban_den_vao_ho_so(
    id: int,
    data: NhapHoSoInput,
    db: Session = Depends(get_db),
    nguoi_dung: TaiKhoan = Depends(lay_nguoi_dung_hien_tai)
):
    # Kiểm tra văn bản đến có tồn tại không
    van_ban = db.query(VanBanDen).filter(VanBanDen.id == id).first()
    if not van_ban:
        raise HTTPException(status_code=404, detail="Không tìm thấy văn bản đến!")

    # Kiểm tra hồ sơ lưu trữ xem có tồn tại và đã đóng chưa
    ho_so = db.query(HoSo).filter(HoSo.ma_ho_so == data.ma_ho_so).first()
    if not ho_so:
        raise HTTPException(status_code=404, detail="Mã hồ sơ lưu trữ không tồn tại!")
    if ho_so.trang_thai == "DA_DONG":
        raise HTTPException(status_code=400, detail="Hồ sơ này đã đóng đóng tủ, không thể xếp thêm văn bản!")

    # Tính toán số thứ tự (stt_trong_ho_so) tự động tăng dần trong hồ sơ đó
    max_stt = db.query(func.max(VanBanDen.stt_trong_ho_so)).filter(VanBanDen.ma_ho_so == data.ma_ho_so).scalar() or 0
    
    # Cập nhật thông tin lưu trữ vào hồ sơ
    van_ban.ma_ho_so = data.ma_ho_so
    van_ban.stt_trong_ho_so = max_stt + 1
    
    db.commit()
    db.refresh(van_ban)
    
    return {
        "message": f"Đã xếp văn bản vào hồ sơ {data.ma_ho_so} thành công!",
        "stt_trong_ho_so": van_ban.stt_trong_ho_so
    }