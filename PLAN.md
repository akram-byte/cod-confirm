# COD Confirm — Build Plan

Target: **v1 in about 5–7 days** (2–3 hours a day). Read `CONTEXT.md` first.
Tick boxes as work is finished. Each phase should end working and tested.

## Phase 1 — Setup & foundation (Day 1)
- [x] Create Next.js + TypeScript project, Tailwind, shadcn/ui
- [x] Prisma + PostgreSQL (Neon) connection, `.env.example`
- [x] Database schema: Product, Order, OrderItem, Customer, CallLog, DeliveryFee, AdSpend, Settings
- [x] Seed: wilayas/communes JSON (69 wilayas / 1541 communes, JO N° 25 of 5 April 2026), default delivery fees, demo products and orders
- [x] Owner login (hashed password, session cookie), protect dashboard routes
- [x] i18n Arabic (RTL, default) + French
- [x] Dashboard layout: sidebar, header, light/dark mode, mobile drawer

## Phase 2 — Orders (Day 2)
- [x] Public order form `/order/[slug]` (wilaya → commune, delivery type, auto fee, total)
- [x] Phone validation, honeypot + rate limit, duplicate detection
- [x] Orders table: search, filters (status, date, wilaya, product), status badges
- [x] Order detail page + edit + manual order creation
- [x] Products management in Settings

## Phase 3 — Confirmation (Day 3)
- [x] "To confirm" queue (NEW, NO_ANSWER, due CALLBACK), oldest first
- [x] One-click outcomes, attempt counter, call log with note
- [x] Call-back scheduling (date/time picker)
- [x] WhatsApp pre-filled link + editable template; `tel:` link
- [x] Fast keyboard/phone-friendly flow (next order after action)

## Phase 4 — Customers & delivery (Day 4)
- [x] Customer list + profile with full history
- [x] Risk badge (returns/cancellations) + manual blacklist, flag on new orders
- [x] Delivery page: mark Shipped / Delivered / Returned, tracking number, bulk actions
- [x] Excel/CSV export of confirmed orders

## Phase 5 — Stats & dashboard home (Day 5)
- [x] Summary cards on home
- [x] Confirmation / delivery / return rates
- [x] Profit calculation + daily ad spend entry
- [x] Charts + date range filter

## Phase 6 — Polish & ship (Days 6–7)
- [x] Empty states, loading states, error messages, toasts
- [x] Mobile check of every page, RTL check
- [x] Settings: store name, delivery fees editor
- [x] Settings: password change
- [x] Deploy demo (Vercel + Neon), demo data
- [x] README (setup for a new client, deploy, reset-password script)
- [x] Screenshots, short demo video

## Phase 7 — Courier API (v2)
- [x] Courier module with one shape for every courier; `COURIER` env picks it (none / demo / yalidine)
- [x] Demo courier (no account) for development and demos
- [x] Yalidine adapter: create parcels, read statuses, stop desks, wilaya/commune name matching
- [x] Delivery page: "Send to courier" bulk action, desk picker, courier status + label, refresh button
- [x] Statuses refresh in the background (max every 10 min); Delivered / Returned closed automatically
- [ ] Live test with a real Yalidine account (first client): run Settings → Courier → Check connection first

## Phase 8 — Ad pixels (v2)
- [x] Meta + TikTok Pixel IDs in Settings (validated, empty = off)
- [x] Order page: PageView, ViewContent, InitiateCheckout (once), Purchase / CompletePayment with total + event id
- [ ] Optional later: server-side Conversions API (needs the seller's access token)

## Phase 9 — Telegram alerts (v2)
- [x] One bot per install (`TELEGRAM_BOT_TOKEN`), seller connects in one click from Settings
- [x] Alert for every form order: customer, phone, product, wilaya, total, duplicate / risk flags, confirm button
- [x] Evening summary at 21:00 (Vercel Cron, `CRON_SECRET`), on/off in Settings; test message button

## Phase 10 — ZR Express courier (v2)
- [x] ZR Express adapter (`COURIER=zrexpress`, API key + tenant id): bulk create, labels, statuses, stop desks
- [x] Stop desk id stored as text (ZR hubs use UUIDs; Yalidine ids still work)
- [ ] Live test with a real ZR Express account: run Settings → Courier → Check connection first

## Selling readiness
- [x] README: ZR Express setup and a handover checklist for each new client
- [x] `npm run db:seed-client`: new client starts with no demo products or orders

## Landing page
- [x] Public `/landing` (no login): hero, order journey, confirm, risk, shipping, profit, phone, FAQ, closing
- [x] App fragments rebuilt with the app components and sample data that adds up; Arabic + French, light + dark
- [x] Order journey switch works by tap or keyboard with no JavaScript; contact button opens WhatsApp (`CONTACT_WHATSAPP`)

## Messenger / WhatsApp orders (no API)
- [x] Settings: copy-ready auto-reply with each active product's order link, plus Messenger/Instagram and WhatsApp Business setup steps

## Phase 11 — Save money (v2)
- [x] "Save the parcel": courier failed attempt → call queue (Will receive / No answer / Refuses), Telegram alert, manual flag without courier API
- [x] Courier cash check: money the courier collected vs. money paid out
- [x] Abandoned orders: keep the phone typed on the order form, call back list
- [x] Reminder on delivery day: one-click WhatsApp message to the customer (Delivery → On the road)
- [x] Wilaya return report: return rate + loss per wilaya, stop-desk-only switch (Stats page; form hides home delivery)
- [x] Cost per delivered order per product (ad spend per product)
- [x] Fake-order signals: form filled too fast, many phones from one device (warnings in confirmation, order page, Telegram)

## Ready for real sellers
- [x] Spam and login limits in the database (hold on Vercel / serverless), cleaned by the daily cron
- [x] Courier check in Settings (read-only): keys, every commune against the courier's list, stop desks
- [x] Communes of the new 2026 wilayas found by name when the courier still files them under the old wilaya
- [x] Optional caller login: calling screens only (to confirm, abandoned, save the parcel, new order)
- [x] Ad spend per product + cost per delivered order per product (Stats)
- [ ] First real seller on a free trial (not code)

## Order tracking (customer)
- [x] Private tracking link per order (`/track/<token>`, random token; no name, phone or address on the page)
- [x] Steps received → confirmed → on the way → delivered, with messages for no answer, call-back, failed delivery, cancelled, returned (Arabic + French)
- [x] `{track}` in WhatsApp messages; the delivery-day reminder sends it
- [ ] Check in the browser: "Track my order" button on the thank-you page, copy-link card on the order page (built and type-checked)

## Later (v2 ideas)
- Messenger bot (Messenger Platform, needs Meta App Review), WhatsApp Business API, stock management.
