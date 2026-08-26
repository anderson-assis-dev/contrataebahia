import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, FileText, Tag } from 'lucide-react';
import { PROPOSAL_STATUS_LABEL, listProposals } from '../../services/proposals';
import { formatMoney, timeAgo } from '../../utils/format';
import '../ui.css';
import './MyProposals.css';

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
        <div className="stack">
          <div className="skel" style={{ height: 92 }} />
          <div className="skel" style={{ height: 92 }} />
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
        <div className="stack">
          {proposals.map((proposal) => {
            const order = proposal.order || {};
            const target =
              proposal.status === 'accepted'
                ? `/app/servicos/${proposal.order_id}/andamento`
                : `/app/demandas/${proposal.order_id}`;
            return (
              <Link key={proposal.id} to={target} state={{ order }} className="myprop">
                <div className="myprop-top">
                  <h3>{order.title || `Pedido #${proposal.order_id}`}</h3>
                  <span className={`badge ${STATUS_CLASS[proposal.status] || 'badge-stopped'}`}>
                    {PROPOSAL_STATUS_LABEL[proposal.status] || proposal.status}
                  </span>
                </div>
                <div className="meta">
                  {order.category && (
                    <span className="meta-item">
                      <Tag size={14} />
                      {order.category}
                    </span>
                  )}
                  <span className="meta-item myprop-price">{formatMoney(proposal.price)}</span>
                  <span className="meta-item">
                    {proposal.deadline} {/^\d+$/.test(String(proposal.deadline)) ? 'dias' : ''}
                  </span>
                  <span className="meta-item">
                    <Clock size={14} />
                    {timeAgo(proposal.created_at)}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
