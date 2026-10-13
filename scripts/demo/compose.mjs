/**
 * Monta o vídeo final a partir das duas gravações.
 *
 * Este ffmpeg não traz drawtext nem libass, então os textos são renderizados
 * pelo próprio Chromium do Playwright, com as fontes da marca, e depois
 * sobrepostos como imagens. O resultado tem tipografia melhor do que drawtext
 * daria.
 *
 * Uso:  pnpm compose
 */

import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const RAW = path.join(HERE, 'raw');
const OUT = path.join(HERE, 'out');
const OVL = path.join(OUT, 'overlays');

/* ------------------------------------------------------------------ layout */
const W = 1920;
const H = 1080;
const PANEL = { w: 660, h: 868, y: 62 };
const GAP = 100;
const LX = Math.round((W - (PANEL.w * 2 + GAP)) / 2);
const RX = LX + PANEL.w + GAP;
const CAP = { y: 950, h: 130 };

const BRAND = {
  deep: '#071C4D',
  blue: '#123FAE',
  soft: '#93A9E8',
  line: 'rgba(147,169,232,.28)',
  red: '#E31E24',
};

// o Chromium bloqueia file:// numa página criada por setContent, então o logo
// entra embutido como data URI
const LOGO_URL = 'data:image/png;base64,'
  + fs.readFileSync(path.join(HERE, 'assets', 'contrataebahia-logo.png')).toString('base64');

const FONTS = 'https://fonts.googleapis.com/css2'
  + '?family=Poppins:wght@600;700&family=Inter:wght@400;600&display=swap';

/* ----------------------------------------------------------------- helpers */
const probe = (file) =>
  Number(execFileSync('ffprobe', [
    '-v', 'error', '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1', file,
  ]).toString().trim());

const esc = (s) => String(s).replace(/[&<>]/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

const chromeHtml = () => `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<link rel="stylesheet" href="${FONTS}">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:${W}px;height:${H}px;background:${BRAND.deep};
       font-family:Inter,sans-serif;overflow:hidden;position:relative}
  .glow{position:absolute;width:1100px;height:1100px;border-radius:50%;
        background:radial-gradient(circle,rgba(18,63,174,.42) 0%,rgba(7,28,77,0) 68%);
        left:-220px;top:-340px}
  .glow2{position:absolute;width:900px;height:900px;border-radius:50%;
         background:radial-gradient(circle,rgba(227,30,36,.17) 0%,rgba(7,28,77,0) 70%);
         right:-260px;bottom:-320px}
  .slot{position:absolute;top:${PANEL.y - 10}px;width:${PANEL.w + 20}px;
        height:${PANEL.h + 20}px;border-radius:22px;border:1px solid ${BRAND.line};
        background:rgba(255,255,255,.04)}
  .lbl{position:absolute;top:20px;width:${PANEL.w}px;text-align:center;
       font-family:Poppins,sans-serif;font-weight:700;font-size:19px;
       letter-spacing:3px;color:${BRAND.soft};text-transform:uppercase}
  .mark{position:absolute;top:22px;left:48px;display:flex;align-items:center;gap:11px}
  .mark b{font-family:Poppins,sans-serif;font-weight:700;font-size:19px;color:#fff;
          letter-spacing:.2px}
  .dot{width:11px;height:11px;border-radius:50%;background:${BRAND.red}}
  .site{position:absolute;top:26px;right:48px;font-size:15px;
        color:${BRAND.soft};opacity:.75;letter-spacing:.4px}
  .bar{position:absolute;left:0;top:${CAP.y}px;width:${W}px;height:${CAP.h}px;
       background:linear-gradient(180deg,rgba(7,28,77,0) 0%,${BRAND.deep} 38%)}
</style></head><body>
  <div class="glow"></div><div class="glow2"></div>
  <div class="slot" style="left:${LX - 10}px"></div>
  <div class="slot" style="left:${RX - 10}px"></div>
  <div class="mark"><span class="dot"></span><b>Contrataê Bahia</b></div>
  <div class="site">contrataebahia.com.br</div>
  <div class="lbl" style="left:${LX}px">Cliente</div>
  <div class="lbl" style="left:${RX}px">Prestador</div>
  <div class="bar"></div>
</body></html>`;

const fechoHtml = () => `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<link rel="stylesheet" href="${FONTS}">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:${W}px;height:${H}px;background:${BRAND.deep};overflow:hidden;
       position:relative;font-family:Inter,sans-serif;display:flex;
       flex-direction:column;align-items:center;justify-content:center;gap:54px}
  .glow{position:absolute;width:1100px;height:1100px;border-radius:50%;
        background:radial-gradient(circle,rgba(18,63,174,.42) 0%,rgba(7,28,77,0) 68%);
        left:-220px;top:-340px}
  .glow2{position:absolute;width:900px;height:900px;border-radius:50%;
         background:radial-gradient(circle,rgba(227,30,36,.17) 0%,rgba(7,28,77,0) 70%);
         right:-260px;bottom:-320px}
  .card{position:relative;background:#fff;border-radius:26px;padding:40px 58px;
        box-shadow:0 30px 80px rgba(0,0,0,.28)}
  .card img{display:block;height:132px;width:auto}
  .slogan{position:relative;font-family:Poppins,sans-serif;font-weight:700;
          font-size:52px;color:#fff;letter-spacing:-.6px;text-align:center;
          max-width:1380px;line-height:1.24}
  .slogan b{color:${BRAND.soft};font-weight:700}
  .site{position:absolute;bottom:62px;left:0;width:100%;text-align:center;
        font-size:21px;color:${BRAND.soft};letter-spacing:.6px}
</style></head><body>
  <div class="glow"></div><div class="glow2"></div>
  <div class="card"><img src="${LOGO_URL}" alt=""></div>
  <div class="slogan">Conectando quem precisa<br><b>a quem faz acontecer</b></div>
  <div class="site">contrataebahia.com.br</div>
</body></html>`;

const captionHtml = (n, text) => `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<link rel="stylesheet" href="${FONTS}">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:${W}px;height:${CAP.h}px;background:transparent;
       display:flex;align-items:center;justify-content:center;gap:20px;
       font-family:Poppins,sans-serif}
  .n{flex:none;width:44px;height:44px;border-radius:50%;background:${BRAND.red};
     color:#fff;font-weight:700;font-size:20px;display:flex;align-items:center;
     justify-content:center}
  .t{font-weight:600;font-size:36px;color:#fff;letter-spacing:-.3px;
     max-width:1500px;text-align:left}
</style></head><body>
  <div class="n">${n}</div><div class="t">${esc(text)}</div>
</body></html>`;

/* -------------------------------------------------------------------- main */
const left = path.join(RAW, 'cliente.webm');
const right = path.join(RAW, 'prestador.webm');
for (const f of [left, right]) {
  if (!fs.existsSync(f)) {
    console.error(`faltando ${path.basename(f)}. Rode "pnpm record" antes.`);
    process.exit(1);
  }
}

const steps = JSON.parse(fs.readFileSync(path.join(HERE, 'steps.json'), 'utf8'));
const scenes = (steps.timeline || []).filter((s) => s.side === 'cena');
if (!scenes.length) {
  console.error('steps.json não tem cenas. A gravação falhou?');
  process.exit(1);
}

const dur = Math.max(probe(left), probe(right));
const TAIL = 6;          // segundos de cartela de fechamento
const total = dur + TAIL;
const caps = scenes.map((s, i) => ({
  n: i + 1,
  from: Math.max(0, s.t - 0.5),
  to: i + 1 < scenes.length ? Math.max(0, scenes[i + 1].t - 0.5) : dur,
  text: s.text.charAt(0).toUpperCase() + s.text.slice(1),
}));

fs.rmSync(OVL, { recursive: true, force: true });
fs.mkdirSync(OVL, { recursive: true });

console.log(`renderizando ${caps.length + 1} sobreposições...`);
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: W, height: H },
  deviceScaleFactor: 1 });

