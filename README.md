# Lelystad Desk Reservations

A small Node.js app for reserving one of 12 desks in the Lelystad office.

## Run Locally

```sh
node server.js
```

Open http://127.0.0.1:4173.

## Deploy Online With Render

This repo includes `render.yaml`, so Render can create the web service and persistent disk for you.

1. Push this folder to GitHub.
2. In Render, choose **New +** > **Blueprint**.
3. Connect the GitHub repo.
4. Render reads `render.yaml` and creates the service.
5. Deploy it.

The app stores reservations in `/var/data/reservations.json` on Render. That path is backed by a persistent disk, so reservations survive restarts and redeploys.

Important: Render persistent disks require a paid instance type. The included blueprint uses `plan: starter` for that reason.

## Manual Render Settings

If you do not use the blueprint, create a Node web service with:

- Build command: `npm install`
- Start command: `node server.js`
- Health check path: `/healthz`
- Environment variables:
  - `HOST=0.0.0.0`
  - `DATA_DIR=/var/data`
- Persistent disk:
  - Mount path: `/var/data`
  - Size: `1 GB`
