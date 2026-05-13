from fastapi import APIRouter, HTTPException, Header
import time
from app.models.retriever import QueryRequest, QueryResponse, SourceDocument, QueryTelemetry, TelemetryStep
from app.services.rag_chain import RAGChainService
from app.services.guardrails import GuardrailsService
import logging

logger = logging.getLogger(__name__)
router = APIRouter()
guardrails = GuardrailsService()

@router.post("/query", response_model=QueryResponse)
async def query_rag(request: QueryRequest, x_session_id: str = Header(...)) -> QueryResponse:
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
        total_start = time.perf_counter()
        steps = []
        
        # Input Guardrail Check
        step_start = time.perf_counter()
        input_eval = await guardrails.analyze_input(request.query)
        step_duration = (time.perf_counter() - step_start) * 1000
        steps.append(TelemetryStep(name="Input Guardrail", duration_ms=step_duration, details={"is_safe": input_eval.is_safe}))
        
        if not input_eval.is_safe:
            total_duration = (time.perf_counter() - total_start) * 1000
            telemetry = QueryTelemetry(total_duration_ms=total_duration, steps=steps)
            return QueryResponse(
                query=request.query,
                answer="Query blocked by security policies.",
                source_documents=[],
                retrieved_candidates=[],
                guardrail_blocked=True,
                guardrail_reason=input_eval.reason,
                telemetry=telemetry
            )
            
        step_start = time.perf_counter()
        result = RAGChainService.query(session_id=x_session_id, query=request.query, k=request.k)
        step_duration = (time.perf_counter() - step_start) * 1000
        steps.append(TelemetryStep(name="RAG Execution (Retrieval + Synthesis)", duration_ms=step_duration, details={
            "retrieved_count": len(result.get("source_documents", []) + result.get("retrieved_candidates", []))
        }))
        
        # Convert raw retrieved Document objects to SourceDocument response model
        source_docs = [
            SourceDocument(
                page_content=doc.page_content,
                metadata={k: v for k, v in doc.metadata.items() if k != "score"},
                score=doc.metadata.get("score", 0.0)
            )
            for doc in result.get("source_documents", [])
        ]
        
        candidate_docs = [
            SourceDocument(
                page_content=doc.page_content,
                metadata={k: v for k, v in doc.metadata.items() if k != "score"},
                score=doc.metadata.get("score", 0.0)
            )
            for doc in result.get("retrieved_candidates", [])
        ]
        
        # Output Guardrail Check
        step_start = time.perf_counter()
        context = [doc.page_content for doc in result.get("source_documents", [])]
        output_eval = await guardrails.evaluate_groundedness(result["answer"], context)
        step_duration = (time.perf_counter() - step_start) * 1000
        steps.append(TelemetryStep(name="Output Guardrail", duration_ms=step_duration, details={"is_safe": output_eval.is_safe}))
        
        total_duration = (time.perf_counter() - total_start) * 1000
        telemetry = QueryTelemetry(
            total_duration_ms=total_duration,
            prompt_tokens=result.get("prompt_tokens", 0),
            completion_tokens=result.get("completion_tokens", 0),
            total_tokens=result.get("total_tokens", 0),
            steps=steps
        )
        
        if not output_eval.is_safe:
            return QueryResponse(
                query=result["query"],
                answer="I'm sorry, but I cannot confidently answer this based on the provided documents.",
                source_documents=source_docs,
                retrieved_candidates=candidate_docs,
                guardrail_blocked=True,
                guardrail_reason=output_eval.reason,
                telemetry=telemetry
            )
        
        return QueryResponse(
            query=result["query"],
            answer=result["answer"],
            source_documents=source_docs,
            retrieved_candidates=candidate_docs,
            telemetry=telemetry
        )
    except ValueError as e:
        logger.error(f"Configuration or validation error during RAG query: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Unexpected error during RAG query synthesis")
        raise HTTPException(status_code=500, detail=f"Failed to process query: {str(e)}")
