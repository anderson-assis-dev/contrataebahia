import React, { useState } from 'react';
import { ShieldAlert, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import LivenessCapture from './LivenessCapture';
import './VerificationBanner.css';

const CHAVE_OCULTO = 'cb_verif_banner_oculto';

export default function VerificationBanner() {
  const { user, isProvider, refreshUser } = useAuth();
  const [capturando, setCapturando] = useState(false);
  const [oculto, setOculto] = useState(() => {
    try { return sessionStorage.getItem(CHAVE_OCULTO) === '1'; } catch { return false; }
  });

  const nivel = Number(user?.verification_level ?? 0);
  const livenessFeito = Number(user?.liveness_verified) === 1;

  if (!isProvider || nivel >= 2 || livenessFeito || oculto) return null;

  const adiar = () => {
    try { sessionStorage.setItem(CHAVE_OCULTO, '1'); } catch { /* */ }
    setOculto(true);
  };

  return (
    <div className="vb">
      <div className="vb-icone"><ShieldAlert size={20} /></div>
      <div className="vb-txt">
        <strong>Falta a prova de vida</strong>
        <span>Confirme que é você para ganhar o selo de verificado e aparecer em destaque na busca.</span>
      </div>
      <div className="vb-acoes">
        <button type="button" className="vb-fazer" onClick={() => setCapturando(true)}>Fazer agora</button>
        <button type="button" className="vb-adiar" onClick={adiar} aria-label="Agora não">
          <X size={16} />
        </button>
      </div>

      {capturando && (
        <LivenessCapture
          onClose={() => setCapturando(false)}
          onSuccess={() => { setCapturando(false); refreshUser?.(); }}
        />
      )}
    </div>
  );
}
