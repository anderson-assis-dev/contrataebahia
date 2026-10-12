import React, { useEffect, useRef, useState } from 'react';
import { MapPinOff } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './TrackingMap.css';

const initialOf = (name) => (name || '?').trim().charAt(0).toUpperCase();

const toCoords = (points) =>
  (points || [])
    .map((p) => {
      const lat = p.latitude ?? p.lat;
      const lng = p.longitude ?? p.lng;
      return lat != null && lng != null ? [Number(lat), Number(lng)] : null;
    })
    .filter(Boolean);

// O marcador é desenhado aqui em vez de usar o ícone padrão do Leaflet, que vem
// de um PNG com caminho relativo e some depois do build.
const pin = (color, letter) =>
  L.divIcon({
    className: 'tmap-pin-wrap',
    html: `<span class="tmap-pin" style="--pin:${color}"><span>${letter}</span></span>`,
    iconSize: [30, 40],
    iconAnchor: [15, 38],
    popupAnchor: [0, -34],
  });

export default function TrackingMap({ provider, destination, polyline, providerName, clientName }) {
  const holder = useRef(null);
  const mapRef = useRef(null);
  const providerMarker = useRef(null);
  const routeRef = useRef(null);
  const [failed, setFailed] = useState('');

  useEffect(() => {
    if (!provider || !destination || !holder.current || mapRef.current) return;

    try {
      const providerCoord = [Number(provider.lat), Number(provider.lng)];
      const destCoord = [Number(destination.lat), Number(destination.lng)];

      const map = L.map(holder.current, {
        center: providerCoord,
        zoom: 15,
        zoomControl: true,
        attributionControl: true,
      });
      mapRef.current = map;

      // A atribuição ao OpenStreetMap é exigida pela licença dos dados.
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      providerMarker.current = L.marker(providerCoord, {
        icon: pin('#123FAE', initialOf(providerName)),
        title: providerName || 'Profissional',
      }).addTo(map);

      L.marker(destCoord, {
        icon: pin('#E31E24', initialOf(clientName)),
        title: clientName || 'Local do serviço',
      }).addTo(map);

      map.fitBounds(L.latLngBounds([providerCoord, destCoord]), { padding: [50, 50] });
    } catch {
      setFailed('Não foi possível carregar o mapa.');
    }
  }, [provider, destination, providerName, clientName]);

  useEffect(() => {
    if (!mapRef.current || !providerMarker.current || !provider) return;
    providerMarker.current.setLatLng([Number(provider.lat), Number(provider.lng)]);
  }, [provider]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (routeRef.current) {
      map.removeLayer(routeRef.current);
      routeRef.current = null;
    }

    const coords = toCoords(polyline);
    if (coords.length < 2) return;

    routeRef.current = L.polyline(coords, {
      color: '#123FAE',
      weight: 5,
      opacity: 0.85,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);
  }, [polyline]);

  // O contêiner começa com altura zero enquanto a aba de rastreio ainda não
  // apareceu, e o Leaflet calcula o tamanho uma vez só: sem isso o mapa fica
  // com ladrilhos cinza até alguém arrastar.
  useEffect(() => {
    if (!holder.current || typeof ResizeObserver === 'undefined') return undefined;

    // Observa o contêiner e não o mapa: o observador é montado antes de o mapa
    // existir, e o optional chaining cobre esse intervalo.
    const observer = new ResizeObserver(() => mapRef.current?.invalidateSize());
    observer.observe(holder.current);
    return () => observer.disconnect();
  }, []);

  useEffect(
    () => () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    },
    []
  );

  if (failed) {
    return (
      <div className="tmap-fallback">
        <MapPinOff size={22} />
        <span>{failed}</span>
      </div>
    );
  }

  return <div ref={holder} className="tmap" />;
}
