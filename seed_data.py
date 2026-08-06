import sys
import random
from datetime import date, timedelta
from pathlib import Path
ROOT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT_DIR))

from config.database import SessionLocal
from app.models.core import CoQuanToChuc, DanhMucLoaiVb, HoSo, ViTriLuuTru
from app.models.auth import CanBo
from app.models.document import VanBanDen, VanBanDi


def seed_data():
    db = SessionLocal()

    try:
        print("⏳ Đang kiểm tra và tạo dữ liệu nền tảng đa dạng (Danh mục, Cơ quan, Cán bộ, Hồ sơ)...")

        # 1. Tạo nhiều Cơ quan (để test dropdown)
        co_quans = db.query(CoQuanToChuc).all()
        if not co_quans:
            ds_co_quan = [
                ("UBND Thành phố Cần Thơ", "UBND-CT", "Cần Thơ"),
                ("Sở Thông tin và Truyền thông", "STTTT-CT", "Số 2, Cần Thơ"),
                ("Sở Y tế", "SYT-CT", "Số 3, Cần Thơ"),
                ("Sở Giáo dục và Đào tạo", "SGDDT-CT", "Số 4, Cần Thơ"),
                ("Sở Kế hoạch và Đầu tư", "SKHDT-CT", "Số 5, Cần Thơ")
            ]
            for ten, ma, dc in ds_co_quan:
                db.add(CoQuanToChuc(ten_co_quan=ten, organ_id=ma, dia_chi=dc))
            db.commit()
            co_quans = db.query(CoQuanToChuc).all()

        # 2. Tạo nhiều Loại văn bản
        loai_vbs = db.query(DanhMucLoaiVb).all()
        if not loai_vbs:
            ds_loai_vb = ["Quyết định", "Thông báo", "Công văn",
                          "Tờ trình", "Báo cáo", "Chỉ thị", "Kế hoạch"]
            for ten in ds_loai_vb:
                db.add(DanhMucLoaiVb(ten_loai_vb=ten,
                       mo_ta=f"Mô tả cho {ten}"))
            db.commit()
            loai_vbs = db.query(DanhMucLoaiVb).all()

        # 3. Tạo nhiều Cán bộ
        can_bos = db.query(CanBo).all()
        if not can_bos:
            ds_can_bo = [
                ("Nguyễn Văn Lãnh Đạo", "Chủ tịch", co_quans[0].id),
                ("Trần Thị Giám Đốc", "Giám đốc Sở", co_quans[1].id),
                ("Lê Văn Trưởng Phòng", "Trưởng phòng", co_quans[2].id),
                ("Phạm Thị Phó Giám Đốc", "Phó Giám đốc", co_quans[3].id),
                ("Hoàng Văn Chuyên Viên", "Chuyên viên", co_quans[4].id)
            ]
            for ten, chuc_vu, cq_id in ds_can_bo:
                db.add(CanBo(ho_ten=ten, chuc_vu=chuc_vu, co_quan_id=cq_id))
            db.commit()
            can_bos = db.query(CanBo).all()

        # 4. Tạo nhiều Vị trí lưu trữ
        vi_tris = db.query(ViTriLuuTru).all()
        if not vi_tris:
            for i in range(1, 4):
                db.add(ViTriLuuTru(
                    toa_nha="Tòa A", phong=f"10{i}", ke_tu=f"0{i}", ngan_tang="1", so_hop=f"H{i}"))
            db.commit()
            vi_tris = db.query(ViTriLuuTru).all()

        # 5. Tạo nhiều Hồ sơ lưu trữ với các trạng thái khác nhau
        ho_sos = db.query(HoSo).all()
        if not ho_sos:
            ds_ho_so = [
                ("HS-2026-001", "Hồ sơ dự án CNTT năm 2026", "DANG_MO"),
                ("HS-2026-002", "Hồ sơ mua sắm thiết bị y tế", "DANG_MO"),
                ("HS-2025-099", "Hồ sơ thanh tra giáo dục 2025", "DA_DONG"),
                ("HS-2026-005", "Hồ sơ quy hoạch đô thị", "DANG_MO"),
                ("HS-2024-001", "Hồ sơ khen thưởng 2024", "DA_DONG")
            ]
            for ma, tieu_de, tt in ds_ho_so:
                db.add(HoSo(ma_ho_so=ma, tieu_de_ho_so=tieu_de,
                       vi_tri_id=random.choice(vi_tris).id, trang_thai=tt))
            db.commit()
            ho_sos = db.query(HoSo).all()

        # 6. Tạo 20 dòng Văn bản đến (Random dữ liệu)
        print("⏳ Đang tạo 20 dữ liệu mẫu cho Văn bản đến...")
        if db.query(VanBanDen).count() == 0:
            trang_thais_den = ["CHO_XU_LY", "DANG_XU_LY", "DA_XU_LY"]
            for i in range(1, 21):
                cq = random.choice(co_quans)
                lvb = random.choice(loai_vbs)
                hs = random.choice(ho_sos)

                vb_den = VanBanDen(
                    so_den=i,
                    ky_hieu=f"{i:03d}/{lvb.ten_loai_vb[:2].upper()}-{cq.organ_id.split('-')[0]}",
                    ngay_den=date.today() - timedelta(days=random.randint(1, 30)),
                    ngay_ban_hanh=date.today() - timedelta(days=random.randint(31, 60)),
                    co_quan_ban_hanh_id=cq.id,
                    ma_loai_vb_id=lvb.id,
                    trich_yeu=f"Văn bản số {i} về việc chỉ đạo, điều hành công tác tháng {random.randint(1, 12)}/2026",
                    ngon_ngu="Tiếng Việt",
                    so_trang=random.randint(1, 15),
                    ho_ten_nguoi_ky=f"Người ký {i}",
                    chuc_vu_nguoi_ky=random.choice(
                        ["Chủ tịch", "Giám đốc", "Phó Giám đốc", "Trưởng phòng"]),
                    linh_vuc=random.choice(
                        ["Hành chính", "CNTT", "Y tế", "Giáo dục", "Tài chính"]),
                    do_khan=random.randint(1, 4),
                    don_vi_nhan="Phòng Hành chính, Phòng IT",
                    han_giai_quyet=date.today() + timedelta(days=random.randint(5, 20)),
                    ma_ho_so=hs.ma_ho_so,
                    # Random trạng thái để vẽ biểu đồ
                    trang_thai_xu_ly=random.choice(trang_thais_den)
                )
                db.add(vb_den)

        # 7. Tạo 20 dòng Văn bản đi (Random dữ liệu)
        print("⏳ Đang tạo 20 dữ liệu mẫu cho Văn bản đi...")
        if db.query(VanBanDi).count() == 0:
            trang_thais_di = [
                "DRAFT", "PENDING_APPROVAL", "PUBLISHED", "REVOKED"]
            for i in range(1, 21):
                cq = random.choice(co_quans)
                lvb = random.choice(loai_vbs)
                cb = random.choice(can_bos)
                hs = random.choice(ho_sos)

                vb_di = VanBanDi(
                    so_ky_hieu=f"VB/{date.today().year}/{i:03d}",
                    ngay_ban_hanh=date.today() - timedelta(days=random.randint(0, 20)),
                    trich_yeu=f"{lvb.ten_loai_vb} số {i} về hoạt động chuyên môn của {cq.ten_co_quan}",
                    don_vi_soan_thao_id=cq.id,
                    ma_loai_vb_id=lvb.id,
                    ngon_ngu="Tiếng Việt",
                    so_trang=random.randint(1, 20),
                    nguoi_ky_id=cb.id,
                    chuc_vu_nguoi_ky=cb.chuc_vu,
                    noi_nhan=random.choice(
                        ["Các phòng ban", "Sở ban ngành", "UBND cấp huyện"]),
                    muc_do_khan=random.randint(1, 5),
                    han_tra_loi=date.today() + timedelta(days=random.randint(10, 30)),
                    so_luong_ban_phat_hanh=random.randint(5, 50),
                    ma_ho_so=hs.ma_ho_so,
                    trang_thai=random.choice(
                        trang_thais_di)  # Random trạng thái
                )
                db.add(vb_di)

        db.commit()
        print("✅ THÀNH CÔNG! Đã bơm dữ liệu 20 dòng siêu đa dạng. Mở trình duyệt lên test thôi!")

    except Exception as e:
        db.rollback()
        print(f"❌ Xảy ra lỗi trong quá trình tạo dữ liệu: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_data()
