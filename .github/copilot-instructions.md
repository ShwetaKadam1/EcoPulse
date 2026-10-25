# Copilot / AI Agent Instructions for EcoPulse

This project has a two-part architecture: a Node/Express backend (MongoDB + Firebase + Stripe) and a Next.js frontend in `frontend/`.

Quick facts
- **Backend:** `backend/` — Express app, main at `backend/server.js` and `backend/app.js`.
- **Frontend:** `frontend/` — Next.js (app router) in `frontend/src/app`.
- **DB:** MongoDB via Mongoose (`backend/config/db.js`, env `MONGO_URI`).
- **Auth:** Firebase Admin for token verification (`backend/middleware/firebaseAuth.js`).
- **Payments:** Stripe checkout + webhook (`backend/controllers/paymentController.js`, `routes/paymentRoutes.js`).

What to know before editing code
- Environment: backend uses `dotenv`. Required env vars include `MONGO_URI`, `FIREBASE_SERVICE_ACCOUNT_PATH`, `SESSION_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and optionally `BASE_URL`.
- Firebase Admin expects `FIREBASE_SERVICE_ACCOUNT_PATH` to point to a service account JSON file (path resolved from `backend/` per `middleware/firebaseAuth.js`).
- The Firebase middleware verifies `Authorization: Bearer <idToken>` and sets `req.firebaseUID` and `req.firebaseEmail` for downstream controllers.
- Stripe webhook route (`POST /api/payments/webhook`) requires raw body verification: `app.js` stores `req.rawBody` using `bodyParser` verify and `paymentController.handleWebhook` uses `stripe.webhooks.constructEvent(req.rawBody, sig, ...)`.

Architecture & patterns
- Routes map 1:1 to controllers under `backend/routes/*.js` -> `backend/controllers/*Controller.js`.
- Controllers are async, return JSON, and use Mongoose models in `backend/models/`.
- User data shape: `backend/models/User.js` — `footprintLogs` are stored as an array of subdocuments; many controllers push to that array (see `userController.logFootprint`).
- Admin sessions use `express-session` via `backend/middleware/adminSession.js`; admin routes check `req.session.admin`.

Developer workflows (how to run)
- Start backend (dev):
  - Open a shell in `backend/` and run `npm install` then `npm run dev` (uses `nodemon`):

    npm install; npm run dev

- Start frontend (dev):
  - Open a shell in `frontend/` and run `npm install` then `npm run dev` (Next dev server):

    npm install; npm run dev

- Build frontend for production: `npm run build` in `frontend/`, then `npm run start`.

Project-specific conventions
- Controller conventions: return JSON objects with `{ message, ... }` and use `res.status(x).json(...)` for errors (see `backend/controllers/*`).
- Auth: most API routes expect the Firebase ID token in `Authorization` header as `Bearer <token>`; middleware populates `req.firebaseUID` used for DB lookups (see `backend/routes/userRoutes.js`).
- Payments: keep raw request body for webhook verification — do not add middleware that alters the raw body for `/api/payments/webhook`.

Integration points to watch
- Firebase service account JSON is referenced from `FIREBASE_SERVICE_ACCOUNT_PATH` — ensure path is correct and file is protected (not committed in public repos).
- Stripe requires `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`. Webhook signature verification is strict; tests should use Stripe test keys and signed payloads.
- MongoDB connection string in `MONGO_URI` (no fallback — app exits if missing).

Files to inspect for context/examples
- `backend/app.js` — server setup, CORS, body parsing, route mounting.
- `backend/middleware/firebaseAuth.js` — token verification and `req.firebaseUID` behavior.
- `backend/controllers/paymentController.js` — Stripe checkout + webhook handling example.
- `backend/controllers/userController.js` — how logs and advice are created (`utils/carbonCalculator.js`, `utils/adviceRules.js`).
- `frontend/src/app/layout.js` and `frontend/src/app/page.js` — Next.js app-router layout and where dashboard routes expect the `Sidebar` layout.

When making edits
- Prefer changing controller logic in `backend/controllers/` and keep route shapes stable unless coordinated with frontend.
- If adding new API routes, follow existing patterns: create route in `backend/routes/`, controller in `backend/controllers/`, and add model in `backend/models/` if needed.
- For Stripe/webhook changes, update `app.js` and ensure raw body (`req.rawBody`) is present for the webhook route.

If anything is unclear or you want me to include additional patterns (e.g., frontend data-fetching conventions, environment file examples, or more controller examples), tell me which area and I will update this file.
