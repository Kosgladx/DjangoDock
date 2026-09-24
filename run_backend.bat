@echo off
setlocal
echo ===================================================
echo Iniciando Backend Django (EduSchedule AI API)...
echo ===================================================

cd /d "%~dp0"

if exist ".venv\Scripts\python.exe" (
    set PYTHON_EXEC=.venv\Scripts\python.exe
) else if exist "backend\.venv\Scripts\python.exe" (
    set PYTHON_EXEC=backend\.venv\Scripts\python.exe
) else (
    echo [AVISO] Ambiente virtual (.venv) nao foi encontrado!
    echo Execute o script "setup_dev.bat" na raiz para preparar o ambiente.
    echo.
    set PYTHON_EXEC=python
)

%PYTHON_EXEC% backend\manage.py migrate
%PYTHON_EXEC% backend\manage.py runserver 127.0.0.1:8000
pause