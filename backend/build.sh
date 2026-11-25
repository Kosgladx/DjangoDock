#!/usr/bin/env bash
set -o errexit

pip install -r requirements.txt
python manage.py collectstatic --noinput
python manage.py migrate --noinput

# Popula automaticamente o cenário oficial EDS apenas se o banco ainda estiver vazio
if ! python manage.py shell -c "from core.models import SchoolClass; import sys; sys.exit(0 if SchoolClass.objects.exists() else 1)"; then
  python manage.py seed_data --scenario=eds
fi
