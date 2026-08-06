from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from config.database import get_db
from app.models.document import DanhMucVaiTroQuyetDinh
from app.schemas.danh_muc_schema import DanhMucVaiTroQuyetDinhResponse
from app.dependencies import lay_nguoi_dung_hien_tai
from app.models.auth import TaiKhoan

router = APIRouter(
    prefix="/api/danh-muc-vai-tro-quyet-dinh",
    tags=["Danh mục Vai trò Quyết định"]
)


@router.get("/", response_model=list[DanhMucVaiTroQuyetDinhResponse])
def lay_danh_sach_vai_tro_quyet_dinh(
    db: Session = Depends(get_db),
    nguoi_dung: TaiKhoan = Depends(lay_nguoi_dung_hien_tai)
):
    return db.query(DanhMucVaiTroQuyetDinh).all()
