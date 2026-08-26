import React, { useCallback, useEffect, useState } from 'react';
import { CardElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js';
import { AlertCircle, CreditCard, Plus, Trash2 } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { createSetupIntent, ensureWallet, removeCard } from '../../services/wallet';
import { stripePromise, STRIPE_ENABLED } from '../../services/stripe';
import { apiError } from '../../services/http';
import { formatMoney } from '../../utils/format';
import '../forms.css';
import '../ui.css';
import './Wallet.css';

const BRAND = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'American Express',
  elo: 'Elo',
  hipercard: 'Hipercard',
};

const CARD_OPTIONS = {
  hidePostalCode: true,
  style: {
    base: {
      fontSize: '16px',
      color: '#0B1F4A',
      fontFamily: 'inherit',
      '::placeholder': { color: '#8A93A8' },
    },
    invalid: { color: '#E31E24' },
  },
};

function AddCardForm({ onSaved, onCancel }) {
  const stripe = useStripe();
  const elements = useElements();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setError('');
    setBusy(true);
    try {
      const intent = await createSetupIntent();
      const secret = intent?.data?.client_secret;
      if (!secret) throw new Error('Não foi possível iniciar o cadastro do cartão.');
      const card = elements.getElement(CardElement);
      const result = await stripe.confirmCardSetup(secret, { payment_method: { card } });
      if (result.error) {
        setError(result.error.message || 'Não foi possível salvar o cartão.');
        return;
      }
      toast.success('Cartão adicionado.');
      onSaved();
    } catch (err) {
      setError(apiError(err, 'Não foi possível salvar o cartão.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="card stack" onSubmit={handleSubmit}>
      <div className="card-title">Novo cartão</div>
      {error && (
        <div className="f-alert f-alert-err">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}
      <div className="wal-card-el">
        <CardElement options={CARD_OPTIONS} />
      </div>
      <button type="submit" className="f-submit" disabled={busy || !stripe}>
        {busy ? 'Salvando...' : 'Salvar cartão'}
      </button>
      <button type="button" className="f-ghost" onClick={onCancel}>
        Cancelar
      </button>
    </form>
  );
}

function WalletInner() {
  const toast = useToast();
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const json = await ensureWallet();
      setWallet(json?.data || null);
    } catch (err) {
      setError(apiError(err, 'Não foi possível carregar a carteira.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleRemove = async (id) => {
    if (!window.confirm('Remover este cartão?')) return;
    try {
      await removeCard(id);
      toast.info('Cartão removido.');
      await load();
    } catch (err) {
      toast.error(apiError(err, 'Não foi possível remover o cartão.'));
    }
  };

  const cards = wallet?.payment_methods || [];

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">Carteira</h1>
        <p className="page-sub">Cartões usados no Premium e nos anúncios. O pagamento do serviço combinado fica entre você e o profissional.</p>
      </div>

      {error && (
        <div className="f-alert f-alert-err" style={{ marginBottom: 14 }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="wal-balance">
        <span>Saldo em conta</span>
        <strong>{formatMoney((wallet?.balance || 0) / 100)}</strong>
      </div>

      {loading ? (
        <div className="skel" style={{ height: 88 }} />
      ) : (
        <div className="stack">
          {cards.length === 0 && !adding && (
            <div className="empty">
              <span className="empty-ico">
                <CreditCard size={24} />
              </span>
              <strong>Nenhum cartão cadastrado</strong>
              <p>Adicione um cartão para assinar o Premium ou comprar créditos de anúncio.</p>
              {STRIPE_ENABLED && (
                <button type="button" className="btn-primary" onClick={() => setAdding(true)}>
                  <Plus size={16} />
                  Adicionar cartão
                </button>
              )}
            </div>
          )}

          {cards.map((card) => (
            <div key={card.id} className="wal-card">
              <CreditCard size={20} />
              <div>
                <strong>
                  {BRAND[card.brand] || card.brand} •••• {card.last4}
                </strong>
                <span>
                  Validade {String(card.exp_month).padStart(2, '0')}/{card.exp_year}
                </span>
              </div>
              <button type="button" className="f-ghost od-danger" onClick={() => handleRemove(card.id)}>
                <Trash2 size={14} />
                Remover
              </button>
            </div>
          ))}

          {STRIPE_ENABLED && !adding && cards.length > 0 && (
            <button type="button" className="f-ghost" onClick={() => setAdding(true)}>
              <Plus size={16} />
              Adicionar outro cartão
            </button>
          )}

          {STRIPE_ENABLED && adding && (
            <AddCardForm
              onSaved={() => {
                setAdding(false);
                load();
              }}
              onCancel={() => setAdding(false)}
            />
          )}

          {!STRIPE_ENABLED && (
            <div className="f-alert f-alert-info">
              <AlertCircle size={16} />
              <span>O cadastro de cartão está temporariamente indisponível nesta versão.</span>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default function Wallet() {
  if (!STRIPE_ENABLED) return <WalletInner />;
  return (
    <Elements stripe={stripePromise}>
      <WalletInner />
    </Elements>
  );
}
