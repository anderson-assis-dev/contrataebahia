import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, MapPin, Navigation, Radio, Square } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { connectTracking, getMapToken } from '../../services/tracking';
import TrackingMap from './TrackingMap';
import '../forms.css';
import '../ui.css';
import './TrackingPanel.css';

const formatDistance = (meters) => {
  if (meters == null) return null;
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;
};

const formatDuration = (seconds) => {
  if (seconds == null) return null;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}min`;
};

export default function TrackingPanel({ order, isClient }) {
  const toast = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;
  const socketRef = useRef(null);
  const watchRef = useRef(null);
  const pendingStartRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [live, setLive] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [starting, setStarting] = useState(false);
  const [providerPos, setProviderPos] = useState(null);
  const [route, setRoute] = useState({ polyline: null, distance: null, duration: null });
  const [token, setToken] = useState('');
  const [notice, setNotice] = useState('');

  const destination =
    order.latitude != null && order.longitude != null
      ? { lat: Number(order.latitude), lng: Number(order.longitude) }
      : null;

  const applyPayload = useCallback((payload) => {
    if (payload?.provider_lat == null || payload?.provider_lng == null) return;
    setProviderPos({ lat: Number(payload.provider_lat), lng: Number(payload.provider_lng) });
    setRoute({
      polyline: payload.polyline || null,
      distance: payload.distance ?? null,
      duration: payload.duration ?? null,
    });
    setLive(true);
    setStarting(false);
  }, []);

  const stopWatch = useCallback(() => {
    if (watchRef.current != null) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }
  }, []);

  useEffect(() => {
    getMapToken()
      .then((json) => setToken(json?.data?.token || ''))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const socket = connectTracking();
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join-order', Number(order.id));
    });
    socket.on('disconnect', () => setConnected(false));
    socket.on('joined', () => {
      const pending = pendingStartRef.current;
      if (pending) {
        socket.emit('start-tracking', pending);
      }
    });
    socket.on('tracking-active', (payload) => {
      applyPayload(payload);
      if (!isClient) setSharing(true);
    });
    socket.on('tracking-started', (payload) => {
      const startedByUs = Boolean(pendingStartRef.current);
      pendingStartRef.current = null;
      applyPayload(payload);
      if (!isClient) setSharing(true);
      if (startedByUs) toastRef.current.success('Trajeto iniciado. O cliente já acompanha sua chegada.');
    });
    socket.on('location-update', applyPayload);
    socket.on('tracking-stopped', () => {
      setLive(false);
      setSharing(false);
      setStarting(false);
      pendingStartRef.current = null;
    });
    socket.on('tracking-error', (payload) => {
      pendingStartRef.current = null;
      setStarting(false);
      setSharing(false);
      setLive(false);
      stopWatch();
      setNotice(
        payload?.reason === 'order_inactive'
          ? 'Este pedido não está mais ativo, o rastreio foi encerrado.'
          : 'Não foi possível iniciar o rastreio.'
      );
    });

    return () => {
      stopWatch();
      pendingStartRef.current = null;
      socket.disconnect();
      socketRef.current = null;
    };
  }, [order.id, applyPayload, isClient, stopWatch]);

  const startSharing = () => {
    if (!navigator.geolocation) {
      toast.error('Seu navegador não permite compartilhar localização.');
      return;
    }
    setNotice('');
    setStarting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        pendingStartRef.current = coords;
        const socket = socketRef.current;
        if (socket?.connected) {
          socket.emit('join-order', Number(order.id));
        }
        watchRef.current = navigator.geolocation.watchPosition(
          (next) =>
            socketRef.current?.emit('location-update', {
              latitude: next.coords.latitude,
              longitude: next.coords.longitude,
            }),
          () => {},
          { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 }
        );
      },
      () => {
        setStarting(false);
        toast.error('Precisamos da sua localização para iniciar o trajeto. Autorize no navegador.');
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const stopSharing = () => {
    stopWatch();
    pendingStartRef.current = null;
    socketRef.current?.emit('stop-tracking');
    setSharing(false);
    setLive(false);
    setStarting(false);
    toast.info('Trajeto encerrado.');
  };

  if (!destination) {
    return (
      <div className="f-alert f-alert-info">
        <MapPin size={16} />
        <span>Este pedido não tem coordenadas do endereço, então o rastreio no mapa não está disponível.</span>
      </div>
    );
  }

  return (
    <div className="stack">
      {notice && (
        <div className="f-alert f-alert-err">
          <AlertCircle size={16} />
          <span>{notice}</span>
        </div>
      )}

      <div className={`track-status ${live ? 'track-live' : ''}`}>
        <span className="track-dot" />
        <div>
          <strong>{live ? 'Prestador a caminho' : isClient ? 'Aguardando o prestador iniciar' : 'Trajeto não iniciado'}</strong>
          <span>
            {live && (formatDistance(route.distance) || formatDuration(route.duration))
              ? [formatDistance(route.distance), formatDuration(route.duration)].filter(Boolean).join(' — ')
              : connected
                ? 'Conectado em tempo real'
                : 'Conectando...'}
          </span>
        </div>
      </div>

      {live && providerPos && (
        <TrackingMap
          token={token}
          provider={providerPos}
          destination={destination}
          polyline={route.polyline}
          providerName={order.provider?.name}
          clientName={order.client?.name}
        />
      )}

      {!isClient && (
        <>
          {!sharing ? (
            <button type="button" className="f-submit" onClick={startSharing} disabled={starting || !connected}>
              <Navigation size={17} />
              {starting ? 'Iniciando...' : 'Iniciar trajeto'}
            </button>
          ) : (
            <button type="button" className="f-ghost od-danger" onClick={stopSharing}>
              <Square size={16} />
              Encerrar trajeto
            </button>
          )}
          <p className="f-hint">
            Ao iniciar, o cliente acompanha sua posição no mapa até a chegada. Mantenha esta aba aberta durante o
            deslocamento.
          </p>
        </>
      )}

      {isClient && !live && (
        <p className="f-hint">
          <Radio size={12} /> Assim que o profissional iniciar o deslocamento, o mapa aparece aqui automaticamente.
        </p>
      )}
    </div>
  );
}
