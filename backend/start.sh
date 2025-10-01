#!/bin/bash

# Kill any existing processes on port 8000
echo "Checking for existing processes on port 8000..."
if lsof -ti:8000 > /dev/null 2>&1; then
    echo "Killing existing processes on port 8000..."
    kill $(lsof -ti:8000)
    sleep 2
fi

# Activate virtual environment and start server
echo "Starting FitQuest backend server..."
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
