import http from './http';

export const getAdPackages = async () => {
  const { data } = await http.get('/ads/packages');
  return data;
};

export const purchaseAdPackage = async (packageId, paymentMethodId) => {
  const { data } = await http.post('/ads/purchase', {
    package_id: packageId,
    payment_method_id: paymentMethodId,
  });
  return data;
};

export const getAdCredits = async () => {
  const { data } = await http.get('/ads/credits');
  return data;
};

export const getMyAds = async () => {
  const { data } = await http.get('/ads/my-ads');
  return data;
};

export const scheduleAd = async (payload) => {
  const { data } = await http.post('/ads/schedule', payload);
  return data;
};

export const cancelAd = async (id) => {
  const { data } = await http.post(`/ads/${id}/cancel`);
  return data;
};
