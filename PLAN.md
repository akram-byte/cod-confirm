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
- [ ] Public order form `/order/[slug]` (wilaya → commune, delivery type, auto fee, total)
- [ ] Phone validation, honeypot + rate limit, duplicate detection
- [ ] Orders table: search, filters (status, date, wilaya, product), status badges
- [ ] Order detail page + edit + manual order creation
- [ ] Products management in Settings

## Phase 3 — Confirmation (Day 3)
- [ ] "To confirm" queue (NEW, NO_ANSWER, due CALLBACK), oldest first
- [ ] One-click outcomes, attempt counter, call log with note
- [ ] Call-back scheduling (date/time picker)
- [ ] WhatsApp pre-filled link + editable template; `tel:` link
- [ ] Fast keyboard/phone-friendly flow (next order after action)

## Phase 4 — Customers & delivery (Day 4)
- [ ] Customer list + profile with full history
- [ ] Risk badge (returns/cancellations) + manual blacklist, flag on new orders
- [ ] Delivery page: mark Shipped / Delivered / Returned, tracking number, bulk actions
- [ ] Excel/CSV export of confirmed orders

## Phase 5 — Stats & dashboard home (Day 5)
- [ ] Summary cards on home
- [ ] Confirmation / delivery / return rates
- [ ] Profit calculation + daily ad spend entry
- [ ] Charts + date range filter

## Phase 6 — Polish & ship (Days 6–7)
- [ ] Empty states, loading states, error messages, toasts
- [ ] Mobile check of every page, RTL check
- [ ] Settings: store name, delivery fees editor, password change
- [ ] Deploy demo (Vercel + Neon), demo data
- [ ] README (setup for a new client), screenshots, short demo video

## Later (v2 ideas)
- Yalidine / ZR Express API, WhatsApp Business API, stock management.
