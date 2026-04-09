"""Tech Wear — API Backend (FastAPI)."""

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.routes.image_search import router as image_router

# Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

app = FastAPI(
    title="Tech Wear — WearIA API",
    description="Busca visual de roupas esportivas com YOLO + CLIP + cor HEX",
    version="1.0.0",
)

# CORS — permitir o frontend local
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rotas
app.include_router(image_router, prefix="/api", tags=["Busca Visual"])


@app.get("/")
async def root():
    return {"status": "online", "service": "Tech Wear WearIA API"}
