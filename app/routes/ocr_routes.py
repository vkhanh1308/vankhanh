from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from app.dependencies import lay_nguoi_dung_hien_tai
from config.database import get_db
from app.models.document import OCRJob, OCRExtractedItem
from app.schemas.ocr_schema import OCRJobResponse
from ocr_processor import process_document
from pathlib import Path
from datetime import datetime

router = APIRouter(
    prefix="/api/ocr",
    tags=["OCR"]
)

UPLOAD_DIR = Path("uploads/ocr")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

SUPPORTED_EXTENSIONS = {"jpg", "jpeg", "png", "bmp", "tif", "tiff"}


@router.post("/process", response_model=OCRJobResponse)
def process_ocr(
    file: UploadFile = File(...),
    loai_van_ban: str | None = None,
    van_ban_id: int | None = None,
    db: Session = Depends(get_db),
    nguoi_dung = Depends(lay_nguoi_dung_hien_tai)
):
    filename = Path(file.filename).name
    extension = filename.split('.')[-1].lower() if '.' in filename else ''
    if extension not in SUPPORTED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Chỉ hỗ trợ ảnh JPG/PNG/BMP/TIFF cho OCR.")

    upload_path = UPLOAD_DIR / f"{int(datetime.utcnow().timestamp() * 1000)}_{filename}"

    try:
        with upload_path.open('wb') as buffer:
            buffer.write(file.file.read())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Không thể lưu file OCR: {str(e)}")

    ocr_job = OCRJob(
        file_name=filename,
        file_path=str(upload_path).replace('\\', '/'),
        status="PROCESSING",
        loai_van_ban=loai_van_ban,
        van_ban_id=van_ban_id,
        created_at=datetime.utcnow()
    )
    db.add(ocr_job)
    db.commit()
    db.refresh(ocr_job)

    try:
        extracted_results = process_document(str(upload_path))
        full_text = "\n".join(item['text'] for item in extracted_results)

        for idx, item in enumerate(extracted_results, start=1):
            record = OCRExtractedItem(
                ocr_job_id=ocr_job.id,
                label=item.get('label', ''),
                text=item.get('text', ''),
                confidence=item.get('confidence', 0.0),
                x1=item['box'][0],
                y1=item['box'][1],
                x2=item['box'][2],
                y2=item['box'][3],
                order=idx
            )
            db.add(record)

        ocr_job.full_text = full_text
        ocr_job.status = "COMPLETED"
        ocr_job.processed_at = datetime.utcnow()
        db.commit()
        db.refresh(ocr_job)
        return ocr_job
    except Exception as e:
        db.rollback()
        ocr_job.status = "FAILED"
        ocr_job.error_message = str(e)
        ocr_job.processed_at = datetime.utcnow()
        db.add(ocr_job)
        db.commit()
        raise HTTPException(status_code=500, detail=f"Lỗi OCR: {str(e)}")


@router.get("/{job_id}", response_model=OCRJobResponse)
def get_ocr_job(job_id: int, db: Session = Depends(get_db), nguoi_dung = Depends(lay_nguoi_dung_hien_tai)):
    ocr_job = db.query(OCRJob).filter(OCRJob.id == job_id).first()
    if not ocr_job:
        raise HTTPException(status_code=404, detail="Không tìm thấy job OCR")
    return ocr_job
