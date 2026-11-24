import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, SearchX, Star } from 'lucide-react';
import { listCategories, listProviderLocations, searchProviders } from '../../services/catalog';
import LocationFilter from '../../components/LocationFilter';
import { STATIC_CATEGORIES } from '../../data/categories';
import '../ui.css';
import '../forms.css';
import './FindProviders.css';

const FALLBACK_LABELS = STATIC_CATEGORIES.map((c) => c.label);

const initialsOf = (name) =>
  (name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

export default function FindProviders() {
  const [categories, setCategories] = useState(FALLBACK_LABELS);
  const [category, setCategory] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [locations, setLocations] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listCategories(60)
      .then((json) => {
        const labels = (json?.data || []).map((c) => c.label).filter(Boolean);
        if (labels.length) setCategories(labels);
      })
      .catch(() => {});
  }, []);

  // Os lugares acompanham a categoria escolhida: contagem e resultado precisam
  // dizer a mesma coisa.
  useEffect(() => {
    let active = true;
    listProviderLocations(category)
      .then((json) => {
        if (active && Array.isArray(json?.data)) setLocations(json.data);
      })
      .catch(() => {});
    return () => { active = false; };
  }, [category]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const timer = setTimeout(() => {
      searchProviders({ category, city, state })
        .then((json) => {
          if (active) setProviders(json?.data || []);
        })
        .catch(() => {
          if (active) setProviders([]);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 350);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [category, city, state]);

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">Encontrar profissionais</h1>
        <p className="page-sub">
          Veja quem atende na sua região. Para receber propostas com preço, publique um pedido.
        </p>
      </div>

      <LocationFilter
        locations={locations}
        state={state}
        city={city}
        onChange={(lugar) => { setState(lugar.state); setCity(lugar.city); }}
      />

      <div className="chips" style={{ marginBottom: 18 }}>
        <button
          type="button"
          className={`chip ${category === '' ? 'chip-on' : ''}`}
          onClick={() => setCategory('')}
          aria-pressed={category === ''}
        >
          Todas
        </button>
        {categories.map((label) => (
          <button
            key={label}
            type="button"
            className={`chip ${category === label ? 'chip-on' : ''}`}
            onClick={() => setCategory(label)}
            aria-pressed={category === label}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="find-grid">
          <div className="skel" style={{ height: 132 }} />
          <div className="skel" style={{ height: 132 }} />
          <div className="skel" style={{ height: 132 }} />
        </div>
      ) : providers.length === 0 ? (
        <div className="empty">
          <span className="empty-ico">
            <SearchX size={24} />
          </span>
          <strong>Nenhum profissional encontrado</strong>
          <p>
            Tente outra categoria ou cidade. Você também pode publicar um pedido e deixar os profissionais vierem até
            você.
          </p>
          <Link to="/app/pedidos/novo" className="btn-primary">
            Publicar um pedido
          </Link>
        </div>
      ) : (
        <div className="find-grid">
          {providers.map((provider) => {
            const cats = Array.isArray(provider.service_categories) ? provider.service_categories : [];
            return (
              <Link key={provider.uuid} to={`/app/profissionais/${provider.uuid}`} className="find-card">
                {provider.avatar_base64 ? (
                  <img src={provider.avatar_base64} alt="" className="find-avatar" />
                ) : (
                  <span className="find-avatar find-avatar-fallback">{initialsOf(provider.name)}</span>
                )}

                <div className="find-body">
                  <strong>{provider.name}</strong>
                  <div className="meta">
                    {Number(provider.rate) > 0 && (
                      <span className="meta-item">
                        <Star size={13} />
                        {Number(provider.rate).toFixed(1)}
                      </span>
                    )}
                    {Number(provider.completed_services) > 0 && (
                      <span className="meta-item">{provider.completed_services} serviços</span>
                    )}
                  </div>
                  {cats.length > 0 && <p className="find-cats">{cats.slice(0, 3).join(' • ')}</p>}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <p className="find-note">
        <Search size={12} /> A busca filtra por categoria e cidade dos profissionais cadastrados.
      </p>
    </>
  );
}
