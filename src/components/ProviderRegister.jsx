import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp, Users, Wallet, ShieldCheck, Smartphone, Star,
  ChevronDown, ArrowRight, Zap, Eye, EyeOff, CheckCircle2, AlertCircle, X,
} from 'lucide-react';
import './ProviderRegister.css';
import './RegisterModal.css';
import { apiGet, apiPost, REF_STORAGE_KEY } from '../utils/api';
import { STATIC_CATEGORIES } from '../data/categories';
import { formatPhone, formatCpfCnpj, formatDate, parseDateToISO, onlyDigits } from '../utils/format';
import { BRAND_NAME } from '../utils/brand';

const HIGHLIGHTS = [
  { label: 'Cadastro gratuito', desc: 'sem mensalidade obrigatória' },
  { label: 'Sem comissão', desc: 'o valor do serviço é seu' },
  { label: 'Negociação direta', desc: 'você fala com o cliente' },
];

const BENEFITS = [
  {
    icon: TrendingUp,
    title: 'Mais oportunidades',
    desc: 'Receba pedidos de clientes próximos a você e amplie sua agenda.',
  },
  {
    icon: Users,
    title: 'Clientes da sua região',
    desc: 'Apareça para quem já está buscando exatamente o que você oferece.',
  },
  {
    icon: Wallet,
    title: 'Pagamento direto',
    desc: 'Você negocia e recebe direto do cliente, sem intermediação financeira.',
  },
  {
    icon: Star,
    title: 'Reputação que vende',
    desc: 'Avaliações de clientes reais constroem sua credibilidade.',
  },
  {
    icon: Smartphone,
    title: 'Simples de usar',
    desc: 'Gerencie pedidos e propostas pelo celular, onde você estiver.',
  },
  {
    icon: ShieldCheck,
    title: 'Perfil verificado',
    desc: 'O selo de verificação aumenta a confiança de quem vai te contratar.',
  },
];

const STEPS = [
  { n: '1', title: 'Crie sua conta', desc: 'Preencha seus dados. Leva menos de 3 minutos.' },
  { n: '2', title: 'Monte seu perfil', desc: 'Adicione suas especialidades e área de atendimento.' },
  { n: '3', title: 'Receba pedidos', desc: 'Envie propostas e feche serviços direto com o cliente.' },
];

const FAQS = [
  {
    q: 'É gratuito se cadastrar?',
    a: 'Sim. O cadastro é totalmente gratuito e não cobramos comissão sobre os serviços fechados.',
  },
  {
    q: 'Que tipos de serviços posso oferecer?',
    a: 'Diversas categorias: limpeza, reparos, reformas, elétrica, hidráulica, pintura, jardinagem, construção, assistência técnica e muito mais.',
  },
  {
    q: 'Como recebo pelos serviços realizados?',
    a: `O pagamento é acordado diretamente com o cliente — prazo, forma e valor são definidos entre vocês. O ${BRAND_NAME} conecta as partes, mas não intermedia o pagamento.`,
  },
  {
    q: 'Posso atender em mais de uma cidade?',
    a: 'Sim. Você define sua área de atendimento e pode ampliar ou reduzir conforme sua disponibilidade.',
  },
  {
    q: 'Como funciona o sistema de avaliações?',
    a: 'Após cada serviço, o cliente avalia você. Avaliações positivas aumentam sua visibilidade na plataforma.',
  },
];

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="pr-faq-item">
      <button type="button" className="pr-faq-q" onClick={() => setOpen(!open)} aria-expanded={open}>
        {q}
        <ChevronDown size={18} className={`pr-faq-icon${open ? ' open' : ''}`} />
      </button>
      {open && <div className="pr-faq-a">{a}</div>}
    </div>
  );
}

const EMPTY_FORM = {
  name: '', email: '', phone: '', password: '', confirmPassword: '',
  cpf: '', mother_name: '', birth_date: '',
};

const DEFAULT_CATEGORY_LABELS = STATIC_CATEGORIES.map((c) => c.label);

