# Confirmi

**Confirmi** (Darja for "confirm it", كونفيرمي) is a simple dashboard for **one Algerian online seller** who sells with **cash on delivery**.
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
- **Telegram alerts**: a message for every new order from the form (customer, phone, product, wilaya,
  total, duplicate / risk warnings, button to confirm), and an evening summary at 21:00.
- **Ad pixels (Meta + TikTok)**: paste the Pixel ID in Settings. The order page sends PageView, ViewContent,
  InitiateCheckout and, when the order is saved, Purchase (Meta) / CompletePayment (TikTok) with the order
  total in DZD. The order id is the event id. Dashboard (manual) orders send nothing.
- **Courier (optional, Yalidine or ZR Express)**: send confirmed orders to the courier in one click (tracking number and
  label come back), choose the stop desk for desk orders, statuses refresh on their own and parcels move to
  Delivered / Returned by themselves. `COURIER=demo` runs a fake courier for development and demos.
  **Settings → Courier → Check connection** tests the keys and every commune against the courier's own list
  without sending anything.
- **Stats**: confirmation, delivery and return rates, profit
  (delivered sales − product cost − delivery fees − return costs − ad spend), daily ad spend entry
  (general or per product), charts, ad cost per delivered order per product, return report per wilaya.
- **Caller login (optional)**: a second password for someone who calls customers for the seller. It only opens
  the call queue, abandoned orders and "Save the parcel" (and adding a new order). No profit, stats, cash,
  customers list or settings. Set or remove it in **Settings → Caller access**.
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
   and only adds demo orders when there are none.

   **For a real client, use `npm run db:seed-client` instead**: settings, password and delivery fees only,
   with no demo products or orders, so nothing fake shows in their stats.

5. **Run it**

   ```bash
   npm run dev
   ```

   Open http://localhost:3000 and sign in with `OWNER_PASSWORD`.

### Handover checklist (before the client's first real order)

- [ ] **Settings → Store**: the client's store name (it shows on the order form and in WhatsApp messages).
- [ ] Seeded with `npm run db:seed-client` (no demo data). Never run `db:reset-demo` on a client database:
      it deletes every order and customer.
- [ ] **Settings → Products**: add the real products (price + cost).
- [ ] **Settings → Delivery fees**: the client's real fees per wilaya (home / stop desk).
- [ ] **Settings → WhatsApp message**: check the text with the client.
- [ ] Optional: Telegram alerts, Meta / TikTok Pixel IDs, courier keys (see below).
- [ ] Place one test order from the public link on a phone, confirm it, then cancel it.
- [ ] `ACCESS_UNTIL` set to the trial end date, and `CONTACT_WHATSAPP` to your number.
- [ ] Give the client their order links and the password; ask them to change it in Settings.

## Free trial and monthly access

Each install can have an end date in `ACCESS_UNTIL` (`YYYY-MM-DD`, the last day included). Empty = no limit.

- **3 days before** the date, every dashboard screen shows a reminder.
- **After** the date, the dashboard (pages, exports, buttons) shows "access expired" with a WhatsApp
  button to `CONTACT_WHATSAPP`. **The public order form keeps working**, so no order is lost.
- **To start a trial:** set the date (e.g. today + 14 days, as on the price sheet) when you deploy.
- **When the client pays:** in Vercel → Settings → Environment Variables, set the new date
  (e.g. the last day of the paid month), then **Redeploy**. Environment changes only apply after a redeploy.

## Telegram alerts setup

1. In Telegram, open **@BotFather** → `/newbot` → give it a name (e.g. "Confirmi – Store name") and a username.
2. Copy the token into `TELEGRAM_BOT_TOKEN` (and set `CRON_SECRET` to any long random string).
3. The seller opens **Settings → Alertes Telegram → Connecter Telegram**, presses *Start* in Telegram,
   then *Vérifier*. Done. One bot per install (each client gets their own).

The evening summary runs from `vercel.json` (`0 20 * * *` = 21:00 Algiers). On a VPS add a crontab line:
`0 20 * * * curl -s -H "Authorization: Bearer $CRON_SECRET" https://your-domain/api/cron/daily`

## Courier setup (Yalidine)

1. In the seller's Yalidine account: *Développement → API*, copy the **API ID** and **API Token**.
2. In the server's environment set `COURIER=yalidine`, `YALIDINE_API_ID`, `YALIDINE_API_TOKEN` and
   `COURIER_FROM_WILAYA` (wilaya code the seller ships from, e.g. `16`).
3. **Settings → Courier → Check connection** (read-only, nothing is sent). It must say the keys are accepted,
   show how many of the 1541 communes Yalidine knows, and list the ones it does not know (orders there would
   be refused). Communes of the new 2026 wilayas that Yalidine still files under the old wilaya are found
   by name and sent normally.
4. First live test: send **one** order, check it in the Yalidine dashboard (name, phone, commune, amount),
   then delete that parcel there while it is still "En préparation".

The amount sent is the order total, with `freeshipping` on, so the courier collects exactly what the
customer was told and takes its fee from the payout. Without `COURIER`, the delivery page works as before
(manual statuses + Excel/CSV export).

## Courier setup (ZR Express)

1. In the seller's ZR Express space: *API / intégrations*, copy the **secret API key** and the **tenant id**.
   If the keys are refused, ask ZR Express to switch on API access for the account.
2. In the server's environment set `COURIER=zrexpress`, `ZREXPRESS_API_KEY` and `ZREXPRESS_TENANT_ID`.
3. **Settings → Courier → Check connection** (read-only, nothing is sent): keys accepted, communes found,
   stop desks in the seller's wilaya. If it fails, the error message from ZR Express is shown.
4. First live test: send **one** order and check it in the ZR Express space (name, phone, commune, stop desk,
   amount), then cancel it there. The endpoints follow an open-source SDK and have not yet been checked
   against a real account, so do steps 3 and 4 before the client ships for real.

Stop desks (ZR hubs) are picked on the delivery page. The amount collected is the order total.

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
- Spam and login limits are kept in the database (`RateLimit` table), so they also hold on Vercel.
  The daily cron clears old rows.
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

Keep it running with `pm2` or a systemd service.

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
| `npm run db:demo-topup` | Demo database only: add a fresh batch of demo orders dated around today (last 13 days + today's queue, failed deliveries, abandoned orders, ad spend), so the dashboard looks alive for a video or a live demo. Adds only, never deletes. Refuses to run without the demo products. `-- --days=3` fills only the last 3 days. |
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
