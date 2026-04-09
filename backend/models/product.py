from pydantic import BaseModel
from typing import List, Optional


class ProductBase(BaseModel):
    id: int
    name: str
    hex_color: str
    category: str
    price: float
    image_url: str = ""


class ProductWithEmbedding(ProductBase):
    embedding: List[float] = []


class SearchResult(BaseModel):
    id: int
    name: str
    hex_color: str
    category: str
    price: float
    image_url: str
    score: float


class SearchResponse(BaseModel):
    detected_hex: str
    detected_category: str
    products: List[SearchResult]
