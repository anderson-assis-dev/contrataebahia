import http from './http';

export const register = async (payload) => {
  const { data } = await http.post('/auth/register', payload);
  return data;
};

export const login = async (email, password) => {
  const { data } = await http.post('/auth/login', { email, password });
  return data;
};

export const logout = async () => {
  const { data } = await http.post('/auth/logout');
  return data;
};

export const me = async () => {
  const { data } = await http.get('/auth/me');
  return data;
};

export const updateProfile = async (payload) => {
  const { data } = await http.put('/auth/profile', payload);
  return data;
};

export const updateProfileType = async (profileType, serviceCategories, extra) => {
  const payload = { profile_type: profileType };
  if (serviceCategories) payload.service_categories = serviceCategories;
  if (extra) Object.assign(payload, extra);
  const { data } = await http.put('/auth/profile-type', payload);
  return data;
};

export const updateAvatar = async (avatarBase64) => {
  const { data } = await http.put('/auth/avatar', { avatar_base64: avatarBase64 });
  return data;
};

export const resendActivation = async (email) => {
  const { data } = await http.post('/auth/resend-activation', { email });
  return data;
};

export const verifyActivation = async (email, token) => {
  const { data } = await http.post('/auth/verify-activation', { email, token });
  return data;
};

export const requestOtp = async () => {
  const { data } = await http.post('/auth/request-otp');
  return data;
};

export const changePasswordWithOtp = async (otp, newPassword) => {
  const { data } = await http.post('/auth/change-password', { otp, new_password: newPassword });
  return data;
};

export const getSecurityCode = async () => {
  const { data } = await http.get('/auth/security-code');
  return data;
};

export const updateSecurityCode = async (securityCode) => {
  const { data } = await http.put('/auth/security-code', { security_code: securityCode });
  return data;
};

export const verifySecurityCode = async (orderId, code) => {
  const { data } = await http.post('/auth/verify-security-code', { order_id: orderId, code });
  return data;
};

export const updateNotificationPreferences = async (emailNotifications) => {
  const { data } = await http.put('/notification-preferences', { email_notifications: emailNotifications });
  return data;
};

export const deleteAccount = async () => {
  const { data } = await http.delete('/auth/account');
  return data;
};
