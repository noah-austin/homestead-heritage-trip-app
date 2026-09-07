/* HomesteadOS family-room server.
   A mailbox, not a brain: each phone PUTs its own state snapshot into a room,
   and GETs everyone else's. Merging happens on the phones, which already know how.
   Zero dependencies. Runs anywhere Node 18+ runs; built for Railway. */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.RAILWAY_VOLUME_MOUNT_PATH || process.env.DATA_DIR || __dirname;
const FILE = path.join(DATA_DIR, 'rooms.json');
const MAX_BODY = 512 * 1024;                 // a day of cheese ratings is a few KB
const STALE_MS = 3 * 24 * 60 * 60 * 1000;    // forget phones silent for 3 days

let rooms = {};
try { rooms = JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch (e) { rooms = {}; }
let dirty = false;
setInterval(() => {
  if (!dirty) return;
  dirty = false;
  fs.writeFile(FILE, JSON.stringify(rooms), (err) => { if (err) console.error('persist failed:', err.message); });
}, 3000);

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
  'Cache-Control': 'no-store',
};

function send(res, status, body, extra) {
  const headers = Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, CORS, extra || {});
  res.writeHead(status, headers);
  res.end(typeof body === 'string' ? body : JSON.stringify(body));
}

const ID = /^[A-Za-z0-9_-]{1,64}$/;

http.createServer((req, res) => {
  if (req.method === 'OPTIONS') { res.writeHead(204, CORS); return res.end(); }

  const url = new URL(req.url, 'http://x');
  const parts = url.pathname.split('/').filter(Boolean);

  if (parts.length === 0) {
    return send(res, 200, { ok: true, service: 'HomesteadOS family room', rooms: Object.keys(rooms).length });
  }
  if (parts[0] !== 'room' || !parts[1] || !ID.test(parts[1]) || (parts[2] && !ID.test(parts[2]))) {
    return send(res, 404, { error: 'not found' });
  }
  const roomId = parts[1];
  const clientId = parts[2];
  const room = (rooms[roomId] = rooms[roomId] || {});

  // Drop phones we have not heard from in a long while.
  const now = Date.now();
  for (const [cid, entry] of Object.entries(room)) if (now - (entry.ts || 0) > STALE_MS) { delete room[cid]; dirty = true; }

  if (req.method === 'GET') {
    // ?since=<ts> lets a phone skip snapshots it has already merged.
    const since = Number(url.searchParams.get('since') || 0);
    const clients = {};
    for (const [cid, entry] of Object.entries(room)) if (entry.ts > since) clients[cid] = entry;
    return send(res, 200, { room: roomId, now, clients, count: Object.keys(room).length });
  }

  if (req.method === 'PUT' && clientId) {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > MAX_BODY) { send(res, 413, { error: 'too large' }); req.destroy(); }
    });
    req.on('end', () => {
      if (res.writableEnded) return;
      let state;
      try { state = JSON.parse(body); } catch (e) { return send(res, 400, { error: 'bad json' }); }
      if (!state || typeof state !== 'object') return send(res, 400, { error: 'bad state' });
      room[clientId] = { state, ts: Date.now() };
      dirty = true;
      return send(res, 200, { ok: true, ts: room[clientId].ts, count: Object.keys(room).length });
    });
    return;
  }

  return send(res, 405, { error: 'method not allowed' });
}).listen(PORT, () => console.log(`family room listening on ${PORT}, data at ${FILE}`));
