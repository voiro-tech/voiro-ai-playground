# Voiro AI — Intelligence Agent Prototype

## Folder Structure
```
voiro-ai/
├── api/          ← Next.js API (deploy to Vercel)
└── frontend/     ← Angular chat UI (deploy to Vercel)
```

---

## Local Dev

### Terminal 1 — API
```bash
cd api
npm install
echo "ANTHROPIC_API_KEY=sk-ant-your-key-here" > .env.local
npm run dev
# Running at http://localhost:3001
```

### Terminal 2 — Frontend
```bash
cd frontend
npm install
npm start
# Running at http://localhost:4200
```

Open http://localhost:4200 — done.

---

## Deploy to Vercel

### 1. Deploy the API
- Go to vercel.com → New Project → select voiro-ai repo
- Set Root Directory to: `api`
- Framework: Next.js
- Deploy
- After deploy → Settings → Environment Variables → add `ANTHROPIC_API_KEY`
- Redeploy

Note your API URL e.g. `https://voiro-ai-api.vercel.app`

### 2. Update the frontend with your API URL
Edit `frontend/src/environments/environment.prod.ts`:
```typescript
apiUrl: 'https://voiro-ai-api.vercel.app'  // ← your actual URL
```
Commit and push.

### 3. Deploy the Frontend
- Go to vercel.com → New Project → select voiro-ai repo again
- Set Root Directory to: `frontend`
- Build command: `npm run build:prod`
- Output directory: `dist/voiro-ai-frontend/browser`
- Deploy

---

## Connecting Real Voiro APIs Later

Only one file changes: `api/app/api/chat/data.ts`

Replace the handler function bodies with real API calls:
```typescript
// Before (dummy)
function getRevenueSummary({ publisher, month }: any): string {
  return JSON.stringify(DUMMY_DATA.publishers[publisher]);
}

// After (real API)
async function getRevenueSummary({ publisher, month }: any): Promise<string> {
  const res = await fetch('https://api.voiro.com/core/reports', {
    headers: { 'Authorization': `Bearer ${process.env.VOIRO_API_KEY}` },
    ...
  });
  return JSON.stringify(await res.json());
}
```

Everything else stays the same.

---

## Demo Questions
- "How did Times of India perform in March?"
- "Which campaigns are underdelivering?"
- "Compare all publishers by revenue"
- "What is inventory availability across all publishers?"
- "Full performance breakdown for NDTV"
