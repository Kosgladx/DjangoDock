@echo off
setlocal

:: Garante que o diretorio de trabalho inicial seja a raiz do projeto
cd /d "%~dp0"
echo ===================================================
echo Iniciando Frontend React (EduSchedule AI UI)...
echo ===================================================

where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    where winget >nul 2>nul
    if %ERRORLEVEL% equ 0 (
        echo [AUTO] Node.js nao encontrado. Instalando Node.js LTS automaticamente via winget...
        winget install --id OpenJS.NodeJS.LTS -e --accept-source-agreements --accept-package-agreements
        if exist "%ProgramFiles%\nodejs" (
            set "PATH=%ProgramFiles%\nodejs;%PATH%"
        )
    )
)

where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERRO] Node.js e npm nao foram encontrados no seu computador!
    echo Para rodar a interface web:
    echo   1. Instale o Node.js LTS em https://nodejs.org/
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