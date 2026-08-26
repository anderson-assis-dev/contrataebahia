import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  Ban,
  CalendarClock,
  Gavel,
  Hourglass,
  MapPin,
  Pause,
  Play,
  RefreshCw,
  Tag,
  Trash2,
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import {
  ORDER_STATUS_LABEL,
  cancelOrder,
  deleteOrder,
  resolveOrder,
  startAuction,
  toggleStopOrder,
} from '../../services/orders';
import { acceptProposal, rejectProposal } from '../../services/proposals';
import { apiError } from '../../services/http';
import useCountdown from '../hooks/useCountdown';
import ProposalCard from '../components/ProposalCard';
import Attachments from '../components/Attachments';
import FullPageLoader from '../FullPageLoader';
import { formatDateTimeBR, formatMoney } from '../../utils/format';
import '../ui.css';
import '../forms.css';
import './OrderDetail.css';

const POLL_MS = 20000;

export default function OrderDetail() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState('');

  const load = useCallback(
    async (silent) => {
      if (!silent) setLoading(true);
      try {
        const json = await resolveOrder(id, location.state?.order);
        if (json?.success) setOrder(json.data);
        else if (!silent) setOrder(null);
      } catch (err) {
        if (!silent) toast.error(apiError(err, 'Não foi possível carregar o pedido.'));
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [id, location.state, toast]
  );

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (order?.status !== 'open') return undefined;
    const timer = setInterval(() => load(true), POLL_MS);
    return () => clearInterval(timer);
  }, [order?.status, load]);

  const auctionEnd = order?.auction_ends_at;
  const { label: remaining, expired } = useCountdown(auctionEnd);
  const auctionActive = Boolean(auctionEnd) && !expired;

  const proposals = useMemo(() => order?.proposals || [], [order]);
  const pending = proposals.filter((p) => p.status === 'pending');
  const accepted = proposals.find((p) => p.status === 'accepted');

  const handleAccept = async (proposal) => {
    if (!window.confirm(`Aceitar a proposta de ${formatMoney(proposal.price)}? O pedido sai do leilão.`)) return;
    setBusy(true);
    try {
      const json = await acceptProposal(proposal.id);
      if (json?.success) {
        toast.success('Proposta aceita! Agora você pode combinar os detalhes no chat.');
        navigate(`/app/pedidos/${id}/andamento`, { replace: true });
        return;
      }
      toast.error(json?.message || 'Não foi possível aceitar a proposta.');
    } catch (err) {
      toast.error(apiError(err, 'Não foi possível aceitar a proposta.'));
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async (proposal) => {
    setBusy(true);
    try {
      const json = await rejectProposal(proposal.id);
      if (json?.success) {
        toast.info('Proposta recusada.');
        await load(true);
        return;
      }
      toast.error(json?.message || 'Não foi possível recusar a proposta.');
    } catch (err) {
      toast.error(apiError(err, 'Não foi possível recusar a proposta.'));
    } finally {
      setBusy(false);
    }
  };

  const handleToggleStop = async () => {
    setBusy(true);
    try {
      const json = await toggleStopOrder(id);
      if (json?.success) {
        toast.success(order.status === 'open' ? 'Pedido pausado.' : 'Pedido reativado.');
        await load(true);
      }
    } catch (err) {
      toast.error(apiError(err, 'Não foi possível alterar o pedido.'));
    } finally {
      setBusy(false);
    }
  };

  const handleStartAuction = async () => {
    setBusy(true);
    try {
      const json = await startAuction(id);
      if (json?.success) {
        toast.success('Leilão iniciado! Você tem 7 dias para escolher a melhor proposta.');
        await load(true);
      }
    } catch (err) {
      toast.error(apiError(err, 'Não foi possível iniciar o leilão.'));
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
        toast.success('Pedido cancelado.');
        setCancelling(false);
        await load(true);
      }
    } catch (err) {
      toast.error(apiError(err, 'Não foi possível cancelar o pedido.'));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Excluir este pedido definitivamente?')) return;
    setBusy(true);
    try {
      const json = await deleteOrder(id);
      if (json?.success) {
        toast.success('Pedido excluído.');
        navigate('/app/pedidos', { replace: true });
      }
    } catch (err) {
      toast.error(apiError(err, 'Não foi possível excluir o pedido.'));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <FullPageLoader label="Carregando pedido..." />;

  if (!order) {
    return (
      <div className="empty">
        <span className="empty-ico">
          <AlertCircle size={24} />
        </span>
        <strong>Pedido não encontrado</strong>
        <p>Este pedido não está mais aberto ou você não tem permissão para vê-lo.</p>
        <Link to="/app/pedidos" className="btn-primary">
          Ver meus pedidos
        </Link>
      </div>
    );
  }

  const isOpen = order.status === 'open';
  const isStopped = order.status === 'stopped';

  return (
    <>
      <button type="button" className="page-back" onClick={() => navigate('/app/pedidos')}>
        <ArrowLeft size={16} />
        Meus pedidos
      </button>

      <div className="page-head">
        <div className="page-head-row">
          <div>
            <h1 className="page-title">{order.title}</h1>
            <div className="meta" style={{ marginTop: 8 }}>
              <span className="meta-item">
                <Tag size={14} />
                {order.category}
              </span>
              <span className="meta-item">
                <Hourglass size={14} />
                {order.deadline} dias
              </span>
              {order.address && (
                <span className="meta-item">
                  <MapPin size={14} />
                  {order.address}
                </span>
              )}
            </div>
          </div>
          <span className={`badge badge-${order.status}`}>{ORDER_STATUS_LABEL[order.status] || order.status}</span>
        </div>
      </div>

      {order.status === 'in_progress' && (
        <Link to={`/app/pedidos/${id}/andamento`} className="od-progress">
          <CalendarClock size={20} />
          <div>
            <strong>Serviço em andamento</strong>
            <span>Abra o chat, combine o agendamento e acompanhe o prestador</span>
          </div>
        </Link>
      )}

      <div className="od-grid">
        <div className="stack">
          {isOpen && (
            <div className="card od-auction">
              <div className="od-auction-head">
                <span className="od-auction-ico">
                  <Gavel size={20} />
                </span>
                <div>
                  <div className="card-title">{auctionActive ? 'Leilão em andamento' : 'Recebendo propostas'}</div>
                  <p className="card-sub">
                    {auctionActive
                      ? `Encerra em ${remaining}`
                      : auctionEnd
                        ? 'A janela do leilão encerrou, mas você ainda pode aceitar uma proposta.'
                        : 'Os profissionais já podem enviar propostas. Inicie o leilão para criar um prazo de decisão.'}
                  </p>
                </div>
              </div>

              <div className="od-auction-stats">
                <div>
                  <strong>{proposals.length}</strong>
                  <span>{proposals.length === 1 ? 'proposta' : 'propostas'}</span>
                </div>
                <div>
                  <strong>{formatMoney(order.budget)}</strong>
                  <span>seu orçamento</span>
                </div>
                {pending.length > 0 && (
                  <div>
                    <strong>{formatMoney(Math.min(...pending.map((p) => Number(p.price))))}</strong>
                    <span>menor proposta</span>
                  </div>
                )}
              </div>

              {!auctionEnd && (
                <button type="button" className="f-ghost" onClick={handleStartAuction} disabled={busy}>
                  <Gavel size={16} />
                  Iniciar leilão de 7 dias
                </button>
              )}
            </div>
          )}

          <section>
            <div className="od-section-head">
              <h2 className="card-title">
                Propostas {proposals.length > 0 && <span className="od-count">{proposals.length}</span>}
              </h2>
              <button type="button" className="od-refresh" onClick={() => load(true)} disabled={busy}>
                <RefreshCw size={14} />
                Atualizar
              </button>
            </div>

            {proposals.length === 0 ? (
              <div className="empty">
                <span className="empty-ico">
                  <Gavel size={24} />
                </span>
                <strong>Nenhuma proposta ainda</strong>
                <p>
                  Assim que os profissionais da categoria virem seu pedido, as propostas aparecem aqui. Isso costuma
                  levar alguns minutos.
                </p>
              </div>
            ) : (
              <div className="stack">
                {accepted && (
                  <ProposalCard proposal={accepted} canDecide={false} />
                )}
                {proposals
                  .filter((p) => p.status !== 'accepted')
                  .map((proposal) => (
                    <ProposalCard
                      key={proposal.id}
                      proposal={proposal}
                      canDecide={isOpen && !accepted}
                      busy={busy}
                      onAccept={handleAccept}
                      onReject={handleReject}
                    />
                  ))}
              </div>
            )}
          </section>
        </div>

        <div className="stack">
          <div className="card">
            <div className="card-title">Descrição</div>
            <p className="od-desc">{order.description}</p>
          </div>

          {order.attachments?.length > 0 && (
            <div className="card">
              <div className="card-title">Anexos</div>
              <Attachments items={order.attachments} />
            </div>
          )}

          <div className="card stack">
            <div className="card-title">Ações</div>

            {(isOpen || isStopped) && (
              <>
                <button type="button" className="f-ghost" onClick={handleToggleStop} disabled={busy}>
                  {isOpen ? <Pause size={16} /> : <Play size={16} />}
                  {isOpen ? 'Pausar pedido' : 'Reativar pedido'}
                </button>

                {proposals.length === 0 && (
                  <Link to={`/app/pedidos/${id}/editar`} className="f-ghost">
                    Editar pedido
                  </Link>
                )}
              </>
            )}

            {order.status !== 'cancelled' && order.status !== 'completed' && !cancelling && (
              <button type="button" className="f-ghost od-danger" onClick={() => setCancelling(true)} disabled={busy}>
                <Ban size={16} />
                Cancelar pedido
              </button>
            )}

            {cancelling && (
              <form className="stack" onSubmit={handleCancel}>
                <div className="f-field">
                  <label htmlFor="od-reason">Motivo do cancelamento</label>
                  <textarea
                    id="od-reason"
                    className="f-textarea"
                    placeholder="Conte rapidamente o motivo"
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

            {(isOpen || isStopped) && proposals.length === 0 && (
              <button type="button" className="f-ghost od-danger" onClick={handleDelete} disabled={busy}>
                <Trash2 size={16} />
                Excluir pedido
              </button>
            )}
          </div>

          {order.cancel_reason && (
            <div className="f-alert f-alert-err">
              <AlertCircle size={16} />
              <span>
                <strong>Pedido cancelado.</strong> {order.cancel_reason}
              </span>
            </div>
          )}

          <p className="od-created">Criado em {formatDateTimeBR(order.created_at)}</p>
        </div>
      </div>
    </>
  );
}
