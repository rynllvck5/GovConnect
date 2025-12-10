import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Comments from '../components/Comments';
import { avatarFor } from '../utils/user';
import { getNotifications, markAllRead, unreadCount } from '../utils/notifications';
import { getEngagedThreads } from '../utils/engagements';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../config';

// Forum posts are now stored in the backend

export default function Forum() {
  const { user, token } = useAuth();
  const [posts, setPosts] = useState([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('Concern');
  const [location, setLocation] = useState('');
  const [anon, setAnon] = useState(true);
  const [q, setQ] = useState('');
  const [images, setImages] = useState([]); // data URLs
  const dialogRef = useRef(null);
  const viewRef = useRef(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [previewIndex, setPreviewIndex] = useState(null); // null => normal mode
  const locationHook = useLocation();
  const navigate = useNavigate();
  const [tab, setTab] = useState('feed'); // feed | mine | engaged | notifications
  const displayName = (user && (user.fullName || user.email)) || 'You';

  useEffect(() => {
    async function load() {
      try {
        const r = await fetch(`${API_BASE}/forum/posts`);
        if (!r.ok) return;
        const list = await r.json();
        setPosts(Array.isArray(list) ? list : []);
      } catch {}
    }
    load();
  }, []);

  // hash-based tab routing inside forum
  useEffect(() => {
    const h = (locationHook.hash || '').replace('#','');
    if (h && ['feed','mine','engaged','notifications','profile'].includes(h)) {
      setTab(h === 'profile' ? 'mine' : h);
    }
  }, [locationHook.hash]);

  const filtered = useMemo(() => {
    const text = q.trim().toLowerCase();
    if (!text) return posts.slice().sort((a,b)=>b.ts-a.ts);
    return posts
      .filter(p => (p.title + ' ' + p.message + ' ' + (p.location||'') + ' ' + (p.category||'')).toLowerCase().includes(text))
      .sort((a,b)=>b.ts-a.ts);
  }, [posts, q]);

  const submit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;
    if (!user) { navigate('/login'); return; }
    try {
      const r = await fetch(`${API_BASE}/forum/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: title.trim(), message: message.trim(), category, location: location.trim(), isAnonymous: !!anon, images }),
      });
      if (!r.ok) return;
      const listRes = await fetch(`${API_BASE}/forum/posts`);
      const list = listRes.ok ? await listRes.json() : [];
      setPosts(Array.isArray(list) ? list : []);
      setTitle(''); setMessage(''); setLocation(''); setAnon(true); setCategory('Concern'); setImages([]);
      if (dialogRef.current?.close) dialogRef.current.close();
    } catch {}
  };

  const onPickImages = async (e) => {
    const files = Array.from(e.target.files || []).slice(0,4);
    const readers = await Promise.all(files.map(f => new Promise((res) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.readAsDataURL(f);
    })));
    setImages(readers);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Community Forum</h1>
        <input
          value={q}
          onChange={(e)=>setQ(e.target.value)}
          className="w-full sm:w-64 md:w-80 border rounded-md px-3 py-2"
          placeholder="Search by title, message, category, or location..."
        />
      </div>
      <div className="flex items-center gap-2 text-sm">
        <button onClick={()=>{ setTab('feed'); window.location.hash = '#feed'; }} className={`px-3 py-1 rounded ${tab==='feed'?'bg-blue-600 text-white':'border'}`}>Feed</button>
        <button onClick={()=>{ setTab('mine'); window.location.hash = '#mine'; }} className={`px-3 py-1 rounded ${tab==='mine'?'bg-blue-600 text-white':'border'}`}>My Posts</button>
        <button onClick={()=>{ setTab('engaged'); window.location.hash = '#engaged'; }} className={`px-3 py-1 rounded ${tab==='engaged'?'bg-blue-600 text-white':'border'}`}>Engaged</button>
        <button onClick={()=>{ setTab('notifications'); window.location.hash = '#notifications'; }} className={`px-3 py-1 rounded ${tab==='notifications'?'bg-blue-600 text-white':'border'}`}>
          Notifications {unreadCount(displayName) > 0 && <span className="ml-1 inline-block bg-red-600 text-white px-1 rounded">{unreadCount(displayName)}</span>}
        </button>
      </div>

      

      <section className={tab==='feed' ? '' : 'hidden'}>
        <div className="flex justify-end">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700" onClick={()=>{ if (!user) navigate('/login'); else dialogRef.current?.showModal(); }}>Create Post</button>
        </div>
        <dialog ref={dialogRef} className="rounded-lg p-0 w-full max-w-2xl">
          <form method="dialog">
            <div className="flex justify-between items-center px-4 py-3 border-b">
              <div className="font-semibold">New Post</div>
              <button className="text-gray-600">✕</button>
            </div>
          </form>
          <form onSubmit={submit} className="space-y-3 p-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-700">Title</label>
                <input className="w-full border rounded-md px-3 py-2" value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="e.g., Potholes along Main Street" />
              </div>
              <div>
                <label className="block text-sm text-gray-700">Category</label>
                <select className="w-full border rounded-md px-3 py-2" value={category} onChange={(e)=>setCategory(e.target.value)}>
                  <option>Concern</option>
                  <option>Inquiry</option>
                  <option>Suggestion</option>
                  <option>Other</option>
                </select>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-700">Location</label>
                <input className="w-full border rounded-md px-3 py-2" value={location} onChange={(e)=>setLocation(e.target.value)} placeholder="e.g., Brgy. XYZ" />
              </div>
              <div className="flex items-center gap-3 mt-6 sm:mt-0">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={anon} onChange={(e)=>setAnon(e.target.checked)} /> Post anonymously
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-700">Message</label>
              <textarea className="w-full border rounded-md px-3 py-2" rows={4} value={message} onChange={(e)=>setMessage(e.target.value)} placeholder="Share your concern or inquiry..." />
            </div>
            <div>
              <label className="block text-sm text-gray-700">Images (optional)</label>
              <input type="file" accept="image/*" multiple onChange={onPickImages} />
              {images.length > 0 && (
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {images.map((src, i)=>(<img key={i} src={src} alt="" className="w-full h-24 object-cover rounded" />))}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" className="px-4 py-2 rounded-md border" onClick={()=>dialogRef.current?.close()}>Cancel</button>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Post</button>
            </div>
          </form>
        </dialog>
      </section>

      <section className={`space-y-4 ${tab==='feed' ? '' : 'hidden'}`}>
        {filtered.length === 0 && (
          <div className="text-sm text-gray-600">No posts yet. Be the first to post.</div>
        )}
        {filtered.map(p => (
          <article key={p.id} className="border rounded-md p-4 bg-white">
            <div className="flex items-start gap-3">
              <img src={p.avatar || avatarFor(p.author)} alt="" className="w-10 h-10 rounded-full object-cover" />
              <div className="flex-1">
                <div className="text-xs text-gray-500 flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700">{p.category}</span>
                  <span>{new Date(p.ts).toLocaleString()}</span>
                </div>
                <h2 className="font-semibold">{p.title}</h2>
                <div className="text-sm text-gray-600">By {p.author}{p.location ? ` • ${p.location}` : ''}</div>
                {Array.isArray(p.images) && p.images.length > 0 && (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {p.images.map((src,i)=>(
                      <img key={i} src={src} alt="" onClick={()=>{ setSelectedPost(p); setPreviewIndex(i); viewRef.current?.showModal(); }} className="w-full h-32 object-cover rounded cursor-pointer" />
                    ))}
                  </div>
                )}
                <Comments threadId={`forum:post:${p.id}`} ownerName={p.author} ownerUser={p.user} />
              </div>
            </div>
          </article>
        ))}
      </section>
      {/* My Posts */}
      <section className={`${tab==='mine' ? '' : 'hidden'} space-y-3`}>
        {(() => {
          if (!user) return (<div className="text-sm text-gray-600">Log in to view your posts.</div>);
          const mine = posts.filter(p => p.user_id === user.id);
          if (mine.length === 0) {
            return (
              <article className="border rounded-md p-4 bg-white">
                <div className="text-xs text-gray-500">Example • Concern • Brgy. XYZ</div>
                <h2 className="font-semibold">Example Post Title</h2>
                <div className="text-sm text-gray-600">By You</div>
                <p className="text-sm text-gray-800 mt-2">This is how your post will appear here once you create one.</p>
              </article>
            );
          }
          return mine.map(p => (
            <article key={p.id} className="border rounded-md p-4 bg-white">
              <div className="text-xs text-gray-500">{new Date(p.ts).toLocaleString()} • {p.category}{p.location?` • ${p.location}`:''}</div>
              <h2 className="font-semibold">{p.title}</h2>
              <div className="text-sm text-gray-600">By {p.author}</div>
              <p className="text-sm text-gray-800 mt-2">{p.message}</p>
            </article>
          ));
        })()}
      </section>
      {/* Engaged */}
      <section className={`${tab==='engaged' ? '' : 'hidden'} space-y-3`}>
        {(() => {
          const threads = getEngagedThreads(displayName) || [];
          const ids = new Set(threads.filter(t=>t.startsWith('comments:forum:post:')).map(t=>t.replace('comments:forum:post:','')));
          const engaged = posts.filter(p => ids.has(p.id) && (p.user || p.author) !== displayName);
          if (engaged.length === 0) return (<div className="text-sm text-gray-600">No engaged posts yet.</div>);
          return engaged.map(p => (
            <article key={p.id} className="border rounded-md p-4 bg-white">
              <div className="text-xs text-gray-500">{new Date(p.ts).toLocaleString()} • {p.category}{p.location?` • ${p.location}`:''}</div>
              <h2 className="font-semibold">{p.title}</h2>
              <div className="text-sm text-gray-600">By {p.author}</div>
              <p className="text-sm text-gray-800 mt-2">{p.message}</p>
            </article>
          ));
        })()}
      </section>
      {/* Notifications */}
      <section className={`${tab==='notifications' ? '' : 'hidden'} space-y-3`}>
        {(() => {
          const list = getNotifications(displayName) || [];
          const renderList = (arr) => (
            <>
              <div className="flex justify-end">
                <button onClick={()=>{ markAllRead(displayName); window.location.reload(); }} className="text-sm px-3 py-1.5 rounded border">Mark all read</button>
              </div>
              {arr.map(n => (
                <div key={n.id} className={`border rounded-md p-3 ${n.read ? 'bg-white' : 'bg-blue-50'}`}>
                  <div className="text-xs text-gray-500">{new Date(n.ts).toLocaleString()}</div>
                  <div className="text-sm text-gray-800">{n.message}</div>
                </div>
              ))}
            </>
          );
          if (list.length === 0) {
            const sample = [
              { id: 'sample1', ts: Date.now(), read: false, message: 'Someone commented on your post: Example Post Title' },
              { id: 'sample2', ts: Date.now()-3600000, read: true, message: 'Someone replied to your comment' }
            ];
            return renderList(sample);
          }
          return renderList(list);
        })()}
      </section>
      {/* Post View Modal */}
      <dialog ref={viewRef} className="rounded-lg p-0 w-full max-w-3xl">
        {selectedPost && (
          <div>
            <div className="flex justify-between items-center px-4 py-3 border-b">
              <div className="font-semibold">Post</div>
              <button className="text-gray-600" onClick={()=>{ setSelectedPost(null); setPreviewIndex(null); viewRef.current?.close(); }}>✕</button>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-start gap-3">
                <img src={selectedPost.avatar || avatarFor(selectedPost.author)} alt="" className="w-10 h-10 rounded-full object-cover" />
                <div className="flex-1">
                  <div className="text-xs text-gray-500">{new Date(selectedPost.ts).toLocaleString()} • {selectedPost.category}{selectedPost.location?` • ${selectedPost.location}`:''}</div>
                  <h2 className="font-semibold">{selectedPost.title}</h2>
                  <div className="text-sm text-gray-600">By {selectedPost.author}</div>
                  <p className="text-sm text-gray-800 mt-2">{selectedPost.message}</p>
                </div>
              </div>
              {Array.isArray(selectedPost.images) && selectedPost.images.length > 0 && (
                previewIndex === null ? (
                  <div className="max-h-[70vh] overflow-auto space-y-2">
                    {selectedPost.images.map((src,i)=>(
                      <img key={i} src={src} alt="" onClick={()=>setPreviewIndex(i)} className="w-full h-auto object-contain cursor-zoom-in" />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center justify-between w-full">
                      <button className="px-3 py-1.5 rounded border" onClick={()=>setPreviewIndex(null)}>Back</button>
                      <div className="text-sm text-gray-600">Image {previewIndex+1} of {selectedPost.images.length}</div>
                    </div>
                    <div className="relative w-full flex items-center justify-center" style={{minHeight:'50vh'}}>
                      <button className="absolute left-0 px-3 py-2 bg-white/80 rounded" onClick={()=>setPreviewIndex((previewIndex-1+selectedPost.images.length)%selectedPost.images.length)}>‹</button>
                      <img src={selectedPost.images[previewIndex]} alt="" style={{maxWidth:'100%', maxHeight:'80vh', objectFit:'contain'}} />
                      <button className="absolute right-0 px-3 py-2 bg-white/80 rounded" onClick={()=>setPreviewIndex((previewIndex+1)%selectedPost.images.length)}>›</button>
                    </div>
                  </div>
                )
              )}
              <Comments threadId={`forum:post:${selectedPost.id}`} ownerName={selectedPost.author} ownerUser={selectedPost.user} />
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
}
