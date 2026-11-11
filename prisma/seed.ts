/**
 * Seed: settings (owner password), delivery fees for all 69 wilayas,
 * demo products, and demo customers/orders/calls/ad spend.
 *
 * Safe to run again: settings and the password are only created once,
 * fees and products are upserted, demo orders are only added when the
 * database has no orders yet.
 *
 *   npx prisma db seed
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import type { OrderStatus, CallOutcome, DeliveryType } from "../src/generated/prisma/enums";
import algeria from "../src/data/algeria.json";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL! }),
});

type Wilaya = { code: number; nameAr: string; nameFr: string; communes: { id: number; nameAr: string; nameFr: string }[] };
const WILAYAS = algeria as Wilaya[];

const DEFAULT_WHATSAPP_TEMPLATE =
  "السلام عليكم {name}، معك {store}. نتصل بك لتأكيد طلبك رقم {order}: {product} بمبلغ {total}، التوصيل إلى {wilaya}. هل نؤكد الطلب؟";

// Rough default fees (DZD). The seller edits them in Settings.
const CENTER = [9, 15, 16, 35, 42]; // Blida, Tizi Ouzou, Alger, Boumerdès, Tipaza
const DEEP_SOUTH = [1, 11, 33, 37, 49, 50, 52, 53, 54, 56, 58]; // Adrar, Tamanrasset, Illizi, Tindouf, Timimoun, BBM, Béni Abbès, In Salah, In Guezzam, Djanet, El Meniaa
const SOUTH = [3, 7, 8, 30, 32, 39, 45, 47, 51, 55, 57, 59, 63, 66, 69]; // Laghouat, Biskra, Béchar, Ouargla, El Bayadh, El Oued, Naâma, Ghardaïa, Ouled Djellal, Touggourt, El M'Ghair, Aflou, El Aricha, Messaad, El Abiodh Sidi Cheikh

function defaultFees(code: number) {
  if (code === 16) return { homeFee: 400, deskFee: 250 };
  if (CENTER.includes(code)) return { homeFee: 500, deskFee: 300 };
  if (DEEP_SOUTH.includes(code)) return { homeFee: 1400, deskFee: 900 };
  if (SOUTH.includes(code)) return { homeFee: 900, deskFee: 600 };
  return { homeFee: 700, deskFee: 450 };
}

// Demo products (French, mixed categories). Prices and costs in DZD.
const PRODUCTS = [
  { slug: "montre-connectee-sport", name: "Montre connectée sport", price: 5900, cost: 2800, description: "Écran tactile, suivi cardiaque, notifications, étanche IP67" },
  { slug: "ecouteurs-bluetooth", name: "Écouteurs Bluetooth sans fil", price: 3200, cost: 1300, description: "Autonomie 20 h avec boîtier de charge, réduction de bruit" },
  { slug: "montre-homme-classique", name: "Montre homme classique", price: 3900, cost: 1600, description: "Boîtier acier, bracelet cuir véritable" },
  { slug: "serum-visage-vitamine-c", name: "Sérum visage vitamine C", price: 2400, cost: 700, description: "Éclat et anti-taches, flacon 30 ml" },
  { slug: "huile-argan-bio", name: "Huile d'argan bio", price: 1800, cost: 600, description: "100 % pure, pressée à froid, 100 ml" },
  { slug: "set-casseroles-12-pieces", name: "Set de casseroles 12 pièces", price: 6500, cost: 3200, description: "Revêtement antiadhésif, tous feux dont induction" },
  { slug: "robot-hachoir-electrique", name: "Hachoir électrique multifonction", price: 3500, cost: 1500, description: "Bol 2 L, 4 lames inox, 300 W" },
  { slug: "lampe-led-rechargeable", name: "Lampe LED rechargeable", price: 1500, cost: 500, description: "3 modes d'éclairage, batterie 8 h, câble USB inclus" },
  { slug: "sac-a-dos-antivol", name: "Sac à dos antivol", price: 3600, cost: 1400, description: "Port USB, compartiment ordinateur 15,6\", imperméable" },
  { slug: "baskets-running-homme", name: "Baskets running homme", price: 4800, cost: 2200, description: "Semelle amortissante, tailles 40 à 45" },
  { slug: "aspirateur-voiture-portable", name: "Aspirateur voiture portable", price: 2900, cost: 1100, description: "Sans fil, 120 W, filtre lavable" },
  { slug: "tapis-yoga-antiderapant", name: "Tapis de yoga antidérapant", price: 2200, cost: 800, description: "Épaisseur 6 mm, sangle de transport offerte" },
];

// Slugs of the earlier Arabic demo products: hidden (not deleted) so old orders keep working.
const LEGACY_SLUGS = ["montre-classique", "ensemble-cuisine", "creme-visage"];

const FIRST = ["محمد", "أمينة", "ياسين", "سارة", "كريم", "نسرين", "عبد القادر", "إيمان", "رياض", "خديجة", "سفيان", "مريم", "هشام", "فاطمة", "بلال", "ليلى"];
const LAST = ["بن علي", "بوزيد", "حمادي", "مرابط", "سعيدي", "بلقاسم", "شريف", "زروقي", "عمراني", "بن يوسف"];

// Deterministic pseudo-random so the demo data is the same each time.
let seed = 42;
function rand() {
  seed = (seed * 1103515245 + 12345) % 2147483648;
  return seed / 2147483648;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

async function main() {
  // 1. Settings + owner password (only on first run)
  const existing = await db.settings.findUnique({ where: { id: 1 } });
  if (!existing) {
    const password = process.env.OWNER_PASSWORD;
    if (!password || password.length < 8) {
      throw new Error("Set OWNER_PASSWORD (min 8 characters) in .env before the first seed.");
    }
    await db.settings.create({
      data: {
        id: 1,
        storeName: "متجري",
        passwordHash: await bcrypt.hash(password, 12),
        whatsappTemplate: DEFAULT_WHATSAPP_TEMPLATE,
      },
    });
    console.log("✓ Settings created (owner password set from OWNER_PASSWORD)");
  } else {
    console.log("• Settings already exist — password left unchanged");
  }

  // 2. Delivery fees for all wilayas
  for (const w of WILAYAS) {
    const fees = defaultFees(w.code);
    await db.deliveryFee.upsert({
      where: { wilayaCode: w.code },
      update: {},
      create: { wilayaCode: w.code, ...fees },
    });
  }
  console.log(`✓ Delivery fees for ${WILAYAS.length} wilayas`);

  // 3. Demo products
  const products = [];
  for (const p of PRODUCTS) {
    products.push(await db.product.upsert({ where: { slug: p.slug }, update: {}, create: p }));
  }
  await db.product.updateMany({ where: { slug: { in: LEGACY_SLUGS } }, data: { active: false } });
  console.log(`✓ ${products.length} demo products`);

  // 4. Demo customers + orders (only when empty).
  // `npm run db:reset-demo` first wipes orders (items + calls cascade), customers and ad spend.
  if (process.argv.includes("--reset-demo")) {
    const { count } = await db.order.deleteMany();
    await db.customer.deleteMany();
    await db.adSpend.deleteMany();
    console.log(`✓ Reset: ${count} orders, all customers and ad spend deleted`);
  }
  if ((await db.order.count()) > 0) {
    console.log("• Orders already exist — demo orders skipped");
    return;
  }

  const fees = new Map((await db.deliveryFee.findMany()).map((f) => [f.wilayaCode, f]));
  const statuses: OrderStatus[] = [
    "NEW", "NEW", "NEW", "NEW", "NEW", "NO_ANSWER", "NO_ANSWER", "CALLBACK", "CALLBACK",
    "CONFIRMED", "CONFIRMED", "CONFIRMED", "CANCELLED", "CANCELLED",
    "SHIPPED", "SHIPPED", "SHIPPED", "DELIVERED", "DELIVERED", "DELIVERED", "DELIVERED",
    "DELIVERED", "DELIVERED", "RETURNED", "RETURNED",
  ];
  const popular = [16, 31, 25, 9, 19, 6, 15, 5, 35, 13, 2, 26, 30, 7, 60, 68];
  const now = Date.now();
  const DAY = 86_400_000;

  for (let i = 0; i < statuses.length; i++) {
    const status = statuses[i];
    const wilayaCode = pick(popular);
    const wilaya = WILAYAS.find((w) => w.code === wilayaCode)!;
    const commune = pick(wilaya.communes);
    const product = pick(products);
    const quantity = rand() < 0.2 ? 2 : 1;
    const deliveryType: DeliveryType = rand() < 0.7 ? "HOME" : "DESK";
    const fee = fees.get(wilaya.code)!;
    const deliveryFee = deliveryType === "HOME" ? fee.homeFee : fee.deskFee;
    const subtotal = product.price * quantity;
    const phone = `0${pick(["5", "6", "7"])}${String(Math.floor(rand() * 1e8)).padStart(8, "0")}`;
    const name = `${pick(FIRST)} ${pick(LAST)}`;
    // Newer orders for the confirmation queue, older ones for delivery
    const ageDays = ["NEW", "NO_ANSWER", "CALLBACK"].includes(status) ? rand() * 2 : 2 + rand() * 12;
    const createdAt = new Date(now - ageDays * DAY);
    const at = (h: number) => new Date(createdAt.getTime() + h * 3_600_000);

    const customer = await db.customer.upsert({
      where: { phone },
      update: {},
      create: { phone, name, blacklisted: i === 24, blacklistReason: i === 24 ? "رفض استلام طردين" : null },
    });

    const calls: { outcome: CallOutcome; createdAt: Date; note?: string }[] = [];
    if (status === "NO_ANSWER") calls.push({ outcome: "NO_ANSWER", createdAt: at(1) });
    if (status === "CALLBACK") calls.push({ outcome: "CALLBACK", createdAt: at(1), note: "طلب الاتصال مساءً" });
    if (status === "CANCELLED") calls.push({ outcome: "CANCELLED", createdAt: at(2), note: "غيّر رأيه" });
    if (["CONFIRMED", "SHIPPED", "DELIVERED", "RETURNED"].includes(status)) {
      if (rand() < 0.4) calls.push({ outcome: "NO_ANSWER", createdAt: at(1) });
      calls.push({ outcome: "CONFIRMED", createdAt: at(3) });
    }

    await db.order.create({
      data: {
        customerId: customer.id,
        customerName: name,
        phone,
        wilayaCode: wilaya.code,
        communeId: commune.id,
        communeName: commune.nameAr,
        address: deliveryType === "HOME" ? "حي 100 مسكن، عمارة 3" : null,
        deliveryType,
        deliveryFee,
        subtotal,
        total: subtotal + deliveryFee,
        status,
        source: rand() < 0.85 ? "FORM" : "MANUAL",
        attempts: calls.length,
        callbackAt: status === "CALLBACK" ? new Date(now + (i % 2 === 0 ? -1 : 3) * 3_600_000) : null,
        trackingNumber: ["SHIPPED", "DELIVERED", "RETURNED"].includes(status) ? `YAL-${100000 + i}` : null,
        returnCost: status === "RETURNED" ? deliveryFee : 0,
        createdAt,
        confirmedAt: ["CONFIRMED", "SHIPPED", "DELIVERED", "RETURNED"].includes(status) ? at(3) : null,
        cancelledAt: status === "CANCELLED" ? at(2) : null,
        shippedAt: ["SHIPPED", "DELIVERED", "RETURNED"].includes(status) ? at(20) : null,
        deliveredAt: status === "DELIVERED" ? at(60) : null,
        returnedAt: status === "RETURNED" ? at(72) : null,
        items: {
          create: [{ productId: product.id, productName: product.name, quantity, unitPrice: product.price, unitCost: product.cost }],
        },
        calls: { create: calls },
      },
    });
  }
  console.log(`✓ ${statuses.length} demo orders`);

  // 5. Ad spend for the last 14 days
  for (let d = 0; d < 14; d++) {
    const date = new Date(now - d * DAY);
    date.setUTCHours(0, 0, 0, 0);
    await db.adSpend.upsert({
      where: { date },
      update: {},
      create: { date, amount: 1500 + Math.round(rand() * 20) * 100 },
    });
  }
  console.log("✓ 14 days of ad spend");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
