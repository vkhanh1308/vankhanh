from datetime import date, datetime
from pathlib import Path
from typing import Annotated, List, Optional
from sqlalchemy import func
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session, joinedload
from config.database import get_db
from app.models.core import HoSo
from app.models.document import FileDinhKem, VanBanDi, VanBanDen
from app.schemas.van_ban_di_schema import VanBanDiCreate, VanBanDiResponse, TrangThaiUpdate, ReasonRequest
from app.dependencies import lay_nguoi_dung_hien_tai
from app.models.auth import TaiKhoan, CanBo
router = APIRouter(
    prefix="/api/van-ban-di",
    tags=["Quản lý Văn bản đi"]
)

WORKFLOW_TRANSITIONS = {
    'DRAFT': {'PENDING_APPROVAL'},
    'PENDING_APPROVAL': {'APPROVED', 'DRAFT'},
    'APPROVED': {'PUBLISHED'},
    'PUBLISHED': {'REVOKED'},
    'REVOKED': set(),
}


def validate_transition(current_status: str, next_status: str):
    allowed = WORKFLOW_TRANSITIONS.get(current_status, set())
    if next_status not in allowed:
        raise HTTPException(
            status_code=400, detail="Chuyển đổi trạng thái không hợp lệ!")


def get_van_ban_di(db: Session, id: int) -> VanBanDi:
    van_ban = db.query(VanBanDi).options(joinedload(
        VanBanDi.tep_dinh_kems)).filter(VanBanDi.id == id).first()
    if not van_ban:
        raise HTTPException(
            status_code=404, detail="Không tìm thấy văn bản đi")
    return van_ban


def resolve_user_label(db: Session, nguoi_dung: TaiKhoan) -> str:
    if getattr(nguoi_dung, "can_bo_id", None):
        can_bo = db.query(CanBo).filter(
            CanBo.id == nguoi_dung.can_bo_id).first()
        if can_bo and can_bo.ho_ten:
            return can_bo.ho_ten
    return getattr(nguoi_dung, "ten_dang_nhap", "unknown")


