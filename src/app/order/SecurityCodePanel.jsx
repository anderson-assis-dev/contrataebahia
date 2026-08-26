import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Eye, EyeOff, KeyRound, ShieldCheck } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { getSecurityCode, updateSecurityCode, verifySecurityCode } from '../../services/auth';
import { apiError } from '../../services/http';
import { onlyDigits } from '../../utils/format';
import '../forms.css';
import '../ui.css';
import './SecurityCodePanel.css';

export default function SecurityCodePanel({ orderId, isClient }) {
  const toast = useToast();
  const [code, setCode] = useState('');
  const [stored, setStored] = useState('');
  const [reveal, setReveal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [verified, setVerified] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isClient) return;
    getSecurityCode()
      .then((json) => setStored(json?.data?.security_code || ''))
      .catch(() => {});
  }, [isClient]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const json = await verifySecurityCode(Number(orderId), code);
      if (json?.success && json.data?.verified) {
        setVerified(json.data);
        toast.success('Chegada confirmada!');
        return;
      }
      setError(json?.message || 'Código incorreto.');
    } catch (err) {
      setError(apiError(err, 'Não foi possível validar o código.'));
    } finally {
      setBusy(false);
    }
  };

  const handleSaveCode = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const json = await updateSecurityCode(code);
      if (json?.success) {
        setStored(json.data?.security_code || code);
        setEditing(false);
        setCode('');
        toast.success('Código de segurança atualizado.');
        return;
      }
      setError(json?.message || 'Não foi possível salvar o código.');
    } catch (err) {
      setError(apiError(err, 'Não foi possível salvar o código.'));
    } finally {
      setBusy(false);
    }
  };

  if (isClient) {
    return (
      <div className="card stack">
        <div>
          <div className="card-title">
            <ShieldCheck size={17} style={{ verticalAlign: '-3px', marginRight: 6 }} />
            Confirmar chegada
          </div>
          <p className="card-sub">
            Quando o profissional chegar, peça o código dele e digite aqui. A validação só é liberada com o trajeto
            iniciado e ele a menos de 3 km do endereço.
          </p>
        </div>

        {verified ? (
          <div className="f-alert f-alert-ok">
            <CheckCircle2 size={16} />
            <span>
              Chegada de <strong>{verified.provider_name}</strong> confirmada.
            </span>
          </div>
        ) : (
          <form className="stack" onSubmit={handleVerify}>
            {error && (
              <div className="f-alert f-alert-err">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}
            <div className="f-field">
              <label htmlFor="sec-code">Código do profissional</label>
              <input
                id="sec-code"
                className="f-input"
                inputMode="numeric"
                placeholder="0000"
                value={code}
                onChange={(e) => setCode(onlyDigits(e.target.value).slice(0, 6))}
                required
              />
            </div>
            <button type="submit" className="f-submit" disabled={busy || code.length < 4}>
              {busy ? 'Validando...' : 'Confirmar chegada'}
            </button>
          </form>
        )}
      </div>
    );
  }

  return (
    <div className="card stack">
      <div>
        <div className="card-title">
          <KeyRound size={17} style={{ verticalAlign: '-3px', marginRight: 6 }} />
          Seu código de segurança
        </div>
        <p className="card-sub">
          Informe este código ao cliente quando chegar no local, para ele confirmar sua identidade. Se você não definir
          um, valem os 4 últimos dígitos do seu telefone.
        </p>
      </div>

      {error && (
        <div className="f-alert f-alert-err">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {!editing ? (
        <>
          <div className="sec-display">
            <strong>{stored ? (reveal ? stored : '••••') : 'Não definido'}</strong>
            {stored && (
              <button
                type="button"
                className="f-eye"
                style={{ position: 'static', transform: 'none' }}
                onClick={() => setReveal((v) => !v)}
                aria-label={reveal ? 'Ocultar código' : 'Mostrar código'}
              >
                {reveal ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            )}
          </div>
          <button type="button" className="f-ghost" onClick={() => setEditing(true)}>
            {stored ? 'Alterar código' : 'Definir código'}
          </button>
        </>
      ) : (
        <form className="stack" onSubmit={handleSaveCode}>
          <div className="f-field">
            <label htmlFor="sec-new">Novo código</label>
            <input
              id="sec-new"
              className="f-input"
              inputMode="numeric"
              placeholder="0000"
              value={code}
              onChange={(e) => setCode(onlyDigits(e.target.value).slice(0, 6))}
              required
            />
            <span className="f-hint">Use um número de 4 dígitos fácil de lembrar e difícil de adivinhar.</span>
          </div>
          <button type="submit" className="f-submit" disabled={busy || code.length < 4}>
            {busy ? 'Salvando...' : 'Salvar código'}
          </button>
          <button type="button" className="f-ghost" onClick={() => { setEditing(false); setCode(''); }}>
            Cancelar
          </button>
        </form>
      )}
    </div>
  );
}
