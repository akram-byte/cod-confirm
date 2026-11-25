import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C } from "../theme";

/** Deep green-black with two slow glows and a faint grid, so flat frames never look empty. */
export const Background: React.FC<{ tint?: string }> = ({ tint = C.green }) => {
  const f = useCurrentFrame();
  const a = Math.sin(f / 70) * 120;
  const b = Math.cos(f / 90) * 140;
  return (
    <AbsoluteFill style={{ background: C.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(900px 900px at ${540 + a}px ${520 + b}px, ${tint}2e, transparent 65%),
                       radial-gradient(800px 800px at ${300 - b}px ${1500 + a}px, ${C.greenDeep}38, transparent 70%)`,
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${C.line} 1px, transparent 1px), linear-gradient(90deg, ${C.line} 1px, transparent 1px)`,
          backgroundSize: "90px 90px",
          backgroundPosition: `0 ${(f * 0.6) % 90}px`,
          opacity: 0.35,
          maskImage: "radial-gradient(ellipse at 50% 40%, black 20%, transparent 75%)",
        }}
      />
    </AbsoluteFill>
  );
};
