import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, PlusCircle } from 'lucide-react';
import { ORDER_STATUS_LABEL, listOrders } from '../../services/orders';
import OrderCard from '../components/OrderCard';
import '../ui.css';

const FILTERS = [
  { value: '', label: 'Todos' },
  { value: 'open', label: ORDER_STATUS_LABEL.open },
  { value: 'in_progress', label: ORDER_STATUS_LABEL.in_progress },
  { value: 'completed', label: ORDER_STATUS_LABEL.completed },
  { value: 'cancelled', label: ORDER_STATUS_LABEL.cancelled },
];

export default function MyOrders() {
  const [status, setStatus] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    listOrders(status ? { status } : undefined)
      .then((json) => {
        if (active) setOrders(json?.data?.data || []);
      })
      .catch(() => {
        if (active) setOrders([]);
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
        <div className="page-head-row">
          <div>
            <h1 className="page-title">Meus pedidos</h1>
            <p className="page-sub">Acompanhe propostas, agendamentos e serviços em andamento.</p>
          </div>
          <Link to="/app/pedidos/novo" className="btn-primary">
            <PlusCircle size={17} />
            Novo pedido
          </Link>
        </div>
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
          <div className="skel" style={{ height: 104 }} />
          <div className="skel" style={{ height: 104 }} />
          <div className="skel" style={{ height: 104 }} />
        </div>
      ) : orders.length === 0 ? (
        <div className="empty">
          <span className="empty-ico">
            <ClipboardList size={24} />
          </span>
          <strong>Nenhum pedido {status ? 'nesse status' : 'ainda'}</strong>
          <p>Publique o que você precisa e receba propostas de profissionais da sua região.</p>
          <Link to="/app/pedidos/novo" className="btn-primary">
            Criar pedido
          </Link>
        </div>
      ) : (
        <div className="stack">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} to={`/app/pedidos/${order.id}`} />
          ))}
        </div>
      )}
    </>
  );
}
