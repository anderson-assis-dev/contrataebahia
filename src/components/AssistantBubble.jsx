import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, X, RefreshCw, Check } from 'lucide-react';
import { SYMBOL_SRC } from '../utils/brand';
import { assistantStatus, reviewOrderDraft } from '../services/assistant';
import './AssistantBubble.css';

// Nome da assistente. Fica aqui sozinho: trocar aqui troca em toda a interface.
export const ASSISTANT_NAME = 'Bia';

/**
 * Balão fixo no canto inferior direito que ajuda o cliente a descrever o pedido.
 *
 * Lê o que já foi preenchido no formulário e devolve um texto organizado mais as
 * perguntas que faltam responder. O texto só entra na descrição quando a pessoa
 * manda: o assistente sugere, nunca escreve por cima sem pedir.
 */
export default function AssistantBubble({ titulo, categoria, descricao, onAplicar }) {
  const [ligado, setLigado] = useState(false);
  const [aberto, setAberto] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState('');
  const painel = useRef(null);

  useEffect(() => {
    let vivo = true;
    assistantStatus()
      .then((ok) => vivo && setLigado(ok))
      .catch(() => {});
    return () => { vivo = false; };
  }, []);

  // Fecha com Esc, como qualquer painel sobreposto.
  useEffect(() => {
    if (!aberto) return undefined;
    const noEsc = (e) => e.key === 'Escape' && setAberto(false);
    document.addEventListener('keydown', noEsc);
    return () => document.removeEventListener('keydown', noEsc);
  }, [aberto]);

  const consultar = async () => {
    setCarregando(true);
    setErro('');
    try {
      const dados = await reviewOrderDraft({ titulo, categoria, descricao });
      setResultado(dados);
      if (!dados) setErro('Não consegui ler seu pedido agora. Tente de novo em instantes.');
    } catch {
      setErro('Não consegui falar com o servidor agora. Tente de novo em instantes.');
    } finally {
      setCarregando(false);
    }
  };

  const abrir = () => {
    setAberto(true);
    if (!resultado && !carregando) consultar();
  };

  const aplicar = () => {
    const texto = (resultado?.descricao_sugerida || '').trim();
    if (!texto) return;
    onAplicar?.(texto);
    setAberto(false);
  };

  if (!ligado) return null;

  const semBase = !String(titulo || '').trim() && !String(categoria || '').trim();
  const sugestao = (resultado?.descricao_sugerida || '').trim();
  const mudou = sugestao && sugestao !== String(descricao || '').trim();

  return (
    <>
      {aberto && (
        <div className="ab-painel" ref={painel} role="dialog" aria-label={`Assistente ${ASSISTANT_NAME}`}>
          <header className="ab-topo">
            <img src={SYMBOL_SRC} alt="" aria-hidden="true" />
            <div>
              <strong>{ASSISTANT_NAME}</strong>
              <span>Ajuda a descrever seu pedido</span>
            </div>
            <button type="button" onClick={() => setAberto(false)} aria-label="Fechar">
              <X size={17} />
            </button>
          </header>

          <div className="ab-corpo">
            {semBase && (
              <p className="ab-aviso">Escreva o título e escolha a categoria. Com isso eu já consigo montar a descrição.</p>
            )}

            {carregando && <p className="ab-aviso">Lendo seu pedido...</p>}
            {erro && <p className="ab-erro">{erro}</p>}

            {resultado && !carregando && (
              <>
                {sugestao && (
                  <section className="ab-bloco">
                    <h3>Descrição sugerida</h3>
                    <p className="ab-sugestao">{sugestao}</p>
                    {/* As lacunas entre colchetes são de propósito: o que a IA não
                        sabe fica à vista em vez de virar número inventado. */}
                    {sugestao.includes('[') && (
                      <p className="ab-dica">Troque o que está entre colchetes pelas suas informações.</p>
                    )}
                    <button type="button" className="ab-aplicar" onClick={aplicar} disabled={!mudou}>
                      <Check size={15} />
                      {mudou ? 'Usar este texto' : 'Já é o que está escrito'}
                    </button>
                  </section>
                )}

                {resultado.perguntas?.length > 0 && (
                  <section className="ab-bloco">
                    <h3>Responda também</h3>
                    <ul className="ab-perguntas">
                      {resultado.perguntas.map((p) => (
                        <li key={p.pergunta}>
                          <strong>{p.pergunta}</strong>
                          <span>{p.porque}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {resultado.pronto && (
                  <p className="ab-pronto">Sua descrição já permite orçar sem visita. Pode publicar.</p>
                )}

                <button type="button" className="ab-refazer" onClick={consultar}>
                  <RefreshCw size={14} />
                  Ler de novo
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <button
        type="button"
        className={`ab-balao ${aberto ? 'ab-ativo' : ''}`}
        onClick={() => (aberto ? setAberto(false) : abrir())}
        aria-expanded={aberto}
        aria-label={`Abrir assistente ${ASSISTANT_NAME}`}
      >
        <span className="ab-marca">
          <img src={SYMBOL_SRC} alt="" aria-hidden="true" />
          <Sparkles size={13} className="ab-brilho" aria-hidden="true" />
        </span>
        <span className="ab-nome">{ASSISTANT_NAME}</span>
      </button>
    </>
  );
}
