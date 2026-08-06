from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from config.database import get_db
from app.dependencies import lay_nguoi_dung_hien_tai
from app.models.document import QuyetDinh, ThanhPhanQuyetDinh
from app.schemas.quyet_dinh_schema import QuyetDinhCreate, QuyetDinhResponse, ThanhPhanQuyetDinhCreate, ThanhPhanQuyetDinhResponse
from app.models.auth import TaiKhoan

router = APIRouter(
    prefix="/api/quyet-dinh",
    tags=["Quyết định"]
)


@router.post("/", response_model=QuyetDinhResponse)
def tao_quyet_dinh(data: QuyetDinhCreate, db: Session = Depends(get_db), nguoi_dung: TaiKhoan = Depends(lay_nguoi_dung_hien_tai)):
    # Tạo quyết định dùng người tạo hiện tại để tránh client can thiệp
    qd_payload = {k: v for k, v in data.model_dump().items() if k != 'thanh_phan' and k != 'nguoi_tao_id'}
    qd_payload['nguoi_tao_id'] = nguoi_dung.id

    existing = db.query(QuyetDinh).filter(QuyetDinh.van_ban_di_id == data.van_ban_di_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Văn bản đi này đã có quyết định được tạo trước đó.")

    qd = QuyetDinh(**qd_payload)
    db.add(qd)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Văn bản đi này đã có quyết định được tạo trước đó.")
    db.refresh(qd)

    # Thêm thành phần nếu có
    if data.thanh_phan:
        for idx, tp in enumerate(data.thanh_phan, start=1):
            tp_dict = tp.model_dump()
            tp_obj = ThanhPhanQuyetDinh(
                quyet_dinh_id=qd.id,
                ho_ten=tp_dict.get('ho_ten'),
                ten_don_vi=tp_dict.get('ten_don_vi'),
                chuc_vu=tp_dict.get('chuc_vu'),
                vai_tro_quyet_dinh_id=tp_dict.get('vai_tro_quyet_dinh_id'),
                noi_dung_lien_quan=tp_dict.get('noi_dung_lien_quan'),
                thu_tu=tp_dict.get('thu_tu') or idx,
                ghi_chu=tp_dict.get('ghi_chu'),
                can_bo_id=tp_dict.get('can_bo_id')
            )
            db.add(tp_obj)
        db.commit()

    db.refresh(qd)
    return qd


@router.get("/{qd_id}", response_model=QuyetDinhResponse)
def lay_quyet_dinh(qd_id: int, db: Session = Depends(get_db), nguoi_dung: TaiKhoan = Depends(lay_nguoi_dung_hien_tai)):
    qd = db.query(QuyetDinh).filter(QuyetDinh.id == qd_id).first()
    if not qd:
        raise HTTPException(status_code=404, detail="Không tìm thấy quyết định")
    return qd


@router.get("/")
def lay_danh_sach_quyet_dinh(db: Session = Depends(get_db), nguoi_dung: TaiKhoan = Depends(lay_nguoi_dung_hien_tai)):
    danh_sach = db.query(QuyetDinh).all()
    return danh_sach
