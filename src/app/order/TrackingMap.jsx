import React, { useEffect, useRef, useState } from 'react';
import { MapPinOff } from 'lucide-react';
import loadMapKit from './mapkitLoader';
import './TrackingMap.css';

const initialOf = (name) => (name || '?').trim().charAt(0).toUpperCase();

const toCoords = (mapkit, points) =>
  (points || [])
    .map((p) => {
      const lat = p.latitude ?? p.lat;
      const lng = p.longitude ?? p.lng;
      return lat != null && lng != null ? new mapkit.Coordinate(Number(lat), Number(lng)) : null;
    })
    .filter(Boolean);

export default function TrackingMap({ token, provider, destination, polyline, providerName, clientName }) {
  const holder = useRef(null);
  const mapRef = useRef(null);
  const kitRef = useRef(null);
  const providerAnn = useRef(null);
  const routeRef = useRef(null);
  const [failed, setFailed] = useState('');

  useEffect(() => {
    let cancelled = false;
    if (!token || !provider || !destination) return undefined;

    loadMapKit(token)
      .then((mapkit) => {
        if (cancelled || !holder.current || mapRef.current) return;
        kitRef.current = mapkit;
        const providerCoord = new mapkit.Coordinate(Number(provider.lat), Number(provider.lng));
        const destCoord = new mapkit.Coordinate(Number(destination.lat), Number(destination.lng));

        const map = new mapkit.Map(holder.current, {
          showsCompass: mapkit.FeatureVisibility.Adaptive,
          showsScale: mapkit.FeatureVisibility.Adaptive,
          showsUserLocation: false,
          colorScheme: mapkit.Map.ColorSchemes.Light,
          center: providerCoord,
        });
        mapRef.current = map;

        providerAnn.current = new mapkit.MarkerAnnotation(providerCoord, {
          color: '#123FAE',
          title: providerName || 'Profissional',
          glyphText: initialOf(providerName),
        });
        const destAnn = new mapkit.MarkerAnnotation(destCoord, {
          color: '#E31E24',
          title: clientName || 'Local do serviço',
          glyphText: initialOf(clientName),
        });
        map.addAnnotations([providerAnn.current, destAnn]);

        try {
          map.showItems([providerAnn.current, destAnn], { animate: false, padding: new mapkit.Padding(60, 60, 60, 60) });
        } catch {
          map.setCameraDistanceAnimated(4000, false);
        }
      })
      .catch(() => {
        if (!cancelled) setFailed('Não foi possível carregar o mapa.');
      });

    return () => {
      cancelled = true;
    };
  }, [token, provider, destination, providerName, clientName]);

  useEffect(() => {
    const mapkit = kitRef.current;
    if (!mapkit || !mapRef.current || !providerAnn.current || !provider) return;
    providerAnn.current.coordinate = new mapkit.Coordinate(Number(provider.lat), Number(provider.lng));
  }, [provider]);

  useEffect(() => {
    const mapkit = kitRef.current;
    const map = mapRef.current;
    if (!mapkit || !map) return;
    const coords = toCoords(mapkit, polyline);
    if (routeRef.current) {
      map.removeOverlay(routeRef.current);
      routeRef.current = null;
    }
    if (coords.length < 2) return;
    const style = new mapkit.Style({
      lineWidth: 5,
      strokeColor: '#123FAE',
      strokeOpacity: 0.85,
      lineCap: 'round',
      lineJoin: 'round',
    });
    routeRef.current = new mapkit.PolylineOverlay(coords, { style });
    map.addOverlay(routeRef.current);
  }, [polyline]);

  useEffect(
    () => () => {
      if (mapRef.current) {
        try {
          mapRef.current.destroy();
        } catch {}
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
