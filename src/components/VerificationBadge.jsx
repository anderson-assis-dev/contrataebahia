import React, { useEffect, useRef, useState } from 'react';
import { BadgeCheck, Check, FileCheck2, ScanFace, Building2 } from 'lucide-react';
import './VerificationBadge.css';

export default function VerificationBadge({ provider, compact = false }) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!aberto) return undefined;
    const foraDaCaixa = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setAberto(false);
    };
    document.addEventListener('mousedown', foraDaCaixa);
    return () => document.removeEventListener('mousedown', foraDaCaixa);
  }, [aberto]);

  const verificado = Number(provider?.is_verified) === 1 || Number(provider?.verification_level) >= 2;
  if (!verificado) return null;

  const nivel = Number(provider?.verification_level ?? 2);
  const cnpj = provider?.document_type === 'cnpj';
  const mei = Number(provider?.is_mei) === 1;

  const itens = [
    { icon: FileCheck2, txt: cnpj ? 'CNPJ válido' : 'CPF válido' },
    { icon: ScanFace, txt: 'Prova de vida confirmada' },
  ];
  if (cnpj && nivel >= 3) {
    itens.push({ icon: Building2, txt: mei ? 'MEI ativo na Receita' : 'Empresa ativa na Receita' });
  }

  const alternar = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setAberto((a) => !a);
  };

  return (
    <span className={`vbdg${compact ? ' vbdg-compact' : ''}`} ref={ref}>
      <span
        role="button"
        tabIndex={0}
        className="vbdg-pill"
        title="Ver o que foi verificado"
        onClick={alternar}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') alternar(e); }}
      >
        <BadgeCheck size={compact ? 12 : 14} strokeWidth={2.4} aria-hidden="true" />
        Verificado
      </span>

      {aberto && (
        <span className="vbdg-pop" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Dados verificados">
          <strong className="vbdg-pop-titulo">Perfil verificado</strong>
          <ul className="vbdg-lista">
            {itens.map((it) => (
              <li key={it.txt}>
                <span className="vbdg-ok"><Check size={13} /></span>
                <it.icon size={15} className="vbdg-ico" />
                {it.txt}
              </li>
            ))}
          </ul>
          <small className="vbdg-rodape">Verificação feita pelo Contrataê Bahia.</small>
        </span>
      )}
    </span>
  );
}
