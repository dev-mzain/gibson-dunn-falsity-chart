from agents.base_agent import BaseAgent
from config import config

class GeneratorAgent(BaseAgent):
    """Agent 1: Falsity Chart Generator
    
    Generates the initial falsity chart from complaint text.
    """
    
    def __init__(self):
        super().__init__(config.GENERATOR_PROMPT_PATH, agent_name="Generator")
    
    def generate_chart(self, complaint_text: str, iteration: int = 1) -> str:
        """
        Generate a falsity chart from the complaint text.
        
        Args:
            complaint_text: Full text of the legal complaint
            iteration: Current iteration number for logging
            
        Returns:
            Markdown formatted falsity chart
        """
        user_input = f"Please analyze the following complaint and generate a falsity chart:\n\n{complaint_text}"
        return self.generate_response(user_input, iteration)