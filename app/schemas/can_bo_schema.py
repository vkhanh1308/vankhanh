from pydantic import BaseModel
from typing import Optional


class CanBoBase(BaseModel):
    ho_ten: str
    chuc_vu: Optional[str] = None
    co_quan_id: int


class CanBoCreate(CanBoBase):
    pass


class CanBoUpdate(CanBoBase):
    pass


class CanBoResponse(CanBoBase):
    id: int

    class Config:
        from_attributes = True
        
from pydantic import BaseModel

class CanBoCreate(BaseModel):
    # Cậu dán tạm cái này vào để Python nó nhận diện trước nha
    pass

class CanBoUpdate(CanBoCreate):
    pass