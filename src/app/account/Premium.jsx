import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, BarChart2, Check, Clock, Crown, Star, TrendingUp, Zap } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { ensureWallet } from '../../services/wallet';
import { cancelSubscription, getSubscriptionStatus, subscribe } from '../../services/subscriptions';
import { stripePromise } from '../../services/stripe';
import { apiError } from '../../services/http';
import { formatDateBR } from '../../utils/format';
import FullPageLoader from '../FullPageLoader';
import '../forms.css';
import '../ui.css';
import './Premium.css';

const BENEFITS = [
  { icon: TrendingUp, text: 'Prioridade no feed — suas propostas aparecem primeiro para o cliente' },
  { icon: Zap, text: 'Propostas ilimitadas por mês (plano gratuito: até 10)' },
  { icon: Clock, text: 'Acesso antecipado a novas cotações — 30 minutos antes' },
  { icon: Star, text: 'Selo de prestador verificado no perfil' },
  { icon: BarChart2, text: 'Métricas de desempenho, visitas e conversão' },
];

export default function Premium() {
  const toast = useToast();
  const { isProvider, refreshUser } = useAuth();
  const [status, setStatus] = useState(null);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [statusJson, walletJson] = await Promise.all([
        getSubscriptionStatus().catch(() => null),
        ensureWallet().catch(() => null),
      ]);
      if (statusJson?.success) setStatus(statusJson.data);
      setCards(walletJson?.data?.payment_methods || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubscribe = async () => {
    if (cards.length === 0) {
      toast.info('Adicione um cartão na carteira antes de assinar.');
      return;
    }
    if (!window.confirm(`Cobrar R$ 9,90/mês no cartão •••• ${cards[0].last4}?`)) return;
    setBusy(true);
    try {
      const json = await subscribe(cards[0].id);
      if (json?.requires_action && json.payment_intent_client_secret) {
        const stripe = await stripePromise;
        if (!stripe) {
          toast.error('Não foi possível autenticar o pagamento neste navegador.');
          return;
        }
        const result = await stripe.confirmCardPayment(json.payment_intent_client_secret);
        if (result.error) {
          toast.error(result.error.message || 'A autenticação do cartão não foi concluída.');
          return;
        }
        toast.success('Pagamento autenticado. Ativando o Premium...');
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await refreshUser();
        await load();
        return;
      }
      if (json?.success) {
        toast.success('Plano Premium ativado.');
        await refreshUser();
        await load();
        return;
      }
      toast.error(json?.message || 'Não foi possível assinar.');
    } catch (err) {
      toast.error(apiError(err, 'Não foi possível processar o pagamento.'));
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Você continua Premium até o fim do período atual. Cancelar mesmo assim?')) return;
    setBusy(true);
    try {
      const json = await cancelSubscription();
      if (json?.success) {
        toast.info(json.message || 'Assinatura cancelada.');
        await refreshUser();
        await load();
        return;
      }
      toast.error(json?.message || 'Não foi possível cancelar.');
    } catch (err) {
      toast.error(apiError(err, 'Não foi possível cancelar.'));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <FullPageLoader label="Carregando plano..." />;

  if (!isProvider) {
    return (
      <div className="empty">
        <span className="empty-ico">
          <Crown size={24} />
        </span>
        <strong>Premium é para prestadores</strong>
        <p>O plano aumenta a visibilidade de quem oferece serviços. Mude seu perfil se quiser oferecer.</p>
        <Link to="/app/perfil/tipo" className="btn-primary">
          Mudar tipo de perfil
        </Link>
      </div>
    );
  }

  const isActive = Boolean(status?.is_premium);
  const willCancel = Boolean(status?.subscription?.cancel_at_period_end);
  const renews = status?.subscription?.current_period_end || status?.premium_until;

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">Plano Premium</h1>
        <p className="page-sub">Mais visibilidade, propostas ilimitadas e métricas do seu desempenho.</p>
      </div>

      <div className={`prem-hero ${isActive ? 'prem-hero-on' : ''}`}>
        <Crown size={36} />
        <h2>{isActive ? 'Você é Premium' : 'Seja Premium'}</h2>
        <p className="prem-price">
          R$ 9<span>,90</span>
          <em>/mês</em>
        </p>
        {isActive && renews && (
          <span className="prem-badge">
            {willCancel ? `Acesso até ${formatDateBR(renews)}` : `Renova em ${formatDateBR(renews)}`}
          </span>
        )}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-title">O que está incluso</div>
        <ul className="prem-list">
          {BENEFITS.map(({ icon: Icon, text }) => (
            <li key={text}>
              <span className="prem-ico">
                <Icon size={16} />
              </span>
              <span>{text}</span>
              <Check size={16} className="prem-check" />
            </li>
          ))}
        </ul>
      </div>

      <div className="stack" style={{ marginTop: 16 }}>
        {!isActive && cards.length > 0 && (
          <p className="card-sub">
            Será cobrado no {String(cards[0].brand || '').toUpperCase()} •••• {cards[0].last4}
          </p>
        )}

        {!isActive && cards.length === 0 && (
          <div className="f-alert f-alert-info">
            <AlertCircle size={16} />
            <span>
              Cadastre um cartão na <Link to="/app/carteira">carteira</Link> para assinar.
            </span>
          </div>
        )}

        {!isActive ? (
          <button type="button" className="f-submit" onClick={handleSubscribe} disabled={busy || cards.length === 0}>
            <Crown size={17} />
            {busy ? 'Processando...' : 'Assinar por R$ 9,90/mês'}
          </button>
        ) : !willCancel ? (
          <button type="button" className="f-ghost od-danger" onClick={handleCancel} disabled={busy}>
            {busy ? 'Cancelando...' : 'Cancelar assinatura'}
          </button>
        ) : (
          <div className="f-alert f-alert-info">
            <AlertCircle size={16} />
            <span>Assinatura cancelada. Você continua Premium até {formatDateBR(status?.premium_until)}.</span>
          </div>
        )}

        <Link to="/app/carteira" className="f-ghost">
          Gerenciar cartões
        </Link>
      </div>
    </>
  );
}
