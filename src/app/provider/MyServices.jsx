import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Wrench } from 'lucide-react';
import { listOrders } from '../../services/orders';
import OrderCard from '../components/OrderCard';
import ListFilters, { SemResultado, useListFilters } from '../components/ListFilters';
import ServiceCatalog from './ServiceCatalog';
import '../ui.css';

const FILTERS = [
  { value: 'in_progress', label: 'Em andamento' },
  { value: 'completed', label: 'Concluídos' },
  { value: 'cancelled', label: 'Cancelados' },
];

const TEXTOS = (o) => [o.title, o.description, o.category, o.city, o.neighborhood];
const DATA = (o) => o.created_at;
const VALOR = (o) => o.budget;

export default function MyServices() {
  const [tab, setTab] = useState('jobs');
  const [status, setStatus] = useState('in_progress');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const filtros = useListFilters(orders, { textos: TEXTOS, data: DATA, valor: VALOR });

  useEffect(() => {
    if (tab !== 'jobs') return undefined;
    let active = true;
    setLoading(true);
    listOrders({ status, limit: 100 })
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

          {orders.length > 0 && (
            <ListFilters
              filtros={filtros}
              placeholder="Buscar por título, categoria ou cidade"
              rotulo="serviços"
              comValor
            />
          )}

          {loading ? (
            <div className="lcard-grid">
              <div className="skel lcard-skel" />
              <div className="skel lcard-skel" />
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
          ) : filtros.filtrados.length === 0 ? (
            <SemResultado onLimpar={filtros.limpar} rotulo="serviços" />
          ) : (
            <div className="lcard-grid">
              {filtros.filtrados.map((order) => (
                <OrderCard key={order.id} order={order} to={`/app/servicos/${order.id}/andamento`} />
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
