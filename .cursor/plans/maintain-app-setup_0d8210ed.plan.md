---
name: maintain-app-setup
overview: Scaffold a Vite + React + TypeScript frontend with a polished MaintAIn landing page, plus an Express + TypeScript + MongoDB (local) backend with an initial health endpoint and dev workflow.
todos:
  - id: frontend-scaffold
    content: Scaffold Vite React+TS frontend in repo root and verify `npm run dev` works.
    status: completed
  - id: landing-ui
    content: Create `src/pages/Landing.tsx`, wire it into `App.tsx`, and add polished responsive styles displaying “MaintAIn” prominently.
    status: completed
  - id: backend-scaffold
    content: Create `backend/` Express+TS project with dev script and basic server bootstrap.
    status: completed
  - id: mongo-connection
    content: Add MongoDB connection via Mongoose using `MONGODB_URI` and implement `GET /api/health`.
    status: completed
  - id: frontend-backend-integration
    content: Add Vite dev proxy for `/api` to the backend and verify frontend can call `/api/health` during dev.
    status: completed
isProject: false
---

# MaintAIn frontend + backend setup

## Goal

- **Frontend**: Vite + React + TypeScript app in the repo root, with a polished landing (home) page that prominently displays **MaintAIn**.
- **Backend**: Express + TypeScript API in `backend/`, connecting to **local MongoDB** (installed on your machine) via Mongoose.

## High-level structure

- Frontend at repo root (Vite)
- Backend in `[backend/](backend/)` with its own `package.json`

## Frontend plan (Vite)

- Scaffold in repo root:
  - `[package.json](package.json)`, `[vite.config.ts](vite.config.ts)`, `[index.html](index.html)`
  - `[src/main.tsx](src/main.tsx)`, `[src/App.tsx](src/App.tsx)`, `[src/index.css](src/index.css)`
- Implement landing page:
  - Create `[src/pages/Landing.tsx](src/pages/Landing.tsx)`
  - Render it from `App.tsx`
  - Styling: centered hero, large `MaintAIn` title (accent the `AIn`), tagline, CTA button, responsive spacing, accessible focus/contrast
- Dev proxy:
  - Configure Vite to proxy `/api` to backend (e.g. `http://localhost:3001`)

## Backend plan (Express + MongoDB local)

- Create `backend/` project:
  - `[backend/package.json](backend/package.json)` with scripts: `dev`, `build`, `start`
  - `[backend/tsconfig.json](backend/tsconfig.json)`
  - `[backend/src/server.ts](backend/src/server.ts)`
- Dependencies:
  - Runtime: `express`, `mongoose`, `cors`, `dotenv`
  - Dev/build: `typescript`, `ts-node-dev` (or `tsx`), `@types/`*
- Configuration:
  - `[backend/.env](backend/.env)` (gitignored) with `MONGODB_URI=mongodb://127.0.0.1:27017/maintain` and `PORT=3001`
- Minimal endpoints:
  - `GET /api/health` returns `{ ok: true }` (also confirms DB connection status)

## Dev commands (expected)

- Frontend:
  - `npm create vite@latest . -- --template react-ts`
  - `npm install`
  - `npm run dev`
- Backend:
  - `cd backend && npm init -y`
  - `npm install ...`
  - `npm run dev`

## Notes / assumptions

- MongoDB is reachable locally at `127.0.0.1:27017`. If your local MongoDB uses a different host/port/auth, we’ll adjust `MONGODB_URI`.
- Initial backend is intentionally minimal so the project is “up and running” quickly; we can add task CRUD next.

