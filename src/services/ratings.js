import http, { upload } from './http';

export const rateProvider = (providerId, { rating, comment, order_id: orderId, attachments }) => {
  const form = new FormData();
  form.append('rating', String(rating));
  if (comment) form.append('comment', comment);
  if (orderId) form.append('order_id', String(orderId));
  (attachments || []).forEach((file) => form.append('attachments', file));
  return upload(`/providers/${providerId}/ratings`, form);
};

export const listProviderRatings = async (providerId, params) => {
  const { data } = await http.get(`/providers/${providerId}/ratings`, { params });
  return data;
};

export const listClientRatings = async (clientId, params) => {
  const { data } = await http.get(`/clients/${clientId}/ratings`, { params });
  return data;
};

export const rateClient = (clientId, { rating, comment, order_id: orderId }) => {
  const payload = { rating };
  if (comment) payload.comment = comment;
  if (orderId) payload.order_id = orderId;
  return http.post(`/clients/${clientId}/ratings`, payload).then((r) => r.data);
};
