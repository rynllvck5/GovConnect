import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE, API_ORIGIN } from '../config';
import Modal from '../components/Modal';
import CategoryForm from '../components/tourism/CategoryForm';
import EntryForm from '../components/tourism/EntryForm';

export default function Tourism() {
  const { user, token } = useAuth();
  const isAdmin = !!user && (user.role === 'admin' || user.role === 'superadmin');
  const myBarangayId = user?.barangayId || user?.barangay_id || null;

  const [dynCats, setDynCats] = useState([]);
  const [dynLoading, setDynLoading] = useState(false);
  const [dynError, setDynError] = useState('');
  const [entriesByCat, setEntriesByCat] = useState({});
  const [catModal, setCatModal] = useState(null); // null | { mode:'add' } | { mode:'edit', cat }
  const [catDelete, setCatDelete] = useState(null);
  const [catDeleteStatus, setCatDeleteStatus] = useState({ kind: null, text: '' });
  const [entryModal, setEntryModal] = useState(null); // null | { mode:'add', cat } | { mode:'edit', entry, cat }
  const [entryDelete, setEntryDelete] = useState(null);
  const [entryDeleteStatus, setEntryDeleteStatus] = useState({ kind: null, text: '' });

  async function loadDynCats() {
    setDynLoading(true); setDynError('');
    try {
      const r = await fetch(`${API_BASE}/tourism/categories`);
      if (!r.ok) throw new Error('Failed loading categories');
      const list = await r.json();
      setDynCats(Array.isArray(list) ? list : []);
    } catch (e) { setDynError(e.message || 'Error'); }
    finally { setDynLoading(false); }
  }
  async function loadEntries(catId) {
    try {
      const r = await fetch(`${API_BASE}/tourism/categories/${catId}/entries`);
      if (!r.ok) throw new Error('Failed loading entries');
      const list = await r.json();
      setEntriesByCat(prev => ({ ...prev, [catId]: Array.isArray(list) ? list : [] }));
    } catch {}
  }
  useEffect(() => { loadDynCats(); }, []);
  useEffect(() => { (dynCats || []).forEach(c => { loadEntries(c.id); }); }, [dynCats]);
  useEffect(() => { if (catDelete) setCatDeleteStatus({ kind: null, text: '' }); }, [catDelete]);
  useEffect(() => { if (entryDelete) setEntryDeleteStatus({ kind: null, text: '' }); }, [entryDelete]);

  function EntryCard({ cat, e }) {
    const canEditEntry = isAdmin || (!!user && user.role === 'barangay_captain' && myBarangayId && Number(myBarangayId) === Number(e.barangay_id));
    const content = e.content_json || {};
    const title = e.title || content.name || '—';
    const img = content.image || (Array.isArray(content.images) && content.images[0]) || (Array.isArray(content.gallery) && content.gallery[0]) || null;
    const desc = content.description || '';
    return (
      <div className="border rounded-md overflow-hidden bg-white hover:border-blue-400">
        <div className="relative">
          {img && <img src={`${String(img).match(/^https?:|^data:/) ? String(img) : API_ORIGIN + String(img)}`} alt="" className="w-full h-32 object-cover" />}
          {(isAdmin || canEditEntry) && (
            <div className="absolute top-2 right-2 flex gap-1">
              <button onClick={()=>setEntryModal({ mode:'edit', entry: e, cat })} className="text-xs px-2 py-1 rounded bg-yellow-500 text-white">Edit</button>
              {isAdmin && <button onClick={()=>setEntryDelete(e)} className="text-xs px-2 py-1 rounded bg-red-600 text-white">Delete</button>}
            </div>
          )}
        </div>
        <Link to={`/tourism/${cat.slug}/${e.slug}`} className="block p-4">
          <div className="font-medium">{title}</div>
          {desc && <div className="text-sm text-gray-600 line-clamp-2">{desc}</div>}
        </Link>
      </div>
    );
  }

  function DynamicCategorySection({ cat }) {
    const entries = entriesByCat[cat.id] || [];
    if (!isAdmin && entries.length === 0) return null;
    return (
      <section className="scroll-mt-20">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold mb-3">{cat.title}</h2>
          {isAdmin && (
            <div className="flex items-center gap-2">
              <button onClick={()=>setEntryModal({ mode:'add', cat })} className="text-sm px-3 py-1.5 rounded border bg-white">Add</button>
              <button onClick={()=>setCatModal({ mode:'edit', cat })} className="text-sm px-3 py-1.5 rounded border bg-white">Edit</button>
              <button onClick={()=>setCatDelete(cat)} className="text-sm px-3 py-1.5 rounded border bg-white text-red-700">Delete</button>
            </div>
          )}
        </div>
        {cat.description && <div className="text-sm text-gray-700 mb-2">{cat.description}</div>}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {entries.map((e) => (
            <EntryCard key={e.id} e={e} cat={cat} />
          ))}
        </div>
        {isAdmin && entries.length === 0 && <div className="text-sm text-gray-600">No entries yet.</div>}
      </section>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Tourism</h1>
          <p className="text-gray-600">Discover spots, local products, and heritage sites in Caba.</p>
        </div>
        {isAdmin && (
          <button onClick={()=>setCatModal({ mode:'add' })} className="text-sm px-3 py-2 rounded border bg-white">Add Category</button>
        )}
      </div>

      {dynLoading && <div className="text-sm text-gray-600">Loading categories...</div>}
      {dynError && <div className="text-sm text-red-600">{dynError}</div>}
      <div className="space-y-8">
        {(isAdmin ? dynCats : (dynCats || []).filter(c => (entriesByCat[c.id] || []).length > 0)).map((c, idx) => (
          <React.Fragment key={c.id}>
            {idx > 0 && <div className="my-4 border-t border-gray-200" />}
            <DynamicCategorySection cat={c} />
          </React.Fragment>
        ))}
        {isAdmin && (!dynCats || dynCats.length === 0) && <div className="text-sm text-gray-600">No categories yet.</div>}
      </div>

      {/* Category Modal */}
      <Modal open={!!catModal} onClose={()=>setCatModal(null)} title={catModal?.mode === 'edit' ? 'Edit Category' : 'Add Category'}>
        {catModal && (
          <CategoryForm
            category={catModal.mode === 'edit' ? catModal.cat : undefined}
            onClose={()=>setCatModal(null)}
            onSaved={()=>{ setCatModal(null); loadDynCats(); }}
          />
        )}
      </Modal>

      {/* Entry Modal */}
      <Modal open={!!entryModal} onClose={()=>setEntryModal(null)} title={entryModal?.mode === 'edit' ? 'Edit Entry' : 'Add Entry'}>
        {entryModal && (
          <EntryForm
            category={entryModal.cat || dynCats.find(c=>c.id === (entryModal.entry?.category_id))}
            entry={entryModal.mode === 'edit' ? entryModal.entry : undefined}
            onClose={()=>setEntryModal(null)}
            onSaved={()=>{ setEntryModal(null); const cid = (entryModal.cat?.id) || (entryModal.entry?.category_id); if (cid) loadEntries(cid); }}
          />
        )}
      </Modal>

      {/* Category Delete */}
      <Modal open={!!catDelete} onClose={()=>setCatDelete(null)} title="Delete Category">
        <div className="space-y-4">
          <p className="text-sm text-gray-700">Delete <span className="font-medium">{catDelete?.title}</span>? This will remove all its entries.</p>
          {catDeleteStatus.kind ? (
            <div className={`px-4 py-2 rounded-md text-sm ${catDeleteStatus.kind==='success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{catDeleteStatus.text}</div>
          ) : (
            <div className="flex justify-end gap-2">
              <button type="button" onClick={()=>setCatDelete(null)} className="px-4 py-2 rounded-md border">Cancel</button>
              <button
                type="button"
                onClick={async ()=>{
                  try {
                    if (!catDelete) return;
                    const r = await fetch(`${API_BASE}/tourism/categories/${catDelete.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` }});
                    if (!r.ok) { const e = await r.json().catch(()=>({})); throw new Error(e.error || 'Failed to delete'); }
                    setCatDeleteStatus({ kind: 'success', text: 'Deleted successfully.' });
                    setTimeout(async ()=>{ setCatDeleteStatus({ kind: null, text: '' }); setCatDelete(null); await loadDynCats(); }, 1500);
                  } catch (err) {
                    setCatDeleteStatus({ kind: 'error', text: err.message || 'An error occurred.' });
                    setTimeout(()=>setCatDeleteStatus({ kind: null, text: '' }), 2000);
                  }
                }}
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
              >Delete</button>
            </div>
          )}
        </div>
      </Modal>

      {/* Entry Delete */}
      <Modal open={!!entryDelete} onClose={()=>setEntryDelete(null)} title="Delete Entry">
        <div className="space-y-4">
          <p className="text-sm text-gray-700">Delete <span className="font-medium">{entryDelete?.title || 'this entry'}</span>?</p>
          {entryDeleteStatus.kind ? (
            <div className={`px-4 py-2 rounded-md text-sm ${entryDeleteStatus.kind==='success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{entryDeleteStatus.text}</div>
          ) : (
            <div className="flex justify-end gap-2">
              <button type="button" onClick={()=>setEntryDelete(null)} className="px-4 py-2 rounded-md border">Cancel</button>
              <button
                type="button"
                onClick={async ()=>{
                  try {
                    if (!entryDelete) return;
                    const r = await fetch(`${API_BASE}/tourism/entries/${entryDelete.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` }});
                    if (!r.ok) { const e = await r.json().catch(()=>({})); throw new Error(e.error || 'Failed to delete'); }
                    const cid = entryDelete.category_id;
                    setEntryDeleteStatus({ kind: 'success', text: 'Deleted successfully.' });
                    setTimeout(async ()=>{ setEntryDeleteStatus({ kind: null, text: '' }); setEntryDelete(null); if (cid) await loadEntries(cid); }, 1500);
                  } catch (err) {
                    setEntryDeleteStatus({ kind: 'error', text: err.message || 'An error occurred.' });
                    setTimeout(()=>setEntryDeleteStatus({ kind: null, text: '' }), 2000);
                  }
                }}
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
              >Delete</button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