def apply_status_transition(
    van_ban_di: VanBanDi,
    next_status: str,
    db: Session,
    nguoi_dung: TaiKhoan,
    reason: Optional[str] = None
):
    validate_transition(van_ban_di.trang_thai, next_status)
    trang_thai_cu = van_ban_di.trang_thai
    van_ban_di.trang_thai = next_status

    if next_status == 'PENDING_APPROVAL':
        van_ban_di.submitted_at = datetime.utcnow()
        van_ban_di.approved_by = None
        van_ban_di.approved_at = None
        van_ban_di.revoke_reason = None

    elif next_status == 'APPROVED':
        van_ban_di.approved_by = resolve_user_label(db, nguoi_dung)
        van_ban_di.approved_at = datetime.utcnow()
        van_ban_di.revoke_reason = None

    elif next_status == 'PUBLISHED':
        van_ban_di.revoke_reason = None
        try:
            max_so_den = db.query(func.max(VanBanDen.so_den)).scalar() or 0
            ten_nguoi_ky = ""
            if van_ban_di.nguoi_ky_id:
                nguoi_ky = db.query(CanBo).filter(
                    CanBo.id == van_ban_di.nguoi_ky_id).first()
                ten_nguoi_ky = nguoi_ky.ho_ten if nguoi_ky else ""

            van_ban_den_moi = VanBanDen(
                so_den=max_so_den + 1,
                ky_hieu=van_ban_di.so_ky_hieu,
                ngay_den=date.today(),
                ngay_ban_hanh=van_ban_di.ngay_ban_hanh,
                co_quan_ban_hanh_id=van_ban_di.don_vi_soan_thao_id,
                ma_loai_vb_id=van_ban_di.ma_loai_vb_id,
                trich_yeu=van_ban_di.trich_yeu,
                so_trang=van_ban_di.so_trang,
                ho_ten_nguoi_ky=ten_nguoi_ky,
                chuc_vu_nguoi_ky=van_ban_di.chuc_vu_nguoi_ky,
                do_khan=van_ban_di.muc_do_khan,
                don_vi_nhan=van_ban_di.noi_nhan,
                trang_thai_xu_ly='CHO_XU_LY'
            )
            db.add(van_ban_den_moi)
            db.flush()

            tep_dinh_kems = db.query(FileDinhKem).filter(
                FileDinhKem.van_ban_id == van_ban_di.id,
                FileDinhKem.loai_van_ban == 'VAN_BAN_DI'
            ).all()

            for tep in tep_dinh_kems:
                tep_moi = FileDinhKem(
                    loai_van_ban='VAN_BAN_DEN',
                    van_ban_id=van_ban_den_moi.id,
                    ten_file=tep.ten_file,
                    duong_dan=tep.duong_dan,
                    dinh_dang=tep.dinh_dang,
                    dung_luong=tep.dung_luong
                )
                db.add(tep_moi)
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=500, detail=f"Lỗi hệ thống khi liên thông văn bản: {str(e)}")

    elif next_status == 'REVOKED':
        if not reason:
            raise HTTPException(
                status_code=400,
                detail='Lý do thu hồi là bắt buộc khi chuyển trạng thái sang REVOKED!'
            )
        van_ban_di.revoke_reason = reason
        if trang_thai_cu == 'PUBLISHED':
            try:
                van_ban_den_can_huy = db.query(VanBanDen).filter(
                    VanBanDen.ky_hieu == van_ban_di.so_ky_hieu,
                    VanBanDen.co_quan_ban_hanh_id == van_ban_di.don_vi_soan_thao_id
                ).first()

                if van_ban_den_can_huy:
                    db.query(FileDinhKem).filter(
                        FileDinhKem.van_ban_id == van_ban_den_can_huy.id,
                        FileDinhKem.loai_van_ban == 'VAN_BAN_DEN'
                    ).delete()
                    db.delete(van_ban_den_can_huy)
            except Exception as e:
                db.rollback()
                raise HTTPException(
                    status_code=500,
                    detail=f"Lỗi hệ thống khi thu hồi văn bản liên thông: {str(e)}"
                )

    elif next_status == 'DRAFT':
        van_ban_di.submitted_at = None
        van_ban_di.approved_by = None
        van_ban_di.approved_at = None
        van_ban_di.revoke_reason = reason if reason else None

    return {
        'message': 'Cập nhật trạng thái thành công!',
        'trang_thai_moi': van_ban_di.trang_thai,
        'lien_thong_thanh_cong': next_status == 'PUBLISHED' and trang_thai_cu != 'PUBLISHED'
    }


@router.post("/{id}/submit")
def submit_van_ban_di(
    id: int,
    db: Session = Depends(get_db),
    nguoi_dung: TaiKhoan = Depends(lay_nguoi_dung_hien_tai)
):
    van_ban = get_van_ban_di(db, id)  # Eager-load tep_dinh_kems relationship
    if van_ban.trang_thai != 'DRAFT':
        raise HTTPException(
            status_code=400,
            detail='Chỉ có thể gửi duyệt khi văn bản đang ở trạng thái DRAFT.'
        )
    result = apply_status_transition(
        van_ban, 'PENDING_APPROVAL', db, nguoi_dung)
    db.commit()
    db.refresh(van_ban)
    return result


@router.post("/{id}/approve")
def approve_van_ban_di(
    id: int,
    db: Session = Depends(get_db),
    nguoi_dung: TaiKhoan = Depends(lay_nguoi_dung_hien_tai)
):
    van_ban = get_van_ban_di(db, id)
    if van_ban.trang_thai != 'PENDING_APPROVAL':
        raise HTTPException(
            status_code=400,
            detail='Chỉ có thể duyệt khi văn bản đang ở trạng thái PENDING_APPROVAL.'
        )
    result = apply_status_transition(van_ban, 'APPROVED', db, nguoi_dung)
    db.commit()
    db.refresh(van_ban)
    return result


@router.post("/{id}/request-changes")
def request_changes_van_ban_di(
    id: int,
    data: ReasonRequest,
    db: Session = Depends(get_db),
    nguoi_dung: TaiKhoan = Depends(lay_nguoi_dung_hien_tai)
):
    van_ban = get_van_ban_di(db, id)
    if van_ban.trang_thai != 'PENDING_APPROVAL':
        raise HTTPException(
            status_code=400,
            detail='Chỉ có thể trả về sửa đổi khi văn bản đang ở trạng thái PENDING_APPROVAL.'
        )
    result = apply_status_transition(
        van_ban, 'DRAFT', db, nguoi_dung, reason=data.reason)
    db.commit()
    db.refresh(van_ban)
    return result


