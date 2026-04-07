import logging
from qdrant_client import QdrantClient
from qdrant_client.http import models as qmodels
from langchain_qdrant import QdrantVectorStore
from langchain_core.documents import Document
from app.core.config import settings
from app.services.embeddings import get_embeddings_service

logger = logging.getLogger(__name__)

class VectorStoreService:
    @staticmethod
    def get_vector_store() -> QdrantVectorStore:
        """
        Initialize Qdrant client, ensure collection exists, and return QdrantVectorStore.
        """
        if not settings.QDRANT_URL:
            logger.error("QDRANT_URL is not set in settings")
            raise ValueError("QDRANT_URL is not configured in settings")
        
        # Initialize client
        client = QdrantClient(
            url=settings.QDRANT_URL,
            api_key=settings.QDRANT_API_KEY
        )
        
        collection_name = settings.QDRANT_COLLECTION or "source_stream"
        
        # Ensure collection exists
        try:
            client.get_collection(collection_name=collection_name)
        except Exception:
            logger.info(f"Collection '{collection_name}' not found. Creating collection.")
            # Create collection with Cosine similarity and 768 vector dimension (for models/embedding-001)
            client.create_collection(
                collection_name=collection_name,
                vectors_config=qmodels.VectorParams(
                    size=768,
                    distance=qmodels.Distance.COSINE
                )
            )
            logger.info(f"Successfully created collection '{collection_name}'.")
        
        embeddings = get_embeddings_service()
        return QdrantVectorStore(
            client=client,
            collection_name=collection_name,
            embedding=embeddings
        )

    @classmethod
    def index_documents(cls, documents: list[Document]) -> int:
        """
        Add documents to Qdrant collection.
        """
        logger.info(f"Indexing {len(documents)} documents into Qdrant collection.")
        vector_store = cls.get_vector_store()
        vector_store.add_documents(documents)
        return len(documents)

    @classmethod
    def similarity_search(cls, query: str, k: int = 4) -> list[tuple[Document, float]]:
        """
        Search for top k documents matching the query.
        Returns list of (Document, score) tuples.
        """
        logger.info(f"Searching Qdrant collection for query: '{query}' (k={k})")
        vector_store = cls.get_vector_store()
        results = vector_store.similarity_search_with_score(query=query, k=k)
        return results
