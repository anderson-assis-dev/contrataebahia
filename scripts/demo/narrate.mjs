/**
 * Gera a locução em português e aplica sobre o vídeo já composto.
 *
 * Usa a síntese de voz do próprio macOS, então não depende de serviço externo
 * nem de chave de API. Cada bloco é dimensionado para a janela da sua cena, e
 * o script reduz a velocidade da fala quando sobra tempo ou acelera quando
 * falta, de modo que a narração nunca invada a cena seguinte.
 *
 * Uso:  node narrate.mjs [entrada.mp4] [saida.mp4]
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, 'out');
const VOZ = path.join(OUT, 'voz');

const VOICE = process.env.DEMO_VOICE || 'Luciana';
const BASE_RATE = 176;        // palavras por minuto, ponto de partida
const TAIL = 6;               // duração da cartela de fechamento
const GAP = 0.55;             // respiro no fim de cada bloco

const IN = process.argv[2] || path.join(OUT, 'contratae-bahia-fluxo-completo-v2.mp4');
const DEST = process.argv[3] || path.join(OUT, 'contratae-bahia-fluxo-completo-v2-locucao.mp4');

/* ------------------------------------------------------------------ texto */
// Um bloco por cena, na ordem. O último entra sobre a cartela de fechamento.
const FALAS = [
  'O Contrataê Bahia em operação. À esquerda o cidadão, à direita o '
  + 'profissional, ao vivo.',

  'O cidadão descreve o serviço que precisa, escolhe a categoria e informa um '
  + 'orçamento de referência. O endereço é preenchido pelo CEP, e a localização '
  + 'fica registrada para o cálculo de distância. Publicar o pedido não custa nada.',

  'No mesmo instante a demanda chega ao profissional que atende aquela '
  + 'categoria naquela região. Ele não precisa procurar cliente.',

  'Ele responde com preço, prazo e o escopo do que está incluso no serviço.',

  'Aqui está a diferença. O cidadão vê as propostas lado a lado, com preço, '
  + 'prazo e reputação, e escolhe com informação na mão.',

  'As duas partes combinam data e hora dentro da plataforma. O profissional '
  + 'propõe, o cidadão confirma, e o agendamento fica registrado com lembrete '
  + 'automático. Nada fica combinado apenas por mensagem.',

  'Quando sai para o serviço, o profissional compartilha a posição. O trajeto '
  + 'aparece em tempo real nas duas telas. O cidadão acompanha a aproximação no '
  + 'mapa e sabe exatamente quando esperar. Nenhuma alternativa disponível hoje '
  + 'na Bahia oferece isso.',

  'Esta é a camada de segurança. O profissional informa um código pessoal, e o '
  + 'sistema só aceita a confirmação com o rastreio ativo e ele a menos de três '
  + 'quilômetros do endereço.',

  'Concluído o serviço, a linha do tempo fecha nos dois lados, e o cidadão '
  + 'avalia o profissional. A nota fica vinculada a um serviço efetivamente '
  + 'realizado, e é ela que alimenta a reputação usada na próxima comparação.',

  'Todo esse fluxo já está em produção, com usuários reais. A proposta é '
  + 'colocá-lo dentro do canal que o cidadão baiano já utiliza.',

  'Contrataê Bahia. Conectando quem precisa a quem faz acontecer.',
];

/* --------------------------------------------------------------- utilidades */
const probe = (f) => Number(execFileSync('ffprobe', [
  '-v', 'error', '-show_entries', 'format=duration',
  '-of', 'default=nw=1:nk=1', f,
]).toString().trim());

const diga = (texto, rate, destino) => {
  // WAV com amostras little endian: AIFF exigiria big endian e o say recusa
  execFileSync('say', ['-v', VOICE, '-r', String(Math.round(rate)),
    '-o', destino, '--data-format=LEI16@22050', '--file-format=WAVE', texto]);
};

/* -------------------------------------------------------------------- main */
if (!fs.existsSync(IN)) {
  console.error(`faltando ${IN}. Rode "pnpm compose" antes.`);
  process.exit(1);
}

const steps = JSON.parse(fs.readFileSync(path.join(HERE, 'steps.json'), 'utf8'));
const cenas = (steps.timeline || []).filter((s) => s.side === 'cena');
const total = probe(IN);
const fimDoFluxo = total - TAIL;

// janela de cada bloco: da cena até a seguinte, e a última sobre a cartela
const janelas = cenas.map((c, i) => ({
  inicio: c.t,
  fim: i + 1 < cenas.length ? cenas[i + 1].t : fimDoFluxo,
}));
janelas.push({ inicio: fimDoFluxo + 0.4, fim: total - 0.3 });

if (FALAS.length !== janelas.length) {
  console.error(`o roteiro tem ${FALAS.length} blocos e o vídeo tem `
    + `${janelas.length} janelas. Ajuste FALAS em narrate.mjs.`);
  process.exit(1);
}

fs.rmSync(VOZ, { recursive: true, force: true });
fs.mkdirSync(VOZ, { recursive: true });

console.log(`voz ${VOICE}, ${FALAS.length} blocos\n`);
const clipes = [];

FALAS.forEach((texto, i) => {
  const { inicio, fim } = janelas[i];
  const alvo = Math.max(1.5, fim - inicio - GAP);
  const arq = path.join(VOZ, `fala-${String(i + 1).padStart(2, '0')}.wav`);

  let rate = BASE_RATE;
  diga(texto, rate, arq);
  let dur = probe(arq);

  // duas correções bastam para encaixar na janela sem soar atropelado
  for (let tentativa = 0; tentativa < 2 && Math.abs(dur - alvo) > 0.45; tentativa += 1) {
    rate = Math.min(235, Math.max(140, rate * (dur / alvo)));
    diga(texto, rate, arq);
    dur = probe(arq);
  }

  const folga = (fim - inicio) - dur;
  const aviso = folga < 0 ? '  <<< ESTOURA' : '';
  console.log(`  ${String(i + 1).padStart(2)} | ${inicio.toFixed(1).padStart(6)}s`
    + ` janela ${(fim - inicio).toFixed(1).padStart(5)}s`
    + ` | fala ${dur.toFixed(1).padStart(5)}s a ${Math.round(rate)} ppm`
    + ` | folga ${folga.toFixed(1).padStart(5)}s${aviso}`);

  clipes.push({ arq, inicio });
});

/* ------------------------------------------------------------------ mixagem */
const entradas = ['-i', IN];
clipes.forEach((c) => entradas.push('-i', c.arq));

const f = clipes.map((c, i) =>
  `[${i + 1}:a]aresample=48000,adelay=${Math.round(c.inicio * 1000)}:all=1[a${i}]`);
f.push(`${clipes.map((_, i) => `[a${i}]`).join('')}`
  + `amix=inputs=${clipes.length}:normalize=0:dropout_transition=0,`
  + `alimiter=limit=0.95,apad=whole_dur=${total.toFixed(3)},`
  + `aresample=48000[voz]`);

console.log('\nmixando a locução no vídeo...');
execFileSync('ffmpeg', [
  '-y', ...entradas,
  '-filter_complex', f.join(';'),
  '-map', '0:v', '-map', '[voz]',
  '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k',
  '-t', total.toFixed(3), '-movflags', '+faststart',
  DEST,
], { stdio: ['ignore', 'ignore', 'inherit'] });

console.log(`pronto: ${DEST}`);
