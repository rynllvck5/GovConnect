import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE, API_ORIGIN } from '../../config';

export default function EntryForm({ category, entry, onClose, onSaved }) {
  const isEdit = !!entry;
  const { token } = useAuth();
  const fields = useMemo(() => Array.isArray(category?.schema_json?.fields) ? category.schema_json.fields : [], [category]);
  const [title, setTitle] = useState(entry?.title || '');
  const [values, setValues] = useState(() => ({ ...(entry?.content_json || {}) }));
  const [files, setFiles] = useState({}); // key -> File | File[]
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState({ kind: null, text: '' });
  const [officers, setOfficers] = useState([]);
  const [managerUserId, setManagerUserId] = useState(entry?.manager_user_id || null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/users`, { headers: { Authorization: `Bearer ${token}` } });
        if (!r.ok) return;
        const list = await r.json();
        if (!alive) return;
        const offs = (Array.isArray(list) ? list : []).filter(u => u.role === 'officer' && u.is_active !== false);
        setOfficers(offs);
      } catch {}
    })();
    return () => { alive = false; };
  }, [token]);
  
  

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData();
      if (title) fd.append('title', title);
      const content = { ...values };
      for (const f of fields) {
        if (f.type === 'image' || f.type === 'file') {
          const fl = files[f.key];
          if (fl) {
            fd.append(f.key, fl);
          }
          if (f.type === 'file') {
            const labelVal = values[`${f.key}_label`];
            if (labelVal != null) fd.append(`${f.key}_label`, String(labelVal));
          }
        } else if (f.type === 'images' || f.type === 'files' || f.type === 'gallery') {
          const arr = files[f.key];
          if (Array.isArray(arr)) arr.forEach(file => fd.append(f.key, file));
        }
      }
      if (managerUserId != null) fd.append('managerUserId', String(managerUserId || ''));
      fd.append('content', JSON.stringify(content));
      const url = isEdit ? `${API_BASE}/gov/entries/${entry.id}` : `${API_BASE}/gov/categories/${category.id}/entries`;
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

  function removeExistingSingle(key) {
    setValues(prev => ({ ...prev, [key]: null }));
    setFiles(prev => ({ ...prev, [key]: null }));
  }
  function removeExistingFromArray(key, itemUrl) {
    setValues(prev => ({ ...prev, [key]: (Array.isArray(prev[key]) ? prev[key].filter(u => u !== itemUrl) : prev[key]) }));
  }
  function handleFileChange(key, multiple, fileList) {
    const arr = Array.from(fileList || []);
    setFiles(prev => ({ ...prev, [key]: multiple ? arr : arr[0] || null }));
  }
  function FilePicker({ id, accept, multiple, onChange }) {
    return (
      <div className="flex items-center gap-3">
        <input id={id} type="file" accept={accept} multiple={multiple} onChange={(e)=>onChange(e.target.files)} className="sr-only" />
        <label htmlFor={id} className="inline-flex items-center px-3 py-2 rounded-md border bg-white text-sm hover:bg-gray-50 cursor-pointer">{multiple ? 'Choose files' : 'Choose file'}</label>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-1 sm:p-2">
      <div>
        <label className="block text-sm text-gray-700">Title</label>
        <input value={title} onChange={(e)=>setTitle(e.target.value)} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Optional title" />
      </div>
      <div>
        <label className="block text-sm text-gray-700">Managed by (Officer)</label>
        <select value={managerUserId || ''} onChange={(e)=>setManagerUserId(e.target.value ? Number(e.target.value) : null)} className="w-full border rounded-md px-3 py-2 text-sm">
          <option value="">— None —</option>
          {officers.map(o => (
            <option key={o.id} value={o.id}>{o.full_name}{o.office_id ? '' : ''}</option>
          ))}
        </select>
      </div>
      {fields.map(f => (
        <div key={f.key}>
          <label className="block text-sm text-gray-700">{f.label || f.key}</label>
          {(() => {
            const val = values[f.key] ?? '';
            if (f.type === 'text' || f.type === 'link') {
              return <input value={val} onChange={(e)=>setValues(prev=>({...prev,[f.key]: e.target.value}))} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            }
            if (f.type === 'number') {
              return <input type="number" value={val} onChange={(e)=>setValues(prev=>({...prev,[f.key]: e.target.value}))} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            }
            if (f.type === 'date') {
              return <input type="date" value={val} onChange={(e)=>setValues(prev=>({...prev,[f.key]: e.target.value}))} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            }
            if (f.type === 'textarea' || f.type === 'richtext') {
              return <textarea value={val} onChange={(e)=>setValues(prev=>({...prev,[f.key]: e.target.value}))} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" rows={3} />
            }
            if (f.type === 'image' || f.type === 'file') {
              return (
                <div className="space-y-2">
                  {isEdit && values[f.key] && (
                    <div className="flex items-center justify-between border rounded-md p-2">
                      {f.type === 'image' ? (
                        <a href={`${String(values[f.key]).match(/^https?:|^data:/) ? String(values[f.key]) : API_ORIGIN + String(values[f.key])}`} target="_blank" rel="noreferrer" className="flex items-center gap-2">
                          <img alt="" src={`${String(values[f.key]).match(/^https?:|^data:/) ? String(values[f.key]) : API_ORIGIN + String(values[f.key])}`} className="w-24 h-16 object-cover rounded" onError={(e)=>{ e.currentTarget.style.display='none'; e.currentTarget.nextSibling.style.display='block'; }} />
                          <span style={{ display: 'none' }} className="text-xs text-gray-600 truncate">{String(values[f.key]).split('/').pop()}</span>
                        </a>
                      ) : (
                        <a href={`${String(values[f.key]).match(/^https?:|^data:/) ? String(values[f.key]) : API_ORIGIN + String(values[f.key])}`} className="text-blue-700 hover:underline text-sm truncate" target="_blank" rel="noreferrer">{values[`${f.key}_label`] || String(values[f.key]).split('/').pop() || 'Current file'}</a>
                      )}
                      <button type="button" onClick={()=>removeExistingSingle(f.key)} className="text-xs px-2 py-1 rounded-md border bg-white text-red-700">Remove</button>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <FilePicker id={`file-${f.key}`} accept={f.type === 'image' ? 'image/*' : undefined} multiple={false} onChange={(files)=>handleFileChange(f.key, false, files)} />
                    {files[f.key] && <div className="text-xs text-gray-600 truncate">{files[f.key]?.name}</div>}
                  </div>
                  {f.type === 'file' && (
                    <div className="mt-1">
                      <label className="block text-xs text-gray-700">Download label (optional)</label>
                      <input value={values[`${f.key}_label`] || ''} onChange={(e)=>setValues(prev=>({...prev,[`${f.key}_label`]: e.target.value}))} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., Download Executive Order PDF" />
                    </div>
                  )}
                </div>
              );
            }
            if (f.type === 'images' || f.type === 'files' || f.type === 'gallery') {
              return (
                <div className="space-y-2">
                  {isEdit && Array.isArray(values[f.key]) && values[f.key].length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {values[f.key].map((u, i) => (
                        <div key={i} className="relative group">
                          {f.type === 'files' ? (
                            <a href={`${String(u).match(/^https?:|^data:/) ? String(u) : API_ORIGIN + String(u)}`} className="text-blue-700 hover:underline text-xs" target="_blank" rel="noreferrer">{`File ${i+1}`}</a>
                          ) : (
                            <img alt="" src={`${String(u).match(/^https?:|^data:/) ? String(u) : API_ORIGIN + String(u)}`} className="w-24 h-16 object-cover rounded" />
                          )}
                          <button type="button" onClick={()=>removeExistingFromArray(f.key, u)} className="absolute -top-2 -right-2 hidden group-hover:block w-6 h-6 rounded-full bg-red-600 text-white text-xs">✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <FilePicker id={`files-${f.key}`} accept={(f.type === 'images' || f.type === 'gallery') ? 'image/*' : undefined} multiple={true} onChange={(files)=>handleFileChange(f.key, true, files)} />
                    {Array.isArray(files[f.key]) && files[f.key].length > 0 && (
                      <div className="text-xs text-gray-600 truncate">{files[f.key].map(fx => fx.name).join(', ')}</div>
                    )}
                  </div>
                </div>
              );
            }
            return <input value={val} onChange={(e)=>setValues(prev=>({...prev,[f.key]: e.target.value}))} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          })()}
        </div>
      ))}
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
