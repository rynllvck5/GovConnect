import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import { API_BASE } from '../../config';

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Textarea' },
  { value: 'richtext', label: 'Rich Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'link', label: 'Link' },
  { value: 'image', label: 'Image' },
  { value: 'file', label: 'File' },
  { value: 'images', label: 'Images' },
  { value: 'files', label: 'Files' },
  { value: 'gallery', label: 'Gallery' },
];

function InfoIcon({ text }) {
  const ref = useRef(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  function calcPos() {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const top = r.bottom + 8; // below icon
    const left = Math.min(Math.max(r.left - 140 + r.width / 2, 8), window.innerWidth - 320 - 8);
    setPos({ top, left });
  }
  useEffect(() => {
    if (!open) return;
    calcPos();
    const onScroll = () => calcPos();
    const onResize = () => calcPos();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('scroll', onScroll, true); window.removeEventListener('resize', onResize); };
  }, [open]);
  return (
    <span ref={ref} className="relative inline-flex items-center align-middle">
      <button type="button" onMouseEnter={()=>setOpen(true)} onMouseLeave={()=>setOpen(false)} className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-gray-300 text-gray-600 bg-white text-[10px] leading-none">i</button>
      {open && createPortal(
        <div style={{ position: 'fixed', top: pos.top, left: pos.left }} className="z-[1000] bg-white text-gray-700 text-xs rounded px-3 py-2 w-[320px] border border-gray-200 shadow-md leading-snug">
          {text}
        </div>,
        document.body
      )}
    </span>
  );
}

const sanitizeSlug = (s) => String(s || '')
  .toLowerCase()
  .replace(/[^a-z0-9-]/g, '')
  .replace(/-+/g, '-');
const sanitizeKey = (s) => String(s || '')
  .toLowerCase()
  .replace(/[^a-z0-9_-]/g, '')
  .replace(/_+/g, '_')
  .replace(/-+/g, '-');

export default function CategoryForm({ category, onClose, onSaved }) {
  const isEdit = !!category;
  const { token } = useAuth();
  const [title, setTitle] = useState(category?.title || '');
  const [slug, setSlug] = useState(category?.slug || '');
  const [description, setDescription] = useState(category?.description || '');
  const [fields, setFields] = useState(() => Array.isArray(category?.schema_json?.fields) ? category.schema_json.fields : []);
  const layout = category?.layout_json || { style: 'list' };
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState({ kind: null, text: '' });

  function addField() {
    setFields(prev => [...prev, { key: '', label: '', type: 'text', required: false }]);
  }
  function removeField(idx) {
    setFields(prev => prev.filter((_, i) => i !== idx));
  }
  function moveField(idx, dir) {
    setFields(prev => {
      const to = idx + dir;
      if (to < 0 || to >= prev.length) return prev;
      const copy = prev.slice();
      const [item] = copy.splice(idx, 1);
      copy.splice(to, 0, item);
      return copy;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        slug: slug.trim() || undefined,
        description: description || null,
        schema: { fields: fields.map(f => ({ key: String(f.key).trim(), label: String((f.label ?? '')).trim(), type: f.type, required: !!f.required })) },
        layout,
      };
      // client-side validation for friendlier errors
      if (payload.slug && !/^[a-z0-9-]+$/.test(payload.slug)) {
        throw new Error('Link name can only contain lowercase letters, numbers, and hyphens.');
      }
      for (const f of payload.schema.fields) {
        if (!/^[a-z0-9_-]+$/.test(f.key)) {
          throw new Error(`Invalid Field ID: ${f.key}. Use lowercase letters, numbers, hyphens or underscores.`);
        }
      }
      const url = isEdit ? `${API_BASE}/gov/categories/${category.id}` : `${API_BASE}/gov/categories`;
      const method = isEdit ? 'PUT' : 'POST';
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!r.ok) {
        const e = await r.json().catch(()=>({}));
        throw new Error(e.error || 'Failed to save category');
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-1 sm:p-2">
      <div>
        <label className="block text-sm text-gray-700">Title</label>
        <input value={title} onChange={(e)=>setTitle(e.target.value)} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
      </div>
      <div>
        <label className="block text-sm text-gray-700">Link name (optional) <InfoIcon text="A short URL-friendly name used in links. Use lowercase letters, numbers, and hyphens only. Example: executive-orders" /></label>
        <input value={slug} onChange={(e)=>setSlug(sanitizeSlug(e.target.value))} pattern="^[a-z0-9-]*$" className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="auto if empty" />
      </div>
      <div>
        <label className="block text-sm text-gray-700">Description</label>
        <textarea value={description} onChange={(e)=>setDescription(e.target.value)} rows={2} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">Fields (information to collect)</label>
          <button type="button" onClick={addField} className="text-xs px-2 py-1 rounded-md border bg-white">Add Field</button>
        </div>
        <div className="space-y-3">
          {fields.map((f, idx) => (
            <div key={idx} className="border rounded-md p-3">
              <div className="grid sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs text-gray-700">Field ID <InfoIcon text="Internal field name. Keep it short and unique. Use lowercase letters, numbers, hyphens or underscores only. Example: document_number" /></label>
                  <input value={f.key} onChange={(e)=>setFields(prev=>prev.map((x,i)=> i===idx?{...x,key:sanitizeKey(e.target.value)}:x))} pattern="^[a-z0-9_-]*$" className="w-full border rounded-md px-2 py-1 text-sm" placeholder="e.g., document_number" />
                </div>
                <div>
                  <label className="block text-xs text-gray-700">Display Name <InfoIcon text="The name shown to users on the page and in forms. Example: Executive Order Number" /></label>
                  <input value={f.label} onChange={(e)=>setFields(prev=>prev.map((x,i)=> i===idx?{...x,label:e.target.value}:x))} className="w-full border rounded-md px-2 py-1 text-sm" placeholder="e.g., Executive Order Number" />
                </div>
                <div>
                  <label className="block text-xs text-gray-700">Field Type <InfoIcon text="The kind of input for this field (Text, Textarea, Number, Date, Link, Image, File, Images/Files). This controls how it is filled and displayed." /></label>
                  <select value={f.type} onChange={(e)=>setFields(prev=>prev.map((x,i)=> i===idx?{...x,type:e.target.value}:x))} className="w-full border rounded-md px-2 py-1 text-sm">
                    {FIELD_TYPES.map(t => (<option key={t.value} value={t.value}>{t.label}</option>))}
                  </select>
                </div>
                <div className="flex items-end">
                  <label className="inline-flex items-center gap-2 text-xs text-gray-700">
                    <input type="checkbox" checked={!!f.required} onChange={(e)=>setFields(prev=>prev.map((x,i)=> i===idx?{...x,required:e.target.checked}:x))} /> Required <InfoIcon text="If checked, this field must be filled when creating or editing an entry." />
                  </label>
                </div>
              </div>
              <div className="flex justify-between mt-2">
                <div className="flex gap-2">
                  <button type="button" onClick={()=>moveField(idx,-1)} className="text-xs px-2 py-1 rounded-md border bg-white" aria-label="Move up">↑</button>
                  <button type="button" onClick={()=>moveField(idx,1)} className="text-xs px-2 py-1 rounded-md border bg-white" aria-label="Move down">↓</button>
                </div>
                <button type="button" onClick={()=>removeField(idx)} className="text-xs px-2 py-1 rounded-md border bg-white text-red-700">Remove</button>
              </div>
            </div>
          ))}
          {fields.length === 0 && <div className="text-xs text-gray-500">No fields yet. Click Add Field.</div>}
        </div>
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
