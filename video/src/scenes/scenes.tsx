import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT, FONT_AR } from "../theme";
import { Phone } from "../components/Phone";
import { Callout, Highlight, Tap, union, type Box } from "../components/Overlays";
import { Caption, Kicker } from "../components/Caption";
import { IconBag, IconMessage, IconPhoneMissed, IconReturn, IconX } from "../components/Icons";
import boxesJson from "../../public/shots/boxes.json";

const B = boxesJson as unknown as Record<string, Record<string, Box>>;
export type SceneProps = { dur: number };
/** Frame at a share of the scene: at(dur, 0.4) = 40% in. */
const at = (dur: number, p: number) => Math.round(dur * p);

// ───────────────────────────────── Ad: hook
export const Hook: React.FC<SceneProps> = ({ dur }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const split = at(dur, 0.5);
  const n = Math.round(interpolate(f, [4, split - 8], [0, 30], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: (t) => 1 - Math.pow(1 - t, 3) }));
  const goUp = spring({ frame: f - split, fps, config: { damping: 18 } });
  const chips = Array.from({ length: 14 }, (_, i) => i);
  return (
    <AbsoluteFill>
      {/* new orders raining in behind the number */}
      {chips.map((i) => {
        const start = 2 + i * 2.6;
        const t = f - start;
        if (t < 0) return null;
        const x = ((i * 397) % 760) + 160;
        const yy = interpolate(t, [0, 40], [-120, 640 + ((i * 131) % 700)], { extrapolateRight: "clamp", easing: (q) => 1 - Math.pow(1 - q, 2) });
        const o = interpolate(t, [0, 6, 50, 70], [0, 0.55, 0.4, 0.18], { extrapolateRight: "clamp" }) * (1 - goUp * 0.8);
        return (
          <div key={i} style={{
            position: "absolute", left: x - 170, top: yy, width: 340, padding: "18px 22px", borderRadius: 22, direction: "rtl",
            background: C.card, border: `2px solid ${C.line}`, color: C.text, fontFamily: FONT_AR, fontSize: 30, opacity: o,
            display: "flex", alignItems: "center", gap: 14, transform: `rotate(${((i % 5) - 2) * 2}deg)`,
          }}>
            <span style={{ width: 14, height: 14, borderRadius: 99, background: C.green }} />
            طلبية جديدة #{170 + i}
          </div>
        );
      })}
      <div style={{
        position: "absolute", top: 640, width: 1080, textAlign: "center",
        transform: `translateY(${-goUp * 260}px) scale(${1 - goUp * 0.45})`, opacity: 1 - goUp * 0.25,
      }}>
        <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 420, lineHeight: 1, color: C.green, textShadow: `0 0 120px ${C.green}66` }}>{n}</div>
        <div style={{ fontFamily: FONT_AR, fontWeight: 700, fontSize: 78, color: C.text, direction: "rtl", marginTop: 10 }}>commande فالنهار</div>
      </div>
      <Caption text="شحال منهم يوليو|*دراهم* فيدك؟" at={split + 4} y={1160} size={110} />
    </AbsoluteFill>
  );
};

// ───────────────────────────────── Ad: the pain
const PainCard: React.FC<{ icon: React.ReactNode; text: string; color: string; at: number; y: number }> = ({ icon, text, color, at: a, y }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - a, fps, config: { damping: 14 } });
  return (
    <div style={{
      position: "absolute", top: y, left: 110, width: 860, height: 190, borderRadius: 40, direction: "rtl",
      background: `linear-gradient(90deg, ${color}1f, ${C.card})`, border: `2px solid ${color}55`,
      display: "flex", alignItems: "center", gap: 40, padding: "0 50px", boxSizing: "border-box",
      transform: `translateX(${interpolate(s, [0, 1], [700, 0])}px) rotate(${interpolate(s, [0, 1], [6, 0])}deg)`, opacity: s,
      boxShadow: "0 30px 60px rgba(0,0,0,0.45)",
    }}>
      <div style={{ width: 110, height: 110, borderRadius: 32, background: `${color}26`, display: "grid", placeItems: "center", flexShrink: 0 }}>{icon}</div>
      <div style={{ fontFamily: FONT_AR, fontWeight: 700, fontSize: 66, color: C.text }}>{text}</div>
    </div>
  );
};

