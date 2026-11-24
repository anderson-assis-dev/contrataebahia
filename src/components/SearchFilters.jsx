import React from 'react';
import { Star, BadgeCheck, Crown, RotateCcw } from 'lucide-react';
import LocationFilter from './LocationFilter';
import './SearchFilters.css';

const ORDENS = [
  { valor: 'rating', label: 'Melhor avaliados' },
  { valor: 'completed', label: 'Mais serviços concluídos' },
  { valor: 'recent', label: 'Mais recentes' },
  { valor: 'name', label: 'Nome (A–Z)' },
];

const NOTAS = [
  { valor: '', label: 'Qualquer nota' },
  { valor: '4', label: '4+ estrelas' },
  { valor: '4.5', label: '4,5+ estrelas' },
];

const TIPOS = [
  { valor: '', label: 'Todos' },
  { valor: 'cnpj', label: 'Empresa ou MEI' },
  { valor: 'cpf', label: 'Autônomo (CPF)' },
];

function Secao({ titulo, children }) {
  return (
    <div className="sf-sec">
      <div className="sf-sec-titulo">{titulo}</div>
      {children}
    </div>
  );
}

export default function SearchFilters({
  valores, categories, locations, locating, onUseLocation, onChange, onClear,
}) {
  const q = valores.q || '';
  const temAlgum = Object.keys(valores).some((k) => k !== 'q' ? valores[k] : false) || q;

  return (
    <aside className="sf">
      <div className="sf-head">
        <span className="sf-head-titulo">Filtros</span>
        {temAlgum && (
          <button type="button" className="sf-limpar" onClick={onClear}>
            <RotateCcw size={13} /> Limpar
          </button>
        )}
      </div>

      <Secao titulo="Categoria">
        <div className="sf-cats">
          <button
            type="button"
            className={`sf-cat${q ? '' : ' sf-cat-on'}`}
            onClick={() => onChange({ q: '' })}
          >
            Todas as categorias
          </button>
          {categories.map((c) => {
            const on = q.toLowerCase() === c.label.toLowerCase();
            return (
              <button
                key={c.label}
                type="button"
                className={`sf-cat${on ? ' sf-cat-on' : ''}`}
                onClick={() => onChange({ q: on ? '' : c.label })}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </Secao>

      <Secao titulo="Localização">
        <LocationFilter
          locations={locations}
          state={valores.state || ''}
          city={valores.city || ''}
          onChange={({ state, city }) => onChange({ state, city })}
          locating={locating}
          onUseLocation={onUseLocation}
        />
      </Secao>

      <Secao titulo="Ordenar por">
        <div className="sf-opts">
          {ORDENS.map((o) => (
            <label key={o.valor} className="sf-opt">
              <input
                type="radio"
                name="sf-sort"
                checked={(valores.sort || 'rating') === o.valor}
                onChange={() => onChange({ sort: o.valor })}
              />
              <span>{o.label}</span>
            </label>
          ))}
        </div>
      </Secao>

      <Secao titulo="Avaliação">
        <div className="sf-opts">
          {NOTAS.map((n) => (
            <label key={n.valor || 'any'} className="sf-opt">
              <input
                type="radio"
                name="sf-rating"
                checked={(valores.min_rating || '') === n.valor}
                onChange={() => onChange({ min_rating: n.valor })}
              />
              <span className="sf-opt-estrela">
                {n.valor && <Star size={13} className="sf-star" />}
                {n.label}
              </span>
            </label>
          ))}
        </div>
      </Secao>

      <Secao titulo="Verificação">
        <label className="sf-opt sf-opt-check">
          <input
            type="checkbox"
            checked={valores.verified === '1'}
            onChange={(e) => onChange({ verified: e.target.checked ? '1' : '' })}
          />
          <span className="sf-opt-estrela"><BadgeCheck size={14} className="sf-ico-verif" /> Só verificados</span>
        </label>
      </Secao>

      <Secao titulo="Tipo de prestador">
        <div className="sf-opts">
          {TIPOS.map((t) => (
            <label key={t.valor || 'all'} className="sf-opt">
              <input
                type="radio"
                name="sf-tipo"
                checked={(valores.doc_type || '') === t.valor}
                onChange={() => onChange({ doc_type: t.valor })}
              />
              <span>{t.label}</span>
            </label>
          ))}
        </div>
      </Secao>

      <Secao titulo="Destaque">
        <label className="sf-opt sf-opt-check">
          <input
            type="checkbox"
            checked={valores.premium === '1'}
            onChange={(e) => onChange({ premium: e.target.checked ? '1' : '' })}
          />
          <span className="sf-opt-estrela"><Crown size={14} className="sf-ico-premium" /> Prestadores Premium</span>
        </label>
      </Secao>
    </aside>
  );
}
