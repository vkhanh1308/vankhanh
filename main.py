from fastapi import FastAPI
from config.database import Base, engine
from fastapi.middleware.cors import CORSMiddleware
# 1. Import CÁC MODELS MỚI (chỉ cần 3 file này là đủ 16 bảng)
from app.models import auth, core, document

from fastapi.staticfiles import StaticFiles

# 2. Import các routes (Tạm tắt các file chưa sửa)
from app.routes import auth_routes
from app.routes import tai_khoan_routes
from app.routes import co_quan_routes
from app.routes import danh_muc_routes
from app.routes import ho_so_routes
from app.routes import van_ban_di_routes
from app.routes import van_ban_den_routes
from app.routes import tep_dinh_kem_routes
from app.routes import can_bo_routes
from app.routes import vi_tri_routes
from app.routes import thong_ke_routes
from app.routes import quyet_dinh_routes
from app.routes import danh_muc_vai_tro_quyet_dinh_routes
from app.routes import ocr_routes

# 3. Khởi tạo ứng dụng FastAPI
app = FastAPI(title="Document Management System (DMS)")

Base.metadata.create_all(bind=engine)

origins = [
    "http://localhost:5173",  # Cổng chạy Vite ReactJS của bạn
    "http://127.0.0.1:5173",
    "http://localhost:5174",  # Vite may select 5174 if 5173 is in use
    "http://127.0.0.1:5174",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Cho phép mọi phương thức GET, POST, PUT, DELETE
    # Cho phép mọi header (bao gồm cả Authorization chứa Token)
    allow_headers=["*"],

)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# 4. Đăng ký các API Routes (Chỉ bật 2 API đã sửa)
app.include_router(auth_routes.router)
app.include_router(tai_khoan_routes.router)
app.include_router(co_quan_routes.router)
app.include_router(danh_muc_routes.router)
app.include_router(ho_so_routes.router)
app.include_router(van_ban_di_routes.router)
app.include_router(van_ban_den_routes.router)
app.include_router(tep_dinh_kem_routes.router)
app.include_router(can_bo_routes.router)
app.include_router(vi_tri_routes.router)
app.include_router(thong_ke_routes.router)
app.include_router(quyet_dinh_routes.router)
app.include_router(danh_muc_vai_tro_quyet_dinh_routes.router)
app.include_router(ocr_routes.router)


@app.get("/")
def read_root():
    return {"message": "Hệ thống DMS đã khởi động với kiến trúc 16 bảng mới!"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)