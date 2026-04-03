import logging
from fastapi import APIRouter, HTTPException
from app.models.text_splitter import SplitRequest
from app.models.document_loader import DocumentResponse
from app.services.text_splitter import TextSplitterService

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/split", response_model=list[DocumentResponse])
async def split_documents(request: SplitRequest):
    """
    Split incoming documents into chunks based on size and overlap configurations.
    """
    logger.info(f"Received request to split {len(request.documents)} documents (chunk_size={request.chunk_size}, chunk_overlap={request.chunk_overlap})")
    try:
        chunks = TextSplitterService.split_documents(
            documents=request.documents,
            chunk_size=request.chunk_size,
            chunk_overlap=request.chunk_overlap
        )
        # Convert split langchain Documents back to DocumentResponse models
        response_data = [
            DocumentResponse(page_content=chunk.page_content, metadata=chunk.metadata)
            for chunk in chunks
        ]
        logger.info(f"Successfully generated {len(response_data)} chunks.")
        return response_data
    except ValueError as val_err:
        logger.error(f"Validation error in splitting: {str(val_err)}")
        raise HTTPException(status_code=400, detail=str(val_err))
    except Exception as e:
        logger.exception("Unexpected error occurred while splitting documents")
        raise HTTPException(status_code=500, detail=f"Failed to split documents: {str(e)}")
