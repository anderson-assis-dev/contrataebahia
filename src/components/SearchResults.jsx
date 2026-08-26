import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search, Star, ArrowLeft, X, Briefcase, CheckCircle2, Zap, MapPin, Loader2, SearchX,
} from 'lucide-react';
import './SearchResults.css';
import { apiGet, API_ENABLED } from '../utils/api';

function Avatar({ provider }) {
  if (provider.avatar_base64) {
    const src = provider.avatar_base64.startsWith('data:')
      ? provider.avatar_base64
      : `data:image/jpeg;base64,${provider.avatar_base64}`;
    return <img className="sr-avatar" src={src} alt={provider.name} />;
  }
  const initials = provider.name
    ? provider.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
    : '?';
  return <div className="sr-avatar">{initials}</div>;
}

function ProviderCard({ provider }) {
  const cats = provider.service_categories || [];
  return (
    <button type="button" className="sr-card" onClick={provider.onOpen}>
      <div className="sr-card-top">
        <Avatar provider={provider} />
      </div>
      <div className="sr-card-body">
        <div className="sr-name">{provider.name}</div>
        {provider.address && <div className="sr-address">{provider.address}</div>}
        {cats.length > 0 && (
          <div className="sr-cats">
            {cats.slice(0, 3).map((c) => (
              <span key={c} className="sr-cat-tag">{c}</span>
            ))}
          </div>
        )}
        <div className="sr-footer-row">
          <div className="sr-rating">
            <Star size={13} fill="currentColor" />
            {provider.rate ? Number(provider.rate).toFixed(1) : 'Novo'}
            {provider.rate && <span>avaliação</span>}
          </div>
          <div className="sr-done">
            <strong>{provider.completed_services ?? 0}</strong> concluídos
          </div>
        </div>
      </div>
    </button>
  );
}

