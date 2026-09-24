/**
 * Renders the product photography used by the store from the procedural
 * 3D models in src/three. Output: public/renders/*.webp
 *
 *   npm run render                 → every shot in the manifest
 *   npm run render -- tee runner   → only shots whose key contains a filter
 */
import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { chromium } from "playwright-core";

const root = path.resolve(import.meta.dirname, "../..");
const outDir = path.join(root, "public/renders");
const filters = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const debug = process.argv.includes("--debug");

fs.mkdirSync(outDir, { recursive: true });

const bundle = await build({
  entryPoints: [path.join(import.meta.dirname, "entry.ts")],
  bundle: true,
  format: "iife",
  platform: "browser",
  target: "es2022",
  write: false,
  logLevel: "warning",
  tsconfig: path.join(root, "tsconfig.json"),
});
const script = bundle.outputFiles[0].text;

/* Fetch the display font (Archivo, variable width) once and cache it. */
const fontCache = path.join(root, "node_modules/.cache/vault-render/archivo.woff2");
if (!fs.existsSync(fontCache)) {
  fs.mkdirSync(path.dirname(fontCache), { recursive: true });
  const css = execFileSync("curl", [
    "-sS",
    "-A",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141 Safari/537.36",
    "https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&display=swap",
  ]).toString();
  const blocks = css.split("@font-face").filter((b) => b.includes("U+0000-00FF"));
  const url = (blocks[0] || css).match(/url\((https:[^)]+\.woff2)\)/)?.[1];
  if (!url) throw new Error("Could not resolve Archivo font URL");
  execFileSync("curl", ["-sS", "-o", fontCache, url]);
}
const fontB64 = fs.readFileSync(fontCache).toString("base64");

const browser = await chromium.launch({
  headless: true,
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
const page = await browser.newPage();
page.on("console", (m) => debug && console.log("[page]", m.text()));
page.on("pageerror", (e) => console.error("[page error]", e));
await page.setContent(`<!doctype html><html><head><style>
@font-face{font-family:Archivo;src:url(data:font/woff2;base64,${fontB64}) format("woff2");font-weight:100 900;font-stretch:62% 125%;}
body{margin:0;background:#000}
</style></head><body><canvas id="c"></canvas></body></html>`);
await page.addScriptTag({ content: script });
await page.evaluate(async () => {
  await document.fonts.load('500 64px Archivo');
  await document.fonts.load('400 64px Archivo');
  await window.VAULT_RENDER.init();
});

const keys = await page.evaluate(() => window.VAULT_RENDER.keys());
const selected = keys.filter((k) => !filters.length || filters.some((f) => k.includes(f)));
console.log(`Rendering ${selected.length} shot(s)…`);

for (const key of selected) {
  const t = Date.now();
  const result = await page.evaluate((k) => window.VAULT_RENDER.render(k), key);
  const buf = Buffer.from(result.dataUrl.split(",")[1], "base64");
  const file = path.join(outDir, `${key}.webp`);
  await sharp(buf)
    .resize(result.width, result.height, { kernel: "lanczos3" })
    .webp({ quality: result.transparent ? 86 : 80, alphaQuality: 90, effort: 5, smartSubsample: true })
    .toFile(file);
  const kb = Math.round(fs.statSync(file).size / 1024);
  console.log(`  ✓ ${key}.webp  ${result.width}×${result.height}  ${kb}KB  ${Date.now() - t}ms`);
}

await browser.close();