@router.post("/{id}/publish")
def publish_van_ban_di(
    id: int,
    db: Session = Depends(get_db),
    nguoi_dung: TaiKhoan = Depends(lay_nguoi_dung_hien_tai)
):
    van_ban = get_van_ban_di(db, id)
    if van_ban.trang_thai != 'APPROVED':
        raise HTTPException(
            status_code=400,
            detail='Chỉ có thể phát hành khi văn bản đang ở trạng thái APPROVED.'
        )
    result = apply_status_transition(van_ban, 'PUBLISHED', db, nguoi_dung)
    db.commit()
    db.refresh(van_ban)
    return result


@router.post("/{id}/revoke")
def revoke_van_ban_di(
    id: int,
    data: ReasonRequest,
    db: Session = Depends(get_db),
    nguoi_dung: TaiKhoan = Depends(lay_nguoi_dung_hien_tai)
):
    van_ban = get_van_ban_di(db, id)
    if van_ban.trang_thai != 'PUBLISHED':
        raise HTTPException(
            status_code=400,
            detail='Chỉ có thể thu hồi khi văn bản đang ở trạng thái PUBLISHED.'
        )
    result = apply_status_transition(
        van_ban, 'REVOKED', db, nguoi_dung, reason=data.reason)
    db.commit()
    db.refresh(van_ban)
    return result


@router.post("/", response_model=VanBanDiResponse)
async def tao_van_ban_di(
    so_ky_hieu: Annotated[Optional[str], Form()] = None,
    ngay_ban_hanh: Annotated[Optional[date], Form()] = None,
    trich_yeu: Annotated[str, Form()] = None,
    don_vi_soan_thao_id: Annotated[int, Form()] = None,
    ma_loai_vb_id: Annotated[int, Form()] = None,
    ngon_ngu: Annotated[Optional[str], Form()] = None,
    so_trang: Annotated[Optional[int], Form()] = None,
    ghi_chu: Annotated[Optional[str], Form()] = None,
    nguoi_ky_id: Annotated[Optional[int], Form()] = None,
    chuc_vu_nguoi_ky: Annotated[Optional[str], Form()] = None,
    noi_nhan: Annotated[Optional[str], Form()] = None,
    muc_do_khan: Annotated[Optional[int], Form()] = None,
    han_tra_loi: Annotated[Optional[date], Form()] = None,
    stt_trong_ho_so: Annotated[Optional[int], Form()] = None,
    ma_ho_so: Annotated[Optional[str], Form()] = None,
    files: List[UploadFile] = File(default=[]),
    so_luong_ban_phat_hanh: Annotated[Optional[int], Form()] = None,
    db: Session = Depends(get_db),
    nguoi_dung: TaiKhoan = Depends(lay_nguoi_dung_hien_tai)
):

    if ma_ho_so:
        ho_so = db.query(HoSo).filter(HoSo.ma_ho_so == ma_ho_so).first()
        if ho_so and ho_so.trang_thai in {"DA_DONG", "DA_NOP_LUU"}:
            raise HTTPException(
                status_code=400,
                detail="Không thể thêm/chỉnh sửa văn bản trong hồ sơ đã đóng hoặc đã nộp lưu!"
            )

    # --- BLOCK VALIDATE NGHIỆP VỤ ---
    if han_tra_loi and ngay_ban_hanh:
        if han_tra_loi < ngay_ban_hanh:
            raise HTTPException(
                status_code=400,
                detail="Lỗi nghiệp vụ: Hạn trả lời KHÔNG ĐƯỢC trước Ngày ban hành!"
            )

    if so_trang is not None and so_trang < 0:
        raise HTTPException(
            status_code=400,
            detail="Lỗi dữ liệu: Số trang không được là số âm!"
        )

    if so_luong_ban_phat_hanh is not None and so_luong_ban_phat_hanh < 0:
        raise HTTPException(
            status_code=400,
            detail="Lỗi dữ liệu: Số lượng bản phát hành không được là số âm!"
        )
    # --------------------------------

    van_ban_data = VanBanDiCreate(
        so_ky_hieu=so_ky_hieu,
        ngay_ban_hanh=ngay_ban_hanh,
        trich_yeu=trich_yeu,
        don_vi_soan_thao_id=don_vi_soan_thao_id,
        ma_loai_vb_id=ma_loai_vb_id,
        ngon_ngu=ngon_ngu,
        so_trang=so_trang,
        ghi_chu=ghi_chu,
        nguoi_ky_id=nguoi_ky_id,
        chuc_vu_nguoi_ky=chuc_vu_nguoi_ky,
        noi_nhan=noi_nhan,
        muc_do_khan=muc_do_khan,
        han_tra_loi=han_tra_loi,
        stt_trong_ho_so=stt_trong_ho_so,
        ma_ho_so=ma_ho_so,
        so_luong_ban_phat_hanh=so_luong_ban_phat_hanh
    )

    van_ban_moi = VanBanDi(**van_ban_data.model_dump())
    db.add(van_ban_moi)
    db.commit()
    db.refresh(van_ban_moi)

    # Nếu có file đính kèm, lưu chúng và cập nhật lại đối tượng để trả về thông tin file
    if files:
        upload_dir = Path("uploads") / "van_ban_di" / str(van_ban_moi.id)
        upload_dir.mkdir(parents=True, exist_ok=True)

        for file in files:
            file_bytes = await file.read()
            file_path = upload_dir / file.filename
            with open(file_path, "wb") as f:
                f.write(file_bytes)

            ext = Path(file.filename).suffix.lower().lstrip('.')
            normalized_path = str(file_path).replace("\\", "/")
            file_record = FileDinhKem(
                loai_van_ban="VAN_BAN_DI",
                van_ban_id=van_ban_moi.id,
                ten_file=file.filename,
                duong_dan=normalized_path,
                dinh_dang=ext or None,
                dung_luong=float(len(file_bytes) / 1024),
            )
            db.add(file_record)

        db.commit()
        # Làm mới đối tượng để trường relationship `tep_dinh_kems` chứa danh sách file mới
        db.refresh(van_ban_moi)

    return van_ban_moi


