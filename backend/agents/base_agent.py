import google.generativeai as genai
from config import config
from typing import Optional
from utils.logger import RunLogger
import time

class BaseAgent:
    """Base class for all agents using Google Gemini."""
    
    def __init__(self, prompt_path: str, agent_name: str = "BaseAgent"):
        """
        Initialize the base agent.
        
        Args:
            prompt_path: Path to the prompt file
            agent_name: Name of the agent for logging
        """
        self.prompt_path = prompt_path
        self.agent_name = agent_name
        self.system_prompt = self._load_prompt()
        self.logger: Optional[RunLogger] = None
        
        # Configure Gemini
        genai.configure(api_key=config.GOOGLE_API_KEY)
        self.model = genai.GenerativeModel(
            model_name=config.MODEL_NAME,
            generation_config={
                "temperature": config.TEMPERATURE,
                "max_output_tokens": config.MAX_TOKENS,
            }
        )
    
    def set_logger(self, logger: RunLogger):
        """Set the logger for this agent."""
        self.logger = logger
    
    def _load_prompt(self) -> str:
        """Load the system prompt from file."""
        try:
            with open(self.prompt_path, 'r') as f:
                return f.read()
        except Exception as e:
            raise Exception(f"Error loading prompt from {self.prompt_path}: {str(e)}")
    
    def _log(self, level: str, message: str):
        """Log a message if logger is available."""
        if self.logger:
            if level == "info":
                self.logger.log_info(message)
            elif level == "debug":
                self.logger.log_debug(message)
            elif level == "warning":
                self.logger.log_warning(message)
            elif level == "error":
                self.logger.log_error(message)
    
    def generate_response(self, user_input: str, iteration: int = 1) -> str:
        """
        Generate a response using Gemini.
        
        Args:
            user_input: The user's input text
            iteration: Current iteration number for logging
            
        Returns:
            Generated response as string
        """
        start_time = time.time()
        
        try:
            # Log agent start
            if self.logger:
                self.logger.log_agent_start(self.agent_name, iteration)
                self.logger.log_agent_input(self.agent_name, user_input)
            
            # Combine system prompt and user input
            full_prompt = f"{self.system_prompt}\n\n{user_input}"
            
            self._log("debug", f"[{self.agent_name}] Sending request to Gemini...")
            
            # Generate response
            response = self.model.generate_content(full_prompt)
            
            duration = time.time() - start_time
            
            # Check if response has valid parts
            if not response.parts:
                # Log the finish reason for debugging
                finish_reason = response.candidates[0].finish_reason if response.candidates else "UNKNOWN"
                safety_ratings = response.candidates[0].safety_ratings if response.candidates else []
                
                error_details = f"Response blocked. Finish reason: {finish_reason}"
                if safety_ratings:
                    error_details += f"\nSafety ratings: {safety_ratings}"
                
                self._log("error", f"[{self.agent_name}] {error_details}")
                
                # Try to get any available text from prompt_feedback
                if hasattr(response, 'prompt_feedback'):
                    error_details += f"\nPrompt feedback: {response.prompt_feedback}"
                
                raise Exception(f"Gemini response blocked or empty. {error_details}")
            
            # Log output
            if self.logger:
                self.logger.log_agent_output(self.agent_name, response.text)
                self.logger.log_agent_complete(self.agent_name, duration)
            
            return response.text
            
        except Exception as e:
            duration = time.time() - start_time
            error_msg = f"Error generating response: {str(e)}"
            
            if self.logger:
                self.logger.log_agent_error(self.agent_name, error_msg)
                self.logger.log_agent_complete(self.agent_name, duration)
            
            raise Exception(error_msg)