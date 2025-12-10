import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { API_BASE, API_ORIGIN } from '../config';

export default function BarangayDetail() {
  const { id } = useParams();
  const [barangay, setBarangay] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true); setError('');
      try {
        // If the param looks numeric, fetch directly
        if (/^\d+$/.test(String(id))) {
          const r = await fetch(`${API_BASE}/barangays/${id}`);
          if (!r.ok) throw new Error('Not found');
          const data = await r.json();
          setBarangay(data);
        } else {
          // Fallback: param might be a legacy slug; try to resolve by name
          const listRes = await fetch(`${API_BASE}/barangays`);
          if (!listRes.ok) throw new Error('Not found');
          const list = await listRes.json();
          const slug = slugify(String(id));
          const match = (Array.isArray(list) ? list : []).find((b) => slugify(b.name) === slug);
          if (!match) throw new Error('Not found');
          const r = await fetch(`${API_BASE}/barangays/${match.id}`);
          if (!r.ok) throw new Error('Not found');
          const data = await r.json();
          setBarangay(data);
        }
      } catch (e) {
        setError('Barangay not found');
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id]);

  function slugify(name) {
    return String(name || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="text-sm text-gray-600">Loading...</div>
      </div>
    );
  }
  if (error || !barangay) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="text-xl font-semibold mb-2">Barangay not found</div>
        <Link to="/government#barangays" className="text-blue-700 hover:underline">Back to Barangays</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Link to="/government#barangays" className="text-blue-700 hover:underline text-sm">← Back to Barangays</Link>
      <article className="border rounded-md overflow-hidden bg-white">
        {barangay.image_url && <img src={`${API_ORIGIN}${barangay.image_url}`} alt="" className="w-full h-56 object-cover" />}
        <div className="p-4 space-y-2">
          <h1 className="text-2xl font-semibold">{barangay.name}</h1>
          {barangay.description && <p className="text-sm text-gray-700">{barangay.description}</p>}
        </div>
      </article>

      {Array.isArray(barangay.officials) && barangay.officials.length > 0 && (
        <section>
          <h2 className="font-semibold mb-2">Officials</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {barangay.officials.map((o) => (
              <div key={o.id} className="border rounded-md p-3 text-sm bg-white flex items-center gap-3">
                <img src={o.image_url ? `${API_ORIGIN}${o.image_url}` : `https://i.pravatar.cc/96?u=${encodeURIComponent(o.name || o.position || 'official')}`} alt="" className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <div className="font-medium">{o.name || '—'}</div>
                  <div className="text-gray-600">{o.position || '—'}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
