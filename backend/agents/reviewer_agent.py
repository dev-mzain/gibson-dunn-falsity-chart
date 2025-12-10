from agents.base_agent import BaseAgent
from config import config

class ReviewerAgent(BaseAgent):
    """Agent 2: Reviewer/QA Agent
    
    Reviews the generated falsity chart for errors and hallucinations.
    """
    
    def __init__(self):
        super().__init__(config.REVIEWER_PROMPT_PATH, agent_name="Reviewer")
    
    def review_chart(self, complaint_text: str, chart: str, iteration: int = 1) -> str:
        """
        Review the falsity chart against the original complaint.
        
        Args:
            complaint_text: Original complaint text
            chart: Generated falsity chart
            iteration: Current iteration number for logging
            
        Returns:
            List of issues found (or "No issues" if chart is correct)
        """
        user_input = f"""Please review the following falsity chart against the original complaint.

ORIGINAL COMPLAINT:
{complaint_text}

FALSITY CHART TO REVIEW:
{chart}

Please provide your audit findings."""
        
        return self.generate_response(user_input, iteration)