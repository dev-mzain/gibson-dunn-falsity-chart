from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import io
import logging
from typing import Optional

from orchestrator import Orchestrator
from utils.pdf_extractor import extract_text_from_pdf, validate_complaint_text
from models import ProcessingResult, UploadResponse, ErrorResponse

# Configure root logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)-8s | %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

app = FastAPI(
    title="Falsity Chart Generator API",
    description="Multi-agent system for generating falsity charts from legal complaints",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "message": "Falsity Chart Generator API",
        "status": "running",
        "version": "1.0.0"
    }

@app.post("/api/upload", response_model=UploadResponse)
async def upload_file(file: UploadFile = File(...)):
    """
    Upload a PDF or text file containing a legal complaint.
    
    Args:
        file: PDF or text file
        
    Returns:
        Upload confirmation with extracted text length
    """
    try:
        # Validate file type
        if not file.filename.endswith(('.pdf', '.txt')):
            raise HTTPException(
                status_code=400,
                detail="Only PDF and TXT files are supported"
            )
        
        # Read file content
        content = await file.read()
        
        # Extract text based on file type
        if file.filename.endswith('.pdf'):
            pdf_file = io.BytesIO(content)
            text = extract_text_from_pdf(pdf_file)
        else:
            text = content.decode('utf-8')
        
        # Validate extracted text
        if not validate_complaint_text(text):
            raise HTTPException(
                status_code=400,
                detail="Invalid complaint text. Please ensure the file contains a legal complaint."
            )
        
        return UploadResponse(
            message="File uploaded successfully",
            filename=file.filename,
            text_length=len(text)
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing file: {str(e)}"
        )

@app.post("/api/process", response_model=ProcessingResult)
async def process_complaint(file: UploadFile = File(...)):
    """
    Process a complaint file through the multi-agent workflow.
    
    Args:
        file: PDF or text file containing the complaint
        
    Returns:
        Processing result with final chart and iteration history
    """
    try:
        # Validate file type
        if not file.filename.endswith(('.pdf', '.txt')):
            raise HTTPException(
                status_code=400,
                detail="Only PDF and TXT files are supported"
            )
        
        # Read and extract text
        content = await file.read()
        
        if file.filename.endswith('.pdf'):
            pdf_file = io.BytesIO(content)
            complaint_text = extract_text_from_pdf(pdf_file)
        else:
            complaint_text = content.decode('utf-8')
        
        # Validate text
        if not validate_complaint_text(complaint_text):
            raise HTTPException(
                status_code=400,
                detail="Invalid complaint text. Please ensure the file contains a legal complaint."
            )
        
        # Create a new orchestrator for each request to get fresh logging
        orchestrator = Orchestrator()
        
        # Process through orchestrator
        result = orchestrator.process_complaint(complaint_text)
        
        return ProcessingResult(**result)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing complaint: {str(e)}"
        )

@app.get("/api/health")
async def health_check():
    """Health check endpoint for monitoring."""
    return {
        "status": "healthy",
        "service": "falsity-chart-generator"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)