import http from './http';

export const getWallet = async () => {
  const { data } = await http.get('/wallet');
  return data;
};

export const createWallet = async () => {
  const { data } = await http.post('/wallet');
  return data;
};

export const createSetupIntent = async () => {
  const { data } = await http.post('/wallet/setup-intent');
  return data;
};

export const removeCard = async (paymentMethodId) => {
  const { data } = await http.delete(`/wallet/cards/${paymentMethodId}`);
  return data;
};

export const ensureWallet = async () => {
  try {
    return await getWallet();
  } catch (err) {
    if (err?.response?.status !== 404) throw err;
    await createWallet();
    return getWallet();
  }
};
