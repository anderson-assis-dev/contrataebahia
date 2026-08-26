import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, MessagesSquare, Handshake, ArrowRight } from 'lucide-react';
import './HowItWorks.css';

const STEPS = [
  {
    n: '1',
    icon: FileText,
    title: 'Descreva o serviço',
    desc: 'Diga o que você precisa em poucos segundos — sem formulários complicados.',
  },
  {
    n: '2',
    icon: MessagesSquare,
    title: 'Receba propostas',
    desc: 'Prestadores verificados da sua região enviam orçamentos para você comparar.',
  },
  {
    n: '3',
    icon: Handshake,
    title: 'Contrate quem resolve',
    desc: 'Escolha o profissional ideal, combine os detalhes e acompanhe o serviço.',
  },
];

function HowItWorks() {
  const navigate = useNavigate();

  return (
    <section className="how reveal" id="como-funciona">
      <div className="how-inner">
        <div className="how-head">
          <span className="s-eye">Como funciona</span>
          <h2 className="s-title">Simples, rápido e seguro</h2>
          <p className="s-sub">Em 3 passos você já tem profissionais prontos para te ajudar.</p>
        </div>

        <div className="how-steps">
          {STEPS.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.n} className="how-step">
                <div className="how-num">
                  <Icon size={22} strokeWidth={2} />
                  <span className="how-num-badge">{s.n}</span>
                </div>
                <h3 className="how-step-title">{s.title}</h3>
                <p className="how-step-desc">{s.desc}</p>
              </div>
            );
          })}
        </div>

        <div className="how-cta">
          <button type="button" className="btn-primary" onClick={() => navigate('/buscar')}>
            Encontre um profissional <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;
