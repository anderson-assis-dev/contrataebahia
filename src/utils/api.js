export const API_URL = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');

export const API_ENABLED = Boolean(API_URL);

export const REF_STORAGE_KEY = 'contrataebahia_ref';

export async function apiGet(path) {
  if (!API_ENABLED) return null;
  const res = await fetch(`${API_URL}${path}`);
  const json = await res.json();
  return json?.success ? json.data : null;
}

export async function apiPost(path, body) {
  if (!API_ENABLED) {
    return { success: false, message: 'Cadastro indisponível no momento. Fale com a gente pelo WhatsApp.' };
  }
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}
