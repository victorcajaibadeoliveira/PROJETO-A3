"""Rotas da API de busca por imagem."""

import logging
from io import BytesIO
from typing import List, Any, Dict

from fastapi import APIRouter, File, UploadFile, HTTPException
from PIL import Image

from backend.models.product import SearchResponse
from backend.services.recommendation_service import (
    index_products_from_frontend,
    search_by_image,
)

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/search-by-image", response_model=SearchResponse)
async def search_image(file: UploadFile = File(...)):
    """Busca produtos similares a partir de uma foto de roupa.

    Fluxo: Upload → YOLO (detecção) → Crop → Cor HEX → CLIP embedding → Ranking
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="O arquivo deve ser uma imagem.")

    try:
        contents = await file.read()
        image = Image.open(BytesIO(contents)).convert("RGB")
    except Exception as e:
        logger.error("Erro ao processar imagem: %s", e)
        raise HTTPException(status_code=400, detail="Imagem inválida ou corrompida.")

    result = search_by_image(image)
    return SearchResponse(
        detected_hex=result["detected_hex"],
        detected_category=result["detected_category"],
        products=result["products"],
    )


@router.post("/index-products")
async def index_catalog(products: List[Dict[str, Any]]):
    """Recebe a lista de produtos do frontend e gera embeddings para o catálogo.

    Chame este endpoint para sincronizar o catálogo do localStorage com o backend.
    """
    try:
        catalog = index_products_from_frontend(products)
        return {
            "status": "ok",
            "indexed": len(catalog),
            "message": f"{len(catalog)} produtos indexados com sucesso.",
        }
    except Exception as e:
        logger.error("Erro ao indexar produtos: %s", e)
        raise HTTPException(status_code=500, detail="Erro ao indexar produtos.")
