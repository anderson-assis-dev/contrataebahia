import React, { useEffect, useState } from 'react';
import { Star, MessageSquare } from 'lucide-react';
import { listProviderRatings, listClientRatings } from '../services/ratings';
import { timeAgo } from '../utils/format';
import './MyRatingsCard.css';

export default function MyRatingsCard({ user, isProvider }) {
  const [ratings, setRatings] = useState([]);
  const [media, setMedia] = useState(0);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!user?.id) return undefined;
    let ativo = true;
    (async () => {
      try {
        if (isProvider) {
          const json = await listProviderRatings(user.id, { limit: 20 });
          const rows = json?.data?.data || [];
          if (ativo) {
            setRatings(rows.map((r) => ({ ...r, nome: r.client_name })));
            setMedia(rows.length ? rows.reduce((s, r) => s + Number(r.rating), 0) / rows.length : 0);
          }
        } else {
          const json = await listClientRatings(user.id);
          const rows = json?.data?.ratings || [];
          if (ativo) {
            setRatings(rows.map((r) => ({ ...r, nome: r.provider_name })));
            setMedia(Number(json?.data?.avg_rating) || 0);
          }
        }
      } catch {
        if (ativo) setRatings([]);
      } finally {
        if (ativo) setCarregando(false);
      }
    })();
    return () => { ativo = false; };
  }, [user?.id, isProvider]);

  if (carregando) return null;

  const titulo = isProvider ? 'O que os clientes dizem de você' : 'O que os prestadores dizem de você';

  return (
    <div className="card stack mrc">
      <div className="mrc-head">
        <div className="card-title">
          <MessageSquare size={18} /> Sua reputação
        </div>
        {ratings.length > 0 && (
          <span className="mrc-media">
            <Star size={15} className="mrc-star-on" /> {media.toFixed(1)}
            <small>({ratings.length})</small>
          </span>
        )}
      </div>

      {ratings.length === 0 ? (
        <p className="mrc-vazio">
          {isProvider
            ? 'Você ainda não recebeu avaliações. Conclua serviços para construir sua reputação.'
            : 'Você ainda não recebeu avaliações de prestadores.'}
        </p>
      ) : (
        <>
          <p className="mrc-sub">{titulo}</p>
          <ul className="mrc-lista">
            {ratings.map((r) => (
              <li key={r.id} className="mrc-item">
                <div className="mrc-item-head">
                  <span className="mrc-stars">
                    {[1, 2, 3, 4, 5].map((v) => (
                      <Star key={v} size={13} className={v <= Number(r.rating) ? 'mrc-star-on' : 'mrc-star-off'} />
                    ))}
                  </span>
                  <span className="mrc-who">{r.nome || (isProvider ? 'Cliente' : 'Prestador')}</span>
                  <span className="mrc-when">{timeAgo(r.created_at)}</span>
                </div>
                {r.comment && <p className="mrc-text">{r.comment}</p>}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
