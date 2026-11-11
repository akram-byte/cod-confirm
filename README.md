# COD Confirm

A simple dashboard for **one Algerian online seller** who sells with **cash on delivery**.
It cuts fake orders and returned parcels, makes confirming orders fast, and shows the real profit.

Arabic (right-to-left) by default, French as second language. Works on phone and laptop.
One install = one seller. To sell it, deploy a separate copy (and a separate database) for each client.

## Features

- **Order form** per product (`/order/<slug>`) to link from Facebook/Instagram ads: wilaya → commune,
  home delivery or stop desk, delivery fee and total filled in automatically.
  Algerian phone check (05/06/07 + 8 digits), hidden anti-bot field, rate limit, duplicate warning.
- **Orders**: search, filters (status, product, wilaya, dates), detail page, edit, manual order entry.
- **Confirmation**: "to confirm" queue (oldest first, call-backs when due), one-click outcomes
  (confirmed / no answer / call back / cancelled), call log with notes, attempt counter,
  call-back scheduling, `tel:` and WhatsApp links with an editable message, keyboard shortcuts (1–4, S).
- **Customers**: history per phone number, "at risk" badge (1 return or 2 cancellations), manual blacklist.
  Badges show on orders, the confirmation screen and the delivery list.
- **Delivery**: To ship / On the road / Delivered / Returned, tracking numbers, bulk actions,
  Excel and CSV export for the delivery company.
- **Courier (optional, Yalidine)**: send confirmed orders to the courier in one click (tracking number and
  label come back), choose the stop desk for desk orders, statuses refresh on their own and parcels move to
  Delivered / Returned by themselves. `COURIER=demo` runs a fake courier for development and demos.
- **Stats**: confirmation, delivery and return rates, profit
  (delivered sales − product cost − delivery fees − return costs − ad spend), daily ad spend entry, charts.
- **Settings**: store name, products, delivery fees for all 69 wilayas, WhatsApp message, password.

## Tech

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 + shadcn/ui · PostgreSQL + Prisma 7 · Recharts · exceljs · zod.
No paid or external APIs. Money is stored as whole dinars (DZD).

Wilayas and communes (69 / 1541, Journal Officiel N° 25 of 5 April 2026) are in `src/data/algeria.json`.

## Setup for a new client

You need Node.js 20+ and a free [Neon](https://neon.tech) PostgreSQL database (Supabase also works).

1. **Get the code and install**

   ```bash
   npm install
   ```

2. **Create a Neon project** for this client. In *Connect*, copy two connection strings:
   the **pooled** one (host contains `-pooler`) and the **direct** one.

3. **Create `.env`** from the example and fill it in:

   ```bash
   cp .env.example .env
   ```

   | Variable | What to put |
   |---|---|
   | `DATABASE_URL` | Neon pooled connection string (used by the app) |
   | `DIRECT_URL` | Neon direct connection string (used by migrations and scripts) |
   | `SESSION_SECRET` | 32+ random characters: `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"` |
   | `OWNER_PASSWORD` | The client's first password (8+ characters). They can change it in Settings. |

   Never commit `.env`.

4. **Create the tables and the first data**

   ```bash
   npm run db:deploy
   npm run db:seed
   ```

   The seed creates the settings and password, default delivery fees for all 69 wilayas,
   three demo products and some demo orders. It is safe to run again: it never overwrites the password
   and only adds demo orders when there are none. For a real client, delete the demo products
   (or switch them off) in Settings and adjust the delivery fees.

5. **Run it**

   ```bash
   npm run dev
   ```

   Open http://localhost:3000 and sign in with `OWNER_PASSWORD`.

## Courier setup (Yalidine)

1. In the seller's Yalidine account: *Développement → API*, copy the **API ID** and **API Token**.
2. In the server's environment set `COURIER=yalidine`, `YALIDINE_API_ID`, `YALIDINE_API_TOKEN` and
   `COURIER_FROM_WILAYA` (wilaya code the seller ships from, e.g. `16`).
3. First live test: send **one** order, check it in the Yalidine dashboard (name, phone, commune, amount),
   then delete that parcel there while it is still "En préparation".

The amount sent is the order total, with `freeshipping` on, so the courier collects exactly what the
customer was told and takes its fee from the payout. Without `COURIER`, the delivery page works as before
(manual statuses + Excel/CSV export).

## Deploy

### Demo: Vercel + Neon (free)

1. Push the code to a private GitHub repository.
2. In Vercel: *Add New Project* → import the repository. The defaults are fine
   (build command `npm run build`, which runs `prisma generate` first).
3. Add the environment variables `DATABASE_URL`, `DIRECT_URL` and `SESSION_SECRET`
   (no need for `OWNER_PASSWORD` on Vercel).
4. Run `npm run db:deploy` and `npm run db:seed` once from your computer with the same `.env`.
5. Deploy. `vercel.json` runs the app in Frankfurt (`fra1`); create the Neon project in Frankfurt (`eu-central-1`) too, so every database call stays local and pages stay fast.
6. Check the live site: open `/login`, sign in, then open `/order/montre-connectee-sport` (demo product)
   and place a test order. It should appear in *Confirmation*.

Notes for the demo:
- Keep `sslmode=verify-full` in both connection strings (as in `.env.example`).
- The spam rate limit is in memory, so on Vercel (serverless) it is only best-effort.
  Fine for a demo; use the VPS setup below for real clients.
- Delete the demo products/orders in the app before handing a copy to a client.

> Vercel's free Hobby plan is for **non-commercial** use. For paying clients use a Vercel Pro plan
> or a small VPS (below).

### Paying client: small VPS (~$5/month)

```bash
npm ci
npm run db:deploy
npm run build
npm start          # port 3000; put Nginx or Caddy in front for HTTPS
```

Keep it running with `pm2` or a systemd service. The spam rate limits are kept in memory,
which works best on a single server like this.

### After each update

Run `npm run db:deploy` against the client's database whenever new migrations were added,
then redeploy.

## Everyday commands

| Command | What it does |
|---|---|
| `npm run dev` | Start the app in development |
| `npm run build` / `npm start` | Production build / start |
| `npm run lint` · `npm run typecheck` | Code checks |
| `npm run db:migrate` | Create a new migration after changing `prisma/schema.prisma` (development) |
| `npm run db:deploy` | Apply migrations to a database (production) |
| `npm run db:seed` | First data (settings, fees, demo products/orders) |
| `npm run db:studio` | Browse the database |
| `npm run reset-password` | Set the owner password back to `OWNER_PASSWORD` from `.env` (signs out every device) |

## Where things are

```
prisma/              schema, migrations, seed, reset-password
src/app/order/       public order form (no login)
src/app/(dashboard)/ dashboard pages: orders, confirmation, customers, delivery, stats, settings
src/app/login/       owner login
src/lib/             business logic: orders, confirmation, customers, delivery, stats, auth
src/i18n/            all text: ar.ts (default) and fr.ts
src/data/            wilayas and communes
```

## Notes

- **Privacy**: each client has their own database. Customer data must never be shared between clients
  (Algerian personal data law 18-07).
- **Login**: one owner password, stored hashed (bcrypt). Changing it signs out every other device.
- **Stats** count orders by the day they were placed, so each day's ad spend is compared with the orders it brought.
