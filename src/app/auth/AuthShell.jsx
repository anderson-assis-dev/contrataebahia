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

/**
 * Casca das telas de entrar, criar conta e ativar.
 *
 * A coluna azul acompanha a altura da página inteira, que num formulário longo
 * passa de três telas. Por isso o conteúdo dela mora num bloco preso ao topo
 * (sticky) com a altura da janela: o fundo continua preenchendo a coluna toda e
 * o texto acompanha quem rola. Antes ele ficava empurrado para o fim da coluna
 * e ninguém chegava a ver — a tela abria com meia janela de azul vazio.
 */
export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="auth-page">
      <aside className="auth-aside">
        <div className="auth-aside-inner">
          <Link to="/" className="auth-aside-brand">
            <img src={LOGO_SRC} alt={BRAND_NAME} />
          </Link>

          <div className="auth-aside-body">
            <h2>Quem faz acontecer na Bahia está aqui.</h2>
            <ul>
              {PILLARS.map(({ icon: Icon, text }) => (
                <li key={text}>
                  <Icon size={18} />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="auth-aside-foot">Cadastro gratuito. Você só paga o serviço que contratar.</p>
        </div>
      </aside>

      <div className="auth-panel">
        <div className="auth-panel-inner">
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
    </div>
  );
}
