from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class OCRExtractedItemResponse(BaseModel):
    id: int
    label: str
    text: str
    confidence: float
    x1: int
    y1: int
    x2: int
    y2: int
    order: int

    class Config:
        from_attributes = True


class OCRJobResponse(BaseModel):
    id: int
    file_name: str
    file_path: str
    status: str
    loai_van_ban: Optional[str] = None
    van_ban_id: Optional[int] = None
    full_text: Optional[str] = None
    error_message: Optional[str] = None
    created_at: datetime
    processed_at: Optional[datetime] = None
    extracted_items: List[OCRExtractedItemResponse] = Field(default_factory=list)

    class Config:
        from_attributes = True
