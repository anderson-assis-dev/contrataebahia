import http, { upload } from './http';

export const ORDER_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  STOPPED: 'stopped',
};

export const ORDER_STATUS_LABEL = {
  open: 'Em leilão',
  in_progress: 'Em andamento',
  completed: 'Concluído',
  cancelled: 'Cancelado',
  stopped: 'Pausado',
};

const ADDRESS_FIELDS = [
  'street',
  'number',
  'complement',
  'neighborhood',
  'city',
  'state',
  'zip_code',
  'latitude',
  'longitude',
];

const buildOrderForm = (payload) => {
  const form = new FormData();
  ['title', 'description', 'category', 'address'].forEach((key) => {
    if (payload[key] != null) form.append(key, payload[key]);
  });
  if (payload.budget != null) form.append('budget', String(payload.budget));
  if (payload.deadline != null) form.append('deadline', String(payload.deadline));
  if (payload.status) form.append('status', payload.status);
  ADDRESS_FIELDS.forEach((key) => {
    if (payload[key] != null && payload[key] !== '') form.append(key, String(payload[key]));
  });
  if (payload.removedAttachments?.length) {
    form.append('removedAttachments', JSON.stringify(payload.removedAttachments));
  }
  (payload.attachments || []).forEach((file) => form.append('attachments', file, file.name));
  return form;
};

export const listOrders = async (params) => {
  const { data } = await http.get('/orders', { params });
  return data;
};

export const listAvailableOrders = async (params) => {
  const { data } = await http.get('/orders/available', { params });
  return data;
};

export const listRecentOrders = async () => {
  const { data } = await http.get('/orders/recent');
  return data;
};

export const getOrderStats = async () => {
  const { data } = await http.get('/orders/stats');
  return data;
};

export const getMyProviders = async () => {
  const { data } = await http.get('/orders/my-providers');
  return data;
};

export const getOrder = async (id) => {
  const { data } = await http.get(`/orders/${id}`);
  return data;
};

export const createOrder = (payload) => upload('/orders', buildOrderForm(payload));

export const updateOrder = (id, payload) => upload(`/orders/${id}`, buildOrderForm(payload), 'put');

export const deleteOrder = async (id) => {
  const { data } = await http.delete(`/orders/${id}`);
  return data;
};

export const toggleStopOrder = async (id) => {
  const { data } = await http.post(`/orders/${id}/toggle-stop`);
  return data;
};

export const startAuction = async (id) => {
  const { data } = await http.post(`/orders/${id}/start-auction`);
  return data;
};

export const cancelOrder = async (id, reason) => {
  const { data } = await http.post(`/orders/${id}/cancel`, { reason });
  return data;
};

export const proposeSchedule = async (id, scheduledDate) => {
  const { data } = await http.post(`/orders/${id}/schedule`, { scheduled_date: scheduledDate });
  return data;
};

export const confirmSchedule = async (id) => {
  const { data } = await http.post(`/orders/${id}/confirm-schedule`);
  return data;
};

export const completeOrder = (id) => updateOrder(id, { status: ORDER_STATUS.COMPLETED });
