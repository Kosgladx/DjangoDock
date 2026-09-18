@echo off
echo ===================================================
echo Iniciando Backend Django (EduSchedule AI API)...
echo ===================================================
cd /d "%~dp0\backend"
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
pause