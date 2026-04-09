"""Serviço de detecção de roupas usando YOLO."""

import logging
from typing import Optional, Tuple

import numpy as np
from PIL import Image
from ultralytics import YOLO

logger = logging.getLogger(__name__)

# Classes COCO que mapeiam para roupas esportivas
# YOLO COCO: person=0 — Não existe classe específica para roupas no COCO
# Usamos um modelo customizado de detecção de moda ou fallback para crop central
FASHION_CLASSES = {
    "camiseta": ["shirt", "t-shirt"],
    "calca": ["pants", "trousers"],
    "short": ["shorts"],
    "jaqueta": ["jacket", "coat"],
    "tenis": ["shoe", "sneaker"],
    "top_esportivo": ["top", "crop top"],
}

# Mapeamento de classes COCO para categorias de roupa
COCO_FASHION_MAP = {
    0: "pessoa",  # person — usamos para fallback
}


class YoloService:
    """Detecta peças de roupa em imagens usando YOLO."""

    def __init__(self) -> None:
        self._model: Optional[YOLO] = None

    def _load_model(self) -> YOLO:
        if self._model is None:
            logger.info("Carregando modelo YOLOv8n...")
            self._model = YOLO("yolov8n.pt")
            logger.info("Modelo YOLO carregado com sucesso.")
        return self._model

    def detect_and_crop(self, image: Image.Image) -> Tuple[Image.Image, str]:
        """Detecta a peça principal na imagem e retorna o crop + categoria.

        Se YOLO não encontrar uma peça reconhecida, faz crop central
        assumindo que a roupa é o foco da foto.
        """
        model = self._load_model()
        img_array = np.array(image.convert("RGB"))

        results = model(img_array, verbose=False)

        best_box = None
        best_conf = 0.0
        best_label = ""

        for result in results:
            for box in result.boxes:
                conf = float(box.conf[0])
                cls_id = int(box.cls[0])
                label = result.names.get(cls_id, "")

                # Priorizar detecções de pessoa (crop da roupa no corpo)
                # ou detecções diretas de peças de roupa em modelos de moda
                if conf > best_conf:
                    best_conf = conf
                    best_box = box.xyxy[0].cpu().numpy()
                    best_label = label

        if best_box is not None and best_conf > 0.3:
            x1, y1, x2, y2 = map(int, best_box)
            # Se detectou pessoa, pegar região central (torso = roupa)
            if best_label == "person":
                h = y2 - y1
                # Crop do torso: 15% a 65% da altura da pessoa
                torso_y1 = y1 + int(h * 0.15)
                torso_y2 = y1 + int(h * 0.65)
                crop = image.crop((x1, torso_y1, x2, torso_y2))
                category = "camiseta"
            else:
                crop = image.crop((x1, y1, x2, y2))
                category = self._map_label_to_category(best_label)

            logger.info(
                "Detecção: label=%s conf=%.2f categoria=%s",
                best_label,
                best_conf,
                category,
            )
            return crop, category

        # Fallback: crop central (assume que a roupa é o foco)
        logger.warning("Nenhuma detecção confiável. Usando crop central.")
        return self._center_crop(image), "geral"

    def _map_label_to_category(self, label: str) -> str:
        label_lower = label.lower()
        for category, keywords in FASHION_CLASSES.items():
            for keyword in keywords:
                if keyword in label_lower:
                    return category
        return "geral"

    def _center_crop(self, image: Image.Image) -> Image.Image:
        w, h = image.size
        margin_x = int(w * 0.15)
        margin_y = int(h * 0.10)
        return image.crop((margin_x, margin_y, w - margin_x, h - margin_y))


# Singleton
yolo_service = YoloService()
