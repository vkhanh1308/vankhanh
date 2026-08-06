import requests
from config.database import SessionLocal
from app.models.document import DanhMucLoaiQuyetDinh, DanhMucVaiTroQuyetDinh, VanBanDi
from app.models.auth import TaiKhoan

BASE = 'http://127.0.0.1:8000'

s = SessionLocal()
try:
    # Ensure there's a DanhMucLoaiQuyetDinh
    loai = s.query(DanhMucLoaiQuyetDinh).first()
    if not loai:
        loai = DanhMucLoaiQuyetDinh(ma_loai_quyet_dinh='QD-DEFAULT', ten_loai_quyet_dinh='Quyết định mặc định')
        s.add(loai)
        s.commit()
        s.refresh(loai)

    # Ensure there's a DanhMucVaiTroQuyetDinh
    vtro = s.query(DanhMucVaiTroQuyetDinh).first()
    if not vtro:
        vtro = DanhMucVaiTroQuyetDinh(ma_vai_tro='TP-DEFAULT', ten_vai_tro='Thành phần mặc định')
        s.add(vtro)
        s.commit()
        s.refresh(vtro)

    # Pick a VanBanDi
    vb = s.query(VanBanDi).first()
    if not vb:
        raise SystemExit('Không tìm thấy văn bản đi nào để gán quyết định; hãy chạy seed_data.py trước.')

    # Get admin credentials
    admin = s.query(TaiKhoan).filter(TaiKhoan.ten_dang_nhap == 'admin').first()
    if not admin:
        raise SystemExit('Không tìm thấy tài khoản admin; hãy chạy seed_admin.py')

    # Login to get token
    resp = requests.post(f"{BASE}/api/auth/login", data={"username":"admin","password":"123456"})
    resp.raise_for_status()
    token = resp.json().get('access_token')
    print('Got token', token[:20] + '...')

    headers = {'Authorization': f'Bearer {token}'}

    payload = {
        'van_ban_di_id': vb.id,
        'loai_quyet_dinh_id': loai.id,
        'ngay_hieu_luc': None,
        'nguoi_tao_id': admin.id,
        'thanh_phan': [
            {
                'ho_ten': 'Nguyễn Văn A',
                'ten_don_vi': 'Phòng Hành chính',
                'chuc_vu': 'Trưởng phòng',
                'vai_tro_quyet_dinh_id': vtro.id,
                'noi_dung_lien_quan': 'Chuẩn bị hồ sơ'
            }
        ]
    }

    r = requests.post(f"{BASE}/api/quyet-dinh/", json=payload, headers=headers)
    print('Create status:', r.status_code)
    try:
        print(r.json())
    except Exception:
        print(r.text)

finally:
    s.close()
