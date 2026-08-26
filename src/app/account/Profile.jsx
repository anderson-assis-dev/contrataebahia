import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Bell,
  Camera,
  CreditCard,
  Crown,
  Eye,
  KeyRound,
  LogOut,
  Repeat,
  Trash2,
  UserRound,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import {
  changePasswordWithOtp,
  deleteAccount,
  requestOtp,
  updateAvatar,
  updateNotificationPreferences,
  updateProfile,
} from '../../services/auth';
import { apiError } from '../../services/http';
import { formatCep, formatPhone, onlyDigits } from '../../utils/format';
import '../forms.css';
import '../ui.css';
import './Profile.css';

const initialsOf = (name) =>
  (name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

export default function Profile() {
  const { user, isProvider, signOut, patchUser, refreshUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: formatPhone(user?.phone || ''),
    address: user?.address || '',
    zip_code: formatCep(user?.zip_code || ''),
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [notifications, setNotifications] = useState(Number(user?.email_notifications ?? 1) === 1);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passBusy, setPassBusy] = useState(false);
  const [passError, setPassError] = useState('');
  const [danger, setDanger] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') return setForm((f) => ({ ...f, phone: formatPhone(value) }));
    if (name === 'zip_code') return setForm((f) => ({ ...f, zip_code: formatCep(value) }));
    return setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const json = await updateProfile({
        name: form.name.trim(),
        phone: onlyDigits(form.phone),
        address: form.address.trim() || undefined,
        zip_code: onlyDigits(form.zip_code) || undefined,
      });
      if (json?.success) {
        patchUser(json.data?.user || json.data || {});
        toast.success('Dados atualizados.');
        return;
      }
      toast.error(json?.message || 'Não foi possível salvar.');
    } catch (err) {
      toast.error(apiError(err, 'Não foi possível salvar.'));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAvatar = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      toast.error('Escolha uma imagem de até 4 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const json = await updateAvatar(String(reader.result));
        if (json?.success) {
          patchUser({ avatar_base64: String(reader.result) });
          toast.success('Foto atualizada.');
          return;
        }
        toast.error(json?.message || 'Não foi possível atualizar a foto.');
      } catch (err) {
        toast.error(apiError(err, 'Não foi possível atualizar a foto.'));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleNotifications = async (checked) => {
    setNotifications(checked);
    try {
      await updateNotificationPreferences(checked);
      patchUser({ email_notifications: checked ? 1 : 0 });
    } catch (err) {
      setNotifications(!checked);
      toast.error(apiError(err, 'Não foi possível salvar a preferência.'));
    }
  };

  const handleRequestOtp = async () => {
    setPassError('');
    setPassBusy(true);
    try {
      const json = await requestOtp();
      if (json?.success) {
        setOtpSent(true);
        toast.success('Enviamos um código para o seu e-mail.');
        return;
      }
      setPassError(json?.message || 'Não foi possível enviar o código.');
    } catch (err) {
      setPassError(apiError(err, 'Não foi possível enviar o código.'));
    } finally {
      setPassBusy(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassError('');
    if (newPassword.length < 6) {
      setPassError('A nova senha precisa de no mínimo 6 caracteres.');
      return;
    }
    setPassBusy(true);
    try {
      const json = await changePasswordWithOtp(otp, newPassword);
      if (json?.success) {
        toast.success('Senha alterada.');
        setOtpSent(false);
        setOtp('');
        setNewPassword('');
        return;
      }
      setPassError(json?.message || 'Não foi possível alterar a senha.');
    } catch (err) {
      setPassError(apiError(err, 'Não foi possível alterar a senha.'));
    } finally {
      setPassBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Excluir sua conta? Esta ação não pode ser desfeita.')) return;
    try {
      await deleteAccount();
      toast.info('Sua conta foi excluída.');
      await signOut();
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(apiError(err, 'Não foi possível excluir a conta.'));
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">Meu perfil</h1>
        <p className="page-sub">Seus dados, segurança e preferências.</p>
      </div>

      <div className="prof-hero">
        <div className="prof-avatar-wrap">
          {user?.avatar_base64 ? (
            <img src={user.avatar_base64} alt="" className="prof-avatar" />
          ) : (
            <span className="prof-avatar prof-avatar-fallback">{initialsOf(user?.name)}</span>
          )}
          <input id="prof-file" type="file" accept="image/*" onChange={handleAvatar} className="prof-file" />
          <label htmlFor="prof-file" className="prof-avatar-btn" aria-label="Trocar foto">
            <Camera size={15} />
          </label>
        </div>

        <div className="prof-hero-info">
          <strong>{user?.name}</strong>
          <span>{user?.email}</span>
          <span className="chip chip-on prof-role">
            <UserRound size={13} />
            {isProvider ? 'Prestador' : 'Cliente'}
          </span>
        </div>
      </div>

      <div className="stack">
        <form className="card stack" onSubmit={handleSaveProfile}>
          <div className="card-title">Dados pessoais</div>

          <div className="f-field">
            <label htmlFor="prof-name">Nome</label>
            <input id="prof-name" className="f-input" name="name" value={form.name} onChange={handleChange} required />
          </div>

          <div className="f-grid f-grid-2">
            <div className="f-field">
              <label htmlFor="prof-phone">WhatsApp</label>
              <input
                id="prof-phone"
                className="f-input"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                required
              />
            </div>

            <div className="f-field">
              <label htmlFor="prof-cep">CEP</label>
              <input
                id="prof-cep"
                className="f-input"
                name="zip_code"
                inputMode="numeric"
                placeholder="00000-000"
                value={form.zip_code}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="f-field">
            <label htmlFor="prof-address">Endereço</label>
            <input
              id="prof-address"
              className="f-input"
              name="address"
              placeholder="Rua, número, bairro, cidade"
              value={form.address}
              onChange={handleChange}
            />
          </div>

          <button type="submit" className="f-submit" disabled={savingProfile}>
            {savingProfile ? 'Salvando...' : 'Salvar dados'}
          </button>
        </form>

        <div className="card stack">
          <div className="card-title">Como você usa o Contrataê</div>
          <p className="card-sub">
            Você está como <strong>{isProvider ? 'prestador' : 'cliente'}</strong>.
            {isProvider
              ? ' Ajuste suas categorias para receber as demandas certas.'
              : ' Se quiser oferecer serviços, mude para prestador.'}
          </p>
          <Link to="/app/perfil/tipo" className="f-ghost">
            <Repeat size={16} />
            {isProvider ? 'Editar categorias ou virar cliente' : 'Quero oferecer serviços'}
          </Link>
        </div>

        <div className="card stack">
          <div className="card-title">
            <Bell size={16} style={{ verticalAlign: '-3px', marginRight: 6 }} />
            Notificações
          </div>
          <label className="f-check">
            <input
              type="checkbox"
              checked={notifications}
              onChange={(e) => handleNotifications(e.target.checked)}
            />
            <span>Quero receber avisos por e-mail sobre propostas, agendamentos e mensagens.</span>
          </label>
        </div>

        <div className="card stack">
          <div className="card-title">
            <KeyRound size={16} style={{ verticalAlign: '-3px', marginRight: 6 }} />
            Alterar senha
          </div>

          {passError && (
            <div className="f-alert f-alert-err">
              <AlertCircle size={16} />
              <span>{passError}</span>
            </div>
          )}

          {!otpSent ? (
            <>
              <p className="card-sub">
                Para sua segurança, enviamos um código para <strong>{user?.email}</strong> antes de trocar a senha.
              </p>
              <button type="button" className="f-ghost" onClick={handleRequestOtp} disabled={passBusy}>
                {passBusy ? 'Enviando...' : 'Enviar código por e-mail'}
              </button>
            </>
          ) : (
            <form className="stack" onSubmit={handleChangePassword}>
              <div className="f-field">
                <label htmlFor="prof-otp">Código recebido</label>
                <input
                  id="prof-otp"
                  className="f-input"
                  inputMode="numeric"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(onlyDigits(e.target.value).slice(0, 6))}
                  required
                />
              </div>
              <div className="f-field">
                <label htmlFor="prof-newpass">Nova senha</label>
                <input
                  id="prof-newpass"
                  className="f-input"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Mínimo 6 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>
              <button type="submit" className="f-submit" disabled={passBusy}>
                {passBusy ? 'Alterando...' : 'Alterar senha'}
              </button>
              <button type="button" className="f-ghost" onClick={() => setOtpSent(false)}>
                Cancelar
              </button>
            </form>
          )}
        </div>

        <div className="card stack">
          <div className="card-title">Carteira e plano</div>
          <Link to="/app/carteira" className="f-ghost">
            <CreditCard size={16} />
            Carteira e cartões
          </Link>
          {isProvider && (
            <>
              <Link to="/app/premium" className="f-ghost">
                <Crown size={16} />
                {Number(user?.is_premium) === 1 ? 'Gerenciar Premium' : 'Assinar Premium'}
              </Link>
              <Link to="/app/visibilidade" className="f-ghost">
                <Eye size={16} />
                Painel profissional
              </Link>
            </>
          )}
        </div>

        <div className="card stack">
          <div className="card-title">Conta</div>

          <button type="button" className="f-ghost" onClick={handleSignOut}>
            <LogOut size={16} />
            Sair da conta
          </button>

          {!danger ? (
            <button type="button" className="f-ghost prof-danger" onClick={() => setDanger(true)}>
              <Trash2 size={16} />
              Excluir minha conta
            </button>
          ) : (
            <>
              <div className="f-alert f-alert-err">
                <AlertCircle size={16} />
                <span>
                  Excluir a conta remove seus pedidos, propostas e histórico. Não há como desfazer.
                </span>
              </div>
              <button type="button" className="f-submit prof-danger-solid" onClick={handleDelete}>
                Sim, excluir definitivamente
              </button>
              <button type="button" className="f-ghost" onClick={() => setDanger(false)}>
                Manter minha conta
              </button>
            </>
          )}
        </div>

        <button type="button" className="prof-refresh" onClick={refreshUser}>
          Atualizar meus dados
        </button>
      </div>
    </>
  );
}
