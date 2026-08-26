import http from './http';

export const getMessages = async (orderId, page = 1) => {
  const { data } = await http.get(`/chat/${orderId}/messages`, { params: { page } });
  return data;
};

export const sendMessage = async (orderId, content) => {
  const { data } = await http.post(`/chat/${orderId}/messages`, { content });
  return data;
};

export const getUnreadCount = async (orderId) => {
  const { data } = await http.get(`/chat/${orderId}/messages/unread`);
  return data;
};
