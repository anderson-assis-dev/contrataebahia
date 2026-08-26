import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  Ban,
  CalendarClock,
  CheckCircle2,
  Info,
  MapPin,
  MessageSquare,
  Navigation,
  Phone,
  Star,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { ORDER_STATUS_LABEL, cancelOrder, completeOrder, getOrder } from '../../services/orders';
import { cancelAcceptance } from '../../services/proposals';
import { apiError } from '../../services/http';
import ChatPanel from './ChatPanel';
import SchedulePanel from './SchedulePanel';
import TrackingPanel from './TrackingPanel';
import SecurityCodePanel from './SecurityCodePanel';
import OrderTimeline from '../components/OrderTimeline';
import Attachments from '../components/Attachments';
import FullPageLoader from '../FullPageLoader';
import { formatMoney, formatPhone } from '../../utils/format';
import '../ui.css';
import '../forms.css';
import './AcceptedOrder.css';

const TABS = [
  { id: 'chat', label: 'Conversa', icon: MessageSquare },
  { id: 'schedule', label: 'Agendamento', icon: CalendarClock },
  { id: 'tracking', label: 'Rastreio', icon: Navigation },
  { id: 'info', label: 'Detalhes', icon: Info },
];

const initialsOf = (name) =>
  (name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

export default function AcceptedOrder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { isProvider } = useAuth();
  const isClient = !isProvider;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('chat');
  const [busy, setBusy] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState('');

  const load = useCallback(async () => {
    try {
      const json = await getOrder(id);
      if (json?.success) setOrder(json.data);
    } catch (err) {
      toast.error(apiError(err, 'Não foi possível carregar o pedido.'));
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleReopen = async () => {
    const proposalId = order.accepted_proposal_id;
    if (!proposalId) return;
    if (!window.confirm('Desfazer o aceite e reabrir o pedido para novas propostas?')) return;
    setBusy(true);
    try {
      const json = await cancelAcceptance(proposalId);
      if (json?.success) {
        toast.info('Aceite desfeito. O pedido voltou a receber propostas.');
        navigate(`/app/pedidos/${id}`, { replace: true });
        return;
      }
      toast.error(json?.message || 'Não foi possível desfazer o aceite.');
    } catch (err) {
      toast.error(apiError(err, 'Não foi possível desfazer o aceite.'));
    } finally {
      setBusy(false);
    }
  };

  const handleComplete = async () => {
    if (!window.confirm('Confirmar que o serviço foi concluído?')) return;
    setBusy(true);
    try {
      const json = await completeOrder(id);
      if (json?.success) {
        toast.success('Serviço concluído! Agora você pode avaliar o profissional.');
        await load();
        return;
      }
      toast.error(json?.message || 'Não foi possível concluir o serviço.');
    } catch (err) {
      toast.error(apiError(err, 'Não foi possível concluir o serviço.'));
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = async (e) => {
    e.preventDefault();
    if (!reason.trim()) return;
    setBusy(true);
    try {
      const json = await cancelOrder(id, reason.trim());
      if (json?.success) {
        toast.info('Pedido cancelado.');
        setCancelling(false);
        await load();
      }
    } catch (err) {
      toast.error(apiError(err, 'Não foi possível cancelar.'));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <FullPageLoader label="Carregando serviço..." />;

  if (!order) {
    return (
      <div className="empty">
        <span className="empty-ico">
          <AlertCircle size={24} />
        </span>
        <strong>Serviço não encontrado</strong>
        <p>Você pode não ter acesso a este pedido.</p>
        <Link to="/app" className="btn-primary">
          Voltar ao início
        </Link>
      </div>
    );
  }

  const counterpart = isClient ? order.provider : order.client;
  const backTo = isClient ? `/app/pedidos/${id}` : '/app/servicos';
  const finished = order.status === 'completed' || order.status === 'cancelled';

  return (
    <>
      <button type="button" className="page-back" onClick={() => navigate(backTo)}>
        <ArrowLeft size={16} />
        Voltar
      </button>

      <div className="page-head">
        <div className="page-head-row">
          <div>
            <h1 className="page-title">{order.title}</h1>
            <p className="page-sub">
              {order.category} — {formatMoney(order.budget)}
            </p>
          </div>
          <span className={`badge badge-${order.status}`}>{ORDER_STATUS_LABEL[order.status] || order.status}</span>
        </div>
      </div>

      <OrderTimeline order={order} />

      {counterpart && (
        <div className="ao-party">
          {counterpart.avatar_base64 ? (
            <img src={counterpart.avatar_base64} alt="" />
          ) : (
            <span className="ao-party-initials">{initialsOf(counterpart.name)}</span>
          )}
          <div className="ao-party-info">
            <strong>{counterpart.name}</strong>
            <span>{isClient ? 'Profissional contratado' : 'Cliente'}</span>
          </div>
          {counterpart.phone && (
            <a
              href={`https://wa.me/55${String(counterpart.phone).replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ao-party-call"
              aria-label={`Falar com ${counterpart.name}`}
            >
              <Phone size={16} />
              {formatPhone(counterpart.phone)}
            </a>
          )}
        </div>
      )}

      <div className="ao-tabs" role="tablist">
        {TABS.map(({ id: tabId, label, icon: Icon }) => (
          <button
            key={tabId}
            type="button"
            role="tab"
            aria-selected={tab === tabId}
            className={`ao-tab ${tab === tabId ? 'ao-tab-on' : ''}`}
            onClick={() => setTab(tabId)}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      <div className="ao-panel">
        <div hidden={tab !== 'chat'}>
          {order.status === 'in_progress' ? (
            <ChatPanel orderId={id} counterpart={counterpart} />
          ) : (
            <div className="f-alert f-alert-info">
              <Info size={16} />
              <span>A conversa fica disponível enquanto o serviço está em andamento.</span>
            </div>
          )}
        </div>
        <div hidden={tab !== 'schedule'}>
          {order.status === 'in_progress' ? (
            <SchedulePanel order={order} isClient={isClient} onChanged={load} />
          ) : (
            <div className="f-alert f-alert-info">
              <Info size={16} />
              <span>O agendamento só pode ser alterado em serviços em andamento.</span>
            </div>
          )}
        </div>
        <div hidden={tab !== 'tracking'}>
          {order.status === 'in_progress' ? (
            <TrackingPanel order={order} isClient={isClient} />
          ) : (
            <div className="f-alert f-alert-info">
              <Info size={16} />
              <span>O rastreio fica disponível enquanto o serviço está em andamento.</span>
            </div>
          )}
        </div>

        {tab === 'info' && (
          <div className="stack">
            <div className="card">
              <div className="card-title">Descrição</div>
              <p className="ao-desc">{order.description}</p>
            </div>

            {order.address && (
              <div className="card">
                <div className="card-title">Endereço</div>
                <p className="card-sub">
                  <MapPin size={14} style={{ verticalAlign: '-2px', marginRight: 5 }} />
                  {order.address}
                  {order.complement ? ` — ${order.complement}` : ''}
                </p>
              </div>
            )}

            {order.attachments?.length > 0 && (
              <div className="card">
                <div className="card-title">Anexos</div>
                <Attachments items={order.attachments} />
              </div>
            )}

            {order.status === 'in_progress' && <SecurityCodePanel orderId={id} isClient={isClient} />}

            {order.status === 'completed' && isClient && order.provider_id && (
              <Link to={`/app/avaliar/${order.provider_id}?pedido=${id}`} className="f-submit">
                <Star size={17} />
                Avaliar o profissional
              </Link>
            )}

            {!finished && (
              <div className="card stack">
                <div className="card-title">Encerramento</div>

                {isClient && (
                  <button type="button" className="f-submit" onClick={handleComplete} disabled={busy}>
                    <CheckCircle2 size={17} />
                    Marcar como concluído
                  </button>
                )}

                {isClient && order.accepted_proposal_id && !order.scheduled_date && (
                  <button type="button" className="f-ghost" onClick={handleReopen} disabled={busy}>
                    Desfazer aceite e reabrir leilão
                  </button>
                )}

                {!cancelling ? (
                  <button
                    type="button"
                    className="f-ghost od-danger"
                    onClick={() => setCancelling(true)}
                    disabled={busy}
                  >
                    <Ban size={16} />
                    Cancelar serviço
                  </button>
                ) : (
                  <form className="stack" onSubmit={handleCancel}>
                    <div className="f-field">
                      <label htmlFor="ao-reason">Motivo do cancelamento</label>
                      <textarea
                        id="ao-reason"
                        className="f-textarea"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        required
                      />
                    </div>
                    <button type="submit" className="f-submit" disabled={busy || !reason.trim()}>
                      Confirmar cancelamento
                    </button>
                    <button type="button" className="f-ghost" onClick={() => setCancelling(false)}>
                      Voltar
                    </button>
                  </form>
                )}
              </div>
            )}

            {order.cancel_reason && (
              <div className="f-alert f-alert-err">
                <AlertCircle size={16} />
                <span>
                  <strong>Cancelado.</strong> {order.cancel_reason}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
