# Mini Meet

A small video-calling MVP: create or join a room with a code, talk to up to ~8 people over
WebRTC, mute/unmute, toggle camera, see who's talking. Dark UI, no accounts, no database.

**Architecture note:** this uses a peer-to-peer *mesh* — every participant connects directly
to every other participant. That's simple and free (no media server to run or pay for), but it
does not scale past roughly 6-8 people, since each person's upload bandwidth and CPU grows with
the number of others in the call. For anything bigger, you'd want a media server (SFU) like
LiveKit, mediasoup, or a hosted service — this project intentionally skips that to stay free
and simple.

## Project structure

```
mini-meet/
├── client/                  React + Vite + Tailwind frontend
│   ├── src/
│   │   ├── components/      VideoTile, ControlsBar, icons
│   │   ├── hooks/           useWebRTC.js (signaling + peer connections)
│   │   ├── pages/           Home.jsx, Room.jsx
│   │   ├── utils/           roomCode.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── .env.example
├── server/                  Node + Express + Socket.io signaling server
│   ├── index.js
│   ├── package.json
│   └── .env.example
├── package.json              convenience scripts
└── README.md
```

## 1. Install

```bash
cd mini-meet
npm run install:all
```

(This runs `npm install` inside both `server/` and `client/`.)

## 2. Set up environment variables

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Defaults work out of the box for local development — no edits needed unless you're deploying.

## 3. Run locally

Open two terminals.

**Terminal 1 — server:**
```bash
npm run dev:server
```
Runs on `http://localhost:4000`.

**Terminal 2 — client:**
```bash
npm run dev:client
```
Runs on `http://localhost:5173`. Open that URL in your browser.

To test a call with yourself, open the same room URL in two browser tabs (or one normal + one
incognito window — using the same browser profile twice will make the browser treat both tabs as
sharing one camera, which can cause issues). Enter a name, create or join a room, allow
camera/mic access in both tabs.

## 4. Deploy (free tier)

### Backend → Render

1. Push this repo to GitHub.
2. In Render, create a **Web Service**, point it at the repo, set:
   - Root directory: `server`
   - Build command: `npm install`
   - Start command: `npm start`
3. Add environment variable `CLIENT_ORIGIN` = your Vercel frontend URL (set this *after* step 5,
   then redeploy).
4. Note the resulting URL, e.g. `https://mini-meet-server.onrender.com`.

Render's free tier spins the service down after inactivity — the first connection after a while
will be slow (10-30s) while it wakes up. That's expected.

### Frontend → Vercel

1. In Vercel, import the same repo.
2. Set root directory to `client`.
3. Framework preset: Vite.
4. Add environment variable `VITE_SERVER_URL` = your Render backend URL from above.
5. Deploy. Note the resulting URL, e.g. `https://mini-meet.vercel.app`.
6. Go back to Render and set `CLIENT_ORIGIN` to this Vercel URL, then redeploy the backend so CORS
   allows it.

### STUN servers

Already configured to use Google's free public STUN servers
(`stun:stun.l.google.com:19302`). No setup needed. Note: STUN alone doesn't guarantee
connectivity behind every type of restrictive NAT/firewall (e.g. some corporate networks) — a TURN
server would fix that, but that's outside the scope of a free MVP.

## Environment variables reference

| File | Variable | Meaning | Local default |
|---|---|---|---|
| `server/.env` | `PORT` | Port the signaling server listens on | `4000` |
| `server/.env` | `CLIENT_ORIGIN` | Allowed CORS origin (your frontend URL) | `*` |
| `client/.env` | `VITE_SERVER_URL` | URL of the signaling server | `http://localhost:4000` |

## Troubleshooting

- **"Could not access camera or microphone"** — Browser permissions were denied, or no
  camera/mic is present. Check the browser's site settings (the lock icon in the address bar)
  and reload.
- **Black tile / no video from a peer** — Usually a NAT/firewall blocking the peer-to-peer
  connection. STUN resolves most home networks; restrictive corporate or campus networks may
  need a TURN server (not included in this MVP).
- **"Could not reach the signaling server"** — The server isn't running, or `VITE_SERVER_URL`
  in `client/.env` doesn't match where it's actually running.
- **CORS errors in the browser console** — `CLIENT_ORIGIN` on the server doesn't match the
  frontend's actual URL. Update it and restart/redeploy the server.
- **Works locally, fails when deployed** — Double check both env vars point at the deployed
  URLs, not `localhost`, and that you redeployed the server after setting `CLIENT_ORIGIN`.
- **Video freezes/calls drop after a few minutes on Render free tier** — the free tier can
  idle/restart the service; this is a hosting limitation, not a code bug. A paid tier or
  alternative host resolves it.
- **More than ~6-8 people join and things get choppy** — expected with mesh WebRTC; see the
  architecture note above.

## Commands quick reference

```bash
npm run install:all   # install everything
npm run dev:server    # start signaling server (localhost:4000)
npm run dev:client    # start frontend dev server (localhost:5173)
npm run build:client  # production build of the frontend
```
