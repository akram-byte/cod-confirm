import { Composition } from "remotion";
import { AD, DEMO, makeVideo } from "./Video";
import { FPS, H, W } from "./theme";

import voice from "./voice.json";

// If the ad's voice runs past 30 s, play it up to 10% faster (same pitch) to tighten it.
const adVoice = Object.entries(voice as Record<string, { seconds: number }>)
  .filter(([k]) => k.startsWith("ad-"))
  .reduce((a, [, v]) => a + v.seconds, 0);
const ad = makeVideo(AD, Math.min(1.1, Math.max(1, adVoice / 30)));
const demo = makeVideo(DEMO);

export const Root: React.FC = () => (
  <>
    <Composition id="Ad30" component={ad.Comp} durationInFrames={ad.total} fps={FPS} width={W} height={H} />
    <Composition id="Demo60" component={demo.Comp} durationInFrames={demo.total} fps={FPS} width={W} height={H} />
  </>
);
