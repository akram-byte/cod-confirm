// Captures crisp phone-size screenshots of Confirmi for the ad and demo videos.
// Uses the Microsoft Edge already installed on Windows (no browser download).
//
//   1. In the project root: npm run db:demo-topup -- --days=0   (fresh queue: the actions use it up)
//   2. npm run build && npx next start -p 3001                  (production: no dev badge)
//   3. In video/: npm run capture
//
// It signs in with OWNER_PASSWORD from the project's .env, then cancels one order, confirms one
// and sends the confirmed parcels to the courier. Only ever run it against the DEMO database
// with COURIER=demo.
import { chromium } from "playwright-core";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(here, "../public/shots");
const BASE = process.env.CONFIRMI_URL ?? "http://localhost:3001";
const READ_ONLY = process.argv.includes("--read-only");
mkdirSync(OUT, { recursive: true });

const env = readFileSync(resolve(here, "../../.env"), "utf8");
const password = env.match(/^OWNER_PASSWORD="?([^"\r\n]*)"?/m)?.[1];
if (!password) throw new Error("OWNER_PASSWORD missing in .env");
if (!READ_ONLY && env.match(/^COURIER="?([a-z]*)/m)?.[1] !== "demo") {
  throw new Error("COURIER must be 'demo' in .env (the script sends parcels). Use --read-only otherwise.");
}

const browser = await chromium.launch({ channel: "msedge", headless: true });
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 3, // 1170 px wide: stays sharp when zoomed in a 1080 px video
  colorScheme: "dark",
  locale: "ar-DZ",
  isMobile: true,
  hasTouch: true,
});
const page = await ctx.newPage();

const CLEAN = `
  [data-sonner-toaster]{display:none!important}
  ::-webkit-scrollbar{display:none}
  *{caret-color:transparent!important}
`;
const NO_NAV = `nav.fixed.bottom-0{display:none!important}`;

async function settle() {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({ content: CLEAN }).catch(() => {});
  await page.waitForTimeout(500);
}
/** full: whole page without the bottom menu (it's fixed and would land mid-page). */
async function shot(name, { full = false } = {}) {
  await settle();
  const tag = full ? await page.addStyleTag({ content: NO_NAV }) : null;
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: full });
  if (tag) await tag.evaluate((el) => el.remove());
  console.log("✓", name);
}
async function go(path) {
  await page.goto(BASE + path, { waitUntil: "domcontentloaded" });
  await settle();
}
const sleep = (ms) => page.waitForTimeout(ms);

// Element positions in screenshot pixels, so the video can zoom and tap exactly on them.
const boxes = {};
const DPR = 3;
const FULL_SHOTS = new Set(["today", "order-filled", "rescue", "stats", "confirm-queue"]);
async function box(shotName, key, locator) {
  const el = locator.first();
  if (!(await el.count())) return console.log("  (no box)", shotName, key);
  const b = await el.boundingBox();
  // Full-page shots use page coordinates; viewport shots use what is on screen.
  const scrollY = FULL_SHOTS.has(shotName) ? await page.evaluate(() => window.scrollY) : 0;
  boxes[shotName] ??= {};
  boxes[shotName][key] = {
    x: Math.round(b.x * DPR), y: Math.round((b.y + scrollY) * DPR),
    w: Math.round(b.width * DPR), h: Math.round(b.height * DPR),
  };
}
const text = (t) => page.getByText(t, { exact: false });
const card = () => page.locator("main");

// ---------- Sign in
await go("/login");
await page.fill('input[name="password"]', password);
await Promise.all([page.waitForURL((u) => !u.pathname.startsWith("/login")), page.press('input[name="password"]', "Enter")]);

// ---------- Today
await go("/");
await shot("today-top");
await shot("today", { full: true });
await box("today", "toCall", text("طلبيات للاتصال"));
await box("today", "atRisk", text("طرود في خطر"));
await box("today", "profit", text("الربح"));
await box("today", "funnel", text("مسار الطلبات"));
await page.locator("nav.fixed.bottom-0").screenshot({ path: `${OUT}/navbar.png` });
console.log("✓ navbar");

// ---------- Order form (filled, never submitted)
await go("/order/montre-connectee-sport");
await shot("order-empty");
await page.locator("#customerName").fill("أمين بن علي");
await page.locator("#phone").fill("0661234567");
await page.locator("#wilayaCode").selectOption({ index: 16 }); // Alger
await sleep(300);
await page.locator("#communeId").selectOption({ index: 3 });
await sleep(300);
await shot("order-filled", { full: true });
await box("order-filled", "wilaya", page.locator("#wilayaCode"));
await box("order-filled", "commune", page.locator("#communeId"));
await box("order-filled", "fee", text("سعر التوصيل"));
await box("order-filled", "total", text("المجموع"));

