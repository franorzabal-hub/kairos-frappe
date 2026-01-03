# Kairos - Custom Frappe Image
# Multi-stage build based on official frappe_docker approach

# =============================================================================
# Build Arguments
# =============================================================================
ARG PYTHON_VERSION=3.11.6
ARG DEBIAN_BASE=bookworm
ARG NODE_VERSION=20
ARG FRAPPE_BRANCH=version-15
ARG FRAPPE_PATH=https://github.com/frappe/frappe

# =============================================================================
# Stage 1: Base - Runtime dependencies
# =============================================================================
FROM python:${PYTHON_VERSION}-slim-${DEBIAN_BASE} AS base

RUN apt-get update && apt-get install -y --no-install-recommends \
    # Runtime essentials
    curl \
    git \
    vim \
    # Database clients
    mariadb-client \
    # wkhtmltopdf dependencies
    fontconfig \
    libfreetype6 \
    libjpeg62-turbo \
    libpng16-16 \
    libx11-6 \
    libxcb1 \
    libxext6 \
    libxrender1 \
    xfonts-75dpi \
    xfonts-base \
    # Node.js
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/* \
    && npm install -g yarn

# Install wkhtmltopdf (architecture-aware)
RUN ARCH=$(dpkg --print-architecture) && \
    curl -sLO https://github.com/wkhtmltopdf/packaging/releases/download/0.12.6.1-3/wkhtmltox_0.12.6.1-3.bookworm_${ARCH}.deb \
    && apt-get update && apt-get install -y --no-install-recommends ./wkhtmltox_0.12.6.1-3.bookworm_${ARCH}.deb \
    && rm wkhtmltox_0.12.6.1-3.bookworm_${ARCH}.deb \
    && rm -rf /var/lib/apt/lists/*

# Create frappe user
RUN groupadd -g 1000 frappe \
    && useradd -ms /bin/bash -u 1000 -g 1000 frappe

# =============================================================================
# Stage 2: Build - Compile dependencies
# =============================================================================
FROM base AS build

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    cron \
    gcc \
    g++ \
    libffi-dev \
    libmariadb-dev \
    libssl-dev \
    pkg-config \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# =============================================================================
# Stage 3: Builder - Build Frappe bench and install apps
# =============================================================================
FROM build AS builder

ARG FRAPPE_BRANCH
ARG FRAPPE_PATH

USER frappe
WORKDIR /home/frappe

# Install bench
RUN pip install --user frappe-bench

# Initialize bench with Frappe
ENV PATH="/home/frappe/.local/bin:${PATH}"
RUN bench init frappe-bench \
    --frappe-branch ${FRAPPE_BRANCH} \
    --frappe-path ${FRAPPE_PATH} \
    --skip-redis-config-generation \
    --no-backups \
    --verbose

WORKDIR /home/frappe/frappe-bench

# Copy and install Kairos app
COPY --chown=frappe:frappe ./kairos /home/frappe/frappe-bench/apps/kairos
RUN ./env/bin/pip install -e ./apps/kairos

# Build assets (frappe only - kairos has no frontend assets)
RUN bench build --app frappe

# Add kairos to apps.txt (ensure newline before appending)
RUN echo "" >> /home/frappe/frappe-bench/sites/apps.txt && \
    echo "kairos" >> /home/frappe/frappe-bench/sites/apps.txt

# Clean up .git folders to reduce image size
RUN find /home/frappe/frappe-bench/apps -name ".git" -type d -exec rm -rf {} + 2>/dev/null || true

# =============================================================================
# Stage 4: Production - Final runtime image
# =============================================================================
FROM base AS production

# Metadata
LABEL maintainer="Fran Orzabal <franorzabal@gmail.com>"
LABEL org.opencontainers.image.title="Kairos"
LABEL org.opencontainers.image.description="School-parent communication platform on Frappe"
LABEL org.opencontainers.image.source="https://github.com/franorzabal-hub/kairos-frappe"

USER frappe
WORKDIR /home/frappe/frappe-bench

# Copy built application from builder
COPY --from=builder --chown=frappe:frappe /home/frappe/frappe-bench /home/frappe/frappe-bench
COPY --from=builder --chown=frappe:frappe /home/frappe/.local /home/frappe/.local

ENV PATH="/home/frappe/.local/bin:/home/frappe/frappe-bench/env/bin:${PATH}"

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/api/method/ping || exit 1

# Default command - Gunicorn
CMD ["gunicorn", \
    "--bind=0.0.0.0:8000", \
    "--workers=4", \
    "--threads=4", \
    "--worker-class=gthread", \
    "--timeout=120", \
    "--graceful-timeout=30", \
    "--keep-alive=5", \
    "--max-requests=5000", \
    "--max-requests-jitter=500", \
    "--chdir=/home/frappe/frappe-bench/sites", \
    "frappe.app:application"]
