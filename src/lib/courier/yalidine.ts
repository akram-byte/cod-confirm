import "server-only";
import { getWilaya } from "@/lib/algeria";
import { normName, type Courier, type CreateResult, type Desk, type ParcelState } from "./types";

/*
 * Yalidine API v1 (https://api.yalidine.app/v1), keys from yalidine.app → Développement.
 * Field names follow the official API as used by the community SDKs; check them
 * against a real account before the first live shipment.
 *
 * Money: `price` is what the courier collects. We send the order total (product +
 * delivery fee the customer was quoted) with `freeshipping: true`, so the courier
 * collects exactly that amount and takes its fee out of the seller's payout.
 */

const BASE = "https://api.yalidine.app/v1";
const CHUNK = 50;

type Page<T> = { has_more: boolean; data: T[] };
type YWilaya = { id: number; name: string };
type YCommune = { id: number; name: string; wilaya_id: number };
type YCenter = { center_id: number; name: string; address: string; wilaya_id: number };
type YCreate = Record<string, { success: boolean; order_id: string; tracking: string | null; label: string | null; message?: string }>;
type YParcel = { tracking: string; last_status: string };

function headers() {
  const id = process.env.YALIDINE_API_ID;
  const token = process.env.YALIDINE_API_TOKEN;
  if (!id || !token) throw new Error("YALIDINE_API_ID / YALIDINE_API_TOKEN are not set");
  return { "X-API-ID": id, "X-API-TOKEN": token, "Content-Type": "application/json" };
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { ...init, headers: headers(), signal: AbortSignal.timeout(20_000), cache: "no-store" });
  if (res.status === 429) throw new Error("Yalidine: trop de requêtes, réessayez dans une minute");
  if (!res.ok) throw new Error(`Yalidine HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json() as Promise<T>;
}

async function all<T>(path: string, params: Record<string, string | number>): Promise<T[]> {
  const out: T[] = [];
  for (let page = 1; page <= 20; page++) {
    const q = new URLSearchParams({ ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])), page: String(page), page_size: "1000" });
    const r = await call<Page<T>>(`${path}?${q}`);
    out.push(...r.data);
    if (!r.has_more) break;
  }
  return out;
}

// Reference lists change rarely: keep them for the life of the server process.
let wilayasCache: Promise<YWilaya[]> | null = null;
const communesCache = new Map<number, Promise<YCommune[]>>();

function yWilayas() {
  wilayasCache ??= all<YWilaya>("/wilayas/", {}).catch((e) => {
    wilayasCache = null;
    throw e;
  });
  return wilayasCache;
}

function yCommunes(wilayaId: number) {
  let p = communesCache.get(wilayaId);
  if (!p) {
    p = all<YCommune>("/communes/", { wilaya_id: wilayaId }).catch((e) => {
      communesCache.delete(wilayaId);
      throw e;
    });
    communesCache.set(wilayaId, p);
  }
  return p;
}

/** Yalidine's wilaya for one of ours: same code first, then same name. */
async function matchWilaya(code: number, name: string) {
  const list = await yWilayas();
  return list.find((w) => w.id === code && normName(w.name) === normName(name)) ?? list.find((w) => normName(w.name) === normName(name)) ?? list.find((w) => w.id === code);
}

const DELIVERED = new Set(["livre"]);
const RETURNED = new Set(["retourneauvendeur"]);

export const yalidineCourier: Courier = {
  name: "yalidine",
  label: "Yalidine",

  async createParcels(parcels) {
    const fromCode = Number(process.env.COURIER_FROM_WILAYA);
    const from = getWilaya(fromCode);
    if (!from) throw new Error("COURIER_FROM_WILAYA is not set to a wilaya code");
    const fromY = await matchWilaya(from.code, from.nameFr);

    const results: CreateResult[] = [];
    for (let i = 0; i < parcels.length; i += CHUNK) {
      const chunk = parcels.slice(i, i + CHUNK);
      const body = [];
      for (const p of chunk) {
        const w = await matchWilaya(p.wilayaCode, p.wilayaName);
        const communes = w ? await yCommunes(w.id) : [];
        const commune = communes.find((c) => normName(c.name) === normName(p.communeName));
        body.push({
          order_id: p.orderId,
          from_wilaya_name: fromY?.name ?? from.nameFr,
          firstname: p.firstname,
          familyname: p.familyname,
          contact_phone: p.phone,
          address: p.address || p.communeName,
          to_commune_name: commune?.name ?? p.communeName,
          to_wilaya_name: w?.name ?? p.wilayaName,
          product_list: p.products,
          price: p.amount,
          do_insurance: false,
          declared_value: p.amount,
          length: 10,
          width: 10,
          height: 10,
          weight: 1,
          freeshipping: true,
          is_stopdesk: p.stopDeskId !== null,
          ...(p.stopDeskId !== null && { stopdesk_id: p.stopDeskId }),
          has_exchange: false,
        });
      }
      try {
        const res = await call<YCreate>("/parcels/", { method: "POST", body: JSON.stringify(body) });
        for (const p of chunk) {
          const r = res[p.orderId];
          results.push(
            r?.success && r.tracking
              ? { orderId: p.orderId, ok: true, tracking: r.tracking, labelUrl: r.label ?? null }
              : { orderId: p.orderId, ok: false, message: r?.message || "Refusé par Yalidine" },
          );
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : "Yalidine error";
        for (const p of chunk) results.push({ orderId: p.orderId, ok: false, message });
      }
    }
    return results;
  },

  async getStates(parcels) {
    const out: ParcelState[] = [];
    for (let i = 0; i < parcels.length; i += CHUNK) {
      const trackings = parcels.slice(i, i + CHUNK).map((p) => p.tracking);
      const rows = await all<YParcel>("/parcels/", { tracking: trackings.join(","), fields: "tracking,last_status" });
      for (const r of rows) {
        const key = normName(r.last_status ?? "");
        out.push({
          tracking: r.tracking,
          status: r.last_status,
          outcome: DELIVERED.has(key) ? "DELIVERED" : RETURNED.has(key) ? "RETURNED" : null,
        });
      }
    }
    return out;
  },

  async getDesks(wilayaCode, wilayaName): Promise<Desk[]> {
    const w = await matchWilaya(wilayaCode, wilayaName);
    if (!w) return [];
    const centers = await all<YCenter>("/centers/", { wilaya_id: w.id });
    return centers.map((c) => ({ id: c.center_id, name: c.name, address: c.address }));
  },
};
