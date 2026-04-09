"""Serviço de recomendação: combina CLIP + cor para ranking híbrido."""

import json
import logging
import os
from pathlib import Path
from typing import Any, Dict, List

from PIL import Image

from backend.models.product import SearchResult
from backend.services.clip_service import clip_service
from backend.services.color_service import color_similarity, extract_dominant_hex
from backend.services.yolo_service import yolo_service

logger = logging.getLogger(__name__)

# Caminho do catálogo com embeddings pré-computados
CATALOG_PATH = Path(__file__).parent.parent / "data" / "catalog.json"


def _name_to_hex(color_name: str) -> str:
    """Mapeia nomes de cor do catálogo para HEX aproximado."""
    mapping = {
        "preto": "#1a1a1a",
        "branco": "#f5f5f5",
        "cinza": "#808080",
        "azul marinho": "#1b2a4a",
        "verde militar": "#4b5320",
        "vermelho": "#c0392b",
        "azul": "#2980b9",
        "rosa": "#e91e8c",
        "amarelo": "#f1c40f",
        "laranja": "#e67e22",
        "bege": "#d4c5a9",
        "marrom": "#6b4226",
    }
    return mapping.get(color_name.lower().strip(), "#808080")


def load_catalog() -> List[Dict[str, Any]]:
    """Carrega o catálogo de produtos com embeddings."""
    if CATALOG_PATH.exists():
        with open(CATALOG_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return []


def save_catalog(catalog: List[Dict[str, Any]]) -> None:
    """Salva o catálogo com embeddings."""
    CATALOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(CATALOG_PATH, "w", encoding="utf-8") as f:
        json.dump(catalog, f, ensure_ascii=False, indent=2)
    logger.info("Catálogo salvo com %d produtos em %s", len(catalog), CATALOG_PATH)


def index_products_from_frontend(products: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Indexa produtos do frontend (localStorage) gerando embeddings e hex_color.

    Recebe a lista de produtos no formato do TechWear JS e retorna
    o catálogo indexado com embeddings CLIP.
    """
    catalog: List[Dict[str, Any]] = []

    for p in products:
        hex_color = _name_to_hex(p.get("cor", ""))

        entry = {
            "id": p["id"],
            "name": p.get("nome", ""),
            "hex_color": hex_color,
            "category": p.get("categoria", ""),
            "price": p.get("preco", 0),
            "image_url": p.get("imagem", ""),
            "embedding": [],  # Será preenchido quando houver imagem
        }

        # Se o produto tem imagem (base64), gerar embedding
        image_data = p.get("imagem", "")
        if image_data and len(image_data) > 100:
            try:
                import base64
                from io import BytesIO

                img_bytes = base64.b64decode(image_data.split(",")[-1])
                img = Image.open(BytesIO(img_bytes)).convert("RGB")
                entry["embedding"] = clip_service.encode_image(img)
                logger.info("Embedding gerado para produto %d: %s", p["id"], p.get("nome"))
            except Exception as e:
                logger.warning("Erro ao gerar embedding do produto %d: %s", p["id"], e)

        catalog.append(entry)

    save_catalog(catalog)
    return catalog


def search_by_image(
    image: Image.Image,
    top_k: int = 5,
    clip_weight: float = 0.8,
    color_weight: float = 0.2,
) -> Dict[str, Any]:
    """Fluxo principal: imagem → YOLO → cor + CLIP → ranking.

    Args:
        image: Imagem PIL enviada pelo usuário.
        top_k: Quantidade de resultados.
        clip_weight: Peso da similaridade visual.
        color_weight: Peso da similaridade de cor.

    Returns:
        Dict com detected_hex, detected_category e lista de produtos rankeados.
    """
    # 1. YOLO: detectar e recortar peça
    crop, detected_category = yolo_service.detect_and_crop(image)
    logger.info("Peça detectada: categoria=%s", detected_category)

    # 2. Extrair cor dominante do crop
    detected_hex = extract_dominant_hex(crop)
    logger.info("Cor detectada: %s", detected_hex)

    # 3. Gerar embedding CLIP do crop
    query_embedding = clip_service.encode_image(crop)

    # 4. Carregar catálogo
    catalog = load_catalog()
    if not catalog:
        logger.warning("Catálogo vazio. Retornando resultado vazio.")
        return {
            "detected_hex": detected_hex,
            "detected_category": detected_category,
            "products": [],
        }

    # 5. Calcular scores híbridos
    scored: List[Dict[str, Any]] = []
    for product in catalog:
        prod_embedding = product.get("embedding", [])

        # Similaridade CLIP (visual)
        if prod_embedding and query_embedding:
            clip_sim = clip_service.cosine_similarity(query_embedding, prod_embedding)
        else:
            clip_sim = 0.0

        # Similaridade de cor
        prod_hex = product.get("hex_color", "#808080")
        color_sim = color_similarity(detected_hex, prod_hex)

        final_score = clip_weight * clip_sim + color_weight * color_sim

        scored.append(
            {
                "id": product["id"],
                "name": product["name"],
                "hex_color": product.get("hex_color", ""),
                "category": product.get("category", ""),
                "price": product.get("price", 0),
                "image_url": product.get("image_url", ""),
                "score": round(final_score, 4),
            }
        )

    # 6. Ordenar por score e pegar top_k
    scored.sort(key=lambda x: x["score"], reverse=True)
    top_results = scored[:top_k]

    logger.info(
        "Busca concluída. Top %d resultados retornados (melhor score=%.4f)",
        len(top_results),
        top_results[0]["score"] if top_results else 0,
    )

    return {
        "detected_hex": detected_hex,
        "detected_category": detected_category,
        "products": [SearchResult(**r) for r in top_results],
    }