// ---------- Other read-only screens
await go("/rescue");
await shot("rescue-top");
await box("rescue-top", "title", text("طرود في خطر"));
await box("rescue-top", "firstCard", page.locator("main .rounded-xl, main [data-slot=card]"));
await box("rescue-top", "deliverBtn", page.getByRole("button", { name: "سيستلم" }));
await shot("rescue", { full: true });
await go("/stats");
await shot("stats", { full: true });

// ---------- Confirmation queue
await go("/confirmation");
await shot("confirm-queue", { full: true });

/** Opens the first queue order whose card shows `tag` (and not `avoid`). */
async function openOrderWith(tag, avoid) {
  const links = page.locator('a[href^="/confirmation?id="]');
  const hrefs = await links.evaluateAll((as) => [...new Set(as.map((a) => a.getAttribute("href")))]);
  for (const href of hrefs) {
    await go(href);
    const head = await page.locator("main").innerText();
    const top = head.split("قائمة الانتظار")[0]; // the open card, not the queue list
    if (top.includes(tag) && !(avoid && top.includes(avoid))) return true;
  }
  return false;
}

if (!READ_ONLY) {
  const outcome = (name) => page.getByRole("button", { name, exact: false }).first();

  // 1. Fake order: filled in seconds, same device as other orders. Cancel it.
  if (!(await openOrderWith("ملء سريع"))) throw new Error("No fast-fill order in the queue: run db:demo-topup first");
  await page.evaluate(() => window.scrollTo(0, 0));
  await shot("confirm-fake");
  await box("confirm-fake", "fast", text("ملء سريع"));
  await box("confirm-fake", "device", text("نفس الجهاز"));
  await box("confirm-fake", "header", page.locator("main h2, main [data-slot=card-title]").first());
  await page.evaluate(() => window.scrollTo(0, 300));
  await shot("confirm-fake-buttons");
  await box("confirm-fake-buttons", "cancel", outcome("إلغاء"));
  await outcome("إلغاء").click();
  await sleep(1500);

  // 2. Risky customer: returned a parcel before.
  if (!(await openOrderWith("زبون مشبوه"))) throw new Error("No risky customer in the queue");
  await page.evaluate(() => window.scrollTo(0, 0));
  await shot("confirm-risky");
  await box("confirm-risky", "risk", text("زبون مشبوه"));

  // 3. A normal new order: call, confirm, the next one slides in.
  if (!(await openOrderWith("جديدة", "زبون مشبوه"))) throw new Error("No normal order in the queue");
  await page.evaluate(() => window.scrollTo(0, 0));
  await shot("confirm-normal");
  await box("confirm-normal", "call", page.locator('a[href^="tel:"]'));
  await box("confirm-normal", "whatsapp", page.locator('a[href*="wa.me"]'));
  await page.evaluate(() => window.scrollTo(0, 300));
  await shot("confirm-normal-buttons");
  await box("confirm-normal-buttons", "confirm", outcome("تأكيد"));
  await outcome("تأكيد").click();
  await sleep(1500);
  await page.evaluate(() => window.scrollTo(0, 0));
  await shot("confirm-next");

  // ---------- Delivery: choose stop desks, select all, send to the (demo) courier
  await go("/delivery");
  for (let i = 0; i < 6; i++) {
    const picker = page.getByRole("button", { name: "اختر مكتب التوصيل" }).first();
    if (!(await picker.count())) break;
    await picker.click();
    const sel = page.locator('select[aria-label="مكتب التوصيل"]').first();
    await sel.waitFor({ timeout: 10000 });
    await sel.selectOption({ index: 1 });
    await sleep(1200);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await shot("delivery-ready");
  await page.getByLabel("تحديد الكل").check();
  await sleep(400);
  await shot("delivery-selected");
  await box("delivery-selected", "send", page.getByRole("button", { name: /إرسال إلى/ }));
  await box("delivery-selected", "selectAll", page.getByLabel(/محددة|تحديد الكل/));
  await page.getByRole("button", { name: /إرسال إلى/ }).click();
  await page.waitForFunction(() => !document.querySelector("svg.animate-spin"), null, { timeout: 30000 }).catch(() => {});
  await sleep(1500);
  await shot("delivery-sent");
  await page.getByRole("tab", { name: /في الطريق/ }).click().catch(() => page.getByText(/في الطريق/).first().click());
  await sleep(1500);
  await shot("delivery-onroad");
  await box("delivery-onroad", "tracking", text("DEMO-"));
}

writeFileSync(`${OUT}/boxes.json`, JSON.stringify(boxes, null, 2));
await browser.close();
console.log("Done →", OUT);
