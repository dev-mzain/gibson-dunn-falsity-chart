from agents.generator_agent import GeneratorAgent
from agents.reviewer_agent import ReviewerAgent
from agents.fixer_agent import FixerAgent
from utils.logger import RunLogger
from config import config
from typing import Dict, List, Optional

class Orchestrator:
    """
    Orchestrator manages the multi-agent workflow:
    1. Generate chart (Agent 1)
    2. Review chart (Agent 2)
    3. Fix chart if needed (Agent 3)
    4. Repeat until no issues or max iterations reached
    """
    
    def __init__(self):
        self.generator = GeneratorAgent()
        self.reviewer = ReviewerAgent()
        self.fixer = FixerAgent()
        self.max_iterations = config.MAX_ITERATIONS
        self.logger = RunLogger()
    
    def process_complaint(self, complaint_text: str) -> Dict:
        """
        Process a complaint through the multi-agent workflow.
        
        Args:
            complaint_text: Full text of the legal complaint
            
        Returns:
            Dictionary containing:
                - final_chart: The final falsity chart
                - iterations: Number of iterations performed
                - history: List of all iterations with charts and issues
                - log_file: Path to the log file for this run
        """
        # Start a new logging run
        run_id = self.logger.start_run()
        
        # Set logger for all agents
        self.generator.set_logger(self.logger)
        self.reviewer.set_logger(self.logger)
        self.fixer.set_logger(self.logger)
        
        # Log complaint info
        self.logger.log_info(f"Complaint text length: {len(complaint_text)} characters")
        self.logger.log_debug(f"Complaint preview: {complaint_text[:500]}...")
        
        history = []
        current_chart = None
        
        try:
            for iteration in range(1, self.max_iterations + 1):
                self.logger.log_iteration_start(iteration, self.max_iterations)
                
                # Step 1: Generate or use existing chart
                if iteration == 1:
                    self.logger.log_info("Step 1: Generating initial chart...")
                    current_chart = self.generator.generate_chart(complaint_text, iteration)
                
                # Step 2: Review the chart
                self.logger.log_info("Step 2: Reviewing chart...")
                issues = self.reviewer.review_chart(complaint_text, current_chart, iteration)
                
                # Store iteration data
                iteration_data = {
                    "iteration": iteration,
                    "chart": current_chart,
                    "issues": issues
                }
                history.append(iteration_data)
                
                # Check if chart is approved
                is_approved = self._is_chart_approved(issues)
                self.logger.log_iteration_result(iteration, not is_approved, issues)
                
                # Step 3: Check if we're done
                if is_approved:
                    self.logger.log_final_result("approved", iteration, current_chart)
                    log_file = self.logger.end_run()
                    return {
                        "final_chart": current_chart,
                        "iterations": iteration,
                        "history": history,
                        "status": "approved",
                        "log_file": log_file
                    }
                
                # Step 4: Fix the chart if not on last iteration
                if iteration < self.max_iterations:
                    self.logger.log_info("Step 3: Fixing chart based on issues...")
                    current_chart = self.fixer.fix_chart(complaint_text, current_chart, issues, iteration)
                else:
                    self.logger.log_warning("Max iterations reached - returning best effort chart")
            
            # Return final chart even if not fully approved
            self.logger.log_final_result("max_iterations_reached", self.max_iterations, current_chart)
            log_file = self.logger.end_run()
            
            return {
                "final_chart": current_chart,
                "iterations": self.max_iterations,
                "history": history,
                "status": "max_iterations_reached",
                "log_file": log_file
            }
            
        except Exception as e:
            self.logger.log_error(f"Processing failed: {str(e)}")
            log_file = self.logger.end_run()
            raise
    
    def _is_chart_approved(self, issues: str) -> bool:
        """
        Check if the chart is approved (no issues found).
        
        Args:
            issues: Issues text from reviewer
            
        Returns:
            True if approved, False otherwise
        """
        issues_lower = issues.lower()
        
        # Check for approval indicators - phrases that indicate the chart is good
        approval_phrases = [
            "no issues",
            "no discrepancies",
            "all correct",
            "chart is correct",
            "passes all checks",
            "no errors found",
            "highly accurate",
            "is accurate",
            "all pass",
            "no hallucinations",
            "no errors",
            "verified that every entry is accurate"
        ]
        
        # Check for rejection indicators - phrases that indicate problems
        rejection_phrases = [
            "fail",
            "error:",
            "hallucination:",
            "citation error",
            "quote error",
            "attribution error",
            "warning:",
            "needs correction",
            "incorrect",
            "mismatch"
        ]
        
        # If any rejection phrase is found (not in a "no X" context), reject
        for phrase in rejection_phrases:
            if phrase in issues_lower:
                # Check if it's negated (e.g., "no hallucination")
                negation_check = f"no {phrase}"
                if negation_check not in issues_lower:
                    # Check for "| **Pass** |" pattern - if all rows pass, it's approved
                    pass_count = issues_lower.count("| **pass**")
                    fail_count = issues_lower.count("| **fail**")
                    warning_count = issues_lower.count("| **warning**")
                    
                    if fail_count > 0 or warning_count > 0:
                        return False
        
        # Check if all rows are marked as Pass
        if "| **pass**" in issues_lower:
            fail_count = issues_lower.count("| **fail**")
            warning_count = issues_lower.count("| **warning**")
            if fail_count == 0 and warning_count == 0:
                return True
        
        # Check for approval phrases
        return any(phrase in issues_lower for phrase in approval_phrases)