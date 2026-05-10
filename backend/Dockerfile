FROM python:3.12-slim

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PORT=8080

# Create a non-root user
RUN useradd -m -u 1000 appuser

# Set working directory
WORKDIR /app

# Copy requirements file
COPY requirements.txt .

# Install dependencies system-wide using uv
RUN uv pip install --system --no-cache -r requirements.txt

# Copy the rest of the backend code
COPY . .

# Ensure the non-root user owns the app directory
RUN chown -R appuser:appuser /app

# Switch to the non-root user
USER appuser

# Expose the application port
EXPOSE $PORT

# Start the FastAPI application via Uvicorn
# Cloud Run injects the PORT environment variable.
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT}
