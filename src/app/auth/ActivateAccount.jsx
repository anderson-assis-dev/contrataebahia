import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, MailCheck } from 'lucide-react';
import AuthShell from './AuthShell';
import { useAuth } from '../../contexts/AuthContext';
import * as authApi from '../../services/auth';
import { apiError } from '../../services/http';
import { onlyDigits } from '../../utils/format';
import '../forms.css';

export default function ActivateAccount() {
  const { adoptSession } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState(params.get('email') || '');
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const handleResend = async () => {
    setError('');
    setNotice('');
    if (!email.trim()) {
      setError('Informe seu e-mail para receber o código.');
      return;
    }
    setSending(true);
    try {
      const json = await authApi.resendActivation(email.trim());
      if (json?.success) setNotice(json.message || 'Código enviado para o seu e-mail.');
      else setError(json?.message || 'Não foi possível enviar o código.');
    } catch (err) {
      setError(apiError(err, 'Não foi possível enviar o código.'));
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setSubmitting(true);
    try {
      const json = await authApi.verifyActivation(email.trim(), code.trim());
      if (json?.success) {
        adoptSession(json);
        navigate('/app', { replace: true });
        return;
      }
      setError(json?.message || 'Código inválido.');
    } catch (err) {
      setError(apiError(err, 'Código inválido.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Ativar conta"
      subtitle="Enviamos um e-mail de confirmação. Clique no link da mensagem ou use o código de 6 dígitos abaixo."
      footer={
        <>
          Já ativou? <Link to="/entrar">Entrar</Link>
        </>
      }
    >
      <form className="f-form" onSubmit={handleSubmit}>
        {error && (
          <div className="f-alert f-alert-err">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {notice && (
          <div className="f-alert f-alert-ok">
            <CheckCircle2 size={16} />
            <span>{notice}</span>
          </div>
        )}

        <div className="f-field">
          <label htmlFor="act-email">E-mail da conta</label>
          <input
            id="act-email"
            className="f-input"
            type="email"
            autoComplete="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="f-field">
          <label htmlFor="act-code">Código de ativação</label>
          <input
            id="act-code"
            className="f-input"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(onlyDigits(e.target.value).slice(0, 6))}
            required
          />
          <span className="f-hint">Não recebeu o código? Peça um novo abaixo.</span>
        </div>

        <button type="submit" className="f-submit" disabled={submitting || code.length < 6}>
          {submitting ? 'Ativando...' : 'Ativar e entrar'}
        </button>

        <button type="button" className="f-ghost" onClick={handleResend} disabled={sending}>
          <MailCheck size={16} />
          {sending ? 'Enviando...' : 'Enviar código por e-mail'}
        </button>
      </form>
    </AuthShell>
  );
}
