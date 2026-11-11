// Shared shape for every courier (Yalidine, the demo courier, later ZR Express…).

export type CourierName = "yalidine" | "demo";

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
  stopDeskId: number | null; // set for DESK delivery
};

export type CreateResult =
  | { orderId: string; ok: true; tracking: string; labelUrl: string | null }
  | { orderId: string; ok: false; message: string };

export type ParcelState = {
  tracking: string;
  status: string; // courier's own text
  outcome: "DELIVERED" | "RETURNED" | null; // final result, when there is one
};

export type Desk = { id: number; name: string; address: string };

export interface Courier {
  name: CourierName;
  label: string; // shown on buttons: "Yalidine"
  createParcels(parcels: ParcelInput[]): Promise<CreateResult[]>;
  getStates(parcels: { tracking: string; sentAt: Date }[]): Promise<ParcelState[]>;
  getDesks(wilayaCode: number, wilayaName: string): Promise<Desk[]>;
}

/** Lowercase, no accents, letters and digits only: "Bordj El Kiffan" ≈ "bordj-el-kiffan". */
export function normName(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}
