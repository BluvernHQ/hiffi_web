# Docker Setup for Hiffi Web

This project can be run using Docker in both development and production modes.

## Prerequisites

- Docker installed on your system
- Docker Compose installed (v1: `docker-compose` or v2: `docker compose`)
- Environment variables configured (see below)

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# Required: Workers API Key for accessing video/thumbnail content
WORKERS_API_KEY=SECRET_KEY

# Optional: Alternative public env var
# NEXT_PUBLIC_WORKERS_API_KEY=SECRET_KEY
```

**Note:** If you don't have a `.env.local` file, the container will still run but video/thumbnail access may fail.

## Running in Production Mode

Build and run the production Docker container:

### Using Docker Compose v2 (recommended):
```bash
# Build and start the container
docker compose up -d

# View logs
docker compose logs -f

# Stop the container
docker compose down
```

### Using Docker Compose v1:
```bash
# Build and start the container
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the container
docker-compose down
```

The application will be available at `http://localhost:3000`

## Running in Development Mode

For development with hot-reloading:

### Using Docker Compose v2:
```bash
# Build and start the development container
docker compose -f docker-compose.dev.yml up

# Or run in detached mode
docker compose -f docker-compose.dev.yml up -d

# View logs
docker compose -f docker-compose.dev.yml logs -f

# Stop the container
docker compose -f docker-compose.dev.yml down
```

### Using Docker Compose v1:
```bash
# Build and start the development container
docker-compose -f docker-compose.dev.yml up

# Or run in detached mode
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop the container
docker-compose -f docker-compose.dev.yml down
```

## Building the Docker Image

To build the Docker image manually:

```bash
# Production build
docker build -t hiffi-web:latest .

# Development build
docker build -f Dockerfile.dev -t hiffi-web:dev .
```

## Troubleshooting

### Port Already in Use

If port 3000 is already in use, modify the port mapping in `docker-compose.yml`:

```yaml
ports:
  - "3001:3000"  # Change 3001 to any available port
```

### Environment Variables Not Loading

Make sure your `.env.local` file is in the root directory and contains the required variables. The docker-compose files are configured to load from `.env.local` and `.env` files.

### Container Won't Start

Check the logs for errors:

```bash
docker-compose logs web
```

### Rebuilding After Code Changes

In production mode, you need to rebuild the image:

```bash
# Docker Compose v2
docker compose up -d --build

# Docker Compose v1
docker-compose up -d --build
```

In development mode, changes are automatically reflected due to volume mounting.

## Quick Start

1. **Create `.env.local` file** (if you haven't already):
   ```bash
   echo "WORKERS_API_KEY=SECRET_KEY" > .env.local
   ```

2. **Start the application**:
   ```bash
   # Production
   docker compose up -d
   
   # Development
   docker compose -f docker-compose.dev.yml up
   ```

3. **Access the application**: Open `http://localhost:3000` in your browser

