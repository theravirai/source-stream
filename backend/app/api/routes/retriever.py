from fastapi import APIRouter, HTTPException
from app.models.retriever import QueryRequest, QueryResponse, SourceDocument
from app.services.rag_chain import RAGChainService
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/query", response_model=QueryResponse)
async def query_rag(request: QueryRequest) -> QueryResponse:
    """
    RAG query endpoint: retrieves documents, invokes the Groq LLM model
    via the LCEL chain, and returns a synthesized answer with source citations.
    """
    if not request.query.strip():
        raise HTTPException(
            status_code=400,
            detail="Query cannot be empty or contain only whitespace."
        )
    
    try:
        result = RAGChainService.query(query=request.query, k=request.k)
        
        # Convert raw retrieved Document objects to SourceDocument response model
        source_docs = [
            SourceDocument(
                page_content=doc.page_content,
                metadata={k: v for k, v in doc.metadata.items() if k != "score"},
                score=doc.metadata.get("score", 0.0)
            )
            for doc in result["source_documents"]
        ]
        
        return QueryResponse(
            query=result["query"],
            answer=result["answer"],
            source_documents=source_docs
        )
    except ValueError as e:
        logger.error(f"Configuration or validation error during RAG query: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Unexpected error during RAG query synthesis")
        raise HTTPException(status_code=500, detail=f"Failed to process query: {str(e)}")
