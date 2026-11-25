// Cleans the voice recordings and writes their lengths to src/voice.json.
//   Put ad-01.m4a … demo-10.m4a (or .mp3/.wav/.ogg/.opus) in public/voice/, then: npm run voice
// Optional background music: public/voice/music.mp3 (kept very low under the voice).
//
// For each line: removes low rumble (fan, traffic), trims the silence at both ends, then evens out
// the loudness (−16 LUFS, the level phones and social apps expect) into public/voice/clean/NAME.wav.
// Uses the ffmpeg that ships with Remotion (it decodes and normalises; the trimming is done here).
import { execFileSync } from "node:child_process";
import { readdirSync, mkdirSync, readFileSync, writeFileSync, unlinkSync, statSync } from "node:fs";
import { resolve, dirname, parse } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const IN = resolve(root, "public/voice");
const OUT = resolve(IN, "clean");
const RATE = 48000;
mkdirSync(OUT, { recursive: true });

const ffmpeg = (...args) =>
  execFileSync(process.execPath, [resolve(root, "node_modules/@remotion/cli/remotion-cli.js"), "ffmpeg", "-hide_banner", "-y", "-v", "error", ...args], {
    cwd: root, stdio: ["ignore", "pipe", "pipe"],
  });

/** Minimal 16-bit mono PCM WAV read/write. */
function readWav(file) {
  const buf = readFileSync(file);
  let p = 12;
  while (p < buf.length) {
    const id = buf.toString("ascii", p, p + 4);
    const size = buf.readUInt32LE(p + 4);
    if (id === "data") {
      const n = Math.floor(Math.min(size, buf.length - p - 8) / 2);
      const s = new Float32Array(n);
      for (let i = 0; i < n; i++) s[i] = buf.readInt16LE(p + 8 + i * 2) / 32768;
      return s;
    }
    p += 8 + size + (size % 2);
  }
  throw new Error("no audio data in " + file);
}
function writeWav(file, s) {
  const b = Buffer.alloc(44 + s.length * 2);
  b.write("RIFF", 0); b.writeUInt32LE(36 + s.length * 2, 4); b.write("WAVE", 8);
  b.write("fmt ", 12); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22);
  b.writeUInt32LE(RATE, 24); b.writeUInt32LE(RATE * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34);
  b.write("data", 36); b.writeUInt32LE(s.length * 2, 40);
  for (let i = 0; i < s.length; i++) b.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(s[i] * 32767))), 44 + i * 2);
  writeFileSync(file, b);
}

/** Second-order high-pass (80 Hz): removes rumble without touching the voice. */
function highpass(s, fc = 80) {
  const w = (2 * Math.PI * fc) / RATE, q = Math.SQRT1_2, a = Math.sin(w) / (2 * q), c = Math.cos(w);
  const b0 = (1 + c) / 2, b1 = -(1 + c), b2 = (1 + c) / 2, a0 = 1 + a, a1 = -2 * c, a2 = 1 - a;
  const o = new Float32Array(s.length);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < s.length; i++) {
    const y = (b0 * s[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
    x2 = x1; x1 = s[i]; y2 = y1; y1 = y; o[i] = y;
  }
  return o;
}

/** Cuts the silence before and after the line, keeping a short natural breath at each end. */
function trim(s) {
  const win = Math.round(RATE * 0.02);
  const rms = [];
  for (let i = 0; i + win <= s.length; i += win) {
    let e = 0;
    for (let j = i; j < i + win; j++) e += s[j] * s[j];
    rms.push(Math.sqrt(e / win));
  }
  const sorted = [...rms].sort((a, b) => a - b);
  const loud = sorted[Math.floor(sorted.length * 0.95)] || 0;
  const floor = sorted[Math.floor(sorted.length * 0.1)] || 0;
  // Speech threshold: well above the room noise, well below the voice.
  const th = Math.max(floor * 3, loud * 0.06);
  const first = rms.findIndex((v) => v > th);
  let last = rms.length - 1;
  while (last > 0 && rms[last] <= th) last--;
  if (first < 0) return s;
  const a = Math.max(0, first * win - Math.round(RATE * 0.06));
  const b = Math.min(s.length, (last + 1) * win + Math.round(RATE * 0.12));
  const out = s.slice(a, b);
  const fade = Math.round(RATE * 0.01);
  for (let i = 0; i < fade && i < out.length; i++) {
    out[i] *= i / fade;
    out[out.length - 1 - i] *= i / fade;
  }
  return out;
}

const AUDIO = [".m4a", ".mp3", ".wav", ".ogg", ".opus", ".aac", ".mp4"];
// If a line exists in several formats (say an old .mp3 and a new .m4a), the newest file wins.
const newest = new Map();
for (const f of readdirSync(IN)) {
  const { name, ext } = parse(f);
  if (!AUDIO.includes(ext.toLowerCase())) continue;
  const t = statSync(resolve(IN, f)).mtimeMs;
  if (!newest.has(name) || newest.get(name).t < t) newest.set(name, { f, t });
}

const result = {};
for (const { f } of [...newest.values()].sort((a, b) => a.f.localeCompare(b.f))) {
  const { name } = parse(f);
  const isMusic = name === "music";
  if (!isMusic && !/^(ad|demo)-\d\d$/.test(name)) {
    console.log("skip (name it like ad-01 or demo-03):", f);
    continue;
  }
  const out = resolve(OUT, `${name}.wav`);
  if (isMusic) {
    ffmpeg("-i", resolve(IN, f), "-af", "loudnorm=I=-20", "-ar", String(RATE), "-ac", "2", out);
    result._music = { file: `voice/clean/${name}.wav`, seconds: 0 };
    console.log("✓ music");
    continue;
  }
  const raw = resolve(OUT, `${name}.raw.wav`);
  const mid = resolve(OUT, `${name}.trim.wav`);
  try {
    ffmpeg("-i", resolve(IN, f), "-ac", "1", "-ar", String(RATE), "-c:a", "pcm_s16le", raw);
    const s = trim(highpass(readWav(raw)));
    writeWav(mid, s);
    ffmpeg("-i", mid, "-af", "loudnorm=I=-16:TP=-1.5:LRA=7", "-ar", String(RATE), "-ac", "1", "-c:a", "pcm_s16le", out);
    const seconds = Math.round((readWav(out).length / RATE) * 100) / 100;
    result[name] = { file: `voice/clean/${name}.wav`, seconds };
    console.log(`✓ ${name.padEnd(8)} ${seconds.toFixed(2)}s`);
  } catch (e) {
    console.log(`✗ ${f}: ${String(e.stderr || e.message).trim().split("\n").pop()}`);
  } finally {
    for (const t of [raw, mid]) try { unlinkSync(t); } catch {}
  }
}

writeFileSync(resolve(root, "src/voice.json"), JSON.stringify(result, null, 2) + "\n");
const total = (p) => Object.entries(result).filter(([k]) => k.startsWith(p)).reduce((a, [, v]) => a + v.seconds, 0);
console.log(`\nAd voice: ${total("ad-").toFixed(1)}s (aim for 24–30s) · Demo voice: ${total("demo-").toFixed(1)}s → src/voice.json`);
