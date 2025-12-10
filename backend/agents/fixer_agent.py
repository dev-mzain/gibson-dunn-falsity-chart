from agents.base_agent import BaseAgent
from config import config

class FixerAgent(BaseAgent):
    """Agent 3: Reflection/Fix Agent
    
    Fixes issues in the falsity chart based on reviewer feedback.
    """
    
    def __init__(self):
        super().__init__(config.FIXER_PROMPT_PATH, agent_name="Fixer")
    
    def fix_chart(self, complaint_text: str, chart: str, issues: str, iteration: int = 1) -> str:
        """
        Fix the falsity chart based on identified issues.
        
        Args:
            complaint_text: Original complaint text
            chart: Current falsity chart with issues
            issues: List of issues from the reviewer
            iteration: Current iteration number for logging
            
        Returns:
            Corrected falsity chart
        """
        user_input = f"""Please fix the following falsity chart based on the audit report.

ORIGINAL COMPLAINT:
{complaint_text}

DRAFT FALSITY CHART:
{chart}

AUDIT REPORT (ISSUES TO FIX):
{issues}

Please generate the final, corrected falsity chart."""
        
        return self.generate_response(user_input, iteration)