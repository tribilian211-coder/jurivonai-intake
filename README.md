# JurivonAI — Lawyer Research Intake

A zero-cost, Typeform-style survey tool that captures 23 deep-dive questions from Pakistani lawyers about legal research, drafting, and AI tools. Responses flow directly into a database with a private admin dashboard for analysis.

**Total monthly cost: $0** (Vercel Free + Neon Postgres Free + browser-native voice).

---

## What's included

- **Landing page** with JurivonAI branding + intake form (email, practice area, city, years)
- **23-question survey** across 5 sections, one question at a time
- **Real-time lead capture** — you see lawyers land in your admin dashboard the moment they type their email, even if they never click "Begin"
- **Voice answers** via Web Speech API (Chrome/Edge/Safari) — lawyers speak instead of type
- **Auto-save** every 1.2s + resume support (lawyers can leave and come back)
- **Smart skip logic** — Section 3 (Digilawyer) auto-skipped if they answer "no"
- **Admin dashboard** at `/#admin` with:
  - 5 lifecycle stats (Total / Just opened / In progress / Completed / Avg completion)
  - Verbatim quote search across all answers
  - Filter by practice area + status
  - One-click CSV export
  - Auto-refresh every 30s
- **Concurrency-safe** — tested with 10 simultaneous writes, zero crashes

---

## 🚀 DEPLOY — Web-only path (RECOMMENDED, no terminal needed)

**You do NOT need PowerShell, npm, node, or any terminal.** Do everything from your browser. Total time: ~15 minutes.

### Step 1 — Upload code to GitHub (5 min)

