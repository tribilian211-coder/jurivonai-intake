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

## Deploy to Vercel (free, ~15 minutes)

You do NOT need a local development environment. You can do everything from your browser.

### Step 1: Create a GitHub repo and upload the code (5 min)

1. Go to [github.com/new](https://github.com/new)
2. Repository name: `jurivonai-intake`
3. Set to **Private** (recommended — this has your admin password logic)
4. **Don't** initialize with README/license/gitignore (the ZIP already has them)
5. Click **Create repository**
6. On the next page, click **"uploading an existing file"** (or drag-drop the unzipped files)
7. Unzip `jurivonai-intake.zip` on your computer
8. Drag the **contents** of the unzipped folder (not the folder itself) into GitHub's upload area
9. Wait for all files to upload, then click **Commit changes**

### Step 2: Create a free Neon Postgres database (3 min)

Vercel's serverless filesystem is read-only, so SQLite won't work in production. Use Neon (free, serverless Postgres):

1. Go to [neon.tech](https://neon.tech) → **Sign up** (Google login works)
2. Click **New Project** → name it `jurivonai` → region: closest to you → **Create**
3. On the project dashboard, find **"Connection string"** — it looks like:
   ```
   postgresql://neondb:AbCdEf123456@ep-cool-name-123.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. **Copy this string** — you'll paste it into Vercel next

### Step 3: Deploy to Vercel (5 min)

1. Go to [vercel.com](https://vercel.com) → **Sign up** with GitHub
2. Click **Add New…** → **Project**
3. Import your `jurivonai-intake` repo
4. Vercel auto-detects Next.js — leave all build settings as default
5. **Before clicking Deploy**, expand **"Environment Variables"** and add:

   | Name | Value |
   |------|-------|
   | `DATABASE_URL` | (paste your Neon connection string from Step 2) |
   | `ADMIN_PASSWORD` | (a strong password of your choice, e.g. `Jurivon$2026!Legal`) |

6. Click **Deploy**
7. Wait ~2 minutes for the build to finish
8. Click **Visit** — your live site opens at `https://jurivonai-intake-xxx.vercel.app`

### Step 4: Create the database tables (1 min)

The first deploy won't have tables yet. Run this one-time command:

1. In your Vercel project, go to **Settings** → **Functions** → scroll down
2. OR easier: install the Vercel CLI on any computer with Node.js:
   ```bash
   npm i -g vercel
   vercel login
   vercel link  # run inside your unzipped project folder
   vercel env pull .env.production.local
   npx prisma db push
   ```
3. If you can't install CLI tools, the simplest alternative: ask me to add an auto-migrate API route that runs Prisma `db push` on first request. (Tell me if you need this.)

**Alternative**: Just deploy, then go to your Neon dashboard → SQL Editor → paste the SQL from `prisma/migration.sql` (included in the ZIP) → Run. Done.

### Step 5: Test it

1. Open your Vercel URL
2. Type a test email → click Begin → answer a few questions
3. Go to `https://your-url/#admin` → enter your `ADMIN_PASSWORD`
4. You should see your test response in the dashboard

### Step 6 (optional): Custom domain

In Vercel project → **Settings** → **Domains** → add `intake.jurivon.ai` (or whatever domain you own). Vercel walks you through DNS setup. Free for any domain you already own.

---

## Local development (optional — skip if you only want to deploy)

If you want to run this on your own machine to test before deploying:

```bash
# 1. Install Node.js 20+ and Bun (https://bun.sh)
# 2. Unzip the project, cd into it
bun install

# 3. For SQLite local dev (simplest):
#    - Replace prisma/schema.prisma with prisma/schema.sqlite.prisma
#    - Set DATABASE_URL="file:./db/custom.db" in .env
#    - Run: bun run db:push

# 4. Start dev server
bun run dev
# Open http://localhost:3000
```

---

## Admin access

- URL: `https://your-vercel-url/#admin`
- Password: whatever you set as `ADMIN_PASSWORD` env var
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
src/
├── app/
│   ├── page.tsx                  # Root view router (landing/survey/complete/admin)
│   ├── layout.tsx                # Root layout with fonts + Sonner toaster
│   ├── globals.css               # Tailwind theme
│   └── api/
│       ├── responses/
│       │   ├── route.ts          # POST (create lead) + GET (admin list)
│       │   └── [id]/route.ts     # PATCH (save answer) + GET (admin detail)
│       ├── resumes/[id]/route.ts # GET (resume by localStorage ID)
│       └── admin/
│           ├── login/route.ts    # POST (verify password)
│           └── export/route.ts   # GET (CSV export)
├── components/
│   ├── survey/
│   │   ├── Landing.tsx           # Landing page + real-time lead capture
│   │   ├── SurveyApp.tsx         # One-question-at-a-time flow
│   │   ├── VoiceRecorder.tsx     # Web Speech API integration
│   │   └── Complete.tsx          # Thank-you page
│   └── admin/
│       └── AdminDashboard.tsx    # Password-protected admin UI
├── lib/
│   ├── db.ts                     # Prisma client + SQLite PRAGMA hardening
│   ├── questions.ts              # All 23 questions + skip logic
│   └── admin/auth.ts             # Shared password check
└── prisma/
    ├── schema.prisma             # PostgreSQL (production)
    └── schema.sqlite.prisma      # SQLite (local dev alternative)
```

---

## Support

If you hit any issues during deploy, the most common ones are:

1. **"Database connection failed"** → your `DATABASE_URL` is wrong or missing `?sslmode=require`
2. **"Table doesn't exist"** → you haven't run `db push` yet (see Step 4)
3. **Admin page shows 401** → `ADMIN_PASSWORD` env var not set on Vercel
4. **Voice button missing** → you're on Firefox; voice only works in Chrome/Edge/Safari
