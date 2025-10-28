# Multi-stage build for Rockrooster MCP Server + UI
FROM ubuntu:22.04 AS builder

# Prevent interactive prompts during installation
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies (using default Python 3.10)
RUN apt-get update && apt-get install -y \
    curl \
    git \
    python3 \
    python3-venv \
    python3-pip \
    ca-certificates \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 20.x from NodeSource
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm using corepack (comes with Node.js 20)
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set working directory
WORKDIR /app

# Copy UI source
COPY ui/package.json ui/pnpm-lock.yaml ./ui/
WORKDIR /app/ui
RUN pnpm install

# Copy rest of UI source and build
COPY ui/ ./
RUN pnpm run build

# Copy server source and install dependencies
WORKDIR /app/server
COPY server/pyproject.toml server/uv.lock* ./
RUN pip3 install --no-cache-dir -e .

# Copy rest of server source
COPY server/ ./

# Production stage
FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

# Install runtime dependencies (using default Python 3.10)
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create app user
RUN useradd -m -u 1000 appuser

WORKDIR /app

# Copy built assets from builder
COPY --from=builder --chown=appuser:appuser /app/server /app/server

# Install Python dependencies
WORKDIR /app/server
RUN pip3 install --no-cache-dir uvicorn

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8000

# Set default port (Railway will override with $PORT)
ENV PORT=8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health || exit 1

# Start the server (Railway will inject $PORT)
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT}
