@echo off
setlocal
echo ===================================================
echo Iniciando Frontend React (EduSchedule AI UI)...
echo ===================================================

where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERRO] Node.js e npm nao foram encontrados no seu computador!
    echo Para rodar a interface web:
    echo   1. Baixe e instale a versao LTS em https://nodejs.org/
    echo   2. Feche e abra o terminal novamente.
    echo.
    pause
    exit /b 1
)

cd /d "%~dp0\frontend"
if not exist "node_modules" (
    echo Instalando dependencias do frontend pela primeira vez...
    call npm install
)

call npm run dev
pause