// Renders the app icons and store graphics from HTML/SVG at exact pixel
// sizes with the workspace's Playwright. Run from frontend/:
//   node apps/mobile/store/render.mjs
// Sources: the seal geometry (docs/BRAND.md, src/components/Brand.tsx),
// the palette (src/lib/theme.ts), Sora and Inter from @expo-google-fonts.
import { chromium } from "playwright";
import { readFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const app = resolve(here, "..");
const root = resolve(app, "../..");
// Inlined: a page set with setContent is about:blank and may not read file:// fonts.
const font = (p) =>
  `data:font/ttf;base64,${readFileSync(join(root, "node_modules/@expo-google-fonts", p)).toString("base64")}`;

export const C = {
  paper: "#faf8f3", ink: "#18120c", accent: "#e8a33d", accentStrong: "#8f5510",
  surface: "#fffefb", muted: "#6f6359", line: "#e5ded3", success: "#0f7655",
};
export const FONTS = `
@font-face{font-family:Sora;font-weight:700;src:url(${font("sora/700Bold/Sora_700Bold.ttf")})}
@font-face{font-family:Sora;font-weight:800;src:url(${font("sora/800ExtraBold/Sora_800ExtraBold.ttf")})}
@font-face{font-family:Inter;font-weight:400;src:url(${font("inter/400Regular/Inter_400Regular.ttf")})}
@font-face{font-family:Inter;font-weight:600;src:url(${font("inter/600SemiBold/Inter_600SemiBold.ttf")})}
@font-face{font-family:Inter;font-weight:700;src:url(${font("inter/700Bold/Inter_700Bold.ttf")})}
@font-face{font-family:Inter;font-weight:800;src:url(${font("inter/800ExtraBold/Inter_800ExtraBold.ttf")})}
*{margin:0;padding:0;box-sizing:border-box}html,body{background:transparent}`;

const bumps = Array.from({ length: 16 }, (_, i) => {
  const a = (i * Math.PI) / 8;
  return [256 + 186 * Math.cos(a), 256 + 186 * Math.sin(a)];
});

/** The seal as SVG. `mono` renders a one-colour silhouette with the ring and K cut out. */
export function seal({ size, badge = C.ink, ring = C.accent, mono = null, letter = C.paper }) {
  const discs = bumps.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="40"/>`).join("") + `<circle cx="256" cy="256" r="190"/>`;
  const k = `<text x="256" y="313" text-anchor="middle" font-family="Sora" font-size="160" font-weight="700">K</text>`;
  if (mono) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="${size}" height="${size}">
<defs><mask id="m"><g fill="#fff">${discs}</g><circle cx="256" cy="256" r="126" fill="none" stroke="#000" stroke-width="15"/><g fill="#000">${k}</g></mask></defs>
<rect width="512" height="512" fill="${mono}" mask="url(#m)"/></svg>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="${size}" height="${size}">
<g fill="${badge}">${discs}</g><circle cx="256" cy="256" r="126" fill="none" stroke="${ring}" stroke-width="15"/>
<g fill="${letter}">${k}</g></svg>`;
}

export async function render(browser, { html, width, height, out, transparent = false }) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await page.setContent(`<!doctype html><html><head><style>${FONTS}</style></head><body style="width:${width}px;height:${height}px;overflow:hidden">${html}</body></html>`);
  await page.evaluate(() => document.fonts.ready);
  mkdirSync(dirname(out), { recursive: true });
  await page.screenshot({ path: out, omitBackground: transparent, type: out.endsWith(".jpg") ? "jpeg" : "png", ...(out.endsWith(".jpg") ? { quality: 92 } : {}) });
  await page.close();
  console.log("wrote", out.replace(root, "frontend"), `${width}x${height}`);
}

const centred = (inner, bg = "transparent") =>
  `<div style="width:100%;height:100%;display:grid;place-items:center;background:${bg}">${inner}</div>`;

