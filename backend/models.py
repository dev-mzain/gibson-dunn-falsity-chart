from pydantic import BaseModel
from typing import List, Optional

class IterationData(BaseModel):
    """Data for a single iteration in the workflow."""
    iteration: int
    chart: str
    issues: str

class ProcessingResult(BaseModel):
    """Result of processing a complaint."""
    final_chart: str
    iterations: int
    history: List[IterationData]
    status: str  # "approved" or "max_iterations_reached"
    log_file: Optional[str] = None  # Path to the log file for this run

class UploadResponse(BaseModel):
    """Response after uploading a file."""
    message: str
    filename: str
    text_length: int

class ErrorResponse(BaseModel):
    """Error response model."""
    error: str
    detail: Optional[str] = None