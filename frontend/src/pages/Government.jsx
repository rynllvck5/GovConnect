import React, { useEffect, useState } from 'react';
import officials from '../data/officials';
// import barangays from '../data/barangays';
import awards from '../data/awards';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE, API_ORIGIN } from '../config';
import Modal from '../components/Modal';
import MapPicker from '../components/MapPicker';

export default function Government() {
  const { user, token } = useAuth();
  const isAdmin = !!user && (user.role === 'admin' || user.role === 'superadmin');
  const myOfficeId = user?.officeId || user?.office_id || null;
  const myBarangayId = user?.barangayId || user?.barangay_id || null;
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

  useEffect(() => { loadOffices(); }, []);
  useEffect(() => { loadBarangays(); }, []);

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
    await fetch(`${API_BASE}/offices`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
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
    if (!r.ok) return;
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
      <section id="officials">
        <h2 className="text-xl font-semibold mb-3">Municipal Officials</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {officials.map((o)=> (
            <div key={o.position} className="border rounded-md p-4 bg-white flex items-center gap-3">
              <img src={`https://i.pravatar.cc/96?u=${encodeURIComponent(o.position)}`} alt="" className="w-14 h-14 rounded-full object-cover" />
              <div>
                <div className="font-medium">{o.name || '—'}</div>
                <div className="text-sm text-gray-600">{o.position}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="offices">
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
          <OfficeForm onClose={()=>{ setShowAdd(false); }} onSubmit={handleCreate} submittingText="Create" />
        </Modal>

        {/* Edit Office Modal */}
        <Modal open={!!showEdit} onClose={()=>setShowEdit(null)} title="Edit Office">
          {showEdit && (
            <OfficeForm office={showEdit} onClose={()=>{ setShowEdit(null); }} onSubmit={(fd)=>handleUpdate(showEdit.id, fd)} submittingText="Save" />
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

      <section id="barangays">
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
          <BarangayForm onClose={()=>setShowAddBrgy(false)} onSubmit={(fd, officials)=>handleCreateBrgy(fd, officials)} submittingText="Create" />
        </Modal>

        {/* Edit Barangay Modal */}
        <Modal open={!!showEditBrgy} onClose={()=>setShowEditBrgy(null)} title="Edit Barangay">
          {showEditBrgy && (
            <BarangayForm barangay={showEditBrgy} onClose={()=>setShowEditBrgy(null)} onSubmit={(fd, officials)=>handleUpdateBrgy(showEditBrgy.id, fd, officials)} submittingText="Save" />
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

      <section id="awards">
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
    </div>
  );
}

function BarangayForm({ barangay, onClose, onSubmit, submittingText }) {
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

function OfficeForm({ office, onClose, onSubmit, submittingText }) {
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

// handleDelete moved into component scope above to access token
