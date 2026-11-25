import { AbsoluteFill, Audio, Img, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Background } from "./components/Background";
import { C, FONT } from "./theme";
import { layout, type SceneDef } from "./timeline";
import voice from "./voice.json";
import * as S from "./scenes/scenes";

type Entry = SceneDef & { C: React.FC<S.SceneProps> };

const OVERLAP = 8;

/** Fades a scene in over the previous one. */
const FadeIn: React.FC<{ children: React.ReactNode; dur: number; first: boolean; last: boolean }> = ({ children, dur, first, last }) => {
  const f = useCurrentFrame();
  const o = first ? 1 : interpolate(f, [0, OVERLAP], [0, 1], { extrapolateRight: "clamp" });
  const out = last ? 1 : interpolate(f, [dur - OVERLAP, dur], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ opacity: Math.min(o, out) }}>{children}</AbsoluteFill>;
};

/** Small logo in the corner while the app is on screen. */
const Watermark: React.FC = () => (
  <div style={{ position: "absolute", top: 54, left: 54, display: "flex", alignItems: "center", gap: 14, opacity: 0.85 }}>
    <Img src={staticFile("brand/confirmi-icon.svg")} style={{ width: 54, height: 54 }} />
    <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 34, color: C.text }}>Confirmi</span>
  </div>
);

const MUSIC = (voice as Record<string, { file: string }>)._music;

export const makeVideo = (entries: Entry[], rate = 1) => {
  const { timed, total } = layout(entries, OVERLAP, rate);
  const Comp: React.FC = () => (
    <AbsoluteFill style={{ background: C.bg }}>
      <Background />
      {timed.map((t, i) => {
        const E = entries[i].C;
        const isLast = i === timed.length - 1;
        return (
          <Sequence key={t.id} from={t.from} durationInFrames={t.dur} name={t.id}>
            <FadeIn dur={t.dur} first={i === 0} last={isLast}>
              <E dur={t.dur} />
              {i > 0 && !isLast && <Watermark />}
            </FadeIn>
            {t.audio && <Audio src={staticFile(t.audio)} playbackRate={t.rate} />}
          </Sequence>
        );
      })}
      {MUSIC && (
        <Audio
          src={staticFile(MUSIC.file)}
          loop
          volume={(f) => interpolate(f, [0, 15, total - 30, total], [0, 0.1, 0.1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
        />
      )}
    </AbsoluteFill>
  );
  return { Comp, total };
};

export const AD: Entry[] = [
  { id: "hook", voice: "ad-01", fallback: 3.4, C: S.Hook },
  { id: "pain", voice: "ad-02", fallback: 4.6, C: S.Pain },
  { id: "fake", voice: "ad-03", fallback: 4.6, C: S.Fake },
  { id: "risky", voice: "ad-04", fallback: 3.8, C: S.Risky },
  { id: "speed", voice: "ad-05", fallback: 3.6, C: S.Speed },
  { id: "profit", voice: "ad-06", fallback: 4.2, C: S.Profit },
  { id: "offer", voice: "ad-07", fallback: 4.6, tail: 1.2, C: S.Offer },
];

export const DEMO: Entry[] = [
  { id: "intro", voice: "demo-01", fallback: 3.6, C: S.TodayIntro },
  { id: "today", voice: "demo-02", fallback: 6, C: S.TodayTour },
  { id: "form", voice: "demo-03", fallback: 7, C: S.OrderForm },
  { id: "fake", voice: "demo-04", fallback: 7, C: (p) => <S.Fake {...p} caption="تعمّرت في *4* ثواني|ومن ^نفس^ التيليفون" /> },
  { id: "risky", voice: "demo-05", fallback: 5.5, C: (p) => <S.Risky {...p} caption="رجّع طرد من قبل|تعرفها *قبل ما تبعث*" /> },
  { id: "speed", voice: "demo-06", fallback: 6, C: S.Speed },
  { id: "delivery", voice: "demo-07", fallback: 6.5, C: S.Delivery },
  { id: "rescue", voice: "demo-08", fallback: 7, C: S.Rescue },
  { id: "profit", voice: "demo-09", fallback: 5.5, C: S.Profit },
  { id: "offer", voice: "demo-10", fallback: 4.5, tail: 1.2, C: S.Offer },
];
