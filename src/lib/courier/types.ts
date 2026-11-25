// Shared shape for every courier (Yalidine, ZR Express, the demo courier).

export type CourierName = "yalidine" | "zrexpress" | "demo";

export type ParcelInput = {
  orderId: string; // our order id, sent as the courier's order_id
  firstname: string;
  familyname: string;
  phone: string;
  address: string;
  wilayaCode: number;
  wilayaName: string; // French name
  communeName: string; // French name
  products: string;
  amount: number; // DZD the courier collects from the customer (order total)
  stopDeskId: string | null; // set for DESK delivery
};

export type CreateResult =
  | { orderId: string; ok: true; tracking: string; labelUrl: string | null }
  | { orderId: string; ok: false; message: string };

export type ParcelState = {
  tracking: string;
  status: string; // courier's own text
  outcome: "DELIVERED" | "RETURNED" | null; // final result, when there is one
};

export type Desk = { id: string; name: string; address: string };

/** Result of the read-only connection check (Settings → Courier). Nothing is created at the courier. */
export type CourierCheck = {
  courier: string;
  courierWilayas: number; // wilayas the courier knows
  communes: number; // communes in our list
  matched: number; // found at the courier
  moved: number; // found under another wilaya (new 2026 wilayas the courier has not split yet)
  missing: { wilaya: string; commune: string }[]; // orders there would be refused
  homeWilaya: string; // COURIER_FROM_WILAYA (or Alger)
  homeDesks: number | null; // stop desks the courier lists there (null = wilaya not found)
};

export interface Courier {
  name: CourierName;
  label: string; // shown on buttons: "Yalidine"
  createParcels(parcels: ParcelInput[]): Promise<CreateResult[]>;
  getStates(parcels: { tracking: string; sentAt: Date }[]): Promise<ParcelState[]>;
  getDesks(wilayaCode: number, wilayaName: string): Promise<Desk[]>;
  /** Reads the courier's wilayas, communes and stop desks and compares them with ours. Read-only. */
  check(): Promise<CourierCheck>;
}

/** Lowercase, no accents, letters and digits only: "Bordj El Kiffan" ≈ "bordj-el-kiffan". */
export function normName(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

// Words couriers use when a delivery try did not work ("Tentative échouée", "En alerte",
// "Echec de livraison", "Client injoignable", "Reporté", "Refusé"…), after normName.
const FAILED_WORDS = ["tentative", "echec", "echoue", "alerte", "injoignable", "absent", "reporte", "refus", "failed", "attempt", "unreachable", "postpone"];

/** True when the courier says a delivery try failed and the parcel is not back yet. */
export function isFailedAttempt(status: string, outcome: ParcelState["outcome"]) {
  if (outcome) return false;
  const key = normName(status);
  if (key.includes("resolu") || key.includes("retour") || key.includes("return")) return false;
  return FAILED_WORDS.some((w) => key.includes(w));
}
