import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff, Hammer, UserRound } from 'lucide-react';
import AuthShell from './AuthShell';
import { useAuth } from '../../contexts/AuthContext';
import { apiError } from '../../services/http';
import { REF_STORAGE_KEY } from '../../utils/api';
import { formatCpf, formatPhone, onlyDigits } from '../../utils/format';
import '../forms.css';

const PROFILES = [
  {
    value: 'client',
    icon: UserRound,
    title: 'Quero contratar',
    desc: 'Publique o que precisa e receba propostas de profissionais.',
  },
  {
    value: 'provider',
    icon: Hammer,
    title: 'Quero trabalhar',
    desc: 'Receba demandas da sua região e envie suas propostas.',
  },
];

const EMPTY = { name: '', email: '', phone: '', cpf: '', password: '', confirm: '' };

export default function Register() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [profileType, setProfileType] = useState(params.get('perfil') === 'prestador' ? 'provider' : 'client');
  const [form, setForm] = useState(EMPTY);
  const [showPass, setShowPass] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') return setForm((f) => ({ ...f, phone: formatPhone(value) }));
    if (name === 'cpf') return setForm((f) => ({ ...f, cpf: formatCpf(value) }));
    return setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('As senhas não coincidem.');
      return;
    }
    setSubmitting(true);
    try {
      const json = await signUp({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: onlyDigits(form.phone),
        password: form.password,
        password_confirmation: form.confirm,
        profile_type: profileType,
        cpf: onlyDigits(form.cpf) || undefined,
        ref_code: localStorage.getItem(REF_STORAGE_KEY) || undefined,
      });
      if (json?.success) {
        navigate(`/ativar-conta?email=${encodeURIComponent(form.email.trim())}`, { replace: true });
        return;
      }
      setError(json?.message || 'Não foi possível criar a conta.');
    } catch (err) {
      setError(apiError(err, 'Não foi possível criar a conta.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Criar conta"
      subtitle="É grátis. Leva menos de um minuto."
      footer={
        <>
          Já tem conta? <Link to="/entrar">Entrar</Link>
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

        <div className="f-choices">
          {PROFILES.map(({ value, icon: Icon, title, desc }) => (
            <button
              key={value}
              type="button"
              className={`f-choice ${profileType === value ? 'f-choice-on' : ''}`}
              onClick={() => setProfileType(value)}
              aria-pressed={profileType === value}
            >
              <span className="f-choice-ico">
                <Icon size={20} />
              </span>
              <span className="f-choice-txt">
                <strong>{title}</strong>
                <span>{desc}</span>
              </span>
            </button>
          ))}
        </div>

        <div className="f-field">
          <label htmlFor="reg-name">Nome completo</label>
          <input
            id="reg-name"
            className="f-input"
            name="name"
            autoComplete="name"
            placeholder="Seu nome completo"
            value={form.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="f-field">
          <label htmlFor="reg-email">E-mail</label>
          <input
            id="reg-email"
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

        <div className="f-grid f-grid-2">
          <div className="f-field">
            <label htmlFor="reg-phone">WhatsApp</label>
            <input
              id="reg-phone"
              className="f-input"
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="(71) 90000-0000"
              value={form.phone}
              onChange={handleChange}
              required
            />
          </div>

          <div className="f-field">
            <label htmlFor="reg-cpf">
              CPF <span className="f-optional">(opcional)</span>
            </label>
            <input
              id="reg-cpf"
              className="f-input"
              name="cpf"
              inputMode="numeric"
              placeholder="000.000.000-00"
              value={form.cpf}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="f-field">
          <label htmlFor="reg-pass">Senha</label>
          <div className="f-pass">
            <input
              id="reg-pass"
              className="f-input"
              name="password"
              type={showPass ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Mínimo 6 caracteres"
              value={form.password}
              onChange={handleChange}
              minLength={6}
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

        <div className="f-field">
          <label htmlFor="reg-confirm">Confirmar senha</label>
          <input
            id="reg-confirm"
            className="f-input"
            name="confirm"
            type={showPass ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Repita a senha"
            value={form.confirm}
            onChange={handleChange}
            minLength={6}
            required
          />
        </div>

        <label className="f-check">
          <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} required />
          <span>
            Concordo com os <Link to="/termos">Termos de Uso</Link> e a{' '}
            <Link to="/privacidade">Política de Privacidade</Link>.
          </span>
        </label>

        <button type="submit" className="f-submit" disabled={submitting || !accepted}>
          {submitting ? 'Criando conta...' : 'Criar minha conta'}
        </button>
      </form>
    </AuthShell>
  );
}
