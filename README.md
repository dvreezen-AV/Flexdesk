# Lelystad Desk Reservations

A small Node.js app for reserving one of 12 desks in the Lelystad office.

## Run Locally

```sh
node server.js
```

Open http://127.0.0.1:4173.

## Deploy Online

The app stores reservations in `reservations.json`. On a hosting platform, set these environment variables:

```sh
HOST=0.0.0.0
DATA_DIR=/var/data
```

Then attach persistent storage at `/var/data`, so reservations survive restarts and redeploys.

Use this start command:

```sh
node server.js
```

## Good Hosting Fit

For a small internal team app, use a Node web service with persistent storage. Render, Railway, and Fly.io can all work. If using Render, create a Web Service and add a persistent disk mounted at `/var/data`. If using Railway or Fly.io, create a volume mounted at `/var/data`.
