#!/bin/bash

# Red String Theory - Service Startup Script
# Starts both SpoonOS service and Node.js API server

echo "🚀 Starting Red String Theory Services"
echo "======================================"

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found"
    echo "Please copy .env.example to .env and configure your API keys"
    exit 1
fi

# Check for LLM API key
if ! grep -q "OPENAI_API_KEY=sk-" .env && \
   ! grep -q "ANTHROPIC_API_KEY=sk-ant-" .env && \
   ! grep -q "GEMINI_API_KEY=AIza" .env; then
    echo "⚠️  Warning: No LLM API key configured in .env"
    echo "SpoonOS dialogue generation will use fallback mode"
    echo ""
fi

# Start SpoonOS service in background
echo "🐍 Starting SpoonOS Service (Python)..."
cd spoon_service
python server.py &
SPOON_PID=$!
cd ..

# Wait for SpoonOS to start
sleep 3

# Check if SpoonOS started successfully
if curl -s http://localhost:5000/health > /dev/null 2>&1; then
    echo "✅ SpoonOS Service running on port 5000"
else
    echo "⚠️  SpoonOS Service may not have started correctly"
fi

# Start Node.js API server
echo "📦 Starting Node.js API Server..."
npm start &
NODE_PID=$!

# Wait a bit for Node.js to start
sleep 2

echo ""
echo "✅ Services Started!"
echo "======================================"
echo "SpoonOS Service:  http://localhost:5000"
echo "API Server:       http://localhost:3001"
echo ""
echo "To stop services, press Ctrl+C"
echo "Or run: kill $SPOON_PID $NODE_PID"
echo ""

# Keep script running and forward Ctrl+C to both processes
trap "kill $SPOON_PID $NODE_PID; exit" INT TERM

wait
