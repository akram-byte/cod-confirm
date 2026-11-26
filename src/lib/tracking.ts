import type { OrderStatus } from "@/generated/prisma/enums";

// Customer tracking page: /track/<token>. The token is random (see Order.trackToken),
// so the link is the only key: no login, no phone lookup, nothing to guess.

export const TRACK_TOKEN = /^[0-9a-f]{32}$/;

export function trackPath(token: string) {
  return `/track/${token}`;
}

/** Steps the customer sees, in order. */
export const TRACK_STEPS = ["received", "confirmed", "shipped", "delivered"] as const;
export type TrackStep = (typeof TRACK_STEPS)[number];

/** Index of the current step, or null when the order ended without delivery (cancelled / returned). */
export function trackStepIndex(status: OrderStatus): number | null {
  switch (status) {
    case "NEW":
    case "NO_ANSWER":
    case "CALLBACK":
      return 0;
    case "CONFIRMED":
      return 1;
    case "SHIPPED":
      return 2;
    case "DELIVERED":
      return 3;
    default:
      return null;
  }
}