@router.get("/{id}", response_model=VanBanDiResponse)
def lay_van_ban_di_theo_id(
    id: int,
    db: Session = Depends(get_db),
    nguoi_dung: TaiKhoan = Depends(lay_nguoi_dung_hien_tai)  # Đã thêm bảo mật
):
    """Lấy chi tiết một văn bản đi (bảo vệ bằng JWT)."""
    van_ban = db.query(VanBanDi).filter(VanBanDi.id == id).first()
    if not van_ban:
        raise HTTPException(
            status_code=404, detail="Không tìm thấy văn bản đi")
    return van_ban


@router.put("/{id}", response_model=VanBanDiResponse)
async def cap_nhat_van_ban_di(
    id: int,
    so_ky_hieu: Annotated[Optional[str], Form()] = None,
    ngay_ban_hanh: Annotated[Optional[date], Form()] = None,
    trich_yeu: Annotated[str, Form()] = None,
    don_vi_soan_thao_id: Annotated[int, Form()] = None,
    ma_loai_vb_id: Annotated[int, Form()] = None,
    ngon_ngu: Annotated[Optional[str], Form()] = None,
    so_trang: Annotated[Optional[int], Form()] = None,
    ghi_chu: Annotated[Optional[str], Form()] = None,
    nguoi_ky_id: Annotated[Optional[int], Form()] = None,
    chuc_vu_nguoi_ky: Annotated[Optional[str], Form()] = None,
    noi_nhan: Annotated[Optional[str], Form()] = None,
    muc_do_khan: Annotated[Optional[int], Form()] = None,
    han_tra_loi: Annotated[Optional[date], Form()] = None,
    stt_trong_ho_so: Annotated[Optional[int], Form()] = None,
    ma_ho_so: Annotated[Optional[str], Form()] = None,
    files: List[UploadFile] = File(default=[]),
    so_luong_ban_phat_hanh: Annotated[Optional[int], Form()] = None,
    db: Session = Depends(get_db),
    nguoi_dung: TaiKhoan = Depends(lay_nguoi_dung_hien_tai)
):
    van_ban = get_van_ban_di(db, id)
    if van_ban.trang_thai in {"PUBLISHED", "REVOKED"}:
        raise HTTPException(
            status_code=400,
            detail="Không thể chỉnh sửa văn bản đã phát hành hoặc đã thu hồi!"
        )
    ma_ho_so_moi = ma_ho_so if ma_ho_so is not None else van_ban.ma_ho_so

    if ma_ho_so_moi:
        ho_so = db.query(HoSo).filter(HoSo.ma_ho_so == ma_ho_so_moi).first()
        if ho_so and ho_so.trang_thai in {"DA_DONG", "DA_NOP_LUU"}:
            raise HTTPException(
                status_code=400,
                detail="Không thể thêm/chỉnh sửa văn bản trong hồ sơ đã đóng hoặc đã nộp lưu!"
            )
    # --- BLOCK VALIDATE NGHIỆP VỤ KHI CẬP NHẬT ---
    ngay_ban_hanh_check = ngay_ban_hanh if ngay_ban_hanh else van_ban.ngay_ban_hanh
    han_tra_loi_check = han_tra_loi if han_tra_loi else van_ban.han_tra_loi

    if han_tra_loi_check and ngay_ban_hanh_check:
        if han_tra_loi_check < ngay_ban_hanh_check:
            raise HTTPException(
                status_code=400,
                detail="Lỗi nghiệp vụ: Hạn trả lời KHÔNG ĐƯỢC trước Ngày ban hành!"
            )

    so_trang_check = so_trang if so_trang is not None else van_ban.so_trang
    if so_trang_check is not None and so_trang_check < 0:
        raise HTTPException(
            status_code=400,
            detail="Lỗi dữ liệu: Số trang không được là số âm!"
        )

    so_luong_check = so_luong_ban_phat_hanh if so_luong_ban_phat_hanh is not None else van_ban.so_luong_ban_phat_hanh
    if so_luong_check is not None and so_luong_check < 0:
        raise HTTPException(
            status_code=400,
            detail="Lỗi dữ liệu: Số lượng bản phát hành không được là số âm!"
        )
    # --------------------------------

    # --- CẬP NHẬT AN TOÀN (Không ghi đè dữ liệu thành None) ---
    if so_ky_hieu is not None:
        van_ban.so_ky_hieu = so_ky_hieu
    if ngay_ban_hanh is not None:
        van_ban.ngay_ban_hanh = ngay_ban_hanh
    if trich_yeu is not None:
        van_ban.trich_yeu = trich_yeu
    if don_vi_soan_thao_id is not None:
        van_ban.don_vi_soan_thao_id = don_vi_soan_thao_id
    if ma_loai_vb_id is not None:
        van_ban.ma_loai_vb_id = ma_loai_vb_id
    if ngon_ngu is not None:
        van_ban.ngon_ngu = ngon_ngu
    if so_trang is not None:
        van_ban.so_trang = so_trang
    if ghi_chu is not None:
        van_ban.ghi_chu = ghi_chu
    if nguoi_ky_id is not None:
        van_ban.nguoi_ky_id = nguoi_ky_id
    if chuc_vu_nguoi_ky is not None:
        van_ban.chuc_vu_nguoi_ky = chuc_vu_nguoi_ky
    if noi_nhan is not None:
        van_ban.noi_nhan = noi_nhan
    if muc_do_khan is not None:
        van_ban.muc_do_khan = muc_do_khan
    if han_tra_loi is not None:
        van_ban.han_tra_loi = han_tra_loi
    if so_luong_ban_phat_hanh is not None:
        van_ban.so_luong_ban_phat_hanh = so_luong_ban_phat_hanh
    if stt_trong_ho_so is not None:
        van_ban.stt_trong_ho_so = stt_trong_ho_so
    if ma_ho_so is not None:
        van_ban.ma_ho_so = ma_ho_so
    # ------------------------------------------------------------

    db.commit()
    db.refresh(van_ban)

    if files:
        upload_dir = Path("uploads") / "van_ban_di" / str(van_ban.id)
        upload_dir.mkdir(parents=True, exist_ok=True)

        for file in files:
            file_bytes = await file.read()
            file_path = upload_dir / file.filename
            with open(file_path, "wb") as f:
                f.write(file_bytes)

            ext = Path(file.filename).suffix.lower().lstrip('.')
            normalized_path = str(file_path).replace("\\", "/")
            file_record = FileDinhKem(
                loai_van_ban="VAN_BAN_DI",
                van_ban_id=van_ban.id,
                ten_file=file.filename,
                duong_dan=normalized_path,
                dinh_dang=ext or None,
                dung_luong=float(len(file_bytes) / 1024),
            )
            db.add(file_record)

        db.commit()

    db.refresh(van_ban)  # Cập nhật danh sách file mới nhất trả về cho UI
    return van_ban


