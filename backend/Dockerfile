FROM python:3.11-slim

WORKDIR /app

# Install deps first (better layer caching). Pakai requirements-prod.txt (ramping,
# tanpa emergentintegrations/jq) supaya build cepat & tanpa kompilasi.
COPY requirements-prod.txt .
RUN pip install --no-cache-dir -r requirements-prod.txt

# Salin kode backend
COPY . .

# Railway/Render meng-inject PORT. Default 8000 untuk lokal.
CMD ["sh", "-c", "uvicorn server:app --host 0.0.0.0 --port ${PORT:-8000}"]
