# CloudWar — AWS IAM Credential Access System

A full-stack web app for the MLSC Cloud Event. Teams enter a unique numeric access code to retrieve their assigned AWS IAM credentials. Members can register themselves into a team, and admins can manage credentials and look up registered members.

## Tech Stack

- **Frontend** — Vanilla JS, Tailwind CSS, Neo-Brutalist design (deployed on Vercel)
- **Backend** — Node.js, Express (deployed on Render)
- **Database** — Supabase (PostgreSQL)

## Features

- Teams enter a 4-digit code to get their AWS console URL, username, and password
- Members can join a team by entering name, phone, and email
- Phone number is unique across all teams — prevents double registration
- Members can leave a team (updates count live)
- Team size defaults to 4, editable per team via admin panel
- Admin panel to create/update team credentials
- Admin phone lookup — check if a phone number is already registered and which team they belong to
- Seed script reads from Excel file (`CloudWar-S3.xlsx`) to bulk-load credentials

## Project Structure

```text
mlsc_cloud/
  backend/
    data/
      CloudWar-S3.xlsx        # Excel seed file
    scripts/
      seedData.js             # Seed script (reads Excel → Supabase)
    src/
      routes/credentials.js   # All API routes
      services/credentialStore.js  # Supabase queries
      validators/credentialValidator.js
      config.js
      server.js
    .env.example
    .gitignore
    package.json
  frontend/
    index.html
    app.js
    styles.css
    config.js                 # Set API_BASE to your Render URL
    vercel.json
    mlsc-logo.jpg
  render.yaml
  README.md
```

## Supabase Schema

Run this in your Supabase SQL Editor:

```sql
create table teams (
  code         text primary key,
  team_name    text not null default '',
  url          text not null default '',
  username     text not null,
  password     text not null,
  team_size    int  not null default 4,
  members      jsonb not null default '[]',
  used         boolean not null default false,
  consumed_at  timestamptz
);

alter table teams enable row level security;
```

## Local Development

```bash
cd mlsc_cloud/backend
npm install
cp .env.example .env       # fill in your values
npm start                  # runs on http://localhost:4000
```

### .env variables

```env
PORT=4000
ADMIN_TOKEN=MLSC-Team
SINGLE_USE_CODES=false
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
CORS_ORIGIN=http://localhost:4000
```

## Seeding Data

Place your Excel file at `backend/data/CloudWar-S3.xlsx` with columns:

| Teams | URL | Username | Password |
|-------|-----|----------|----------|
| 1 | https://... | team1 | pass123 |

Then run:

```bash
npm run seed
```

Team codes are zero-padded to 4 digits (e.g. `1` → `0001`). Re-running seed is safe — it upserts.

## Deployment

### Backend → Render

1. Push repo to GitHub
2. Render → New Web Service → connect repo
3. Root Directory: `mlsc_cloud/backend`
4. Build: `npm install` | Start: `npm start`
5. Add environment variables in Render dashboard:
   ```
   ADMIN_TOKEN=MLSC-Team
   SUPABASE_URL=...
   SUPABASE_SERVICE_ROLE_KEY=...
   SINGLE_USE_CODES=false
   CORS_ORIGIN=https://your-vercel-app.vercel.app
   ```
6. Note your Render URL: `https://cloudwar-backend.onrender.com`

### Frontend → Vercel

1. Update `frontend/config.js` with your Render URL:
   ```js
   const API_BASE = "https://cloudwar-backend.onrender.com";
   ```
2. Vercel → New Project → connect repo
3. Root Directory: `mlsc_cloud/frontend`
4. Framework: **Other** (static)
5. Deploy

> Deploy backend first, get the Render URL, update `config.js`, then deploy frontend. After frontend is live, update `CORS_ORIGIN` on Render with the Vercel URL and redeploy.

## API Reference

All admin routes require header: `x-admin-token: MLSC-Team`

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/get-credentials` | Get team credentials by code |
| POST | `/api/join-team` | Join a team (name, phone, email) |
| POST | `/api/leave-team` | Leave a team by name |
| POST | `/api/admin/get-credential` | Admin: lookup team by code |
| POST | `/api/admin/update-credential` | Admin: create or update team |
| POST | `/api/admin/update-team-size` | Admin: update team size |
| POST | `/api/admin/lookup-member` | Admin: find member by phone |
| GET  | `/health` | Health check |