function RegisterModal({ open, onClose, initialEmail }) {
  const dialogRef = useRef(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [categories, setCategories] = useState(DEFAULT_CATEGORY_LABELS);
  const [selectedCats, setSelectedCats] = useState([]);
  const [catSearch, setCatSearch] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (initialEmail) setForm((f) => ({ ...f, email: initialEmail }));
  }, [initialEmail]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await apiGet('/api/providers/categories?limit=60');
        if (active && Array.isArray(data) && data.length > 0) {
          setCategories(data.map((c) => c.label));
        }
      } catch {
        // mantém as categorias padrão
      }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;
    if (open) {
      if (!dialog.open) dialog.showModal();
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
    if (dialog.open) dialog.close();
    document.body.style.overflow = '';
    return undefined;
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;
    const onCancel = (e) => { e.preventDefault(); onClose(); };
    dialog.addEventListener('cancel', onCancel);
    return () => dialog.removeEventListener('cancel', onCancel);
  }, [onClose]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') { setForm((f) => ({ ...f, phone: formatPhone(value) })); return; }
    if (name === 'cpf') { setForm((f) => ({ ...f, cpf: formatCpfCnpj(value) })); return; }
    if (name === 'birth_date') { setForm((f) => ({ ...f, birth_date: formatDate(value) })); return; }
    setForm((f) => ({ ...f, [name]: value }));
  };

  const toggleCat = (cat) =>
    setSelectedCats((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));

  const addTypedCat = () => {
    const val = catSearch.trim();
    if (!val || selectedCats.includes(val)) return;
    setSelectedCats((prev) => [...prev, val]);
    setCatSearch('');
  };

  const filteredCats = categories.filter((c) => c.toLowerCase().includes(catSearch.toLowerCase()));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResult(null);
    if (form.password !== form.confirmPassword) {
      setResult({ ok: false, msg: 'As senhas não coincidem.' });
      return;
    }
    setSubmitting(true);
    try {
      const json = await apiPost('/api/auth/register', {
        name: form.name,
        email: form.email,
        phone: onlyDigits(form.phone),
        password: form.password,
        password_confirmation: form.confirmPassword,
        profile_type: 'provider',
        cpf: onlyDigits(form.cpf) || undefined,
        mother_name: form.mother_name,
        birth_date: parseDateToISO(form.birth_date),
        service_categories: selectedCats.length ? JSON.stringify(selectedCats) : undefined,
        ref_code: localStorage.getItem(REF_STORAGE_KEY) || undefined,
      });
      if (json.success) {
        setResult({ ok: true, msg: json.message || 'Cadastro realizado com sucesso!' });
        setForm(EMPTY_FORM);
        setSelectedCats([]);
      } else {
        setResult({ ok: false, msg: json.message || 'Erro ao criar conta. Tente novamente.' });
      }
    } catch {
      setResult({ ok: false, msg: 'Erro de conexão. Verifique sua internet e tente novamente.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <dialog ref={dialogRef} className="reg-modal" aria-labelledby="pr-modal-title">
      <div className="reg-modal-head">
        <div>
          <div id="pr-modal-title" className="reg-modal-title">Criar conta de prestador</div>
          <div className="reg-modal-sub">Preencha seus dados — é grátis</div>
        </div>
        <button type="button" className="reg-modal-close" onClick={onClose} aria-label="Fechar">
          <X size={20} />
        </button>
      </div>

      <div className="reg-modal-body">
        {result && (
          <div className={`reg-alert ${result.ok ? 'reg-alert-ok' : 'reg-alert-err'}`}>
            {result.ok ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {result.msg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="reg-grid">
            <div className="reg-field">
              <label htmlFor="pr-name">Nome completo</label>
              <input
                id="pr-name" name="name" type="text" placeholder="Seu nome completo"
                value={form.name} onChange={handleChange} required
              />
            </div>

            <div className="reg-field">
              <label htmlFor="pr-email">E-mail</label>
              <input
                id="pr-email" name="email" type="email" placeholder="seu@email.com"
                value={form.email} onChange={handleChange} required
              />
            </div>

            <div className="reg-field">
              <label htmlFor="pr-phone">WhatsApp / Telefone</label>
              <input
                id="pr-phone" name="phone" type="tel" placeholder="(71) 90000-0000"
                value={form.phone} onChange={handleChange} required
              />
            </div>

            <div className="reg-field">
              <label htmlFor="pr-cpf">CPF / CNPJ</label>
              <input
                id="pr-cpf" name="cpf" type="text" inputMode="numeric" placeholder="000.000.000-00"
                value={form.cpf} onChange={handleChange}
              />
            </div>

            <div className="reg-field">
              <label htmlFor="pr-mother">Nome da mãe</label>
              <input
                id="pr-mother" name="mother_name" type="text" placeholder="Nome completo da sua mãe"
                value={form.mother_name} onChange={handleChange} required
              />
            </div>

            <div className="reg-field">
              <label htmlFor="pr-birth">Data de nascimento</label>
              <input
                id="pr-birth" name="birth_date" type="text" inputMode="numeric" placeholder="DD/MM/AAAA"
                value={form.birth_date} onChange={handleChange} required
              />
            </div>

            <div className="reg-field">
              <label htmlFor="pr-pass">Senha</label>
              <div className="reg-pass-wrap">
                <input
                  id="pr-pass" name="password" type={showPass ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres"
                  value={form.password} onChange={handleChange} required minLength={6}
                />
                <button
                  type="button" className="reg-pass-eye"
                  onClick={() => setShowPass((v) => !v)}
                  aria-label={showPass ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="reg-field">
              <label htmlFor="pr-confirm">Confirmar senha</label>
              <div className="reg-pass-wrap">
                <input
                  id="pr-confirm" name="confirmPassword" type={showConfirm ? 'text' : 'password'}
                  placeholder="Repita a senha"
                  value={form.confirmPassword} onChange={handleChange} required minLength={6}
                />
                <button
                  type="button" className="reg-pass-eye"
                  onClick={() => setShowConfirm((v) => !v)}
                  aria-label={showConfirm ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          <div className="reg-field">
            <label htmlFor="pr-cat-search">Categorias de serviço</label>
            <div className="reg-cat-search-wrap">
              <input
                id="pr-cat-search" type="text" placeholder="Buscar ou digitar nova categoria..."
                value={catSearch}
                onChange={(e) => setCatSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter') return;
                  e.preventDefault();
                  addTypedCat();
                }}
              />
              {catSearch.trim()
                && !categories.some((c) => c.toLowerCase() === catSearch.trim().toLowerCase()) && (
                <button type="button" className="reg-cat-add-btn" onClick={addTypedCat}>
                  + Adicionar &quot;{catSearch.trim()}&quot;
                </button>
              )}
            </div>

            {selectedCats.length > 0 && (
              <div className="reg-cats-selected">
                {selectedCats.map((c) => (
                  <span key={c} className="reg-cat-chip selected">
                    {c}
                    <button type="button" onClick={() => toggleCat(c)} aria-label={`Remover ${c}`}>
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="reg-cats-list">
              {filteredCats.slice(0, 24).map((c) => (
                <button
                  type="button" key={c}
                  className={`reg-cat-chip${selectedCats.includes(c) ? ' selected' : ''}`}
                  onClick={() => toggleCat(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" className="reg-submit" disabled={submitting}>
            {submitting ? 'Criando conta...' : 'Criar minha conta grátis'}
          </button>
        </form>

        <p className="reg-note">
          Ao continuar você concorda com nossos <Link to="/termos">Termos de Uso</Link> e{' '}
          <Link to="/privacidade">Política de Privacidade</Link>.
        </p>
      </div>
    </dialog>
  );
}

export default function ProviderRegister() {
  const [modalOpen, setModalOpen] = useState(false);
  const [initialEmail, setInitialEmail] = useState('');
  const [bottomEmail, setBottomEmail] = useState('');

  const openModal = useCallback((email = '') => {
    setInitialEmail(email);
    setModalOpen(true);
  }, []);

  const handleBottomSubmit = (e) => {
    e.preventDefault();
    openModal(bottomEmail);
    setBottomEmail('');
  };

  return (
    <div>
      <section className="pr-hero">
        <div className="pr-hero-inner">
          <div className="pr-hero-badge">
            <Zap size={12} />
            Para profissionais e empresas
          </div>
          <h1>
            Você faz.<br />
            <span className="pr-hero-accent">A gente conecta.</span>
          </h1>
          <p className="pr-hero-sub">
            Transforme seu trabalho em novas oportunidades. Cadastre-se no {BRAND_NAME} e
            comece a receber pedidos de clientes da sua região.
          </p>
          <button type="button" className="pr-hero-btn" onClick={() => openModal()}>
            Quero ser prestador <ArrowRight size={16} />
          </button>
        </div>
      </section>

      <section className="pr-highlights">
        <div className="pr-highlights-inner">
          {HIGHLIGHTS.map((h) => (
            <div key={h.label} className="pr-highlight">
              <div className="pr-highlight-label">{h.label}</div>
              <div className="pr-highlight-desc">{h.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="pr-benefits">
        <div className="pr-benefits-head">
          <span className="s-eye">Vantagens</span>
          <h2 className="s-title">Por que estar no {BRAND_NAME}?</h2>
          <p className="s-sub">
            Tudo que você precisa para crescer como profissional autônomo ou empresa.
          </p>
        </div>

        <div className="pr-benefits-grid">
          {BENEFITS.map((b) => {
            const Icon = b.icon;
            return (
              <div key={b.title} className="pr-benefit">
                <div className="pr-benefit-icon"><Icon size={22} strokeWidth={2} /></div>
                <h3 className="pr-benefit-title">{b.title}</h3>
                <p className="pr-benefit-desc">{b.desc}</p>
              </div>
            );
          })}
        </div>

        <div className="pr-benefits-cta">
          <button type="button" className="btn-primary" onClick={() => openModal()}>
            Cadastrar meus serviços <ArrowRight size={16} />
          </button>
        </div>
      </section>

      <section className="pr-steps-section">
        <div className="pr-steps-inner">
          <div className="pr-steps-head">
            <span className="s-eye">Como se cadastrar</span>
            <h2 className="s-title">Simples e rápido</h2>
            <p className="s-sub">
              Em poucos passos seu trabalho já aparece para clientes da sua região.
            </p>
          </div>
          <div className="pr-steps-grid">
            {STEPS.map((s) => (
              <div key={s.n} className="pr-step">
                <div className="pr-step-num">{s.n}</div>
                <h3 className="pr-step-title">{s.title}</h3>
                <p className="pr-step-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pr-faq">
        <h2 className="pr-faq-title">Perguntas frequentes</h2>
        {FAQS.map((f) => (
          <FaqItem key={f.q} q={f.q} a={f.a} />
        ))}
      </section>

      <section className="pr-bottom-cta">
        <div className="pr-bottom-cta-inner">
          <h2>Pronto para começar?</h2>
          <p>Coloque seus serviços no {BRAND_NAME} e receba pedidos ainda hoje.</p>
          <form className="pr-bottom-form" onSubmit={handleBottomSubmit}>
            <input
              type="email" aria-label="Seu melhor e-mail" placeholder="Seu melhor e-mail"
              value={bottomEmail} onChange={(e) => setBottomEmail(e.target.value)} required
            />
            <button type="submit">Cadastrar grátis</button>
          </form>
        </div>
      </section>

      {modalOpen && (
        <RegisterModal open={modalOpen} onClose={() => setModalOpen(false)} initialEmail={initialEmail} />
      )}
    </div>
  );
}
