/**
 * Demo top-up: adds a fresh, believable batch of demo data dated around today,
 * so the dashboard looks alive for a sales video or a live demo.
 *
 *   npm run db:demo-topup
 *   npm run db:demo-topup -- --days=3   (only the last 3 days of history, plus today)
 *
 * It never deletes or changes existing data: it only adds orders, customers,
 * abandoned orders and ad spend for days that have none yet.
 * It refuses to run on a client database (one without the demo products).
 *
 * What it adds:
 * - the last 13 days: 7–11 orders a day, mostly confirmed and delivered, some returns
 *   (returns are higher in a few southern wilayas, so the wilaya report has something to show)
 * - today: new orders to call (one from a customer who refused a parcel before,
 *   one with fake-order signals), no-answers, call-backs (one due now), confirmed orders to ship
 * - 2 parcels on the road with a failed delivery try ("Save the parcel")
 * - 2 abandoned orders (phone typed, order never sent)
 * - ad spend for the last 14 days
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import type { OrderStatus, CallOutcome, DeliveryType } from "../src/generated/prisma/enums";
import algeria from "../src/data/algeria.json";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL || process.env.DIRECT_URL!, connectionTimeoutMillis: 30_000, keepAlive: true }),
});

type Wilaya = { code: number; nameAr: string; communes: { id: number; nameAr: string }[] };
const WILAYAS = algeria as Wilaya[];

const FIRST = ["محمد", "أمينة", "ياسين", "سارة", "كريم", "نسرين", "عبد القادر", "إيمان", "رياض", "خديجة", "سفيان", "مريم", "هشام", "فاطمة", "بلال", "ليلى", "أنيس", "وليد", "هاجر", "زكرياء"];
const LAST = ["بن علي", "بوزيد", "حمادي", "مرابط", "سعيدي", "بلقاسم", "شريف", "زروقي", "عمراني", "بن يوسف", "قاسمي", "دراجي"];

// Popular wilayas (weighted by repetition). The last ones return more parcels.
const WILAYA_POOL = [16, 16, 16, 31, 31, 25, 9, 9, 19, 6, 15, 35, 13, 2, 26, 5, 30, 47, 39];
const HIGH_RETURN = new Set([30, 47, 39]); // Ouargla, Ghardaïa, El Oued

const MIN = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;

// Deterministic per run start, varied between runs.
let seed = Date.now() % 2147483647;
function rand() {
  seed = (seed * 1103515245 + 12345) % 2147483648;
  return seed / 2147483648;
}
const pick = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
const phone = () => `0${pick(["5", "6", "7"])}${String(Math.floor(rand() * 1e8)).padStart(8, "0")}`;
const name = () => `${pick(FIRST)} ${pick(LAST)}`;

async function main() {
  const products = await db.product.findMany({ where: { slug: { in: ["montre-connectee-sport", "ecouteurs-bluetooth"] } } });
  if (products.length === 0) {
    throw new Error("No demo products here: this looks like a client database. Nothing was added.");
  }
  const catalog = await db.product.findMany({ where: { active: true } });
  const fees = new Map((await db.deliveryFee.findMany()).map((f) => [f.wilayaCode, f]));

  const now = Date.now();
  // Today's orders stay inside today (Algiers time, UTC+1).
  const ALGIERS = HOUR;
  const sinceMidnight = (now + ALGIERS) % DAY;
  const todayAgo = (maxMinutes: number) => Math.max(1, Math.min(maxMinutes * MIN, sinceMidnight - 5 * MIN) * (0.3 + 0.7 * rand()));

  let created = 0;

  type Plan = {
    status: OrderStatus;
    createdAt: Date;
    phone?: string;
    customerName?: string;
    wilayaCode?: number;
    extra?: Record<string, unknown>;
    calls?: { outcome: CallOutcome; at: Date; note?: string }[];
  };

  async function addOrder(p: Plan) {
    const wilayaCode = p.wilayaCode ?? pick(WILAYA_POOL);
    const wilaya = WILAYAS.find((w) => w.code === wilayaCode)!;
    const fee = fees.get(wilaya.code) ?? { homeFee: 700, deskFee: 450, deskOnly: false };
    const commune = pick(wilaya.communes);
    const product = pick(catalog);
    const quantity = rand() < 0.15 ? 2 : 1;
    const deliveryType: DeliveryType = fee.deskOnly || rand() < 0.35 ? "DESK" : "HOME";
    const deliveryFee = deliveryType === "HOME" ? fee.homeFee : fee.deskFee;
    const subtotal = product.price * quantity;
    const tel = p.phone ?? phone();
    const who = p.customerName ?? name();
    const t = p.createdAt.getTime();
    const at = (h: number) => new Date(Math.min(t + h * HOUR, now - MIN));

    const customer = await db.customer.upsert({ where: { phone: tel }, update: {}, create: { phone: tel, name: who } });

    const calls = p.calls ?? [];
    if (!p.calls && ["CONFIRMED", "SHIPPED", "DELIVERED", "RETURNED"].includes(p.status)) {
      if (rand() < 0.35) calls.push({ outcome: "NO_ANSWER", at: at(1) });
      calls.push({ outcome: "CONFIRMED", at: at(2) });
    }
    if (!p.calls && p.status === "CANCELLED") calls.push({ outcome: "CANCELLED", at: at(2), note: pick(["غيّر رأيه", "طلب بالغلط", "لقاه أرخص"]) });

    const shipped = ["SHIPPED", "DELIVERED", "RETURNED"].includes(p.status);
    await db.order.create({
      data: {
        customerId: customer.id,
        customerName: who,
        phone: tel,
        wilayaCode: wilaya.code,
        communeId: commune.id,
        communeName: commune.nameAr,
        address: deliveryType === "HOME" ? pick(["حي 100 مسكن، عمارة 3", "شارع الاستقلال رقم 12", "حي النصر، قرب المسجد"]) : null,
        deliveryType,
        deliveryFee,
        subtotal,
        total: subtotal + deliveryFee,
        status: p.status,
        source: rand() < 0.9 ? "FORM" : "MANUAL",
        attempts: calls.length,
        trackingNumber: shipped ? `ZR-${Math.floor(100000 + rand() * 899999)}` : null,
        courierStatus: p.status === "SHIPPED" ? pick(["Expédié", "Vers Wilaya", "Sorti en livraison"]) : null,
        returnCost: p.status === "RETURNED" ? deliveryFee : 0,
        confirmedAt: ["CONFIRMED", "SHIPPED", "DELIVERED", "RETURNED"].includes(p.status) ? at(2) : null,
        cancelledAt: p.status === "CANCELLED" ? at(2) : null,
        shippedAt: shipped ? at(18) : null,
        deliveredAt: p.status === "DELIVERED" ? at(50) : null,
        returnedAt: p.status === "RETURNED" ? at(70) : null,
        createdAt: p.createdAt,
        ...p.extra,
        items: { create: [{ productId: product.id, productName: product.name, quantity, unitPrice: product.price, unitCost: product.cost }] },
        calls: { create: calls.map((c) => ({ outcome: c.outcome, note: c.note, createdAt: c.at })) },
      },
    });
    created++;
  }

  // 1. The last 13 days
  // `--days=N` fills only the last N days (default 13), e.g. after a run that stopped halfway.
  const daysArg = process.argv.find((a) => a.startsWith("--days="));
  const historyDays = daysArg ? Math.max(0, Math.min(13, Number(daysArg.slice(7)) || 0)) : 13;
  for (let d = historyDays; d >= 1; d--) {
    const perDay = 7 + Math.floor(rand() * 5);
    for (let i = 0; i < perDay; i++) {
      // Between 09:00 and 23:00 (Algiers) on that day.
      const createdAt = new Date(now - sinceMidnight - d * DAY + (9 + rand() * 14) * HOUR);
      const wilayaCode = pick(WILAYA_POOL);
      const r = rand();
      let status: OrderStatus;
      if (r < 0.14) status = "CANCELLED";
      else if (d <= 2) status = d === 1 && r < 0.3 ? "CONFIRMED" : "SHIPPED";
      else if (d === 3) status = r < 0.6 ? "DELIVERED" : "SHIPPED";
      else {
        const returnRate = HIGH_RETURN.has(wilayaCode) ? 0.45 : 0.1;
        status = rand() < returnRate ? "RETURNED" : "DELIVERED";
      }
      await addOrder({ status, createdAt, wilayaCode });
    }
  }

  // 2. Two parcels on the road the courier could not deliver ("Save the parcel")
  for (let i = 0; i < 2; i++) {
    await addOrder({
      status: "SHIPPED",
      createdAt: new Date(now - (3 + i) * DAY),
      extra: {
        courierStatus: "Tentative échouée · client injoignable",
        failedAt: new Date(now - (2 + i * 3) * HOUR),
        rescueOpen: true,
      },
    });
  }

  // 3. Today
  // A customer who refused a parcel last week and orders again today (risk badge).
  const riskyPhone = phone();
  const riskyName = name();
  await addOrder({ status: "RETURNED", createdAt: new Date(now - 8 * DAY), phone: riskyPhone, customerName: riskyName, wilayaCode: 16 });

  const todayPlans: Plan[] = [
    { status: "NEW", createdAt: new Date(now - todayAgo(300)), phone: riskyPhone, customerName: riskyName, wilayaCode: 16 },
    { status: "NEW", createdAt: new Date(now - todayAgo(240)), extra: { fastFill: true, fillSeconds: 4, sharedDevice: true } },
    { status: "NEW", createdAt: new Date(now - todayAgo(200)) },
    { status: "NEW", createdAt: new Date(now - todayAgo(150)) },
    { status: "NEW", createdAt: new Date(now - todayAgo(90)) },
    { status: "NEW", createdAt: new Date(now - todayAgo(40)) },
    { status: "NO_ANSWER", createdAt: new Date(now - todayAgo(420)), calls: [{ outcome: "NO_ANSWER", at: new Date(now - 2 * HOUR) }] },
    { status: "NO_ANSWER", createdAt: new Date(now - todayAgo(360)), calls: [{ outcome: "NO_ANSWER", at: new Date(now - 3 * HOUR) }, { outcome: "NO_ANSWER", at: new Date(now - HOUR) }] },
    { status: "CALLBACK", createdAt: new Date(now - todayAgo(480)), extra: { callbackAt: new Date(now - 10 * MIN) }, calls: [{ outcome: "CALLBACK", at: new Date(now - 4 * HOUR), note: "طلب الاتصال بعد الظهر" }] },
    { status: "CALLBACK", createdAt: new Date(now - todayAgo(300)), extra: { callbackAt: new Date(now + 3 * HOUR) }, calls: [{ outcome: "CALLBACK", at: new Date(now - 2 * HOUR), note: "طلب الاتصال مساءً" }] },
    { status: "CONFIRMED", createdAt: new Date(now - todayAgo(400)) },
    { status: "CONFIRMED", createdAt: new Date(now - todayAgo(350)) },
    { status: "CANCELLED", createdAt: new Date(now - todayAgo(380)) },
  ];
  for (const p of todayPlans) await addOrder(p);

  // 4. Abandoned orders: phone typed on the form, order never sent
  for (let i = 0; i < 2; i++) {
    const at = new Date(now - (1 + i * 2) * HOUR);
    await db.orderDraft.create({
      data: {
        token: `demo-${now}-${i}`,
        productId: pick(catalog).id,
        phone: phone(),
        customerName: name(),
        wilayaCode: pick(WILAYA_POOL),
        createdAt: at,
        updatedAt: at,
      },
    });
  }

  // 5. Ad spend for the last 14 days (days that already have an amount are left as they are)
  let adDays = 0;
  for (let d = 0; d < 14; d++) {
    const date = new Date(now - d * DAY);
    date.setUTCHours(0, 0, 0, 0);
    const r = await db.adSpend.upsert({
      where: { date },
      update: {},
      create: { date, amount: (40 + Math.round(rand() * 25)) * 100 },
    });
    if (r.createdAt.getTime() > now - MIN) adDays++;
  }

  console.log(`✓ Demo top-up: ${created} orders, 2 abandoned orders, ad spend for ${adDays} new days`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
