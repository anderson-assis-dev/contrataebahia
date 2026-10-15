import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { listAvailableOrders } from '../../services/orders';
import OrderCard from '../components/OrderCard';
import ListFilters, { SemResultado, useListFilters } from '../components/ListFilters';
import { formatCep, onlyDigits } from '../../utils/format';
import '../forms.css';
import '../ui.css';

const TEXTOS = (o) => [o.title, o.description, o.category, o.city, o.neighborhood];
const DATA = (o) => o.created_at;
const VALOR = (o) => o.budget;

export default function AvailableDemands() {
  const { user } = useAuth();
  const myCategories = user?.service_categories || [];
  const [category, setCategory] = useState('');
  const [cep, setCep] = useState('');
  const [query, setQuery] = useState({});
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const filtros = useListFilters(orders, { textos: TEXTOS, data: DATA, valor: VALOR });

  useEffect(() => {
    let active = true;
    setLoading(true);
    listAvailableOrders({ ...query, limit: 100 })
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
  }, [query]);

  const applyFilters = (e) => {
    e.preventDefault();
    const next = {};
    if (category) next.category = category;
    if (onlyDigits(cep).length === 8) next.cep = onlyDigits(cep);
    setQuery(next);
  };

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">Demandas disponíveis</h1>
        <p className="page-sub">
          Pedidos abertos aguardando proposta.
          {Number(user?.is_premium) !== 1
            ? ' No plano gratuito, demandas novas levam cerca de 30 minutos para aparecer.'
            : ' Como Premium, você vê as demandas assim que são publicadas.'}
        </p>
      </div>

      <form className="card stack" onSubmit={applyFilters} style={{ marginBottom: 18 }}>
        <div className="f-field">
          <label htmlFor="ad-cep">CEP de referência</label>
          <input
            id="ad-cep"
            className="f-input"
            inputMode="numeric"
            placeholder="00000-000"
            value={cep}
            onChange={(e) => setCep(formatCep(e.target.value))}
          />
          <span className="f-hint">Ordena as demandas pela distância até esse endereço.</span>
        </div>

        {myCategories.length > 0 && (
          <div className="chips">
            <button
              type="button"
              className={`chip ${category === '' ? 'chip-on' : ''}`}
              onClick={() => setCategory('')}
              aria-pressed={category === ''}
            >
              Todas
            </button>
            {myCategories.map((label) => (
              <button
                key={label}
                type="button"
                className={`chip ${category === label ? 'chip-on' : ''}`}
                onClick={() => setCategory(label)}
                aria-pressed={category === label}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        <button type="submit" className="f-ghost">
          <Search size={16} />
          Buscar na região
        </button>
      </form>

      {orders.length > 0 && (
        <ListFilters
          filtros={filtros}
          placeholder="Buscar por título, categoria ou cidade"
          rotulo="demandas"
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
            <Briefcase size={24} />
          </span>
          <strong>Nenhuma demanda encontrada</strong>
          <p>
            Tente ampliar os filtros. Se você atende outras categorias, adicione no seu perfil para receber mais
            oportunidades.
          </p>
          <Link to="/app/perfil/tipo" className="btn-outline">
            Ajustar categorias
          </Link>
        </div>
      ) : filtros.filtrados.length === 0 ? (
        <SemResultado onLimpar={filtros.limpar} rotulo="demandas" />
      ) : (
        <div className="lcard-grid">
          {filtros.filtrados.map((order) => (
            <OrderCard key={order.id} order={order} to={`/app/demandas/${order.id}`} />
          ))}
        </div>
      )}
    </>
  );
}
