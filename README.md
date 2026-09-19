# Milewise

A responsive React booking experience for family long-distance trips with trusted drivers.

## Run locally

```bash
npm install
npm run server
npm run dev
```

The frontend uses `http://localhost:8787` for the local API. The API stores ride requests, driver applications and the latest submitted locations in `data/`, and publishes realtime updates at `/api/events` using Server-Sent Events.

Set `VITE_API_URL` when the API is hosted separately from the frontend.

## Build

```bash
npm run build
```

The Vite base path is configured for GitHub Pages at `/milewise/`.
