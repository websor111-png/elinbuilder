#!/bin/bash

echo "=== INSTALARE APLICATIE ==="
echo ""

# Backend
echo "[1/4] Instalez backend..."
cd backend
pip install -r requirements.txt
cd ..

# Frontend
echo "[2/4] Instalez frontend..."
cd frontend
yarn install
cd ..

# Creare fisiere .env daca nu exista
echo "[3/4] Configurez fisierele .env..."

if [ ! -f backend/.env ]; then
    echo "MONGO_URL=mongodb://localhost:27017" > backend/.env
    echo "DB_NAME=myapp" >> backend/.env
    echo "  - backend/.env creat"
fi

if [ ! -f frontend/.env ]; then
    echo "REACT_APP_BACKEND_URL=http://localhost:8001" > frontend/.env
    echo "  - frontend/.env creat"
fi

echo "[4/4] Instalare completa!"
echo ""
echo "=== CUM SA PORNESTI APLICATIA ==="
echo ""
echo "Terminal 1 - Backend:"
echo "  cd backend && python server.py"
echo ""
echo "Terminal 2 - Frontend:"
echo "  cd frontend && yarn start"
echo ""
echo "Aplicatia va fi disponibila la: http://localhost:3000"
