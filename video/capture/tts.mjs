// Generates the Darija voiceover with ElevenLabs, one file per line, then cleans and measures it.
//
//   npm run tts                 all lines (ad + demo)
//   npm run tts -- ad           only the ad lines
//   npm run tts -- ad-03 demo-05   only these lines (to redo one you don't like)
//
// Needs video/.env (never committed) with:
//   ELEVENLABS_API_KEY=...      elevenlabs.io → Developers → API keys (Text to Speech access)
//   ELEVENLABS_VOICE_ID=...     the voice to use (Voice Library → add to My Voices → copy ID)
//   ELEVENLABS_MODEL=eleven_v3  optional; eleven_multilingual_v2 also handles Arabic
// The text of every line is in capture/lines.json.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import dns from "node:dns";
import net from "node:net";

// The connection to ElevenLabs can take ~9 s here; prefer IPv4 and give it time.
dns.setDefaultResultOrder("ipv4first");
net.setDefaultAutoSelectFamilyAttemptTimeout?.(5000);

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const OUT = resolve(root, "public/voice");
mkdirSync(OUT, { recursive: true });

const envFile = resolve(root, ".env");
const env = existsSync(envFile) ? readFileSync(envFile, "utf8") : "";
const get = (k) => process.env[k] || env.match(new RegExp(`^${k}=["']?([^"'\\r\\n]*)`, "m"))?.[1] || "";
const KEY = get("ELEVENLABS_API_KEY");
// Default: "George", a built-in multilingual voice every account has. Replace with a Darija voice.
const VOICE = get("ELEVENLABS_VOICE_ID") || "JBFqnCBsd6RMkjVDRZzb";
const MODEL = get("ELEVENLABS_MODEL") || "eleven_v3";
if (!KEY || !VOICE) {
  console.error("Missing ELEVENLABS_API_KEY or ELEVENLABS_VOICE_ID in video/.env (see .env.example).");
  process.exit(1);
}

const lines = JSON.parse(readFileSync(resolve(here, "lines.json"), "utf8"));
const args = process.argv.slice(2);
const keys = Object.keys(lines).filter((k) => args.length === 0 || args.some((a) => k === a || k.startsWith(a + "-")));
if (keys.length === 0) {
  console.error("No line matches", args.join(" "));
  process.exit(1);
}

// Steady, warm delivery. Stability lower = more expressive, higher = more even.
const voice_settings = { stability: 0.5, similarity_boost: 0.8, style: 0.3, use_speaker_boost: true };

for (const k of keys) {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": KEY, "Content-Type": "application/json", Accept: "audio/mpeg" },
    body: JSON.stringify({ text: lines[k], model_id: MODEL, voice_settings: MODEL === "eleven_v3" ? { stability: 0.5 } : voice_settings }),
  });
  if (!res.ok) {
    const msg = await res.text();
    console.error(`✗ ${k}: ${res.status} ${msg.slice(0, 300)}`);
    process.exit(1);
  }
  writeFileSync(resolve(OUT, `${k}.mp3`), Buffer.from(await res.arrayBuffer()));
  console.log(`✓ ${k}`);
}

// Trim, level and measure every line in public/voice (also the ones not regenerated now).
execFileSync(process.execPath, [resolve(here, "voice.mjs")], { stdio: "inherit" });