1. **Unzip** `jurivonai-intake.zip` on your computer. You get a folder called `jurivonai-intake`.
2. Go to [github.com](https://github.com) → sign in (or create a free account)
3. Click the **+** icon (top right) → **New repository**
4. Repository name: `jurivonai-intake`
5. Set to **Private** (recommended)
6. **DO NOT** check any "Initialize" boxes (no README, no .gitignore, no license — the ZIP already has them)
7. Click **Create repository**
8. On the next page, click **"uploading an existing file"** (a link in the middle of the page)
9. **Open** the unzipped `jurivonai-intake` folder on your computer
10. **Select ALL files and folders inside it** (press Ctrl+A inside the folder) — but NOT the `jurivonai-intake` folder itself
11. **Drag them** into GitHub's upload area (the one that says "Drag files here")
12. Wait until all files finish uploading (you'll see the file list populate)
13. Scroll to the bottom → click **Commit changes**

✅ You now have your code on GitHub.

### Step 2 — Create a free Postgres database (3 min)

1. Go to [neon.tech](https://neon.tech) → **Sign up** (Google login works)
2. Click **Create New Project** → name it `jurivonai` → pick the region closest to you → **Create**
3. You'll land on the project dashboard. Find the **Connection string** — it looks like:
   ```
   postgresql://neondb:AbCdEf123456@ep-cool-name-123.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. **Copy this string** to a notepad — you'll need it in Step 4.

### Step 3 — Create the database table (1 min, no terminal)

1. In your Neon dashboard, click **SQL Editor** (left sidebar)
2. Click **New query**
3. **Open the file `prisma/migration.sql`** from your unzipped project folder in any text editor (Notepad, VS Code, anything)
4. **Select all the text** (Ctrl+A) → **copy** (Ctrl+C)
5. **Paste it** into the Neon SQL Editor (Ctrl+V)
6. Click the **Run** button (top right of the SQL editor)
7. You should see **"Success"** in the bottom panel

✅ Your database now has a `Response` table ready to receive survey submissions.

### Step 4 — Deploy to Vercel (5 min)

1. Go to [vercel.com](https://vercel.com) → **Sign up** (use the **Login with GitHub** button — this links your Vercel and GitHub accounts)
2. Click **Add New…** → **Project**
3. You'll see your `jurivonai-intake` repo listed → click **Import**
4. **Scroll down** to "Environment Variables" (don't click Deploy yet!)
5. Add two environment variables by clicking **"Add"** for each:

   **First variable:**
   - Key: `DATABASE_URL`
   - Value: (paste your Neon connection string from Step 2)
   - Environments: check all three (Production, Preview, Development)

   **Second variable:**
   - Key: `ADMIN_PASSWORD`
   - Value: (pick a strong password, e.g. `Jurivon$2026!Legal`)
   - Environments: check all three

6. Click **Deploy**
7. Wait ~2 minutes for the build to finish (you'll see a progress bar)
8. When you see **"Congratulations"** → click **Visit**
9. Your site is live at `https://jurivonai-intake-xxx.vercel.app` 🎉

### Step 5 — Test it

1. Open your Vercel URL → type a test email → click **Begin interview** → answer a few questions → click **Submit responses**
2. Go to `https://your-url/#admin` → enter your `ADMIN_PASSWORD`
3. You should see your test submission in the dashboard with all answers

✅ Done. Share the Vercel URL with lawyers.

### Step 6 (optional) — Custom domain

In your Vercel project → **Settings** → **Domains** → add `intake.jurivon.ai` (or any domain you own). Vercel walks you through DNS setup. Free for any domain you already own.

---

## ⚠️ Common issues

### "I tried the Vercel CLI and got an error about Prisma schema not found"

**You're running commands from the wrong folder.** You must `cd` into the unzipped `jurivonai-intake` folder BEFORE running any commands. If your prompt shows `C:\WINDOWS\system32>` you're in the wrong place.

Fix (PowerShell):
```powershell
# Replace the path below with where you unzipped the project
cd "$env:USERPROFILE\Downloads\jurivonai-intake"

# Verify you're in the right place — you should see package.json
dir package.json

# THEN run your commands
npx prisma db push
```

**Better yet:** skip the CLI entirely and use the web-only path above. You only need the CLI if you want to run the project locally on your own machine for testing.

### "Database connection failed" on Vercel

Your `DATABASE_URL` env var on Vercel is wrong or missing `?sslmode=require` at the end. Go to Vercel → Settings → Environment Variables → edit `DATABASE_URL` → make sure it ends with `?sslmode=require`.

### "Admin page shows 401 Unauthorized"

Your `ADMIN_PASSWORD` env var is not set on Vercel. Go to Vercel → Settings → Environment Variables → add `ADMIN_PASSWORD` → Redeploy.

### "Voice button is missing"

You're using Firefox. Voice input only works in Chrome, Edge, or Safari 14.1+. The form still works — you just type instead of speaking.

---

## Optional: Local development (skip if you only want to deploy)

If you want to run this on your own machine to test before deploying:

```powershell
# 1. Install Node.js 20+ from nodejs.org AND Bun from bun.sh
# 2. Open PowerShell — you MUST cd into the project folder first!
cd "$env:USERPROFILE\Downloads\jurivonai-intake"

# 3. Verify you're in the right folder (should list package.json)
dir package.json

# 4. For SQLite local dev (simplest — no Postgres needed):
#    - Replace prisma/schema.prisma with prisma/schema.sqlite.prisma
#    - Create a .env file with: DATABASE_URL="file:./db/custom.db"
#    - Then run:
bun install
bun run db:push
bun run dev
# Open http://localhost:3000
```

**If you see `C:\WINDOWS\system32>` in your prompt, you are NOT in the project folder.** `cd` to the folder first.

---

## Admin access

- URL: `https://your-vercel-url/#admin`
- Password: whatever you set as `ADMIN_PASSWORD` env var on Vercel
- Default dev password (DO NOT use in production): `jurivon-internal-2026`

---

## Tech stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Next.js 16 (App Router) | Vercel native, free |
| Database | PostgreSQL via Neon | Free 0.5GB, serverless, scales to millions of rows |
| ORM | Prisma 6 | Type-safe, auto-generated client |
| Voice input | Web Speech API | Browser-native, $0, no Whisper API |
| UI | shadcn/ui + Tailwind 4 | MIT, polished |
| Hosting | Vercel Free | 100GB bandwidth, auto-deploy from GitHub |

**No external paid APIs.** Everything is open-source or free-tier.

---

## File structure

```
jurivonai-intake/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Root view router (landing/survey/complete/admin)
│   │   ├── layout.tsx            # Root layout with fonts + Sonner toaster
│   │   ├── globals.css           # Tailwind theme
│   │   └── api/
│   │       ├── responses/
│   │       │   ├── route.ts      # POST (create lead) + GET (admin list)
│   │       │   └── [id]/route.ts # PATCH (save answer) + GET (admin detail)
│   │       ├── resumes/[id]/route.ts  # GET (resume by localStorage ID)
│   │       └── admin/
│   │           ├── login/route.ts    # POST (verify password)
│   │           └── export/route.ts   # GET (CSV export)
│   ├── components/
│   │   ├── survey/
│   │   │   ├── Landing.tsx       # Landing page + real-time lead capture
│   │   │   ├── SurveyApp.tsx     # One-question-at-a-time flow
│   │   │   ├── VoiceRecorder.tsx # Web Speech API integration
│   │   │   └── Complete.tsx      # Thank-you page
│   │   └── admin/
│   │       └── AdminDashboard.tsx  # Password-protected admin UI
│   └── lib/
│       ├── db.ts                 # Prisma client + SQLite PRAGMA hardening
│       ├── questions.ts          # All 23 questions + skip logic
│       └── admin/auth.ts         # Shared password check
├── prisma/
│   ├── schema.prisma             # PostgreSQL (production)
│   ├── schema.sqlite.prisma      # SQLite (local dev alternative)
│   └── migration.sql             # Plain SQL — paste into Neon SQL editor
├── package.json
├── .env.example
└── README.md (this file)
```

---

## Support

If you hit any issues:
1. Check the **Common issues** section above
2. The most common cause of CLI errors is **running commands from the wrong folder** — always `cd` into the project folder first
3. The web-only path above (GitHub → Neon → Vercel) avoids the CLI entirely and is the recommended approach for non-technical users
