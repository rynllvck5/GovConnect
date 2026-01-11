import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../config';

function loadComments(key) {
  try {
    const s = localStorage.getItem(key);
    const arr = s ? JSON.parse(s) : [];
    // Migrate flat arrays to objects with parentId
    return Array.isArray(arr) ? arr.map(c => ({ parentId: null, ...c })) : [];
  } catch {
    return [];
  }
}

function saveComments(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
}

function colorFromString(s) {
  let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; h >>>= 0;
  const hue = h % 360; return `hsl(${hue}, 65%, 60%)`;
}
function avatarDataUri(name) {
  const n = (name || '?').trim();
  const initials = n.split(/\s+/).map(x=>x[0]).join('').slice(0,2).toUpperCase() || '?';
  const bg = encodeURIComponent(colorFromString(n));
  const txt = encodeURIComponent('#ffffff');
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><rect width='100%' height='100%' fill='${bg}'/><text x='50%' y='54%' dominant-baseline='middle' text-anchor='middle' font-family='Arial, Helvetica, sans-serif' font-size='28' font-weight='700' fill='${txt}'>${initials}</text></svg>`;
  return `data:image/svg+xml;utf8,${svg}`;
}
const anonymousAvatarData = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><rect width='100%' height='100%' fill='%2399a2ad'/><circle cx='32' cy='24' r='12' fill='%23e5e7eb'/><rect x='14' y='40' width='36' height='16' rx='8' fill='%23e5e7eb'/></svg>";

export default function Comments({ threadId, title = 'Comments', ownerName = null, ownerUser = null, collapsedByDefault = true, pageSize = 8 }) {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const storageKey = `comments:${threadId}`;
  const [items, setItems] = useState([]);
  const [collapsed, setCollapsed] = useState(collapsedByDefault);
  const [text, setText] = useState('');
  // Use separate anonymous toggles for comment form and each reply form
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState('');
  const [anonComment, setAnonComment] = useState(false);
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const r = await fetch(`${API_BASE}/comments?threadKey=${encodeURIComponent(threadId)}`);
        if (!r.ok) return;
        const list = await r.json();
        setItems(Array.isArray(list) ? list : []);
      } catch {}
    }
    load();
  }, [threadId]);

  const topLevel = useMemo(() => items.filter(c => !c.parentId).sort((a,b)=> new Date(b.ts)-new Date(a.ts)), [items]);
  const totalCount = items.length;

  const postComment = async (e) => {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    if (!text.trim() || posting) return;
    setPosting(true);
    setPostError('');
    try {
      const r = await fetch(`${API_BASE}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ threadKey: threadId, text: text.trim(), isAnonymous: !!anonComment }),
      });
      if (!r.ok) throw new Error('Failed to post comment');
      const created = await r.json();
      setItems(prev => [created, ...prev]);
      setText('');
    } catch (err) {
      setPostError(err?.message || 'Failed to post comment');
    } finally {
      setPosting(false);
    }
  };

  const postReply = async (parentId, replyTextLocal, setReplyTextLocal, setOpenLocal, useAnon, setReplyPosting, setReplyError) => {
    const txt = (replyTextLocal || '').trim();
    if (!txt || !user) { if (!user) navigate('/login'); return; }
    setReplyPosting && setReplyPosting(true);
    setReplyError && setReplyError('');
    try {
      const r = await fetch(`${API_BASE}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ threadKey: threadId, text: txt, parentId, isAnonymous: !!useAnon }),
      });
      if (!r.ok) throw new Error('Failed to post reply');
      const created = await r.json();
      setItems(prev => [created, ...prev]);
      setReplyTextLocal('');
      setOpenLocal(false);
    } catch (err) {
      setReplyError && setReplyError(err?.message || 'Failed to post reply');
    } finally {
      setReplyPosting && setReplyPosting(false);
    }
  };

  const repliesOf = (id) => items.filter(c => c.parentId === id).sort((a,b)=> new Date(a.ts)-new Date(b.ts));

  const updateItem = (updated) => setItems(prev => prev.map(i => i.id === updated.id ? { ...i, ...updated } : i));
  const removeItem = (id) => setItems(prev => {
    const updated = prev.filter(i => i.id !== id).map(i => (i.parentId === id ? { ...i, parentId: null } : i));
    return updated;
  });
  const removeItemCascade = (rootId) => setItems(prev => {
    const toDelete = new Set([rootId]);
    let added = true;
    while (added) {
      added = false;
      for (const it of prev) {
        if (it.parentId && toDelete.has(it.parentId) && !toDelete.has(it.id)) {
          toDelete.add(it.id);
          added = true;
        }
      }
    }
    return prev.filter(i => !toDelete.has(i.id));
  });

  const requestDelete = (id) => { setConfirmId(id); setConfirmOpen(true); };
  const closeConfirm = () => { if (!confirmBusy) { setConfirmOpen(false); setConfirmId(null); } };
  const performDelete = async () => {
    if (!user || !confirmId) { if (!user) navigate('/login'); return; }
    setConfirmBusy(true);
    try {
      const r = await fetch(`${API_BASE}/comments/${confirmId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (!r.ok) return;
      removeItemCascade(confirmId);
      setConfirmOpen(false);
      setConfirmId(null);
    } catch {}
    finally { setConfirmBusy(false); }
  };

  const CommentItem = ({ c, depth = 0, requestDelete }) => {
    const replies = repliesOf(c.id);
    const [showReplies, setShowReplies] = useState(false);
    const [replyVisibleCount, setReplyVisibleCount] = useState(pageSize);
    // Localize reply form state to avoid focus loss or unintended hide
    const [openReplyForm, setOpenReplyForm] = useState(false);
    const [replyTextLocal, setReplyTextLocal] = useState('');
    const [replyAnon, setReplyAnon] = useState(false);
    const isMine = !!user && c.userId === user.id;
    const [openEdit, setOpenEdit] = useState(false);
    const [editText, setEditText] = useState(c.text);
    const [editAnon, setEditAnon] = useState(!!c.isAnonymous);
    const [replyPosting, setReplyPosting] = useState(false);
    const [replyError, setReplyError] = useState('');
    const [savingEdit, setSavingEdit] = useState(false);

    const onSaveEdit = async () => {
      if (!user) { navigate('/login'); return; }
      const txt = (editText || '').trim(); if (!txt) return;
      setSavingEdit(true);
      try {
        const r = await fetch(`${API_BASE}/comments/${c.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ text: txt, isAnonymous: !!editAnon }),
        });
        if (!r.ok) return;
        const upd = await r.json();
        updateItem({ ...c, text: upd.text, isAnonymous: editAnon, author: upd.author, avatar: upd.avatar });
        setOpenEdit(false);
      } catch {}
      finally {
        setSavingEdit(false);
      }
    };
    const onDelete = async () => { requestDelete(c.id); };
    return (
      <div className={`border rounded-md ${depth === 0 ? 'p-3' : 'p-3 ml-6 border-l-4 border-l-blue-200'} transition duration-200 ease-out hover:shadow-sm`}>
        <div className="flex items-start gap-2">
          <img src={c.isAnonymous ? anonymousAvatarData : (c.avatar || avatarDataUri(c.author || 'User'))} alt="" className="w-8 h-8 rounded-full object-cover" />
          <div className="flex-1">
            <div className="text-xs text-gray-500">{new Date(c.ts).toLocaleString()}</div>
            <div className="text-sm"><span className="font-medium">{c.author}</span></div>
            {!openEdit ? (
              <div className="text-sm text-gray-800 whitespace-pre-wrap">{c.text}</div>
            ) : (
              <div className="mt-2">
                <textarea className="w-full border rounded-md px-3 py-2 text-sm" rows={3} value={editText} onChange={(e)=>setEditText(e.target.value)} />
                <div className="flex items-center justify-between mt-2 text-xs">
                  <label className="flex items-center gap-1">
                    <input type="checkbox" checked={editAnon} onChange={(e)=>setEditAnon(e.target.checked)} /> Anonymous
                  </label>
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1.5 rounded-md border transition-colors" onClick={()=>{ setOpenEdit(false); setEditText(c.text); setEditAnon(!!c.isAnonymous); }} disabled={savingEdit}>Cancel</button>
                    <button className={`px-3 py-1.5 rounded-md bg-blue-600 text-white transition-colors ${savingEdit ? 'opacity-75 cursor-not-allowed' : 'hover:bg-blue-700'}`} onClick={onSaveEdit} disabled={savingEdit} aria-busy={savingEdit}>
                      {savingEdit ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Saving...
                        </span>
                      ) : 'Save'}
                    </button>
                  </div>
                </div>
              </div>
            )}
            <div className="mt-2 flex items-center gap-3 text-xs">
              <button className="text-blue-700 hover:text-blue-800 hover:underline transition-colors" onClick={()=>setOpenReplyForm(!openReplyForm)}>Reply</button>
              {isMine && !openEdit && (
                <>
                  <button className="text-blue-700 hover:text-blue-800 hover:underline transition-colors" onClick={()=>setOpenEdit(true)}>Edit</button>
                  <button className="text-red-700 hover:text-red-800 hover:underline transition-colors" onClick={onDelete}>Delete</button>
                </>
              )}
              {replies.length > 0 && (
                <button className="text-blue-700 hover:text-blue-800 hover:underline transition-colors" onClick={()=>setShowReplies(!showReplies)}>
                  {showReplies ? 'Hide replies' : `Show replies (${replies.length})`}
                </button>
              )}
            </div>
            {openReplyForm && (
              <div className="mt-2">
                <textarea
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  rows={2}
                  placeholder="Write a reply..."
                  value={replyTextLocal}
                  onChange={(e)=>setReplyTextLocal(e.target.value)}
                />
                <div className="flex items-center justify-between mt-2 text-xs">
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1">
                      <input type="checkbox" checked={replyAnon} onChange={(e)=>setReplyAnon(e.target.checked)} /> Anonymous
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    {replyError && <span className="text-red-600">{replyError}</span>}
                    <button className={`px-3 py-1.5 rounded-md bg-blue-600 text-white transition-colors ${replyPosting ? 'opacity-75 cursor-not-allowed' : 'hover:bg-blue-700'}`} disabled={replyPosting} aria-busy={replyPosting} onClick={()=>postReply(c.id, replyTextLocal, setReplyTextLocal, setOpenReplyForm, replyAnon, setReplyPosting, setReplyError)}>
                      {replyPosting ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Replying...
                        </span>
                      ) : 'Reply'}
                    </button>
                  </div>
                </div>
              </div>
            )}
            {showReplies && replies.length > 0 && (
              <div className="mt-3 space-y-3 transition-opacity duration-200 ease-out">
                {replies.slice(0, replyVisibleCount).map(rc => (
                  <CommentItem key={rc.id} c={rc} depth={depth+1} requestDelete={requestDelete} />
                ))}
                {replyVisibleCount < replies.length && (
                  <button className="text-blue-700 text-xs hover:text-blue-800 hover:underline transition-colors" onClick={()=>setReplyVisibleCount(replyVisibleCount + pageSize)}>Show more replies</button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{title}</h3>
        <button className="text-blue-700 text-sm" onClick={()=>setCollapsed(!collapsed)}>
          {collapsed ? `Show comments (${totalCount})` : 'Hide comments'}
        </button>
      </div>
      {!collapsed && (
        <>
          <form onSubmit={postComment} className="space-y-2 border rounded-md p-3 mt-2 transition-shadow duration-150" aria-busy={posting}>
            <div className="flex items-center gap-2">
              <img src={anonComment ? anonymousAvatarData : (user?.profileImageUrl || avatarDataUri(user?.fullName || user?.email || 'User'))} alt="" className="w-8 h-8 rounded-full object-cover" />
              <input
                className={`flex-1 border rounded-md px-3 py-2 ${posting ? 'opacity-80' : ''}`}
                placeholder="Write a comment..."
                value={text}
                onChange={(e)=>setText(e.target.value)}
                disabled={posting}
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1">
                  <input type="checkbox" checked={anonComment} onChange={(e)=>setAnonComment(e.target.checked)} disabled={posting} />
                  Anonymous
                </label>
              </div>
              <button disabled={!user || posting} aria-busy={posting} className={`px-3 py-1.5 rounded-md transition-colors ${(!user || posting) ? 'bg-blue-300 cursor-not-allowed text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                {user ? (
                  posting ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Posting...
                    </span>
                  ) : 'Comment'
                ) : 'Log in to comment'}
              </button>
            </div>
            {postError && <div className="text-sm text-red-600">{postError}</div>}
          </form>

          <div className="mt-4 space-y-3 transition-opacity duration-200 ease-out">
            {topLevel.length === 0 && (
              <div className="text-sm text-gray-600">No comments yet.</div>
            )}
            {topLevel.slice(0, visibleCount).map(c => (
              <CommentItem key={c.id} c={c} requestDelete={requestDelete} />
            ))}
            {visibleCount < topLevel.length && (
              <button className="text-blue-700 text-sm hover:text-blue-800 hover:underline transition-colors" onClick={()=>setVisibleCount(visibleCount + pageSize)}>Show more comments</button>
            )}
          </div>
        </>
      )}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={closeConfirm} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-sm mx-4 p-4 transform transition-all">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-lg">!</div>
              <div className="flex-1">
                <div className="font-semibold">Delete comment?</div>
                <div className="text-sm text-gray-600 mt-1">This will remove the comment and all its replies. This action cannot be undone.</div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-end gap-2 text-sm">
              <button className={`px-3 py-1.5 rounded-md border transition-colors ${confirmBusy ? 'opacity-75 cursor-not-allowed' : ''}`} onClick={closeConfirm} disabled={confirmBusy}>Cancel</button>
              <button className={`px-3 py-1.5 rounded-md bg-red-600 text-white transition-colors ${confirmBusy ? 'opacity-75 cursor-not-allowed' : 'hover:bg-red-700'}`} onClick={performDelete} disabled={confirmBusy}>
                {confirmBusy ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Deleting...
                  </span>
                ) : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
