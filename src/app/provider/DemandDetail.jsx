import React, { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Crown, Hourglass, MapPin, Send, Tag, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { ORDER_STATUS_LABEL, resolveOrder } from '../../services/orders';
import { createProposal, listProposals, updateProposal, withdrawProposal } from '../../services/proposals';
import { apiError } from '../../services/http';
import Attachments from '../components/Attachments';
import FullPageLoader from '../FullPageLoader';
import { formatDateTimeBR, formatMoney, onlyDigits } from '../../utils/format';
import '../ui.css';
import '../forms.css';
import '../client/OrderDetail.css';
import '../client/CreateOrder.css';

export default function DemandDetail() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const [order, setOrder] = useState(null);
  const [mine, setMine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [price, setPrice] = useState('');
  const [deadline, setDeadline] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [upgrade, setUpgrade] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const hint = location.state?.order;
      const [orderJson, proposalsJson] = await Promise.all([
        resolveOrder(id, hint),
        listProposals({ order_id: id, limit: 100 }).catch(() => null),
      ]);
      const existing = (proposalsJson?.data?.data || []).find(
        (item) =>
          String(item.order_id) === String(id) &&
          (!user?.id || String(item.provider_id) === String(user.id))
      ) || null;
      const fromProposal = existing?.order;
      if (orderJson?.success && orderJson.data) {
        setOrder(orderJson.data);
      } else if (fromProposal && String(fromProposal.id) === String(id)) {
        setOrder(fromProposal);
      } else {
        setOrder(null);
      }
      setMine(existing);
      if (existing) {
        setPrice(String(Math.round(Number(existing.price) * 100)));
        setDeadline(String(existing.deadline || ''));
        setDescription(existing.description || '');
      }
    } catch (err) {
      toast.error(apiError(err, 'Não foi possível carregar a demanda.'));
    } finally {
      setLoading(false);
    }
  }, [id, location.state, toast, user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const priceValue = Number(onlyDigits(price)) / 100;
  const pricePreview = priceValue > 0 ? formatMoney(priceValue) : '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setUpgrade(false);
    if (!(priceValue > 0)) {
      setError('Informe o valor da sua proposta.');
      return;
    }
    if (!onlyDigits(deadline)) {
      setError('Informe em quantos dias você entrega.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        price: priceValue,
        deadline: onlyDigits(deadline),
        description: description.trim(),
      };
      const json = mine
        ? await updateProposal(mine.id, payload)
        : await createProposal({ order_id: Number(id), ...payload });
      if (json?.success) {
        toast.success(mine ? 'Proposta atualizada.' : 'Proposta enviada! O cliente já pode ver.');
        await load();
        return;
      }
      setError(json?.message || 'Não foi possível enviar a proposta.');
    } catch (err) {
      const data = err?.response?.data;
      if (data?.error === 'upgrade_required' || /limite/i.test(data?.message || '')) {
        setUpgrade(true);
        setError(data?.message || 'Você atingiu o limite de propostas do plano gratuito neste mês.');
      } else {
        setError(apiError(err, 'Não foi possível enviar a proposta.'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    if (!window.confirm('Retirar sua proposta deste pedido?')) return;
    setSubmitting(true);
    try {
      const json = await withdrawProposal(mine.id);
      if (json?.success) {
        toast.info('Proposta retirada.');
        navigate('/app/demandas', { replace: true });
      }
    } catch (err) {
      toast.error(apiError(err, 'Não foi possível retirar a proposta.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <FullPageLoader label="Carregando demanda..." />;

  if (!order) {
    return (
      <div className="empty">
        <span className="empty-ico">
          <AlertCircle size={24} />
        </span>
        <strong>Demanda não disponível</strong>
        <p>Este pedido pode ter sido pausado, cancelado ou já fechado com outro profissional.</p>
        <Link to="/app/demandas" className="btn-primary">
          Ver demandas
        </Link>
      </div>
    );
  }

  const acceptedByMe = mine?.status === 'accepted';
  const closed = order.status !== 'open';

  return (
    <>
      <button type="button" className="page-back" onClick={() => navigate('/app/demandas')}>
        <ArrowLeft size={16} />
        Demandas
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
              {(order.city || order.neighborhood) && (
                <span className="meta-item">
                  <MapPin size={14} />
                  {[order.neighborhood, order.city].filter(Boolean).join(' — ')}
                </span>
              )}
            </div>
          </div>
          <span className={`badge badge-${order.status}`}>{ORDER_STATUS_LABEL[order.status] || order.status}</span>
        </div>
      </div>

      {acceptedByMe && (
        <Link to={`/app/servicos/${id}/andamento`} className="od-progress">
          <Send size={20} />
          <div>
            <strong>Sua proposta foi aceita</strong>
            <span>Abra o chat, combine o agendamento e inicie o trajeto</span>
          </div>
        </Link>
      )}

      <div className="od-grid">
        <div className="stack">
          <div className="card">
            <div className="card-title">O que o cliente precisa</div>
            <p className="od-desc">{order.description}</p>
          </div>

          {order.attachments?.length > 0 && (
            <div className="card">
              <div className="card-title">Anexos do cliente</div>
              <Attachments items={order.attachments} />
            </div>
          )}

          <div className="card">
            <div className="card-title">Orçamento de referência</div>
            <p className="card-sub">
              O cliente indicou <strong>{formatMoney(order.budget)}</strong> como referência. Sua proposta pode ser
              diferente — explique o que está incluso.
            </p>
          </div>
        </div>

        <div className="stack">
          {closed && !acceptedByMe ? (
            <div className="f-alert f-alert-info">
              <AlertCircle size={16} />
              <span>Este pedido não está mais recebendo propostas.</span>
            </div>
          ) : (
            <form className="card stack" onSubmit={handleSubmit}>
              <div>
                <div className="card-title">{mine ? 'Sua proposta' : 'Enviar proposta'}</div>
                <p className="card-sub">
                  {mine
                    ? `Enviada em ${formatDateTimeBR(mine.created_at)}. Você pode ajustar enquanto o cliente não decidir.`
                    : 'Seja claro no que está incluso. Propostas bem descritas são aceitas com mais frequência.'}
                </p>
              </div>

              {error && (
                <div className="f-alert f-alert-err">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              {upgrade && (
                <p className="f-hint">
                  <Crown size={12} /> No plano gratuito você envia 10 propostas por mês. O limite volta a zerar no
                  próximo mês.
                </p>
              )}

              <div className="f-field">
                <label htmlFor="sp-price">Seu valor</label>
                <input
                  id="sp-price"
                  className="f-input"
                  inputMode="numeric"
                  placeholder="R$ 0,00"
                  value={pricePreview}
                  onChange={(e) => setPrice(onlyDigits(e.target.value).slice(0, 10))}
                  disabled={acceptedByMe}
                  required
                />
              </div>

              <div className="f-field">
                <label htmlFor="sp-deadline">Prazo de entrega</label>
                <div className="co-deadline">
                  <input
                    id="sp-deadline"
                    className="f-input"
                    inputMode="numeric"
                    placeholder="7"
                    value={deadline}
                    onChange={(e) => setDeadline(onlyDigits(e.target.value).slice(0, 3))}
                    disabled={acceptedByMe}
                    required
                  />
                  <span>dias</span>
                </div>
              </div>

              <div className="f-field">
                <label htmlFor="sp-desc">O que está incluso</label>
                <textarea
                  id="sp-desc"
                  className="f-textarea"
                  placeholder="Materiais, mão de obra, garantia, condições de pagamento, o que não está incluso..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={acceptedByMe}
                  required
                />
              </div>

              {!acceptedByMe && (
                <button type="submit" className="f-submit" disabled={submitting}>
                  <Send size={16} />
                  {submitting ? 'Enviando...' : mine ? 'Salvar alterações' : 'Enviar proposta'}
                </button>
              )}

              {mine && mine.status === 'pending' && (
                <button type="button" className="f-ghost od-danger" onClick={handleWithdraw} disabled={submitting}>
                  <Trash2 size={16} />
                  Retirar proposta
                </button>
              )}
            </form>
          )}
        </div>
      </div>
    </>
  );
}
