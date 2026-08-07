# Pulse — Real-Time Chat App

A production-style 1:1 real-time messaging app built with React (Vite), Node/Express, Socket.IO, and MongoDB — Phase 1 (MVP) per the roadmap: auth, live messaging, typing indicators, read receipts, online/offline presence, dark mode.

**Deploys as a single service** — the Express server serves the built React app itself, so client + server run from one host, one URL, no separate frontend hosting needed.

## Stack

- **Frontend:** React + Vite, Tailwind CSS, Zustand, Socket.IO client, Framer Motion
- **Backend:** Node.js, Express, Socket.IO, JWT (httpOnly cookies), bcrypt
- **Database:** MongoDB + Mongoose

## Folder structure

```
/client        → React frontend (Vite)
/server        → Express + Socket.IO backend (also serves client/dist in production)
package.json   → root scripts that build/start both together
render.yaml    → one-click Render Blueprint config
```

## Deploy to Render (single service — recommended)

1. Push this whole folder (as-is, `client/` and `server/` together) to a GitHub repo.
2. Create a MongoDB Atlas free cluster and copy its connection string.
3. On Render: **New → Web Service** → connect your repo. Leave **Root Directory blank** (repo root).
   - **Build Command:** `npm run build`
   - **Start Command:** `npm start`
4. Add environment variables in the Render dashboard:
   ```
   NODE_ENV=production
   MONGO_URI=<your Atlas connection string>
   JWT_ACCESS_SECRET=<any long random string>
   JWT_REFRESH_SECRET=<a different long random string>
   ```
   (`CLIENT_URL` can be left unset — client and server share the same origin now, so CORS isn't in play for normal browser use.)
5. Deploy. Render gives you one URL (e.g. `https://pulse-chatapp.onrender.com`) that serves both the app and the API/sockets.

Alternatively, click-deploy using the included `render.yaml` Blueprint (Render → New → Blueprint → point at your repo).

## Local development

Locally it's easier to run client and server separately (Vite's dev server gives hot-reload):

**Terminal 1 — server**
```bash
cd server
cp .env.example .env   # fill in MONGO_URI, JWT secrets
npm install
npm run dev
```
Runs on `http://localhost:5000`. Check `http://localhost:5000/api/health` → `{ "status": "ok" }`.

**Terminal 2 — client**
```bash
cd client
cp .env.example .env   # sets VITE_API_URL / VITE_SOCKET_URL to localhost:5000
npm install
npm run dev
```
Opens at `http://localhost:5173`.

## Try it out

1. Open the app in two different browsers (or one normal + one incognito window).
2. Sign up as two different users.
3. In one, search for the other's username and start a conversation.
4. Send messages — you'll see instant delivery, typing indicators, and read receipts (✔ → ✔✔) update live.

## How the pieces fit together

- **Auth:** Access token (15 min) + refresh token (7 days), both stored as httpOnly cookies — never in localStorage, so JS can't read them (XSS-safe). The axios client (`client/src/utils/api.js`) auto-refreshes on a 401 and retries the original request.
- **Sockets:** The Socket.IO connection authenticates via the same JWT cookie in an `io.use()` middleware — unauthenticated sockets are rejected before `connection` fires. Each user joins a personal room (`user:<id>`) for inbox-level notifications, plus a room per open conversation (`conversation:<id>`) for live message delivery.
- **Offline messages:** Messages always write to MongoDB first, then get emitted live. If the recipient isn't connected, the message just sits with `status: "sent"` and loads normally from the paginated history API next time they open the conversation.
- **Pagination:** `GET /api/conversations/:id/messages?before=<ISO date>` — the chat window fetches the newest 30 on open, then loads older pages as you scroll to the top (infinite scroll), so full history is never loaded at once.

## What's implemented (Phase 1 / MVP)

- Signup / login / logout, protected routes
- User search, profile
- 1:1 real-time messaging via Socket.IO
- Typing indicator, delivered/read receipts
- Chat list sorted by latest message, unread badges
- Dark mode, responsive split layout (mobile shows one pane at a time, like WhatsApp Web)
- Emoji picker
- Optimistic message sending

## Not yet built (Phase 2, per the roadmap)

- Group chats
- Media/file sharing
- Message reactions, edit/delete
- Push notifications
- Block/report, in-chat search

## Production notes before shipping

- Set `NODE_ENV=production` — this switches cookies to `secure: true, sameSite: "none"` (required for cross-site HTTPS cookies).
- Put the frontend behind HTTPS and update `CLIENT_URL` / `VITE_API_URL` / `VITE_SOCKET_URL` accordingly.
- Consider a managed MongoDB (Atlas) with connection pooling and the indexes already defined in the schemas.
- Add a process manager (PM2) or containerize the server for restarts/scaling; for multi-instance Socket.IO, add the Redis adapter (`@socket.io/redis-adapter`) so rooms work across servers.
