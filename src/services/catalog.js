import http from './http';
import { onlyDigits } from '../utils/format';

export const listCategories = async (limit) => {
  const { data } = await http.get('/providers/categories', { params: limit ? { limit } : undefined });
  return data;
};

export const searchProviders = async ({ category, city, limit } = {}) => {
  const { data } = await http.get('/providers/search', {
    params: { q: category || undefined, city: city || undefined, limit: limit || 24 },
  });
  return data;
};

export const getPublicProvider = async (uuid) => {
  const { data } = await http.get(`/providers/${uuid}/public`);
  return data;
};

export const requestQuote = async (providerId) => {
  const { data } = await http.post(`/providers/${providerId}/request-quote`);
  return data;
};

export const recordProfileView = (providerId) => http.post(`/providers/${providerId}/view`).catch(() => null);

export const lookupCep = async (cep) => {
  const { data } = await http.get(`/geocoding/cep/${onlyDigits(cep)}`);
  return data;
};

export const reverseGeocode = async (lat, lng) => {
  const { data } = await http.get('/geocoding/reverse', { params: { lat, lng } });
  return data;
};

export const forwardGeocode = async (address) => {
  const { data } = await http.get('/geocoding/forward', { params: { address } });
  return data;
};

export const searchAddress = async (q, lat, lng) => {
  const { data } = await http.get('/geocoding/search', { params: { q, lat, lng } });
  return data;
};

export const listMyServices = async () => {
  const { data } = await http.get('/services/my-services');
  return data;
};

export const createService = async (payload) => {
  const { data } = await http.post('/services', payload);
  return data;
};

export const updateService = async (id, payload) => {
  const { data } = await http.put(`/services/${id}`, payload);
  return data;
};

export const deleteService = async (id) => {
  const { data } = await http.delete(`/services/${id}`);
  return data;
};
