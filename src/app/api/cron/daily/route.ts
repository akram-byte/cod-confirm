import { NextResponse, type NextRequest } from "next/server";
import { sendDailySummary } from "@/lib/telegram";

// Evening summary on Telegram. Vercel Cron calls this (see vercel.json) with
// "Authorization: Bearer $CRON_SECRET". On a VPS, call it the same way from crontab.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  try {
    const sent = await sendDailySummary(req.nextUrl.origin);
    return NextResponse.json({ ok: true, sent });
  } catch (e) {
    console.error("daily summary failed", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
