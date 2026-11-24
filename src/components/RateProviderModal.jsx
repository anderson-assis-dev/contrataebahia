import React, { useState } from 'react';
import { Star, X, AlertCircle } from 'lucide-react';
import { rateProvider } from '../services/ratings';
import { apiError } from '../services/http';
import './RateProviderModal.css';

const LABELS = ['', 'Ruim', 'Regular', 'Bom', 'Muito bom', 'Excelente'];

export default function RateProviderModal({ providerId, orderId, atual, onClose, onSaved }) {
  const [rating, setRating] = useState(Number(atual?.rating) || 0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState(atual?.comment || '');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  const mostrar = hover || rating;

  const enviar = async (e) => {
    e.preventDefault();
    setErro('');
    if (rating < 1) { setErro('Escolha de 1 a 5 estrelas.'); return; }
    setEnviando(true);
    try {
      const json = await rateProvider(providerId, {
        rating,
        comment: comment.trim() || undefined,
        order_id: orderId || undefined,
      });
      if (json?.success) { onSaved?.(json.data); return; }
      setErro(json?.message || 'Não foi possível enviar a avaliação.');
    } catch (err) {
      setErro(apiError(err, 'Não foi possível enviar a avaliação.'));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="rpm-overlay" role="dialog" aria-modal="true" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="rpm-card">
        <button type="button" className="rpm-close" onClick={onClose} aria-label="Fechar"><X size={18} /></button>
        <h2 className="rpm-titulo">{atual ? 'Editar avaliação' : 'Avaliar o profissional'}</h2>
        <p className="rpm-sub">Conte como foi o serviço. Fica visível no perfil dele.</p>

        <form className="stack" onSubmit={enviar}>
          {erro && <div className="f-alert f-alert-err"><AlertCircle size={16} /><span>{erro}</span></div>}

          <div className="rpm-stars" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((v) => (
              <button
                key={v}
                type="button"
                className={`rpm-star ${mostrar >= v ? 'rpm-star-on' : ''}`}
                onClick={() => setRating(v)}
                onMouseEnter={() => setHover(v)}
                aria-label={`${v} ${v === 1 ? 'estrela' : 'estrelas'}`}
              >
                <Star size={32} strokeWidth={1.7} />
              </button>
            ))}
          </div>
          <span className="rpm-label">{LABELS[mostrar] || 'Toque nas estrelas'}</span>

          <div className="f-field">
            <label htmlFor="rpm-comment">Comentário</label>
            <textarea
              id="rpm-comment"
              className="f-textarea"
              placeholder="O que foi bom? O que poderia melhorar?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={1000}
            />
          </div>

          <button type="submit" className="f-submit" disabled={enviando}>
            {enviando ? 'Enviando...' : atual ? 'Salvar avaliação' : 'Enviar avaliação'}
          </button>
        </form>
      </div>
    </div>
  );
}
