import "server-only";
import { toInternational } from "@/lib/phone";
import { normName, type Courier, type CreateResult, type Desk, type ParcelState } from "./types";
import { homeWilayaCode, makeMatcher } from "./match";

/*
 * ZR Express API (https://api.zrexpress.app, docs at docs.zrexpress.app).
 * Keys from the ZR Express space → API / intégrations: a secret key and a tenant id.
 * If the keys are refused, ZR Express has to switch API access on for the account.
 *
 * Endpoints and field names follow the open-source dz-delivery SDK; check them
 * against a real account before the first live shipment.
 *
 * Wilayas, communes and stop desks (hubs) are identified by ZR's own UUIDs, which
 * we look up by wilaya code and commune name. `amount` is what the courier collects:
 * the order total (products + delivery fee the customer was quoted).
 */

const BASE = "https://api.zrexpress.app/api/v1";
const BULK = 100;
const MAX_PAGES = 20;

type Page<T> = { items?: T[]; hasNext?: boolean };
type Territory = { id: string; code?: number; name: string; parentId: string | null };
type Hub = { id: string; name: string; isPickupPoint?: boolean | null; address?: { street?: string; district?: string; cityTerritoryId?: string } | null };
type ZParcel = { trackingNumber?: string; state?: { name?: string; description?: string } | null; createdAt?: string };
type BulkReport = {
  successes?: { index: number; trackingNumber?: string }[];
  failures?: { index: number; errorCode?: string; errorMessage?: string }[];
};

class ZRError extends Error {
  constructor(
    message: string,
    readonly body: unknown,
  ) {
    super(message);
  }
}

function headers() {
  const key = process.env.ZREXPRESS_API_KEY;
  const tenant = process.env.ZREXPRESS_TENANT_ID;
  if (!key || !tenant) throw new Error("ZREXPRESS_API_KEY / ZREXPRESS_TENANT_ID are not set");
  return { "X-Api-Key": key, "X-Tenant": tenant, "Content-Type": "application/json", Accept: "application/json" };
}

async function call<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: headers(),
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(20_000),
    cache: "no-store",
  });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {}
  if (res.status === 401 || res.status === 403) throw new ZRError("ZR Express: clés API refusées (demandez l'activation de l'API à ZR Express)", json);
  if (res.status === 429) throw new ZRError("ZR Express: trop de requêtes, réessayez dans une minute", json);
  if (!res.ok) {
    const p = json as { detail?: string; title?: string } | null;
    throw new ZRError(`ZR Express HTTP ${res.status}: ${(p?.detail || p?.title || text).slice(0, 200)}`, json);
  }
  return json as T;
}

/** POST …/search endpoints, all pages. */
async function search<T>(path: string, filters: { field: string; operator: string; value: unknown }[], orderBy: string): Promise<T[]> {
  const out: T[] = [];
  for (let pageNumber = 1; pageNumber <= MAX_PAGES; pageNumber++) {
    const r = await call<Page<T>>(path, { pageNumber, pageSize: 1000, orderBy: [orderBy], advancedFilter: { logic: "and", filters } });
    out.push(...(r.items ?? []));
    if (!r.hasNext) break;
  }
  return out;
}

// Reference lists change rarely: keep them for the life of the server process.
// All communes come in one paged search, so matching needs no call per wilaya.
let wilayasCache: Promise<Territory[]> | null = null;
let communesCache: Promise<Territory[]> | null = null;

function zWilayas() {
  wilayasCache ??= search<Territory>("/territories/search", [{ field: "level", operator: "eq", value: "wilaya" }], "code asc").catch((e) => {
    wilayasCache = null;
    throw e;
  });
  return wilayasCache;
}

function zCommunes() {
  communesCache ??= search<Territory>("/territories/search", [{ field: "level", operator: "eq", value: "commune" }], "code asc").catch((e) => {
    communesCache = null;
    throw e;
  });
  return communesCache;
}

const match = makeMatcher<string, string>({
  wilayas: async () => (await zWilayas()).map((w) => ({ id: w.id, code: w.code, name: w.name })),
  // A commune's parent is its wilaya; anything without one is not a commune we can ship to.
  communes: async () => (await zCommunes()).filter((c) => c.parentId).map((c) => ({ id: c.id, name: c.name, wilayaId: c.parentId! })),
});

async function desksIn(wilayaId: string): Promise<Desk[]> {
  const hubs = await search<Hub>(
    "/hubs/search",
    [
      { field: "isPickupPoint", operator: "eq", value: true },
      { field: "address.cityTerritoryId", operator: "eq", value: wilayaId },
    ],
    "name asc",
  );
  return hubs
    .filter((h) => h.isPickupPoint !== false && (!h.address?.cityTerritoryId || h.address.cityTerritoryId === wilayaId))
    .map((h) => ({ id: h.id, name: h.name, address: [h.address?.street, h.address?.district].filter(Boolean).join(", ") }));
}

