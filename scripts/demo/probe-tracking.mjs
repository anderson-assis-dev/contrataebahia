/**
 * Sonda isolada: descobre o que o servidor exige para aceitar o código de
 * chegada. Cria um pedido, aceita uma proposta, abre a sessão do prestador,
 * inicia o trajeto e consulta o endpoint de verificação a cada dois segundos,
 * imprimindo a resposta do servidor.
 *
 * Uso:  node probe-tracking.mjs
 */

import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');

const readEnv = (file) => {
  const out = {};
  if (!fs.existsSync(file)) return out;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return out;
};

const demo = readEnv(path.join(HERE, '.env.demo'));
const appEnv = readEnv(path.join(ROOT, '.env'));
const API = demo.API_URL || 'https://app.cotaja.io';
const BASE = process.env.DEMO_BASE_URL || 'http://localhost:53002';
const GATE = appEnv.REACT_APP_SITE_ACCESS_HASH || '';
const CODE = demo.PROVIDER_CODE || '0327';

const DEST = { latitude: -12.841659, longitude: -38.268025 };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const api = async (p, { token, method = 'GET', body, form } = {}) => {
  const h = { Accept: 'application/json' };
  if (token) h.Authorization = `Bearer ${token}`;
  let payload;
  if (form) {
    payload = new URLSearchParams(form);
    h['Content-Type'] = 'application/x-www-form-urlencoded';
  } else if (body) {
    payload = JSON.stringify(body);
    h['Content-Type'] = 'application/json';
  }
  const r = await fetch(API + p, { method, headers: h, body: payload });
  return { status: r.status, json: await r.json().catch(() => ({})) };
};

const login = async (email, password) =>
  (await api('/api/auth/login', { method: 'POST', body: { email, password } }))
    .json.data.token;

const main = async () => {
  const c = await login(demo.CLIENT_EMAIL, demo.CLIENT_PASSWORD);
  const p = await login(demo.PROVIDER_EMAIL, demo.PROVIDER_PASSWORD);

  console.log('criando pedido de sonda...');
  const ord = await api('/api/orders', {
    token: c, method: 'POST',
    form: {
      title: 'SONDA tecnica, apagar',
      category: 'Marcenaria',
      description: 'Pedido técnico para investigar a verificação de chegada.',
      budget: '100', deadline: '7',
      address: 'Travessa da Grama, 120, Nova Abrantes, Camaçari, BA',
      street: 'Travessa da Grama', number: '120', neighborhood: 'Nova Abrantes',
      city: 'Camaçari', state: 'BA', zip_code: '42826408',
      latitude: String(DEST.latitude), longitude: String(DEST.longitude),
    },
  });
  const order = ord.json.data?.order || ord.json.data;
  const orderId = order.id;
  console.log('  pedido', orderId);

  const prop = await api('/api/proposals', {
    token: p, method: 'POST',
    body: { order_id: orderId, price: 100, deadline: 7, description: 'sonda' },
  });
  const propId = (prop.json.data?.proposal || prop.json.data)?.id;
  console.log('  proposta', propId, prop.json.message || '');

  const acc = await api(`/api/proposals/${propId}/accept`, { token: c, method: 'POST' });
  console.log('  aceite:', acc.json.message || acc.status);

  console.log('\nantes de iniciar o trajeto:');
  let v = await api('/api/auth/verify-security-code', {
    token: c, method: 'POST', body: { order_id: orderId, code: CODE },
  });
  console.log('  ', v.status, v.json.message || JSON.stringify(v.json.data));

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 700, height: 920 },
    permissions: ['geolocation'],
    geolocation: { latitude: DEST.latitude - 0.02, longitude: DEST.longitude - 0.02 },
    locale: 'pt-BR',
  });
  if (GATE) {
    await ctx.addInitScript((h) => {
      try { sessionStorage.setItem('cb_site_gate', h); } catch (e) { /* vazio */ }
    }, GATE);
  }
  const page = await ctx.newPage();
  page.on('console', (m) => {
    if (m.type() === 'error') console.log('  [console]', m.text().slice(0, 120));
  });
  page.on('dialog', (d) => d.accept());

  await page.goto(`${BASE}/entrar`, { waitUntil: 'domcontentloaded' });
  await page.fill('#login-email', demo.PROVIDER_EMAIL);
  await page.fill('#login-pass', demo.PROVIDER_PASSWORD);
  await page.click('button.f-submit');
  await page.waitForURL('**/app**');

  await page.goto(`${BASE}/app/servicos/${orderId}/andamento`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('button[role="tab"]');
  await page.click('button[role="tab"]:has-text("Rastreio")');

  const start = page.locator('button.f-submit:has-text("Iniciar trajeto")');
  await start.waitFor({ state: 'visible', timeout: 30000 });
  for (let i = 0; i < 40 && await start.isDisabled(); i += 1) await wait(500);
  await start.click();
  console.log('\ntrajeto iniciado, aproximando e consultando o servidor:');

  for (let i = 0; i <= 10; i += 1) {
    const frac = i / 10;
    await ctx.setGeolocation({
      latitude: DEST.latitude - 0.02 * (1 - frac),
      longitude: DEST.longitude - 0.02 * (1 - frac),
    });
    await wait(2000);
    v = await api('/api/auth/verify-security-code', {
      token: c, method: 'POST', body: { order_id: orderId, code: CODE },
    });
    const km = (0.02 * (1 - frac) * 111).toFixed(2);
    console.log(`  ~${km} km -> ${v.status} ${v.json.message || JSON.stringify(v.json.data)}`);
    if (v.json?.data?.verified || v.status === 200) {
      const after = await api(`/api/orders/${orderId}`, { token: c });
      const o = after.json.data?.order || after.json.data;
      console.log('\n  campos do pedido depois da confirmação:');
      for (const k of ['status', 'arrival_confirmed_at', 'arrived_at',
        'provider_arrived_at', 'checkin_at', 'security_code_verified_at',
        'verified_at']) {
        if (k in o) console.log(`    ${k}: ${o[k]}`);
      }
      console.log('    chaves disponíveis:', Object.keys(o).filter((k) =>
        /arriv|verif|check|code/i.test(k)).join(', ') || '(nenhuma)');
      break;
    }
  }

  await ctx.close();
  await browser.close();

  console.log('\nlimpando: cancelando o pedido da sonda');
  const del = await api(`/api/orders/${orderId}/cancel`, {
    token: c, method: 'POST', body: { reason: 'Sonda técnica' },
  });
  console.log('  ', del.json.message || del.status);
};

main();
