import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff, Hammer, UserRound } from 'lucide-react';
import AuthShell from './AuthShell';
import { useAuth } from '../../contexts/AuthContext';
import { registerError } from '../../services/http';
import { listCategories } from '../../services/catalog';
import { REF_STORAGE_KEY } from '../../utils/api';
import { STATIC_CATEGORIES } from '../../data/categories';
import { formatCpf, formatDate, formatPhone, normalizePhone, onlyDigits, parseDateToISO } from '../../utils/format';
import '../forms.css';
import '../ui.css';

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

const EMPTY = {
  name: '',
  email: '',
  phone: '',
  cpf: '',
  password: '',
  confirm: '',
  mother_name: '',
  birth_date: '',
};

const FALLBACK_LABELS = STATIC_CATEGORIES.map((c) => c.label);

export default function Register() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [profileType, setProfileType] = useState(params.get('perfil') === 'prestador' ? 'provider' : 'client');
  const [form, setForm] = useState(EMPTY);
  const [categories, setCategories] = useState(FALLBACK_LABELS);
  const [selectedCats, setSelectedCats] = useState([]);
  const [showPass, setShowPass] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isProvider = profileType === 'provider';

  useEffect(() => {
    if (!isProvider) return undefined;
    let active = true;
    listCategories(60)
      .then((json) => {
        if (!active) return;
        const labels = (json?.data || []).map((c) => c.label).filter(Boolean);
        if (labels.length) setCategories(labels);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [isProvider]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') return setForm((f) => ({ ...f, phone: formatPhone(value) }));
    if (name === 'cpf') return setForm((f) => ({ ...f, cpf: formatCpf(value) }));
    if (name === 'birth_date') return setForm((f) => ({ ...f, birth_date: formatDate(value) }));
    return setForm((f) => ({ ...f, [name]: value }));
  };

  const toggleCat = (label) =>
    setSelectedCats((list) => (list.includes(label) ? list.filter((l) => l !== label) : [...list, label]));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('As senhas não coincidem.');
      return;
    }
    if (isProvider) {
      if (!form.mother_name.trim()) {
        setError('Informe o nome da sua mãe. É exigido no cadastro de prestador.');
        return;
      }
      if (form.birth_date.length !== 10) {
        setError('Informe sua data de nascimento completa.');
        return;
      }
      if (selectedCats.length === 0) {
        setError('Escolha pelo menos uma categoria de serviço.');
        return;
      }
    }
    setSubmitting(true);
    try {
      const json = await signUp({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: normalizePhone(form.phone),
        password: form.password,
        password_confirmation: form.confirm,
        profile_type: profileType,
        cpf: onlyDigits(form.cpf) || undefined,
        ref_code: localStorage.getItem(REF_STORAGE_KEY) || undefined,
        ...(isProvider
          ? {
              mother_name: form.mother_name.trim(),
              birth_date: parseDateToISO(form.birth_date),
              service_categories: selectedCats,
            }
          : {}),
      });
      if (json?.success) {
        navigate(`/ativar-conta?email=${encodeURIComponent(form.email.trim())}`, { replace: true });
        return;
      }
      setError(json?.message || 'Não foi possível criar a conta.');
    } catch (err) {
      setError(registerError(err, Boolean(onlyDigits(form.cpf))));
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
            <span className="f-hint">Se este CPF já tiver conta, o cadastro não conclui. Nesse caso, deixe em branco.</span>
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

        {isProvider && (
          <>
            <div className="f-grid f-grid-2">
              <div className="f-field">
                <label htmlFor="reg-mother">Nome da mãe</label>
                <input
                  id="reg-mother"
                  className="f-input"
                  name="mother_name"
                  placeholder="Nome completo da sua mãe"
                  value={form.mother_name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="f-field">
                <label htmlFor="reg-birth">Data de nascimento</label>
                <input
                  id="reg-birth"
                  className="f-input"
                  name="birth_date"
                  inputMode="numeric"
                  placeholder="dd/mm/aaaa"
                  value={form.birth_date}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="f-field">
              <label htmlFor="reg-cats">O que você faz</label>
              <div className="chips" id="reg-cats">
                {categories.map((label) => (
                  <button
                    key={label}
                    type="button"
                    className={`chip ${selectedCats.includes(label) ? 'chip-on' : ''}`}
                    onClick={() => toggleCat(label)}
                    aria-pressed={selectedCats.includes(label)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <span className="f-hint">
                Você receberá demandas dessas categorias. Pode ajustar depois no seu perfil.
              </span>
            </div>
          </>
        )}

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
