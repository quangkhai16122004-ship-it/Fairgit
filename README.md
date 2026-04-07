# FairGit

FairGit is a full-stack system to evaluate individual contribution in team repositories using Git history.

## Architecture

- `apps/web`: React + Vite frontend
- `apps/api`: Express + MongoDB API
- `services/analyzer`: BullMQ worker for repository analysis and scoring
- `infra/docker-compose.yml`: local deployment stack (Mongo, Redis, API, Analyzer, Web)

Data flow:

1. User creates a run from the frontend.
2. API creates a `Run` record and enqueues a BullMQ job.
3. Analyzer pulls the job, fetches commits, computes scoring and evidence.
4. Analyzer stores `Result` rows and updates run progress/status.
5. Frontend reads run status + leaderboard + evidence.

## Scoring (v2)

Each contributor gets:

- `Consistency` (0..30): activity spread across days/weeks, with burst penalty.
- `Impact` (0..50): weighted impact using line changes by file category (core/test/doc/other/noise).
- `Focus` (0..20): concentration on core work, penalized for noise/tiny spam commits.
- `Confidence` (0..100): reliability of the score based on data volume and activity spread.

Fairness controls:

- tiny commit pattern penalty
- noise-heavy contribution penalty
- logarithmic scaling to reduce outlier domination
- impact normalization by P90 baseline (instead of raw max)

## Quick Start (Local)

Prerequisites:

- Node.js 20+
- pnpm
- Docker (optional but recommended for Mongo/Redis)

### 1. Start infra

```bash
cd infra
docker compose up -d mongo redis
```

### 2. Configure env

Copy and adjust:

- `apps/api/.env.example` -> `apps/api/.env`
- `services/analyzer/.env.example` -> `services/analyzer/.env`
- `apps/web/.env.example` -> `apps/web/.env` (optional)

### 3. Install dependencies

```bash
pnpm install
```

### 4. Run services

```bash
pnpm dev:api
pnpm dev:analyzer
pnpm dev:web
```

## Useful Commands

```bash
pnpm typecheck
pnpm build
pnpm test
pnpm --filter api seed:admin
pnpm --filter api seed:users
```

## Docker Compose (Full stack)

```bash
cd infra
docker compose up --build
```

- Web: http://localhost:8080
- API: http://localhost:4000
- Mongo: localhost:27017
- Redis: localhost:6379

## Default Seed Accounts

- `admin@fairgit.local` / `Admin123!`
- `manager@fairgit.local` / `Manager123!`
- `member@fairgit.local` / `Member123!`
