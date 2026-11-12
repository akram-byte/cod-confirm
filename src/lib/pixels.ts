// Ad pixel IDs (public numbers, not secrets). Shared by the settings form and the order page.

export const FB_PIXEL_RE = /^\d{10,20}$/; // e.g. 123456789012345
export const TIKTOK_PIXEL_RE = /^[A-Z0-9]{10,30}$/; // e.g. CQ1ABC2DEFG3HIJ4KLM5

export function cleanFbPixel(v: string) {
  const s = v.replace(/\s/g, "");
  return FB_PIXEL_RE.test(s) ? s : null;
}

export function cleanTiktokPixel(v: string) {
  const s = v.replace(/\s/g, "").toUpperCase();
  return TIKTOK_PIXEL_RE.test(s) ? s : null;
}
