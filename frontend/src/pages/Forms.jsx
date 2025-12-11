import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE, API_ORIGIN } from '../config';
import Modal from '../components/Modal';

export default function Forms() {
  const { user, token } = useAuth();
  const isAdmin = !!user && (user.role === 'admin' || user.role === 'superadmin');
  const myOfficeId = user?.officeId || user?.office_id || null;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [offices, setOffices] = useState([]);

  const canManage = useMemo(() => (f) => {
    if (isAdmin) return true;
    if (!!user && user.role === 'officer' && myOfficeId && Number(f.office_id) === Number(myOfficeId)) return true;
    return false;
  }, [isAdmin, user, myOfficeId]);

  async function loadForms() {
    setLoading(true); setError('');
    try {
      const r = await fetch(`${API_BASE}/forms`);
      if (!r.ok) throw new Error('Failed loading forms');
      const list = await r.json();
      setItems(Array.isArray(list) ? list : []);
    } catch (e) { setError(e.message || 'Error'); }
    finally { setLoading(false); }
  }

  async function loadOffices() {
    if (!isAdmin) return; // only admins need office list
    try {
      const r = await fetch(`${API_BASE}/offices`);
      if (!r.ok) return;
      const list = await r.json();
      setOffices(Array.isArray(list) ? list : []);
    } catch {}
  }

  useEffect(() => { loadForms(); }, []);
  useEffect(() => { loadOffices(); }, [isAdmin]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold mb-4">Downloadable Forms</h1>
        {(isAdmin || (!!user && user.role === 'officer' && myOfficeId)) && (
          <button onClick={()=>setShowAdd(true)} className="text-sm px-3 py-2 rounded-md border bg-white">Add Form</button>
        )}
      </div>
      {loading && <div className="text-sm text-gray-600">Loading forms...</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}
      <div className="border rounded-md divide-y">
        {(items || []).map((f) => (
          <div key={f.id} className="p-4 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="font-medium truncate">{f.title}</div>
              <div className="text-xs text-gray-600 truncate">{f.description || '—'}</div>
              <div className="text-xs text-gray-500">Office: {f.office_name}</div>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <a className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700" href={`${API_ORIGIN}${f.file_url}`} download>
                Download
              </a>
              {canManage(f) && (
                <>
                  <button onClick={()=>setEditItem(f)} className="text-xs px-2 py-1 rounded bg-yellow-500 text-white">Edit</button>
                  <button onClick={()=>setDeleteItem(f)} className="text-xs px-2 py-1 rounded bg-red-600 text-white">Delete</button>
                </>
              )}
            </div>
          </div>
        ))}
        {!loading && (!items || items.length === 0) && (
          <div className="p-4 text-sm text-gray-600">No forms yet.</div>
        )}
      </div>

      {/* Add */}
      <Modal open={!!showAdd} onClose={()=>setShowAdd(false)} title="Add Form">
        {showAdd && (
          <FormEditor
            offices={offices}
            isAdmin={isAdmin}
            onClose={()=>setShowAdd(false)}
            onSubmit={async (fd)=>{
              const r = await fetch(`${API_BASE}/forms`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
              if (!r.ok) {
                const e = await r.json().catch(()=>({}));
                alert(e.error || 'Failed to create form');
                return;
              }
              setShowAdd(false);
              await loadForms();
            }}
          />
        )}
      </Modal>

      {/* Edit */}
      <Modal open={!!editItem} onClose={()=>setEditItem(null)} title="Edit Form">
        {editItem && (
          <FormEditor
            form={editItem}
            offices={offices}
            isAdmin={isAdmin}
            onClose={()=>setEditItem(null)}
            onSubmit={async (fd)=>{
              const r = await fetch(`${API_BASE}/forms/${editItem.id}`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: fd });
              if (!r.ok) {
                const e = await r.json().catch(()=>({}));
                alert(e.error || 'Failed to update form');
                return;
              }
              setEditItem(null);
              await loadForms();
            }}
          />
        )}
      </Modal>

      {/* Delete */}
      <Modal open={!!deleteItem} onClose={()=>setDeleteItem(null)} title="Delete Form">
        {deleteItem && (
          <div className="space-y-4">
            <div className="text-sm text-gray-700">Delete <span className="font-medium">{deleteItem.title}</span>?</div>
            <div className="flex justify-end gap-2">
              <button onClick={()=>setDeleteItem(null)} className="px-4 py-2 rounded-md border">Cancel</button>
              <button onClick={async()=>{
                const r = await fetch(`${API_BASE}/forms/${deleteItem.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
                if (!r.ok) {
                  const e = await r.json().catch(()=>({}));
                  alert(e.error || 'Failed to delete');
                  return;
                }
                setDeleteItem(null);
                await loadForms();
              }} className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700">Delete</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function FormEditor({ form, onClose, onSubmit, isAdmin, offices }) {
  const { user } = useAuth();
  const myOfficeId = user?.officeId || user?.office_id || null;
  const [title, setTitle] = useState(form?.title || '');
  const [description, setDescription] = useState(form?.description || '');
  const [officeId, setOfficeId] = useState(isAdmin ? (form?.office_id || '') : (myOfficeId || ''));
  const [file, setFile] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    const fd = new FormData();
    if (!form || title !== (form.title || '')) fd.append('title', title.trim());
    if (description !== (form?.description || '')) fd.append('description', description);
    if (isAdmin) {
      if (!form || officeId !== (form.office_id || '')) fd.append('officeId', String(officeId));
    }
    if (!form && !file) {
      alert('Please choose at least one file');
      return;
    }
    if (file) fd.append('file', file);
    await onSubmit(fd);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm text-gray-700">Title</label>
        <input value={title} onChange={(e)=>setTitle(e.target.value)} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
      </div>
      <div>
        <label className="block text-sm text-gray-700">Description</label>
        <textarea value={description} onChange={(e)=>setDescription(e.target.value)} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" rows={3} />
      </div>
      {isAdmin ? (
        <div>
          <label className="block text-sm text-gray-700">Office</label>
          <select value={officeId} onChange={(e)=>setOfficeId(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm" required>
            <option value="">— Select office —</option>
            {(offices || []).map(o => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
        </div>
      ) : (
        <div className="text-sm text-gray-600">Office: <span className="font-medium">{form?.office_name || (offices || []).find(x=>String(x.id)===String(officeId))?.name || 'My Office'}</span></div>
      )}
      <div>
        <label className="block text-sm text-gray-700">File {form ? <span className="text-gray-500">(leave blank to keep existing)</span> : null}</label>
        <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,image/png,image/jpeg,image/webp" onChange={(e)=>setFile(e.target.files?.[0] || null)} />
        {form?.file_url && (
          <div className="mt-1 text-xs"><a className="text-blue-700 hover:underline" href={`${API_ORIGIN}${form.file_url}`} target="_blank" rel="noreferrer">Current file</a></div>
        )}
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} className="px-4 py-2 rounded-md border">Cancel</button>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">{form ? 'Save' : 'Create'}</button>
      </div>
    </form>
  );
}
