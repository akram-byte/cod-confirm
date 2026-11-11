# Confirmi — Project Context

## What this is
A clean, simple **dashboard app for one Algerian online seller** who sells with **cash on delivery (COD)**,
mostly through Facebook/Instagram ads. The store owner uses it themselves every day.

**Main goal:** cut fake orders and returned parcels, save time confirming orders, and show the seller their real profit.

**Not a SaaS.** One install = one seller. To sell it, we deploy a copy for each client
(setup fee + optional small monthly fee for hosting/support).

## Who uses it
- **One user: the store owner.** One password-protected login. No agents, no roles, no multiple accounts.
- Mostly uses it on a laptop, but often on the phone → must work well on mobile.
- Not technical → every screen must be obvious. Fewer clicks beats more features.

## Core principles
1. **Easy to use first.** Big clear actions, few clicks, no clutter.
2. **Works reliably.** Validate inputs, handle errors, never lose an order.
3. **Clean dashboard UI.** Calm, modern, consistent. Not overloaded.
4. **Simple code.** One project, no over-engineering, easy to copy for a new client.

## Features (v1)
1. **Orders**
   - Public order form page per product (`/order/[slug]`) that the seller links from ads.
   - Manual order entry from the dashboard.
   - Wilaya + commune selection, home delivery or stop desk, delivery fee filled automatically.
   - Algerian phone validation (05/06/07 + 8 digits).
   - Duplicate warning (same phone + same product within 24h). Simple spam protection (honeypot + rate limit).
2. **Confirmation**
   - "To confirm" queue, oldest first, with call-back orders shown when due.
   - One click outcomes: **Confirmed / No answer / Call back later / Cancelled**.
   - Counts call attempts; every call is logged with an optional note.
   - WhatsApp button: opens `wa.me` link with a pre-filled message (editable template in Settings).
   - Click-to-call `tel:` link on phone.
3. **Customers**
   - Every phone number has a history (orders, outcomes, returns).
   - Warning badge for risky customers (previous refused/returned parcels, many cancellations).
   - Manual blacklist. Blacklisted numbers get flagged on new orders.
4. **Delivery**
   - Statuses: Shipped → Delivered / Returned. Optional tracking number.
   - Export confirmed orders to Excel/CSV for the delivery company.
5. **Stats**
   - Confirmation rate, delivery rate, return rate.
   - Profit = delivered sales − product cost − delivery fees − return costs − ad spend (ad spend entered manually by day).
   - Simple charts, date range filter.
6. **Settings**
   - Store name, products (name, price, cost, slug, active), delivery fees per wilaya (home / stop desk),
     WhatsApp message template, password change.

### Order statuses
`NEW` → `CONFIRMED` | `NO_ANSWER` (retry) | `CALLBACK` (scheduled) | `CANCELLED`
`CONFIRMED` → `SHIPPED` → `DELIVERED` | `RETURNED`

## Out of scope for v1 (maybe later)
- Multiple users / agents / roles, multi-store, subscriptions or billing.
- Delivery company APIs (Yalidine, ZR Express…): v1 uses Excel/CSV export.
- Automatic WhatsApp bot (WhatsApp Business API needs Meta approval and costs money).
- Stock management, landing page builder.

## Tech stack
- **Next.js (App Router) + TypeScript**
- **Tailwind CSS + shadcn/ui** for the interface, **lucide-react** icons, **Recharts** for charts
- **PostgreSQL** with **Prisma**. Hosted database: **Neon** free plan (Supabase also works — only the connection string changes)
- **Auth:** single owner password (hashed) + signed HTTP-only session cookie. No external auth service.
- **i18n:** Arabic (RTL) + French. Arabic is the default.
- **Validation:** zod. **Excel export:** exceljs.
- **Hosting:** Vercel free plan for the demo. For paying clients: small VPS (~$5/month) or a paid plan (Vercel Hobby is non-commercial).
- **No paid or external APIs in v1.** Everything is free.

## Data notes
- Wilayas + communes stored as a JSON file inside the project.
  Algeria had 58 wilayas; new wilayas were reportedly announced in 2025 — **verify the current official list** before seeding.
- Money in Algerian dinars (DZD), stored as integers.
- Customer data stays private to this one seller. Never share data between clients (Algerian personal data law 18-07).

## UI layout
- Sidebar: Dashboard, Orders, Confirmation, Customers, Delivery, Stats, Settings.
- Dashboard home: summary cards (today's orders, to confirm, confirmation rate, return rate, profit) + one chart.
- Tables with search, filters, status badges and quick actions.
- Light and dark mode. Fully usable on mobile (sidebar becomes a drawer).
