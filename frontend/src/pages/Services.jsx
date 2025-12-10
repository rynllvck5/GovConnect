import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE, API_ORIGIN } from '../config';
import Modal from '../components/Modal';

export default function Services() {
  const { user, token } = useAuth();
  const isAdmin = !!user && (user.role === 'admin' || user.role === 'superadmin');
  const myOfficeId = user?.officeId || user?.office_id || null;

  const [query, setQuery] = useState('');
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [officeFilter, setOfficeFilter] = useState('All');
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(null); // service object
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [errorDialog, setErrorDialog] = useState({ open: false, title: '', message: '' });

  async function loadServices() {
    setLoading(true); setError('');
    try {
      const r = await fetch(`${API_BASE}/services`);
      if (!r.ok) throw new Error('Failed loading services');
      const list = await r.json();
      setServices(Array.isArray(list) ? list : []);
    } catch(e) { setError(e.message || 'Error'); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadServices(); }, []);

  const offices = useMemo(() => Array.from(new Set(services.map(s => s.office_name))).sort(), [services]);
  const filtered = useMemo(() => services
    .filter(s => s.name.toLowerCase().includes(query.toLowerCase()))
    .filter(s => officeFilter === 'All' || s.office_name === officeFilter), [services, query, officeFilter]);

  const canEdit = (svc) => isAdmin || (!!user && user.role === 'officer' && myOfficeId && (Number(myOfficeId) === Number(svc.office_id)));

  async function handleCreate(fd) {
    const r = await fetch(`${API_BASE}/services`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
    if (!r.ok) {
      if (r.status === 409) {
        let msg = 'A service with this name already exists.';
        try {
          const data = await r.json();
          if (data && data.error) msg = data.error;
        } catch {}
        throw new Error(msg);
      }
      throw new Error('Failed to save service');
    }
    await loadServices();
  }
  async function handleUpdate(id, fd) {
    const r = await fetch(`${API_BASE}/services/${id}`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: fd });
    if (!r.ok) throw new Error('Failed to update service');
    await loadServices();
  }
  async function confirmDelete() {
    if (!deleteTarget) return;
    await fetch(`${API_BASE}/services/${deleteTarget.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setDeleteTarget(null);
    await loadServices();
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Government Services</h1>
      </div>
      <div className="flex flex-col md:flex-row md:items-center gap-2 mb-4">
        <input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search services..." className="flex-1 border rounded-md px-3 py-2" />
        <select value={officeFilter} onChange={(e)=>setOfficeFilter(e.target.value)} className="md:w-48 border rounded-md px-3 py-2">
          <option>All</option>
          {offices.map(o => (<option key={o}>{o}</option>))}
        </select>
        <button onClick={()=>{ setQuery(''); setOfficeFilter('All'); }} className="px-3 py-2 border rounded-md">Clear</button>
        {(isAdmin || user?.role === 'officer') && (
          <button onClick={()=>setShowAdd(true)} className="px-3 py-2 border rounded-md bg-white">Add Service</button>
        )}
      </div>
      {loading && <div className="text-sm text-gray-600">Loading services...</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}
      <div className="columns-1 md:columns-2 gap-x-4">
        {filtered.map((svc) => (
          <div key={svc.id} className="mb-4 break-inside-avoid" style={{ breakInside: 'avoid' }}>
            <details className="w-full border rounded-md p-4 bg-white">
              <summary className="font-medium cursor-pointer flex items-center justify-between">
                <span>{svc.name} <span className="text-sm text-gray-500">— {svc.office_name}</span></span>
                <span className="text-gray-500">›</span>
              </summary>
              <div className="mt-3 text-sm text-gray-700 space-y-2">
                {canEdit(svc) && (
                  <div className="flex gap-2 justify-end mb-2">
                    <button onClick={()=>setShowEdit(svc)} className="text-xs px-2 py-1 rounded bg-yellow-500 text-white">Edit</button>
                    <button onClick={()=>setDeleteTarget(svc)} className="text-xs px-2 py-1 rounded bg-red-600 text-white">Delete</button>
                  </div>
                )}
                {svc.description && <p className="mb-2">{svc.description}</p>}
                <div className="mb-2">
                  <span className="font-medium">Office:</span> <Link className="text-blue-700 hover:underline" to={`/government/offices/${svc.office_slug || svc.office_id}#map`}>{svc.office_name}</Link>
                </div>
                {svc.venue && <div className="mb-2"><span className="font-medium">Venue/Place:</span> {svc.venue} (<Link className="text-blue-700 hover:underline" to={`/government/offices/${svc.office_slug || svc.office_id}#map`}>view on office map</Link>)</div>}
                {svc.contact && <div className="mb-2"><span className="font-medium">Contact:</span> {svc.contact}</div>}
                {Array.isArray(svc.requirements) && svc.requirements.length > 0 && (
                  <div className="mb-2">
                    <div className="font-medium">Requirements</div>
                    <ul className="list-disc ml-5">
                      {svc.requirements.map((r,i)=>(<li key={i}>{r}</li>))}
                    </ul>
                  </div>
                )}
                {Array.isArray(svc.forms) && svc.forms.length > 0 && (
                  <div className="mb-2">
                    <div className="font-medium">Downloadable Forms</div>
                    <ul className="list-disc ml-5">
                      {svc.forms.map((f, i) => (
                        <li key={i}><a className="text-blue-700 hover:underline" href={`${API_ORIGIN}${f.url}`} download>{f.label || `Form ${i+1}`}</a></li>
                      ))}
                    </ul>
                  </div>
                )}
                {Array.isArray(svc.steps) && svc.steps.length > 0 && (
                  <div>
                    <div className="font-medium">Step-by-step Process</div>
                    <ol className="list-decimal ml-5">
                      {svc.steps.map((st,i)=>(<li key={i}>{st}</li>))}
                    </ol>
                  </div>
                )}
              </div>
            </details>
          </div>
        ))}
      </div>

      {/* Add Service Modal */}
      <Modal open={!!showAdd} onClose={()=>setShowAdd(false)} title="Add Service">
        <ServiceForm
          onClose={()=>setShowAdd(false)}
          onSubmit={handleCreate}
          submittingText="Create"
          isAdmin={isAdmin}
          onError={(msg)=>setErrorDialog({ open: true, title: 'Service Error', message: msg })}
        />
      </Modal>

      {/* Edit Service Modal */}
      <Modal open={!!showEdit} onClose={()=>setShowEdit(null)} title="Edit Service">
        {showEdit && (
          <ServiceForm
            service={showEdit}
            onClose={()=>setShowEdit(null)}
            onSubmit={(fd)=>handleUpdate(showEdit.id, fd)}
            submittingText="Save"
            isAdmin={isAdmin}
            onError={(msg)=>setErrorDialog({ open: true, title: 'Service Error', message: msg })}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={!!deleteTarget} onClose={()=>setDeleteTarget(null)} title="Delete Service">
        <div className="space-y-4">
          <p className="text-sm text-gray-700">Are you sure you want to delete <span className="font-medium">{deleteTarget?.name}</span>? This action cannot be undone.</p>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={()=>setDeleteTarget(null)} className="px-4 py-2 rounded-md border">Cancel</button>
            <button type="button" onClick={confirmDelete} className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700">Delete</button>
          </div>
        </div>
      </Modal>
      {/* Error Modal */}
      <Modal open={errorDialog.open} onClose={()=>setErrorDialog({ open: false, title: '', message: '' })} title={errorDialog.title || 'Error'}>
        <div className="space-y-3">
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{errorDialog.message}</div>
          <div className="flex justify-end">
            <button type="button" onClick={()=>setErrorDialog({ open: false, title: '', message: '' })} className="px-4 py-2 rounded-md border">Close</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function ServiceForm({ service, onClose, onSubmit, submittingText, isAdmin, onError }) {
  const { user } = useAuth();
  const [name, setName] = useState(service?.name || '');
  const [description, setDescription] = useState(service?.description || '');
  const [venue, setVenue] = useState(service?.venue || '');
  const [contact, setContact] = useState(service?.contact || '');
  const [requirements, setRequirements] = useState(Array.isArray(service?.requirements) ? service.requirements : []);
  const [steps, setSteps] = useState(Array.isArray(service?.steps) ? service.steps : []);
  const [files, setFiles] = useState([]); // [{file: File, label: string}]
  const [offices, setOffices] = useState([]);
  const [officeId, setOfficeId] = useState(service?.office_id || (user?.officeId || user?.office_id) || '');
  const [existingForms, setExistingForms] = useState(Array.isArray(service?.forms) ? service.forms : []);
  const [keep, setKeep] = useState(() => existingForms.map(() => true));
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadOffices() {
      if (!isAdmin) return;
      const r = await fetch(`${API_BASE}/offices`);
      if (r.ok) setOffices(await r.json());
    }
    loadOffices();
  }, [isAdmin]);

  function addRequirement() { setRequirements(prev => [...prev, '']); }
  function removeRequirement(idx) { setRequirements(prev => prev.filter((_, i) => i !== idx)); }
  function updateRequirement(idx, val) { setRequirements(prev => prev.map((v,i) => i===idx ? val : v)); }
  function addStep() { setSteps(prev => [...prev, '']); }
  function removeStep(idx) { setSteps(prev => prev.filter((_, i) => i !== idx)); }
  function updateStep(idx, val) { setSteps(prev => prev.map((v,i) => i===idx ? val : v)); }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData();
      if (!service) fd.append('name', name.trim()); else if (name && name !== service.name) fd.append('name', name.trim());
      if (description !== (service?.description || '')) fd.append('description', description);
      if (venue !== (service?.venue || '')) fd.append('venue', venue);
      if (contact !== (service?.contact || '')) fd.append('contact', contact);
      const reqs = (requirements || []).map(s => String(s).trim()).filter(Boolean);
      const stps = (steps || []).map(s => String(s).trim()).filter(Boolean);
      fd.append('requirements', JSON.stringify(reqs));
      fd.append('steps', JSON.stringify(stps));

      if (isAdmin) {
        fd.append('office_id', String(officeId || ''));
      }

      if (files && files.length) {
        files.forEach((item) => fd.append('forms', item.file));
        fd.append('formLabels', JSON.stringify(files.map(item => item.label || (item.file?.name || 'Form'))));
      }
      if (service) {
        const kept = existingForms.filter((_, idx) => keep[idx]);
        fd.append('formsExisting', JSON.stringify(kept));
      }

      await onSubmit(fd);
      onClose();
    } catch (e) {
      onError?.(e.message || 'Failed to save service');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-1 sm:p-2">
      <div>
        <label className="block text-sm text-gray-700">Service Name</label>
        <input value={name} onChange={(e)=>setName(e.target.value)} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
      </div>
      {isAdmin && (
        <div>
          <label className="block text-sm text-gray-700">Office</label>
          <select value={officeId} onChange={(e)=>setOfficeId(e.target.value)} className="w-full border rounded-md px-3 py-2">
            <option value="">Select office…</option>
            {offices.map(o => (<option key={o.id} value={o.id}>{o.name}</option>))}
          </select>
        </div>
      )}
      <div>
        <label className="block text-sm text-gray-700">Description</label>
        <textarea value={description} onChange={(e)=>setDescription(e.target.value)} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" rows={3} />
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-gray-700">Venue/Place</label>
          <input value={venue} onChange={(e)=>setVenue(e.target.value)} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., Office of the Mayor. Floor #3" />
        </div>
        <div>
          <label className="block text-sm text-gray-700">Contact</label>
          <input value={contact} onChange={(e)=>setContact(e.target.value)} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Phone or email" />
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm text-gray-700">Requirements</label>
          <button type="button" onClick={addRequirement} className="text-xs px-2 py-1 rounded-md border bg-white">Add</button>
        </div>
        <div className="space-y-2">
          {requirements.map((r, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input value={r} onChange={(e)=>updateRequirement(idx, e.target.value)} className="flex-1 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button type="button" onClick={()=>removeRequirement(idx)} className="text-xs px-2 py-1 rounded-md border bg-white">−</button>
            </div>
          ))}
          {requirements.length === 0 && (
            <div className="text-xs text-gray-500">No requirements yet. Click Add to include one.</div>
          )}
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm text-gray-700">Steps</label>
          <button type="button" onClick={addStep} className="text-xs px-2 py-1 rounded-md border bg-white">Add</button>
        </div>
        <div className="space-y-2">
          {steps.map((s, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input value={s} onChange={(e)=>updateStep(idx, e.target.value)} className="flex-1 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button type="button" onClick={()=>removeStep(idx)} className="text-xs px-2 py-1 rounded-md border bg-white">−</button>
            </div>
          ))}
          {steps.length === 0 && (
            <div className="text-xs text-gray-500">No steps yet. Click Add to include one.</div>
          )}
        </div>
      </div>
      <div>
        <label className="block text-sm text-gray-700">Upload Forms (optional)</label>
        <div className="mt-1">
          <input id="forms-upload" type="file" multiple onChange={(e)=>{
            const arr = Array.from(e.target.files || []).map(f => ({ file: f, label: '' }));
            setFiles(prev => (prev || []).concat(arr));
          }} className="sr-only" />
          <label htmlFor="forms-upload" className="inline-flex items-center px-3 py-2 rounded-md border text-sm bg-white hover:bg-gray-50 cursor-pointer">Choose Files</label>
          {files.length > 0 && (
            <div className="mt-3 space-y-2">
              {files.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <span className="text-xs text-gray-700 truncate max-w-[14rem]">{item.file?.name}</span>
                  <input value={item.label} onChange={(e)=>setFiles(prev => prev.map((it,i)=> i===idx? { ...it, label: e.target.value } : it))} placeholder="Label" className="flex-1 border rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {service && existingForms.length > 0 && (
        <div>
          <label className="block text-sm text-gray-700">Existing Forms</label>
          <ul className="text-sm space-y-1">
            {existingForms.map((f, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <input type="checkbox" checked={keep[idx]} onChange={(e)=>setKeep(prev => prev.map((v,i)=> i===idx? e.target.checked : v))} />
                <a className="text-blue-700 hover:underline" href={`${API_ORIGIN}${f.url}`} target="_blank" rel="noreferrer">{f.label || `Form ${idx+1}`}</a>
              </li>
            ))}
          </ul>
          <div className="text-xs text-gray-600 mt-1">Uncheck to remove from this service.</div>
        </div>
      )}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} className="px-4 py-2 rounded-md border">Cancel</button>
        <button disabled={submitting} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">{submitting ? 'Saving...' : submittingText}</button>
      </div>
    </form>
  );
}