function ProviderModal({ open, onClose, provider, details, loading }) {
  if (!open) return null;
  return (
    <div
      className="sr-modal-backdrop"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="sr-modal">
        <div className="sr-modal-head">
          <div className="sr-modal-title">{provider?.name || 'Prestador'}</div>
          <button type="button" className="sr-modal-close" onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        <div className="sr-modal-body">
          <div className="sr-modal-hero">
            <div className="sr-modal-avatar">
              <Avatar provider={provider || {}} />
            </div>
            <div className="sr-modal-hero-meta">
              {provider?.address && <div className="sr-modal-address">{provider.address}</div>}
              <div className="sr-modal-stats">
                <div className="sr-modal-stat">
                  <Star size={14} fill="currentColor" />
                  <div>
                    <div className="sr-modal-stat-v">
                      {details?.rate
                        ? Number(details.rate).toFixed(1)
                        : provider?.rate ? Number(provider.rate).toFixed(1) : 'Novo'}
                    </div>
                    <div className="sr-modal-stat-k">
                      {details?.ratings_count ? `${details.ratings_count} avaliações` : 'avaliações'}
                    </div>
                  </div>
                </div>
                <div className="sr-modal-stat">
                  <CheckCircle2 size={14} />
                  <div>
                    <div className="sr-modal-stat-v">
                      {details?.completed_services ?? provider?.completed_services ?? 0}
                    </div>
                    <div className="sr-modal-stat-k">concluídos</div>
                  </div>
                </div>
                <div className="sr-modal-stat">
                  <Zap size={14} />
                  <div>
                    <div className="sr-modal-stat-v">
                      {details?.active_services ?? provider?.active_services ?? 0}
                    </div>
                    <div className="sr-modal-stat-k">ativos</div>
                  </div>
                </div>
                <div className="sr-modal-stat">
                  <Briefcase size={14} />
                  <div>
                    <div className="sr-modal-stat-v">{details?.services_count ?? 0}</div>
                    <div className="sr-modal-stat-k">serviços cadastrados</div>
                  </div>
                </div>
              </div>
              {Array.isArray(details?.service_categories) && details.service_categories.length > 0 && (
                <div className="sr-modal-cats">
                  {details.service_categories.slice(0, 8).map((c) => (
                    <span key={c} className="sr-cat-tag">{c}</span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="sr-modal-section">
            <div className="sr-modal-section-title">Serviços cadastrados</div>
            {loading && <div className="sr-modal-loading">Carregando...</div>}
            {!loading && (!details?.services || details.services.length === 0) && (
              <div className="sr-modal-empty">Nenhum serviço cadastrado</div>
            )}
            {!loading && details?.services?.length > 0 && (
              <div className="sr-modal-services">
                {details.services.map((s) => (
                  <div key={s.id} className="sr-modal-service">
                    <div className="sr-modal-service-title">{s.title || s.category}</div>
                    {s.description && <div className="sr-modal-service-desc">{s.description}</div>}
                    <div className="sr-modal-service-meta">
                      {s.category && <span className="sr-modal-pill">{s.category}</span>}
                      {s.price && <span className="sr-modal-pill">{s.price}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [cityInput, setCityInput] = useState(searchParams.get('city') || '');
  const [locating, setLocating] = useState(false);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [providerDetails, setProviderDetails] = useState(null);

  const fetchProviders = useCallback(async (q, city) => {
    if (!API_ENABLED) {
      setProviders([]);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (city) params.set('city', city);
      const data = await apiGet(`/api/providers/search?${params}`);
      setProviders(Array.isArray(data) ? data : []);
    } catch {
      setProviders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProviders(searchParams.get('q') || '', searchParams.get('city') || '');
  }, [searchParams, fetchProviders]);

  const handleSearch = (e) => {
    e.preventDefault();
    const next = {};
    if (query) next.q = query;
    if (cityInput.trim()) next.city = cityInput.trim();
    setSearchParams(next);
  };

  const handleUseLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json&accept-language=pt-BR`
          );
          const data = await res.json();
          const city = data.address?.city || data.address?.town
            || data.address?.village || data.address?.county || '';
          setCityInput(city);
          const next = {};
          if (searchParams.get('q')) next.q = searchParams.get('q');
          if (city) next.city = city;
          setSearchParams(next);
        } catch {
          // o usuário ainda pode digitar a cidade manualmente
        } finally {
          setLocating(false);
        }
      },
      () => setLocating(false),
      { timeout: 8000 }
    );
  };

  const clearCity = () => {
    setCityInput('');
    const next = {};
    if (searchParams.get('q')) next.q = searchParams.get('q');
    setSearchParams(next);
  };

  const openProvider = async (p) => {
    setSelectedProvider(p);
    setProviderDetails(null);
    setModalOpen(true);
    setDetailsLoading(true);
    try {
      const data = await apiGet(`/api/providers/${p.uuid}/public`);
      setProviderDetails(data);
    } catch {
      setProviderDetails(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeProvider = () => {
    setModalOpen(false);
    setSelectedProvider(null);
    setProviderDetails(null);
    setDetailsLoading(false);
  };

  const q = searchParams.get('q') || '';

  return (
    <div className="sr-page">
      <div className="sr-header">
        <div className="sr-header-inner">
          <Link to="/" className="sr-back" aria-label="Voltar">
            <ArrowLeft size={18} />
          </Link>

          <form className="sr-search-bar" onSubmit={handleSearch}>
            <Search size={18} aria-hidden="true" />
            <input
              type="text"
              aria-label="Buscar serviço"
              placeholder="Ex: Limpeza, Elétrica, Pintura..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit" className="sr-search-btn">Buscar</button>
          </form>
        </div>
      </div>

      <div className="sr-body">
        <div className="sr-meta">
          <h1 className="sr-meta-title">
            {q ? `Prestadores de "${q}"` : 'Todos os prestadores'}
          </h1>
          {!loading && (
            <div className="sr-meta-sub">
              {providers.length} prestador{providers.length !== 1 ? 'es' : ''} encontrado
              {providers.length !== 1 ? 's' : ''}
              {searchParams.get('city') && ` em ${searchParams.get('city')}`}
            </div>
          )}
        </div>

        <div className="sr-city-filter">
          <div className="sr-city-input-wrap">
            <MapPin size={15} className="sr-city-icon" aria-hidden="true" />
            <input
              type="text"
              className="sr-city-input"
              aria-label="Filtrar por cidade"
              placeholder="Filtrar por cidade..."
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
            />
            {cityInput && (
              <button type="button" className="sr-city-clear" onClick={clearCity} aria-label="Limpar cidade">
                <X size={13} />
              </button>
            )}
          </div>
          <button
            type="button"
            className={`sr-locate-btn${locating ? ' loading' : ''}`}
            onClick={handleUseLocation}
            disabled={locating}
            title="Usar minha localização"
          >
            {locating ? <Loader2 size={15} className="sr-spin" /> : <MapPin size={15} />}
            {locating ? 'Localizando...' : 'Usar localização'}
          </button>
        </div>

        {loading && (
          <div className="sr-loading">
            <div className="sr-spinner" />
            Buscando prestadores...
          </div>
        )}

        {!loading && providers.length === 0 && (
          <div className="sr-empty">
            <div className="sr-empty-icon"><SearchX size={30} /></div>
            <div className="sr-empty-title">Nenhum prestador encontrado</div>
            <div className="sr-empty-sub">
              Tente outra categoria ou deixe a busca em branco para ver todos os prestadores.
            </div>
            <Link to="/cadastro/prestador" className="btn-primary sr-empty-cta">
              Seja um prestador
            </Link>
          </div>
        )}

        {!loading && providers.length > 0 && (
          <div className="sr-grid">
            {providers.map((p) => (
              <ProviderCard key={p.uuid} provider={{ ...p, onOpen: () => openProvider(p) }} />
            ))}
          </div>
        )}
      </div>

      <ProviderModal
        open={modalOpen}
        onClose={closeProvider}
        provider={selectedProvider}
        details={providerDetails}
        loading={detailsLoading}
      />
    </div>
  );
}
