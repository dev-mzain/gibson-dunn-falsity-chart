#!/bin/bash

# Falsity Chart Generator - Backend Startup Script
# This script activates the virtual environment and starts the backend server with hot reload

echo "🚀 Starting Falsity Chart Generator Backend..."

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found!"
    echo "Please run ./setup.sh first to create the virtual environment."
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found!"
    echo "Please create .env file with your GOOGLE_API_KEY"
    echo "You can copy from .env.example: cp .env.example .env"
fi

# Activate virtual environment
echo "📦 Activating virtual environment..."
source venv/bin/activate

# Check if dependencies are installed
if ! python -c "import fastapi" 2>/dev/null; then
    echo "📥 Installing dependencies..."
    pip install -r requirements.txt
fi

# Create logs directory if it doesn't exist
mkdir -p logs

# Start the server with hot reload
echo ""
echo "✅ Starting server on http://localhost:8000"
echo "🔄 Hot reload enabled - changes will auto-restart the server"
echo "� Logs will be saved to ./logs/"
echo "Press Ctrl+C to stop the server"
echo ""

uvicorn main:app --reload --host 0.0.0.0 --port 8000