/**
 * Grava o fluxo completo do Contrataê Bahia, do pedido à avaliação.
 *
 * Abre duas sessões simultâneas, cliente e prestador, e mantém as duas
 * gravando do início ao fim, de modo que a reação de um lado à ação do outro
 * apareça em tempo real no vídeo final.
 *
 * Uso:  pnpm record
 */

import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const RAW = path.join(HERE, 'raw');

/* ------------------------------------------------------------- configuração */
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

const BASE = process.env.DEMO_BASE_URL || 'http://localhost:53002';
const GATE = appEnv.REACT_APP_SITE_ACCESS_HASH || '';
const SIZE = { width: 700, height: 920 };
const PROVIDER_CODE = demo.PROVIDER_CODE || '0327';

// Endereço do serviço e trajeto do prestador até lá, em Camaçari.
const DEST = { latitude: -12.841659, longitude: -38.268025 };
const ROUTE = [
  { latitude: -12.8760, longitude: -38.2985 },
  { latitude: -12.8690, longitude: -38.2910 },
  { latitude: -12.8615, longitude: -38.2840 },
  { latitude: -12.8545, longitude: -38.2770 },
  { latitude: -12.8490, longitude: -38.2725 },
  { latitude: -12.8450, longitude: -38.2700 },
  { latitude: -12.8428, longitude: -38.2686 },
  { latitude: -12.84175, longitude: -38.26805 },
];

const ORDER = {
  title: 'Guarda-roupa planejado para quarto de casal',
  category: 'Marcenaria',
  description:
    'Preciso de um guarda-roupa planejado de seis portas, com gavetas internas e '
    + 'espelho em uma das portas. O quarto tem 3,20 m de parede livre e pé-direito '
    + 'de 2,70 m. Aceito sugestão de material e acabamento.',
  budget: '480000', // digitado, o campo formata para R$ 4.800,00
  deadline: '30',
  zip: '42826408',
  number: '120',
  complement: 'Casa 2',
};

const PROPOSAL = {
  price: '445000', // R$ 4.450,00
  days: '25',
  description:
    'Guarda-roupa em MDF 18 mm, seis portas, puxador perfil alumínio, corrediças '
    + 'telescópicas e espelho bisotado. Valor com material, montagem e garantia de '
    + 'doze meses. Entrada de 40% e saldo na entrega.',
};

/* ------------------------------------------------------------------ utilidades */
const t0 = Date.now();
const timeline = [];
const log = (side, text) => {
  const t = (Date.now() - t0) / 1000;
  timeline.push({ t: Number(t.toFixed(2)), side, text });
  console.log(`[${String(t.toFixed(1)).padStart(6)}s] ${side.padEnd(9)} ${text}`);
};

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/** Digita devagar, para o vídeo parecer uso real e não preenchimento automático. */
const typeSlow = async (page, selector, value, delay = 55) => {
  const loc = page.locator(selector).first();
  await loc.waitFor({ state: 'visible', timeout: 30000 });
  // a tabbar fixa cobre o rodapé, então o campo vai para o centro da tela
  await loc.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await wait(250);
  await loc.click({ timeout: 20000 });
  await loc.fill('');
  await loc.pressSequentially(value, { delay, timeout: 60000 });
};

/** Centraliza o alvo antes de clicar: a tabbar fixa cobre o rodapé da página. */
const clickSafe = async (page, target, timeout = 25000) => {
  const loc = typeof target === 'string' ? page.locator(target).first() : target.first();
  await loc.waitFor({ state: 'visible', timeout });
  await loc.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await wait(350);
  await loc.click({ timeout });
};

/** Esconde dados de terceiros que não devem aparecer no vídeo. */
const hideOthers = async (page, keepHref) => {
  await page.addStyleTag({
    content: `
      a[href^="/app/demandas/"]:not([href="${keepHref}"]),
      a[href^="/app/pedidos/"]:not([href="${keepHref}"]):not([href$="/novo"]) {
        display: none !important;
      }
    `,
  });
};

const ctxFor = async (browser, name) => {
  const context = await browser.newContext({
    viewport: SIZE,
    recordVideo: { dir: RAW, size: SIZE },
    locale: 'pt-BR',
    timezoneId: 'America/Bahia',
    permissions: ['geolocation'],
    geolocation: name === 'prestador' ? ROUTE[0] : DEST,
    colorScheme: 'light',
    deviceScaleFactor: 2,
  });
  if (GATE) {
    await context.addInitScript((hash) => {
      try { sessionStorage.setItem('cb_site_gate', hash); } catch (e) { /* vazio */ }
    }, GATE);
  }
  const page = await context.newPage();
  page.on('dialog', (d) => d.accept());
  page.setDefaultTimeout(45000);
  return { context, page, name };
};

