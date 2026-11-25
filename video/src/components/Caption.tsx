import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT_AR } from "../theme";

/**
 * Big Arabic headline, word by word. Mark words: *green* ~red~ ^amber^.
 * Use "|" for a line break.
 */
export const Caption: React.FC<{
  text: string; at?: number; size?: number; y?: number; stagger?: number; until?: number; maxWidth?: number;
}> = ({ text, at = 0, size = 84, y = 250, stagger = 3, until = 99999, maxWidth = 960 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const out = interpolate(frame, [until, until + 8], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  let i = 0;
  // A marked span can cover several words: "*رجّع طرد*".
  const colors: Record<string, string> = { "*": C.green, "~": C.red, "^": C.amber };
  let open: string | null = null;
  const lines = text.split("|").map((l) =>
    l.trim().split(/\s+/).map((raw) => {
      let w = raw;
      let color = open ? colors[open] : C.text;
      if (!open && colors[w[0]]) {
        open = w[0];
        color = colors[open];
        w = w.slice(1);
      }
      if (open) {
        const close = w.match(new RegExp(`\\${open}([.،؟?!…:]*)$`));
        if (close) {
          w = w.slice(0, close.index) + close[1];
          open = null;
        }
      }
      return { w, color };
    }),
  );
  return (
    <div
      style={{
        position: "absolute", top: y, left: (1080 - maxWidth) / 2, width: maxWidth, direction: "rtl", textAlign: "center",
        fontFamily: FONT_AR, fontWeight: 700, fontSize: size, lineHeight: 1.28, color: C.text, opacity: out,
        textShadow: "0 6px 30px rgba(0,0,0,0.6)",
      }}
    >
      {lines.map((words, li) => (
        <div key={li} style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: size * 0.26 }}>
          {words.map(({ w, color }, wi) => {
            const idx = i++;
            const s = spring({ frame: frame - at - idx * stagger, fps, config: { damping: 15, mass: 0.6 } });
            return (
              <span
                key={wi}
                style={{
                  display: "inline-block", color, opacity: s,
                  transform: `translateY(${interpolate(s, [0, 1], [size * 0.5, 0])}px) scale(${interpolate(s, [0, 1], [0.85, 1])})`,
                }}
              >
                {w}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

/** Small pill label above a headline. */
export const Kicker: React.FC<{ text: string; at?: number; y?: number; color?: string }> = ({ text, at = 0, y = 150, color = C.green }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - at, fps, config: { damping: 16 } });
  return (
    <div style={{ position: "absolute", top: y, width: 1080, display: "flex", justifyContent: "center", opacity: s }}>
      <div
        style={{
          direction: "rtl", fontFamily: FONT_AR, fontWeight: 600, fontSize: 36, color, padding: "10px 26px", borderRadius: 99,
          border: `2px solid ${color}66`, background: `${color}1a`, transform: `translateY(${interpolate(s, [0, 1], [20, 0])}px)`,
        }}
      >
        {text}
      </div>
    </div>
  );
};
