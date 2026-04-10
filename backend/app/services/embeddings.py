import logging
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from app.core.config import settings

logger = logging.getLogger(__name__)

def get_embeddings_service() -> GoogleGenerativeAIEmbeddings:
    """
    Initialize and return GoogleGenerativeAIEmbeddings using configuration settings.
    """
    if not settings.GEMINI_API_KEY:
        logger.error("GEMINI_API_KEY is not set in settings")
        raise ValueError("GEMINI_API_KEY is not configured in settings")
    
    logger.info("Initializing Google Generative AI Embeddings with model='models/gemini-embedding-001'")
    return GoogleGenerativeAIEmbeddings(
        model="models/gemini-embedding-001",
        google_api_key=settings.GEMINI_API_KEY
    )
