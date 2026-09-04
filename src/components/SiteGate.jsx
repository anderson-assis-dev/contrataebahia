import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { BRAND_NAME, LOGO_SRC } from '../utils/brand';
import { SITE_ACCESS_HASH, isSiteUnlocked, unlockSite } from '../utils/siteGate';
import '../app/forms.css';
import './SiteGate.css';

export default function SiteGate({ children }) {
  const [open, setOpen] = useState(() => isSiteUnlocked());
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  if (!SITE_ACCESS_HASH || open) return children;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (unlockSite(code)) {
      setOpen(true);
      return;
    }
    setError('Hash inválido. Confira e tente de novo.');
  };

  return (
    <div className="sg-page">
      <form className="sg-card f-form" onSubmit={handleSubmit}>
        <div className="sg-brand">
          <img src={LOGO_SRC} alt={BRAND_NAME} />
        </div>
        <h1>Acesso restrito</h1>
        <p>Digite o hash de segurança para entrar no Contrataê Bahia.</p>
        {error && (
          <div className="f-alert f-alert-err">
            <Lock size={16} />
            <span>{error}</span>
          </div>
        )}
        <div className="f-field">
          <label htmlFor="sg-hash">Hash de segurança</label>
          <input
            id="sg-hash"
            className="f-input"
            type="password"
            autoComplete="off"
            placeholder="Cole ou digite o hash"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setError('');
            }}
            required
          />
        </div>
        <button type="submit" className="f-submit">
          <Lock size={16} />
          Entrar
        </button>
      </form>
    </div>
  );
}
