import axios from 'axios';
import { API_URL } from '../utils/api';

export const API_BASE = `${API_URL}/api`;
export const TOKEN_KEY = 'cb_auth_token';
export const USER_KEY = 'cb_user';
export const UNAUTHORIZED_EVENT = 'cb:unauthorized';

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY) || '';
  } catch {
    return '';
  }
};

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const saveSession = (token, user) => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {}
};

export const saveUser = (user) => {
  try {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {}
};

export const clearSession = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {}
};

const http = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  timeout: 120000,
});

http.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearSession();
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    return Promise.reject(error);
  }
);

export const apiError = (error, fallback = 'Não foi possível concluir. Tente novamente.') => {
  const data = error?.response?.data;
  if (data?.errors) {
    const first = Object.values(data.errors).flat()[0];
    if (first) return String(first);
  }
  return data?.message || error?.message || fallback;
};

export const upload = async (path, formData, method = 'post') => {
  const res = await fetch(`${API_BASE}${path}`, {
    method: method.toUpperCase(),
    headers: { Authorization: `Bearer ${getToken()}` },
    body: formData,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message || 'Erro ao enviar arquivos');
  return json;
};

export default http;
