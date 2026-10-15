import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, PlusCircle } from 'lucide-react';
import { ORDER_STATUS_LABEL, listOrders } from '../../services/orders';
import OrderCard from '../components/OrderCard';
import ListFilters, { SemResultado, useListFilters } from '../components/ListFilters';
import '../ui.css';

const FILTERS = [
  { value: '', label: 'Todos' },
  { value: 'open', label: ORDER_STATUS_LABEL.open },
  { value: 'in_progress', label: ORDER_STATUS_LABEL.in_progress },
  { value: 'completed', label: ORDER_STATUS_LABEL.completed },
  { value: 'cancelled', label: ORDER_STATUS_LABEL.cancelled },
];

// Fora do componente de propósito: criados a cada render, invalidariam o memo
// do filtro toda vez.
const TEXTOS = (o) => [o.title, o.description, o.category, o.city, o.neighborhood];
const DATA = (o) => o.created_at;
const VALOR = (o) => o.budget;

export default function MyOrders() {
  const [status, setStatus] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const filtros = useListFilters(orders, { textos: TEXTOS, data: DATA, valor: VALOR });

  useEffect(() => {
    let active = true;
    setLoading(true);
    listOrders({ ...(status ? { status } : {}), limit: 100 })
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

      {orders.length > 0 && (
        <ListFilters
          filtros={filtros}
          placeholder="Buscar por título, categoria ou cidade"
          rotulo="pedidos"
          comValor
        />
      )}

      {loading ? (
        <div className="lcard-grid">
          <div className="skel lcard-skel" />
          <div className="skel lcard-skel" />
          <div className="skel lcard-skel" />
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
      ) : filtros.filtrados.length === 0 ? (
        <SemResultado onLimpar={filtros.limpar} rotulo="pedidos" />
      ) : (
        <div className="lcard-grid">
          {filtros.filtrados.map((order) => (
            <OrderCard key={order.id} order={order} to={`/app/pedidos/${order.id}`} />
          ))}
        </div>
      )}
    </>
  );
}
