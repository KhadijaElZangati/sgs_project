@echo off
cd /d "C:\Users\lenovo T490\Downloads\sgs_project"

echo Arret des anciens processus SGS...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5000 "') do taskkill /F /PID %%a 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173 "') do taskkill /F /PID %%a 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5174 "') do taskkill /F /PID %%a 2>nul
timeout /t 1 /nobreak >nul

echo Demarrage du backend (http://localhost:5000)...
start "SGS Backend" cmd /c "node sgs-backend/index.js & pause"

echo Demarrage du frontend (http://localhost:5173)...
cd sgs_frontend
start "SGS Frontend" cmd /c "npx vite --host 0.0.0.0 --port 5173 & pause"

echo.
echo ========================================
echo  Application demarree !
echo  Ouvrez http://localhost:5173
echo ========================================
echo.
echo  Fermez les fenetres "SGS Backend"
echo  et "SGS Frontend" pour arreter.
echo.
pause