export const Pain: React.FC<SceneProps> = ({ dur }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const last = at(dur, 0.66);
  const s = spring({ frame: f - last, fps, config: { damping: 12 } });
  return (
    <AbsoluteFill>
      <Caption text="وين راهي تروح *دراهمك*؟" at={0} y={300} size={92} />
      <PainCard icon={<IconX size={64} color={C.red} />} text="Commandes fake" color={C.red} at={at(dur, 0.04)} y={600} />
      <PainCard icon={<IconPhoneMissed size={64} color={C.amber} />} text="الزبون ما يردش" color={C.amber} at={at(dur, 0.22)} y={830} />
      <PainCard icon={<IconReturn size={64} color={C.red} />} text="الطرد يرجعلك" color={C.red} at={at(dur, 0.42)} y={1060} />
      <div style={{
        position: "absolute", top: 1360, width: 1080, textAlign: "center", direction: "rtl", fontFamily: FONT_AR,
        opacity: s, transform: `scale(${interpolate(s, [0, 1], [1.4, 1])})`,
      }}>
        <div style={{ fontSize: 56, color: C.muted, fontWeight: 600 }}>التوصيل + الإشهار</div>
        <div style={{ fontSize: 150, color: C.red, fontWeight: 700, lineHeight: 1.1, textShadow: `0 0 80px ${C.red}66` }}>خسارة</div>
      </div>
    </AbsoluteFill>
  );
};

// ───────────────────────────────── App: fake order
export const Fake: React.FC<SceneProps & { caption?: string }> = ({ dur, caption = "تعمّرت في *4* ثواني…|~fake~" }) => {
  const fb = B["confirm-fake"];
  const tags = union(fb.fast, fb.device);
  const sw = at(dur, 0.66);
  return (
    <AbsoluteFill>
      <Kicker text="طلبية مشبوهة" color={C.red} at={0} y={120} />
      <Caption text={caption} at={2} y={210} size={88} />
      <Phone
        screens={[{ src: "confirm-fake", from: 0 }, { src: "confirm-fake-buttons", from: sw, enter: "fade" }]}
        cams={[{ f: 0, s: 1 }]}
        enterAt={0}
      >
        <Highlight box={fb.fast} at={at(dur, 0.14)} until={sw - 6} color={C.amber} pad={10} />
        <Highlight box={fb.device} at={at(dur, 0.18)} until={sw - 6} color={C.amber} pad={10} />
        <Highlight box={B["confirm-fake-buttons"].cancel} at={sw + 8} color={C.red} pad={8} />
        <Tap box={B["confirm-fake-buttons"].cancel} at={at(dur, 0.82)} />
      </Phone>
      <Callout src="confirm-fake" box={tags} at={at(dur, 0.28)} until={sw - 4} zoom={1.65} y={1330} color={C.amber} label="ماشي زبون حقيقي" pad={20} />
    </AbsoluteFill>
  );
};

// ───────────────────────────────── App: risky customer
export const Risky: React.FC<SceneProps & { caption?: string }> = ({ dur, caption = "هذا الزبون|*رجّع طرد* من قبل" }) => {
  const rb = B["confirm-risky"];
  const head: Box = { x: 60, y: rb.risk.y - 110, w: 1050, h: 200 };
  return (
    <AbsoluteFill>
      <Kicker text="زبون مشبوه" color={C.amber} at={0} y={120} />
      <Caption text={caption} at={2} y={210} size={88} />
      <Phone screens={[{ src: "confirm-risky", from: 0 }]}>
        <Highlight box={rb.risk} at={at(dur, 0.12)} color={C.amber} pad={10} />
      </Phone>
      <Callout src="confirm-risky" box={head} at={at(dur, 0.3)} zoom={1.5} y={1360} color={C.amber} label="تعرف قبل ما تبعث" />
    </AbsoluteFill>
  );
};

// ───────────────────────────────── App: confirm fast
export const Speed: React.FC<SceneProps> = ({ dur }) => {
  const nb = B["confirm-normal"];
  const cb = B["confirm-normal-buttons"];
  const toButtons = at(dur, 0.36);
  const tapConfirm = at(dur, 0.5);
  const next = at(dur, 0.58);
  return (
    <AbsoluteFill>
      <Caption text="تعيطل *بكليك*" at={0} until={toButtons} y={220} size={96} />
      <Caption text="تأكّد *بكليك*" at={toButtons + 7} until={next} y={220} size={96} />
      <Caption text="والتالية تجي *وحدها*" at={next + 7} y={220} size={96} />
      <Phone
        screens={[
          { src: "confirm-normal", from: 0 },
          { src: "confirm-normal-buttons", from: toButtons, enter: "fade" },
          { src: "confirm-next", from: next, enter: "slide" },
        ]}
      >
        <Highlight box={nb.call} at={at(dur, 0.06)} until={toButtons - 4} pad={8} />
        <Tap box={nb.call} at={at(dur, 0.2)} />
        <Highlight box={cb.confirm} at={toButtons + 4} until={next - 2} pad={8} />
        <Tap box={cb.confirm} at={tapConfirm} />
      </Phone>
    </AbsoluteFill>
  );
};

