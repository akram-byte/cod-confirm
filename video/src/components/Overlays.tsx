import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C } from "../theme";
import { SHOT_W, usePhone } from "./Phone";

export type Box = { x: number; y: number; w: number; h: number };

/** A finger tap on a screenshot element: the dot presses, a ring spreads. */
export const Tap: React.FC<{ box: Box; at: number }> = ({ box, at }) => {
  const f = useCurrentFrame() - at;
  const { toScreen } = usePhone();
  if (f < -8 || f > 26) return null;
  const p = toScreen(box.x + box.w / 2, box.y + box.h / 2);
  const ring = interpolate(f, [0, 20], [0.4, 2.6], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ringO = interpolate(f, [0, 20], [0.85, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const dot = interpolate(f, [-8, 0, 4, 12, 26], [0, 1, 0.78, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <>
      <div style={{ position: "absolute", left: p.x - 40, top: p.y - 40, width: 80, height: 80, borderRadius: 99, border: "5px solid white", transform: `scale(${ring})`, opacity: ringO }} />
      <div
        style={{
          position: "absolute", left: p.x - 34, top: p.y - 34, width: 68, height: 68, borderRadius: 99,
          background: "rgba(255,255,255,0.55)", boxShadow: "0 0 0 3px rgba(255,255,255,0.9), 0 10px 30px rgba(0,0,0,0.45)",
          transform: `scale(${dot})`, opacity: Math.min(1, dot * 1.4),
        }}
      />
    </>
  );
};

/** A glowing rounded frame around a screenshot element. */
export const Highlight: React.FC<{ box: Box; at: number; until?: number; color?: string; pad?: number }> = ({
  box, at, until = 9999, color = C.green, pad = 18,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { toScreen, scale } = usePhone();
  if (frame < at || frame > until + 10) return null;
  const s = spring({ frame: frame - at, fps, config: { damping: 14 } });
  const out = interpolate(frame, [until, until + 10], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pulse = 0.5 + 0.5 * Math.sin((frame - at) / 5);
  const a = toScreen(box.x - pad, box.y - pad);
  const w = (box.w + pad * 2) * scale;
  const h = (box.h + pad * 2) * scale;
  return (
    <div
      style={{
        position: "absolute", left: a.x, top: a.y, width: w, height: h, borderRadius: 18,
        border: `4px solid ${color}`,
        boxShadow: `0 0 ${18 + pulse * 22}px ${color}cc, inset 0 0 ${12 + pulse * 10}px ${color}55`,
        transform: `scale(${interpolate(s, [0, 1], [1.25, 1])})`,
        opacity: s * out,
      }}
    />
  );
};

/** A magnified piece of a screenshot that pops out of the phone. */
export const Callout: React.FC<{
  src: string; box: Box; at: number; until?: number; zoom?: number; x?: number; y?: number; color?: string; label?: string; pad?: number;
}> = ({ src, box, at, until = 9999, zoom = 1.25, x = 540, y = 1250, color = C.green, label, pad = 24 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < at || frame > until + 12) return null;
  const s = spring({ frame: frame - at, fps, config: { damping: 13, mass: 0.8 } });
  const out = interpolate(frame, [until, until + 12], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const bx = box.x - pad, by = box.y - pad, bw = box.w + pad * 2, bh = box.h + pad * 2;
  const w = bw * zoom * 0.5; // screenshots are 3×: 0.5 keeps text a sane size at zoom 1
  const h = bh * zoom * 0.5;
  const k = zoom * 0.5;
  return (
    <div
      style={{
        position: "absolute", left: x - w / 2, top: y - h / 2, width: w,
        transform: `scale(${interpolate(s, [0, 1], [0.6, 1])}) translateY(${interpolate(s, [0, 1], [60, 0])}px)`,
        opacity: Math.min(1, s * 1.5) * out, zIndex: 100,
      }}
    >
      <div
        style={{
          position: "relative", width: w, height: h, overflow: "hidden", borderRadius: 28,
          border: `4px solid ${color}`, background: "#0b0d0c",
          boxShadow: `0 40px 80px rgba(0,0,0,0.7), 0 0 60px ${color}66`,
        }}
      >
        <Img src={staticFile(`shots/${src}.png`)} style={{ position: "absolute", left: -bx * k, top: -by * k, width: SHOT_W * k }} />
      </div>
      {label && (
        <div
          style={{
            margin: "18px auto 0", width: "fit-content", padding: "12px 28px", borderRadius: 99,
            background: color, color: color === C.green ? "#04130c" : "#fff", fontSize: 40, fontWeight: 700, direction: "rtl",
            boxShadow: `0 12px 30px ${color}55`,
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
};

/** Crop helper: union of several boxes. */
export const union = (...bs: Box[]): Box => {
  const x = Math.min(...bs.map((b) => b.x));
  const y = Math.min(...bs.map((b) => b.y));
  return { x, y, w: Math.max(...bs.map((b) => b.x + b.w)) - x, h: Math.max(...bs.map((b) => b.y + b.h)) - y };
};
