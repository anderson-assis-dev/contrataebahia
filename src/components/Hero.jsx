import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star, ShieldCheck, Zap } from 'lucide-react';
import './Hero.css';

const QUICK_SEARCHES = ['Limpeza', 'Elétrica', 'Pintura', 'Hidráulica'];

function Hero() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const goToSearch = (term) => {
    navigate(term ? `/buscar?q=${encodeURIComponent(term)}` : '/buscar');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    goToSearch(query.trim());
  };

  return (
    <section className="hero">
      <div className="hero-bg" aria-hidden="true">
        <span className="hero-bg-blue" />
        <span className="hero-bg-red" />
      </div>

      <div className="hero-inner">
        <div className="hero-badge">
          <span className="hero-badge-dot" />
          Oportunidades para quem faz acontecer
        </div>

        <h1>
          Encontre quem faz.<br />
          <span className="hero-accent">Contrate quem resolve.</span>
        </h1>

        <p className="hero-desc">
          Encontre profissionais verificados para realizar seu serviço com rapidez,
          segurança e confiança — em toda a Bahia.
        </p>

        <form className="hero-search" onSubmit={handleSearch}>
          <label className="hero-search-label" htmlFor="hero-search-input">
            Que serviço você precisa?
          </label>
          <Search size={20} aria-hidden="true" />
          <input
            id="hero-search-input"
            type="text"
            placeholder="Ex: Limpeza, Elétrica, Pintura..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" className="hero-search-btn">Buscar</button>
        </form>

        <div className="hero-quick">
          <span className="hero-quick-label">Buscas frequentes</span>
          {QUICK_SEARCHES.map((term) => (
            <button key={term} type="button" className="hero-quick-chip" onClick={() => goToSearch(term)}>
              {term}
            </button>
          ))}
        </div>

        <div className="hero-trust">
          <div className="hero-trust-item">
            <span className="hero-trust-icon blue"><Star size={14} fill="currentColor" /></span>
            <strong>4.8</strong> de avaliação
          </div>
          <div className="hero-trust-item">
            <span className="hero-trust-icon red"><ShieldCheck size={14} /></span>
            Prestadores verificados
          </div>
          <div className="hero-trust-item">
            <span className="hero-trust-icon blue"><Zap size={14} /></span>
            Propostas em minutos
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
