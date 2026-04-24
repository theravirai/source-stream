import logging
from fastapi import APIRouter, HTTPException
from langchain_core.documents import Document as LCDocument
from app.models.vector_store import IndexRequest, IndexResponse, SearchRequest, SearchResultResponse, VectorStoreStatusResponse, VectorStoreClearResponse
from app.services.vectorstore import VectorStoreService
from app.core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/index", response_model=IndexResponse)
async def index_documents(request: IndexRequest):
    """
    Generate embeddings and index the provided document chunks into Qdrant.
    """
    logger.info(f"Received request to index {len(request.documents)} chunks into vector store.")
    try:
        # Convert Pydantic model items to LangChain Document structures
        lc_docs = [
            LCDocument(page_content=doc.page_content, metadata=doc.metadata)
            for doc in request.documents
        ]
        
        indexed_count = VectorStoreService.index_documents(lc_docs)
        collection_name = settings.QDRANT_COLLECTION or "source_stream"
        
        logger.info(f"Successfully indexed {indexed_count} chunks.")
        return IndexResponse(
            status="success",
            message=f"Successfully indexed {indexed_count} chunks in Qdrant collection '{collection_name}'",
            indexed_count=indexed_count,
            collection=collection_name
        )
    except ValueError as val_err:
        logger.error(f"Configuration or validation error during indexing: {str(val_err)}")
        raise HTTPException(status_code=400, detail=str(val_err))
    except Exception as e:
        logger.exception("Unexpected error occurred while indexing documents")
        raise HTTPException(status_code=500, detail=f"Failed to index documents: {str(e)}")

@router.post("/search", response_model=list[SearchResultResponse])
async def search_documents(request: SearchRequest):
    """
    Perform a similarity search against the Qdrant vector store.
    """
    logger.info(f"Received request to search vector store with query='{request.query}' and k={request.k}")
    try:
        results = VectorStoreService.similarity_search(query=request.query, k=request.k)
        
        response_data = [
            SearchResultResponse(
                page_content=doc.page_content,
                metadata=doc.metadata,
                score=float(score)
            )
            for doc, score in results
        ]
        logger.info(f"Successfully found {len(response_data)} matching results.")
        return response_data
    except ValueError as val_err:
        logger.error(f"Configuration or validation error during search: {str(val_err)}")
        raise HTTPException(status_code=400, detail=str(val_err))
    except Exception as e:
        logger.exception("Unexpected error occurred while searching documents")
        raise HTTPException(status_code=500, detail=f"Failed to search documents: {str(e)}")

@router.get("/status", response_model=VectorStoreStatusResponse)
async def get_vector_store_status():
    """
    Retrieve active Qdrant database status, chunk counts, and collection name.
    """
    logger.info("Received request for vector store status.")
    try:
        status_info = VectorStoreService.get_status()
        return VectorStoreStatusResponse(**status_info)
    except ValueError as val_err:
        logger.error(f"Configuration error checking status: {str(val_err)}")
        raise HTTPException(status_code=400, detail=str(val_err))
    except Exception as e:
        logger.exception("Failed to check vector store status")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/clear", response_model=VectorStoreClearResponse)
async def clear_vector_store():
    """
    Clear/reset the vector store collection by deleting and recreating it.
    """
    logger.info("Received request to clear vector store collection.")
    try:
        collection = VectorStoreService.clear_collection()
        return VectorStoreClearResponse(
            status="success",
            message=f"Collection '{collection}' successfully cleared and recreated."
        )
    except ValueError as val_err:
        logger.error(f"Configuration error during clear: {str(val_err)}")
        raise HTTPException(status_code=400, detail=str(val_err))
    except Exception as e:
        logger.exception("Failed to clear vector store")
        raise HTTPException(status_code=500, detail=str(e))

