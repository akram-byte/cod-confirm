import "server-only";
import { WILAYAS } from "@/lib/algeria";
import { normName, type CourierCheck } from "./types";

/*
 * Finds the courier's own wilaya and commune for one of ours.
 *
 * Our list has 69 wilayas (law of April 2026). A courier may still use the older list,
 * where the communes of a new wilaya sit under the wilaya they came from. So when the
 * commune is not found in the matching wilaya, it is looked up by name in the whole
 * country and used when the name is unique there.
 */

export type CWilaya<Id> = { id: Id; code?: number; name: string };
export type CCommune<Id, WId> = { id: Id; name: string; wilayaId: WId };
export type Resolved<Id, WId> = { wilaya: CWilaya<WId>; commune: CCommune<Id, WId>; moved: boolean };

export function makeMatcher<Id, WId>(load: { wilayas: () => Promise<CWilaya<WId>[]>; communes: () => Promise<CCommune<Id, WId>[]> }) {
  async function wilayaFor(code: number, name: string) {
    const list = await load.wilayas();
    const key = normName(name);
    return (
      list.find((w) => (w.code ?? w.id) === code && normName(w.name) === key) ??
      list.find((w) => normName(w.name) === key) ??
      list.find((w) => (w.code ?? w.id) === code)
    );
  }

  // Communes by normalized name, built once per loaded list.
  const indexes = new WeakMap<object, Map<string, CCommune<Id, WId>[]>>();
  function byName(communes: CCommune<Id, WId>[]) {
    let idx = indexes.get(communes);
    if (!idx) {
      idx = new Map();
      for (const c of communes) {
        const k = normName(c.name);
        idx.set(k, [...(idx.get(k) ?? []), c]);
      }
      indexes.set(communes, idx);
    }
    return idx;
  }

  async function resolve(code: number, wilayaName: string, communeName: string): Promise<Resolved<Id, WId> | null> {
    const [wilayas, communes] = await Promise.all([load.wilayas(), load.communes()]);
    const anywhere = byName(communes).get(normName(communeName)) ?? [];
    const w = await wilayaFor(code, wilayaName);
    const inWilaya = w && anywhere.find((c) => c.wilayaId === w.id);
    if (w && inWilaya) return { wilaya: w, commune: inWilaya, moved: false };
    let pick = anywhere.length === 1 ? anywhere[0] : undefined;
    // Same name in several wilayas: keep the one in the wilaya where this wilaya's other communes are.
    if (!pick && anywhere.length > 1) {
      const near = siblingWilayas(code, communes);
      const inNear = anywhere.filter((c) => near.has(c.wilayaId));
      if (inNear.length === 1) pick = inNear[0];
    }
    const cw = pick && wilayas.find((x) => x.id === pick.wilayaId);
    return pick && cw ? { wilaya: cw, commune: pick, moved: true } : null;
  }

  // Courier wilayas holding communes of our wilaya whose names are unique in the country.
  const siblings = new WeakMap<object, Map<number, Set<WId>>>();
  function siblingWilayas(code: number, communes: CCommune<Id, WId>[]) {
    let byCode = siblings.get(communes);
    if (!byCode) siblings.set(communes, (byCode = new Map()));
    let set = byCode.get(code);
    if (!set) {
      set = new Set();
      const idx = byName(communes);
      for (const c of WILAYAS.find((x) => x.code === code)?.communes ?? []) {
        const hits = idx.get(normName(c.nameFr)) ?? [];
        if (hits.length === 1) set.add(hits[0].wilayaId);
      }
      byCode.set(code, set);
    }
    return set;
  }

  /** The courier wilayas that hold this wilaya's communes (one, or several for a new wilaya). */
  async function wilayasFor(code: number, name: string): Promise<CWilaya<WId>[]> {
    const ours = WILAYAS.find((w) => w.code === code);
    const direct = await wilayaFor(code, name);
    if (direct || !ours) return direct ? [direct] : [];
    const found = new Map<WId, CWilaya<WId>>();
    for (const c of ours.communes) {
      const r = await resolve(code, name, c.nameFr);
      if (r) found.set(r.wilaya.id, r.wilaya);
    }
    return [...found.values()];
  }

  /** Checks every commune of our list against the courier's. Read-only. */
  async function check(desksIn: (w: CWilaya<WId>) => Promise<number>, homeCode: number): Promise<Omit<CourierCheck, "courier">> {
    const out: Omit<CourierCheck, "courier"> = {
      courierWilayas: (await load.wilayas()).length,
      communes: 0,
      matched: 0,
      moved: 0,
      missing: [],
      homeWilaya: "",
      homeDesks: null,
    };
    for (const w of WILAYAS) {
      for (const c of w.communes) {
        out.communes++;
        const r = await resolve(w.code, w.nameFr, c.nameFr);
        if (!r) out.missing.push({ wilaya: `${String(w.code).padStart(2, "0")} ${w.nameFr}`, commune: c.nameFr });
        else {
          out.matched++;
          if (r.moved) out.moved++;
        }
      }
    }
    const home = WILAYAS.find((w) => w.code === homeCode);
    if (home) {
      out.homeWilaya = `${String(home.code).padStart(2, "0")} ${home.nameFr}`;
      const cws = await wilayasFor(home.code, home.nameFr);
      let n = 0;
      for (const cw of cws) n += await desksIn(cw);
      out.homeDesks = cws.length ? n : null;
    }
    return out;
  }

  return { wilayaFor, resolve, wilayasFor, check };
}

/** Wilaya used for the stop desk count in the check: where the seller ships from, else Alger. */
export function homeWilayaCode() {
  const n = Number(process.env.COURIER_FROM_WILAYA);
  return Number.isInteger(n) && n > 0 ? n : 16;
}
