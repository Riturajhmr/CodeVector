# Tempo Backend

Cursor-paginated product API built with Node.js, Express, and PostgreSQL.

## Prerequisites

- Node.js 18+
- PostgreSQL

## Setup

```bash
# Install dependencies
npm install

# Copy environment file and fill in your database URL
cp .env.example .env
```

Edit `.env`:

```
PORT=3000
DATABASE_URL=postgresql://username:password@localhost:5432/products_db
```

## Run locally

```bash
# Development (auto-restarts on file changes)
npm run dev

# Production
npm start
```

The server logs the port and confirms the database connection on startup.

**Health check:**

```
GET /health
```
