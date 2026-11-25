import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import { getAbandoned } from "@/lib/drafts";
import { countRescue } from "@/lib/rescue";

// The counts the menu, the tabs and the home screen all show.
// cache() runs each once per page load, so the layout and the page share one query.

/** Same rule as the confirmation queue: new, no answer, and callbacks that are due. */
export const countToConfirm = cache(() =>
  db.order.count({
    where: { OR: [{ status: { in: ["NEW", "NO_ANSWER"] } }, { status: "CALLBACK", callbackAt: { lte: new Date() } }] },
  }),
);

export const countAbandoned = cache(async () => (await getAbandoned()).length);

export const countToRescue = cache(() => countRescue());
