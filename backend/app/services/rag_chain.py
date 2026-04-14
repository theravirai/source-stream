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
    def query(cls, query: str, k: int = 4) -> Dict[str, Any]:
        """
        Retrieves relevant documents from Qdrant and generates a grounded response using Groq.
        Uses LangChain Expression Language (LCEL) Runnables.
        """
        logger.info(f"Executing RAG query: '{query}' with k={k}")
        
        # 1. Get vector store and initialize the retriever
        vector_store = VectorStoreService.get_vector_store()
        retriever = vector_store.as_retriever(
            search_type="similarity",
            search_kwargs={"k": k}
        )
        
        # 2. Get LLM service
        llm = get_llm_service()
        
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
            | StrOutputParser()
        )
        
        full_chain = RunnableParallel({
            "answer": rag_chain,
            "source_documents": lambda x: x["context"]
        })
        
        # 6. Retrieve relevant documents with similarity scores from Vector Store
        raw_results = VectorStoreService.similarity_search(query=query, k=k)
        retrieved_docs = []
        for doc, score in raw_results:
            # Inject similarity score into document metadata
            doc_copy = Document(page_content=doc.page_content, metadata=doc.metadata.copy())
            doc_copy.metadata["score"] = score
            retrieved_docs.append(doc_copy)
            
        # 7. Execute the LCEL chain
        result = full_chain.invoke({
            "context": retrieved_docs,
            "question": query
        })
        
        return {
            "query": query,
            "answer": result["answer"],
            "source_documents": result["source_documents"]
        }
