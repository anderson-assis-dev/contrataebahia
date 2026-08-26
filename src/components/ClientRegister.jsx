import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle2, AlertCircle, X } from 'lucide-react';
import './RegisterModal.css';
import { apiPost, REF_STORAGE_KEY } from '../utils/api';
import { formatPhone, formatCpf, onlyDigits } from '../utils/format';

const EMPTY_FORM = { name: '', email: '', phone: '', cpf: '', password: '', confirmPassword: '' };

export default function ClientRegisterModal({ open, onClose }) {
  const dialogRef = useRef(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

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
    if (name === 'cpf') { setForm((f) => ({ ...f, cpf: formatCpf(value) })); return; }
    setForm((f) => ({ ...f, [name]: value }));
  };

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
        profile_type: 'client',
        cpf: onlyDigits(form.cpf) || undefined,
        ref_code: localStorage.getItem(REF_STORAGE_KEY) || undefined,
      });
      if (json.success) {
        setResult({ ok: true, msg: json.message || 'Conta criada com sucesso!' });
        setForm(EMPTY_FORM);
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
    <dialog ref={dialogRef} className="reg-modal" aria-labelledby="cr-modal-title">
      <div className="reg-modal-head">
        <div>
          <div id="cr-modal-title" className="reg-modal-title">Criar conta</div>
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
              <label htmlFor="cr-name">Nome completo</label>
              <input
                id="cr-name" name="name" type="text" placeholder="Seu nome completo"
                value={form.name} onChange={handleChange} required
              />
            </div>

            <div className="reg-field">
              <label htmlFor="cr-email">E-mail</label>
              <input
                id="cr-email" name="email" type="email" placeholder="seu@email.com"
                value={form.email} onChange={handleChange} required
              />
            </div>

            <div className="reg-field">
              <label htmlFor="cr-phone">WhatsApp / Telefone</label>
              <input
                id="cr-phone" name="phone" type="tel" placeholder="(71) 90000-0000"
                value={form.phone} onChange={handleChange} required
              />
            </div>

            <div className="reg-field">
              <label htmlFor="cr-cpf">
                CPF <span className="reg-field-optional">(opcional)</span>
              </label>
              <input
                id="cr-cpf" name="cpf" type="text" inputMode="numeric" placeholder="000.000.000-00"
                value={form.cpf} onChange={handleChange}
              />
            </div>

            <div className="reg-field">
              <label htmlFor="cr-pass">Senha</label>
              <div className="reg-pass-wrap">
                <input
                  id="cr-pass" name="password" type={showPass ? 'text' : 'password'}
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
              <label htmlFor="cr-confirm">Confirmar senha</label>
              <div className="reg-pass-wrap">
                <input
                  id="cr-confirm" name="confirmPassword" type={showConfirm ? 'text' : 'password'}
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
