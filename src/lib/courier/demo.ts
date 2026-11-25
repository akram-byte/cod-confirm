import "server-only";
import { WILAYAS } from "@/lib/algeria";
import type { Courier, ParcelState } from "./types";
import { homeWilayaCode } from "./match";

/*
 * Demo courier: behaves like a real one without any account, for development and
 * for showing the app to prospects. A parcel moves one step per minute and ends
 * "Livré" (4 in 5) or "Retourné au vendeur" (1 in 5). 2 in 5 have a failed try on the way.
 */

const STEPS = ["En préparation", "Expédié", "Vers Wilaya", "Sorti en livraison"];
const STEP_MS = 60_000;
const FAILED_STEPS = 30;

/** FNV-1a: well mixed, so `% 5` gives an even spread. */
function hash(s: string) {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}

export const demoCourier: Courier = {
  name: "demo",
  label: "Démo",

  async createParcels(parcels) {
    return parcels.map((p) => {
      if (p.stopDeskId === null && !p.address.trim()) {
        return { orderId: p.orderId, ok: false, message: "Adresse manquante" };
      }
      const tracking = `DEMO-${Date.now().toString(36).toUpperCase()}${hash(p.orderId) % 1000}`;
      return { orderId: p.orderId, ok: true, tracking, labelUrl: null };
    });
  },

  async getStates(parcels) {
    const now = Date.now();
    return parcels.map(({ tracking, sentAt }): ParcelState => {
      const step = Math.floor((now - sentAt.getTime()) / STEP_MS);
      if (step < STEPS.length) return { tracking, status: STEPS[step], outcome: null };
      // 2 in 5 parcels have a failed try first, kept 30 minutes so "Save the parcel" can be shown.
      if (hash(tracking) % 5 <= 1 && step < STEPS.length + FAILED_STEPS) {
        return { tracking, status: "Tentative échouée · client injoignable", outcome: null };
      }
      return hash(tracking) % 5 === 0
        ? { tracking, status: "Retourné au vendeur", outcome: "RETURNED" }
        : { tracking, status: "Livré", outcome: "DELIVERED" };
    });
  },

  async getDesks(wilayaCode, wilayaName) {
    return [
      { id: String(wilayaCode * 100 + 1), name: `${wilayaName} Centre`, address: "Agence principale" },
      { id: String(wilayaCode * 100 + 2), name: `${wilayaName} Nord`, address: "Point relais" },
    ];
  },

  async check() {
    const communes = WILAYAS.reduce((n, w) => n + w.communes.length, 0);
    const home = WILAYAS.find((w) => w.code === homeWilayaCode());
    return {
      courier: "Démo",
      courierWilayas: WILAYAS.length,
      communes,
      matched: communes,
      moved: 0,
      missing: [],
      homeWilaya: home ? `${String(home.code).padStart(2, "0")} ${home.nameFr}` : "",
      homeDesks: 2,
    };
  },
};
