import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { MapPin, ChevronDown, X, Loader2 } from 'lucide-react';
import './LocationFilter.css';

const normalizar = (texto) =>
  String(texto || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

const plural = (n) => `${n} prestador${n === 1 ? '' : 'es'}`;

const NOMES_UF = {
  AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas', BA: 'Bahia',
  CE: 'Ceará', DF: 'Distrito Federal', ES: 'Espírito Santo', GO: 'Goiás',
  MA: 'Maranhão', MT: 'Mato Grosso', MS: 'Mato Grosso do Sul',
  MG: 'Minas Gerais', PA: 'Pará', PB: 'Paraíba', PR: 'Paraná',
  PE: 'Pernambuco', PI: 'Piauí', RJ: 'Rio de Janeiro',
  RN: 'Rio Grande do Norte', RS: 'Rio Grande do Sul', RO: 'Rondônia',
  RR: 'Roraima', SC: 'Santa Catarina', SP: 'São Paulo', SE: 'Sergipe',
  TO: 'Tocantins',
};

export default function LocationFilter({
  locations = [],
  state = '',
  city = '',
  onChange,
  locating = false,
  onUseLocation = null,
}) {
  const [ufAberta, setUfAberta] = useState(false);
  const [cidadeAberta, setCidadeAberta] = useState(false);
  const [texto, setTexto] = useState(city);
  const [emFoco, setEmFoco] = useState(0);

  const idBase = useId();
  const idLista = `${idBase}-cidades`;

  const caixaUf = useRef(null);
  const caixaCidade = useRef(null);
  const campoCidade = useRef(null);
  const listaCidade = useRef(null);

  useEffect(() => setTexto(city), [city]);

  const totalDeUfs = useMemo(
    () => locations.reduce((soma, uf) => soma + Number(uf.providers_count || 0), 0),
    [locations]
  );

  const ufEscolhida = useMemo(() => {
    if (!state) return null;
    return locations.find((uf) => uf.state === state)
      || { state, name: NOMES_UF[state] || state, providers_count: 0, cities: [] };
  }, [locations, state]);

  const ufsNaLista = useMemo(() => {
    if (ufEscolhida && !locations.some((uf) => uf.state === ufEscolhida.state)) {
      return [ufEscolhida, ...locations];
    }
    return locations;
  }, [locations, ufEscolhida]);

  const cidadesBase = useMemo(() => {
    if (ufEscolhida) {
      return ufEscolhida.cities.map((c) => ({
        city: c.name, state: ufEscolhida.state, count: Number(c.providers_count || 0),
      }));
    }
    return locations.flatMap((uf) =>
      uf.cities.map((c) => ({
        city: c.name, state: uf.state, count: Number(c.providers_count || 0),
      }))
    );
  }, [locations, ufEscolhida]);

  const sugestoes = useMemo(() => {
    const termo = normalizar(texto);
    if (!termo || termo === normalizar(city)) return cidadesBase.slice(0, 60);
    return cidadesBase.filter((c) => normalizar(c.city).includes(termo)).slice(0, 60);
  }, [cidadesBase, texto, city]);

  useEffect(() => setEmFoco(0), [texto, cidadeAberta]);

  useEffect(() => {
    const foraDaCaixa = (e) => {
      if (caixaUf.current && !caixaUf.current.contains(e.target)) setUfAberta(false);
      if (caixaCidade.current && !caixaCidade.current.contains(e.target)) {
        setCidadeAberta(false);
        setTexto(city);
      }
    };
    document.addEventListener('mousedown', foraDaCaixa);
    return () => document.removeEventListener('mousedown', foraDaCaixa);
  }, [city]);

  useEffect(() => {
    if (!cidadeAberta || !listaCidade.current) return;
    listaCidade.current.children[emFoco]?.scrollIntoView({ block: 'nearest' });
  }, [emFoco, cidadeAberta]);

  const escolherUf = (sigla) => {
    setUfAberta(false);
    if (sigla === state) return;
    const cidadeContinuaValendo = sigla
      && locations.find((uf) => uf.state === sigla)?.cities
        .some((c) => normalizar(c.name) === normalizar(city));
    onChange?.({ state: sigla, city: cidadeContinuaValendo ? city : '' });
  };

  const escolherCidade = (opcao) => {
    setCidadeAberta(false);
    setTexto(opcao.city);
    onChange?.({ state: opcao.state, city: opcao.city });
  };

  const limparCidade = () => {
    setTexto('');
    setCidadeAberta(false);
    onChange?.({ state, city: '' });
    campoCidade.current?.focus();
  };

  const noTecladoCidade = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!cidadeAberta) return setCidadeAberta(true);
      return setEmFoco((i) => Math.min(i + 1, sugestoes.length - 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      return setEmFoco((i) => Math.max(i - 1, 0));
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (cidadeAberta && sugestoes[emFoco]) escolherCidade(sugestoes[emFoco]);
      return undefined;
    }
    if (e.key === 'Escape') {
      setCidadeAberta(false);
      setTexto(city);
      return undefined;
    }
    return undefined;
  };

  const rotuloUf = ufEscolhida ? `${ufEscolhida.name} (${ufEscolhida.providers_count})` : 'Todo o Brasil';

  return (
    <div className="lf">
      <div className={`lf-campo lf-uf${ufAberta ? ' lf-aberto' : ''}`} ref={caixaUf}>
        <button
          type="button"
          className={`lf-gatilho${state ? ' lf-preenchido' : ''}`}
          onClick={() => setUfAberta((a) => !a)}
          aria-haspopup="listbox"
          aria-expanded={ufAberta}
          aria-label="Filtrar por estado"
        >
          <MapPin size={15} className="lf-icone" aria-hidden="true" />
          <span className="lf-valor">{rotuloUf}</span>
          <ChevronDown size={15} className="lf-seta" aria-hidden="true" />
        </button>

        {ufAberta && (
          <div className="lf-painel">
            <ul className="lf-lista" role="listbox" aria-label="Estados">
              <li>
                <button
                  type="button"
                  role="option"
                  aria-selected={!state}
                  className={`lf-opcao${!state ? ' lf-escolhida' : ''}`}
                  onClick={() => escolherUf('')}
                >
                  <span>Todo o Brasil</span>
                  <span className="lf-contagem">{plural(totalDeUfs)}</span>
                </button>
              </li>
              {ufsNaLista.map((uf) => (
                <li key={uf.state}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={uf.state === state}
                    className={`lf-opcao${uf.state === state ? ' lf-escolhida' : ''}`}
                    onClick={() => escolherUf(uf.state)}
                  >
                    <span>{uf.name} <em className="lf-sigla">{uf.state}</em></span>
                    <span className="lf-contagem">{plural(uf.providers_count)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className={`lf-campo lf-cidade${cidadeAberta ? ' lf-aberto' : ''}`} ref={caixaCidade}>
        <div className="lf-entrada">
          <MapPin size={15} className="lf-icone" aria-hidden="true" />
          <input
            ref={campoCidade}
            type="text"
            className="lf-input"
            role="combobox"
            aria-expanded={cidadeAberta}
            aria-controls={idLista}
            aria-autocomplete="list"
            aria-activedescendant={
              cidadeAberta && sugestoes[emFoco] ? `${idBase}-op-${emFoco}` : undefined
            }
            aria-label="Filtrar por cidade"
            placeholder={ufEscolhida ? `Cidade em ${ufEscolhida.name}...` : 'Filtrar por cidade...'}
            value={texto}
            onChange={(e) => { setTexto(e.target.value); setCidadeAberta(true); }}
            onFocus={() => setCidadeAberta(true)}
            onKeyDown={noTecladoCidade}
          />
          {(texto || city) && (
            <button type="button" className="lf-limpar" onClick={limparCidade} aria-label="Limpar cidade">
              <X size={13} />
            </button>
          )}
        </div>

        {cidadeAberta && (
          <div className="lf-painel">
            {sugestoes.length === 0 ? (
              <p className="lf-vazia" id={idLista} role="listbox" aria-label="Cidades">
                Nenhuma cidade com prestador{ufEscolhida ? ` em ${ufEscolhida.name}` : ''} para “{texto}”.
              </p>
            ) : (
              <ul className="lf-lista" role="listbox" id={idLista} ref={listaCidade} aria-label="Cidades">
                {sugestoes.map((opcao, i) => (
                  <li key={`${opcao.state}:${opcao.city}`}>
                    <button
                      type="button"
                      id={`${idBase}-op-${i}`}
                      role="option"
                      aria-selected={normalizar(opcao.city) === normalizar(city) && opcao.state === state}
                      className={`lf-opcao${i === emFoco ? ' lf-focada' : ''}${
                        normalizar(opcao.city) === normalizar(city) && opcao.state === state ? ' lf-escolhida' : ''
                      }`}
                      onMouseEnter={() => setEmFoco(i)}
                      onClick={() => escolherCidade(opcao)}
                    >
                      <span>
                        {opcao.city}
                        {!ufEscolhida && <em className="lf-sigla">{opcao.state}</em>}
                      </span>
                      <span className="lf-contagem">{plural(opcao.count)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {onUseLocation && (
        <button
          type="button"
          className={`lf-localizar${locating ? ' lf-ocupado' : ''}`}
          onClick={onUseLocation}
          disabled={locating}
          title="Usar minha localização"
        >
          {locating ? <Loader2 size={15} className="lf-girando" /> : <MapPin size={15} />}
          {locating ? 'Localizando...' : 'Usar localização'}
        </button>
      )}
    </div>
  );
}
