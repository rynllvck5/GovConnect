import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { API_BASE, API_ORIGIN } from '../config';
import { useAuth } from '../context/AuthContext';
import Comments from '../components/Comments';

export default function ProjectDetail() {
  const { slug } = useParams();
  const { user, token } = useAuth();
  const isAdmin = !!user && (user.role === 'admin' || user.role === 'superadmin');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [proj, setProj] = useState(null);
  const [editing, setEditing] = useState(false);
  const [detailsText, setDetailsText] = useState('');
  const fileRef = useRef(null);
  const replaceRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [paused, setPaused] = useState(false);
  const [page, setPage] = useState(0);
  const [replaceIndex, setReplaceIndex] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Compute content and gallery related values early so hooks below can run every render
  const rawContent = proj?.content_json;
  const content = useMemo(() => rawContent || {}, [rawContent]);
  const title = proj?.title || '—';
  const hero = proj?.image_url || null;
  const details = content.details || content.body || '';
  const gallery = useMemo(() => (
    Array.isArray(content.gallery) ? content.gallery : []
  ), [content]);

  // Build frames that slide by 1 image but show up to 5 at a time
  const visibleCount = Math.min(5, gallery.length || 0);
  const doSlide = (gallery?.length || 0) > 4;
  const frames = useMemo(() => {
    if (!doSlide || !gallery || !gallery.length) return [];
    const n = gallery.length;
    const count = Math.min(5, n);
    const fr = [];
    for (let i = 0; i < n; i++) {
      const items = [];
      for (let k = 0; k < count; k++) items.push(gallery[(i + k) % n]);
      fr.push(items);
    }
    return fr;
  }, [gallery, doSlide]);
  const frameCount = frames.length || 0;
  // Duplicate frames to allow seamless wrap during continuous motion
  const renderFrames = useMemo(() => (frameCount ? frames.concat(frames) : []), [frames, frameCount]);
  const gridColsClass = visibleCount >= 5 ? 'grid-cols-5' : visibleCount === 4 ? 'grid-cols-4' : visibleCount === 3 ? 'grid-cols-3' : visibleCount === 2 ? 'grid-cols-2' : 'grid-cols-1';

  // Continuous motion using requestAnimationFrame (frames per second speed)
  useEffect(() => {
    if (!doSlide || frameCount <= 1) return;
    let raf = 0;
    let last = performance.now();
    const speed = 0.15; // frames per second (slower)
    const loop = (t) => {
      const dt = Math.max(0, (t - last) / 1000);
      last = t;
      if (!paused) {
        setPage((p) => {
          let next = p + speed * dt;
          if (next >= frameCount) next -= frameCount;
          if (next < 0) next += frameCount;
          return next;
        });
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [doSlide, frameCount, paused]);

  useEffect(() => {
    let alive = true;
    setLoading(true); setError(''); setProj(null);
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/projects/${encodeURIComponent(slug)}`);
        if (!r.ok) throw new Error('Not found');
        const data = await r.json();
        if (!alive) return;
        setProj(data);
        const c = (data && data.content_json) || {};
        setDetailsText(String(c.details || c.body || ''));
      } catch (e) {
        if (!alive) return; setError(e.message || 'Error');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-6"><div className="text-sm text-gray-600">Loading...</div></div>
    );
  }
  if (error || !proj) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="text-xl font-semibold mb-2">Project not found</div>
        <Link to="/projects" className="text-blue-700 hover:underline">Back to Projects</Link>
      </div>
    );
  }

  async function saveDetails() {
    try {
      const next = { ...content, details: detailsText };
      const fd = new FormData();
      fd.append('content', JSON.stringify(next));
      const r = await fetch(`${API_BASE}/projects/${proj.id}`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: fd });
      if (!r.ok) {
        const e = await r.json().catch(()=>({}));
        throw new Error(e.error || 'Failed to save');
      }
      setProj(prev => prev ? { ...prev, content_json: next } : prev);
      setEditing(false);
    } catch (e) { alert(e.message || 'Failed to save'); }
  }

  async function uploadImages(files) {
    if (!files || !files.length) return;
    setUploading(true); setUploadError('');
    try {
      const fd = new FormData();
      Array.from(files).forEach(f => fd.append('images', f));
      const r = await fetch(`${API_BASE}/uploads/projects`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
      if (!r.ok) {
        const e = await r.json().catch(()=>({}));
        throw new Error(e.error || 'Failed to upload');
      }
      const data = await r.json();
      const urls = Array.isArray(data.urls) ? data.urls : [];
      const next = { ...content, gallery: [...(gallery || []), ...urls] };
      const fd2 = new FormData();
      fd2.append('content', JSON.stringify(next));
      const r2 = await fetch(`${API_BASE}/projects/${proj.id}`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: fd2 });
      if (!r2.ok) {
        const e2 = await r2.json().catch(()=>({}));
        throw new Error(e2.error || 'Failed to save images');
      }
      setProj(prev => prev ? { ...prev, content_json: next } : prev);
    } catch (e) {
      setUploadError(e.message || 'Upload failed');
    } finally { setUploading(false); }
  }

  async function replaceImage(files) {
    if (!files || !files.length || replaceIndex == null) return;
    setUploading(true); setUploadError('');
    try {
      const fd = new FormData();
      fd.append('images', files[0]);
      const r = await fetch(`${API_BASE}/uploads/projects`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
      if (!r.ok) {
        const e = await r.json().catch(()=>({}));
        throw new Error(e.error || 'Failed to upload');
      }
      const data = await r.json();
      const url = (Array.isArray(data.urls) ? data.urls[0] : null);
      if (!url) throw new Error('Upload failed');
      const nextGallery = [...(gallery || [])];
      nextGallery[replaceIndex] = url;
      const next = { ...content, gallery: nextGallery };
      const fd2 = new FormData();
      fd2.append('content', JSON.stringify(next));
      const r2 = await fetch(`${API_BASE}/projects/${proj.id}`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: fd2 });
      if (!r2.ok) {
        const e2 = await r2.json().catch(()=>({}));
        throw new Error(e2.error || 'Failed to save image');
      }
      setProj(prev => prev ? { ...prev, content_json: next } : prev);
    } catch (e) {
      setUploadError(e.message || 'Edit failed');
    } finally {
      setReplaceIndex(null);
      if (replaceRef.current) replaceRef.current.value = '';
      setUploading(false);
    }
  }

  async function removeImage(url) {
    if (!url) return;
    setUploading(true); setUploadError('');
    try {
      const next = { ...content, gallery: (gallery || []).filter(u => u !== url) };
      const fd2 = new FormData();
      fd2.append('content', JSON.stringify(next));
      const r2 = await fetch(`${API_BASE}/projects/${proj.id}`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: fd2 });
      if (!r2.ok) {
        const e2 = await r2.json().catch(()=>({}));
        throw new Error(e2.error || 'Failed to delete image');
      }
      setProj(prev => prev ? { ...prev, content_json: next } : prev);
    } catch (e) {
      setUploadError(e.message || 'Delete failed');
    } finally { setUploading(false); }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/projects" className="text-blue-700 hover:underline text-sm">← Back to Projects</Link>
      <article className="mt-3 border rounded-md overflow-hidden bg-white">
        {hero && <img src={`${String(hero).match(/^https?:|^data:/) ? String(hero) : API_ORIGIN + String(hero)}`} alt="" className="w-full h-56 object-cover" />}
        <div className="p-4">
          <div className="text-xs text-gray-500">{proj.department} • {proj.start_date || '—'} – {proj.end_date || '—'}</div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          <div className="mt-2 flex items-center gap-4 text-sm">
            <div className="font-medium">Budget:</div>
            <div>₱{Number(proj.budget || 0).toLocaleString()}</div>
            <div className="font-medium ml-4">Status:</div>
            <div><span className={`px-2 py-1 rounded text-xs ${proj.status === 'Ongoing' ? 'bg-yellow-100 text-yellow-800' : proj.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{proj.status || '—'}</span></div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-medium">Images</h2>
              {isAdmin && (
                <div className="flex items-center gap-2">
                  <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e)=>{ const fl = e.target.files; if (fl && fl.length) uploadImages(fl); e.target.value=''; }} />
                  <input ref={replaceRef} type="file" accept="image/*" className="hidden" onChange={(e)=>{ const fl = e.target.files; if (fl && fl.length) replaceImage(fl); }} />
                  <button onClick={()=>fileRef.current?.click()} className={`text-sm px-3 py-1.5 rounded-md border bg-white ${uploading ? 'opacity-75 cursor-not-allowed' : 'hover:bg-gray-50'}`} disabled={uploading}>
                    {uploading ? 'Uploading...' : 'Add images'}
                  </button>
                </div>
              )}
            </div>
            {uploadError && <div className="text-sm text-red-600 mb-2">{uploadError}</div>}
            {doSlide && renderFrames.length > 0 ? (
              <div className="relative" onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)}>
                <div className="overflow-hidden rounded-md border">
                  <div className="flex will-change-transform" style={{ transform: `translateX(-${page * 100}%)` }}>
                    {renderFrames.map((imgs, idx) => (
                      <div key={idx} className="w-full flex-shrink-0 p-2">
                        <div className={`grid ${gridColsClass} gap-2`}>
                          {imgs.map((u, i) => (
                            <div key={i} className="relative">
                              <img onClick={()=>setPreviewUrl(u)} src={`${String(u).match(/^https?:|^data:/) ? String(u) : API_ORIGIN + String(u)}`} alt="" className="h-40 w-full object-cover rounded cursor-pointer" />
                              {isAdmin && (
                                <div className="absolute top-1 right-1 flex gap-1">
                                  <button onClick={()=>{ const base = idx % (gallery?.length || 1); setReplaceIndex((base + i) % (gallery?.length || 1)); replaceRef.current?.click(); }} className="px-2 py-0.5 text-xs bg-white text-gray-700 rounded shadow hover:bg-gray-50">Replace</button>
                                  <button onClick={()=>removeImage(u)} className="px-2 py-0.5 text-xs bg-red-600 text-white rounded shadow hover:bg-red-700">Delete</button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {frameCount > 1 && (
                  <>
                    <button onClick={()=>setPage((p)=> (p - 1 + frameCount) % frameCount)} className="absolute inset-y-0 left-0 m-2 px-2 py-3 bg-white/40 hover:bg-white text-gray-700 rounded-md shadow transition-colors">Prev</button>
                    <button onClick={()=>setPage((p)=> (p + 1) % frameCount)} className="absolute inset-y-0 right-0 m-2 px-2 py-3 bg-white/40 hover:bg-white text-gray-700 rounded-md shadow transition-colors">Next</button>
                  </>
                )}
              </div>
            ) : (
              <div className="p-2">
                {gallery && gallery.length ? (
                  <div className={`grid ${gridColsClass} gap-2`}>
                    {gallery.map((u, i) => (
                      <div key={i} className="relative">
                        <img onClick={()=>setPreviewUrl(u)} src={`${String(u).match(/^https?:|^data:/) ? String(u) : API_ORIGIN + String(u)}`} alt="" className="h-40 w-full object-cover rounded cursor-pointer" />
                        {isAdmin && (
                          <div className="absolute top-1 right-1 flex gap-1">
                            <button onClick={()=>{ setReplaceIndex(i); replaceRef.current?.click(); }} className="px-2 py-0.5 text-xs bg-white text-gray-700 rounded shadow hover:bg-gray-50">Replace</button>
                            <button onClick={()=>removeImage(u)} className="px-2 py-0.5 text-xs bg-red-600 text-white rounded shadow hover:bg-red-700">Delete</button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border rounded-md p-6 text-sm text-gray-500 text-center">No images yet.</div>
                )}
              </div>
            )}
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Details</h2>
              {isAdmin && !editing && (
                <button onClick={()=>{ setEditing(true); setDetailsText(details || ''); }} className="text-sm px-3 py-1.5 rounded-md border bg-white hover:bg-gray-50">{details ? 'Edit' : 'Add'} description</button>
              )}
            </div>
            {!editing ? (
              details ? (
                <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{details}</p>
              ) : (
                <p className="text-sm text-gray-500 mt-2 italic">Click edit to add description</p>
              )
            ) : (
              <div className="mt-2 space-y-2">
                <textarea value={detailsText} onChange={(e)=>setDetailsText(e.target.value)} rows={6} className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Write detailed information about this project..." />
                <div className="flex items-center gap-2 justify-end">
                  <button onClick={()=>{ setEditing(false); setDetailsText(details || ''); }} className="px-3 py-1.5 rounded-md border">Cancel</button>
                  <button onClick={saveDetails} className="px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700">Save</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </article>
      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={()=>setPreviewUrl(null)}>
          <div className="absolute inset-0 bg-black/70" />
          <div className="relative max-w-4xl max-h-[90vh] p-2">
            <img src={`${String(previewUrl).match(/^https?:|^data:/) ? String(previewUrl) : API_ORIGIN + String(previewUrl)}`} alt="" className="max-h-[85vh] rounded shadow-lg" />
            <button className="absolute -top-3 -right-3 bg-white rounded-full w-8 h-8 shadow" onClick={(e)=>{ e.stopPropagation(); setPreviewUrl(null); }}>×</button>
          </div>
        </div>
      )}
      <Comments threadId={`project:${proj.slug}`} title="Discussions & Inquiries" />
    </div>
  );
}
