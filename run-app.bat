@echo off
title StreamPulse AI Launcher
echo ===================================================
echo       Launching StreamPulse AI Co-Pilot
echo ===================================================
echo.
echo Starting Backend Server on http://localhost:5000...
start cmd /k "cd server && npm start"
echo Starting Frontend Client on http://localhost:5173...
start cmd /k "cd client && npm run dev"
echo.
echo ===================================================
echo Done! Open http://localhost:5173 in your browser.
echo For OBS Studio overlay: http://localhost:5173/overlay
echo ===================================================
pause

