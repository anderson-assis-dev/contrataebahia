import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, FileText, MapPin, Tag } from 'lucide-react';
import { ORDER_STATUS_LABEL } from '../../services/orders';
import { formatMoney, timeAgo } from '../../utils/format';
import './OrderCard.css';

export default function OrderCard({ order, to, footer }) {
  const proposals = order.proposals_count ?? order.proposals?.length;
  const city = order.city || order.neighborhood;

  return (
    <Link to={to} state={{ order }} className="order-card">
      <div className="order-card-top">
        <h3>{order.title}</h3>
        <span className={`badge badge-${order.status}`}>{ORDER_STATUS_LABEL[order.status] || order.status}</span>
      </div>

      {order.description && <p className="order-card-desc">{order.description}</p>}

      <div className="meta order-card-meta">
        <span className="meta-item">
          <Tag size={14} />
          {order.category}
        </span>
        <span className="meta-item order-card-budget">{formatMoney(order.budget)}</span>
        {city && (
          <span className="meta-item">
            <MapPin size={14} />
            {city}
          </span>
        )}
        {proposals != null && (
          <span className="meta-item">
            <FileText size={14} />
            {proposals} {proposals === 1 ? 'proposta' : 'propostas'}
          </span>
        )}
        <span className="meta-item">
          <Clock size={14} />
          {timeAgo(order.created_at)}
        </span>
      </div>

      {footer}
    </Link>
  );
}
