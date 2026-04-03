import logging
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.models.document_loader import DocumentResponse

logger = logging.getLogger(__name__)

class TextSplitterService:
    @staticmethod
    def split_documents(
        documents: list[DocumentResponse], 
        chunk_size: int = 1000, 
        chunk_overlap: int = 200
    ) -> list[Document]:
        """
        Split a list of documents into smaller chunks using RecursiveCharacterTextSplitter.
        Preserves original metadata and adds chunk_index.
        """
        logger.info(f"Splitting {len(documents)} documents (chunk_size={chunk_size}, chunk_overlap={chunk_overlap})")
        
        # Convert models to LangChain Document objects
        lc_docs = [
            Document(page_content=doc.page_content, metadata=doc.metadata.copy())
            for doc in documents
        ]
        
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            add_start_index=True
        )
        
        # Split documents
        split_docs = splitter.split_documents(lc_docs)
        
        # Track and update metadata
        # Group by source to assign correct chunk_index per source document
        source_counters = {}
        for doc in split_docs:
            source = doc.metadata.get("source", "unknown")
            if source not in source_counters:
                source_counters[source] = 0
            doc.metadata["chunk_index"] = source_counters[source]
            source_counters[source] += 1
            
        logger.info(f"Split completed. Generated {len(split_docs)} chunks from {len(documents)} source documents.")
        return split_docs
