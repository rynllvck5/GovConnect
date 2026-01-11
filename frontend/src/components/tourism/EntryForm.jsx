import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE, API_ORIGIN } from '../../config';

export default function EntryForm({ category, entry, onClose, onSaved }) {
  const isEdit = !!entry;
  const { token, user } = useAuth();
  const isAdmin = !!user && (user.role === 'admin' || user.role === 'superadmin');
  const [values, setValues] = useState(() => ({ name: '', description: '', ...(entry?.content_json || {}) }));
  const [imageFile, setImageFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState({ kind: null, text: '' });
  const [barangays, setBarangays] = useState([]);
  const [barangayId, setBarangayId] = useState(entry?.barangay_id || '');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/barangays`);
        if (!r.ok) return;
        const list = await r.json();
        if (!alive) return;
        setBarangays(Array.isArray(list) ? list : []);
      } catch {}
    })();
    return () => { alive = false; };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData();
      if (isAdmin) fd.append('barangayId', String(barangayId || ''));
      if (imageFile) {
        fd.append('image', imageFile);
      }
      fd.append('content', JSON.stringify({ name: values.name || '', description: values.description || '', image: values.image || null }));
      const url = isEdit ? `${API_BASE}/tourism/entries/${entry.id}` : `${API_BASE}/tourism/categories/${category.id}/entries`;
      const method = isEdit ? 'PUT' : 'POST';
      const r = await fetch(url, { method, headers: { Authorization: `Bearer ${token}` }, body: fd });
      if (!r.ok) {
        const e = await r.json().catch(()=>({}));
        throw new Error(e.error || 'Failed to save entry');
      }
      setStatus({ kind: 'success', text: 'Saved successfully.' });
      setTimeout(() => { setStatus({ kind: null, text: '' }); onSaved?.(); onClose?.(); }, 2000);
    } catch (err) {
      setStatus({ kind: 'error', text: err.message || 'An error occurred.' });
      setTimeout(() => setStatus({ kind: null, text: '' }), 2000);
    } finally {
      setSubmitting(false);
    }
  }

  function removeExistingImage() {
    setValues(prev => ({ ...prev, image: null }));
    setImageFile(null);
  }
  function FilePicker({ id, accept, onChange }) {
    return (
      <div className="flex items-center gap-3">
        <input id={id} type="file" accept={accept} onChange={(e)=>onChange(e.target.files?.[0] || null)} className="sr-only" />
        <label htmlFor={id} className="inline-flex items-center px-3 py-2 rounded-md border bg-white text-sm hover:bg-gray-50 cursor-pointer">Choose file</label>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-1 sm:p-2">
      <div>
        <label className="block text-sm text-gray-700">Name</label>
        <input value={values.name || ''} onChange={(e)=>setValues(prev=>({...prev, name: e.target.value}))} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
      </div>
      {isAdmin && (
        <div>
          <label className="block text-sm text-gray-700">Location (Barangay)</label>
          <select value={barangayId || ''} onChange={(e)=>setBarangayId(e.target.value ? Number(e.target.value) : '')} className="w-full border rounded-md px-3 py-2 text-sm" required>
            <option value="">— Select barangay —</option>
            {barangays.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      )}
      <div>
        <label className="block text-sm text-gray-700">Image</label>
        <div className="space-y-2">
          {isEdit && values.image && (
            <div className="flex items-center justify-between border rounded-md p-2">
              <a href={`${String(values.image).match(/^https?:|^data:/) ? String(values.image) : API_ORIGIN + String(values.image)}`} target="_blank" rel="noreferrer" className="flex items-center gap-2">
                <img alt="" src={`${String(values.image).match(/^https?:|^data:/) ? String(values.image) : API_ORIGIN + String(values.image)}`} className="w-24 h-16 object-cover rounded" />
              </a>
              <button type="button" onClick={removeExistingImage} className="text-xs px-2 py-1 rounded-md border bg-white text-red-700">Remove</button>
            </div>
          )}
          <div className="flex items-center gap-3">
            <FilePicker id="file-image" accept={'image/*'} onChange={(file)=>setImageFile(file)} />
            {imageFile && <div className="text-xs text-gray-600 truncate">{imageFile?.name}</div>}
          </div>
        </div>
      </div>
      <div>
        <label className="block text-sm text-gray-700">Description</label>
        <textarea value={values.description || ''} onChange={(e)=>setValues(prev=>({...prev, description: e.target.value}))} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" rows={3} />
      </div>
      {status.kind ? (
        <div className={`px-4 py-2 rounded-md text-sm ${status.kind==='success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{status.text}</div>
      ) : (
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-md border">Cancel</button>
          <button disabled={submitting} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">{submitting ? 'Saving...' : (isEdit ? 'Save' : 'Create')}</button>
        </div>
      )}
    </form>
  );
}
