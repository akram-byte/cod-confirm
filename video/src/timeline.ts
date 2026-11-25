import voice from "./voice.json";
import { FPS } from "./theme";

/** Seconds of each cleaned voice line, written by `npm run voice`. Empty until you record. */
const VOICE = voice as Record<string, { seconds: number; file: string }>;

export type SceneDef = {
  id: string;
  /** Voice file key, e.g. "ad-03" → public/voice/ad-03.m4a */
  voice: string;
  /** Length used while there is no recording yet. */
  fallback: number;
  /** Seconds added after the voice line ends, so a scene can breathe before the cut. */
  tail?: number;
};

export type Timed = SceneDef & { from: number; dur: number; audio: string | null; rate: number };

/** Turns scene definitions into frame ranges. Scenes overlap by `overlap` frames for transitions. */
/** rate > 1 plays the voice faster (same pitch) to tighten a video. */
export function layout(scenes: SceneDef[], overlap = 8, rate = 1): { timed: Timed[]; total: number } {
  let from = 0;
  const timed = scenes.map((s, i) => {
    const v = VOICE[s.voice];
    const seconds = v ? v.seconds / rate + (s.tail ?? 0.35) : s.fallback;
    const dur = Math.round(seconds * FPS) + (i < scenes.length - 1 ? overlap : 0);
    const t: Timed = { ...s, from, dur, audio: v ? v.file : null, rate };
    from += dur - (i < scenes.length - 1 ? overlap : 0);
    return t;
  });
  return { timed, total: from };
}

export const hasVoice = Object.keys(VOICE).length > 0;