export async function icons(browser) {
  const A = (f) => join(app, "assets", f);
  // iOS and the default icon: opaque, the seal at the same scale as the web wallet's icon.
  await render(browser, { html: centred(seal({ size: 1024 }), C.paper), width: 1024, height: 1024, out: A("icon.png") });
  // Android adaptive foreground: transparent, seal inside the 66% safe circle.
  await render(browser, { html: centred(seal({ size: 700 })), width: 1024, height: 1024, out: A("adaptive-icon.png"), transparent: true });
  // Android 13+ themed icon: one colour, the launcher tints it.
  await render(browser, { html: centred(seal({ size: 700, mono: "#000" })), width: 1024, height: 1024, out: A("adaptive-icon-monochrome.png"), transparent: true });
  // Status-bar icon: white silhouette on transparent, which Android requires.
  await render(browser, { html: centred(seal({ size: 96, mono: "#fff" })), width: 96, height: 96, out: A("notification-icon.png"), transparent: true });
  // Splash: the seal alone; app.json sets the background and width.
  await render(browser, { html: centred(seal({ size: 1024 })), width: 1024, height: 1024, out: A("splash.png"), transparent: true });
  // Play Console listing icon.
  await render(browser, { html: centred(seal({ size: 512 }), C.paper), width: 512, height: 512, out: join(here, "android/icon-512.png") });
}


// ---- Store listing graphics -------------------------------------------------
// Real captures from the app (store/captures, taken on the Pixel_10a emulator
// against the seeded local API with Android's demo status bar), set in a
// device frame under one headline each. Backdrops from store/imagery.py.

const img = (p) => `data:image/png;base64,${readFileSync(p).toString("base64")}`;
const cap = (name) => img(join(here, "captures", `${name}.png`));
const photo = (name) => img(join(here, "imagery", `${name}.png`));

const SHOTS = [
  { cap: "join", eyebrow: "Scan the counter poster", title: "Your first stamp is waiting.", bg: { photo: "street", tint: "rgba(24,18,12,.62)" }, ink: C.paper, accent: C.accent },
  { cap: "home", eyebrow: "One wallet", title: "Every shop's card, all in one place.", bg: { color: C.accent }, ink: C.ink, accent: C.ink },
  { cap: "code", eyebrow: "At the counter", title: "One code for every shop. Works offline.", bg: { color: C.ink }, ink: C.paper, accent: C.accent },
  { cap: "discover", eyebrow: "Discover", title: "Good places nearby, worth coming back to.", bg: { photo: "pastries", tint: "rgba(250,248,243,.80)" }, ink: C.ink, accent: C.accentStrong },
];

function screenshotHtml(shot, W, H, device = "android") {
  const u = W / 1080; // every measure scales with the canvas width
  const phoneW = Math.round(W * 0.7);
  const phoneH = Math.round(phoneW * (2408 / 1080));
  const bezel = Math.round(14 * u);
  const back = shot.bg.photo
    ? `background:linear-gradient(${shot.bg.tint},${shot.bg.tint}),url(${photo(shot.bg.photo)}) center/cover`
    : `background:${shot.bg.color}`;
  return `<div style="position:relative;width:${W}px;height:${H}px;overflow:hidden;${back};font-family:Inter">
  <div style="position:absolute;left:${80 * u}px;right:${80 * u}px;top:${110 * u}px;color:${shot.ink}">
    <div style="display:flex;align-items:center;gap:${14 * u}px">
      ${shot.ink === C.ink ? seal({ size: Math.round(44 * u) }) : seal({ size: Math.round(44 * u), badge: C.accent, ring: C.ink, letter: C.ink })}
      <span style="font:800 ${26 * u}px/1 Inter;letter-spacing:${3.5 * u}px;text-transform:uppercase;color:${shot.accent}">${shot.eyebrow}</span>
    </div>
    <div style="margin-top:${26 * u}px;font:800 ${76 * u}px/1.04 Sora;letter-spacing:${-2.2 * u}px">${shot.title}</div>
  </div>
  ${device === "ios"
    ? `<div style="position:absolute;left:${(W - phoneW) / 2}px;top:${Math.round(410 * u)}px">${iphone(shot, phoneW)}</div>`
    : `<div style="position:absolute;left:${(W - phoneW) / 2}px;top:${Math.round(410 * u)}px;width:${phoneW}px;height:${phoneH}px;border-radius:${64 * u}px;background:#0d0a07;padding:${bezel}px;box-shadow:0 ${40 * u}px ${90 * u}px rgba(0,0,0,.35)">
    <img src="${cap(shot.cap)}" style="display:block;width:100%;height:100%;border-radius:${52 * u}px;object-fit:cover;object-position:top">
  </div>`}
</div>`;
}

