import { useEffect, useState } from 'react';

const diff = (target) => {
  if (!target) return null;
  const end = new Date(String(target).replace(' ', 'T')).getTime();
  if (Number.isNaN(end)) return null;
  return Math.max(0, end - Date.now());
};

export const formatRemaining = (ms) => {
  if (ms == null) return '';
  const total = Math.floor(ms / 1000);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}min`;
  if (minutes > 0) return `${minutes}min ${seconds}s`;
  return `${seconds}s`;
};

export default function useCountdown(target) {
  const [remaining, setRemaining] = useState(() => diff(target));

  useEffect(() => {
    setRemaining(diff(target));
    if (!target) return undefined;
    const id = setInterval(() => setRemaining(diff(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  return { remaining, label: formatRemaining(remaining), expired: remaining === 0 };
}
