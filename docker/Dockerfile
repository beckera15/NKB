# MRS1000 LIDAR Visualization for Red Lion Flex Edge
# Multi-stage build for optimized container size

FROM python:3.11-slim as builder

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Create virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install Python dependencies
COPY requirements.txt /tmp/
RUN pip install --no-cache-dir -r /tmp/requirements.txt


# Production image
FROM python:3.11-slim

# Labels for container identification
LABEL maintainer="LIDAR Visualization Team"
LABEL description="SICK MRS1000 LIDAR Visualization for Red Lion Flex Edge"
LABEL version="1.0.0"

# Copy virtual environment from builder
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Create non-root user for security
RUN useradd -m -s /bin/bash appuser

# Set working directory
WORKDIR /app

# Copy application files
COPY src/backend/*.py ./backend/
COPY src/frontend ./frontend/

# Set ownership
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose ports
# 8080 - HTTP/WebSocket server
# 2112 - UDP receiver for LIDAR data
EXPOSE 8080
EXPOSE 2112/udp

# Environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8080/api/status')" || exit 1

# Default command
CMD ["python", "backend/app.py", "--host", "0.0.0.0", "--port", "8080"]
