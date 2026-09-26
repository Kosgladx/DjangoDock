@echo off
setlocal enabledelayedexpansion

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
if not exist ".venv" (
    echo Criando ambiente virtual em .venv...
    %PYTHON_CMD% -m venv .venv
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
if not exist "backend\.env" (
    if exist "backend\.env.example" (
        copy "backend\.env.example" "backend\.env" >nul
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
call .venv\Scripts\python.exe -m pip install -r backend\requirements.txt
if %ERRORLEVEL% neq 0 (
    echo [ERRO] Falha ao instalar dependencias do backend.
    pause
    exit /b 1
)
echo [OK] Dependencias do backend instaladas.
echo.

:: 5. Executando migracoes e populando banco de dados
echo [5/6] Preparando banco de dados...
call .venv\Scripts\python.exe backend\manage.py migrate
if %ERRORLEVEL% neq 0 (
    echo [ERRO] Falha ao executar migracoes no banco de dados.
    pause
    exit /b 1
)
echo.
echo Populando dados iniciais (seed)...
call .venv\Scripts\python.exe backend\manage.py seed_data
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
    echo O backend esta 100%% configurado e pronto.
    echo Para rodar o frontend React/Vite:
    echo   1. Instale o Node.js LTS em https://nodejs.org/
    echo   2. Abra o terminal na pasta frontend e execute: npm install
) else (
    if exist "frontend\package.json" (
        echo Instalando pacotes do frontend...
        pushd frontend
        call npm install
        popd
        echo [OK] Dependencias do frontend instaladas.
    )
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
