"""Serviço de extração de cor dominante."""

import logging
from typing import Tuple

import numpy as np
from PIL import Image
from sklearn.cluster import KMeans

logger = logging.getLogger(__name__)


def rgb_to_hex(r: int, g: int, b: int) -> str:
    return "#{:02x}{:02x}{:02x}".format(r, g, b)


def hex_to_rgb(hex_color: str) -> Tuple[int, int, int]:
    hex_color = hex_color.lstrip("#")
    return tuple(int(hex_color[i : i + 2], 16) for i in (0, 2, 4))


def extract_dominant_hex(image_crop: Image.Image, n_clusters: int = 3) -> str:
    """Extrai a cor dominante de um crop de imagem usando KMeans.

    Args:
        image_crop: Imagem PIL já recortada.
        n_clusters: Número de clusters para KMeans.

    Returns:
        Cor dominante em formato HEX (ex: "#202020").
    """
    img = image_crop.convert("RGB").resize((100, 100))
    pixels = np.array(img).reshape(-1, 3).astype(np.float64)

    kmeans = KMeans(n_clusters=n_clusters, n_init=10, random_state=42)
    kmeans.fit(pixels)

    # Selecionar o cluster com mais pixels (cor dominante)
    labels, counts = np.unique(kmeans.labels_, return_counts=True)
    dominant_idx = labels[np.argmax(counts)]
    dominant_color = kmeans.cluster_centers_[dominant_idx].astype(int)

    r, g, b = int(dominant_color[0]), int(dominant_color[1]), int(dominant_color[2])
    hex_color = rgb_to_hex(r, g, b)

    logger.info("Cor dominante extraída: %s (RGB: %d, %d, %d)", hex_color, r, g, b)
    return hex_color


def color_distance(hex1: str, hex2: str) -> float:
    """Distância euclidiana entre duas cores HEX no espaço RGB.

    Retorna valor entre 0 (idêntica) e ~441 (máxima distância).
    """
    r1, g1, b1 = hex_to_rgb(hex1)
    r2, g2, b2 = hex_to_rgb(hex2)
    return float(np.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2))


def color_similarity(hex1: str, hex2: str) -> float:
    """Similaridade de cor normalizada entre 0 e 1.

    1 = cores idênticas, 0 = máxima distância.
    """
    max_distance = 441.67  # sqrt(255^2 * 3)
    dist = color_distance(hex1, hex2)
    return 1.0 - (dist / max_distance)
