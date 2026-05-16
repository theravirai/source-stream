import logging
from typing import Dict, Any
from app.services.llm import get_llm_service
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

class QueryIntent(BaseModel):
    requires_retrieval: bool = Field(description="True if the query asks for facts, concepts, or specific information. False if it is a general greeting or conversational prompt like 'hello' or 'can you help me?'.")
    reason: str = Field(description="A short explanation of why retrieval is or is not required.")

class QueryRouterService:
    @classmethod
    async def analyze_intent(cls, query: str) -> QueryIntent:
        logger.info(f"Analyzing query intent for: '{query}'")
        llm = get_llm_service()
        
        parser = JsonOutputParser(pydantic_object=QueryIntent)
        
        prompt = PromptTemplate(
            template="Analyze the following user query to determine if it requires retrieving factual documents from a knowledge base.\n\n"
                     "Return True for 'requires_retrieval' if the query asks for facts, concepts, definitions, or specific information that would be found in documentation.\n"
                     "Return False if it is a general greeting, conversational pleasantry (e.g. 'hi', 'how are you?'), or a generic request for help without specifics.\n\n"
                     "Format Instructions:\n{format_instructions}\n\n"
                     "Query: {query}\n",
            input_variables=["query"],
            partial_variables={"format_instructions": parser.get_format_instructions()}
        )
        
        chain = prompt | llm | parser
        
        try:
            result = await chain.ainvoke({"query": query})
            return QueryIntent(**result)
        except Exception as e:
            logger.error(f"Failed to route query: {str(e)}")
            # Default to True (safe fallback)
            return QueryIntent(requires_retrieval=True, reason="Failed to route query. Defaulting to knowledge retrieval.")