// iPhone 16 in points: 393 x 852 screen, 55 pt screen corners, the Dynamic
// Island 125 x 37 at 11 pt, a 54 pt status bar and the home indicator. The
// Android capture's status bar (128 px) and gesture strip (60 px) are cut,
// and the rest is fitted between the iOS status bar and the bottom edge.
function iphone(shot, widthPx) {
  const BEZEL = 6, EDGE = 3;
  const s = widthPx / (393 + 2 * (BEZEL + EDGE)); // px per point
  const pt = (v) => `${(v * s).toFixed(2)}px`;
  const screenW = 393 * s, screenH = 852 * s, bar = 54 * s, home = 26 * s;
  const keepTop = 128, keepBottom = 2348; // rows of the 1080 x 2408 capture
  // The home-indicator strip stays clear, as iOS keeps a tab bar above it;
  // it takes the colour of the capture's last row (the tab bar, or paper).
  const k = Math.min((screenH - bar - home) / (keepBottom - keepTop), screenW / 1080);
  const foot = shot.cap === "join" ? C.paper : "#fefcf9";
  // Where the tab bar starts, so the margins beside a slightly narrower
  // capture take its colour rather than the paper above it.
  const footTop = shot.cap === "join" ? screenH : bar + (2208 - keepTop) * k;
  const imgW = 1080 * k;
  const button = (side, top, h, w = 3) =>
    `<span style="position:absolute;${side}:${pt(-w)};top:${pt(top)};width:${pt(w)};height:${pt(h)};border-radius:${pt(2)};background:linear-gradient(90deg,#3a3a3c,#1c1c1e)"></span>`;
  const status = `<div style="position:absolute;inset:0 0 auto 0;height:${bar}px;display:flex;align-items:center;justify-content:space-between;padding:${pt(4)} ${pt(34)} 0 ${pt(52)};color:#000">
      <span style="font:600 ${pt(17)}/1 Inter;letter-spacing:${pt(-0.4)}">3:41</span>
      <span style="display:flex;align-items:center;gap:${pt(6)}">
        <svg width="${pt(18)}" height="${pt(12)}" viewBox="0 0 18 12"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>
        <svg width="${pt(16)}" height="${pt(12)}" viewBox="0 0 16 12"><path d="M8 11.5 5.6 9a3.4 3.4 0 0 1 4.8 0zM3.5 6.9a6.4 6.4 0 0 1 9 0l-1.4 1.4a4.4 4.4 0 0 0-6.2 0zM1.3 4.7a9.5 9.5 0 0 1 13.4 0l-1.4 1.4a7.5 7.5 0 0 0-10.6 0z"/></svg>
        <svg width="${pt(27)}" height="${pt(13)}" viewBox="0 0 27 13"><rect x=".5" y=".5" width="23" height="12" rx="3.5" fill="none" stroke="#000" opacity=".4"/><rect x="2" y="2" width="20" height="9" rx="2"/><path d="M25 4.5v4a2 2 0 0 0 0-4z" opacity=".4"/></svg>
      </span>
    </div>`;
  return `<div style="position:relative;width:${widthPx}px;height:${(852 + 2 * (BEZEL + EDGE)) * s}px">
    ${button("left", 118, 32)}${button("left", 176, 62)}${button("left", 250, 62)}${button("right", 208, 98)}${button("right", 520, 60, 2)}
    <div style="position:absolute;inset:0;border-radius:${pt(55 + BEZEL + EDGE)};background:linear-gradient(145deg,#4a4a4d,#1d1d1f 30%,#2c2c2e 70%,#58585c);padding:${pt(EDGE)};box-shadow:0 ${pt(30)} ${pt(70)} rgba(0,0,0,.38)">
      <div style="width:100%;height:100%;border-radius:${pt(55 + BEZEL)};background:#000;padding:${pt(BEZEL)}">
        <div style="position:relative;width:${screenW}px;height:${screenH}px;border-radius:${pt(55)};overflow:hidden;background:linear-gradient(${C.paper} ${footTop}px,${foot} 0)">
          <div style="position:absolute;top:${bar}px;left:${(screenW - imgW) / 2}px;width:${imgW}px;height:${(keepBottom - keepTop) * k}px;overflow:hidden">
            <img src="${cap(shot.cap)}" style="display:block;width:${imgW}px;height:${2408 * k}px;margin-top:${-keepTop * k}px">
          </div>
          ${status}
          <span style="position:absolute;top:${pt(11)};left:50%;transform:translateX(-50%);width:${pt(125)};height:${pt(37)};border-radius:${pt(20)};background:#000"></span>
          <span style="position:absolute;bottom:${pt(8)};left:50%;transform:translateX(-50%);width:${pt(134)};height:${pt(5)};border-radius:${pt(3)};background:#000"></span>
        </div>
      </div>
    </div>
  </div>`;
}

