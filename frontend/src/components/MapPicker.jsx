import React, { useEffect, useMemo, useRef, useState } from 'react';

export default function MapPicker({ lat, lng, onChange, className }) {
  const [loaded, setLoaded] = useState(!!window.L);
  const containerId = useMemo(() => 'map_' + Math.random().toString(36).slice(2), []);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    // Inject Leaflet CSS/JS if not loaded
    if (!window.L) {
      const cssId = 'leaflet-css';
      if (!document.getElementById(cssId)) {
        const link = document.createElement('link');
        link.id = cssId;
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }
      const jsId = 'leaflet-js';
      if (!document.getElementById(jsId)) {
        const script = document.createElement('script');
        script.id = jsId;
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.async = true;
        script.onload = () => setLoaded(true);
        document.body.appendChild(script);
      } else {
        // If script tag exists but L not yet ready, wait a tick
        const interval = setInterval(() => {
          if (window.L) { setLoaded(true); clearInterval(interval); }
        }, 50);
        return () => clearInterval(interval);
      }
    } else {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded || mapRef.current) return;
    const L = window.L;
    const initial = [lat ?? 14.5995, lng ?? 120.9842]; // Default: Manila
    const map = L.map(containerId).setView(initial, lat && lng ? 16 : 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);
    map.on('click', (e) => {
      const { lat: la, lng: ln } = e.latlng;
      setMarker(L, map, la, ln);
      onChange?.({ lat: la, lng: ln });
    });
    mapRef.current = map;

    if (lat && lng) setMarker(L, map, lat, lng);

    return () => { map.remove(); mapRef.current = null; markerRef.current = null; };
  }, [loaded, containerId]);

  useEffect(() => {
    if (!loaded || !mapRef.current) return;
    const L = window.L;
    if (lat != null && lng != null) {
      setMarker(L, mapRef.current, lat, lng, false);
      mapRef.current.setView([lat, lng], 16);
    }
  }, [lat, lng, loaded]);

  function setMarker(L, map, la, ln, pan = false) {
    if (markerRef.current) {
      markerRef.current.setLatLng([la, ln]);
    } else {
      markerRef.current = L.marker([la, ln], { draggable: true }).addTo(map);
      markerRef.current.on('dragend', () => {
        const p = markerRef.current.getLatLng();
        onChange?.({ lat: p.lat, lng: p.lng });
      });
    }
    if (pan) map.panTo([la, ln]);
  }

  async function useMyLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const la = pos.coords.latitude;
      const ln = pos.coords.longitude;
      if (window.L && mapRef.current) {
        setMarker(window.L, mapRef.current, la, ln, true);
      }
      onChange?.({ lat: la, lng: ln });
    });
  }

  return (
    <div className={className}>
      <div id={containerId} className="w-full h-64 rounded-md border overflow-hidden" />
      <div className="flex items-center justify-between mt-2">
        <div className="text-xs text-gray-600">{lat != null && lng != null ? `Pinned: ${lat.toFixed(5)}, ${lng.toFixed(5)}` : 'Click on map to pin location'}</div>
        <button type="button" className="text-xs px-2 py-1 border rounded-md bg-white hover:bg-gray-50" onClick={useMyLocation}>Use my location</button>
      </div>
    </div>
  );
}
