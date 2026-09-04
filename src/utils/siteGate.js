export const SITE_ACCESS_HASH = (process.env.REACT_APP_SITE_ACCESS_HASH || '').trim();
export const SITE_GATE_KEY = 'cb_site_gate';

export const isSiteUnlocked = () => {
  if (!SITE_ACCESS_HASH) return true;
  try {
    return sessionStorage.getItem(SITE_GATE_KEY) === SITE_ACCESS_HASH;
  } catch {
    return false;
  }
};

export const unlockSite = (value) => {
  const next = String(value || '').trim();
  if (!next || next.toUpperCase() !== SITE_ACCESS_HASH.toUpperCase()) return false;
  try {
    sessionStorage.setItem(SITE_GATE_KEY, SITE_ACCESS_HASH);
  } catch {}
  return true;
};