@router.delete("/{id}")
def xoa_van_ban_di(id: int, db: Session = Depends(get_db), nguoi_dung: TaiKhoan = Depends(lay_nguoi_dung_hien_tai)):
    van_ban = db.query(VanBanDi).filter(VanBanDi.id == id).first()
    if not van_ban:
        raise HTTPException(
            status_code=404, detail="Không tìm thấy văn bản đi")

    db.delete(van_ban)
    db.commit()
    return {"message": "Xóa văn bản đi thành công"}


# Bỏ response_model=list[VanBanDiResponse] để trả về cấu trúc mới
@router.get("/")
def lay_danh_sach_van_ban_di(
    page: int = 1,
    size: int = 10,
    keyword: str = "",  # Hỗ trợ tìm kiếm từ khóa
    db: Session = Depends(get_db),
    nguoi_dung: TaiKhoan = Depends(lay_nguoi_dung_hien_tai)
):
    query = db.query(VanBanDi).options(joinedload(VanBanDi.tep_dinh_kems))

    # Lọc theo từ khóa nếu có và không phải chuỗi trắng
    if keyword and keyword.strip():
        safe_keyword = keyword.strip()
        query = query.filter(
            VanBanDi.trich_yeu.contains(safe_keyword) |
            VanBanDi.so_ky_hieu.contains(safe_keyword)
        )

    total = query.count()
    danh_sach = query.offset((page - 1) * size).limit(size).all()

    return {"data": danh_sach, "total": total}


