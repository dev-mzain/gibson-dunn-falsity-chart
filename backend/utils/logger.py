import logging
import os
import sys
from datetime import datetime
from typing import Optional
import uuid

class RunLogger:
    """Logger that creates a unique log file for each processing run."""
    
    def __init__(self, logs_dir: str = "logs"):
        self.logs_dir = logs_dir
        self.run_id: Optional[str] = None
        self.log_file: Optional[str] = None
        self.logger: Optional[logging.Logger] = None
        self.file_handler: Optional[logging.FileHandler] = None
        self.console_handler: Optional[logging.StreamHandler] = None
        
        # Ensure logs directory exists
        os.makedirs(logs_dir, exist_ok=True)
    
    def start_run(self) -> str:
        """Start a new logging run with a unique ID."""
        self.run_id = datetime.now().strftime("%Y%m%d_%H%M%S") + "_" + str(uuid.uuid4())[:8]
        self.log_file = os.path.join(self.logs_dir, f"run_{self.run_id}.log")
        
        # Create a new logger for this run
        self.logger = logging.getLogger(f"falsity_chart_{self.run_id}")
        self.logger.setLevel(logging.DEBUG)
        self.logger.propagate = False  # Don't propagate to root logger
        
        # Remove any existing handlers
        for handler in self.logger.handlers[:]:
            self.logger.removeHandler(handler)
        
        # Create file handler
        self.file_handler = logging.FileHandler(self.log_file, encoding='utf-8')
        self.file_handler.setLevel(logging.DEBUG)
        
        # Create console handler - use sys.stdout for better compatibility with uvicorn
        self.console_handler = logging.StreamHandler(sys.stdout)
        self.console_handler.setLevel(logging.INFO)
        
        # Create formatter
        formatter = logging.Formatter(
            '%(asctime)s | %(levelname)-8s | %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        self.file_handler.setFormatter(formatter)
        self.console_handler.setFormatter(formatter)
        
        # Add handlers
        self.logger.addHandler(self.file_handler)
        self.logger.addHandler(self.console_handler)
        
        self._log_header()
        return self.run_id
    
    def _log_header(self):
        """Log the header for a new run."""
        if self.logger:
            self.logger.info("=" * 80)
            self.logger.info("FALSITY CHART GENERATOR - NEW RUN")
            self.logger.info(f"Run ID: {self.run_id}")
            self.logger.info(f"Started at: {datetime.now().isoformat()}")
            self.logger.info("=" * 80)
            self._flush()
    
    def log_agent_start(self, agent_name: str, iteration: int = 1):
        """Log when an agent starts processing."""
        if self.logger:
            self.logger.info("-" * 60)
            self.logger.info(f"AGENT: {agent_name} | Iteration: {iteration}")
            self.logger.info("-" * 60)
            self._flush()
    
    def log_agent_input(self, agent_name: str, input_preview: str, max_length: int = 500):
        """Log the input being sent to an agent."""
        if self.logger:
            preview = input_preview[:max_length] + "..." if len(input_preview) > max_length else input_preview
            self.logger.debug(f"[{agent_name}] INPUT PREVIEW:")
            self.logger.debug(preview)
            self._flush()
    
    def log_agent_output(self, agent_name: str, output: str, max_length: int = 1000):
        """Log the output from an agent."""
        if self.logger:
            preview = output[:max_length] + "..." if len(output) > max_length else output
            self.logger.info(f"[{agent_name}] OUTPUT PREVIEW:")
            self.logger.info(preview)
            
            # Log full output to file only
            self.logger.debug(f"[{agent_name}] FULL OUTPUT:")
            self.logger.debug(output)
            self._flush()
    
    def log_agent_complete(self, agent_name: str, duration_seconds: float):
        """Log when an agent completes processing."""
        if self.logger:
            self.logger.info(f"[{agent_name}] COMPLETED in {duration_seconds:.2f} seconds")
            self._flush()
    
    def log_agent_error(self, agent_name: str, error: str):
        """Log an error from an agent."""
        if self.logger:
            self.logger.error(f"[{agent_name}] ERROR: {error}")
            self._flush()
    
    def log_iteration_start(self, iteration: int, max_iterations: int):
        """Log the start of an iteration."""
        if self.logger:
            self.logger.info("")
            self.logger.info("=" * 60)
            self.logger.info(f"ITERATION {iteration} of {max_iterations}")
            self.logger.info("=" * 60)
            self._flush()
    
    def log_iteration_result(self, iteration: int, has_issues: bool, issues_preview: str = ""):
        """Log the result of an iteration."""
        if self.logger:
            if has_issues:
                self.logger.info(f"[Iteration {iteration}] Issues found - will attempt fix")
                if issues_preview:
                    preview = issues_preview[:300] + "..." if len(issues_preview) > 300 else issues_preview
                    self.logger.info(f"Issues preview: {preview}")
            else:
                self.logger.info(f"[Iteration {iteration}] No issues found - chart approved!")
            self._flush()
    
    def log_final_result(self, status: str, total_iterations: int, chart_preview: str = ""):
        """Log the final result of the processing."""
        if self.logger:
            self.logger.info("")
            self.logger.info("=" * 80)
            self.logger.info("PROCESSING COMPLETE")
            self.logger.info(f"Status: {status}")
            self.logger.info(f"Total iterations: {total_iterations}")
            self.logger.info(f"Log file: {self.log_file}")
            self.logger.info("=" * 80)
            
            if chart_preview:
                preview = chart_preview[:500] + "..." if len(chart_preview) > 500 else chart_preview
                self.logger.info("Final chart preview:")
                self.logger.info(preview)
            self._flush()
    
    def log_info(self, message: str):
        """Log an info message."""
        if self.logger:
            self.logger.info(message)
            self._flush()
    
    def log_debug(self, message: str):
        """Log a debug message."""
        if self.logger:
            self.logger.debug(message)
            self._flush()
    
    def log_warning(self, message: str):
        """Log a warning message."""
        if self.logger:
            self.logger.warning(message)
            self._flush()
    
    def log_error(self, message: str):
        """Log an error message."""
        if self.logger:
            self.logger.error(message)
            self._flush()
    
    def _flush(self):
        """Flush all handlers to ensure output is visible immediately."""
        if self.file_handler:
            self.file_handler.flush()
        if self.console_handler:
            self.console_handler.flush()
    
    def end_run(self):
        """End the current run and close handlers."""
        if self.logger:
            self.logger.info(f"Run ended at: {datetime.now().isoformat()}")
            
            if self.file_handler:
                self.file_handler.close()
                self.logger.removeHandler(self.file_handler)
            
            if self.console_handler:
                self.console_handler.close()
                self.logger.removeHandler(self.console_handler)
        
        return self.log_file
    
    def get_log_file_path(self) -> Optional[str]:
        """Get the path to the current log file."""
        return self.log_file


# Global logger instance
run_logger = RunLogger()