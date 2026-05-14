# Jan Seva AI

Production-minded civic grievance platform. Citizens file issues via **text**, **voice (browser SpeechRecognition)**, or **photo**. Classification is **local-first**: **rule-based NLP** and **TensorFlow.js MobileNet** (browser) plus **JWT auth**, **`db.json` persistence**, **Recharts** admin analytics, **i18next** (en, hi, mr, ta, te, bn, gu), and **SevaBot**.

## Highlights

- **Frontend:** React 18, Vite, Tailwind CSS, Framer Motion, Axios, Recharts, TensorFlow.js + MobileNet (dynamic import), i18next.
- **Backend:** Node.js + Express, Multer uploads, `jsonwebtoken`, `dotenv`.
- **Categories:** Electricity, Water, Road, Sanitation, Billing, Health, Police, Government, General — each complaint stores **ticketId** (`JSA-YYYY-NNN`), **category, urgency, confidence, summary, aiSource, optional topLabels**.
- **Image understanding:** MobileNet runs **in the browser**; the API merges labels, caption, and filename hints via `utils/imageClassifier.js` (no cloud image API in the default path).
- **Voice:** Fully client-side — no audio leaves the browser.
- **Bonus:** SevaBot (rule-based) + toast notifications + glassmorphism SaaS UI + dark/light mode.

## Folder structure

```
Jan Seva AI/
├── backend/
│   ├── .env.example
│   ├── server.js
│   ├── package.json
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── utils/
│   │   ├── aiEngine.js         # keyword categories, urgency, summary
│   │   ├── imageClassifier.js  # map MobileNet labels → category + merge
│   │   ├── classify.js         # legacy re-exports for optional utils
│   │   ├── aiImageServer.js    # unused in default path (legacy HF helpers)
│   │   ├── aiText.js           # unused in default path (legacy cloud NLP)
│   │   ├── jwt.js
│   │   └── storage.js          # loads db.json (migrates legacy data/*.json once)
│   ├── db.json                 # { users, complaints } (auto-created)
│   ├── data/                   # legacy users.json / complaints.json (optional migration source)
│   └── uploads/                # complaint imagery
├── frontend/
│   ├── .env.example
│   ├── src/
│   │   ├── api/http.js
│   │   ├── components/         # ComplaintForm, DashboardShell, AdminCharts, SevaBot…
│   │   ├── lib/apiOrigin.js
│   │   ├── pages/
│   │   ├── state/
│   │   ├── ui/
│   │   └── utils/mobilenetClassify.js
│   ├── vercel.json
│   └── package.json
├── package.json                # convenience scripts
└── README.md
```

## Prerequisites

- Node.js **18+**
- Modern Chromium / Edge recommended (SpeechRecognition + WebGL for TensorFlow.js)

## Run locally

### 1. Install dependencies

From the repo root:

```bash
npm run install:all
```

Or manually:

```bash
cd backend && npm install
cd ../frontend && npm install
```

Backend `npm run dev` uses **`node --watch`** so the server reloads after code changes (needs Node 18+).

### 2. Configure environment

```bash
cd backend
copy .env.example .env   # Windows
# cp .env.example .env    # macOS / Linux
```

- Set a strong `JWT_SECRET` before deploying.
- The default complaint pipeline uses **only** `aiEngine.js` + `imageClassifier.js` (no API keys required).
- Add `GEMINI_API_KEY`, `OPENAI_API_KEY`, or `HF_API_KEY` to enable the respective tiers.

Frontend (optional if you change ports):

```bash
cd frontend
copy .env.example .env
# ensure VITE_API_BASE_URL=http://localhost:5000/api
```

### 3. Start backend (terminal A)

```bash
cd backend
npm run dev
```

API: `http://localhost:5000` • Health: `GET /api/health`

Seeded admin account:

- Username: `admin`
- Password: `admin123`

### 4. Start frontend (terminal B)

```bash
cd frontend
npm run dev
```

App: `http://localhost:5173`

### 5. Exercise the AI flows

1. Sign up or log in.
2. **Text** — submit a complaint; watch category/urgency/confidence/`aiSource` in the list.
3. **Voice** — use “Voice input”, then submit the transcribed text.
4. **Image** — upload a photo; MobileNet previews a category before submit; backend merges signals.

## Deployment

### Frontend → Vercel

1. Push the repository to GitHub/GitLab.
2. Create a **Vercel** project; set **Root Directory** to `frontend`.
3. Build command: `npm run build` • Output: `dist`.
4. Add environment variable `VITE_API_BASE_URL` pointing to your deployed API, e.g. `https://<service>.onrender.com/api`.
5. Redeploy.

`vercel.json` already contains SPA rewrites.

### Backend → Render

1. Create a new **Web Service**; connect the repo.
2. **Root Directory:** `backend`.
3. **Build Command:** `npm install`
4. **Start Command:** `npm start`
5. Add environment variables (minimum):

| Key | Value |
| --- | --- |
| `JWT_SECRET` | Long random string (32+ chars) |
| `FRONTEND_URL` | `https://your-app.vercel.app` (comma-separate multiples if needed) |
| `NODE_VERSION` | `20` (recommended) |

Optional AI keys (same names as `backend/.env.example`).

6. Because the free filesystem is **ephemeral**, JSON files reset on restarts. For persistent storage, mount a disk or migrate to a managed database — the code is structured so controllers isolate persistence in `utils/storage.js`.

7. After deploy, update the frontend `VITE_API_BASE_URL` to the Render URL and redeploy Vercel.

### CORS

`server.js` allows `http://localhost:5173`, `http://localhost:3000`, plus every origin listed in `FRONTEND_URL`.

## Security notes

- Passwords are stored in plain text in `db.json` for demo simplicity — **hash (bcrypt/argon2) before real production use**.
- Rotate `JWT_SECRET` if compromised.
- Never commit real `.env` files.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Speech button disabled | Use Chromium; Safari lacks SpeechRecognition. |
| MobileNet fails | GPU/WebGL blocked; still submit — backend uses filename/caption/rules. |
| Gemini/OpenAI errors | Verify model names & quotas; app falls back automatically. |
| Images 404 on Vercel | Ensure `VITE_API_BASE_URL` origin matches the API host serving `/uploads`. |

## Scripts (root `package.json`)

```bash
npm run install:all   # install backend + frontend
npm run dev:backend   # npm --prefix backend run dev
npm run dev:frontend  # npm --prefix frontend run dev
```

---

Built for hackathons, municipal pilots, and coursework — extend persistence, harden auth, and plug in your ticketing system when you graduate from JSON storage.
