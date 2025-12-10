# Falsity Chart Generator - Backend

Multi-agent system for generating falsity charts from legal complaints using Google Gemini 2.0 Flash.

## Architecture

### Components

1. **Agent 1 - Generator Agent** (`agents/generator_agent.py`)
   - Generates initial falsity chart from complaint text
   - Uses lightweight prompt for direct extraction
   - No chunking or preprocessing

2. **Agent 2 - Reviewer Agent** (`agents/reviewer_agent.py`)
   - Reviews generated chart for accuracy
   - Identifies hallucinations and errors
   - Returns list of issues or "No issues"

3. **Agent 3 - Fixer Agent** (`agents/fixer_agent.py`)
   - Fixes chart based on reviewer feedback
   - Corrects errors and removes hallucinations

4. **Orchestrator** (`orchestrator.py`)
   - Manages the multi-agent workflow
   - Runs up to 3 iterations:
     - Generate chart
     - Review chart
     - Fix chart (if issues found)
   - Stops when reviewer approves or max iterations reached

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Add your Google API key to `.env`:
```
GOOGLE_API_KEY=your_actual_api_key_here
```

## Running the Server

```bash
python main.py
```

Or with uvicorn:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

## API Endpoints

### 1. Health Check
```
GET /
GET /api/health
```

### 2. Upload File (Validation Only)
```
POST /api/upload
Content-Type: multipart/form-data

Body:
- file: PDF or TXT file
```

Response:
```json
{
  "message": "File uploaded successfully",
  "filename": "complaint.pdf",
  "text_length": 15000
}
```

### 3. Process Complaint
```
POST /api/process
Content-Type: multipart/form-data

Body:
- file: PDF or TXT file
```

Response:
```json
{
  "final_chart": "| Para | Date | Speaker | ... |",
  "iterations": 2,
  "history": [
    {
      "iteration": 1,
      "chart": "...",
      "issues": "..."
    }
  ],
  "status": "approved"
}
```

## Project Structure

```
backend/
├── agents/
│   ├── __init__.py
│   ├── base_agent.py       # Base class for all agents
│   ├── generator_agent.py  # Agent 1
│   ├── reviewer_agent.py   # Agent 2
│   └── fixer_agent.py      # Agent 3
├── prompts/
│   ├── generator.txt       # Generator prompt
│   ├── reviewer.txt        # Reviewer prompt
│   └── fixer.txt          # Fixer prompt
├── utils/
│   ├── __init__.py
│   └── pdf_extractor.py   # PDF text extraction
├── config.py              # Configuration
├── models.py              # Pydantic models
├── orchestrator.py        # Multi-agent orchestrator
├── main.py               # FastAPI application
├── requirements.txt      # Dependencies
└── .env.example         # Environment variables template
```

## Configuration

Edit `config.py` to modify:
- Model name (default: `gemini-2.0-flash-exp`)
- Max iterations (default: 3)
- Max tokens (default: 8000)
- Temperature (default: 0.1)

## Error Handling

The API returns appropriate HTTP status codes:
- `200`: Success
- `400`: Bad request (invalid file type, invalid complaint text)
- `500`: Server error (processing failure)

## Development

To test the API:

```bash
# Using curl
curl -X POST "http://localhost:8000/api/process" \
  -F "file=@path/to/complaint.pdf"

# Using Python requests
import requests

with open('complaint.pdf', 'rb') as f:
    response = requests.post(
        'http://localhost:8000/api/process',
        files={'file': f}
    )
    print(response.json())