import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './Categories.css';
import { apiGet } from '../utils/api';
import { FEATURED_CATEGORIES, STATIC_CATEGORIES, resolveCategoryStyle } from '../data/categories';

function Categories() {
  const navigate = useNavigate();
  const [chips, setChips] = useState(STATIC_CATEGORIES);
  const trackRef = useRef(null);

  const go = (term) => navigate(`/buscar?q=${encodeURIComponent(term)}`);

  const scrollByAmount = (dir) => {
    trackRef.current?.scrollBy({ left: dir * 340, behavior: 'smooth' });
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await apiGet('/providers/categories');
        if (!active || !Array.isArray(data) || data.length === 0) return;
        setChips(data.map((c) => ({ label: c.label, ...resolveCategoryStyle(c.label) })));
      } catch {
        // mantém as categorias estáticas
      }
    })();
    return () => { active = false; };
  }, []);

  return (
    <section className="categories" id="categorias">
      <div className="categories-head">
        <div>
          <span className="s-eye">Categorias</span>
          <h2 className="s-title">O que você precisa?</h2>
        </div>
        <button type="button" className="categories-all" onClick={() => navigate('/buscar')}>
          Ver todos os prestadores <ChevronRight size={15} />
        </button>
      </div>

      <div className="cat-featured">
        {FEATURED_CATEGORIES.map((f) => (
          <button
            key={f.id}
            type="button"
            className={`cat-card-big cat-card-big-${f.tone}`}
            onClick={() => go(f.id)}
          >
            <span className="cat-deco cat-deco-1" aria-hidden="true" />
            <span className="cat-deco cat-deco-2" aria-hidden="true" />
            <span className="cat-card-big-text">
              <span className="cat-card-big-label">{f.label}</span>
              <span className="cat-card-big-sub">{f.sub}</span>
            </span>
            <span className="cat-card-big-btn">
              Ver serviços <ChevronRight size={14} />
            </span>
          </button>
        ))}
      </div>

      <div className="cat-carousel">
        <button
          type="button"
          className="cat-carousel-btn cat-carousel-btn-prev"
          onClick={() => scrollByAmount(-1)}
          aria-label="Categorias anteriores"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="cat-grid" ref={trackRef}>
          {chips.map((c) => {
            const Icon = c.icon;
            return (
              <button key={c.label} type="button" className="cat-chip" onClick={() => go(c.label)}>
                <span className="cat-chip-icon" style={{ background: c.bg, color: c.color }}>
                  <Icon size={22} strokeWidth={1.9} />
                </span>
                <span className="cat-chip-label">{c.label}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className="cat-carousel-btn cat-carousel-btn-next"
          onClick={() => scrollByAmount(1)}
          aria-label="Próximas categorias"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </section>
  );
}

export default Categories;
