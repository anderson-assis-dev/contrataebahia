import React from 'react';
import { Link } from 'react-router-dom';
import { Gavel, MapPin, ShieldCheck } from 'lucide-react';
import { BRAND_NAME, LOGO_SRC } from '../../utils/brand';
import './AuthShell.css';

const PILLARS = [
  { icon: Gavel, text: 'Receba propostas de vários profissionais e escolha a melhor' },
  { icon: ShieldCheck, text: 'Perfis verificados e código de segurança na chegada' },
  { icon: MapPin, text: 'Profissionais de toda a Bahia, perto de você' },
];

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="auth-page">
      <aside className="auth-aside">
        <Link to="/" className="auth-aside-brand">
          <img src={LOGO_SRC} alt={BRAND_NAME} />
        </Link>
        <h2>Quem faz acontecer na Bahia está aqui.</h2>
        <ul>
          {PILLARS.map(({ icon: Icon, text }) => (
            <li key={text}>
              <Icon size={18} />
              <span>{text}</span>
            </li>
          ))}
        </ul>
      </aside>

      <div className="auth-panel">
        <Link to="/" className="auth-panel-brand">
          <img src={LOGO_SRC} alt={BRAND_NAME} />
        </Link>
        <div className="auth-card">
          <h1>{title}</h1>
          {subtitle && <p className="auth-sub">{subtitle}</p>}
          {children}
        </div>
        {footer && <div className="auth-foot">{footer}</div>}
      </div>
    </div>
  );
}
