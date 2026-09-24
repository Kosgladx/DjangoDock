@echo off
echo ===================================================
echo Iniciando Backend Django (EduSchedule AI API)...
echo ===================================================
cd /d "%~dp0\backend"

if exist "%~dp0\.venv\Scripts\activate.bat" (
    call "%~dp0\.venv\Scripts\activate.bat"
) else if exist "%~dp0\backend\.venv\Scripts\activate.bat" (
    call "%~dp0\backend\.venv\Scripts\activate.bat"
)

python manage.py migrate
python manage.py runserver 127.0.0.1:8000
pause