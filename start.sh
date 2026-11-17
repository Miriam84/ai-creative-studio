#!/usr/bin/env bash
echo "========================================================"
echo "  OmniStudio: Magnific + Higgsfield + ElevenLabs Suite  "
echo "========================================================"

# Backend setup
echo "[1/3] Preparant Backend..."
cd backend
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt --quiet

echo "[2/3] Iniciant Backend..."
python3 main.py &
BACKEND_PID=$!

echo "[3/3] Iniciant Frontend..."
cd ../frontend
if [ ! -d "node_modules" ]; then
    npm install
fi
npm run dev &
FRONTEND_PID=$!

echo "========================================================"
echo "  Aplicació executant-se a: http://localhost:5173        "
echo "========================================================"

wait $BACKEND_PID $FRONTEND_PID
