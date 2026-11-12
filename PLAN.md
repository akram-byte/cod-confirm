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
- [ ] Live test with a real Yalidine account (first client)

## Phase 8 — Ad pixels (v2)
- [x] Meta + TikTok Pixel IDs in Settings (validated, empty = off)
- [x] Order page: PageView, ViewContent, InitiateCheckout (once), Purchase / CompletePayment with total + event id
- [ ] Optional later: server-side Conversions API (needs the seller's access token)

## Phase 9 — Telegram alerts (v2)
- [x] One bot per install (`TELEGRAM_BOT_TOKEN`), seller connects in one click from Settings
- [x] Alert for every form order: customer, phone, product, wilaya, total, duplicate / risk flags, confirm button
- [x] Evening summary at 21:00 (Vercel Cron, `CRON_SECRET`), on/off in Settings; test message button

## Later (v2 ideas)
- ZR Express API, WhatsApp Business API, stock management.
