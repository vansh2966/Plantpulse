# Build stage
FROM python:3.11-slim as builder

WORKDIR /build
COPY requirements.txt .
# Install dependencies into the local user directory
RUN pip install --user --no-cache-dir -r requirements.txt

# Final stage
FROM python:3.11-slim

# Create a non-root user
RUN useradd -m -u 1000 cropaiuser
USER cropaiuser

WORKDIR /app

# Copy installed dependencies from builder
COPY --from=builder /root/.local /home/cropaiuser/.local

# Ensure local bin is in PATH
ENV PATH=/home/cropaiuser/.local/bin:$PATH

# Copy application code
COPY --chown=cropaiuser:cropaiuser . .

# Expose API port
EXPOSE 8000

# Run the API
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
