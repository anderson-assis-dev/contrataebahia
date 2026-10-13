import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, Clock, FileText, MapPin } from 'lucide-react';
import { PROPOSAL_STATUS_LABEL, listProposals } from '../../services/proposals';
import CardThumb from '../components/CardThumb';
import { postedLabel } from '../components/OrderCard';
import { formatMoney } from '../../utils/format';
import '../ui.css';
import '../components/ListCard.css';

const FILTERS = [
  { value: '', label: 'Todas' },
  { value: 'pending', label: PROPOSAL_STATUS_LABEL.pending },
  { value: 'accepted', label: PROPOSAL_STATUS_LABEL.accepted },
  { value: 'rejected', label: PROPOSAL_STATUS_LABEL.rejected },
];

const STATUS_CLASS = {
  pending: 'badge-open',
  accepted: 'badge-completed',
  rejected: 'badge-cancelled',
  withdrawn: 'badge-stopped',
};

const deadlineLabel = (deadline) => {
  if (!deadline) return '';
  if (!/^\d+$/.test(String(deadline))) return String(deadline);
  return Number(deadline) === 1 ? '1 dia' : `${deadline} dias`;
};

export default function MyProposals() {
  const [status, setStatus] = useState('');
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    listProposals(status ? { status } : undefined)
      .then((json) => {
        if (active) setProposals(json?.data?.data || []);
      })
      .catch(() => {
        if (active) setProposals([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [status]);

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">Minhas propostas</h1>
        <p className="page-sub">Acompanhe o que você enviou e o que já foi decidido.</p>
      </div>

      <div className="chips" style={{ marginBottom: 18 }}>
        {FILTERS.map((filter) => (
          <button
            key={filter.value}
            type="button"
            className={`chip ${status === filter.value ? 'chip-on' : ''}`}
            onClick={() => setStatus(filter.value)}
            aria-pressed={status === filter.value}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="lcard-grid">
          <div className="skel lcard-skel" />
          <div className="skel lcard-skel" />
        </div>
      ) : proposals.length === 0 ? (
        <div className="empty">
          <span className="empty-ico">
            <FileText size={24} />
          </span>
          <strong>Nenhuma proposta {status ? 'nesse status' : 'enviada'}</strong>
          <p>Escolha uma demanda aberta e envie sua primeira proposta.</p>
          <Link to="/app/demandas" className="btn-primary">
            Ver demandas
          </Link>
        </div>
      ) : (
        <div className="lcard-grid">
          {proposals.map((proposal) => {
            const order = proposal.order || {};
            const city = order.city || order.neighborhood;
            const target =
              proposal.status === 'accepted'
                ? `/app/servicos/${proposal.order_id}/andamento`
                : `/app/demandas/${proposal.order_id}`;
            return (
              <Link key={proposal.id} to={target} state={{ order }} className="lcard">
                <CardThumb attachments={order.attachments} category={order.category} />

                <div className="lcard-body">
                  <div className="lcard-head">
                    <span className="lcard-eyebrow">{order.category || `Pedido #${proposal.order_id}`}</span>
                    <span className={`badge ${STATUS_CLASS[proposal.status] || 'badge-stopped'}`}>
                      {PROPOSAL_STATUS_LABEL[proposal.status] || proposal.status}
                    </span>
                  </div>

                  <h3 className="lcard-title">{order.title || `Pedido #${proposal.order_id}`}</h3>
                  {proposal.description && <p className="lcard-desc">{proposal.description}</p>}

                  <div className="lcard-price">
                    <strong>{formatMoney(proposal.price)}</strong>
                    <span>sua proposta</span>
                  </div>

                  <div className="lcard-foot">
                    {city && (
                      <span className="meta-item">
                        <MapPin size={13} />
                        {city}
                      </span>
                    )}
                    {proposal.deadline && (
                      <span className="meta-item">
                        <CalendarClock size={13} />
                        {deadlineLabel(proposal.deadline)}
                      </span>
                    )}
                    <span className="meta-item">
                      <Clock size={13} />
                      {postedLabel(proposal.created_at)}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
