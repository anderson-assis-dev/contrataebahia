import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, MapPin, MessageSquarePlus, Star, Wrench } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { getPublicProvider, recordProfileView, requestQuote } from '../../services/catalog';
import { listProviderRatings } from '../../services/ratings';
import { apiError } from '../../services/http';
import FullPageLoader from '../FullPageLoader';
import { formatMoney, timeAgo } from '../../utils/format';
import '../ui.css';
import '../forms.css';
import './ProviderProfile.css';

const initialsOf = (name) =>
  (name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

export default function ProviderProfile() {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [provider, setProvider] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    let active = true;
    getPublicProvider(uuid)
      .then((json) => {
        if (!active || !json?.success) return;
        setProvider(json.data);
        const providerId = json.data?.provider_id;
        if (providerId) {
          recordProfileView(providerId);
          listProviderRatings(providerId, { limit: 5 })
            .then((res) => {
              if (active) setRatings(res?.data?.ratings || res?.data?.data || []);
            })
            .catch(() => {});
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [uuid]);

  const handleQuote = async () => {
    setRequesting(true);
    try {
      const json = await requestQuote(provider.provider_id);
      if (json?.success) {
        toast.success('Pedido de orçamento enviado. O profissional vai te responder.');
        return;
      }
      toast.error(json?.message || 'Não foi possível pedir orçamento.');
    } catch (err) {
      toast.error(apiError(err, 'Não foi possível pedir orçamento.'));
    } finally {
      setRequesting(false);
    }
  };

  if (loading) return <FullPageLoader label="Carregando perfil..." />;

  if (!provider) {
    return (
      <div className="empty">
        <span className="empty-ico">
          <AlertCircle size={24} />
        </span>
        <strong>Profissional não encontrado</strong>
        <p>Este perfil pode ter sido removido ou desativado.</p>
        <Link to="/app/buscar" className="btn-primary">
          Voltar à busca
        </Link>
      </div>
    );
  }

  const cats = Array.isArray(provider.service_categories) ? provider.service_categories : [];
  const services = provider.services || [];

  return (
    <>
      <button type="button" className="page-back" onClick={() => navigate('/app/buscar')}>
        <ArrowLeft size={16} />
        Busca
      </button>

      <div className="pp-hero">
        {provider.avatar_base64 ? (
          <img src={provider.avatar_base64} alt="" className="pp-avatar" />
        ) : (
          <span className="pp-avatar pp-avatar-fallback">{initialsOf(provider.name)}</span>
        )}

        <div className="pp-hero-info">
          <h1>{provider.name}</h1>
          <div className="meta">
            {Number(provider.rate) > 0 && (
              <span className="meta-item">
                <Star size={14} />
                {Number(provider.rate).toFixed(1)}
                {Number(provider.ratings_count) > 0 && ` (${provider.ratings_count})`}
              </span>
            )}
            {Number(provider.completed_services) > 0 && (
              <span className="meta-item">{provider.completed_services} serviços concluídos</span>
            )}
            {provider.address && (
              <span className="meta-item">
                <MapPin size={14} />
                {provider.address}
              </span>
            )}
          </div>
        </div>
      </div>

      {cats.length > 0 && (
        <div className="chips" style={{ marginBottom: 18 }}>
          {cats.map((label) => (
            <span key={label} className="chip">
              {label}
            </span>
          ))}
        </div>
      )}

      <div className="stack">
        <div className="card stack">
          <div>
            <div className="card-title">Quer um orçamento?</div>
            <p className="card-sub">
              Avise o profissional que você tem interesse. Para comparar preços de vários profissionais, publique um
              pedido e receba propostas.
            </p>
          </div>
          <button type="button" className="f-submit" onClick={handleQuote} disabled={requesting}>
            <MessageSquarePlus size={17} />
            {requesting ? 'Enviando...' : 'Pedir orçamento'}
          </button>
          <Link to="/app/pedidos/novo" className="f-ghost">
            Publicar pedido e receber propostas
          </Link>
        </div>

        {services.length > 0 && (
          <div className="card">
            <div className="card-title">Serviços oferecidos</div>
            <ul className="pp-services">
              {services.map((service) => (
                <li key={service.id}>
                  <div>
                    <strong>{service.title}</strong>
                    {service.description && <p>{service.description}</p>}
                  </div>
                  {Number(service.price) > 0 && <span>{formatMoney(service.price)}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {ratings.length > 0 && (
          <div className="card">
            <div className="card-title">O que os clientes dizem</div>
            <ul className="pp-ratings">
              {ratings.map((rating) => (
                <li key={rating.id}>
                  <div className="pp-rating-head">
                    <span className="pp-rating-stars">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <Star
                          key={value}
                          size={13}
                          className={value <= Number(rating.rating) ? 'pp-star-on' : ''}
                        />
                      ))}
                    </span>
                    <span className="pp-rating-meta">
                      {rating.client_name || 'Cliente'} — {timeAgo(rating.created_at)}
                    </span>
                  </div>
                  {rating.comment && <p>{rating.comment}</p>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {services.length === 0 && ratings.length === 0 && (
          <div className="empty">
            <span className="empty-ico">
              <Wrench size={24} />
            </span>
            <strong>Perfil ainda sem histórico público</strong>
            <p>Este profissional ainda não cadastrou serviços nem recebeu avaliações no Contrataê.</p>
          </div>
        )}
      </div>
    </>
  );
}
