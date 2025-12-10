from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
import io
import logging
import json
import asyncio
from typing import Optional, Dict
from queue import Queue
import threading

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


@app.post("/api/process-stream")
async def process_complaint_stream(file: UploadFile = File(...)):
    """
    Process a complaint file with Server-Sent Events for real-time progress updates.
    
    Args:
        file: PDF or text file containing the complaint
        
    Returns:
        SSE stream with progress updates and final result
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
        
        # Create a queue for progress updates
        progress_queue: Queue = Queue()
        result_holder: Dict = {}
        error_holder: Dict = {}
        
        def progress_callback(step: str, iteration: int, max_iterations: int, message: str):
            """Callback to receive progress updates from orchestrator."""
            progress_queue.put({
                "type": "progress",
                "step": step,
                "iteration": iteration,
                "max_iterations": max_iterations,
                "message": message
            })
        
        def run_processing():
            """Run the processing in a separate thread."""
            try:
                orchestrator = Orchestrator(progress_callback=progress_callback)
                result = orchestrator.process_complaint(complaint_text)
                result_holder["data"] = result
                progress_queue.put({"type": "complete", "result": result})
            except Exception as e:
                error_holder["error"] = str(e)
                progress_queue.put({"type": "error", "message": str(e)})
        
        # Start processing in background thread
        thread = threading.Thread(target=run_processing)
        thread.start()
        
        async def event_generator():
            """Generate SSE events from the progress queue."""
            while True:
                # Check for updates with a small timeout
                try:
                    # Use asyncio to avoid blocking
                    await asyncio.sleep(0.1)
                    
                    while not progress_queue.empty():
                        update = progress_queue.get_nowait()
                        
                        if update["type"] == "complete":
                            # Send final result
                            yield f"data: {json.dumps(update)}\n\n"
                            return
                        elif update["type"] == "error":
                            yield f"data: {json.dumps(update)}\n\n"
                            return
                        else:
                            # Send progress update
                            yield f"data: {json.dumps(update)}\n\n"
                    
                    # Check if thread is still alive
                    if not thread.is_alive() and progress_queue.empty():
                        if error_holder:
                            yield f"data: {json.dumps({'type': 'error', 'message': error_holder.get('error', 'Unknown error')})}\n\n"
                        return
                        
                except Exception as e:
                    yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
                    return
        
        return StreamingResponse(
            event_generator(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"
            }
        )
    
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