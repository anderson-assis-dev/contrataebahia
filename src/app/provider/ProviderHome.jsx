import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, CheckCircle2, Eye, FileText, Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getVisibility } from '../../services/proposals';
import { listAvailableOrders } from '../../services/orders';
import OrderCard from '../components/OrderCard';
import StatTiles from '../components/StatTiles';
import '../ui.css';
import '../client/ClientHome.css';

export default function ProviderHome() {
  const { user } = useAuth();
  const [visibility, setVisibility] = useState(null);
  const [demands, setDemands] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([getVisibility().catch(() => null), listAvailableOrders().catch(() => null)])
      .then(([visJson, ordersJson]) => {
        if (!active) return;
        setVisibility(visJson?.data || null);
        setDemands(ordersJson?.data?.data || []);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const firstName = (user?.name || '').split(' ')[0];

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">Olá, {firstName}</h1>
        <p className="page-sub">Veja as demandas abertas do seu ramo e envie propostas.</p>
      </div>

      <Link to="/app/demandas" className="ch-cta">
        <span className="ch-cta-ico">
          <Briefcase size={22} />
        </span>
        <span className="ch-cta-txt">
          <strong>Ver demandas disponíveis</strong>
          <span>Clientes esperando proposta agora mesmo</span>
        </span>
      </Link>

      <StatTiles
        loading={loading}
        items={[
          { label: 'Propostas enviadas', value: visibility?.total_proposals ?? 0, icon: FileText },
          { label: 'Aguardando', value: visibility?.total_pending ?? 0, icon: FileText },
          { label: 'Aceitas', value: visibility?.total_accepted ?? 0, icon: CheckCircle2 },
          { label: 'Visitas ao perfil', value: visibility?.total_views ?? 0, icon: Eye },
        ]}
      />

      <p style={{ margin: '-6px 0 18px' }}>
        <Link to="/app/visibilidade" className="ch-section-link">
          Ver painel profissional
        </Link>
      </p>

      <section className="ch-section">
        <div className="ch-section-head">
          <h2 className="card-title">Demandas para você</h2>
          <Link to="/app/demandas" className="ch-section-link">
            Ver todas
          </Link>
        </div>

        {loading ? (
          <div className="stack">
            <div className="skel ch-skel" />
            <div className="skel ch-skel" />
          </div>
        ) : demands.length === 0 ? (
          <div className="empty">
            <span className="empty-ico">
              <Search size={24} />
            </span>
            <strong>Nenhuma demanda aberta agora</strong>
            <p>
              Assim que um cliente publicar um pedido nas suas categorias, ele aparece aqui. Confira se seu perfil tem
              todas as categorias que você atende.
            </p>
            <Link to="/app/perfil/tipo" className="btn-outline">
              Revisar minhas categorias
            </Link>
          </div>
        ) : (
          <div className="stack">
            {demands.slice(0, 5).map((order) => (
              <OrderCard key={order.id} order={order} to={`/app/demandas/${order.id}`} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
