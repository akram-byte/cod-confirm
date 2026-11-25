import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(95);
Config.setCodec("h264");
Config.setCrf(16); // high quality: ads get recompressed by Meta/TikTok
Config.setPixelFormat("yuv420p");
Config.setConcurrency(2); // Edge runs out of memory on the tall screenshots at 4

// Use the Edge that ships with Windows instead of downloading a headless Chrome.
import { existsSync } from "node:fs";
const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
if (existsSync(EDGE)) {
  Config.setBrowserExecutable(EDGE);
  Config.setChromeMode("chrome-for-testing");
}
