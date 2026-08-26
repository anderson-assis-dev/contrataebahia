import React from 'react';
import { Check } from 'lucide-react';
import './OrderTimeline.css';

const buildSteps = (order) => {
  const scheduleConfirmed =
    Number(order.schedule_confirmed_by_client) === 1 && Number(order.schedule_confirmed_by_provider) === 1;
  return [
    { label: 'Pedido criado', done: true },
    { label: 'Proposta aceita', done: Boolean(order.provider_id) },
    { label: 'Agendamento confirmado', done: scheduleConfirmed },
    { label: 'Chegada confirmada', done: order.status === 'completed' || Boolean(order.arrival_confirmed_at) },
    { label: 'Serviço concluído', done: order.status === 'completed' },
  ];
};

export default function OrderTimeline({ order }) {
  const steps = buildSteps(order);
  const current = steps.findIndex((step) => !step.done);
  const activeIndex = current === -1 ? steps.length - 1 : current;

  return (
    <ol className="timeline">
      {steps.map((step, index) => (
        <li
          key={step.label}
          className={`timeline-step ${step.done ? 'timeline-done' : ''} ${index === activeIndex ? 'timeline-now' : ''}`}
        >
          <span className="timeline-dot">{step.done ? <Check size={12} /> : index + 1}</span>
          <span className="timeline-label">{step.label}</span>
        </li>
      ))}
    </ol>
  );
}
