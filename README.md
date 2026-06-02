# Promo Awards Vote '26

School promotion party voting: registration, admin approval, **Phase 1 nominations**, automatic shortlisting, **Phase 2 final vote**, plus optional **Google Form** links for each phase.

## Quick start

```bash
cd school-awards-vote
npm install
npm run db:setup
npm run dev
```

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
