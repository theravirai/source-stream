import logging
from langchain_groq import ChatGroq
from app.core.config import settings

logger = logging.getLogger(__name__)

def get_llm_service() -> ChatGroq:
    """
    Initialize and return ChatGroq LLM service using settings.
    """
    if not settings.GROQ_API_KEY:
        logger.error("GROQ_API_KEY is not set in settings")
        raise ValueError("GROQ_API_KEY is not configured in settings")
    
    # We will look for GROQ_MODEL, defaulting to llama-3.1-8b-instant
    model_name = getattr(settings, "GROQ_MODEL", "llama-3.1-8b-instant")
    logger.info(f"Initializing ChatGroq service with model='{model_name}'")
    
    return ChatGroq(
        model_name=model_name,
        groq_api_key=settings.GROQ_API_KEY,
        temperature=0.0
    )
