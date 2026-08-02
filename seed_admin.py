from sqlalchemy.orm import Session
from config.database import SessionLocal
from app.models.auth import TaiKhoan, VaiTro
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def seed_data():
    db = SessionLocal()
    try:
        print("Đang kiểm tra và khởi tạo dữ liệu gốc...")

        # 1. Tạo các Vai trò (Roles) mặc định nếu chưa có
        cac_vai_tro = [
            {"ma": "ADMIN", "ten": "Quản trị viên"},
            {"ma": "VAN_THU", "ten": "Văn thư"},
            {"ma": "LANH_DAO", "ten": "Lãnh đạo"},
            {"ma": "CHUYEN_VIEN", "ten": "Chuyên viên"}
        ]

        for vt in cac_vai_tro:
            ton_tai = db.query(VaiTro).filter(
                VaiTro.ma_vai_tro == vt["ma"]).first()
            if not ton_tai:
                vai_tro_moi = VaiTro(
                    ma_vai_tro=vt["ma"], ten_vai_tro=vt["ten"])
                db.add(vai_tro_moi)
                print(f" [+] Đã tạo quyền: {vt['ten']}")
        db.commit()

        # 2. Tạo tài khoản Admin tối cao nếu chưa có
        admin_exist = db.query(TaiKhoan).filter(
            TaiKhoan.ten_dang_nhap == "admin").first()
        if not admin_exist:
            # Lấy quyền ADMIN vừa tạo
            quyen_admin = db.query(VaiTro).filter(
                VaiTro.ma_vai_tro == "ADMIN").first()

            # Tạo tài khoản
            tai_khoan_admin = TaiKhoan(
                ten_dang_nhap="admin",
                mat_khau_hash=pwd_context.hash("123456"),  # Mật khẩu mặc định
                trang_thai="ACTIVE"
            )
            # Gắn quyền cho tài khoản
            tai_khoan_admin.vai_tros.append(quyen_admin)

            db.add(tai_khoan_admin)
            db.commit()
            print(" [★] TẠO THÀNH CÔNG TÀI KHOẢN GỐC: admin / 123456")
        else:
            print(" [*] Tài khoản admin đã tồn tại, không cần tạo mới.")

    except Exception as e:
        print(f"Lỗi khi gieo mầm dữ liệu: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_data()
