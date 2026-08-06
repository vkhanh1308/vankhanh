from pathlib import Path

_model_cache = {
    'yolo': None,
    'ocr_predictor': None,
    'Image': None,
}


def _load_ocr_models():
    if _model_cache['yolo'] is not None and _model_cache['ocr_predictor'] is not None:
        return _model_cache['yolo'], _model_cache['ocr_predictor'], _model_cache['Image']

    try:
        import torch
        from PIL import Image
        from ultralytics import YOLO
        from vietocr.tool.config import Cfg
        from vietocr.tool.predictor import Predictor

        # Pillow 10+ đã xoá PIL.Image.ANTIALIAS, một số thư viện cũ vẫn dùng thuộc tính này
        if not hasattr(Image, 'ANTIALIAS'):
            Image.ANTIALIAS = Image.Resampling.LANCZOS
    except ModuleNotFoundError as e:
        raise RuntimeError(
            "Thiếu thư viện OCR. Vui lòng cài đặt torch, ultralytics, vietocr và pillow. "
            f"Chi tiết: {e.name}"
        ) from e

    root_dir = Path(__file__).resolve().parent
    model_path = root_dir / 'best.pt'
    if not model_path.exists():
        raise FileNotFoundError(f"Không tìm thấy mô hình YOLO tại {model_path}")

    yolo_model = YOLO(str(model_path))
    config = Cfg.load_config_from_name('vgg_transformer')
    config['device'] = 'cuda:0' if torch.cuda.is_available() else 'cpu'
    config['predictor']['beamsearch'] = False
    ocr_predictor = Predictor(config)

    _model_cache['yolo'] = yolo_model
    _model_cache['ocr_predictor'] = ocr_predictor
    _model_cache['Image'] = Image
    return yolo_model, ocr_predictor, Image


# ==========================================
# 2. HÀM XỬ LÝ TRÍCH XUẤT THÔNG TIN
# ==========================================
def process_document(image_path):
    yolo_model, ocr_predictor, Image = _load_ocr_models()

    img_pil = Image.open(image_path)
    results = yolo_model(image_path)[0]

    extracted_results = []

    for box in results.boxes:
        x1, y1, x2, y2 = map(int, box.xyxy[0])
        cls_id = int(box.cls[0])
        label = results.names[cls_id]
        conf = float(box.conf[0])

        cropped_crop = img_pil.crop((x1, y1, x2, y2))
        recognized_text = ocr_predictor.predict(cropped_crop)

        extracted_results.append({
            'label': label,
            'text': recognized_text,
            'confidence': round(conf, 2),
            'box': [x1, y1, x2, y2]
        })

    return extracted_results
    # Mở ảnh bằng PIL
    img_pil = Image.open(image_path)

    # 1. Chạy YOLOv8 để phát hiện các vùng nhãn (TenCoQuan, SoKyHieu, NgayThang,...)
    results = yolo_model(image_path)[0]

    extracted_results = []

    # 2. Lặp qua từng vùng phát hiện được
    for box in results.boxes:
        # Lấy tọa độ khung (x1, y1, x2, y2)
        x1, y1, x2, y2 = map(int, box.xyxy[0])
        
        # Lấy tên nhãn (Class Name) và độ tin cậy (Confidence score)
        cls_id = int(box.cls[0])
        label = results.names[cls_id]
        conf = float(box.conf[0])

        # 3. Cắt (Crop) mảnh ảnh tương ứng từ ảnh gốc
        cropped_crop = img_pil.crop((x1, y1, x2, y2))

        # 4. Đưa mảnh ảnh vừa cắt vào VietOCR để nhận diện chữ
        recognized_text = ocr_predictor.predict(cropped_crop)

        # Lưu kết quả
        extracted_results.append({
            "label": label,
            "text": recognized_text,
            "confidence": round(conf, 2),
            "box": [x1, y1, x2, y2]
        })

    return extracted_results


# ==========================================
# 3. CHẠY THỬ VÀ IN KẾT QUẢ
# ==========================================
if __name__ == "__main__":
    # Thay đường dẫn tới ảnh tài liệu/công văn bạn muốn test
    test_image = "duong_dan_anh_cua_ban.jpg"

    # Chạy trích xuất
    results = process_document(test_image)

    # In kết quả ra màn hình
    print("\n=== KẾT QUẢ TRÍCH XUẤT THÔNG TIN ===")
    for item in results:
        print(f" [{item['label']}]: {item['text']} (Độ tin cậy: {item['confidence']})")