@router.put("/{id}/trang-thai")
def cap_nhat_trang_thai(
    id: int,
    data: TrangThaiUpdate,
    db: Session = Depends(get_db),
    nguoi_dung: TaiKhoan = Depends(lay_nguoi_dung_hien_tai)
):
    van_ban_di = get_van_ban_di(db, id)
    result = apply_status_transition(
        van_ban_di, data.trang_thai, db, nguoi_dung)
    db.commit()
    db.refresh(van_ban_di)

    return {
        "message": "Cập nhật trạng thái thành công!",
        "trang_thai_moi": van_ban_di.trang_thai,
        "lien_thong_thanh_cong": data.trang_thai == 'PUBLISHED' and trang_thai_cu != 'PUBLISHED'
    }

# =====================================================================
# PHẦN KHÁNH BỔ SUNG: API TRÌNH DUYỆT & LÃNH ĐẠO PHÊ DUYỆT VĂN BẢN ĐI
# =====================================================================
from datetime import datetime
from pydantic import BaseModel

# Khai báo cấu trúc dữ liệu khi lãnh đạo phê duyệt / từ chối
class DuyetVanBanDiRequest(BaseModel):
    duyet: bool  # True nếu đồng ý, False nếu từ chối
    ly_do_tu_choi: Optional[str] = None
    so_ky_hieu: Optional[str] = None  # Nếu duyệt thì cấp luôn số ký hiệu chính thức (Ví dụ: 45/QĐ-UBND)

# 1. API Trình duyệt văn bản (Chuyển từ DRAFT lên PENDING_APPROVAL)
@router.patch("/{id}/trinh-duyet")
def trinh_duyet_van_ban_di(
    id: int,
    db: Session = Depends(get_db),
    nguoi_dung: TaiKhoan = Depends(lay_nguoi_dung_hien_tai)
):
    van_ban = db.query(VanBanDi).filter(VanBanDi.id == id).first()
    if not van_ban:
        raise HTTPException(status_code=404, detail="Không tìm thấy văn bản đi để trình duyệt!")
        
    if van_ban.trang_thai != "DRAFT":
        raise HTTPException(status_code=400, detail="Chỉ văn bản ở trạng thái Dự thảo (DRAFT) mới có thể trình duyệt!")
        
    van_ban.trang_thai = "PENDING_APPROVAL"
    db.commit()
    return {"message": "Đã trình duyệt văn bản lên lãnh đạo thành công!"}

