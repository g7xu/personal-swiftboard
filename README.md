# Personal Swiftboard

A self-hosted personal productivity web application designed to replicate the clean, "sticky-note" aesthetic of SwiftBoard.io.

## Features

- **Sticky Note Interface**: Drag-and-drop tasks between columns.
- **Weekly Sprints**: Focus on the current week.
- **Dockerized**: Easy deployment with Docker Compose.
- **Self-Hosted**: You own your data (PostgreSQL).
- **Automated Backups**: Daily backups of your database.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Styling**: Tailwind CSS
- **Containerization**: Docker & Docker Compose

## Getting Started

### Prerequisites

- Docker and Docker Compose installed.

### Installation & Running

1.  Clone the repository (if you haven't already).
2.  Run the application using Docker Compose:

    ```bash
    docker-compose up -d
    ```

3.  Open your browser and navigate to [http://localhost:3000](http://localhost:3000).

### Local Development (Optional)

If you want to run the app locally without Docker for the web service:

1.  Start the database container:
    ```bash
    docker-compose up -d db
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Generate Prisma Client:
    ```bash
    npx prisma generate
    ```
4.  Run the development server:
    ```bash
    npm run dev
    ```

## Project Structure

- `app/`: Next.js App Router pages and API actions.
- `components/`: React UI components (Board, Column, StickyNote).
- `prisma/`: Database schema.
- `lib/`: Shared utilities (Prisma client).
- `docker-compose.yml`: Docker services definition.
