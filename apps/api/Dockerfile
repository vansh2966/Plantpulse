FROM python:3.10-slim

# Prevent Python from writing .pyc files and enable unbuffered logging
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies required for ML libraries like OpenCV (via Albumentations)
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Render automatically sets the PORT environment variable (default is 10000)
ENV PORT=10000
EXPOSE ${PORT}

# Run the FastAPI server
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT}
