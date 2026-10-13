import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, FileText, MapPin, Timer } from 'lucide-react';
import { ORDER_STATUS_LABEL } from '../../services/orders';
import { formatRemaining } from '../hooks/useCountdown';
import { formatMoney, timeAgo } from '../../utils/format';
import CardThumb from './CardThumb';
import './ListCard.css';

export const postedLabel = (value) => {
  const label = timeAgo(value);
  if (!label) return '';
  if (label === 'agora') return 'agora mesmo';
  return /^\d+\s/.test(label) ? `há ${label}` : label;
};

const auctionLeft = (order) => {
  if (order.status !== 'open' || !order.auction_ends_at) return '';
  const end = new Date(String(order.auction_ends_at).replace(' ', 'T')).getTime();
  if (Number.isNaN(end)) return '';
  const left = end - Date.now();
  return left > 0 ? formatRemaining(left) : '';
};

export default function OrderCard({ order, to, footer }) {
  const proposals = order.proposals_count ?? order.proposals?.length;
  const city = order.city || order.neighborhood;
  const remaining = auctionLeft(order);

  return (
    <Link to={to} state={{ order }} className="lcard">
      <CardThumb attachments={order.attachments} category={order.category} />

      <div className="lcard-body">
        <div className="lcard-head">
          <span className="lcard-eyebrow">{order.category}</span>
          <span className={`badge badge-${order.status}`}>{ORDER_STATUS_LABEL[order.status] || order.status}</span>
        </div>

        <h3 className="lcard-title">{order.title}</h3>
        {order.description && <p className="lcard-desc">{order.description}</p>}

        <div className="lcard-price">
          <strong>{formatMoney(order.budget)}</strong>
          <span>orçamento</span>
        </div>

        <div className="lcard-foot">
          {city && (
            <span className="meta-item">
              <MapPin size={13} />
              {city}
            </span>
          )}
          {proposals != null && (
            <span className="meta-item">
              <FileText size={13} />
              {proposals} {proposals === 1 ? 'proposta' : 'propostas'}
            </span>
          )}
          <span className="meta-item">
            <Clock size={13} />
            {postedLabel(order.created_at)}
          </span>
          {remaining && (
            <span className="lcard-timer">
              <Timer size={12} />
              Encerra em {remaining}
            </span>
          )}
        </div>

        {footer}
      </div>
    </Link>
  );
}
