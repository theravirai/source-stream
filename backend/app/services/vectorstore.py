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
        
        embeddings = get_embeddings_service()

        # Determine embedding dimension size dynamically
        try:
            sample_vector = embeddings.embed_query("test")
            vector_size = len(sample_vector)
            logger.info(f"Dynamically determined embedding vector size: {vector_size}")
        except Exception as e:
            logger.warning(f"Failed to dynamically determine embedding size: {e}. Falling back to 3072.")
            vector_size = 3072

        # Ensure collection exists and matches the required vector dimension size
        recreate = False
        try:
            coll_info = client.get_collection(collection_name=collection_name)
            from qdrant_client.http.models import VectorParams
            if isinstance(coll_info.config.params.vectors, VectorParams):
                existing_size = coll_info.config.params.vectors.size
                if existing_size != vector_size:
                    logger.warning(f"Collection '{collection_name}' size mismatch: existing={existing_size}, required={vector_size}. Recreating collection.")
                    recreate = True
            else:
                logger.warning(f"Collection '{collection_name}' uses named vectors. Recreating to standard schema.")
                recreate = True
        except Exception:
            # Collection does not exist
            recreate = True

        if recreate:
            try:
                logger.info(f"Deleting and recreating collection '{collection_name}' with vector size {vector_size}.")
                client.delete_collection(collection_name=collection_name)
            except Exception as e:
                logger.warning(f"Could not delete collection (might not exist): {e}")
            
            client.create_collection(
                collection_name=collection_name,
                vectors_config=qmodels.VectorParams(
                    size=vector_size,
                    distance=qmodels.Distance.COSINE
                )
            )
            logger.info(f"Successfully created collection '{collection_name}' with size {vector_size}.")
        
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
