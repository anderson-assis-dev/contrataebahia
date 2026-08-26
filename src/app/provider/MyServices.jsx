import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Wrench } from 'lucide-react';
import { listOrders } from '../../services/orders';
import OrderCard from '../components/OrderCard';
import ServiceCatalog from './ServiceCatalog';
import '../ui.css';

const FILTERS = [
  { value: 'in_progress', label: 'Em andamento' },
  { value: 'completed', label: 'Concluídos' },
  { value: 'cancelled', label: 'Cancelados' },
];

export default function MyServices() {
  const [tab, setTab] = useState('jobs');
  const [status, setStatus] = useState('in_progress');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tab !== 'jobs') return undefined;
    let active = true;
    setLoading(true);
    listOrders({ status })
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
  }, [status, tab]);

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">Meus serviços</h1>
        <p className="page-sub">Trabalhos fechados e o catálogo visível no seu perfil.</p>
      </div>

      <div className="chips" style={{ marginBottom: 18 }}>
        <button type="button" className={`chip ${tab === 'jobs' ? 'chip-on' : ''}`} onClick={() => setTab('jobs')} aria-pressed={tab === 'jobs'}>
          Trabalhos
        </button>
        <button type="button" className={`chip ${tab === 'catalog' ? 'chip-on' : ''}`} onClick={() => setTab('catalog')} aria-pressed={tab === 'catalog'}>
          Catálogo
        </button>
      </div>

      {tab === 'catalog' ? (
        <ServiceCatalog />
      ) : (
        <>
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
            </div>
          ) : orders.length === 0 ? (
            <div className="empty">
              <span className="empty-ico">
                <Wrench size={24} />
              </span>
              <strong>Nada por aqui ainda</strong>
              <p>Quando um cliente aceitar sua proposta, o serviço aparece nesta lista.</p>
              <Link to="/app/demandas" className="btn-primary">
                <Briefcase size={17} />
                Ver demandas abertas
              </Link>
            </div>
          ) : (
            <div className="stack">
              {orders.map((order) => (
                <OrderCard key={order.id} order={order} to={`/app/servicos/${order.id}/andamento`} />
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
