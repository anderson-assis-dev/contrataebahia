import React from 'react';
import { BadgeCheck, Check, Clock, Crown, Star, X } from 'lucide-react';
import { PROPOSAL_STATUS_LABEL } from '../../services/proposals';
import { formatMoney, timeAgo } from '../../utils/format';
import './ProposalCard.css';

const initialsOf = (name) =>
  (name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

export default function ProposalCard({ proposal, onAccept, onReject, busy, canDecide }) {
  const provider = proposal.provider || {};
  const name = proposal.provider_name || provider.name || 'Profissional';
  const avatar = proposal.provider_avatar_base64 || provider.avatar_base64;
  const premium = Boolean(proposal.provider_is_premium ?? provider.is_premium);
  const verified = Boolean(proposal.provider_is_verified ?? provider.is_verified);
  const rating = provider.avg_rating ?? provider.rate;

  return (
    <div className={`prop-card ${proposal.status === 'accepted' ? 'prop-card-accepted' : ''}`}>
      <div className="prop-head">
        {avatar ? (
          <img src={avatar} alt="" className="prop-avatar" />
        ) : (
          <span className="prop-avatar prop-avatar-fallback">{initialsOf(name)}</span>
        )}

        <div className="prop-who">
          <div className="prop-name">
            {name}
            {premium && (
              <span className="prop-tag prop-tag-premium" title="Prestador premium">
                <Crown size={12} />
                Premium
              </span>
            )}
            {verified && (
              <span className="prop-tag prop-tag-verified" title="Perfil verificado">
                <BadgeCheck size={12} />
                Verificado
              </span>
            )}
          </div>
          <div className="meta">
            {rating > 0 && (
              <span className="meta-item">
                <Star size={13} />
                {Number(rating).toFixed(1)}
              </span>
            )}
            <span className="meta-item">
              <Clock size={13} />
              {timeAgo(proposal.created_at)}
            </span>
            {proposal.status !== 'pending' && (
              <span className="meta-item">{PROPOSAL_STATUS_LABEL[proposal.status] || proposal.status}</span>
            )}
          </div>
        </div>

        <div className="prop-price">
          <strong>{formatMoney(proposal.price)}</strong>
          <span>{proposal.deadline} {/^\d+$/.test(String(proposal.deadline)) ? 'dias' : ''}</span>
        </div>
      </div>

      {proposal.description && <p className="prop-desc">{proposal.description}</p>}

      {canDecide && proposal.status === 'pending' && (
        <div className="prop-actions">
          <button type="button" className="prop-accept" onClick={() => onAccept(proposal)} disabled={busy}>
            <Check size={16} />
            Aceitar proposta
          </button>
          <button type="button" className="prop-reject" onClick={() => onReject(proposal)} disabled={busy}>
            <X size={16} />
            Recusar
          </button>
        </div>
      )}
    </div>
  );
}
