# Promo Awards Vote '26

School promotion party voting: registration, admin approval, **Phase 1 nominations**, automatic shortlisting, **Phase 2 final vote**, plus optional **Google Form** links for each phase.

## Quick start

```bash
cd prom_voting_awards
npm install
npm run db:setup
npm run dev
```

### Database (local Windows / first-time setup)

Use **`npm run db:push`** (not `db push` alone). That syncs the schema to SQLite.

If `npx prisma migrate deploy` fails with **P3005** (database not empty, no migration history), your DB was created with `db push`. Either keep using:

```bash
npm run db:push
```

Or **baseline** migration history once (after `db push`):

```bash
npm run db:push
npm run db:baseline
npm run db:deploy
```

If `db:baseline` says migrations are **already applied**, that is fine — run `npm run db:deploy` only.

### EPERM on `query_engine-windows.dll.node`

This happens when **`npm run dev` is still running** and Prisma tries to regenerate the client. Your database can still be in sync.

1. Stop the dev server (Ctrl+C in that terminal), or on Windows:
   ```powershell
   taskkill /PID 8188 /F
   ```
   (Use the PID shown in the “Another next dev server is already running” message.)
2. Run `npm run db:push` (uses `--skip-generate` to avoid the lock while dev is running).
3. If you changed the schema, stop dev first, then: `npm run db:generate` and start dev again.

### Only one dev server

Use **http://localhost:3000** OR **3001**, not both. If port 3000 is taken, stop the old process before starting a new one.

Open [http://localhost:3000](http://localhost:3000).

**Default admin password:** `admin2026` (change in `.env` → `ADMIN_PASSWORD`)

## How it works

1. **Students** register with name + school email → receive a **one-time voter code**.
2. **Admin** approves voters (bulk approve when ~100+ registered).
3. **Phase 1** — Admin turns on nomination. Voters log in with code and either:
   - Nominate in the app (search roster — **used for automatic top-4 counting**), or
   - Use the **Google Form** link (admin pastes URL in dashboard), then click “I submitted the Google Form”.
4. **Admin** runs “Auto-select top nominees” → most frequent names become finalists; resolve ties and add names until **4 finalists** per position.
5. **Phase 2** — Admin opens final voting. Voters pick one finalist per award (in app and/or Google Form).
6. **Results** tab shows winners by vote count.

## Environment

Copy `.env.example` to `.env`:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | SQLite path (`file:./dev.db`) |
| `SESSION_SECRET` | Cookie signing (32+ chars in production) |
| `ADMIN_PASSWORD` | Admin login |
| `SCHOOL_EMAIL_DOMAIN` | Optional; restrict emails to `@domain` |

## Google Forms setup

1. Create **Form 1** (nominations) and **Form 2** (final vote) in Google Forms.
2. In **Admin → Overview**, paste both URLs and save.
3. Add a question on each form: “Voter code” (short answer) so you can match responses if needed.
4. **Important:** In-app nominations drive automatic finalist counts. If everyone uses only Google Forms, use Form responses in Sheets and admin shortlist manually, or ask students to also nominate in-app.

## Roster import

Admin → Positions tab → paste lines:

```
Alice Mukamana, alice@school.edu
Brian Niyonzima, brian@school.edu
```

## Production

- Set strong `SESSION_SECRET` and `ADMIN_PASSWORD`
- Use PostgreSQL if you prefer (`DATABASE_URL` + `provider = "postgresql"` in `prisma/schema.prisma`)
- Deploy on Vercel, Railway, or a school server with `npm run build && npm start`

## Positions (seeded)

- SOCIAL BUTTERFLY '26, PRAYER WARRIOR '26, GOLDEN '26, FLAWLESS '26, SERENE '26  
Admins can add or edit positions in the dashboard.
