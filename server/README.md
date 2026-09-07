# HomesteadOS family room

A tiny mailbox server. Each phone PUTs its own state into a room and GETs everyone else's; the
phones do the merging. No database, no dependencies. State is kept in memory and flushed to
`rooms.json` (on a Railway volume if one is mounted). If the server restarts, phones re-push
within seconds, so nothing is lost.

## Deploy on Railway

1. New Project → Deploy from GitHub repo → this repository.
2. In the service settings, set **Root Directory** to `server`. Railway detects Node and runs `npm start`.
3. Settings → Networking → **Generate Domain**. Copy the URL.
4. Paste that URL into the app under More → Settings → Family room, or hand it to whoever maintains the app to bake in.

Optional: attach a Volume mounted anywhere; the server writes `rooms.json` there.

## API

- `GET /` health.
- `GET /room/:room?since=<ms>` → `{ clients: { <clientId>: { state, ts } }, now, count }`.
- `PUT /room/:room/:clientId` with a JSON body → stores that phone's snapshot.
