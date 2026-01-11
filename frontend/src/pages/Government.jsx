import React, { useEffect, useState } from 'react';
// import barangays from '../data/barangays';
import awards from '../data/awards';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE, API_ORIGIN } from '../config';
import Modal from '../components/Modal';
import MapPicker from '../components/MapPicker';
import CategoryForm from '../components/gov/CategoryForm';
import EntryForm from '../components/gov/EntryForm';

export default function Government() {
  const { user, token } = useAuth();
  const isAdmin = !!user && (user.role === 'admin' || user.role === 'superadmin');
  const myOfficeId = user?.officeId || user?.office_id || null;
  const myBarangayId = user?.barangayId || user?.barangay_id || null;
  const myUserId = user?.id || user?.userId || null;
  const [selectedAward, setSelectedAward] = useState(null);
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(null); // office object or null
  const [deleteTarget, setDeleteTarget] = useState(null);
  // Barangays state
  const [barangays, setBarangays] = useState([]);
  const [brgyLoading, setBrgyLoading] = useState(false);
  const [brgyError, setBrgyError] = useState('');
  const [showAddBrgy, setShowAddBrgy] = useState(false);
  const [showEditBrgy, setShowEditBrgy] = useState(null);
  const [deleteBrgy, setDeleteBrgy] = useState(null);
  const [errorDialog, setErrorDialog] = useState({ open: false, title: '', message: '', description: '' });

  async function loadOffices() {
    setLoading(true); setError('');
    try {
      const r = await fetch(`${API_BASE}/offices`);
      if (!r.ok) throw new Error('Failed loading offices');
      const list = await r.json();
      setOffices(Array.isArray(list) ? list : []);
    } catch(e) { setError(e.message || 'Error'); }
    finally { setLoading(false); }
  }

  async function handleCreateOfficial(fd) {
    const r = await fetch(`${API_BASE}/gov/municipal-officials`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
    if (!r.ok) {
      const e = await r.json().catch(()=>({}));
      throw new Error(e.error || 'Failed to save official');
    }
    await loadMunicipalOfficials();
  }

  async function handleUpdateOfficial(id, fd) {
    const r = await fetch(`${API_BASE}/gov/municipal-officials/${id}`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: fd });
    if (!r.ok) {
      const e = await r.json().catch(()=>({}));
      throw new Error(e.error || 'Failed to update official');
    }
    await loadMunicipalOfficials();
  }

  // Anchor scrolling support
  const location = useLocation();
  useEffect(() => {
    if (location.hash) {
      const el = document.querySelector(location.hash);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [location]);

  // Helpers for dynamic sections
  function renderFieldValue(type, value, label) {
    if (value == null) return null;
    if (type === 'image') return (<img alt="" src={`${API_ORIGIN}${value}`} className="w-full h-40 object-cover rounded" />);
    if (type === 'images' || type === 'gallery') return (
      <div className="grid grid-cols-2 gap-2">{(value || []).map((u,i)=>(<img key={i} alt="" src={`${API_ORIGIN}${u}`} className="w-full h-32 object-cover rounded" />))}</div>
    );
    if (type === 'file') return (<a className="text-blue-700 hover:underline" href={`${API_ORIGIN}${value}`} download>{label || 'Download file'}</a>);
    if (type === 'files') return (
      <ul className="list-disc ml-5">{(value || []).map((u,i)=>(<li key={i}><a className="text-blue-700 hover:underline" href={`${API_ORIGIN}${u}`} download>{`File ${i+1}`}</a></li>))}</ul>
    );
    if (type === 'link') return (<a className="text-blue-700 hover:underline" href={String(value)} target="_blank" rel="noreferrer">{String(value)}</a>);
    if (type === 'textarea' || type === 'richtext') return (<p className="whitespace-pre-wrap">{String(value)}</p>);
    return (<div>{String(value)}</div>);
  }

  function EntryCard({ e, fields }) {
    const [expanded, setExpanded] = useState(false);
    const canEditEntry = isAdmin || (!!user && user.role === 'officer' && myUserId && Number(myUserId) === Number(e.manager_user_id));
    return (
      <div className="border rounded-md p-4 bg-white relative">
        <div className="flex items-start justify-between">
          <div className="font-medium">{e.title || '—'}</div>
          {(isAdmin || canEditEntry) && (
            <div className="flex gap-1">
              <button onClick={()=>setEntryModal({ mode:'edit', entry: e, cat: dynCats.find(c=>c.id===e.category_id) })} className="text-xs px-2 py-1 rounded bg-yellow-500 text-white">Edit</button>
              {isAdmin && <button onClick={()=>setEntryDelete(e)} className="text-xs px-2 py-1 rounded bg-red-600 text-white">Delete</button>}
            </div>
          )}
        </div>
        <div className={`mt-2 space-y-2 text-sm ${expanded ? '' : 'max-h-64 overflow-hidden relative'}`}>
          {fields.map((f) => (
            (e.content_json && e.content_json[f.key] != null) ? (
              <div key={f.key}>
                {(f.type === 'image' || f.type === 'images' || f.type === 'gallery') ? (
                  <>
                    {String(f.label || '').trim() ? (
                      <div className="text-gray-700 font-medium text-xs mb-1">{f.label}</div>
                    ) : null}
                    {renderFieldValue(f.type, e.content_json[f.key], e.content_json[`${f.key}_label`])}
                  </>
                ) : (
                  <>
                    <div className="text-gray-700 font-medium text-xs mb-1">{f.label || f.key}</div>
                    {renderFieldValue(f.type, e.content_json[f.key], e.content_json[`${f.key}_label`])}
                  </>
                )}
              </div>
            ) : null
          ))}
          {!expanded && (
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent" />
          )}
        </div>
        <div className="flex justify-end mt-2">
          <button type="button" onClick={()=>setExpanded(v=>!v)} className="text-xs px-2 py-1 rounded border bg-white">{expanded ? 'Show less' : 'Show more'}</button>
        </div>
      </div>
    );
  }

  function DynamicCategorySection({ cat }) {
    const fields = Array.isArray(cat?.schema_json?.fields) ? cat.schema_json.fields : [];
    const entries = entriesByCat[cat.id] || [];
    if (!isAdmin && entries.length === 0) return null;
    return (
      <section id={`govcat-${cat.slug}`} className="scroll-mt-20">
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
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {entries.map((e) => (
            <EntryCard key={e.id} e={e} fields={fields} />
          ))}
        </div>
        {isAdmin && entries.length === 0 && <div className="text-sm text-gray-600">No entries yet.</div>}
      </section>
    );
  }

  useEffect(() => { loadOffices(); }, []);
  useEffect(() => { loadBarangays(); }, []);

  // Dynamic categories state
  const [dynCats, setDynCats] = useState([]);
  const [dynLoading, setDynLoading] = useState(false);
  const [dynError, setDynError] = useState('');
  const [catModal, setCatModal] = useState(null); // null | { mode:'add' } | { mode:'edit', cat }
  const [catDelete, setCatDelete] = useState(null);
  const [catDeleteStatus, setCatDeleteStatus] = useState({ kind: null, text: '' });
  const [entryModal, setEntryModal] = useState(null); // null | { mode:'add', cat } | { mode:'edit', entry, cat }
  const [entryDelete, setEntryDelete] = useState(null); // { entry }
  const [entryDeleteStatus, setEntryDeleteStatus] = useState({ kind: null, text: '' });
  const [entriesByCat, setEntriesByCat] = useState({}); // catId -> entries[]
  // Municipal Officials (dynamic)
  const [moList, setMoList] = useState([]);
  const [moLoading, setMoLoading] = useState(false);
  const [moError, setMoError] = useState('');
  const [showAddMO, setShowAddMO] = useState(false);
  const [showEditMO, setShowEditMO] = useState(null); // item or null
  const [deleteMO, setDeleteMO] = useState(null);

  async function loadDynCats() {
    setDynLoading(true); setDynError('');
    try {
      const r = await fetch(`${API_BASE}/gov/categories`);
      if (!r.ok) throw new Error('Failed loading categories');
      const list = await r.json();
      setDynCats(Array.isArray(list) ? list : []);
    } catch (e) { setDynError(e.message || 'Error'); }
    finally { setDynLoading(false); }
  }
  async function loadEntries(catId) {
    try {
      const r = await fetch(`${API_BASE}/gov/categories/${catId}/entries`);
      if (!r.ok) throw new Error('Failed loading entries');
      const list = await r.json();
      setEntriesByCat(prev => ({ ...prev, [catId]: Array.isArray(list) ? list : [] }));
    } catch {}
  }
  async function loadMunicipalOfficials() {
    setMoLoading(true); setMoError('');
    try {
      const r = await fetch(`${API_BASE}/gov/municipal-officials`);
      if (!r.ok) throw new Error('Failed loading municipal officials');
      const list = await r.json();
      setMoList(Array.isArray(list) ? list : []);
    } catch (e) { setMoError(e.message || 'Error'); }
    finally { setMoLoading(false); }
  }
  useEffect(() => {
    loadDynCats();
  }, []);
  useEffect(() => {
    (dynCats || []).forEach(c => { loadEntries(c.id); });
  }, [dynCats]);
  useEffect(() => { loadMunicipalOfficials(); }, []);

  useEffect(() => { if (catDelete) setCatDeleteStatus({ kind: null, text: '' }); }, [catDelete]);
  useEffect(() => { if (entryDelete) setEntryDeleteStatus({ kind: null, text: '' }); }, [entryDelete]);

  const canEdit = (ofc) => isAdmin || (!!user && user.role === 'officer' && myOfficeId && (Number(myOfficeId) === Number(ofc.id)));

  function handleDelete(ofc) {
    setDeleteTarget(ofc);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    await fetch(`${API_BASE}/offices/${deleteTarget.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setDeleteTarget(null);
    await loadOffices();
  }

  async function handleCreate(fd) {
    const r = await fetch(`${API_BASE}/offices`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
    if (!r.ok) {
      if (r.status === 409) {
        let msg = 'An office with this name already exists.';
        try {
          const data = await r.json();
          if (data && data.error) msg = data.error;
        } catch {}
        throw new Error(msg);
      }
      throw new Error('Failed to save office');
    }
    await loadOffices();
  }

  async function handleUpdate(id, fd) {
    await fetch(`${API_BASE}/offices/${id}`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: fd });
    await loadOffices();
  }

  async function loadBarangays() {
    setBrgyLoading(true); setBrgyError('');
    try {
      const r = await fetch(`${API_BASE}/barangays`);
      if (!r.ok) throw new Error('Failed loading barangays');
      const list = await r.json();
      setBarangays(Array.isArray(list) ? list : []);
    } catch(e) { setBrgyError(e.message || 'Error'); }
    finally { setBrgyLoading(false); }
  }

  const canEditBrgy = (b) => isAdmin || (!!user && user.role === 'barangay_captain' && myBarangayId && (Number(myBarangayId) === Number(b.id)));

  async function openEditBarangay(b) {
    const r = await fetch(`${API_BASE}/barangays/${b.id}`);
    if (r.ok) setShowEditBrgy(await r.json());
  }

  async function confirmDeleteBrgy() {
    if (!deleteBrgy) return;
    await fetch(`${API_BASE}/barangays/${deleteBrgy.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setDeleteBrgy(null);
    await loadBarangays();
  }

  async function handleCreateBrgy(brgyFd, officials) {
    const r = await fetch(`${API_BASE}/barangays`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: brgyFd });
    if (!r.ok) {
      if (r.status === 409) {
        let msg = 'A barangay with this name already exists.';
        try {
          const data = await r.json();
          if (data && data.error) msg = data.error;
        } catch {}
        throw new Error(msg);
      }
      throw new Error('Failed to save barangay');
    }
    const { id } = await r.json();
    if (Array.isArray(officials) && officials.length) {
      const fd = new FormData();
      fd.append('officials', JSON.stringify(officials.map(({ key, name, position, existingImageUrl, sort_order }) => ({ key, name, position, existingImageUrl, sort_order }))));
      officials.forEach((o) => { if (o.imageFile) fd.append(`official_image_${o.key}`, o.imageFile); });
      await fetch(`${API_BASE}/barangays/${id}/officials`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: fd });
    }
    await loadBarangays();
  }

  async function handleUpdateBrgy(id, brgyFd, officials) {
    await fetch(`${API_BASE}/barangays/${id}`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: brgyFd });
    const fd = new FormData();
    fd.append('officials', JSON.stringify((officials || []).map(({ key, name, position, existingImageUrl, sort_order }) => ({ key, name, position, existingImageUrl, sort_order }))));
    (officials || []).forEach((o) => { if (o.imageFile) fd.append(`official_image_${o.key}`, o.imageFile); });
    await fetch(`${API_BASE}/barangays/${id}/officials`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: fd });
    await loadBarangays();
  }
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      <div id="gov-top" />
      <section id="officials" className="scroll-mt-20">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold mb-3">Municipal Officials</h2>
          {isAdmin && (
            <button onClick={()=>setShowAddMO(true)} className="text-sm px-3 py-1.5 rounded border bg-white">Add Official</button>
          )}
        </div>
        {moLoading && <div className="text-sm text-gray-600">Loading officials...</div>}
        {moError && <div className="text-sm text-red-600">{moError}</div>}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {moList.map((o)=> (
            <div key={o.id} className="border rounded-md p-4 bg-white flex items-center gap-3">
              <img src={o.image_url ? `${API_ORIGIN}${o.image_url}` : `https://i.pravatar.cc/96?u=${encodeURIComponent(o.position || o.name || 'official')}`} alt="" className="w-14 h-14 rounded-full object-cover" />
              <div className="flex-1">
                <div className="font-medium">{o.name || '—'}</div>
                <div className="text-sm text-gray-600">{o.position}</div>
              </div>
              {isAdmin && (
                <div className="flex items-center gap-1">
                  <button onClick={()=>setShowEditMO(o)} title="Edit" className="text-xs px-2 py-1 rounded bg-yellow-500 text-white">Edit</button>
                  <button onClick={()=>setDeleteMO(o)} title="Delete" className="text-xs px-2 py-1 rounded bg-red-600 text-white">Delete</button>
                </div>
              )}
            </div>
          ))}
          {!moLoading && (!moList || moList.length === 0) && (
            <div className="text-sm text-gray-600">No officials added yet.</div>
          )}
        </div>
      </section>

      

      {/* Dynamic Government Categories */}
      <section id="dynamic-categories">
        {isAdmin && (
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold mb-3">Other Government Categories</h2>
            <button onClick={()=>setCatModal({ mode:'add' })} className="text-sm px-3 py-1.5 rounded border bg-white">Add Category</button>
          </div>
        )}
        {dynLoading && <div className="text-sm text-gray-600">Loading categories...</div>}
        {dynError && <div className="text-sm text-red-600">{dynError}</div>}
        <div className="space-y-8">
          {(isAdmin ? dynCats : (dynCats || []).filter(c => (entriesByCat[c.id] || []).length > 0)).map((c, idx) => (
            <React.Fragment key={c.id}>
              {idx > 0 && <div className="my-8 border-t-2 border-gray-300" />}
              <DynamicCategorySection cat={c} />
            </React.Fragment>
          ))}
          {isAdmin && (!dynCats || dynCats.length === 0) && <div className="text-sm text-gray-600">No additional categories.</div>}
        </div>
      </section>

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

      <div className="my-8 border-t-2 border-gray-300" />

      {/* Municipal Official Add */}
      <Modal open={!!showAddMO} onClose={()=>setShowAddMO(false)} title="Add Municipal Official">
        {showAddMO && (
          <MunicipalOfficialForm
            onClose={()=>setShowAddMO(false)}
            onSubmit={async (fd)=>{ await handleCreateOfficial(fd); setShowAddMO(false); }}
            submittingText="Create"
            onError={(msg)=>setErrorDialog({ open: true, title: 'Official Error', message: msg })}
          />
        )}
      </Modal>

      {/* Municipal Official Edit */}
      <Modal open={!!showEditMO} onClose={()=>setShowEditMO(null)} title="Edit Municipal Official">
        {showEditMO && (
          <MunicipalOfficialForm
            official={showEditMO}
            onClose={()=>setShowEditMO(null)}
            onSubmit={async (fd)=>{ await handleUpdateOfficial(showEditMO.id, fd); setShowEditMO(null); }}
            submittingText="Save"
            onError={(msg)=>setErrorDialog({ open: true, title: 'Official Error', message: msg })}
          />
        )}
      </Modal>

      {/* Municipal Official Delete */}
      <Modal open={!!deleteMO} onClose={()=>setDeleteMO(null)} title="Delete Municipal Official">
        <div className="space-y-4">
          <p className="text-sm text-gray-700">Delete <span className="font-medium">{deleteMO?.name}</span>?</p>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={()=>setDeleteMO(null)} className="px-4 py-2 rounded-md border">Cancel</button>
            <button type="button" onClick={async ()=>{ if (!deleteMO) return; await fetch(`${API_BASE}/gov/municipal-officials/${deleteMO.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }); setDeleteMO(null); await loadMunicipalOfficials(); }} className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700">Delete</button>
          </div>
        </div>
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
                    const r = await fetch(`${API_BASE}/gov/categories/${catDelete.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` }});
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
                    const r = await fetch(`${API_BASE}/gov/entries/${entryDelete.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` }});
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

      <div className="my-8 border-t-2 border-gray-300" />

      <section id="offices" className="scroll-mt-20">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold mb-3">Municipal Offices</h2>
          {isAdmin && (
            <button onClick={()=>setShowAdd(true)} className="text-sm px-3 py-1.5 rounded border bg-white">Add Office</button>
          )}
        </div>
        {loading && <div className="text-sm text-gray-600">Loading offices...</div>}
        {error && <div className="text-sm text-red-600">{error}</div>}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {offices.map((ofc)=> (
            <div key={ofc.id} className="border rounded-md overflow-hidden bg-white">
              <div className="relative">
                {ofc.image_url && <img src={`${API_ORIGIN}${ofc.image_url}`} alt="" className="w-full h-28 object-cover" />}
                {(isAdmin || (canEdit(ofc))) && (
                  <div className="absolute top-2 right-2 flex gap-1">
                    {canEdit(ofc) && (
                      <button onClick={()=>setShowEdit(ofc)} title="Edit" className="text-xs px-2 py-1 rounded bg-yellow-500 text-white">Edit</button>
                    )}
                    {isAdmin && (
                      <button onClick={()=>handleDelete(ofc)} title="Delete" className="text-xs px-2 py-1 rounded bg-red-600 text-white">Delete</button>
                    )}
                  </div>
                )}
              </div>
              <Link to={`/government/offices/${ofc.slug || ofc.id}`} className="block">
                <div className="p-4">
                  <div className="font-medium">{ofc.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <img src={ofc.head_image_url ? `${API_ORIGIN}${ofc.head_image_url}` : `https://i.pravatar.cc/64?u=${encodeURIComponent(ofc.head || ofc.name)}`} alt="" className="w-6 h-6 rounded-full object-cover" />
                    <div className="text-sm text-gray-600">Head: {ofc.head || '—'}</div>
                  </div>
                  <div className="text-sm text-gray-600">Location: {ofc.location || '—'}</div>
                </div>
              </Link>
            </div>
          ))}
        </div>

        {/* Add Office Modal */}
        <Modal open={!!showAdd} onClose={()=>setShowAdd(false)} title="Add Office">
          <OfficeForm
            onClose={()=>{ setShowAdd(false); }}
            onSubmit={handleCreate}
            submittingText="Create"
            onError={(msg)=>setErrorDialog({ open: true, title: 'Office Error', message: msg, description: 'An office with the same name already exists. Please choose a unique name or edit the existing office.' })}
          />
        </Modal>

        {/* Edit Office Modal */}
        <Modal open={!!showEdit} onClose={()=>setShowEdit(null)} title="Edit Office">
          {showEdit && (
            <OfficeForm
              office={showEdit}
              onClose={()=>{ setShowEdit(null); }}
              onSubmit={(fd)=>handleUpdate(showEdit.id, fd)}
              submittingText="Save"
              onError={(msg)=>setErrorDialog({ open: true, title: 'Office Error', message: msg, description: 'An office with the same name already exists. Please choose a unique name or edit the existing office.' })}
            />
          )}
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal open={!!deleteTarget} onClose={()=>setDeleteTarget(null)} title="Delete Office">
          <div className="space-y-4">
            <p className="text-sm text-gray-700">Are you sure you want to delete <span className="font-medium">{deleteTarget?.name}</span>? This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={()=>setDeleteTarget(null)} className="px-4 py-2 rounded-md border">Cancel</button>
              <button type="button" onClick={confirmDelete} className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700">Delete</button>
            </div>
          </div>
        </Modal>
      </section>

      <div className="my-8 border-t-2 border-gray-300" />

      <section id="barangays" className="scroll-mt-20">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold mb-3">Barangays</h2>
          {isAdmin && (
            <button onClick={()=>setShowAddBrgy(true)} className="text-sm px-3 py-1.5 rounded border bg-white">Add Barangay</button>
          )}
        </div>
        {brgyLoading && <div className="text-sm text-gray-600">Loading barangays...</div>}
        {brgyError && <div className="text-sm text-red-600">{brgyError}</div>}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {barangays.map((b)=> (
            <div key={b.id} className="border rounded-md overflow-hidden bg-white">
              {b.image_url && <img src={`${API_ORIGIN}${b.image_url}`} alt="" className="w-full h-28 object-cover" />}
              <div className="p-3 text-sm">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{b.name}</div>
                  {(isAdmin || canEditBrgy(b)) && (
                    <div className="flex gap-1">
                      {canEditBrgy(b) && (
                        <button onClick={()=>openEditBarangay(b)} title="Edit" className="text-xs px-2 py-1 rounded bg-yellow-500 text-white">Edit</button>
                      )}
                      {isAdmin && (
                        <button onClick={()=>setDeleteBrgy(b)} title="Delete" className="text-xs px-2 py-1 rounded bg-red-600 text-white">Delete</button>
                      )}
                    </div>
                  )}
                </div>
                <div className="text-gray-600 mt-1 line-clamp-2">{b.description || '—'}</div>
                <Link to={`/government/barangays/${b.id}`} className="inline-block mt-2 text-blue-700 hover:underline">View</Link>
              </div>
            </div>
          ))}
        </div>

        {/* Add Barangay Modal */}
        <Modal open={!!showAddBrgy} onClose={()=>setShowAddBrgy(false)} title="Add Barangay">
          <BarangayForm
            onClose={()=>setShowAddBrgy(false)}
            onSubmit={(fd, officials)=>handleCreateBrgy(fd, officials)}
            submittingText="Create"
            onError={(msg)=>setErrorDialog({ open: true, title: 'Barangay Error', message: msg, description: 'A barangay with the same name already exists. Please use a different name or update the existing barangay.' })}
          />
        </Modal>

        {/* Edit Barangay Modal */}
        <Modal open={!!showEditBrgy} onClose={()=>setShowEditBrgy(null)} title="Edit Barangay">
          {showEditBrgy && (
            <BarangayForm
              barangay={showEditBrgy}
              onClose={()=>setShowEditBrgy(null)}
              onSubmit={(fd, officials)=>handleUpdateBrgy(showEditBrgy.id, fd, officials)}
              submittingText="Save"
              onError={(msg)=>setErrorDialog({ open: true, title: 'Barangay Error', message: msg, description: 'A barangay with the same name already exists. Please use a different name or update the existing barangay.' })}
            />
          )}
        </Modal>

        {/* Delete Barangay Confirmation */}
        <Modal open={!!deleteBrgy} onClose={()=>setDeleteBrgy(null)} title="Delete Barangay">
          <div className="space-y-4">
            <p className="text-sm text-gray-700">Are you sure you want to delete <span className="font-medium">{deleteBrgy?.name}</span>? This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={()=>setDeleteBrgy(null)} className="px-4 py-2 rounded-md border">Cancel</button>
              <button type="button" onClick={confirmDeleteBrgy} className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700">Delete</button>
            </div>
          </div>
        </Modal>
      </section>

      <div className="my-8 border-t-2 border-gray-300" />

      <section id="awards" className="scroll-mt-20">
        <h2 className="text-xl font-semibold mb-3">Awards & Achievements</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {awards.map((a,idx)=> (
            <button key={idx} onClick={()=>setSelectedAward({ title: a })} className="text-left border rounded-md overflow-hidden bg-white hover:border-blue-400">
              <img src={`https://picsum.photos/seed/award-${idx}/480/240`} alt="" className="w-full h-28 object-cover" />
              <div className="p-3">
                <div className="font-medium text-sm">{a}</div>
                <div className="text-xs text-gray-600 mt-1">Click to view certificate and details</div>
              </div>
            </button>
          ))}
        </div>
        <dialog open={!!selectedAward} className="rounded-lg p-0 w-full max-w-2xl">
          {selectedAward && (
            <div>
              <div className="flex justify-between items-center px-4 py-3 border-b">
                <div className="font-semibold">{selectedAward.title}</div>
                <button className="text-gray-600" onClick={()=>setSelectedAward(null)}>✕</button>
              </div>
              <div className="p-4 space-y-3">
                <div className="text-sm text-gray-700">This section will display the official documentation, certificate scans, and a short description for the award.</div>
                <div className="grid grid-cols-2 gap-2">
                  <img src="https://picsum.photos/seed/cert1/640/360" alt="" className="w-full h-32 object-cover rounded" />
                  <img src="https://picsum.photos/seed/cert2/640/360" alt="" className="w-full h-32 object-cover rounded" />
                </div>
              </div>
            </div>
          )}
        </dialog>
      </section>
      {/* Error Modal */}
      <Modal open={errorDialog.open} onClose={()=>setErrorDialog({ open: false, title: '', message: '', description: '' })} title={errorDialog.title || 'Error'}>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="shrink-0 rounded-full bg-red-100 p-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-red-600"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.72-1.36 3.485 0l6.518 11.59c.75 1.335-.213 2.99-1.742 2.99H3.48c-1.53 0-2.492-1.655-1.742-2.99L8.257 3.1zM11 14a1 1 0 10-2 0 1 1 0 002 0zm-.293-7.707a1 1 0 00-1.414 0l-.293.293v4.121a1 1 0 002 0V6.586l-.293-.293z" clipRule="evenodd"/></svg>
            </div>
            <div>
              <div className="font-medium text-red-800">{errorDialog.title || 'Error'}</div>
              <p className="mt-1 text-sm text-red-700">{errorDialog.message}</p>
              {errorDialog.description && <p className="mt-2 text-xs text-red-600">{errorDialog.description}</p>}
            </div>
          </div>
          <div className="flex justify-end">
            <button type="button" onClick={()=>setErrorDialog({ open: false, title: '', message: '', description: '' })} className="px-4 py-2 rounded-md border">Close</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function BarangayForm({ barangay, onClose, onSubmit, submittingText, onError }) {
  const [name, setName] = useState(barangay?.name || '');
  const [description, setDescription] = useState(barangay?.description || '');
  const [imageFile, setImageFile] = useState(null);
  const [officials, setOfficials] = useState(() => {
    const base = Array.isArray(barangay?.officials) ? barangay.officials : [];
    return base.map((o, idx) => ({ key: String(o.id || idx), name: o.name || '', position: o.position || '', existingImageUrl: o.image_url || null, imageFile: null, sort_order: o.sort_order ?? idx }));
  });
  const [submitting, setSubmitting] = useState(false);

  function addOfficial() {
    setOfficials((prev) => [...prev, { key: String(Date.now()), name: '', position: '', existingImageUrl: null, imageFile: null, sort_order: prev.length }]);
  }
  function removeOfficial(idx) {
    setOfficials((prev) => prev.filter((_, i) => i !== idx).map((o, i) => ({ ...o, sort_order: i })));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData();
      if (!barangay) fd.append('name', name.trim()); else if (name && name !== barangay.name) fd.append('name', name.trim());
      if (description !== (barangay?.description || '')) fd.append('description', description);
      if (imageFile) fd.append('image', imageFile);
      await onSubmit(fd, officials);
      onClose();
    } catch (e) {
      onError?.(e.message || 'Failed to save barangay');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-1 sm:p-2">
      {!barangay && (
        <div>
          <label className="block text-sm text-gray-700">Name</label>
          <input value={name} onChange={(e)=>setName(e.target.value)} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., Brgy. Mabini" required />
        </div>
      )}
      <div>
        <label className="block text-sm text-gray-700">Description</label>
        <textarea value={description} onChange={(e)=>setDescription(e.target.value)} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" rows={3} placeholder="Brief description" />
      </div>
      <div>
        <label className="block text-sm text-gray-700">Barangay Image</label>
        <div className="mt-1 flex items-center gap-3">
          <div className="w-24 h-16 rounded-md bg-gray-100 border overflow-hidden flex items-center justify-center">
            {imageFile ? (
              <img alt="preview" src={URL.createObjectURL(imageFile)} className="w-full h-full object-cover" />
            ) : barangay?.image_url ? (
              <img alt="brgy" src={`${API_ORIGIN}${barangay.image_url}`} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs text-gray-400">No image</span>
            )}
          </div>
          <div>
            <input id="brgy-image" type="file" accept="image/*" onChange={(e)=>setImageFile(e.target.files?.[0] || null)} className="sr-only" />
            <label htmlFor="brgy-image" className="inline-flex items-center px-3 py-2 rounded-md border text-sm bg-white hover:bg-gray-50 cursor-pointer">Choose File</label>
          </div>
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">Officials</label>
          <button type="button" onClick={addOfficial} className="text-xs px-2 py-1 rounded-md border bg-white">Add Official</button>
        </div>
        <div className="space-y-3">
          {officials.map((o, idx) => (
            <div key={o.key} className="border rounded-md p-3">
              <div className="grid sm:grid-cols-3 gap-3 items-start">
                <div className="sm:col-span-2 grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-700">Name</label>
                    <input value={o.name} onChange={(e)=>setOfficials(prev => prev.map((x,i)=> i===idx?{...x,name:e.target.value}:x))} className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-700">Position</label>
                    <input value={o.position} onChange={(e)=>setOfficials(prev => prev.map((x,i)=> i===idx?{...x,position:e.target.value}:x))} className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-700">Photo</label>
                  <div className="mt-1 flex items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-gray-100 border overflow-hidden flex items-center justify-center">
                      {o.imageFile ? (
                        <img alt="preview" src={URL.createObjectURL(o.imageFile)} className="w-full h-full object-cover" />
                      ) : o.existingImageUrl ? (
                        <img alt="official" src={`${API_ORIGIN}${o.existingImageUrl}`} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px] text-gray-400">No photo</span>
                      )}
                    </div>
                    <div>
                      <input id={`official-${o.key}`} type="file" accept="image/*" onChange={(e)=>setOfficials(prev => prev.map((x,i)=> i===idx?{...x,imageFile:(e.target.files?.[0]||null)}:x))} className="sr-only" />
                      <label htmlFor={`official-${o.key}`} className="inline-flex items-center px-3 py-2 rounded-md border text-xs bg-white hover:bg-gray-50 cursor-pointer">Choose File</label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end mt-2">
                <button type="button" onClick={()=>removeOfficial(idx)} className="text-xs px-2 py-1 rounded-md border bg-white">Remove</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} className="px-4 py-2 rounded-md border">Cancel</button>
        <button disabled={submitting} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">{submitting ? 'Saving...' : submittingText}</button>
      </div>
    </form>
  );
}

function OfficeForm({ office, onClose, onSubmit, submittingText, onError }) {
  const [name, setName] = useState(office?.name || '');
  const [head, setHead] = useState(office?.head || '');
  const [location, setLocation] = useState(office?.location || '');
  const [contact, setContact] = useState(office?.contact || '');
  const [lat, setLat] = useState(office?.lat ?? null);
  const [lng, setLng] = useState(office?.lng ?? null);
  const [description, setDescription] = useState(office?.description || '');
  const [imageFile, setImageFile] = useState(null);
  const [headImageFile, setHeadImageFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData();
      if (!office) fd.append('name', name.trim());
      if (office && name && name !== office.name) fd.append('name', name.trim());
      if (head !== (office?.head || '')) fd.append('head', head);
      if (location !== (office?.location || '')) fd.append('location', location);
      if (contact !== (office?.contact || '')) fd.append('contact', contact);
      if (lat != null) fd.append('lat', String(lat));
      if (lng != null) fd.append('lng', String(lng));
      if (description !== (office?.description || '')) fd.append('description', description);
      if (imageFile) fd.append('image', imageFile);
      if (headImageFile) fd.append('headImage', headImageFile);
      await onSubmit(fd);
      onClose();
    } catch (e) {
      onError?.(e.message || 'Failed to save office');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-1 sm:p-2">
      {!office && (
        <div>
          <label className="block text-sm text-gray-700">Name</label>
          <input value={name} onChange={(e)=>setName(e.target.value)} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., Municipal Engineering Office" required />
        </div>
      )}
      <div>
        <label className="block text-sm text-gray-700">Head of Office</label>
        <input value={head} onChange={(e)=>setHead(e.target.value)} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., Juan Dela Cruz" />
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-gray-700">Location</label>
          <input value={location} onChange={(e)=>setLocation(e.target.value)} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., Municipal Hall, 2/F" />
        </div>
        <div>
          <label className="block text-sm text-gray-700">Contact</label>
          <input value={contact} onChange={(e)=>setContact(e.target.value)} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., (042) 123-4567" />
        </div>
      </div>
      <div>
        <label className="block text-sm text-gray-700 mb-2">Pin Office Location</label>
        <MapPicker lat={lat} lng={lng} onChange={({lat: la, lng: ln})=>{ setLat(la); setLng(ln); }} />
      </div>
      <div>
        <label className="block text-sm text-gray-700">Description</label>
        <textarea value={description} onChange={(e)=>setDescription(e.target.value)} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" rows={3} placeholder="Brief description of the office" />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-700">Office Image</label>
          <div className="mt-1 flex items-center gap-3">
            <div className="w-20 h-20 rounded-md bg-gray-100 border overflow-hidden flex items-center justify-center">
              {imageFile ? (
                <img alt="preview" src={URL.createObjectURL(imageFile)} className="w-full h-full object-cover" />
              ) : office?.image_url ? (
                <img alt="office" src={`${API_ORIGIN}${office.image_url}`} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs text-gray-400">No image</span>
              )}
            </div>
            <div>
              <input id="office-image" type="file" accept="image/*" onChange={(e)=>setImageFile(e.target.files?.[0] || null)} className="sr-only" />
              <label htmlFor="office-image" className="inline-flex items-center px-3 py-2 rounded-md border text-sm bg-white hover:bg-gray-50 cursor-pointer">Choose File</label>
              <div className="text-xs text-gray-600 mt-1 truncate max-w-[12rem]">{imageFile?.name || (office?.image_url ? office.image_url.split('/').pop() : 'No file selected')}</div>
            </div>
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-700">Head Photo</label>
          <div className="mt-1 flex items-center gap-3">
            <div className="w-20 h-20 rounded-full bg-gray-100 border overflow-hidden flex items-center justify-center">
              {headImageFile ? (
                <img alt="preview" src={URL.createObjectURL(headImageFile)} className="w-full h-full object-cover" />
              ) : office?.head_image_url ? (
                <img alt="head" src={`${API_ORIGIN}${office.head_image_url}`} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs text-gray-400">No photo</span>
              )}
            </div>
            <div>
              <input id="head-image" type="file" accept="image/*" onChange={(e)=>setHeadImageFile(e.target.files?.[0] || null)} className="sr-only" />
              <label htmlFor="head-image" className="inline-flex items-center px-3 py-2 rounded-md border text-sm bg-white hover:bg-gray-50 cursor-pointer">Choose File</label>
              <div className="text-xs text-gray-600 mt-1 truncate max-w-[12rem]">{headImageFile?.name || (office?.head_image_url ? office.head_image_url.split('/').pop() : 'No file selected')}</div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} className="px-4 py-2 rounded-md border">Cancel</button>
        <button disabled={submitting} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">{submitting ? 'Saving...' : submittingText}</button>
      </div>
    </form>
  );
}

function MunicipalOfficialForm({ official, onClose, onSubmit, submittingText, onError }) {
  const [name, setName] = useState(official?.name || '');
  const [position, setPosition] = useState(official?.position || '');
  const [imageFile, setImageFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData();
      if (!official || (name && name !== official.name)) fd.append('name', name.trim());
      if (!official || (position && position !== official.position)) fd.append('position', position.trim());
      if (imageFile) fd.append('image', imageFile);
      await onSubmit(fd);
      onClose?.();
    } catch (e) {
      onError?.(e.message || 'Failed to save official');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-1 sm:p-2">
      <div>
        <label className="block text-sm text-gray-700">Name</label>
        <input value={name} onChange={(e)=>setName(e.target.value)} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., Hon. John Doe" required />
      </div>
      <div>
        <label className="block text-sm text-gray-700">Position</label>
        <input value={position} onChange={(e)=>setPosition(e.target.value)} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., Mayor" required />
      </div>
      <div>
        <label className="block text-sm text-gray-700">Photo</label>
        <div className="mt-1 flex items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-gray-100 border overflow-hidden flex items-center justify-center">
            {imageFile ? (
              <img alt="preview" src={URL.createObjectURL(imageFile)} className="w-full h-full object-cover" />
            ) : official?.image_url ? (
              <img alt="official" src={`${API_ORIGIN}${official.image_url}`} className="w-full h-full object-cover" />
            ) : (
              <span className="text-[10px] text-gray-400">No photo</span>
            )}
          </div>
          <div>
            <input id="mo-image" type="file" accept="image/*" onChange={(e)=>setImageFile(e.target.files?.[0] || null)} className="sr-only" />
            <label htmlFor="mo-image" className="inline-flex items-center px-3 py-2 rounded-md border text-sm bg-white hover:bg-gray-50 cursor-pointer">Choose File</label>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} className="px-4 py-2 rounded-md border">Cancel</button>
        <button disabled={submitting} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">{submitting ? 'Saving...' : (submittingText || 'Save')}</button>
      </div>
    </form>
  );
}

// handleDelete moved into component scope above to access token
