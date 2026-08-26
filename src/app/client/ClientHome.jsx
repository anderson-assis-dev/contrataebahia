import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Gavel, PlusCircle, Search, Wallet } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getOrderStats, listRecentOrders } from '../../services/orders';
import OrderCard from '../components/OrderCard';
import StatTiles from '../components/StatTiles';
import '../ui.css';
import './ClientHome.css';

export default function ClientHome() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([getOrderStats().catch(() => null), listRecentOrders().catch(() => null)])
      .then(([statsJson, ordersJson]) => {
        if (!active) return;
        setStats(statsJson?.data || null);
        setOrders(ordersJson?.data || []);
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
        <p className="page-sub">Publique o que você precisa e receba propostas de profissionais da Bahia.</p>
      </div>

      <Link to="/app/pedidos/novo" className="ch-cta">
        <span className="ch-cta-ico">
          <PlusCircle size={22} />
        </span>
        <span className="ch-cta-txt">
          <strong>Criar novo pedido</strong>
          <span>Descreva o serviço e receba propostas em minutos</span>
        </span>
      </Link>

      <StatTiles
        loading={loading}
        items={[
          { label: 'Pedidos', value: stats?.total_orders ?? 0, icon: ClipboardList },
          { label: 'Em leilão', value: stats?.open_orders ?? 0, icon: Gavel },
          { label: 'Concluídos', value: stats?.completed_orders ?? 0, icon: ClipboardList },
          { label: 'Total investido', value: stats?.total_spent ?? 0, icon: Wallet, money: true },
        ]}
      />

      <section className="ch-section">
        <div className="ch-section-head">
          <h2 className="card-title">Pedidos recentes</h2>
          <Link to="/app/pedidos" className="ch-section-link">
            Ver todos
          </Link>
        </div>

        {loading ? (
          <div className="stack">
            <div className="skel ch-skel" />
            <div className="skel ch-skel" />
          </div>
        ) : orders.length === 0 ? (
          <div className="empty">
            <span className="empty-ico">
              <Search size={24} />
            </span>
            <strong>Nenhum pedido ainda</strong>
            <p>Crie seu primeiro pedido e os profissionais da sua região começam a enviar propostas.</p>
            <Link to="/app/pedidos/novo" className="btn-primary">
              Criar meu primeiro pedido
            </Link>
          </div>
        ) : (
          <div className="stack">
            {orders.slice(0, 5).map((order) => (
              <OrderCard key={order.id} order={order} to={`/app/pedidos/${order.id}`} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
