import React, { useMemo, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { toDate } from '../../utils/format';
import './ListFilters.css';

export const PERIODOS = [
  { value: '', label: 'Qualquer data' },
  { value: '7', label: 'Últimos 7 dias' },
  { value: '30', label: 'Últimos 30 dias' },
  { value: '90', label: 'Últimos 90 dias' },
];

const ORDENS_BASE = [
  { value: 'recentes', label: 'Mais recentes' },
  { value: 'antigos', label: 'Mais antigos' },
];

const ORDENS_VALOR = [
  { value: 'maior', label: 'Maior valor' },
  { value: 'menor', label: 'Menor valor' },
];

const semAcento = (texto) =>
  String(texto || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

const DIA_MS = 24 * 60 * 60 * 1000;

/**
 * Busca, período e ordenação de uma lista já carregada.
 *
 * O filtro roda no navegador, não no servidor: a resposta é imediata a cada
 * tecla e não gera uma requisição por letra digitada. Em troca, ele só enxerga
 * o que foi buscado — por isso as telas pedem um limite folgado ao listar.
 *
 * Os acessores (textos, data, valor) devem ser declarados fora do componente
 * que usa o hook. Criados a cada render, invalidariam o memo toda vez.
 */
export const useListFilters = (itens, { textos, data, valor } = {}) => {
  const [busca, setBusca] = useState('');
  const [periodo, setPeriodo] = useState('');
  const [ordem, setOrdem] = useState('recentes');

  const lista = useMemo(() => (Array.isArray(itens) ? itens : []), [itens]);

  const filtrados = useMemo(() => {
    const termo = semAcento(busca.trim());
    const limite = periodo ? Date.now() - Number(periodo) * DIA_MS : null;

    const passa = (item) => {
      if (termo && textos) {
        const alvo = semAcento(textos(item).filter(Boolean).join(' '));
        if (!alvo.includes(termo)) return false;
      }
      if (limite && data) {
        const quando = toDate(data(item));
        // Sem data legível o item fica: sumir por causa de um campo vazio é pior
        // do que aparecer fora do período.
        if (quando && quando.getTime() < limite) return false;
      }
      return true;
    };

    const comparar = (a, b) => {
      if (valor && (ordem === 'maior' || ordem === 'menor')) {
        const va = Number(valor(a)) || 0;
        const vb = Number(valor(b)) || 0;
        return ordem === 'maior' ? vb - va : va - vb;
      }
      if (!data) return 0;
      const ta = toDate(data(a))?.getTime() || 0;
      const tb = toDate(data(b))?.getTime() || 0;
      return ordem === 'antigos' ? ta - tb : tb - ta;
    };

    return lista.filter(passa).sort(comparar);
  }, [lista, busca, periodo, ordem, textos, data, valor]);

  const ativo = Boolean(busca.trim() || periodo || ordem !== 'recentes');

  const limpar = () => {
    setBusca('');
    setPeriodo('');
    setOrdem('recentes');
  };

  return { busca, setBusca, periodo, setPeriodo, ordem, setOrdem, filtrados, ativo, limpar, total: lista.length };
};

/** Barra de filtros. O estado mora no hook; aqui é só a cara dele. */
export default function ListFilters({ filtros, placeholder = 'Buscar', rotulo = 'itens', comValor = false }) {
  const { busca, setBusca, periodo, setPeriodo, ordem, setOrdem, filtrados, ativo, limpar, total } = filtros;
  const ordens = comValor ? [...ORDENS_BASE, ...ORDENS_VALOR] : ORDENS_BASE;

  return (
    <div className="lf">
      <div className="lf-linha">
        <div className="lf-busca">
          <Search size={16} />
          <input
            type="search"
            className="lf-input"
            placeholder={placeholder}
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            aria-label={placeholder}
          />
          {busca && (
            <button type="button" className="lf-limpa-busca" onClick={() => setBusca('')} aria-label="Limpar busca">
              <X size={14} />
            </button>
          )}
        </div>

        <div className="lf-selects">
          <select
            className="lf-select"
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            aria-label="Filtrar por período"
          >
            {PERIODOS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>

          <select
            className="lf-select"
            value={ordem}
            onChange={(e) => setOrdem(e.target.value)}
            aria-label="Ordenar lista"
          >
            {ordens.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {ativo && (
        <div className="lf-resumo">
          <SlidersHorizontal size={13} />
          <span>
            {filtrados.length === total
              ? `${total} ${rotulo}`
              : `${filtrados.length} de ${total} ${rotulo}`}
          </span>
          <button type="button" onClick={limpar}>
            Limpar filtros
          </button>
        </div>
      )}
    </div>
  );
}

/** Vazio por causa do filtro, não por falta de conteúdo. São coisas diferentes. */
export function SemResultado({ onLimpar, rotulo = 'itens' }) {
  return (
    <div className="empty">
      <span className="empty-ico">
        <Search size={24} />
      </span>
      <strong>Nenhum resultado para esse filtro</strong>
      <p>Existem {rotulo} aqui, mas nenhum corresponde ao que você procurou.</p>
      <button type="button" className="btn-outline" onClick={onLimpar}>
        Limpar filtros
      </button>
    </div>
  );
}
