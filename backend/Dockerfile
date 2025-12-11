FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Create uploads directory permissions
RUN mkdir -p uploads/signatures && chmod -R 777 uploads

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
