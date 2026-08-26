import http from './http';

export const getSubscriptionStatus = async () => {
  const { data } = await http.get('/subscriptions/status');
  return data;
};

export const subscribe = async (paymentMethodId) => {
  const { data } = await http.post('/subscriptions/subscribe', { payment_method_id: paymentMethodId });
  return data;
};

export const cancelSubscription = async () => {
  const { data } = await http.post('/subscriptions/cancel');
  return data;
};
