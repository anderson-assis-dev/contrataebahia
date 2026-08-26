import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Hammer, UserRound } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import * as authApi from '../../services/auth';
import { listCategories } from '../../services/catalog';
import { apiError } from '../../services/http';
import { STATIC_CATEGORIES } from '../../data/categories';
import { formatDate, parseDateToISO } from '../../utils/format';
import '../forms.css';
import '../ui.css';

const FALLBACK_LABELS = STATIC_CATEGORIES.map((c) => c.label);

export default function ProfileType() {
  const { user, patchUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [profileType, setProfileType] = useState(user?.profile_type || 'client');
  const [categories, setCategories] = useState([]);
  const [selected, setSelected] = useState(user?.service_categories || []);
  const [motherName, setMotherName] = useState(user?.mother_name || '');
  const [birthDate, setBirthDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    listCategories(60)
      .then((json) => {
        if (!active) return;
        const labels = (json?.data || []).map((c) => c.label).filter(Boolean);
        setCategories(labels.length ? labels : FALLBACK_LABELS);
      })
      .catch(() => {
        if (active) setCategories(FALLBACK_LABELS);
      });
    return () => {
      active = false;
    };
  }, []);

  const toggle = (label) =>
    setSelected((list) => (list.includes(label) ? list.filter((l) => l !== label) : [...list, label]));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (profileType === 'provider' && selected.length === 0) {
      setError('Escolha pelo menos uma categoria de serviço.');
      return;
    }
    setSaving(true);
    try {
      const extra = {};
      if (profileType === 'provider') {
        if (motherName.trim()) extra.mother_name = motherName.trim();
        if (birthDate.length === 10) extra.birth_date = parseDateToISO(birthDate);
      }
      const json = await authApi.updateProfileType(
        profileType,
        profileType === 'provider' ? selected : undefined,
        Object.keys(extra).length ? extra : undefined
      );
      if (json?.success) {
        patchUser(json.data?.user || { profile_type: profileType, service_categories: selected });
        toast.success('Perfil atualizado.');
        navigate('/app', { replace: true });
        return;
      }
      setError(json?.message || 'Não foi possível salvar.');
    } catch (err) {
      setError(apiError(err, 'Não foi possível salvar.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">Como você quer usar o Contrataê?</h1>
        <p className="page-sub">Você pode mudar isso depois, quando quiser.</p>
      </div>

      <form className="stack" onSubmit={handleSubmit}>
        {error && (
          <div className="f-alert f-alert-err">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="f-choices">
          <button
            type="button"
            className={`f-choice ${profileType === 'client' ? 'f-choice-on' : ''}`}
            onClick={() => setProfileType('client')}
            aria-pressed={profileType === 'client'}
          >
            <span className="f-choice-ico">
              <UserRound size={20} />
            </span>
            <span className="f-choice-txt">
              <strong>Quero contratar</strong>
              <span>Publique o que precisa e receba propostas de profissionais da sua região.</span>
            </span>
          </button>

          <button
            type="button"
            className={`f-choice ${profileType === 'provider' ? 'f-choice-on' : ''}`}
            onClick={() => setProfileType('provider')}
            aria-pressed={profileType === 'provider'}
          >
            <span className="f-choice-ico">
              <Hammer size={20} />
            </span>
            <span className="f-choice-txt">
              <strong>Quero trabalhar</strong>
              <span>Receba demandas do seu ramo e envie propostas para novos clientes.</span>
            </span>
          </button>
        </div>

        {profileType === 'provider' && (
          <div className="card stack">
            <div>
              <div className="card-title">Suas categorias de serviço</div>
              <p className="card-sub">Selecione tudo o que você faz. Você receberá demandas dessas categorias.</p>
            </div>

            <div className="chips">
              {categories.map((label) => (
                <button
                  key={label}
                  type="button"
                  className={`chip ${selected.includes(label) ? 'chip-on' : ''}`}
                  onClick={() => toggle(label)}
                  aria-pressed={selected.includes(label)}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="f-grid f-grid-2">
              <div className="f-field">
                <label htmlFor="pt-mother">
                  Nome da mãe <span className="f-optional">(opcional)</span>
                </label>
                <input
                  id="pt-mother"
                  className="f-input"
                  placeholder="Nome completo da mãe"
                  value={motherName}
                  onChange={(e) => setMotherName(e.target.value)}
                />
              </div>

              <div className="f-field">
                <label htmlFor="pt-birth">
                  Data de nascimento <span className="f-optional">(opcional)</span>
                </label>
                <input
                  id="pt-birth"
                  className="f-input"
                  inputMode="numeric"
                  placeholder="dd/mm/aaaa"
                  value={birthDate}
                  onChange={(e) => setBirthDate(formatDate(e.target.value))}
                />
              </div>
            </div>

            <p className="f-hint">
              Esses dados são usados apenas na verificação de antecedentes que aumenta a confiança do seu perfil.
            </p>
          </div>
        )}

        <button type="submit" className="f-submit" disabled={saving}>
          {saving ? 'Salvando...' : 'Continuar'}
        </button>
      </form>
    </>
  );
}
