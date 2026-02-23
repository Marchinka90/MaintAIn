## MaintAIn

MaintAIn is a lightweight personal web app for tracking recurring apartment/home maintenance tasks (what’s overdue, due soon, and upcoming) with completion history.

## Tech stack

- **Frontend**: Vite + React + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **DB**: MongoDB (local)
- **Auth**: JWT access token (client-side) + refresh token (HTTP-only cookie)

## Prerequisites

- **Node.js** (recommended: current LTS)
- **MongoDB** running locally

## Project structure

- **Frontend** (this folder): React app
- **Backend**: `backend/`

## Environment variables (backend)

An example file is provided at `backend/.env.example`.

1. Create your local env file:

```bash
cp backend/.env.example backend/.env
```

2. Adjust values as needed (especially JWT secrets).

## Install

```bash
npm install
cd backend && npm install
```

## Run in development

### 1) Start MongoDB

Make sure MongoDB is running locally and matches `MONGODB_URI` in `backend/.env`.

### 2) Start the backend (API)

```bash
cd backend
npm run dev
```

By default the API runs on `http://127.0.0.1:3001`.

### 3) Start the frontend

In a second terminal:

```bash
npm run dev
```

The frontend runs on Vite’s default dev server (usually `http://127.0.0.1:5173`).

### API proxy (important)

The frontend proxies `/api` to the backend via `vite.config.ts`:

- Frontend calls `/api/...`
- Vite forwards it to `http://127.0.0.1:3001/api/...`

This keeps auth cookies and API calls working smoothly during local dev.

## Build

### Frontend

```bash
npm run build
```

### Backend

```bash
cd backend
npm run build
```

## Start backend (production build)

```bash
cd backend
npm run start
```
