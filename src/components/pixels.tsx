"use client";

import Script from "next/script";
import { FB_PIXEL_RE, TIKTOK_PIXEL_RE } from "@/lib/pixels";

/*
 * Meta and TikTok pixels for the public order page. Loaded only when the seller
 * saved an ID in Settings. Events:
 *   page open      → PageView + ViewContent
 *   starts the form → InitiateCheckout (once)
 *   order saved    → Purchase (Meta) / CompletePayment (TikTok), with the order total
 * The order id is sent as the event id, ready for server-side dedup later.
 */

type Fbq = (...args: unknown[]) => void;
type Ttq = { track: (event: string, data?: object, opts?: object) => void };
declare global {
  interface Window {
    fbq?: Fbq;
    ttq?: Ttq;
  }
}

export type PixelProduct = { id: string; name: string; price: number };

export function Pixels({ fb, tiktok, product }: { fb: string; tiktok: string; product: PixelProduct }) {
  const fbOk = FB_PIXEL_RE.test(fb);
  const ttOk = TIKTOK_PIXEL_RE.test(tiktok);
  const view = JSON.stringify({
    content_ids: [product.id],
    content_name: product.name,
    content_type: "product",
    value: product.price,
    currency: "DZD",
  });
  const ttView = JSON.stringify({
    content_id: product.id,
    content_name: product.name,
    content_type: "product",
    value: product.price,
    currency: "DZD",
  });
  return (
    <>
      {fbOk && (
        <Script id="fb-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init',${JSON.stringify(fb)});fbq('track','PageView');fbq('track','ViewContent',${view});`}
        </Script>
      )}
      {ttOk && (
        <Script id="tiktok-pixel" strategy="afterInteractive">
          {`!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=d.createElement("script");n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=d.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};ttq.load(${JSON.stringify(tiktok)});ttq.page();ttq.track('ViewContent',${ttView});}(window,document,'ttq');`}
        </Script>
      )}
    </>
  );
}

/** The customer started filling the form. */
export function trackCheckoutStart(product: PixelProduct) {
  window.fbq?.("track", "InitiateCheckout", { content_ids: [product.id], content_type: "product", value: product.price, currency: "DZD" });
  window.ttq?.track("InitiateCheckout", { content_id: product.id, content_type: "product", value: product.price, currency: "DZD" });
}

/** The order was saved. `orderId` doubles as the event id. */
export function trackOrder(product: PixelProduct, order: { id: string; total: number; quantity: number }) {
  window.fbq?.(
    "track",
    "Purchase",
    { content_ids: [product.id], content_name: product.name, content_type: "product", num_items: order.quantity, value: order.total, currency: "DZD" },
    { eventID: order.id },
  );
  window.ttq?.track(
    "CompletePayment",
    { content_id: product.id, content_name: product.name, content_type: "product", quantity: order.quantity, value: order.total, currency: "DZD" },
    { event_id: order.id },
  );
}
