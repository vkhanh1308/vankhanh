from config.database import engine, Base
from sqlalchemy import text
# Import toàn bộ model để SQLAlchemy nhận diện được các bảng
from app.models import auth, core, document

print("Đang dọn dẹp và xóa toàn bộ bảng cũ trong PostgreSQL...")

# Xóa tất cả bảng với CASCADE (xóa constraints)
with engine.begin() as connection:
    connection.execute(text("DROP SCHEMA public CASCADE"))
    connection.execute(text("CREATE SCHEMA public"))

print("Đang khởi tạo lại cấu trúc bảng mới chuẩn xịn...")
Base.metadata.create_all(bind=engine)

print("Hoàn tất! Database đã được dọn sạch và cập nhật cấu trúc thành công.")
