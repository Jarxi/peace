# Multi-stage build for Rockrooster MCP Server + UI
FROM node:20-slim AS builder

# Install Python and build dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
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

# Copy server source
WORKDIR /app/server
COPY server/ ./

# Install Python dependencies directly from pyproject.toml
RUN pip3 install --no-cache-dir --break-system-packages mcp[cli]>=1.19.0 openai>=1.57.4 supabase>=2.10.0 python-dotenv>=1.0.0 uvicorn

# Production stage
FROM python:3.10-slim

# Install curl for healthchecks
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create app user
RUN useradd -m -u 1000 appuser

WORKDIR /app

# Copy built assets from builder
COPY --from=builder --chown=appuser:appuser /app/server /app/server

WORKDIR /app/server

# Install Python dependencies in production stage
RUN pip install --no-cache-dir --break-system-packages mcp[cli]>=1.19.0 openai>=1.57.4 supabase>=2.10.0 python-dotenv>=1.0.0 uvicorn

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