// ───────────────────────────────── App: real profit
export const Profit: React.FC<SceneProps & { caption?: string }> = ({ dur, caption = "*الربح* الحقيقي|ماشي غير عدد الطلبيات" }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = B.today.profit;
  const card: Box = { x: 60, y: p.y - 40, w: 1050, h: 210 };
  const minus = ["الإشهار", "التوصيل", "الطرود اللي رجعو"];
  return (
    <AbsoluteFill>
      <Caption text={caption} at={0} y={200} size={88} />
      <Phone screens={[{ src: "today", from: 0 }]} cams={[{ f: 0, cy: 1266 }, { f: at(dur, 0.25), cy: p.y + 200 }]}>
        <Highlight box={card} at={at(dur, 0.28)} pad={4} />
      </Phone>
      <Callout src="today" box={card} at={at(dur, 0.36)} zoom={1.55} y={1180} label="من بعد كلش" />
      <div style={{ position: "absolute", top: 1430, width: 1080, display: "flex", justifyContent: "center", gap: 18, direction: "rtl" }}>
        {minus.map((m, i) => {
          const s = spring({ frame: f - at(dur, 0.5) - i * 6, fps, config: { damping: 14 } });
          return (
            <div key={m} style={{
              fontFamily: FONT_AR, fontSize: 38, fontWeight: 600, color: C.text, padding: "14px 26px", borderRadius: 99,
              background: "rgba(10,16,13,0.92)", border: `2px solid ${C.red}66`, opacity: s, transform: `translateY(${(1 - s) * 30}px)`,
            }}>
              <span style={{ color: C.red }}>−</span> {m}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ───────────────────────────────── Closing offer
export const Offer: React.FC<SceneProps> = ({ dur }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logo = spring({ frame: f, fps, config: { damping: 12 } });
  const big = spring({ frame: f - at(dur, 0.15), fps, config: { damping: 13 } });
  const btn = spring({ frame: f - at(dur, 0.42), fps, config: { damping: 12 } });
  const pulse = 1 + Math.max(0, Math.sin((f - at(dur, 0.5)) / 6)) * 0.04 * (f > at(dur, 0.5) ? 1 : 0);
  return (
    <AbsoluteFill style={{ alignItems: "center" }}>
      <div style={{ position: "absolute", top: 330, display: "flex", flexDirection: "column", alignItems: "center", gap: 40, opacity: logo, transform: `scale(${interpolate(logo, [0, 1], [0.7, 1])})` }}>
        <Img src={staticFile("brand/confirmi-icon.svg")} style={{ width: 210, height: 210, filter: `drop-shadow(0 0 60px ${C.green}77)` }} />
        <Img src={staticFile("brand/confirmi-wordmark-dark.svg")} style={{ width: 560 }} />
      </div>
      <div style={{ position: "absolute", top: 860, width: 1080, textAlign: "center", direction: "rtl", fontFamily: FONT_AR, opacity: big, transform: `translateY(${(1 - big) * 60}px)` }}>
        <div style={{ fontSize: 150, fontWeight: 700, color: C.text, lineHeight: 1.1 }}>
          7 أيام <span style={{ color: C.green }}>بلاش</span>
        </div>
        <div style={{ fontSize: 54, fontWeight: 500, color: C.muted, marginTop: 20 }}>ونديرلك كلش أنا</div>
      </div>
      <div style={{
        position: "absolute", top: 1330, direction: "rtl", fontFamily: FONT_AR, display: "flex", alignItems: "center", gap: 24,
        padding: "34px 60px", borderRadius: 99, background: C.green, color: "#04130c", fontSize: 58, fontWeight: 700,
        boxShadow: `0 30px 80px ${C.green}66`, opacity: btn, transform: `scale(${interpolate(btn, [0, 1], [0.6, 1]) * pulse})`,
      }}>
        <IconMessage size={60} color="#04130c" />
        ابعثلي: «نحب نجرب»
      </div>
      <div style={{ position: "absolute", top: 1580, fontFamily: FONT_AR, fontSize: 38, color: C.muted, direction: "rtl", opacity: btn }}>
        للي يبيع بالدفع عند الاستلام فالدزاير
      </div>
    </AbsoluteFill>
  );
};

// ───────────────────────────────── Demo-only scenes
export const TodayIntro: React.FC<SceneProps> = ({ dur }) => {
  const t = B.today;
  return (
    <AbsoluteFill>
      <Kicker text="بالدفع عند الاستلام؟" at={0} y={120} />
      <Caption text="عطيني *دقيقة* برك" at={4} y={210} size={92} />
      <Phone screens={[{ src: "today-top", from: 0 }]}>
        <Highlight box={{ ...t.toCall, x: 48, w: 1074, y: t.toCall.y - 60, h: 470 }} at={at(dur, 0.35)} pad={0} />
      </Phone>
    </AbsoluteFill>
  );
};

export const TodayTour: React.FC<SceneProps> = ({ dur }) => {
  const t = B.today;
  return (
    <AbsoluteFill>
      <Caption text="كل صباح تعرف|*شكون* تعيطلو" at={0} until={at(dur, 0.5)} y={200} size={88} />
      <Caption text="وواش من طرد|راهو ~فخطر~" at={at(dur, 0.5) + 7} y={200} size={88} />
      <Phone screens={[{ src: "today", from: 0 }]} cams={[{ f: 0, cy: 1266 }, { f: at(dur, 0.45), cy: 1266 }, { f: at(dur, 0.75), cy: t.atRisk.y + 300 }]}>
        <Highlight box={{ x: 48, y: t.toCall.y - 60, w: 1074, h: 470 }} at={at(dur, 0.08)} until={at(dur, 0.48)} pad={0} />
        <Highlight box={{ x: 48, y: t.atRisk.y - 70, w: 1074, h: 560 }} at={at(dur, 0.55)} color={C.red} pad={0} />
      </Phone>
    </AbsoluteFill>
  );
};

export const OrderForm: React.FC<SceneProps> = ({ dur }) => {
  const o = B["order-filled"];
  const fees = union(o.fee, o.total);
  return (
    <AbsoluteFill>
      <Caption text="الزبون يطلب من *الإعلان*" at={0} until={at(dur, 0.5)} y={210} size={88} />
      <Caption text="والتوصيل *يتحسب وحدو*" at={at(dur, 0.5) + 7} y={210} size={88} />
      <Phone
        screens={[{ src: "order-filled", from: 0 }]}
        cams={[{ f: 0, cy: 1266 }, { f: at(dur, 0.2), cy: o.wilaya.y + 200 }, { f: at(dur, 0.5), cy: o.wilaya.y + 200 }, { f: at(dur, 0.68), cy: fees.y }]}
      >
        <Highlight box={union(o.wilaya, o.commune)} at={at(dur, 0.24)} until={at(dur, 0.5)} pad={12} />
        <Highlight box={{ x: 90, y: o.fee.y - 20, w: 990, h: o.total.y + o.total.h - o.fee.y + 40 }} at={at(dur, 0.72)} pad={0} />
      </Phone>
    </AbsoluteFill>
  );
};

export const Delivery: React.FC<SceneProps> = ({ dur }) => {
  const d = B["delivery-selected"];
  const r = B["delivery-onroad"];
  const sw = at(dur, 0.5);
  return (
    <AbsoluteFill>
      <Caption text="*كليك وحدة*|لشركة التوصيل" at={0} until={sw} y={200} size={88} />
      <Caption text="ورقم التتبع|*يرجعلك وحدو*" at={sw + 7} y={200} size={88} />
      <Phone screens={[{ src: "delivery-selected", from: 0 }, { src: "delivery-onroad", from: sw, enter: "fade" }]}>
        <Highlight box={d.send} at={at(dur, 0.12)} until={sw - 4} pad={10} />
        <Tap box={d.send} at={at(dur, 0.34)} />
        <Highlight box={r.tracking} at={sw + 10} pad={14} />
      </Phone>
    </AbsoluteFill>
  );
};

export const Rescue: React.FC<SceneProps> = ({ dur }) => {
  const r = B["rescue-top"];
  return (
    <AbsoluteFill>
      <Kicker text="إنقاذ الطرود" color={C.red} at={0} y={120} />
      <Caption text="*لحّق* الطرد|قبل ما يرجع" at={2} y={210} size={88} />
      <Phone screens={[{ src: "rescue-top", from: 0 }]}>
        <Highlight box={r.firstCard} at={at(dur, 0.15)} color={C.amber} pad={0} />
        <Tap box={r.deliverBtn} at={at(dur, 0.7)} />
      </Phone>
    </AbsoluteFill>
  );
};