function featureHtml() {
  return `<div style="position:relative;width:1024px;height:500px;overflow:hidden;background:${C.ink};font-family:Inter">
  <div style="position:absolute;inset:0 0 0 38%;background:url(${photo("counter")}) center/cover"></div>
  <div style="position:absolute;inset:0;background:linear-gradient(90deg,${C.ink} 36%,rgba(24,18,12,.82) 52%,rgba(24,18,12,.05) 80%)"></div>
  <div style="position:absolute;left:64px;top:92px;width:520px;color:${C.paper}">
    <div style="font:800 15px/1 Inter;letter-spacing:3px;text-transform:uppercase;color:${C.accent}">Loyalty for local shops</div>
    <div style="margin-top:18px;font:800 54px/1.02 Sora;letter-spacing:-1.6px">One card for<br>every shop.</div>
    <div style="margin-top:20px;font:400 19px/1.45 Inter;color:rgba(250,248,243,.75)">Scan the poster, collect stamps, and approve your reward on your phone.</div>
    <div style="margin-top:30px;display:flex;gap:10px">${[1, 1, 1, 1, 1, 0, 0, 0].map((on) => `<span style="width:26px;height:26px;border-radius:50%;${on ? `background:${C.accent}` : `border:2px dashed rgba(250,248,243,.45)`}"></span>`).join("")}</div>
  </div>
</div>`;
}

export async function store(browser) {
  const out = (p) => join(here, p);
  await render(browser, { html: featureHtml(), width: 1024, height: 500, out: out("android/feature-graphic.png") });
  for (const [i, shot] of SHOTS.entries()) {
    const n = `${i + 1}-${shot.cap}`;
    await render(browser, { html: screenshotHtml(shot, 1080, 1920), width: 1080, height: 1920, out: out(`android/phone-${n}.png`) });
    await render(browser, { html: screenshotHtml(shot, 1320, 2868, "ios"), width: 1320, height: 2868, out: out(`ios/iphone-6.9-${n}.png`) });
    await render(browser, { html: screenshotHtml(shot, 1284, 2778, "ios"), width: 1284, height: 2778, out: out(`ios/iphone-6.5-${n}.png`) });
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const browser = await chromium.launch();
  const only = process.argv[2]; // "icons" or "store"; both when absent
  if (only !== "store") await icons(browser);
  if (only !== "icons") await store(browser);
  await browser.close();
}
