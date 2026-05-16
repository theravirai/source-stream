import logging
from typing import List, Dict, Any
from langchain_core.documents import Document
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough, RunnableParallel
from langchain_core.output_parsers import StrOutputParser
from app.services.vectorstore import VectorStoreService
from app.services.llm import get_llm_service

logger = logging.getLogger(__name__)

class RAGChainService:
    @classmethod
    def query(cls, session_id: str, query: str, k: int = 4, requires_retrieval: bool = True) -> Dict[str, Any]:
        """
        Retrieves relevant documents and generates a response, or answers conversationally if retrieval is unneeded.
        """
        logger.info(f"Executing query: '{query}' (requires_retrieval={requires_retrieval}) for session '{session_id}'")
        
        llm = get_llm_service()
        import time
        
        if not requires_retrieval:
            prompt = ChatPromptTemplate.from_messages([
                ("system", "You are a helpful, professional, and knowledgeable AI assistant for the 'Source Stream' application. Answer the user's conversational message naturally and concisely. Do not hallucinate factual information."),
                ("human", "{question}")
            ])
            t_synthesis_start = time.perf_counter()
            ai_message = (prompt | llm).invoke({"question": query})
            t_synthesis_end = time.perf_counter()
            
            token_usage = ai_message.response_metadata.get("token_usage", {})
            return {
                "query": query,
                "answer": ai_message.content,
                "source_documents": [],
                "retrieved_candidates": [],
                "prompt_tokens": token_usage.get("prompt_tokens", 0),
                "completion_tokens": token_usage.get("completion_tokens", 0),
                "total_tokens": token_usage.get("total_tokens", 0),
                "retrieval_ms": 0.0,
                "synthesis_ms": (t_synthesis_end - t_synthesis_start) * 1000
            }

        
        # 1. Get vector store and initialize the retriever
        vector_store = VectorStoreService.get_vector_store(session_id)
        retriever = vector_store.as_retriever(
            search_type="similarity",
            search_kwargs={"k": k}
        )
        
        # 3. Create the prompt template
        system_prompt = (
            "You are a helpful, professional, and knowledgeable AI assistant for the RAG application 'Source Stream'.\n"
            "Your task is to answer the user's question using strictly the provided context below.\n"
            "If the answer cannot be found or inferred from the provided context, state clearly: "
            "'I cannot find the answer in the provided documents.'\n"
            "Do not make up information or use outside knowledge. Keep your response concise, clear, and grounded.\n"
            "Do not refer to the context as 'the provided context' or 'the retrieved context' in your response; speak naturally as if you know this information.\n\n"
            "Context:\n"
            "{context}"
        )
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("human", "{question}")
        ])
        
        # 4. Define formatting function
        def format_docs(docs: List[Document]) -> str:
            return "\n\n".join(
                f"Source: {doc.metadata.get('source', 'Unknown')}\n"
                f"Page: {doc.metadata.get('page', 'N/A')}\n"
                f"Content: {doc.page_content}"
                for doc in docs
            )
            
        # 5. Compose the LCEL RAG chain
        rag_chain = (
            RunnablePassthrough.assign(context=lambda x: format_docs(x["context"]))
            | prompt
            | llm
        )
        
        full_chain = RunnableParallel({
            "answer": rag_chain,
            "source_documents": lambda x: x["context"]
        })
        
        import time
        
        t_retrieval_start = time.perf_counter()
        # 6. Retrieve relevant documents with similarity scores from Vector Store
        raw_results = VectorStoreService.similarity_search(session_id=session_id, query=query, k=k)
        retrieved_docs = []
        for doc, score in raw_results:
            # Inject similarity score into document metadata
            doc_copy = Document(page_content=doc.page_content, metadata=doc.metadata.copy())
            doc_copy.metadata["score"] = score
            retrieved_docs.append(doc_copy)
        t_retrieval_end = time.perf_counter()
            
        # 7. Execute the LCEL chain
        t_synthesis_start = time.perf_counter()
        result = full_chain.invoke({
            "context": retrieved_docs,
            "question": query
        })
        t_synthesis_end = time.perf_counter()
        
        ai_message = result["answer"]
        answer_text = ai_message.content
        
        # Extract token usage
        token_usage = ai_message.response_metadata.get("token_usage", {})
        prompt_tokens = token_usage.get("prompt_tokens", 0)
        completion_tokens = token_usage.get("completion_tokens", 0)
        total_tokens = token_usage.get("total_tokens", 0)
        
        # 8. Check if LLM determined the context was irrelevant
        answer_lower = answer_text.lower()
        is_relevant = "cannot find the answer" not in answer_lower and \
                      "cannot find any relevant information" not in answer_lower
        
        return {
            "query": query,
            "answer": answer_text,
            "source_documents": result["source_documents"] if is_relevant else [],
            "retrieved_candidates": result["source_documents"] if not is_relevant else [],
            "prompt_tokens": prompt_tokens,
            "completion_tokens": completion_tokens,
            "total_tokens": total_tokens,
            "retrieval_ms": (t_retrieval_end - t_retrieval_start) * 1000,
            "synthesis_ms": (t_synthesis_end - t_synthesis_start) * 1000
        }
