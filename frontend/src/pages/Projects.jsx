import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE, API_ORIGIN } from '../config';
import { useAuth } from '../context/AuthContext';

export default function Projects() {
  const { user, token } = useAuth();
  const isAdmin = !!user && (user.role === 'admin' || user.role === 'superadmin');
  const [status, setStatus] = useState('All');
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmId, setConfirmId] = useState(null);

  const [form, setForm] = useState({
    title: '',
    department: '',
    description: '',
    budget: '',
    status: 'Planned',
    startDate: '',
    endDate: '',
    imageFile: null
  });

  useEffect(() => {
    let alive = true;
    setLoading(true); setError('');
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/projects`);
        if (!r.ok) throw new Error('Failed to load');
        const list = await r.json();
        if (!alive) return;
        setItems(Array.isArray(list) ? list : []);
      } catch (e) {
        if (!alive) return; setError(e.message || 'Error');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const list = useMemo(() => items.filter(p => status === 'All' ? true : (p.status === status)), [items, status]);

  const openAdd = () => { setShowAdd(true); setEditItem(null); setForm({ title:'', department:'', description:'', budget:'', status:'Planned', startDate:'', endDate:'', imageFile:null }); };
  const openEdit = (p) => {
    setEditItem(p);
    setShowAdd(true);
    setForm({
      title: p.title || '',
      department: p.department || '',
      description: (p.content_json?.description) || '',
      budget: p.budget ?? '',
      status: p.status || 'Planned',
      startDate: p.start_date || '',
      endDate: p.end_date || '',
      imageFile: null
    });
  };
  const closeModal = () => { if (!busy) { setShowAdd(false); setEditItem(null); } };

  const saveProject = async (e) => {
    e.preventDefault(); if (busy) return; setBusy(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('department', form.department);
      if (form.budget !== '') fd.append('budget', String(form.budget));
      fd.append('status', form.status);
      if (form.startDate) fd.append('startDate', form.startDate);
      if (form.endDate) fd.append('endDate', form.endDate);
      fd.append('content', JSON.stringify({ description: form.description }));
      if (form.imageFile) fd.append('image', form.imageFile);
      const url = editItem ? `${API_BASE}/projects/${editItem.id}` : `${API_BASE}/projects`;
      const method = editItem ? 'PUT' : 'POST';
      const r = await fetch(url, { method, headers: { Authorization: `Bearer ${token}` }, body: fd });
      if (!r.ok) {
        const e = await r.json().catch(()=>({}));
        throw new Error(e.error || 'Save failed');
      }
      // refresh list
      const r2 = await fetch(`${API_BASE}/projects`);
      const list = await r2.json();
      setItems(Array.isArray(list) ? list : []);
      setShowAdd(false); setEditItem(null);
    } catch (e) {
      alert(e.message || 'Failed');
    } finally { setBusy(false); }
  };

  const requestDelete = (id) => { setConfirmOpen(true); setConfirmId(id); };
  const cancelDelete = () => { if (!busy) { setConfirmOpen(false); setConfirmId(null); } };
  const doDelete = async () => {
    if (!confirmId) return; setBusy(true);
    try {
      const r = await fetch(`${API_BASE}/projects/${confirmId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (!r.ok) throw new Error('Delete failed');
      setItems(prev => prev.filter(x => x.id !== confirmId));
      setConfirmOpen(false); setConfirmId(null);
    } catch (e) { alert(e.message || 'Failed'); }
    finally { setBusy(false); }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Projects</h1>
        {isAdmin && (
          <button className="px-3 py-1.5 rounded-md border bg-white hover:bg-gray-50" onClick={openAdd}>Add Project</button>
        )}
      </div>
      <div className="flex items-center gap-2 mb-6">
        <label className="text-sm text-gray-600">Filter by status:</label>
        <select value={status} onChange={(e)=>setStatus(e.target.value)} className="border rounded-md px-2 py-1">
          <option>All</option>
          <option>Planned</option>
          <option>Ongoing</option>
          <option>Completed</option>
        </select>
      </div>
      {loading ? (
        <div className="text-sm text-gray-600">Loading...</div>
      ) : error ? (
        <div className="text-sm text-red-600">{error}</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {list.map(p => (
            <article key={p.id} className="border rounded-md overflow-hidden bg-white flex flex-col">
              {p.image_url && (
                <img src={`${String(p.image_url).match(/^https?:|^data:/) ? String(p.image_url) : API_ORIGIN + String(p.image_url)}`} alt="" className="w-full h-40 object-cover" />
              )}
              <div className="p-4 flex-1 flex flex-col">
                <div className="text-xs text-gray-500">{p.department}</div>
                <h2 className="font-semibold">{p.title}</h2>
                {p.content_json?.description && <p className="text-sm text-gray-700 mt-1">{p.content_json.description}</p>}
                <div className="mt-auto pt-3 flex items-center justify-between text-sm">
                  <div>₱{Number(p.budget || 0).toLocaleString()}</div>
                  <span className={`px-2 py-1 rounded text-xs ${p.status === 'Ongoing' ? 'bg-yellow-100 text-yellow-800' : p.status === 'Completed' ? 'bg-green-100 text-green-800' : p.status === 'Planned' ? 'bg-gray-100 text-gray-800' : 'bg-gray-100 text-gray-800'}`}>{p.status || '—'}</span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <Link to={`/projects/${p.slug}`} className="text-blue-700 hover:underline">View details</Link>
                  {isAdmin && (
                    <div className="flex items-center gap-2 text-sm">
                      <button className="text-blue-700 hover:underline" onClick={()=>openEdit(p)}>Edit</button>
                      <button className="text-red-700 hover:underline" onClick={()=>requestDelete(p.id)}>Delete</button>
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-xl mx-4 p-4">
            <div className="text-lg font-semibold mb-3">{editItem ? 'Edit project' : 'Add project'}</div>
            <form onSubmit={saveProject} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="text-sm">
                  <div className="text-gray-600">Title</div>
                  <input className="w-full border rounded px-3 py-2" value={form.title} onChange={(e)=>setForm({...form, title:e.target.value})} required />
                </label>
                <label className="text-sm">
                  <div className="text-gray-600">Department</div>
                  <input className="w-full border rounded px-3 py-2" value={form.department} onChange={(e)=>setForm({...form, department:e.target.value})} />
                </label>
                <label className="text-sm">
                  <div className="text-gray-600">Budget</div>
                  <input type="number" className="w-full border rounded px-3 py-2" value={form.budget} onChange={(e)=>setForm({...form, budget:e.target.value})} />
                </label>
                <label className="text-sm">
                  <div className="text-gray-600">Status</div>
                  <select className="w-full border rounded px-3 py-2" value={form.status} onChange={(e)=>setForm({...form, status:e.target.value})}>
                    <option>Planned</option>
                    <option>Ongoing</option>
                    <option>Completed</option>
                  </select>
                </label>
                <label className="text-sm">
                  <div className="text-gray-600">Image</div>
                  <input type="file" accept="image/*" onChange={(e)=>setForm({...form, imageFile: e.target.files?.[0] || null})} />
                </label>
                <label className="text-sm">
                  <div className="text-gray-600">Start date</div>
                  <input type="date" className="w-full border rounded px-3 py-2" value={form.startDate} onChange={(e)=>setForm({...form, startDate:e.target.value})} />
                </label>
                <label className="text-sm">
                  <div className="text-gray-600">End date</div>
                  <input type="date" className="w-full border rounded px-3 py-2" value={form.endDate} onChange={(e)=>setForm({...form, endDate:e.target.value})} />
                </label>
              </div>
              <label className="text-sm block">
                <div className="text-gray-600">Card description</div>
                <textarea className="w-full border rounded px-3 py-2" rows={3} value={form.description} onChange={(e)=>setForm({...form, description:e.target.value})} />
              </label>
              <div className="flex items-center justify-end gap-2">
                <button type="button" className={`px-3 py-1.5 rounded-md border ${busy?'opacity-75 cursor-not-allowed':''}`} onClick={closeModal} disabled={busy}>Cancel</button>
                <button className={`px-3 py-1.5 rounded-md bg-blue-600 text-white ${busy?'opacity-75 cursor-not-allowed':'hover:bg-blue-700'}`} disabled={busy}>
                  {busy ? 'Saving...' : (editItem ? 'Save changes' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={cancelDelete} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-sm mx-4 p-4">
            <div className="font-semibold">Delete project?</div>
            <div className="text-sm text-gray-600 mt-1">This action cannot be undone.</div>
            <div className="mt-4 flex items-center justify-end gap-2 text-sm">
              <button className={`px-3 py-1.5 rounded-md border ${busy?'opacity-75 cursor-not-allowed':''}`} onClick={cancelDelete} disabled={busy}>Cancel</button>
              <button className={`px-3 py-1.5 rounded-md bg-red-600 text-white ${busy?'opacity-75 cursor-not-allowed':'hover:bg-red-700'}`} onClick={doDelete} disabled={busy}>{busy? 'Deleting...':'Delete'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
