#!/bin/sh
set -e

echo "==> [EduSchedule] Executando migracoes do banco de dados..."
python manage.py migrate --noinput

echo "==> [EduSchedule] Coletando arquivos estaticos..."
python manage.py collectstatic --noinput

echo "==> [EduSchedule] Verificando e populando dados iniciais (idempotente)..."
python manage.py seed_data --with-solver

echo "==> [EduSchedule] Iniciando servidor WSGI Gunicorn na porta 8000..."
exec gunicorn eduschedule_backend.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 3 \
    --timeout 120 \
    --access-logfile - \
    --error-logfile -

