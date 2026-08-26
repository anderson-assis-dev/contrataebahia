import React, { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Paperclip, Star, X } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { rateProvider } from '../../services/ratings';
import { apiError } from '../../services/http';
import '../forms.css';
import '../ui.css';
import './RateProvider.css';

const LABELS = ['', 'Muito ruim', 'Ruim', 'Regular', 'Bom', 'Excelente'];

export default function RateProvider() {
  const { providerId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const orderId = params.get('pedido');
  const shown = hover || rating;

  const handleFiles = (e) => {
    setFiles((current) => [...current, ...Array.from(e.target.files || [])].slice(0, 5));
    e.target.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (rating < 1) {
      setError('Escolha de 1 a 5 estrelas.');
      return;
    }
    setSubmitting(true);
    try {
      const json = await rateProvider(providerId, {
        rating,
        comment: comment.trim() || undefined,
        order_id: orderId || undefined,
        attachments: files,
      });
      if (json?.success) {
        toast.success('Obrigado! Sua avaliação ajuda outros clientes.');
        navigate(orderId ? `/app/pedidos/${orderId}` : '/app/pedidos', { replace: true });
        return;
      }
      setError(json?.message || 'Não foi possível enviar a avaliação.');
    } catch (err) {
      setError(apiError(err, 'Não foi possível enviar a avaliação.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button type="button" className="page-back" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} />
        Voltar
      </button>

      <div className="page-head">
        <h1 className="page-title">Avaliar o profissional</h1>
        <p className="page-sub">Conte como foi o serviço. Sua avaliação fica visível no perfil dele.</p>
      </div>

      <form className="stack" onSubmit={handleSubmit}>
        {error && (
          <div className="f-alert f-alert-err">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="card rate-card">
          <div className="rate-stars" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                className={`rate-star ${shown >= value ? 'rate-star-on' : ''}`}
                onClick={() => setRating(value)}
                onMouseEnter={() => setHover(value)}
                aria-label={`${value} ${value === 1 ? 'estrela' : 'estrelas'}`}
              >
                <Star size={34} strokeWidth={1.7} />
              </button>
            ))}
          </div>
          <span className="rate-label">{LABELS[shown] || 'Toque nas estrelas'}</span>
        </div>

        <div className="f-field">
          <label htmlFor="rate-comment">Comentário</label>
          <textarea
            id="rate-comment"
            className="f-textarea"
            placeholder="O que foi bom? O que poderia melhorar?"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={1000}
          />
        </div>

        <div className="f-field">
          <label htmlFor="rate-files">
            Fotos do serviço <span className="f-optional">(opcional)</span>
          </label>
          <input
            id="rate-files"
            type="file"
            accept="image/*"
            multiple
            onChange={handleFiles}
            className="rate-file-input"
          />
          <label htmlFor="rate-files" className="f-ghost rate-file-btn">
            <Paperclip size={16} />
            Anexar fotos
          </label>

          {files.length > 0 && (
            <ul className="rate-files">
              {files.map((file, index) => (
                <li key={`${file.name}-${index}`}>
                  <span>{file.name}</span>
                  <button
                    type="button"
                    onClick={() => setFiles((current) => current.filter((_, i) => i !== index))}
                    aria-label={`Remover ${file.name}`}
                  >
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button type="submit" className="f-submit" disabled={submitting}>
          {submitting ? 'Enviando...' : 'Enviar avaliação'}
        </button>
      </form>
    </>
  );
}
