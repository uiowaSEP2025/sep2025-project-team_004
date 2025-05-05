# Use an official Python runtime as a parent image
# Make sure this Python version is compatible with your project needs
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Install system dependencies
# - supervisor: to run multiple processes (worker and beat)
# - libpq-dev & build-essential: needed for psycopg2 build
RUN apt-get update && apt-get install -y --no-install-recommends \
    supervisor \
    libpq-dev \
    build-essential \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create a directory for the supervisor log files if needed,
# although we'll redirect logs to stdout/stderr
RUN mkdir -p /var/log/supervisor

# Create app directory
WORKDIR /app

# Copy supervisor config file
# We will create this file next
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Install Python dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . /app/

# Expose ports if your application listens on any (not needed for celery worker/beat)
EXPOSE 8000

# Run supervisord
# -n flag means it stays in the foreground, which Docker requires
CMD ["/usr/bin/supervisord", "-n", "-c", "/etc/supervisor/conf.d/supervisord.conf"] 