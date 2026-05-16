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
        
        # 1. Request Received
        steps.append(TelemetryStep(name="Request received", duration_ms=0.5, details={"status": "PASSED", "protocol": "HTTP/1.1"}))
        
        # 2. Input validation
        step_start = time.perf_counter()
        input_eval = await guardrails.analyze_input(request.query)
        step_duration = (time.perf_counter() - step_start) * 1000
        steps.append(TelemetryStep(
            name="Input validation", 
            duration_ms=step_duration, 
            details={
                "status": "SAFE" if input_eval.is_safe else "FAILED",
                "reason": input_eval.reason or "No prompt injection detected. No policy violations."
            }
        ))
        
        if not input_eval.is_safe:
            steps.append(TelemetryStep(name="Response returned", duration_ms=1.0, details={"status": "BLOCKED"}))
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
            
        # 2.5 Query Analysis (Router)
        from app.services.query_router import QueryRouterService
        step_start = time.perf_counter()
        query_intent = await QueryRouterService.analyze_intent(request.query)
        step_duration = (time.perf_counter() - step_start) * 1000
        steps.append(TelemetryStep(
            name="Query Analysis",
            duration_ms=step_duration,
            details={
                "status": "PASSED",
                "requires_retrieval": query_intent.requires_retrieval,
                "reason": query_intent.reason
            }
        ))
            
        # RAG Execution
        result = RAGChainService.query(session_id=x_session_id, query=request.query, k=request.k, requires_retrieval=query_intent.requires_retrieval)
        
        source_docs_raw = result.get("source_documents", [])
        candidates_raw = result.get("retrieved_candidates", [])
        all_retrieved = source_docs_raw + candidates_raw
        
        highest_score = max([doc.metadata.get("score", 0.0) for doc in all_retrieved]) if all_retrieved else 0.0
        avg_score = sum([doc.metadata.get("score", 0.0) for doc in all_retrieved]) / len(all_retrieved) if all_retrieved else 0.0
        
        # 3. Document Search
        if query_intent.requires_retrieval:
            steps.append(TelemetryStep(
                name="Document Search",
                duration_ms=result.get("retrieval_ms", 0.0),
                details={
                    "status": "PASSED",
                    "retrieved_chunks": len(all_retrieved),
                    "rejected_chunks": len(candidates_raw),
                    "citations_selected": len(source_docs_raw),
                    "highest_similarity": f"{highest_score:.2f}",
                    "average_similarity": f"{avg_score:.2f}",
                    "reason": "Executed because the query appears to reference indexed knowledge."
                }
            ))
            
            # 4. Prompt Construction
            steps.append(TelemetryStep(
                name="Prompt Construction",
                duration_ms=1.2,
                details={
                    "status": "PASSED",
                    "chunks_merged": len(source_docs_raw),
                    "reason": "Assembled retrieved context into LLM prompt."
                }
            ))
        else:
            steps.append(TelemetryStep(
                name="Document Search",
                duration_ms=0.0,
                details={
                    "status": "SKIPPED",
                    "reason": "Skipped because this is a general conversational request."
                }
            ))
            steps.append(TelemetryStep(
                name="Prompt Construction",
                duration_ms=0.0,
                details={
                    "status": "SKIPPED",
                    "reason": "Skipped because no documents were retrieved."
                }
            ))
        
        # 5. AI Response Generation
        steps.append(TelemetryStep(
            name="AI Response Generation",
            duration_ms=result.get("synthesis_ms", 0.0),
            details={
                "status": "PASSED",
                "prompt_tokens": result.get("prompt_tokens", 0),
                "completion_tokens": result.get("completion_tokens", 0),
                "total_tokens": result.get("total_tokens", 0),
                "reason": "Generated conversational response." if not query_intent.requires_retrieval else "Generated context-grounded response."
            }
        ))
        
        # Convert raw retrieved Document objects to SourceDocument response model
        source_docs = [
            SourceDocument(
                page_content=doc.page_content,
                metadata={k: v for k, v in doc.metadata.items() if k != "score"},
                score=doc.metadata.get("score", 0.0)
            )
            for doc in source_docs_raw
        ]
        
        candidate_docs = [
            SourceDocument(
                page_content=doc.page_content,
                metadata={k: v for k, v in doc.metadata.items() if k != "score"},
                score=doc.metadata.get("score", 0.0)
            )
            for doc in candidates_raw
        ]
        
        # 6. Response Verification
        step_start = time.perf_counter()
        context = [doc.page_content for doc in source_docs_raw]
        output_eval = await guardrails.evaluate_groundedness(result["answer"], context)
        step_duration = (time.perf_counter() - step_start) * 1000
        steps.append(TelemetryStep(
            name="Response Verification", 
            duration_ms=step_duration, 
            details={
                "status": "SAFE" if output_eval.is_safe else "FAILED",
                "reason": output_eval.reason or "Information properly grounded in context."
            }
        ))
        
        # 7. Response returned
        steps.append(TelemetryStep(name="Response returned", duration_ms=1.0, details={"status": "PASSED"}))
        
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
