import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart2,
  CheckCircle2,
  Clock,
  Crown,
  Eye,
  Send,
  Users,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getVisibility } from '../../services/proposals';
import { formatDateTimeBR } from '../../utils/format';
import StatTiles from '../components/StatTiles';
import '../ui.css';
import '../forms.css';
import './ProviderVisibility.css';

const PERIODS = [
  { id: '7d', label: 'Esta semana' },
  { id: '30d', label: 'Últimos 30 dias' },
  { id: 'total', label: 'Total' },
];

const viewsOf = (data, period) => {
  if (period === '7d') return data.views_this_week;
  if (period === '30d') return data.views_last_30d ?? 0;
  return data.total_views;
};

export default function ProviderVisibility() {
  const { isProvider } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7d');

  useEffect(() => {
    if (!isProvider) {
      setLoading(false);
      return undefined;
    }
    getVisibility()
      .then((json) => {
        if (json?.success) setData(json.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isProvider]);

  if (!isProvider) {
    return (
      <div className="empty">
        <span className="empty-ico">
          <BarChart2 size={24} />
        </span>
        <strong>Painel de prestador</strong>
        <p>Essas métricas ficam disponíveis quando você atua como profissional.</p>
        <Link to="/app/perfil/tipo" className="btn-primary">
          Quero oferecer serviços
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">Painel profissional</h1>
        <p className="page-sub">Acompanhe visualizações, conversão e quem visitou seu perfil.</p>
      </div>

      {loading ? (
        <StatTiles
          loading
          items={[
            { label: 'Visualizações', value: 0, icon: Eye },
            { label: 'Propostas', value: 0, icon: Send },
            { label: 'Aceitas', value: 0, icon: CheckCircle2 },
            { label: 'Conversão', value: '0%', icon: BarChart2 },
          ]}
        />
      ) : !data ? (
        <div className="empty">
          <span className="empty-ico">
            <BarChart2 size={24} />
          </span>
          <strong>Não foi possível carregar as métricas</strong>
          <p>Tente de novo em instantes.</p>
        </div>
      ) : !data.is_premium ? (
        <div className="vis-lock">
          <span className="vis-lock-ico">
            <Crown size={28} />
          </span>
          <h2>Recurso exclusivo Premium</h2>
          <p>
            Veja quem visitou seu perfil, a taxa de conversão das propostas, sua posição no ranking e o histórico dos
            últimos meses.
          </p>
          <ul>
            <li>
              <Eye size={15} /> Total e tendência de visualizações
            </li>
            <li>
              <Send size={15} /> Taxa de conversão das propostas
            </li>
            <li>
              <Users size={15} /> Quem visitou seu perfil
            </li>
            <li>
              <BarChart2 size={15} /> Posição média no ranking
            </li>
          </ul>
          <Link to="/app/premium" className="f-submit">
            <Crown size={17} />
            Assinar Premium — R$ 9,90/mês
          </Link>
        </div>
      ) : (
        <>
          <div className="chips" style={{ marginBottom: 18 }}>
            {PERIODS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`chip ${period === item.id ? 'chip-on' : ''}`}
                onClick={() => setPeriod(item.id)}
                aria-pressed={period === item.id}
              >
                {item.label}
              </button>
            ))}
          </div>

          <StatTiles
            items={[
              { label: 'Visualizações', value: viewsOf(data, period), icon: Eye },
              {
                label: 'Propostas',
                value: period === '30d' && data.proposals_this_month != null ? data.proposals_this_month : data.total_proposals,
                icon: Send,
              },
              { label: 'Aceitas', value: data.total_accepted, icon: CheckCircle2 },
              { label: 'Conversão', value: `${data.conversion_rate || 0}%`, icon: BarChart2 },
            ]}
          />

          <div className="vis-grid">
            <div className="card stack">
              <div className="card-title">Desempenho</div>
              {data.avg_rank_position != null && (
                <p className="card-sub">
                  Posição média nas listas: <strong>{Number(data.avg_rank_position).toFixed(1)}º</strong>
                </p>
              )}
              {data.avg_response_hours != null && (
                <p className="card-sub">
                  <Clock size={13} style={{ verticalAlign: '-2px' }} /> Tempo médio de resposta:{' '}
                  <strong>{data.avg_response_hours}h</strong>
                </p>
              )}
              {data.view_trend_pct != null && (
                <p className="card-sub">
                  Tendência de visualizações: <strong>{data.view_trend_pct > 0 ? '+' : ''}{data.view_trend_pct}%</strong>
                </p>
              )}
              {Array.isArray(data.category_breakdown) && data.category_breakdown.length > 0 && (
                <ul className="vis-cats">
                  {data.category_breakdown.map((row) => (
                    <li key={row.category}>
                      <span>{row.category}</span>
                      <strong>{row.rate}% · {row.accepted}/{row.total}</strong>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="card stack">
              <div className="card-title">Quem visitou seu perfil</div>
              {data.profile_views_today > 0 && (
                <p className="card-sub">
                  {data.profile_views_today} visita{data.profile_views_today === 1 ? '' : 's'} hoje
                  {data.no_quote_today > 0 ? ` · ${data.no_quote_today} sem pedir orçamento` : ''}
                </p>
              )}
              {(data.profile_viewers || []).length === 0 ? (
                <p className="card-sub">Nenhuma visita recente.</p>
              ) : (
                <ul className="vis-viewers">
                  {data.profile_viewers.map((viewer) => (
                    <li key={viewer.id}>
                      {viewer.avatar_base64 ? (
                        <img src={viewer.avatar_base64} alt="" />
                      ) : (
                        <span>{(viewer.name || '?').charAt(0)}</span>
                      )}
                      <div>
                        <strong>{viewer.name}</strong>
                        <em>
                          {viewer.opened_quote ? 'Pediu orçamento' : 'Só visitou'}
                          {viewer.viewed_at ? ` · ${formatDateTimeBR(viewer.viewed_at)}` : ''}
                        </em>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {Array.isArray(data.monthly_history) && data.monthly_history.length > 0 && (
            <div className="card" style={{ marginTop: 14 }}>
              <div className="card-title">Histórico mensal</div>
              <ul className="vis-cats">
                {data.monthly_history.map((row) => (
                  <li key={row.month}>
                    <span>{row.month}</span>
                    <strong>
                      {row.total} propostas · {row.accepted} aceitas
                    </strong>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </>
  );
}
