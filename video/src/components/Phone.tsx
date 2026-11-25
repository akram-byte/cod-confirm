import { createContext, useContext } from "react";
import { Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C } from "../theme";

/** Screenshots are 1170 px wide (390 css px × 3). A phone viewport is 2532 px tall. */
export const SHOT_W = 1170;
export const SHOT_VIEW_H = 2532;

export type Cam = { f: number; cx?: number; cy?: number; s?: number };
export type Screen = { src: string; from: number; enter?: "cut" | "fade" | "slide" };

type Ctx = { toScreen: (x: number, y: number) => { x: number; y: number }; scale: number; sw: number; sh: number };
const PhoneCtx = createContext<Ctx | null>(null);
export const usePhone = () => {
  const c = useContext(PhoneCtx);
  if (!c) throw new Error("usePhone outside <Phone>");
  return c;
};

const ease = Easing.bezier(0.65, 0, 0.35, 1);

/** Camera keyframes → current camera. Missing values carry over from the previous keyframe. */
function camAt(frame: number, cams: Cam[]) {
  const full = cams.reduce<Required<Cam>[]>((acc, c) => {
    const prev = acc[acc.length - 1] ?? { f: 0, cx: SHOT_W / 2, cy: SHOT_VIEW_H / 2, s: 1 };
    acc.push({ f: c.f, cx: c.cx ?? prev.cx, cy: c.cy ?? prev.cy, s: c.s ?? prev.s });
    return acc;
  }, []);
  if (full.length === 0) return { cx: SHOT_W / 2, cy: SHOT_VIEW_H / 2, s: 1 };
  const fs = full.map((c) => c.f);
  const pick = (k: "cx" | "cy" | "s") =>
    full.length === 1
      ? full[0][k]
      : interpolate(frame, fs, full.map((c) => c[k]), { easing: ease, extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return { cx: pick("cx"), cy: pick("cy"), s: pick("s") };
}

/**
 * A phone showing app screenshots, with a camera that can scroll and zoom.
 * Children are overlays (taps, highlights) placed in screenshot pixels via usePhone().toScreen.
 */
export const Phone: React.FC<{
  screens: Screen[];
  cams?: Cam[];
  width?: number;
  x?: number;
  y?: number;
  enterAt?: number;
  children?: React.ReactNode;
}> = ({ screens, cams = [], width = 620, x = 540, y = 1190, enterAt = 0, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bezel = 16;
  const sw = width - bezel * 2;
  const sh = (sw * SHOT_VIEW_H) / SHOT_W;
  const k = sw / SHOT_W;
  const cam = camAt(frame, cams);
  const z = k * cam.s;
  const tx = sw / 2 - cam.cx * z;
  const ty = sh / 2 - cam.cy * z;
  const toScreen = (px: number, py: number) => ({ x: tx + px * z, y: ty + py * z });

  const inn = spring({ frame: frame - enterAt, fps, config: { damping: 18, mass: 0.9 } });
  const lift = interpolate(inn, [0, 1], [380, 0]);

  return (
    <div
      style={{
        position: "absolute",
        left: x - width / 2,
        top: y - (sh + bezel * 2) / 2,
        width,
        height: sh + bezel * 2,
        transform: `translateY(${lift}px) scale(${interpolate(inn, [0, 1], [0.92, 1])})`,
        opacity: interpolate(inn, [0, 0.4], [0, 1], { extrapolateRight: "clamp" }),
        borderRadius: 78,
        background: "linear-gradient(160deg, #2a332e, #0d120f 40%, #1b221e)",
        padding: bezel,
        boxShadow: `0 60px 120px rgba(0,0,0,0.65), 0 0 0 2px rgba(255,255,255,0.07), 0 0 140px ${C.green}26`,
      }}
    >
      <div style={{ position: "relative", width: sw, height: sh, borderRadius: 62, overflow: "hidden", background: "#0b0d0c" }}>
        {screens.map((s, i) => {
          const next = screens[i + 1];
          if (frame < s.from - 12 || (next && frame > next.from + 14)) return null;
          const enter = s.enter ?? "fade";
          const p = interpolate(frame, [s.from, s.from + 12], [0, 1], { easing: ease, extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const leaving = next && next.enter === "slide"
            ? interpolate(frame, [next.from, next.from + 12], [0, 1], { easing: ease, extrapolateLeft: "clamp", extrapolateRight: "clamp" })
            : 0;
          const opacity = i === 0 || enter !== "fade" ? 1 : p;
          // RTL app: the next order comes in from the left.
          const shift = (enter === "slide" && i > 0 ? (1 - p) * -sw : 0) + leaving * sw * 0.35;
          if (i > 0 && enter === "cut" && frame < s.from) return null;
          return (
            <div key={i} style={{ position: "absolute", inset: 0, transform: `translateX(${shift}px)`, opacity, zIndex: i }}>
              <Img
                src={staticFile(`shots/${s.src}.png`)}
                style={{ position: "absolute", left: 0, top: 0, width: SHOT_W, transformOrigin: "0 0", transform: `translate(${tx}px, ${ty}px) scale(${z})` }}
              />
              {leaving > 0 && <div style={{ position: "absolute", inset: 0, background: "#000", opacity: leaving * 0.5 }} />}
            </div>
          );
        })}
        <PhoneCtx.Provider value={{ toScreen, scale: z, sw, sh }}>
          <div style={{ position: "absolute", inset: 0, zIndex: 50 }}>{children}</div>
        </PhoneCtx.Provider>
        {/* glass reflection */}
        <div
          style={{
            position: "absolute", inset: 0, zIndex: 60, pointerEvents: "none",
            background: "linear-gradient(125deg, rgba(255,255,255,0.07) 0%, transparent 28%, transparent 70%, rgba(255,255,255,0.03) 100%)",
          }}
        />
      </div>
    </div>
  );
};
