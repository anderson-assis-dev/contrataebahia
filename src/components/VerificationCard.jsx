import React, { useState } from 'react';
import { ShieldCheck, Check, Circle, ScanFace, FileCheck2, Building2 } from 'lucide-react';
import LivenessCapture from './LivenessCapture';
import './VerificationCard.css';

const NIVEL_ROTULO = ['Não verificado', 'Documento', 'Verificado', 'Empresa verificada'];

export default function VerificationCard({ user, onVerified }) {
  const [capturando, setCapturando] = useState(false);

  const nivel = Number(user?.verification_level ?? 0);
  const ehCnpj = user?.document_type === 'cnpj';
  const docValido = Number(user?.document_valid) === 1;
  const livenessFeito = Number(user?.liveness_verified) === 1;
  const empresaAtiva = String(user?.company_status || '').toUpperCase() === 'ATIVA';

  const etapas = [
    {
      icon: FileCheck2,
      titulo: ehCnpj ? 'CNPJ válido' : 'CPF válido',
      ok: docValido,
      pendente: docValido ? null : 'Informe um documento válido no cadastro.',
    },
    {
      icon: ScanFace,
      titulo: 'Prova de vida',
      ok: livenessFeito,
      acao: livenessFeito ? null : 'Fazer agora',
    },
  ];

  if (ehCnpj) {
    etapas.push({
      icon: Building2,
      titulo: user?.is_mei ? 'MEI ativo' : 'Empresa ativa',
      ok: empresaAtiva,
      pendente: empresaAtiva ? null : 'Confirmaremos a situação na Receita.',
    });
  }

  return (
    <div className="card stack vc">
      <div className="vc-head">
        <div className="card-title vc-title">
          <ShieldCheck size={18} /> Verificação
        </div>
        <span className={`vc-selo vc-nivel-${Math.min(nivel, 3)}`}>{NIVEL_ROTULO[Math.min(nivel, 3)]}</span>
      </div>

      <p className="vc-sub">
        {nivel >= 2
          ? 'Seu perfil está verificado. Clientes veem o selo na busca e nas propostas.'
          : 'Complete as etapas para ganhar o selo de verificado e aparecer em destaque.'}
      </p>

      <ul className="vc-etapas">
        {etapas.map((e) => (
          <li key={e.titulo} className={`vc-etapa${e.ok ? ' vc-ok' : ''}`}>
            <span className="vc-check">{e.ok ? <Check size={15} /> : <Circle size={14} />}</span>
            <span className="vc-etapa-icone"><e.icon size={16} /></span>
            <span className="vc-etapa-txt">
              <strong>{e.titulo}</strong>
              {!e.ok && e.pendente && <small>{e.pendente}</small>}
            </span>
            {!e.ok && e.acao && (
              <button type="button" className="vc-acao" onClick={() => setCapturando(true)}>
                {e.acao}
              </button>
            )}
          </li>
        ))}
      </ul>

      {capturando && (
        <LivenessCapture
          onClose={() => setCapturando(false)}
          onSuccess={() => { setCapturando(false); onVerified?.(); }}
        />
      )}
    </div>
  );
}