# 2. API Lành đạo Phê duyệt hoặc Từ chối bản dự thảo văn bản đi
@router.patch("/{id}/phe-duyet")
def phe_duyet_van_ban_di(
    id: int,
    data: DuyetVanBanDiRequest,
    db: Session = Depends(get_db),
    nguoi_dung: TaiKhoan = Depends(lay_nguoi_dung_hien_tai)
):
    van_ban = db.query(VanBanDi).filter(VanBanDi.id == id).first()
    if not van_ban:
        raise HTTPException(status_code=404, detail="Không tìm thấy văn bản đi cần phê duyệt!")
        
    if van_ban.trang_thai != "PENDING_APPROVAL":
        raise HTTPException(status_code=400, detail="Văn bản này hiện không nằm trong danh sách chờ duyệt!")

    if data.duyet:
        # TRƯỜNG HỢP 1: LÃNH ĐẠO ĐỒNG Ý PHÊ DUYỆT
        if not data.so_ky_hieu:
            raise HTTPException(status_code=400, detail="Khi phê duyệt phát hành bắt buộc phải cấp Số/Ký hiệu văn bản!")
            
        van_ban.trang_thai = "PUBLISHED"
        van_ban.so_ky_hieu = data.so_ky_hieu
        van_ban.ngay_ban_hanh = date.today() # Gán ngày ban hành chính thức là ngày hôm nay
        
        try:
            max_so_den = db.query(func.max(VanBanDen.so_den)).scalar() or 0
            
            # Tìm họ tên lãnh đạo đang duyệt để ghi nhận người ký
            ten_nguoi_ky = ""
            can_bo_ky = db.query(CanBo).filter(CanBo.id == nguoi_dung.can_bo_id).first()
            if can_bo_ky:
                ten_nguoi_ky = can_bo_ky.ho_ten
                van_ban.chuc_vu_nguoi_ky = can_bo_ky.chuc_vu

            van_ban_den_moi = VanBanDen(
                so_den=max_so_den + 1,
                ky_hieu=data.so_ky_hieu,
                ngay_den=date.today(),
                ngay_ban_hanh=date.today(),
                co_quan_ban_hanh_id=van_ban.don_vi_soan_thao_id,
                ma_loai_vb_id=van_ban.ma_loai_vb_id,
                trich_yeu=van_ban.trich_yeu,
                so_trang=van_ban.so_trang,
                ho_ten_nguoi_ky=ten_nguoi_ky,
                chuc_vu_nguoi_ky=van_ban.chuc_vu_nguoi_ky,
                do_khan=van_ban.muc_do_khan,
                don_vi_nhan=van_ban.noi_nhan,
                trang_thai_xu_ly='CHO_XU_LY'
            )
            db.add(van_ban_den_moi)
            db.flush()

            # Copy file đính kèm sang văn bản đến liên thông
            tep_dinh_kems = db.query(FileDinhKem).filter(
                FileDinhKem.van_ban_id == van_ban.id,
                FileDinhKem.loai_van_ban == 'VAN_BAN_DI'
            ).all()

            for tep in tep_dinh_kems:
                db.add(FileDinhKem(
                    loai_van_ban='VAN_BAN_DEN',
                    van_ban_id=van_ban_den_moi.id,
                    ten_file=tep.ten_file,
                    duong_dan=tep.duong_dan,
                    dinh_dang=tep.dinh_dang,
                    dung_luong=tep.dung_luong
                ))
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Lỗi liên thông khi phê duyệt: {str(e)}")
            
    else:
        # TRƯỜNG HỢP 2: LÃNH ĐẠO TỪ CHỐI DUYỆT (Trả lại về DRAFT để sửa đổi)
        if not data.ly_do_tu_choi:
            raise HTTPException(status_code=400, detail="Vui lòng nhập lý do từ chối phê duyệt!")
            
        van_ban.trang_thai = "DRAFT"
        van_ban.ghi_chu = f" Bị từ chối duyệt. Lý do: {data.ly_do_tu_choi}"

    db.commit()
    db.refresh(van_ban)
    return {
        "message": "Xử lý phê duyệt văn bản đi thành công!",
        "trang_thai_hien_tai": van_ban.trang_thai
    }
    return result
