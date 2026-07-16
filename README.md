# Tanque (torpasgas)

Super-simple fuel tracker PWA: log each fill-up (**€ total, liters, odometer km**,
date — defaults to today, editable), and it derives **average consumption
(L/100km)**, **€/L**, **cost per 100 km**, plus charts for **spend by month**,
**spend by part of the month** and **consumption over months**. Optionally pushes
each fill-up into [Saldo / Walleta](https://github.com/andrevieira11/avieira_expenses)
as an expense via its ingest webhook.

Sister apps: Saldo (expenses) and MrList (groceries). Same stack, same deploy shape:
Next.js 16 (App Router, standalone) · React 19 · Tailwind v4 · Drizzle + Postgres ·
Better Auth · Recharts · Docker behind Caddy on the Proxmox host.

## How consumption is computed

L/100km only exists between two **full** fill-ups (tank level known at both ends).
Partial fills roll into the next full segment. The first fill-up ever anchors the
odometer but contributes no fuel. Averages appear after the second full tank.

## Dev

```bash
npm install
docker compose -f docker-compose.dev.yml up -d   # local Postgres on :5433
cp .env.example .env                             # then set DATABASE_URL to the dev db
npm run db:migrate
npm run dev
```

`npm run lint` · `npm run build` · `npm run test` (pure-logic tests: consumption
math + Walleta payload).

## Walleta integration

Set in `.env`:

```
WALLETA_URL=https://saldo.torpasweb.com
WALLETA_INGEST_TOKEN=<Saldo's INGEST_WEBHOOK_TOKEN>
```

Each new fill-up (with the "Add to Walleta" toggle on) POSTs
`Compra de 45,50 EUR em <station> DD/MM/YYYY` to Saldo's `/api/ingest` — its
moey! parser fills amount, merchant and date; categorise the merchant once and
Saldo's learned rule auto-categorises the rest. `external_id` makes retries
idempotent. Push is create-only: editing a fill-up here does not edit the expense
there.

## Deploy (same rules as the sister apps)

- **NEVER build on the server** — build + push from the PC (`deploy.ps1`) or CI.
- The server only runs `docker compose pull && docker compose up -d` (`release.ps1`).
- GitHub Actions pushes `ghcr.io/andrevieira11/torpasgas:latest` on every push to
  main; Watchtower on the server auto-pulls. App self-migrates on start.
- Caddy proxies gas.torpasweb.com → the app port.
