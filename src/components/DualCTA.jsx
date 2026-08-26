import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ClipboardList, BriefcaseBusiness } from 'lucide-react';
import './DualCTA.css';

function DualCTA() {
  return (
    <section className="dual-cta" id="prestadores">
      <div className="dual-cta-grid">
        <div className="dual-cta-card client reveal">
          <span className="dual-cta-deco dual-cta-deco-1" aria-hidden="true" />
          <span className="dual-cta-deco dual-cta-deco-2" aria-hidden="true" />
          <div className="dual-cta-icon"><ClipboardList size={26} /></div>
          <h3 className="dual-cta-title">Precisa contratar um serviço?</h3>
          <p className="dual-cta-desc">
            Faça seu pedido gratuitamente e receba orçamentos de profissionais
            qualificados da sua região.
          </p>
          <Link to="/criar-conta" className="dual-cta-btn">
            Solicitar serviço <ArrowRight size={16} />
          </Link>
        </div>

        <div className="dual-cta-card provider reveal">
          <span className="dual-cta-deco dual-cta-deco-1" aria-hidden="true" />
          <span className="dual-cta-deco dual-cta-deco-2" aria-hidden="true" />
          <div className="dual-cta-icon"><BriefcaseBusiness size={26} /></div>
          <h3 className="dual-cta-title">Você faz. A gente conecta.</h3>
          <p className="dual-cta-desc">
            Transforme seu trabalho em novas oportunidades: cadastre-se, acesse
            pedidos próximos e aumente sua renda.
          </p>
          <Link to="/cadastro/prestador" className="dual-cta-btn">
            Quero ser prestador <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default DualCTA;
