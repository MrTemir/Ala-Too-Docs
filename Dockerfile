# syntax=docker/dockerfile:1
# Образ бэкенда AlaToo-Doc (FastAPI + xhtml2pdf/ReportLab).
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Шрифты с кириллицей (включая кыргызские Ң, Ө, Ү): pdf_engine/core.py ищет
# LiberationSerif / DejaVuSerif по системным путям.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        fonts-liberation \
        fonts-liberation2 \
        fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY app ./app
# Логотип для PDF: core.py берёт его из frontend/public/logo.png.
COPY frontend/public/logo.png ./frontend/public/logo.png

RUN useradd --create-home --uid 1000 appuser \
    && mkdir -p static/pdfs static/generated_pdfs \
    && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

# Сначала один раз создаём таблицы (чтобы два воркера не делали это наперегонки),
# потом запускаем uvicorn с двумя процессами.
CMD ["sh", "-c", "python -m app.cli init-db && exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2 --proxy-headers --forwarded-allow-ips '*'"]
