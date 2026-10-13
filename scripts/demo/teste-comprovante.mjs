/**
 * Teste ponta a ponta em producao: publica um pedido, recebe proposta, aceita,
 * inicia o trajeto, confirma a chegada pelo codigo e conclui, conferindo a cada
 * passo o que o servidor gravou.
 *
 * Verifica as tres funcionalidades novas de uma vez: a chegada persistida, o
 * selo de verificado e a emissao do comprovante.
 *
 * Uso:  node teste-comprovante.mjs
 */

import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');

const lerEnv = (f) => {
    const o = {};
    if (!fs.existsSync(f)) return o;
    for (const l of fs.readFileSync(f, 'utf8').split('\n')) {
        const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
        if (m) o[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
    return o;
};

const demo = lerEnv(path.join(HERE, '.env.demo'));
const appEnv = lerEnv(path.join(ROOT, '.env'));
const API = demo.API_URL || 'https://app.cotaja.io';
const SITE = process.env.DEMO_SITE || 'https://contrataebahia.com.br';
const GATE = appEnv.REACT_APP_SITE_ACCESS_HASH || '';
const CODE = demo.PROVIDER_CODE || '0327';

const DEST = { latitude: -12.841659, longitude: -38.268025 };
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

const api = async (p, { token, method = 'GET', body, form } = {}) => {
    const h = { Accept: 'application/json' };
    if (token) h.Authorization = `Bearer ${token}`;
    let payload;
    if (form) { payload = new URLSearchParams(form); h['Content-Type'] = 'application/x-www-form-urlencoded'; }
    else if (body) { payload = JSON.stringify(body); h['Content-Type'] = 'application/json'; }
    const r = await fetch(API + p, { method, headers: h, body: payload });
    return { status: r.status, json: await r.json().catch(() => ({})) };
};

const login = async (email, senha) =>
    (await api('/api/auth/login', { method: 'POST', body: { email, password: senha } })).json.data.token;

const ok = (c) => (c ? '  ok  ' : ' FALHA');
let falhas = 0;
const checar = (cond, texto, detalhe = '') => {
    if (!cond) falhas += 1;
    console.log(`${ok(cond)} ${texto}${detalhe ? `  ${detalhe}` : ''}`);
};

const main = async () => {
    console.log(`API:  ${API}\nSite: ${SITE}\n`);
    const c = await login(demo.CLIENT_EMAIL, demo.CLIENT_PASSWORD);
    const p = await login(demo.PROVIDER_EMAIL, demo.PROVIDER_PASSWORD);

    console.log('1) publicando o pedido');
    const ord = await api('/api/orders', {
        token: c, method: 'POST',
        form: {
            title: 'Bancada de cozinha sob medida',
            category: 'Marcenaria',
            description: 'Banca em MDF com duas gavetas e porta de correr, 2,10 m de frente.',
            budget: '2600', deadline: '20',
            address: 'Travessa da Grama, 120, Nova Abrantes, Camaçari, BA',
            street: 'Travessa da Grama', number: '120', neighborhood: 'Nova Abrantes',
            city: 'Camaçari', state: 'BA', zip_code: '42826408',
            latitude: String(DEST.latitude), longitude: String(DEST.longitude),
        },
    });
    const order = ord.json.data?.order || ord.json.data;
    const id = order?.id;
    checar(!!id, 'pedido criado', `id ${id}`);
    if (!id) return;

    console.log('\n2) proposta e aceite');
    const prop = await api('/api/proposals', {
        token: p, method: 'POST',
        body: { order_id: id, price: 2380, deadline: 18, description: 'MDF 18 mm, ferragens Blum, montagem inclusa.' },
    });
    const propId = (prop.json.data?.proposal || prop.json.data)?.id;
    checar(!!propId, 'proposta enviada', `id ${propId}`);

    const aceite = await api(`/api/proposals/${propId}/accept`, { token: c, method: 'POST' });
    checar(aceite.json.success, 'proposta aceita');

    // o selo precisa chegar junto com a proposta, que e onde o cliente decide
    const comProposta = await api(`/api/orders/${id}`, { token: c });
    const o1 = comProposta.json.data?.order || comProposta.json.data;
    const pr = (o1.proposals || [])[0] || {};
    checar(Number(pr.provider_is_verified) === 1, 'selo de verificado chega na proposta',
        `provider_is_verified=${pr.provider_is_verified}`);

    console.log('\n3) prestador inicia o trajeto');
    const browser = await chromium.launch({ headless: true });
    const ctx = await browser.newContext({
        viewport: { width: 700, height: 920 }, locale: 'pt-BR',
        permissions: ['geolocation'],
        geolocation: { latitude: DEST.latitude - 0.02, longitude: DEST.longitude - 0.02 },
    });
    if (GATE) {
        await ctx.addInitScript((h) => {
            try { sessionStorage.setItem('cb_site_gate', h); } catch (e) { /* vazio */ }
        }, GATE);
    }
    const pg = await ctx.newPage();
    pg.on('dialog', (d) => d.accept());

    await pg.goto(`${SITE}/entrar`, { waitUntil: 'domcontentloaded' });
    await pg.fill('#login-email', demo.PROVIDER_EMAIL);
    await pg.fill('#login-pass', demo.PROVIDER_PASSWORD);
    await pg.click('button.f-submit');
    await pg.waitForURL('**/app**', { timeout: 45000 });

    await pg.goto(`${SITE}/app/servicos/${id}/andamento`, { waitUntil: 'domcontentloaded' });
    await pg.waitForSelector('button[role="tab"]', { timeout: 30000 });
    await pg.click('button[role="tab"]:has-text("Rastreio")');

    const SEL = 'button.f-submit:has-text("Iniciar trajeto"):not([disabled])';
    const pronto = await pg.waitForSelector(SEL, { timeout: 45000 }).then(() => true).catch(() => false);
    checar(pronto, 'socket de rastreio conectou');
    if (pronto) await pg.click(SEL);
    const iniciou = await pg.locator('button:has-text("Encerrar trajeto")')
        .waitFor({ state: 'visible', timeout: 20000 }).then(() => true).catch(() => false);
    checar(iniciou, 'trajeto iniciado');

    console.log('\n4) aproximando e confirmando a chegada pelo código');
    let verificado = null;
    for (let i = 0; i <= 10 && !verificado; i += 1) {
        const f = i / 10;
        await ctx.setGeolocation({
            latitude: DEST.latitude - 0.02 * (1 - f),
            longitude: DEST.longitude - 0.02 * (1 - f),
        });
        await espera(2000);
        const v = await api('/api/auth/verify-security-code', {
            token: c, method: 'POST', body: { order_id: id, code: CODE },
        });
        if (v.status === 200) verificado = v.json;
    }
    checar(!!verificado, 'código aceito pelo servidor',
        verificado ? `às ${verificado.data?.arrival_confirmed_at}` : '');
    checar(!!verificado?.data?.arrival_confirmed_at, 'resposta traz a data da confirmação');

    // o ponto que antes se perdia: a chegada tem de sobreviver a uma releitura
    const apos = await api(`/api/orders/${id}`, { token: c });
    const o2 = apos.json.data?.order || apos.json.data;
    checar(!!o2.arrival_confirmed_at, 'chegada PERSISTIDA no pedido',
        `arrival_confirmed_at=${o2.arrival_confirmed_at}`);
    checar(o2.arrival_confirmed_distance_km != null, 'distância da confirmação gravada',
        `${o2.arrival_confirmed_distance_km} km`);

    const repetido = await api('/api/auth/verify-security-code', {
        token: c, method: 'POST', body: { order_id: id, code: CODE },
    });
    checar(repetido.status === 200, 'repetir a verificação continua válido',
        `"${repetido.json.message}"`);

    await ctx.close();
    await browser.close();

    console.log('\n5) concluindo e emitindo o comprovante');
    const fim = await api(`/api/orders/${id}`, { token: c, method: 'PUT', body: { status: 'completed' } });
    const o3 = fim.json.data?.order || fim.json.data;
    checar(o3.status === 'completed', 'serviço concluído');
    checar(!!o3.receipt_code, 'comprovante emitido na conclusão', o3.receipt_code || '');

    const codigo = o3.receipt_code;
    const completo = await api(`/api/orders/${id}/receipt`, { token: c });
    checar(completo.json.success, 'comprovante completo para o cliente');
    checar(!!completo.json.data?.servico?.descricao, 'visão das partes traz a descrição');

    const publico = await api(`/api/receipts/${codigo}`);
    checar(publico.json.success, 'conferência pública pelo código');
    checar(publico.json.data?.servico?.descricao === null, 'visão pública omite a descrição');
    checar(publico.json.data?.chegada_validada_por_gps === true, 'comprovante mostra a chegada por GPS');
    checar(publico.json.data?.profissional?.verificado === true, 'comprovante mostra o selo de verificado');

    const alheio = await api(`/api/orders/${id}/receipt`, { token: p });
    checar(alheio.json.success, 'prestador também acessa o comprovante');

    console.log(`\ncomprovante: ${SITE}/comprovante/${codigo}`);
    console.log(JSON.stringify(publico.json.data, null, 1));
    console.log(falhas === 0 ? '\nTODAS AS VERIFICAÇÕES PASSARAM' : `\n${falhas} VERIFICAÇÃO(ÕES) FALHARAM`);
    fs.writeFileSync(path.join(HERE, 'ultimo-comprovante.txt'), `${codigo}\n${id}\n`);
};

main().catch((e) => { console.error('\nerro:', e.message); process.exit(1); });
