"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOwner } from "@/lib/auth";
import { db } from "@/lib/db";

export type ProductErrors = Partial<Record<"name" | "slug" | "price" | "cost", "name" | "slug" | "slugTaken" | "price" | "cost">>;
export type SaveProductState = { ok: true } | { ok: false; errors?: ProductErrors; error?: "unknown" };

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const money = (key: "price" | "cost") => z.coerce.number({ message: key }).int(key).min(0, key).max(10_000_000, key);

const schema = z.object({
  name: z.string().trim().min(2, "name").max(100, "name"),
  slug: z.string().trim().toLowerCase().max(60, "slug"),
  price: money("price").refine((n) => n > 0, "price"),
  cost: money("cost"),
  description: z.string().trim().max(300).optional().default(""),
  active: z.boolean(),
});

function slugify(name: string) {
  const s = name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
  // Arabic-only names give nothing usable: use a short random slug.
  return s.length >= 3 ? s : `p-${randomBytes(3).toString("hex")}`;
}

export async function saveProduct(id: string | null, formData: FormData): Promise<SaveProductState> {
  await requireOwner();
  const parsed = schema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug") ?? "",
    price: formData.get("price"),
    cost: formData.get("cost") || 0,
    description: formData.get("description") ?? "",
    active: formData.get("active") === "on",
  });
  if (!parsed.success) {
    const errors: ProductErrors = {};
    for (const i of parsed.error.issues) {
      const k = i.path[0] as keyof ProductErrors;
      if (k && !errors[k]) errors[k] = k;
    }
    return { ok: false, errors };
  }
  const data = { ...parsed.data, description: parsed.data.description || null };
  if (!data.slug) data.slug = slugify(data.name);
  if (!SLUG_RE.test(data.slug)) return { ok: false, errors: { slug: "slug" } };

  try {
    const taken = await db.product.findFirst({ where: { slug: data.slug, NOT: id ? { id } : undefined }, select: { id: true } });
    if (taken) return { ok: false, errors: { slug: "slugTaken" } };
    if (id) await db.product.update({ where: { id }, data });
    else await db.product.create({ data });
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    console.error("save product failed", e);
    return { ok: false, error: "unknown" };
  }
}

export async function setProductActive(id: string, active: boolean) {
  await requireOwner();
  try {
    await db.product.update({ where: { id }, data: { active } });
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    console.error("toggle product failed", e);
    return { ok: false };
  }
}

/** Only products without orders can be deleted (order history must stay intact). */
export async function deleteProduct(id: string): Promise<{ ok: boolean; error?: "hasOrders" | "unknown" }> {
  await requireOwner();
  try {
    if ((await db.orderItem.count({ where: { productId: id } })) > 0) return { ok: false, error: "hasOrders" };
    await db.product.delete({ where: { id } });
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    console.error("delete product failed", e);
    return { ok: false, error: "unknown" };
  }
}
