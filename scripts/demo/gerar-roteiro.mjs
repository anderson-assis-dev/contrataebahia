/**
 * Gera o roteiro de locução para o CapCut a partir das mesmas fontes que o
 * vídeo usa, de modo que texto e tempos nunca saiam de sincronia.
 *
 * Uso:  node gerar-roteiro.mjs > roteiro-capcut.md
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const VIDEO = path.join(HERE, 'out', 'contratae-bahia-fluxo-completo-v2.mp4');
const TAIL = 6;

const probe = (f) => Number(execFileSync('ffprobe', [
  '-v', 'error', '-show_entries', 'format=duration',
  '-of', 'default=nw=1:nk=1', f,
]).toString().trim());

const mmss = (s) => {
  const m = Math.floor(s / 60);
  const r = (s - m * 60).toFixed(1).padStart(4, '0');
  return `${String(m).padStart(2, '0')}:${r}`;
};

// lê os textos direto do narrate.mjs, que é a fonte única
const src = fs.readFileSync(path.join(HERE, 'narrate.mjs'), 'utf8');
const bloco = src.split('const FALAS = [')[1].split('\n];')[0];
const falas = bloco
  .split(/,\s*\n\s*\n/)
  .map((p) => [...p.matchAll(/'((?:[^'\\]|\\.)*)'/g)].map((m) => m[1]).join(''))
  .map((t) => t.trim())
  .filter(Boolean);

const steps = JSON.parse(fs.readFileSync(path.join(HERE, 'steps.json'), 'utf8'));
const cenas = steps.timeline.filter((s) => s.side === 'cena');
const total = probe(VIDEO);
const fimDoFluxo = total - TAIL;

const janelas = cenas.map((c, i) => ({
  inicio: c.t,
  fim: i + 1 < cenas.length ? cenas[i + 1].t : fimDoFluxo,
  cena: c.text,
}));
janelas.push({ inicio: fimDoFluxo + 0.4, fim: total - 0.3, cena: 'cartela de fechamento' });

const linhas = [];
const p = (s = '') => linhas.push(s);

p('# Locução do vídeo, para montar no CapCut');
p();
p(`Gerado a partir do vídeo \`contratae-bahia-fluxo-completo-v2.mp4\`, que tem`
  + ` ${mmss(total)} e está sem áudio. Importe esse arquivo no CapCut e use a`
  + ' tabela abaixo para encaixar a narração.');
p();
p('## Antes de começar');
p();
p('1. Importe o vídeo e arraste para a linha do tempo. Não corte nada, os tempos abaixo valem para o arquivo inteiro.');
p('2. Abra **Texto para fala** ou **Estúdio de voz**. Crie um bloco de áudio por linha da tabela.');
p('3. Escolha uma voz de **narração em português do Brasil**, do tipo locutor ou documentário. Evite as vozes de personagem, que soam infantis em material institucional.');
p('4. Velocidade da fala em torno de 0,95 a 1,0. Tom neutro.');
p();
p('Se um bloco ficar mais longo que a janela, reduza a velocidade daquele bloco'
  + ' para 1,05 ou corte a última frase. Nunca deixe a fala atravessar para a cena seguinte,'
  + ' porque a legenda na tela já terá mudado.');
p();
p('## Blocos');
p();

falas.forEach((texto, i) => {
  const j = janelas[i];
  if (!j) return;
  const dur = j.fim - j.inicio;
  p(`### ${i + 1}. ${j.cena.charAt(0).toUpperCase() + j.cena.slice(1)}`);
  p();
  p(`**Entra em ${mmss(j.inicio)}** · espaço de **${dur.toFixed(1)} segundos**`);
  p();
  p('```');
  p(texto);
  p('```');
  p();
});

p('## Depois da narração');
p();
p('Legendas: use **Legendas automáticas** a partir do áudio já montado, em vez de digitar.'
  + ' O vídeo já tem a legenda da etapa queimada na faixa inferior, então posicione a legenda'
  + ' automática logo acima dela ou desative uma das duas para não competir.');
p();
p('Trilha: instrumental discreto em vinte por cento de volume, baixando para dez por cento'
  + ' quando a voz entra. Nada de percussão marcada, o público é institucional.');
p();
p('Exportação: 1920 por 1080, 30 quadros por segundo, qualidade alta.');
p();
p('## Se preferir gravar com a sua voz');
p();
p('Os mesmos textos servem. Grave os blocos na ordem, respeitando o espaço de cada um,'
  + ' e encaixe nos tempos da tabela. Para uma apresentação a dirigente público a sua voz'
  + ' costuma convencer mais do que qualquer síntese.');

process.stdout.write(`${linhas.join('\n')}\n`);
