import type { NextRequest } from "next/server";
import ExcelJS from "exceljs";
import { isOwner } from "@/lib/auth";
import { db } from "@/lib/db";
import { DELIVERY_TABS, type DeliveryTab } from "@/lib/delivery";
import { formatDateTime } from "@/lib/format";
import { getCommune, getWilaya } from "@/lib/algeria";
import { getDictionary, getLocale } from "@/i18n/server";

const COLUMNS = [
  "number",
  "date",
  "name",
  "phone",
  "wilayaCode",
  "wilaya",
  "commune",
  "address",
  "deliveryType",
  "products",
  "quantity",
  "total",
  "note",
  "tracking",
] as const;

function csvCell(v: string | number) {
  const s = String(v);
  return /[",\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** GET /delivery/export?status=CONFIRMED&format=xlsx|csv[&ids=a,b,c] */
export async function GET(request: NextRequest) {
  if (!(await isOwner())) return new Response("Unauthorized", { status: 401 });

  const sp = request.nextUrl.searchParams;
  const status = (DELIVERY_TABS as readonly string[]).includes(sp.get("status") ?? "")
    ? (sp.get("status") as DeliveryTab)
    : "CONFIRMED";
  const format = sp.get("format") === "csv" ? "csv" : "xlsx";
  const ids = (sp.get("ids") ?? "").split(",").filter(Boolean);

  const [t, locale, orders] = await Promise.all([
    getDictionary(),
    getLocale(),
    db.order.findMany({
      where: { status, ...(ids.length > 0 && { id: { in: ids } }) },
      orderBy: { createdAt: "asc" },
      include: { items: { select: { productName: true, quantity: true } } },
    }),
  ]);

  const rows = orders.map((o) => {
    const w = getWilaya(o.wilayaCode);
    const c = getCommune(o.wilayaCode, o.communeId);
    return {
      number: o.number,
      date: formatDateTime(o.createdAt, locale),
      name: o.customerName,
      phone: o.phone,
      wilayaCode: o.wilayaCode,
      wilaya: w ? (locale === "ar" ? w.nameAr : w.nameFr) : "",
      commune: c ? (locale === "ar" ? c.nameAr : c.nameFr) : o.communeName,
      address: o.address ?? "",
      deliveryType: t.deliveryType[o.deliveryType],
      products: o.items.map((i) => (i.quantity > 1 ? `${i.productName} ×${i.quantity}` : i.productName)).join(" + "),
      quantity: o.items.reduce((n, i) => n + i.quantity, 0),
      total: o.total, // amount the courier collects (COD)
      note: o.note ?? "",
      tracking: o.trackingNumber ?? "",
    };
  });

  const stamp = new Date().toISOString().slice(0, 10);
  const filename = `orders-${status.toLowerCase()}-${stamp}.${format}`;
  const headers = COLUMNS.map((k) => t.exportColumns[k]);

  if (format === "csv") {
    const lines = [headers, ...rows.map((r) => COLUMNS.map((k) => r[k]))].map((l) => l.map(csvCell).join(","));
    // BOM so Excel opens Arabic text correctly.
    return new Response("﻿" + lines.join("\r\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  }

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(t.delivery.tabs[status], { views: [{ rightToLeft: locale === "ar", state: "frozen", ySplit: 1 }] });
  ws.columns = COLUMNS.map((k, i) => ({
    header: headers[i],
    key: k,
    width: { name: 22, address: 30, products: 32, note: 30, date: 18, commune: 18, wilaya: 16 }[k as string] ?? 14,
  }));
  ws.getRow(1).font = { bold: true };
  ws.addRows(rows);
  ws.getColumn("phone").numFmt = "@";
  ws.getColumn("total").numFmt = "#,##0";

  const buffer = await wb.xlsx.writeBuffer();
  return new Response(buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
