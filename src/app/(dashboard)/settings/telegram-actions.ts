"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOwner } from "@/lib/auth";
import { db } from "@/lib/db";
import { getLocale } from "@/i18n/server";
import { disconnect, finishConnect, sendTest, startConnect } from "@/lib/telegram";

async function run<T>(name: string, fn: () => Promise<T>) {
  await requireOwner();
  try {
    return { ok: true as const, value: await fn() };
  } catch (e) {
    console.error(`telegram ${name} failed`, e);
    return { ok: false as const };
  }
}

/** Link that opens the bot with a one-time code (alerts will use the current language). */
export async function telegramConnectLink() {
  return run("connect", async () => startConnect(await getLocale()));
}

/** "ok" once the seller pressed Start in Telegram. */
export async function telegramCheck() {
  return run("check", async () => {
    const result = await finishConnect();
    if (result === "ok") revalidatePath("/settings");
    return result;
  });
}

export async function telegramTest() {
  return run("test", sendTest);
}

export async function telegramDisconnect() {
  return run("disconnect", async () => {
    await disconnect();
    revalidatePath("/settings");
  });
}

export async function telegramSetDaily(on: boolean) {
  return run("daily", async () => {
    await db.settings.update({ where: { id: 1 }, data: { telegramDaily: z.boolean().parse(on) } });
  });
}
