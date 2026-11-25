import { loadFont as loadReadex } from "@remotion/google-fonts/ReadexPro";
import { loadFont as loadFigtree } from "@remotion/google-fonts/Figtree";

// Same faces as the app: Figtree for Latin and digits, Readex Pro for Arabic.
const readex = loadReadex("normal", { weights: ["400", "500", "600", "700"], subsets: ["arabic", "latin"] });
const figtree = loadFigtree("normal", { weights: ["500", "700", "800"], subsets: ["latin"] });

export const FONT = `${figtree.fontFamily}, ${readex.fontFamily}, sans-serif`;
export const FONT_AR = `${readex.fontFamily}, ${figtree.fontFamily}, sans-serif`;

export const C = {
  bg: "#050b08",
  bg2: "#0b1712",
  card: "#111b16",
  line: "rgba(255,255,255,0.09)",
  text: "#f2f7f4",
  muted: "#8fa79a",
  green: "#2fbf85",
  greenDeep: "#0b7a53",
  red: "#ff5d5d",
  amber: "#f5b740",
};

export const FPS = 30;
export const W = 1080;
export const H = 1920;
