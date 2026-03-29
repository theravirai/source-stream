from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.document_loader.loader import DocumentLoaderService
from app.models.document_loader import DocumentResponse, WebsiteLoadRequest
import shutil
import logging
from pathlib import Path

logger = logging.getLogger(__name__)
router = APIRouter()

# Store uploaded files temporarily inside the workspace to comply with sandbox rules
TEMP_DIR = Path(__file__).resolve().parents[2] / "tmp"

def save_temp_file(file: UploadFile) -> Path:
    TEMP_DIR.mkdir(parents=True, exist_ok=True)
    temp_path = TEMP_DIR / file.filename
    logger.info(f"Saving uploaded file temporarily to {temp_path}")
    with temp_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return temp_path

@router.post("/text", response_model=list[DocumentResponse])
async def load_text(file: UploadFile = File(...)):
    if not file.filename.endswith(".txt"):
        logger.error(f"Rejected text file upload with invalid extension: {file.filename}")
        raise HTTPException(status_code=400, detail="Only .txt files are supported")
    
    path = save_temp_file(file)
    try:
        docs = DocumentLoaderService.load_text(str(path))
        logger.info(f"Successfully loaded {len(docs)} document chunks from {file.filename}")
        return [DocumentResponse(page_content=d.page_content, metadata=d.metadata) for d in docs]
    except Exception as e:
        logger.exception(f"Error loading text file {file.filename}")
        raise HTTPException(status_code=500, detail=f"Failed to load text file: {str(e)}")
    finally:
        if path.exists():
            path.unlink()
            logger.info(f"Removed temporary file {path}")

@router.post("/pdf", response_model=list[DocumentResponse])
async def load_pdf(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        logger.error(f"Rejected PDF file upload with invalid extension: {file.filename}")
        raise HTTPException(status_code=400, detail="Only .pdf files are supported")
    
    path = save_temp_file(file)
    try:
        docs = DocumentLoaderService.load_pdf(str(path))
        logger.info(f"Successfully loaded {len(docs)} pages from PDF {file.filename}")
        return [DocumentResponse(page_content=d.page_content, metadata=d.metadata) for d in docs]
    except Exception as e:
        logger.exception(f"Error loading PDF file {file.filename}")
        raise HTTPException(status_code=500, detail=f"Failed to load PDF file: {str(e)}")
    finally:
        if path.exists():
            path.unlink()
            logger.info(f"Removed temporary file {path}")

@router.post("/website", response_model=list[DocumentResponse])
async def load_website(request: WebsiteLoadRequest):
    logger.info(f"Crawl request for website: {request.url} (max_depth={request.max_depth})")
    try:
        docs = DocumentLoaderService.load_website(request.url, request.max_depth)
        logger.info(f"Successfully scraped {len(docs)} pages from {request.url}")
        return [DocumentResponse(page_content=d.page_content, metadata=d.metadata) for d in docs]
    except ValueError as val_err:
        logger.error(f"Validation error for website URL {request.url}: {str(val_err)}")
        raise HTTPException(status_code=400, detail=str(val_err))
    except Exception as e:
        logger.exception(f"Error scraping website {request.url}")
        raise HTTPException(status_code=500, detail=f"Failed to scrape website: {str(e)}")
