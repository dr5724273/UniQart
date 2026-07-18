# MyUniQart

Rent Vehicles • Get Finance • Lend Money — All in One Trusted Marketplace

## Monorepo layout

- `client/` — Next.js + Tailwind frontend
- `server/` — Node.js + Express + MongoDB backend (REST API)

## Prereqs

- Node.js 18+ (recommended 20+)
- MongoDB (local or Atlas)

## Quick start (local)

### 1) Backend

```bash
cd server
cp .env.example .env
npm install
npm run seed
npm run dev
```

API runs at `http://localhost:5000` by default.
All REST endpoints are under the `/api` prefix (example: `POST /api/auth/login`).

### 2) Frontend

```bash
cd client
cp .env.example .env.local
npm install
npm run dev
```

Web runs at `http://localhost:3000`.

## Postman
Import the collection at `postman/UniQart.postman_collection.json` and set `baseUrl` to your backend URL (default `http://localhost:5000`).

## Troubleshooting

### `localhost:3000` shows “refused to connect”
This usually means the Next.js dev server is not running. Start it from a terminal:

```bash
cd client
npm run dev
```

If the terminal shows `Error: spawn EPERM`, use **Node.js 20 LTS** (Node 24+ can cause tooling issues on some setups), and ensure your antivirus / Windows “Controlled folder access” is not blocking `node.exe` from spawning child processes.

### `npm run seed` fails with `ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR` (MongoDB Atlas)
This is almost always an Atlas connection/config issue (not your API routes):

- Ensure `MONGODB_URI` is valid and does not contain angle brackets `<>`.
- If your MongoDB password contains special characters (especially `@`), URL-encode it (example: `@` → `%40`).
- In MongoDB Atlas, add your current IP in **Network Access** (for testing you can temporarily allow `0.0.0.0/0`).
- Use **Node.js 20 LTS** for the backend (TLS interoperability can break on newer Node/OpenSSL combos on some machines).
- If you’re on a restricted network/antivirus, try a different network or allow outbound TLS to `*.mongodb.net:27017`.

## Demo accounts (seed)

- Admin: `admin@uniqart.app` / `Admin@12345`
- Lister: `lister@uniqart.app` / `Lister@12345`
- Buyer: `buyer@uniqart.app` / `Buyer@12345`

## Production notes

- Set strong `JWT_SECRET` and `MONGODB_URI`.
- Configure `CORS_ORIGIN` to your frontend domain.
- Store uploads on S3/Cloudinary in production (the demo stores to `server/uploads/`).
