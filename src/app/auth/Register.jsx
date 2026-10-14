import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, ArrowRight, Eye, EyeOff, Hammer, UserRound } from 'lucide-react';
import AuthShell from './AuthShell';
import { useAuth } from '../../contexts/AuthContext';
import { registerError } from '../../services/http';
import { listCategories } from '../../services/catalog';
import { REF_STORAGE_KEY } from '../../utils/api';
import { STATIC_CATEGORIES } from '../../data/categories';
import { formatCpf, formatDate, formatPhone, normalizePhone, onlyDigits, parseDateToISO } from '../../utils/format';
import '../forms.css';
import '../ui.css';
import './Register.css';

const PROFILES = [
  {
    value: 'client',
    icon: UserRound,
    title: 'Quero contratar',
    desc: 'Publique o que precisa e receba propostas.',
  },
  {
    value: 'provider',
    icon: Hammer,
    title: 'Quero trabalhar',
    desc: 'Receba demandas da sua região e proponha.',
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

const SUBTITULO = {
  1: 'Primeiro, como você vai usar o Contrataê.',
  2: 'Seus dados de acesso. É grátis.',
  3: 'Agora o que você faz, para receber as demandas certas.',
};

const semAcento = (texto) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/**
 * Cadastro em passos.
 *
 * O prestador precisa entregar dez campos mais as categorias, porque o servidor
 * exige nome da mãe e nascimento já no cadastro (é o que alimenta a checagem de
 * antecedentes). Numa página só isso virava uma rolagem de três telas, com o
 * aceite dos termos e o botão lá no fim — formulário longo demais é abandonado
 * antes de chegar ao fim.
 *
 * Então a mesma quantidade de dado vem repartida: perfil, acesso e trabalho.
 * Cliente termina em dois passos; prestador, em três. Quem chega pelo link com
 * ?perfil já começa no segundo, sem responder de novo o que já respondeu.
 */
export default function Register() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const perfilDaUrl = params.get('perfil');
  const [profileType, setProfileType] = useState(perfilDaUrl === 'prestador' ? 'provider' : 'client');
  const [passo, setPasso] = useState(perfilDaUrl ? 2 : 1);
  const [form, setForm] = useState(EMPTY);
  const [categories, setCategories] = useState(FALLBACK_LABELS);
  const [selectedCats, setSelectedCats] = useState([]);
  const [catBusca, setCatBusca] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const formRef = useRef(null);

  const isProvider = profileType === 'provider';
  const totalPassos = isProvider ? 3 : 2;
  const noUltimoPasso = passo === totalPassos;

  // O servidor manda recados diferentes para o mesmo caso (e-mail ou CPF já
  // cadastrado). Qualquer um deles tem a mesma saída: entrar na conta de antes.
  const contaExistente = /j[áa] (est[áa] )?cadastrad|e-?mail diferente|outra conta|conta existente/i.test(error);

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

  const catsVisiveis = (() => {
    const termo = semAcento(catBusca.trim());
    if (!termo) return categories;
    return categories.filter((label) => semAcento(label).includes(termo));
  })();

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') return setForm((f) => ({ ...f, phone: formatPhone(value) }));
    if (name === 'cpf') return setForm((f) => ({ ...f, cpf: formatCpf(value) }));
    if (name === 'birth_date') return setForm((f) => ({ ...f, birth_date: formatDate(value) }));
    return setForm((f) => ({ ...f, [name]: value }));
  };

  const toggleCat = (label) =>
    setSelectedCats((list) => (list.includes(label) ? list.filter((l) => l !== label) : [...list, label]));

  /**
   * Valida só o passo da vez. Como os outros passos não estão no DOM, o
   * reportValidity do navegador cuida sozinho dos campos obrigatórios visíveis.
   */
  const passoValido = () => {
    if (formRef.current && !formRef.current.reportValidity()) return false;

    if (passo === 2 && form.password !== form.confirm) {
      setError('As senhas não coincidem.');
      return false;
    }

    if (passo === 3) {
      if (form.birth_date.length !== 10) {
        setError('Informe sua data de nascimento completa.');
        return false;
      }
      if (selectedCats.length === 0) {
        setError('Escolha pelo menos uma categoria de serviço.');
        return false;
      }
    }

    setError('');
    return true;
  };

  const avancar = () => {
    if (!passoValido()) return;
    setPasso((p) => Math.min(p + 1, totalPassos));
  };

  const voltar = () => {
    setError('');
    setPasso((p) => Math.max(p - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Enter no meio do formulário não pode criar a conta antes da hora.
    if (!noUltimoPasso) return avancar();
    if (!passoValido()) return;

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

  const perfilAtual = PROFILES.find((p) => p.value === profileType);

  return (
    <AuthShell
      title="Criar conta"
      subtitle={SUBTITULO[passo]}
      footer={
        <>
          Já tem conta? <Link to="/entrar">Entrar</Link>
        </>
      }
    >
      <div className="reg-passos" aria-label={`Passo ${passo} de ${totalPassos}`}>
        <div className="reg-barra">
          <span style={{ width: `${(passo / totalPassos) * 100}%` }} />
        </div>
        <span className="reg-passos-txt">
          Passo {passo} de {totalPassos}
        </span>
      </div>

      <form className="f-form" onSubmit={handleSubmit} ref={formRef} noValidate={false}>
        {error && (
          <div className="f-alert f-alert-err">
            <AlertCircle size={16} />
            <span>
              {error}
              {contaExistente && (
                <>
                  {' '}
                  <Link to="/entrar">Entrar na conta que já existe</Link>.
                </>
              )}
            </span>
          </div>
        )}

        {passo === 1 && (
          <div className="f-choices f-choices-2">
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
        )}

        {passo > 1 && perfilAtual && (
          <button type="button" className="reg-perfil" onClick={() => setPasso(1)}>
            <perfilAtual.icon size={15} />
            <strong>{perfilAtual.title}</strong>
            <span>Trocar</span>
          </button>
        )}

        {passo === 2 && (
          <>
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

            <div className="f-grid f-grid-2">
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
            </div>
          </>
        )}

        {passo === 3 && (
          <>
            <div className="f-field">
              <label htmlFor="reg-cats-busca">O que você faz</label>
              <input
                id="reg-cats-busca"
                className="f-input f-input-sm"
                placeholder="Busque sua categoria"
                value={catBusca}
                onChange={(e) => setCatBusca(e.target.value)}
                autoComplete="off"
              />
              <div className="chips chips-box" id="reg-cats">
                {catsVisiveis.map((label) => (
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
                {catsVisiveis.length === 0 && (
                  <span className="chips-vazio">Nenhuma categoria com esse nome.</span>
                )}
              </div>
              <span className="f-hint">
                {selectedCats.length > 0
                  ? `${selectedCats.length} ${selectedCats.length === 1 ? 'categoria escolhida' : 'categorias escolhidas'}. `
                  : 'Escolha pelo menos uma. '}
                Dá para ajustar depois no seu perfil.
              </span>
            </div>

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

            <span className="f-hint reg-porque">
              Pedimos esses dois dados porque são eles que permitem verificar seus antecedentes e exibir o selo de
              perfil verificado para quem for te contratar.
            </span>
          </>
        )}

        {noUltimoPasso && (
          <label className="f-check">
            <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} required />
            <span>
              Concordo com os <Link to="/termos">Termos de Uso</Link> e a{' '}
              <Link to="/privacidade">Política de Privacidade</Link>.
            </span>
          </label>
        )}

        <div className="reg-acoes">
          {passo > 1 && (
            <button type="button" className="f-ghost reg-voltar" onClick={voltar}>
              <ArrowLeft size={16} />
              Voltar
            </button>
          )}

          {noUltimoPasso ? (
            <button type="submit" className="f-submit" disabled={submitting || !accepted}>
              {submitting ? 'Criando conta...' : 'Criar minha conta'}
            </button>
          ) : (
            <button type="button" className="f-submit" onClick={avancar}>
              Continuar
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      </form>
    </AuthShell>
  );
}