const login = async ({ page, name }, email, password) => {
  await page.goto(`${BASE}/entrar`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#login-email');
  await wait(900);
  await typeSlow(page, '#login-email', email, 35);
  await typeSlow(page, '#login-pass', password, 70);
  await wait(500);
  await page.click('button.f-submit');
  await page.waitForURL('**/app**', { timeout: 45000 });
  log(name, 'sessão iniciada');
  await wait(1200);
};

/* ------------------------------------------------------------------- roteiro */
async function main() {
  fs.rmSync(RAW, { recursive: true, force: true });
  fs.mkdirSync(RAW, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    args: ['--force-color-profile=srgb', '--font-render-hinting=none'],
  });

  const cliente = await ctxFor(browser, 'cliente');
  const prestador = await ctxFor(browser, 'prestador');

  try {
    log('cena', 'abertura, duas sessões lado a lado');
    await Promise.all([
      login(cliente, demo.CLIENT_EMAIL, demo.CLIENT_PASSWORD),
      login(prestador, demo.PROVIDER_EMAIL, demo.PROVIDER_PASSWORD),
    ]);

    /* 1. o cidadão publica o pedido -------------------------------------- */
    log('cena', 'o cidadão publica o pedido');
    // o prestador fica na home enquanto isso: a lista de demandas carrega
    // centenas de KB de anexos em base64 e disputa banda com o formulário
    const c = cliente.page;
    await c.goto(`${BASE}/app/pedidos/novo`, { waitUntil: 'domcontentloaded' });
    await c.waitForSelector('#co-title');
    await wait(900);

    await typeSlow(c, '#co-title', ORDER.title, 28);
    await c.selectOption('#co-category', ORDER.category);
    await wait(400);
    await typeSlow(c, '#co-desc', ORDER.description, 9);
    await typeSlow(c, '#co-budget', ORDER.budget, 60);
    await typeSlow(c, '#co-deadline', ORDER.deadline, 90);
    log('cliente', 'descreve o serviço, categoria e orçamento de referência');

    await typeSlow(c, '#co-cep', ORDER.zip, 70);
    await wait(2200); // busca do CEP preenche rua, bairro, cidade e estado
    await typeSlow(c, '#co-number', ORDER.number, 90);
    await typeSlow(c, '#co-complement', ORDER.complement, 70);
    log('cliente', 'informa o endereço, preenchido pelo CEP');
    await wait(1200);

    await clickSafe(c, 'form button.f-submit');
    await c.waitForURL(/\/app\/pedidos\/\d+$/, { timeout: 45000 });
    const orderId = c.url().match(/\/app\/pedidos\/(\d+)$/)[1];
    log('cliente', `pedido publicado, número ${orderId}`);
    await wait(1800);

    /* 2. o prestador recebe a demanda ------------------------------------ */
    log('cena', 'a demanda chega ao profissional');
    const p = prestador.page;
    // a lista de demandas vem com os anexos em base64, então o payload é
    // pesado e a renderização demora; vale esperar mais e tentar de novo
    const card = `a[href="/app/demandas/${orderId}"]`;
    let listed = false;
    for (let attempt = 0; attempt < 3 && !listed; attempt += 1) {
      await p.goto(`${BASE}/app/demandas`, { waitUntil: 'domcontentloaded' });
      listed = await p.waitForSelector(card, { timeout: 60000 })
        .then(() => true).catch(() => false);
      if (!listed) log('prestador', 'lista de demandas demorou, recarregando');
    }
    if (!listed) throw new Error('a demanda não apareceu na lista do prestador');
    await hideOthers(p, `/app/demandas/${orderId}`);
    log('prestador', 'recebe a demanda na sua categoria e região');
    await wait(2200);

    await clickSafe(p, `a[href="/app/demandas/${orderId}"]`);
    await p.waitForSelector('#sp-price');
    await wait(1600);

    /* 3. proposta --------------------------------------------------------- */
    log('cena', 'o profissional envia a proposta');
    await typeSlow(p, '#sp-price', PROPOSAL.price, 60);
    await typeSlow(p, '#sp-deadline', PROPOSAL.days, 90);
    await typeSlow(p, '#sp-desc', PROPOSAL.description, 9);
    await wait(900);
    await clickSafe(p, 'form button.f-submit');
    await wait(2500);
    log('prestador', 'proposta enviada com preço, prazo e escopo');

    /* 4. o cidadão compara e aceita --------------------------------------- */
    log('cena', 'o cidadão compara e aceita');
    await c.goto(`${BASE}/app/pedidos/${orderId}`, { waitUntil: 'domcontentloaded' });
    await c.waitForSelector('.prop-card', { timeout: 60000 });
    log('cliente', 'vê a proposta com preço, prazo e reputação');
    await wait(2600);

    await clickSafe(c, '.prop-accept');
    await c.waitForURL(/\/andamento$/, { timeout: 45000 });
    log('cliente', 'aceita a proposta, o pedido sai do leilão');
    await wait(2200);

    /* 5. agendamento ------------------------------------------------------ */
    log('cena', 'agendamento combinado entre as duas partes');
    await p.goto(`${BASE}/app/servicos/${orderId}/andamento`, { waitUntil: 'domcontentloaded' });
    await c.waitForSelector('button[role="tab"]', { timeout: 30000 });
    await p.waitForSelector('button[role="tab"]', { timeout: 30000 });
    await wait(1600);

    await p.click('button[role="tab"]:has-text("Agendamento")');
    await wait(900);
    const propose = p.locator('button.f-ghost:has-text("Propor")').first();
    if (await propose.count()) {
      await propose.click();
      await wait(600);
      const when = new Date(Date.now() + 2 * 864e5);
      when.setHours(9, 0, 0, 0);
      const pad = (n) => String(n).padStart(2, '0');
      const local = `${when.getFullYear()}-${pad(when.getMonth() + 1)}-${pad(when.getDate())}`
        + `T${pad(when.getHours())}:${pad(when.getMinutes())}`;
      await p.fill('#sched-when', local);
      await wait(700);
      await clickSafe(p, 'form button.f-submit');
      log('prestador', 'propõe data e hora para o serviço');
      await wait(2200);
    }

    await c.reload({ waitUntil: 'domcontentloaded' });
    await c.waitForSelector('button[role="tab"]', { timeout: 30000 });
    await c.click('button[role="tab"]:has-text("Agendamento")');
    await wait(1400);
    let confirmed = false;
    for (let attempt = 0; attempt < 2 && !confirmed; attempt += 1) {
      if (attempt > 0) {
        await c.reload({ waitUntil: 'domcontentloaded' });
        await c.waitForSelector('button[role="tab"]', { timeout: 20000 });
        await c.click('button[role="tab"]:has-text("Agendamento")');
        await wait(1600);
      }
      const confirm = c.locator('button.f-submit:has-text("Confirmar")').first();
      if (await confirm.count()) {
        await clickSafe(c, confirm).catch(() => {});
        await wait(2000);
        confirmed = true;
      } else {
        await wait(1800);
      }
    }
    if (confirmed) log('cliente', 'confirma o agendamento');
    else log('cliente', 'AVISO: botão de confirmar agendamento não apareceu');

    /* 6. rastreio --------------------------------------------------------- */
    log('cena', 'o profissional inicia o trajeto');
    await c.click('button[role="tab"]:has-text("Rastreio")');
    await p.click('button[role="tab"]:has-text("Rastreio")');
    await wait(1500);

    // startSharing só emite join-order se o socket já estiver conectado, e o
    // botão fica desabilitado justamente enquanto não está. Clicar antes disso
    // inicia o watchPosition sem avisar o servidor, e a verificação de chegada
    // depois é recusada. Então aqui o clique só acontece com o botão habilitado.
    const SEL = 'button.f-submit:has-text("Iniciar trajeto"):not([disabled])';
    let started = false;
    for (let attempt = 0; attempt < 3 && !started; attempt += 1) {
      if (attempt > 0) {
        log('prestador', 'socket de rastreio ainda não conectou, recarregando');
        await p.reload({ waitUntil: 'domcontentloaded' });
        await p.waitForSelector('button[role="tab"]', { timeout: 20000 });
        await p.click('button[role="tab"]:has-text("Rastreio")');
        await wait(1200);
      }
      const ready = await p.waitForSelector(SEL, { timeout: 40000 })
        .then(() => true).catch(() => false);
      if (!ready) continue;
      await clickSafe(p, SEL, 12000).catch(() => {});
      started = await p.locator('button:has-text("Encerrar trajeto")')
        .waitFor({ state: 'visible', timeout: 20000 })
        .then(() => true).catch(() => false);
    }
    if (!started) {
      throw new Error('o socket de rastreio não conectou, trajeto não iniciado');
    }
    log('prestador', 'inicia o trajeto e compartilha a posição');
    await wait(2500);

    for (const point of ROUTE) {
      await prestador.context.setGeolocation(point);
      await wait(1600);
    }
    log('cliente', 'acompanha o profissional a caminho, no mapa');
    await wait(2500);

    /* 7. confirmação por código ------------------------------------------- */
    log('cena', 'chegada confirmada por código, com validação de proximidade');

    // o servidor só aceita o código com o rastreio ativo e recente, então a
    // posição do prestador continua sendo atualizada durante esta etapa
    let jitter = 0;
    const keepAlive = setInterval(() => {
      jitter += 1;
      prestador.context.setGeolocation({
        latitude: DEST.latitude + (jitter % 2 ? 0.00018 : -0.00018),
        longitude: DEST.longitude + (jitter % 2 ? -0.00018 : 0.00018),
      }).catch(() => {});
    }, 1500);

    try {
      await c.reload({ waitUntil: 'domcontentloaded' });
      await c.waitForSelector('button[role="tab"]', { timeout: 30000 });
      await c.click('button[role="tab"]:has-text("Detalhes")');
      await wait(1400);
      await c.waitForSelector('#sec-code', { timeout: 30000 });
      await c.locator('#sec-code').scrollIntoViewIfNeeded();
      await wait(600);
      await c.evaluate(() => window.scrollBy(0, 120));
      await wait(1200);
      await typeSlow(c, '#sec-code', PROVIDER_CODE, 320);
      await wait(900);
      await clickSafe(c, 'form:has(#sec-code) button.f-submit');

      const ok = c.locator('.f-alert-ok');
      const err = c.locator('.f-alert-err');
      await Promise.race([
        ok.waitFor({ state: 'visible', timeout: 25000 }),
        err.waitFor({ state: 'visible', timeout: 25000 }),
      ]).catch(() => {});

      if (await ok.count()) {
        // mantém o aviso de sucesso em quadro, é o momento que vende o recurso
        await ok.scrollIntoViewIfNeeded();
        await wait(3200);
        log('cliente', 'informa o código do profissional e confirma a chegada');
      } else {
        const msg = await err.first().innerText().catch(() => '(sem mensagem)');
        await wait(1500);
        log('cliente', `CÓDIGO RECUSADO: ${msg.replace(/\s+/g, ' ').slice(0, 110)}`);
      }
    } finally {
      clearInterval(keepAlive);
    }

    /* 8. conclusão e avaliação -------------------------------------------- */
    log('cena', 'serviço concluído e avaliado');
    const done = c.locator('button.f-submit:has-text("Marcar como concluído")').first();
    if (await done.count()) {
      await done.scrollIntoViewIfNeeded();
      await wait(800);
      await clickSafe(c, done);
      await wait(2800);
      log('cliente', 'marca o serviço como concluído');

      // com o pedido concluído a linha do tempo fecha das duas pontas, então
      // vale recarregar o lado do prestador e deixar o status em quadro
      await p.reload({ waitUntil: 'domcontentloaded' });
      await p.waitForSelector('.timeline-label', { timeout: 30000 }).catch(() => {});
      await p.evaluate(() => window.scrollTo({ top: 0 }));
      await wait(3600);
      log('prestador', 'linha do tempo fechada nos dois lados');
    }

    await c.waitForSelector('a[href^="/app/avaliar/"]', { timeout: 25000 })
      .catch(() => {});
    const rate = c.locator('a[href^="/app/avaliar/"]').first();
    if (await rate.count()) {
      await rate.click();
      await c.waitForSelector('.rate-star');
      await wait(1200);
      await clickSafe(c, c.locator('.rate-star').nth(4));
      await wait(800);
      await typeSlow(c, '#rate-comment', 'Pontual, caprichoso no acabamento e entregou no prazo combinado.', 26);
      await wait(900);
      await clickSafe(c, 'form button.f-submit');
      await wait(2800);
      log('cliente', 'avalia o profissional, fechando o ciclo');
    }

    log('cena', 'fim do fluxo');
    await wait(2500);
    fs.writeFileSync(path.join(HERE, 'steps.json'),
      JSON.stringify({ orderId, timeline }, null, 2));
  } catch (err) {
    console.error('\nFALHOU:', err.message);
    for (const s of [cliente, prestador]) {
      await s.page.screenshot({ path: path.join(RAW, `erro-${s.name}.png`) }).catch(() => {});
    }
    fs.writeFileSync(path.join(HERE, 'steps.json'),
      JSON.stringify({ erro: err.message, timeline }, null, 2));
    process.exitCode = 1;
  } finally {
    const out = {};
    for (const s of [cliente, prestador]) {
      const file = await s.page.video()?.path();
      await s.context.close();
      if (file) out[s.name] = file;
    }
    await browser.close();
    for (const [name, file] of Object.entries(out)) {
      const dest = path.join(RAW, `${name}.webm`);
      if (fs.existsSync(file)) fs.renameSync(file, dest);
      console.log(`vídeo ${name}: ${dest}`);
    }
  }
}

main();
