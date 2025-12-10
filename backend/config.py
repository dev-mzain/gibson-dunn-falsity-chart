import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
    MODEL_NAME = os.getenv("MODEL_NAME", "gemini-3-pro-preview")
    MAX_ITERATIONS = 3
    MAX_TOKENS = 32000  # Increased for large documents - Gemini 2.0 supports up to 32k output
    TEMPERATURE = 0.1
    
    # Prompt file paths
    GENERATOR_PROMPT_PATH = "prompts/generator.txt"
    REVIEWER_PROMPT_PATH = "prompts/reviewer.txt"
    FIXER_PROMPT_PATH = "prompts/fixer.txt"

config = Config()