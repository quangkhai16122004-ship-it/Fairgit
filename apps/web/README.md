# FairGit Web

Frontend for FairGit using React + Vite.

## Run in development

```bash
pnpm --filter web dev
```

By default web calls `http://localhost:4000`.
Set `VITE_API_BASE_URL` in `.env` if needed.

## Build

```bash
pnpm --filter web build
```

## Key Pages

- Dashboard: run/system overview and top contributors
- Projects: create/list repositories for analysis
- Runs: create runs, monitor progress, inspect lifecycle
- Results: leaderboard, explainable scores, commit/file evidence
