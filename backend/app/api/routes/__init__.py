from fastapi import APIRouter
from app.api.routes.health import router as health_router
from app.api.routes.document_loader import router as document_loader_router
from app.api.routes.text_splitter import router as text_splitter_router

api_router = APIRouter()
api_router.include_router(health_router, tags=["system"])
api_router.include_router(document_loader_router, prefix="/document-loader", tags=["document-loader"])
api_router.include_router(text_splitter_router, prefix="/text-splitter", tags=["text-splitter"])

