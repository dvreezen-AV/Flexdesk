const http = require("http");
const fs = require("fs/promises");
const path = require("path");

const PORT = Number(process.env.PORT || 4173);
const HOST = process.env.HOST || "127.0.0.1";
const ROOT = __dirname;
const DEFAULT_DATA_DIR = path.join(ROOT, "data");
const CONFIGURED_DATA_DIR = process.env.DATA_DIR || DEFAULT_DATA_DIR;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";
const VALID_DESKS = new Set([
  "Desk 1",
  "Desk 2",
  "Desk 3",
  "Desk 4",
  "Desk 5",
  "Desk 6",
  "Desk 7",
  "Desk 8",
  "Desk 9",
  "Desk 10",
  "Desk 11",
  "Desk 12",
  "Desk 13",
  "Desk 14",
  "Desk 15",
  "Desk 16",
  "Desk 17",
  "Desk 18",
  "Desk 19",
  "Desk 20",
]);
const ASSIGNED_DESKS = {
  "Desk 1": "Madrika",
  "Desk 4": "Arjan",
  "Desk 5": "David van L.",
  "Desk 6": "Jolle",
  "Desk 8": "Erick",
  "Desk 9": "Rowan",
  "Desk 10": "Anniek",
  "Desk 18": "Jeroen HR",
};
const TEMPORARILY_UNAVAILABLE_UNTIL = "2026-05-21";
const TEMPORARILY_UNAVAILABLE_DESKS = new Set(["Desk 11", "Desk 13", "Desk 15", "Desk 20"]);

let activeDataDir = CONFIGURED_DATA_DIR;
let activeDataFile = path.join(activeDataDir, "reservations.json");

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
};

async function ensureStore() {
  try {
    await prepareStore(activeDataDir);
  } catch (error) {
    if (activeDataDir === DEFAULT_DATA_DIR) {
      throw error;
    }

    console.warn(
      `Could not use DATA_DIR=${activeDataDir}; falling back to ${DEFAULT_DATA_DIR}. ${error.message}`
    );
    activeDataDir = DEFAULT_DATA_DIR;
    activeDataFile = path.join(activeDataDir, "reservations.json");
    await prepareStore(activeDataDir);
  }
}

async function prepareStore(dataDir) {
  const dataFile = path.join(dataDir, "reservations.json");
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(dataFile);
  } catch {
    await fs.writeFile(dataFile, "{}\n");
  }
}

async function readStore() {
  await ensureStore();
  const raw = await fs.readFile(activeDataFile, "utf8");
  return JSON.parse(raw || "{}");
}

async function writeStore(store) {
  await ensureStore();
  await fs.writeFile(activeDataFile, `${JSON.stringify(store, null, 2)}\n`);
}

function sendJson(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

function isValidDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value || "");
}

function isValidDesk(value) {
  return VALID_DESKS.has(value || "");
}

function getAssignedPerson(deskId) {
  return ASSIGNED_DESKS[deskId] || null;
}

function isTemporarilyUnavailable(deskId, date) {
  return TEMPORARILY_UNAVAILABLE_DESKS.has(deskId) && date < TEMPORARILY_UNAVAILABLE_UNTIL;
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

async function handleApi(req, res, url) {
  if (url.pathname === "/api/admin/clear") {
    if (req.method !== "POST") {
      sendJson(res, 405, { error: "Method not allowed" });
      return;
    }

    if (!ADMIN_TOKEN || req.headers.authorization !== `Bearer ${ADMIN_TOKEN}`) {
      sendJson(res, 401, { error: "Unauthorized" });
      return;
    }

    await writeStore({});
    sendJson(res, 200, { ok: true, reservations: {} });
    return;
  }

  if (url.pathname !== "/api/reservations") {
    sendJson(res, 404, { error: "Not found" });
    return;
  }

  if (req.method === "GET") {
    const date = url.searchParams.get("date");
    if (!isValidDate(date)) {
      sendJson(res, 400, { error: "A valid date is required." });
      return;
    }

    const store = await readStore();
    sendJson(res, 200, { reservations: store[date] || {} });
    return;
  }

  if (req.method === "POST") {
    const body = await readJsonBody(req);
    const date = String(body.date || "");
    const deskId = String(body.deskId || "");
    const name = String(body.name || "").trim();
    const team = String(body.team || "").trim();
    const time = String(body.time || "Full day");

    if (!isValidDate(date) || !isValidDesk(deskId) || !name) {
      sendJson(res, 400, { error: "Date, desk, and name are required." });
      return;
    }

    const assignedPerson = getAssignedPerson(deskId);
    if (assignedPerson) {
      sendJson(res, 409, { error: `${deskId} is assigned to ${assignedPerson}.` });
      return;
    }

    if (isTemporarilyUnavailable(deskId, date)) {
      sendJson(res, 409, { error: `${deskId} is available from 21 May.` });
      return;
    }

    const store = await readStore();
    const dayReservations = store[date] || {};

    if (dayReservations[deskId]) {
      sendJson(res, 409, { error: `${deskId} is already reserved.` });
      return;
    }

    store[date] = {
      ...dayReservations,
      [deskId]: {
        name,
        team,
        time,
        createdAt: new Date().toISOString(),
      },
    };

    await writeStore(store);
    sendJson(res, 201, { reservations: store[date] });
    return;
  }

  if (req.method === "DELETE") {
    const body = await readJsonBody(req);
    const date = String(body.date || "");
    const deskId = String(body.deskId || "");

    if (!isValidDate(date)) {
      sendJson(res, 400, { error: "A valid date is required." });
      return;
    }

    const store = await readStore();

    if (deskId) {
      if (!isValidDesk(deskId)) {
        sendJson(res, 400, { error: "A valid desk is required." });
        return;
      }

      const dayReservations = { ...(store[date] || {}) };
      delete dayReservations[deskId];
      store[date] = dayReservations;
    } else {
      delete store[date];
    }

    if (store[date] && Object.keys(store[date]).length === 0) {
      delete store[date];
    }

    await writeStore(store);
    sendJson(res, 200, { reservations: store[date] || {} });
    return;
  }

  sendJson(res, 405, { error: "Method not allowed" });
}

async function serveStatic(req, res, url) {
  const requestedPath = url.pathname === "/" ? "/index.html" : url.pathname;
  const filePath = path.normalize(path.join(ROOT, requestedPath));

  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  try {
    const file = await fs.readFile(filePath);
    const contentType = mimeTypes[path.extname(filePath)] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": contentType });
    res.end(file);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (url.pathname === "/healthz") {
      sendJson(res, 200, { ok: true });
      return;
    }

    if (url.pathname.startsWith("/api/")) {
      await handleApi(req, res, url);
      return;
    }

    await serveStatic(req, res, url);
  } catch (error) {
    sendJson(res, 500, { error: error.message || "Server error" });
  }
});

ensureStore().then(() => {
  server.listen(PORT, HOST, () => {
    console.log(`Lelystad desk reservations running at http://${HOST}:${PORT}`);
  });
});
