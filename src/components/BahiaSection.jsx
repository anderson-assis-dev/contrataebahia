import React from 'react';
import { Link } from 'react-router-dom';
import { BadgeCheck, Wallet, MessagesSquare, Star, MapPin, ArrowRight } from 'lucide-react';
import './BahiaSection.css';
import { SYMBOL_SRC, BRAND_NAME } from '../utils/brand';

const PILLARS = [
  {
    icon: BadgeCheck,
    title: 'Prestadores verificados',
    desc: 'Cadastro com dados conferidos antes de aparecer na plataforma.',
  },
  {
    icon: Wallet,
    title: 'Orçamento sem custo',
    desc: 'Pedir e comparar propostas é gratuito, sem compromisso.',
  },
  {
    icon: MessagesSquare,
    title: 'Negociação direta',
    desc: 'Você combina escopo, prazo e valor direto com o profissional.',
  },
  {
    icon: Star,
    title: 'Avaliações reais',
    desc: 'Reputação construída por quem já contratou o serviço.',
  },
];

const CITIES = [
  'Salvador', 'Feira de Santana', 'Vitória da Conquista', 'Camaçari',
  'Lauro de Freitas', 'Itabuna', 'Ilhéus', 'Juazeiro', 'Barreiras', 'Porto Seguro',
];

function BahiaSection() {
  return (
    <section className="bahia" id="sobre">
      <div className="bahia-inner reveal">
        <div className="bahia-head">
          <img className="bahia-symbol" src={SYMBOL_SRC} alt="" aria-hidden="true" />
          <span className="bahia-eye">Feito para a Bahia</span>
          <h2 className="bahia-title">
            Conectando quem precisa a <span className="bahia-title-accent">quem faz acontecer</span>
          </h2>
          <p className="bahia-desc">
            O {BRAND_NAME} nasceu para valorizar o profissional baiano e dar ao
            cliente a segurança de contratar bem, perto de casa.
          </p>
        </div>

        <div className="bahia-pillars">
          {PILLARS.map((p) => {
            const Icon = p.icon;
            return (
              <div key={p.title} className="bahia-pillar">
                <span className="bahia-pillar-icon"><Icon size={20} strokeWidth={2} /></span>
                <h3 className="bahia-pillar-title">{p.title}</h3>
                <p className="bahia-pillar-desc">{p.desc}</p>
              </div>
            );
          })}
        </div>

        <div className="bahia-cities">
          <span className="bahia-cities-label">
            <MapPin size={14} /> Atendemos em toda a Bahia
          </span>
          <div className="bahia-cities-list">
            {CITIES.map((city) => (
              <span key={city} className="bahia-city">{city}</span>
            ))}
            <span className="bahia-city bahia-city-more">e mais</span>
          </div>
        </div>

        <div className="bahia-cta">
          <Link to="/cadastro/prestador" className="bahia-cta-btn">
            Quero oferecer meus serviços <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default BahiaSection;
