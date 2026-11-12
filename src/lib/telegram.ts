import "server-only";
import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { getWilaya, wilayaLabel } from "@/lib/algeria";
import { formatDZD } from "@/lib/money";
import { startOfDay } from "@/lib/format";
import { todayKey } from "@/lib/stats";
import { risksFor } from "@/lib/customers";
import { ar } from "@/i18n/ar";
import { fr } from "@/i18n/fr";
import { fill, isLocale, type Locale } from "@/i18n/config";

/*
 * Telegram alerts (free, no approval). One bot per install: its token is
 * TELEGRAM_BOT_TOKEN in .env (made once with @BotFather). The seller connects
 * from Settings: a link opens the bot with a one-time code, then "Check"
 * reads the bot's recent messages (getUpdates) to find that code and keeps the chat id.
 */

const API = "https://api.telegram.org";
const dict = (l: string) => (l === "fr" ? fr : ar).telegram;

export function telegramEnabled() {
  return !!process.env.TELEGRAM_BOT_TOKEN;
}

async function call<T>(method: string, body?: object): Promise<T> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not set");
  const res = await fetch(`${API}/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
    signal: AbortSignal.timeout(15_000),
    cache: "no-store",
  });
  const json = (await res.json()) as { ok: boolean; result: T; description?: string };
  if (!json.ok) throw new Error(`Telegram ${method}: ${json.description ?? res.status}`);
  return json.result;
}

let username: Promise<string> | null = null;
function botUsername() {
  username ??= call<{ username: string }>("getMe").then((r) => r.username).catch((e) => {
    username = null;
    throw e;
  });
  return username;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Sends one message. A button is added only for public https links (Telegram refuses localhost). */
async function send(chatId: string, text: string, button?: { text: string; url: string }) {
  const keyboard = button && button.url.startsWith("https://") ? { inline_keyboard: [[button]] } : undefined;
  await call("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    link_preview_options: { is_disabled: true },
    ...(keyboard && { reply_markup: keyboard }),
  });
}

/* ---------- Connecting ---------- */

/** New one-time code + the t.me link that opens the bot with it. */
export async function startConnect(locale: Locale) {
  const code = randomBytes(9).toString("base64url");
  await db.settings.update({ where: { id: 1 }, data: { telegramCode: code, telegramLocale: locale } });
  return { link: `https://t.me/${await botUsername()}?start=${code}`, code };
}

type Update = { update_id: number; message?: { text?: string; chat: { id: number } } };

/**
 * Looks for "/start <code>" in the bot's recent messages. Saves the chat and says hello.
 * "webhook": the bot is already plugged into another service, so its messages can't be read here.
 */
export async function finishConnect(): Promise<"ok" | "notYet" | "webhook"> {
  const s = await db.settings.findUnique({ where: { id: 1 }, select: { telegramCode: true, telegramLocale: true } });
  if (!s?.telegramCode) return "notYet";
  let updates: Update[];
  try {
    updates = await call<Update[]>("getUpdates", { allowed_updates: ["message"], limit: 100 });
  } catch (e) {
    if (e instanceof Error && e.message.includes("webhook is active")) return "webhook";
    throw e;
  }
  // Telegram sometimes drops the start code (some desktop/browser paths): the seller can also send the code itself.
  const ok = (text?: string) => {
    const v = text?.trim();
    return v === `/start ${s.telegramCode}` || v === s.telegramCode;
  };
  const hit = [...updates].reverse().find((u) => ok(u.message?.text));
  if (!hit?.message) return "notYet";
  const chatId = String(hit.message.chat.id);
  await db.settings.update({ where: { id: 1 }, data: { telegramChatId: chatId, telegramCode: "" } });
  // Mark these updates as read so the list stays short.
  await call("getUpdates", { offset: hit.update_id + 1, limit: 1 }).catch(() => {});
  await send(chatId, dict(s.telegramLocale).connected);
  return "ok";
}

export async function disconnect() {
  await db.settings.update({ where: { id: 1 }, data: { telegramChatId: "", telegramCode: "" } });
}

