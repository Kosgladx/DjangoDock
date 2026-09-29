@echo off
setlocal enabledelayedexpansion

:: Garante que o diretorio de trabalho seja sempre a raiz do projeto onde o script reside
cd /d "%~dp0"

echo ========================================================
echo    EduSchedule Timetabling - Setup de Desenvolvimento
echo ========================================================
echo.

:: 1. Verificando instalacao do Python
echo [1/6] Verificando Python...
where python >nul 2>nul
if %ERRORLEVEL% neq 0 (
    where py >nul 2>nul
    if %ERRORLEVEL% neq 0 (
        echo [ERRO] Python nao foi encontrado no PATH do sistema!
        echo Por favor, instale o Python 3.11 ou 3.12 (https://www.python.org/downloads/)
        echo IMPORTANTE: Marque a opcao "Add Python to PATH" durante a instalacao.
        pause
        exit /b 1
    ) else (
        set PYTHON_CMD=py
    )
) else (
    set PYTHON_CMD=python
)
echo [OK] Python detectado com sucesso.
echo.

:: 2. Criando ou verificando o ambiente virtual (.venv)
echo [2/6] Configurando ambiente virtual (.venv)...
if not exist "%~dp0.venv" (
    echo Criando ambiente virtual em .venv...
    "%PYTHON_CMD%" -m venv "%~dp0.venv"
    if %ERRORLEVEL% neq 0 (
        echo [ERRO] Falha ao criar ambiente virtual .venv.
        pause
        exit /b 1
    )
    echo [OK] Ambiente virtual criado com sucesso.
) else (
    echo [OK] Ambiente virtual .venv ja existe.
)
echo.

:: 3. Configurando arquivo de ambiente (.env)
echo [3/6] Verificando variaveis de ambiente (.env)...
if not exist "%~dp0backend\.env" (
    if exist "%~dp0backend\.env.example" (
        copy "%~dp0backend\.env.example" "%~dp0backend\.env" >nul
        echo [OK] backend\.env criado a partir de backend\.env.example.
    ) else (
        echo [AVISO] backend\.env.example nao encontrado.
    )
) else (
    echo [OK] backend\.env ja configurado.
)
echo.

:: 4. Instalando dependencias do backend
echo [4/6] Instalando dependencias Python (backend\requirements.txt)...
call "%~dp0.venv\Scripts\python.exe" -m pip install -r "%~dp0backend\requirements.txt"
if %ERRORLEVEL% neq 0 (
    echo [ERRO] Falha ao instalar dependencias do backend.
    pause
    exit /b 1
)
echo [OK] Dependencias do backend instaladas.
echo.

:: 5. Executando migracoes e populando banco de dados
echo [5/6] Preparando banco de dados...
call "%~dp0.venv\Scripts\python.exe" "%~dp0backend\manage.py" migrate
if %ERRORLEVEL% neq 0 (
    echo [ERRO] Falha ao executar migracoes no banco de dados.
    pause
    exit /b 1
)
echo.
echo Populando dados iniciais (seed)...
call "%~dp0.venv\Scripts\python.exe" "%~dp0backend\manage.py" seed_data
if %ERRORLEVEL% neq 0 (
    echo [ERRO] Falha ao popular dados iniciais.
    pause
    exit /b 1
)
echo.

:: 6. Verificando frontend (Node.js e npm)
echo [6/6] Verificando dependencias do frontend...
where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [AVISO] Node.js/npm nao foi detectado no PATH do sistema.
    where winget >nul 2>nul
    if !ERRORLEVEL! equ 0 (
        echo [AUTO] Instalando Node.js LTS automaticamente via winget...
        winget install --id OpenJS.NodeJS.LTS -e --accept-source-agreements --accept-package-agreements
        if exist "%ProgramFiles%\nodejs" (
            set "PATH=%ProgramFiles%\nodejs;!PATH!"
        )
    )
)

where npm >nul 2>nul
if %ERRORLEVEL% equ 0 (
    if exist "%~dp0frontend\package.json" (
        echo Instalando pacotes do frontend...
        pushd "%~dp0frontend"
        call npm install
        popd
        echo [OK] Dependencias do frontend instaladas.
    )
) else (
    echo [AVISO] Node.js nao detectado nesta sessao do terminal.
    echo Apos o termino da instalacao, reinicie o terminal para usar o npm.
)
echo.

echo ========================================================
echo    TUDO PRONTO! O ambiente esta 100%% configurado.
echo ========================================================
echo.
echo Como iniciar o projeto no dia a dia:
echo   1. Backend: Clique duplo em "run_backend.bat" (ou rode: .venv\Scripts\python backend\manage.py runserver)
echo   2. Frontend: Clique duplo em "run_frontend.bat" (ou rode: cd frontend ^&^& npm run dev)
echo.
echo Se o projeto for atualizado no futuro via "git pull":
echo   Basta dar 2 cliques neste "setup_dev.bat" novamente!
echo ========================================================
pause
