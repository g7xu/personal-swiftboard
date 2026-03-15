# Personal Swiftboard

A self-hosted personal productivity web application designed to replicate the clean, "sticky-note" aesthetic of SwiftBoard.io.

## Features

- **Sticky Note Interface**: Drag-and-drop tasks between columns.
- **Weekly Sprints**: Focus on the current week.
- **Dockerized**: Easy deployment with Docker Compose.
- **Self-Hosted**: You own your data (PostgreSQL).
- **Automated Backups**: Daily backups of your database.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Styling**: Tailwind CSS
- **Containerization**: Docker & Docker Compose

## Getting Started

### Prerequisites

- Docker and Docker Compose installed.
- Node.js installed (for local development).

### Local Development (First Time)

1. Copy the environment template and fill in your secrets:
    ```bash
    cp .env.example .env.local
    ```
    Edit `.env.local` with your Google OAuth credentials and generate an `AUTH_SECRET`:
    ```bash
    openssl rand -hex 32
    ```

2. Install dependencies:
    ```bash
    npm install
    ```

3. Start the local database and run migrations (creates an empty local DB with all tables):
    ```bash
    npm run db:setup
    ```
    This starts a PostgreSQL Docker container on port 5433 and runs Prisma migrations to create the schema. It does **not** copy any data from production — you start with a fresh database.

4. Start the dev server:
    ```bash
    npm run dev
    ```

5. Open [http://localhost:3000](http://localhost:3000) and sign in. A new sprint will be created automatically.

### Subsequent Sessions

The database schema persists across container restarts, so you only need:

```bash
npm run db:up    # ensure the database container is running (no-op if already up)
npm run dev
```

You do **not** need to re-run `db:setup` or `db:migrate` unless the Prisma schema has changed.

### Database Scripts

| Script | Description |
|--------|-------------|
| `npm run db:up` | Start PostgreSQL container |
| `npm run db:down` | Stop all Docker Compose services |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:setup` | First-time setup: start DB + run migrations |

## Project Structure

- `app/`: Next.js App Router pages and API actions.
- `components/`: React UI components (Board, Column, StickyNote).
- `prisma/`: Database schema.
- `lib/`: Shared utilities (Prisma client).
- `docker-compose.yml`: Docker services definition.