export async function sendTest() {
  const s = await db.settings.findUnique({ where: { id: 1 }, select: { telegramChatId: true, telegramLocale: true } });
  if (!s?.telegramChatId) return false;
  await send(s.telegramChatId, dict(s.telegramLocale).test);
  return true;
}

/* ---------- Alerts ---------- */

/** "🛒 New order #58" with everything needed to call, and a button to the confirmation screen. */
export async function notifyNewOrder(orderId: string, baseUrl: string) {
  if (!telegramEnabled()) return;
  const [s, o] = await Promise.all([
    db.settings.findUnique({ where: { id: 1 }, select: { telegramChatId: true, telegramLocale: true } }),
    db.order.findUnique({ where: { id: orderId }, include: { items: { select: { productName: true, quantity: true } } } }),
  ]);
  if (!s?.telegramChatId || !o) return;
  const locale: Locale = isLocale(s.telegramLocale) ? s.telegramLocale : "ar";
  const t = dict(locale);
  const risk = (await risksFor([o.customerId])).get(o.customerId);
  const w = getWilaya(o.wilayaCode);
  const products = o.items.map((i) => (i.quantity > 1 ? `${i.productName} ×${i.quantity}` : i.productName)).join("، ");

  const lines = [
    `<b>${esc(fill(t.newOrder, { number: o.number }))}</b>`,
    "",
    `👤 ${esc(o.customerName)}`,
    `📞 <code>${o.phone}</code>`,
    `📦 ${esc(products)}`,
    `📍 ${esc(w ? wilayaLabel(w, locale) : String(o.wilayaCode))} · ${esc(o.communeName)} · ${o.deliveryType === "DESK" ? t.desk : t.home}`,
    `💰 <b>${formatDZD(o.total, locale)}</b>`,
  ];
  const flags = [
    o.duplicate && t.duplicate,
    risk === "blacklisted" && t.blacklisted,
    risk === "risky" && t.risky,
  ].filter(Boolean);
  if (flags.length) lines.push("", ...flags.map((f) => `⚠️ ${f}`));

  await send(s.telegramChatId, lines.join("\n"), { text: t.open, url: `${baseUrl}/confirmation?id=${o.id}` });
}

/** Evening summary of today (Algiers time). Returns false when nothing was sent. */
export async function sendDailySummary(baseUrl: string) {
  if (!telegramEnabled()) return false;
  const s = await db.settings.findUnique({ where: { id: 1 }, select: { telegramChatId: true, telegramLocale: true, telegramDaily: true } });
  if (!s?.telegramChatId || !s.telegramDaily) return false;
  const locale: Locale = isLocale(s.telegramLocale) ? s.telegramLocale : "ar";
  const t = dict(locale);
  const since = startOfDay(todayKey())!;
  const now = new Date();
  const [received, confirmed, delivered, returned, toConfirm, deliveredValue] = await Promise.all([
    db.order.count({ where: { createdAt: { gte: since } } }),
    db.order.count({ where: { confirmedAt: { gte: since } } }),
    db.order.count({ where: { deliveredAt: { gte: since } } }),
    db.order.count({ where: { returnedAt: { gte: since } } }),
    db.order.count({ where: { OR: [{ status: { in: ["NEW", "NO_ANSWER"] } }, { status: "CALLBACK", callbackAt: { lte: now } }] } }),
    db.order.aggregate({ where: { deliveredAt: { gte: since }, status: "DELIVERED" }, _sum: { total: true } }),
  ]);
  const text = [
    `<b>${esc(t.summaryTitle)}</b>`,
    "",
    `🛒 ${fill(t.sumReceived, { count: received })}`,
    `✅ ${fill(t.sumConfirmed, { count: confirmed })}`,
    `📦 ${fill(t.sumDelivered, { count: delivered, value: formatDZD(deliveredValue._sum.total ?? 0, locale) })}`,
    `↩️ ${fill(t.sumReturned, { count: returned })}`,
    "",
    toConfirm > 0 ? `📞 <b>${fill(t.sumToConfirm, { count: toConfirm })}</b>` : `🎉 ${t.sumClear}`,
  ].join("\n");
  await send(s.telegramChatId, text, { text: t.openDashboard, url: `${baseUrl}/` });
  return true;
}
