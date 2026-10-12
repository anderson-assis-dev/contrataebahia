import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import './SearchSelect.css';

// Tira acento para a busca: quem procura "construcao" precisa achar
// "Construção", e ninguém digita acento com pressa no celular.
const normalizar = (texto) =>
  String(texto || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

/**
 * Campo de seleção com busca, para listas longas demais para um select comum.
 *
 * Avisa a mudança no mesmo formato de um input nativo (`{ target: { name, value } }`),
 * então entra no lugar de um <select> sem mexer no handler do formulário.
 */
export default function SearchSelect({
  id,
  name,
  value,
  options,
  onChange,
  placeholder = 'Selecione',
  searchPlaceholder = 'Buscar...',
  emptyLabel = 'Nada encontrado',
  required = false,
  disabled = false,
}) {
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState('');
  const [emFoco, setEmFoco] = useState(0);

  const caixa = useRef(null);
  const campoBusca = useRef(null);
  const listaRef = useRef(null);
  const reactId = useId();
  const listaId = `${id || reactId}-lista`;

  const filtradas = useMemo(() => {
    const termo = normalizar(busca);
    if (!termo) return options;
    return options.filter((o) => normalizar(o).includes(termo));
  }, [options, busca]);

  // Fecha ao clicar fora ou ao sair com Tab: um painel que fica aberto por cima
  // do resto do formulário atrapalha mais do que ajuda.
  useEffect(() => {
    if (!aberto) return undefined;
    const foraDaCaixa = (e) => {
      if (caixa.current && !caixa.current.contains(e.target)) setAberto(false);
    };
    document.addEventListener('mousedown', foraDaCaixa);
    document.addEventListener('focusin', foraDaCaixa);
    return () => {
      document.removeEventListener('mousedown', foraDaCaixa);
      document.removeEventListener('focusin', foraDaCaixa);
    };
  }, [aberto]);

  useEffect(() => {
    if (aberto) campoBusca.current?.focus();
    else setBusca('');
  }, [aberto]);

  useEffect(() => setEmFoco(0), [busca]);

  // Mantém a opção em foco visível quando se navega pelo teclado.
  useEffect(() => {
    if (!aberto || !listaRef.current) return;
    const item = listaRef.current.children[emFoco];
    item?.scrollIntoView({ block: 'nearest' });
  }, [emFoco, aberto]);

  const escolher = (opcao) => {
    onChange?.({ target: { name, value: opcao } });
    setAberto(false);
  };

  const noTeclado = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!aberto) return setAberto(true);
      return setEmFoco((i) => Math.min(i + 1, filtradas.length - 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      return setEmFoco((i) => Math.max(i - 1, 0));
    }
    if (e.key === 'Enter' && aberto) {
      e.preventDefault();
      if (filtradas[emFoco]) escolher(filtradas[emFoco]);
      return undefined;
    }
    if (e.key === 'Escape' && aberto) {
      e.preventDefault();
      setAberto(false);
      caixa.current?.querySelector('.ss-gatilho')?.focus();
    }
    return undefined;
  };

  return (
    <div className={`ss ${aberto ? 'ss-aberto' : ''}`} ref={caixa}>
      <button
        type="button"
        id={id}
        className={`ss-gatilho ${value ? '' : 'ss-vazio'}`}
        onClick={() => !disabled && setAberto((a) => !a)}
        onKeyDown={noTeclado}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={aberto}
        aria-controls={aberto ? listaId : undefined}
      >
        <span className="ss-valor">{value || placeholder}</span>
        <ChevronDown size={16} className="ss-seta" aria-hidden="true" />
      </button>

      {/* Guarda o valor para a validação nativa do formulário continuar valendo. */}
      <input
        type="text"
        className="ss-espelho"
        name={name}
        value={value || ''}
        required={required}
        tabIndex={-1}
        aria-hidden="true"
        onChange={() => {}}
      />

      {aberto && (
        <div className="ss-painel">
          <div className="ss-busca">
            <Search size={15} aria-hidden="true" />
            <input
              ref={campoBusca}
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              onKeyDown={noTeclado}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              aria-controls={listaId}
            />
            {busca && (
              <button type="button" className="ss-limpar" onClick={() => setBusca('')} aria-label="Limpar busca">
                <X size={14} />
              </button>
            )}
          </div>

          {filtradas.length === 0 ? (
            <p className="ss-vazia">{emptyLabel}</p>
          ) : (
            <ul className="ss-lista" id={listaId} ref={listaRef} role="listbox">
              {filtradas.map((opcao, i) => (
                <li key={opcao}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={opcao === value}
                    className={`ss-opcao ${i === emFoco ? 'ss-focada' : ''} ${opcao === value ? 'ss-escolhida' : ''}`}
                    onMouseEnter={() => setEmFoco(i)}
                    onClick={() => escolher(opcao)}
                  >
                    {opcao}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