/** Final outcome from ZR's state name ("Delivered", "livre", "retour_expediteur"…). */
function outcomeOf(stateName: string): ParcelState["outcome"] {
  const key = normName(stateName);
  if (["delivered", "livre", "livree", "encaisse"].includes(key)) return "DELIVERED";
  if (key.startsWith("return") || key.startsWith("retour")) return "RETURNED";
  return null;
}

/** One printable label per parcel; never blocks shipping when it fails. */
async function labels(trackings: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (trackings.length === 0) return out;
  try {
    const r = await call<{ parcelLabelFiles?: { trackingNumber?: string; fileUrl?: string }[] }>("/parcels/labels/individual", { trackingNumbers: trackings });
    for (const f of r.parcelLabelFiles ?? []) if (f.trackingNumber && f.fileUrl) out.set(f.trackingNumber, f.fileUrl);
  } catch (e) {
    console.error("ZR Express labels failed", e);
  }
  return out;
}

export const zrexpressCourier: Courier = {
  name: "zrexpress",
  label: "ZR Express",

  async createParcels(parcels) {
    const results: CreateResult[] = [];
    for (let i = 0; i < parcels.length; i += BULK) {
      const chunk = parcels.slice(i, i + BULK);
      const sendable: typeof chunk = [];
      const body = [];
      for (const p of chunk) {
        const place = await match.resolve(p.wilayaCode, p.wilayaName, p.communeName);
        if (!place) {
          results.push({ orderId: p.orderId, ok: false, message: `Commune inconnue chez ZR Express: ${p.communeName}` });
          continue;
        }
        sendable.push(p);
        body.push({
          customer: { customerId: crypto.randomUUID(), name: `${p.firstname} ${p.familyname}`.trim(), phone: { number1: `+${toInternational(p.phone)}` } },
          deliveryAddress: { street: p.address || p.communeName, cityTerritoryId: place.wilaya.id, districtTerritoryId: place.commune.id },
          orderedProducts: [{ productName: p.products.slice(0, 250), quantity: 1, unitPrice: p.amount, stockType: "none" }],
          description: p.products.slice(0, 100),
          amount: p.amount,
          deliveryType: p.stopDeskId !== null ? "pickup-point" : "home",
          ...(p.stopDeskId !== null && { hubId: p.stopDeskId }),
          externalId: p.orderId,
        });
      }
      if (sendable.length === 0) continue;

      let report: BulkReport;
      try {
        report = await call<BulkReport>("/parcels/bulk", { parcels: body });
      } catch (e) {
        // All refused comes back as HTTP 400 with the same report body.
        const b = e instanceof ZRError ? (e.body as BulkReport | null) : null;
        if (b && Array.isArray(b.failures)) report = b;
        else {
          const message = e instanceof Error ? e.message : "ZR Express error";
          for (const p of sendable) results.push({ orderId: p.orderId, ok: false, message });
          continue;
        }
      }

      const ok = new Map((report.successes ?? []).filter((s) => s.trackingNumber).map((s) => [s.index, s.trackingNumber!]));
      const failed = new Map((report.failures ?? []).map((f) => [f.index, f.errorMessage || f.errorCode || "Refusé par ZR Express"]));
      const files = await labels([...ok.values()]);
      sendable.forEach((p, idx) => {
        const tracking = ok.get(idx);
        results.push(
          tracking
            ? { orderId: p.orderId, ok: true, tracking, labelUrl: files.get(tracking) ?? null }
            : { orderId: p.orderId, ok: false, message: failed.get(idx) ?? "Refusé par ZR Express" },
        );
      });
    }
    return results;
  },

  async getStates(parcels) {
    if (parcels.length === 0) return [];
    const wanted = new Set(parcels.map((p) => p.tracking));
    // Newest first; stop a day before the oldest parcel still on the road.
    const oldest = Math.min(...parcels.map((p) => p.sentAt.getTime())) - 24 * 3600_000;
    const out: ParcelState[] = [];
    for (let pageNumber = 1; pageNumber <= 100 && wanted.size > 0; pageNumber++) {
      const r = await call<Page<ZParcel>>("/parcels/search", { pageNumber, pageSize: 1000, orderBy: ["createdAt desc"] });
      const items = r.items ?? [];
      for (const z of items) {
        if (!z.trackingNumber || !wanted.has(z.trackingNumber)) continue;
        wanted.delete(z.trackingNumber);
        const name = z.state?.name ?? "";
        out.push({ tracking: z.trackingNumber, status: z.state?.description || name, outcome: outcomeOf(name) });
      }
      const last = items.at(-1)?.createdAt;
      if (!r.hasNext || (last && new Date(last).getTime() < oldest)) break;
    }
    return out;
  },

  async getDesks(wilayaCode, wilayaName): Promise<Desk[]> {
    const out: Desk[] = [];
    for (const w of await match.wilayasFor(wilayaCode, wilayaName)) out.push(...(await desksIn(w.id)));
    return out;
  },

  async check() {
    const r = await match.check(async (w) => (await desksIn(w.id)).length, homeWilayaCode());
    return { courier: "ZR Express", ...r };
  },
};
