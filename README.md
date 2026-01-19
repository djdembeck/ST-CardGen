# Character Card Generator (Vue + TS) — Rebuild

This is the clean rebuild of the Character Card Generator.

## Structure

- `frontend/` — Vue 3 + Vite + TypeScript
- `server/` — Node.js API server (TypeScript)

The **server** is the only thing that talks to KoboldCPP / ComfyUI. The browser UI only talks to the server at `/api/*`.

## Development (one command)

From the repo root:

```bash
npm install
npm run dev
```

This starts:
- Server at `http://localhost:3001`
- Vite UI at `http://localhost:5173` (proxies `/api` -> `http://localhost:3001`)

## Production build/run

```bash
npm install
npm run build
npm run start
```

Then open `http://localhost:3001`.
