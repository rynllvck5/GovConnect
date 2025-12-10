import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { API_BASE, API_ORIGIN } from '../config';

export default function OfficeDetail() {
  const { slug } = useParams();
  const [office, setOffice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true); setError('');
      try {
        // Try by slug first
        let r = await fetch(`${API_BASE}/offices/slug/${encodeURIComponent(slug)}`);
        if (!r.ok) {
          // Fallback: if slug looks like an id
          if (/^\d+$/.test(slug)) {
            r = await fetch(`${API_BASE}/offices/${slug}`);
          }
        }
        if (!r.ok) throw new Error('Office not found');
        const data = await r.json();
        setOffice(data);
      } catch (e) {
        setError(e.message || 'Error');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="text-sm text-gray-600">Loading...</div>
      </div>
    );
  }
  if (error || !office) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="text-xl font-semibold mb-2">Office not found</div>
        <Link to="/government#offices" className="text-blue-700 hover:underline">Back to Offices</Link>
      </div>
    );
  }
  const mapSrc = office.lat != null && office.lng != null
    ? `https://www.google.com/maps?q=${office.lat},${office.lng}&z=16&output=embed`
    : `https://www.google.com/maps?q=${encodeURIComponent(office.map_query || office.mapQuery || office.location || '')}&output=embed`;
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/government#offices" className="text-blue-700 hover:underline text-sm">← Back to Offices</Link>
      <article className="mt-3 border rounded-md overflow-hidden bg-white">
        {office.image_url && <img src={`${API_ORIGIN}${office.image_url}`} alt="" className="w-full h-56 object-cover" />}
        <div className="p-4 space-y-2">
          <h1 className="text-2xl font-semibold">{office.name}</h1>
          <div className="text-sm text-gray-700 flex items-center gap-2">
            <img src={office.head_image_url ? `${API_ORIGIN}${office.head_image_url}` : `https://i.pravatar.cc/80?u=${encodeURIComponent(office.head || office.name)}`} alt="" className="w-8 h-8 rounded-full object-cover" />
            <span>Head: {office.head || '—'}</span>
          </div>
          <div className="text-sm text-gray-700">Location: {office.location || '—'}</div>
          <div className="text-sm text-gray-700">Contact: {office.contact || '—'}</div>
          {office.description && <p className="text-sm text-gray-700 mt-2">{office.description}</p>}
          <div className="mt-3" id="map">
            <div className="text-sm font-medium mb-1">Map</div>
            <div className="w-full h-64 border rounded-md overflow-hidden">
              <iframe title="map" src={mapSrc} width="100%" height="100%" style={{ border: 0 }} loading="lazy" allowFullScreen></iframe>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
