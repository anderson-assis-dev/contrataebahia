import { io } from 'socket.io-client';
import http, { getToken } from './http';
import { API_URL } from '../utils/api';

export const getMapToken = async () => {
  const { data } = await http.get('/tracking/map-token');
  return data;
};

export const getDirections = async (originLat, originLng, destLat, destLng) => {
  const { data } = await http.get('/tracking/directions', {
    params: { origin_lat: originLat, origin_lng: originLng, dest_lat: destLat, dest_lng: destLng },
  });
  return data;
};

export const connectTracking = () =>
  io(`${API_URL}/tracking`, {
    auth: { token: getToken() },
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 5,
  });