await page.setContent(chromeHtml(), { waitUntil: 'networkidle' });
await page.screenshot({ path: path.join(OVL, 'chrome.png') });

await page.setContent(fechoHtml(), { waitUntil: 'networkidle' });
await page.screenshot({ path: path.join(OVL, 'fecho.png') });

await page.setViewportSize({ width: W, height: CAP.h });
for (const c of caps) {
  await page.setContent(captionHtml(c.n, c.text), { waitUntil: 'networkidle' });
  await page.screenshot({
    path: path.join(OVL, `cap-${String(c.n).padStart(2, '0')}.png`),
    omitBackground: true,
  });
}
await browser.close();

/* --------------------------------------------------------------- montagem */
const inputs = [
  '-loop', '1', '-t', total.toFixed(2), '-i', path.join(OVL, 'chrome.png'),
  '-i', left,
  '-i', right,
];
caps.forEach((c) => {
  inputs.push('-loop', '1', '-t', total.toFixed(2),
    '-i', path.join(OVL, `cap-${String(c.n).padStart(2, '0')}.png`));
});
inputs.push('-loop', '1', '-t', total.toFixed(2), '-i', path.join(OVL, 'fecho.png'));

const f = [
  '[0:v]setsar=1[bg]',
  `[1:v]scale=${PANEL.w}:${PANEL.h}:flags=lanczos,setsar=1[l]`,
  `[2:v]scale=${PANEL.w}:${PANEL.h}:flags=lanczos,setsar=1[r]`,
  `[bg][l]overlay=${LX}:${PANEL.y}:eof_action=pass[a]`,
  `[a][r]overlay=${RX}:${PANEL.y}:eof_action=pass[s0]`,
];
caps.forEach((c, i) => {
  f.push(`[s${i}][${i + 3}:v]overlay=0:${CAP.y}`
    + `:enable='between(t,${c.from.toFixed(2)},${c.to.toFixed(2)})'`
    + `:eof_action=pass[s${i + 1}]`);
});
f.push(`[s${caps.length}][${caps.length + 3}:v]overlay=0:0`
  + `:enable='gte(t,${dur.toFixed(2)})':eof_action=pass[sf]`);
f.push('[sf]format=yuv420p[v]');

fs.mkdirSync(OUT, { recursive: true });
const dest = path.join(OUT, process.argv[2] || 'contratae-bahia-fluxo-completo.mp4');

console.log(`compondo ${dur.toFixed(1)}s + ${TAIL}s de fecho, ${caps.length} legendas...`);
execFileSync('ffmpeg', [
  '-y', ...inputs,
  '-filter_complex', f.join(';'),
  '-map', '[v]',
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '19',
  '-pix_fmt', 'yuv420p', '-r', '30', '-movflags', '+faststart',
  '-t', total.toFixed(2),
  dest,
], { stdio: ['ignore', 'ignore', 'inherit'] });

console.log(`pronto: ${dest}`);
