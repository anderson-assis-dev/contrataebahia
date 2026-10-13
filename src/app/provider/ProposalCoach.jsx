import React, { useState } from 'react';
import { AlertTriangle, Check, RefreshCw, Sparkles, Wand2 } from 'lucide-react';
import { SYMBOL_SRC } from '../../utils/brand';
import { ASSISTANT_NAME } from '../../components/AssistantBubble';
import { coachProposal } from '../../services/assistant';
import { formatMoney } from '../../utils/format';
import './ProposalCoach.css';

/** Com amostra concentrada num valor so, "X – X" parece defeito. */
const faixaTexto = (minimo, maximo) =>
  Math.round(minimo) === Math.round(maximo) ? formatMoney(minimo) : `${formatMoney(minimo)} – ${formatMoney(maximo)}`;

const CONFIANCA = {
  alta: { rotulo: 'Base sólida', classe: 'pc-conf-alta' },
  media: { rotulo: 'Base razoável', classe: 'pc-conf-media' },
  baixa: { rotulo: 'Pouco histórico', classe: 'pc-conf-baixa' },
};

/**
 * A leitura da BIA sobre a demanda, para quem vai propor.
 *
 * Os números vêm prontos do servidor e são mostrados mesmo quando a IA está
 * desligada ou falhou — eles é que sustentam a decisão de preço. A análise em
 * texto é o complemento.
 *
 * Sobre a concorrência só aparece faixa, nunca o valor de um concorrente
 * identificável: num leilão, mostrar o lance do outro vira corrida para o
 * fundo, e quem paga é o profissional.
 */
export default function ProposalCoach({ orderId, onUsarTexto, onUsarValor }) {
  const [carregando, setCarregando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState('');

  const analisar = async () => {
    setCarregando(true);
    setErro('');
    try {
      const dados = await coachProposal(orderId);
      if (dados) setResultado(dados);
      else setErro('Não consegui analisar esta demanda agora. Tente de novo em instantes.');
    } catch {
      setErro('Não consegui falar com o servidor agora. Tente de novo em instantes.');
    } finally {
      setCarregando(false);
    }
  };

  if (!resultado) {
    return (
      <div className="card pc-convite">
        <img src={SYMBOL_SRC} alt="" aria-hidden="true" className="pc-simbolo" />
        <div className="pc-convite-txt">
          <strong>Como ganhar esta demanda</strong>
          <span>
            A {ASSISTANT_NAME} lê o pedido, compara com o que já fechou nesta categoria e diz onde você pode ganhar.
          </span>
          {erro && <p className="pc-erro">{erro}</p>}
        </div>
        <button type="button" className="pc-botao" onClick={analisar} disabled={carregando}>
          {carregando ? <RefreshCw size={16} className="pc-girando" /> : <Sparkles size={16} />}
          {carregando ? 'Analisando...' : 'Analisar'}
        </button>
      </div>
    );
  }

  const { dados, analise } = resultado;
  const faixa = dados?.faixa;
  const disputa = dados?.disputa || {};
  const historico = dados?.historico;
  const conf = analise ? CONFIANCA[analise.confianca] || CONFIANCA.baixa : null;

  return (
    <div className="card pc">
      <div className="pc-topo">
        <img src={SYMBOL_SRC} alt="" aria-hidden="true" className="pc-simbolo" />
        <div>
          <strong>Como ganhar esta demanda</strong>
          <span>Leitura da {ASSISTANT_NAME}</span>
        </div>
        {conf && <span className={`pc-conf ${conf.classe}`}>{conf.rotulo}</span>}
      </div>

      <div className="pc-numeros">
        <div className="pc-num">
          <span>Propostas já enviadas</span>
          <strong>{disputa.total ?? 0}</strong>
        </div>
        {disputa.menor != null && (
          <div className="pc-num">
            <span>Faixa das propostas aqui</span>
            <strong>{faixaTexto(disputa.menor, disputa.maior)}</strong>
          </div>
        )}
        {faixa && (
          <div className="pc-num pc-num-forte">
            <span>Fecha por, em {faixa.abrangencia}</span>
            <strong>{faixaTexto(faixa.minimo, faixa.maximo)}</strong>
            <small>mediana {formatMoney(faixa.mediana)} · {faixa.amostra} serviços</small>
          </div>
        )}
        {historico?.taxa_aceite != null && (
          <div className="pc-num">
            <span>Propostas que viram serviço</span>
            <strong>{Math.round(historico.taxa_aceite * 100)}%</strong>
          </div>
        )}
      </div>

      {faixa && onUsarValor && (
        <button type="button" className="pc-usar" onClick={() => onUsarValor(faixa.mediana)}>
          <Wand2 size={14} />
          Usar a mediana ({formatMoney(faixa.mediana)}) como meu valor
        </button>
      )}

      {analise ? (
        <>
          <p className="pc-leitura">{analise.leitura}</p>

          {analise.posicionamento && (
            <p className="pc-posicao">
              <strong>Onde você ganha:</strong> {analise.posicionamento}
            </p>
          )}

          {analise.pontos_fortes?.length > 0 && (
            <ul className="pc-lista">
              {analise.pontos_fortes.map((ponto, i) => (
                <li key={i}>
                  <Check size={14} />
                  {ponto}
                </li>
              ))}
            </ul>
          )}

          {analise.riscos?.length > 0 && (
            <ul className="pc-lista pc-lista-risco">
              {analise.riscos.map((risco, i) => (
                <li key={i}>
                  <AlertTriangle size={14} />
                  {risco}
                </li>
              ))}
            </ul>
          )}

          {analise.rascunho_proposta && (
            <div className="pc-rascunho">
              <p>{analise.rascunho_proposta}</p>
              {onUsarTexto && (
                <button type="button" className="pc-usar" onClick={() => onUsarTexto(analise.rascunho_proposta)}>
                  <Wand2 size={14} />
                  Usar este texto na minha proposta
                </button>
              )}
            </div>
          )}
        </>
      ) : (
        <p className="pc-leitura">
          A análise em texto não está disponível agora, mas os números acima são do banco e valem do mesmo jeito.
        </p>
      )}

      <p className="pc-nota">
        Valores apurados nos serviços que fecharam na plataforma. Das propostas concorrentes só aparece a faixa — o
        valor de cada profissional é dele.
      </p>

      <button type="button" className="pc-refazer" onClick={analisar} disabled={carregando}>
        <RefreshCw size={13} className={carregando ? 'pc-girando' : undefined} />
        {carregando ? 'Analisando...' : 'Analisar de novo'}
      </button>
    </div>
  );
}
