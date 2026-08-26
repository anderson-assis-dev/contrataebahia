import React, { useState } from 'react';
import { CalendarCheck, CalendarClock, CheckCircle2, Hourglass } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { confirmSchedule, proposeSchedule } from '../../services/orders';
import { apiError } from '../../services/http';
import { formatDateTimeBR } from '../../utils/format';
import '../forms.css';
import '../ui.css';
import './SchedulePanel.css';

const localNow = () => {
  const now = new Date(Date.now() + 60000 - new Date().getTimezoneOffset() * 60000);
  return now.toISOString().slice(0, 16);
};

export default function SchedulePanel({ order, isClient, onChanged }) {
  const toast = useToast();
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [proposing, setProposing] = useState(false);

  const mineConfirmed =
    Number(isClient ? order.schedule_confirmed_by_client : order.schedule_confirmed_by_provider) === 1;
  const theirsConfirmed =
    Number(isClient ? order.schedule_confirmed_by_provider : order.schedule_confirmed_by_client) === 1;
  const bothConfirmed = mineConfirmed && theirsConfirmed;
  const counterpartLabel = isClient ? 'o prestador' : 'o cliente';

  const handlePropose = async (e) => {
    e.preventDefault();
    if (!value) return;
    setBusy(true);
    try {
      const json = await proposeSchedule(order.id, value);
      if (json?.success) {
        toast.success('Horário proposto. Agora falta a confirmação da outra parte.');
        setProposing(false);
        setValue('');
        await onChanged();
        return;
      }
      toast.error(json?.message || 'Não foi possível propor o horário.');
    } catch (err) {
      toast.error(apiError(err, 'Não foi possível propor o horário.'));
    } finally {
      setBusy(false);
    }
  };

  const handleConfirm = async () => {
    setBusy(true);
    try {
      const json = await confirmSchedule(order.id);
      if (json?.success) {
        toast.success('Agendamento confirmado.');
        await onChanged();
        return;
      }
      toast.error(json?.message || 'Não foi possível confirmar.');
    } catch (err) {
      toast.error(apiError(err, 'Não foi possível confirmar.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="stack">
      {order.scheduled_date ? (
        <div className={`sched-card ${bothConfirmed ? 'sched-ok' : ''}`}>
          <span className="sched-ico">{bothConfirmed ? <CalendarCheck size={22} /> : <CalendarClock size={22} />}</span>
          <div className="sched-body">
            <div className="sched-when">{formatDateTimeBR(order.scheduled_date)}</div>
            <p className="sched-status">
              {bothConfirmed
                ? 'Confirmado pelas duas partes.'
                : mineConfirmed
                  ? `Você confirmou. Aguardando ${counterpartLabel}.`
                  : `${isClient ? 'O prestador' : 'O cliente'} propôs este horário. Confirme se funciona pra você.`}
            </p>

            <div className="sched-flags">
              <span className={Number(order.schedule_confirmed_by_client) === 1 ? 'sched-flag-on' : ''}>
                {Number(order.schedule_confirmed_by_client) === 1 ? <CheckCircle2 size={13} /> : <Hourglass size={13} />}
                Cliente
              </span>
              <span className={Number(order.schedule_confirmed_by_provider) === 1 ? 'sched-flag-on' : ''}>
                {Number(order.schedule_confirmed_by_provider) === 1 ? (
                  <CheckCircle2 size={13} />
                ) : (
                  <Hourglass size={13} />
                )}
                Prestador
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="f-alert f-alert-info">
          <CalendarClock size={16} />
          <span>
            Nenhum horário definido ainda. Proponha uma data e horário — {counterpartLabel} precisa confirmar.
          </span>
        </div>
      )}

      {!bothConfirmed && !mineConfirmed && order.scheduled_date && (
        <button type="button" className="f-submit" onClick={handleConfirm} disabled={busy}>
          <CheckCircle2 size={17} />
          {busy ? 'Confirmando...' : 'Confirmar este horário'}
        </button>
      )}

      {!proposing ? (
        <button type="button" className="f-ghost" onClick={() => setProposing(true)} disabled={busy}>
          <CalendarClock size={16} />
          {order.scheduled_date ? 'Propor outro horário' : 'Propor horário'}
        </button>
      ) : (
        <form className="card stack" onSubmit={handlePropose}>
          <div className="f-field">
            <label htmlFor="sched-when">Data e horário</label>
            <input
              id="sched-when"
              className="f-input"
              type="datetime-local"
              min={localNow()}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              required
            />
            <span className="f-hint">
              Ao propor um novo horário, a confirmação da outra parte é reiniciada.
            </span>
          </div>
          <button type="submit" className="f-submit" disabled={busy || !value}>
            {busy ? 'Enviando...' : 'Propor horário'}
          </button>
          <button type="button" className="f-ghost" onClick={() => setProposing(false)}>
            Cancelar
          </button>
        </form>
      )}
    </div>
  );
}
