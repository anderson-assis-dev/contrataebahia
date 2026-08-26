import React, { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ClipboardList, BriefcaseBusiness } from 'lucide-react';
import './DualCTA.css';
import ClientRegisterModal from './ClientRegister';

function DualCTA() {
  const [modalOpen, setModalOpen] = useState(false);
  const closeModal = useCallback(() => setModalOpen(false), []);

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
          <button type="button" className="dual-cta-btn" onClick={() => setModalOpen(true)}>
            Solicitar serviço <ArrowRight size={16} />
          </button>
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

      {modalOpen && <ClientRegisterModal open={modalOpen} onClose={closeModal} />}
    </section>
  );
}

export default DualCTA;
