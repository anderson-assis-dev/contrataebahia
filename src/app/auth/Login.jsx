import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import AuthShell from './AuthShell';
import { useAuth } from '../../contexts/AuthContext';
import { apiError } from '../../services/http';
import '../forms.css';

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [needsActivation, setNeedsActivation] = useState(false);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNeedsActivation(false);
    setSubmitting(true);
    try {
      const json = await signIn(form.email.trim(), form.password);
      if (json?.success) {
        navigate(location.state?.from || '/app', { replace: true });
        return;
      }
      if (json?.requiresActivation) setNeedsActivation(true);
      setError(json?.message || 'Não foi possível entrar.');
    } catch (err) {
      if (err?.response?.data?.requiresActivation) setNeedsActivation(true);
      setError(apiError(err, 'Não foi possível entrar.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Entrar"
      subtitle="Acesse sua conta para acompanhar pedidos e propostas."
      footer={
        <>
          Não tem conta? <Link to="/criar-conta">Criar conta grátis</Link>
        </>
      }
    >
      <form className="f-form" onSubmit={handleSubmit}>
        {error && (
          <div className="f-alert f-alert-err">
            <AlertCircle size={16} />
            <span>
              {error}
              {needsActivation && (
                <>
                  {' '}
                  <Link to={`/ativar-conta?email=${encodeURIComponent(form.email.trim())}`}>Ativar minha conta</Link>
                </>
              )}
            </span>
          </div>
        )}

        <div className="f-field">
          <label htmlFor="login-email">E-mail</label>
          <input
            id="login-email"
            className="f-input"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="seu@email.com"
            value={form.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="f-field">
          <label htmlFor="login-pass">Senha</label>
          <div className="f-pass">
            <input
              id="login-pass"
              className="f-input"
              name="password"
              type={showPass ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Sua senha"
              value={form.password}
              onChange={handleChange}
              required
            />
            <button
              type="button"
              className="f-eye"
              onClick={() => setShowPass((v) => !v)}
              aria-label={showPass ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </div>

        <button type="submit" className="f-submit" disabled={submitting}>
          {submitting ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </AuthShell>
  );
}
