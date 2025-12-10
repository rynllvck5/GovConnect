import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { avatarFor, anonymousAvatar, generateAnonymousName } from '../utils/user';
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

export default function Comments({ threadId, title = 'Comments', ownerName = null, ownerUser = null, collapsedByDefault = true, pageSize = 8 }) {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const storageKey = `comments:${threadId}`;
  const [items, setItems] = useState([]);
  const [collapsed, setCollapsed] = useState(collapsedByDefault);
  const [text, setText] = useState('');
  // Use separate anonymous toggles for comment form and each reply form
  const [anonComment, setAnonComment] = useState(false);
  const [visibleCount, setVisibleCount] = useState(pageSize);

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
    if (!text.trim()) return;
    try {
      const r = await fetch(`${API_BASE}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ threadKey: threadId, text: text.trim(), isAnonymous: !!anonComment }),
      });
      if (!r.ok) return;
      const created = await r.json();
      setItems([created, ...items]);
      setText('');
    } catch {}
  };

  const postReply = async (parentId, replyTextLocal, setReplyTextLocal, setOpenLocal, useAnon) => {
    const txt = (replyTextLocal || '').trim();
    if (!txt || !user) { if (!user) navigate('/login'); return; }
    try {
      const r = await fetch(`${API_BASE}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ threadKey: threadId, text: txt, parentId, isAnonymous: !!useAnon }),
      });
      if (!r.ok) return;
      const created = await r.json();
      setItems([created, ...items]);
      setReplyTextLocal('');
      setOpenLocal(false);
    } catch {}
  };

  const repliesOf = (id) => items.filter(c => c.parentId === id).sort((a,b)=> new Date(a.ts)-new Date(b.ts));

  const CommentItem = ({ c, depth = 0 }) => {
    const replies = repliesOf(c.id);
    const [showReplies, setShowReplies] = useState(false);
    const [replyVisibleCount, setReplyVisibleCount] = useState(pageSize);
    // Localize reply form state to avoid focus loss or unintended hide
    const [openReplyForm, setOpenReplyForm] = useState(false);
    const [replyTextLocal, setReplyTextLocal] = useState('');
    const [replyAnon, setReplyAnon] = useState(false);
    return (
      <div className={`border rounded-md ${depth === 0 ? 'p-3' : 'p-3 ml-6 border-l-4 border-l-blue-200'}`}>
        <div className="flex items-start gap-2">
          <img src={c.avatar || avatarFor(c.author)} alt="" className="w-8 h-8 rounded-full object-cover" />
          <div className="flex-1">
            <div className="text-xs text-gray-500">{new Date(c.ts).toLocaleString()}</div>
            <div className="text-sm"><span className="font-medium">{c.author}</span></div>
            <div className="text-sm text-gray-800">{c.text}</div>
            <div className="mt-2 flex items-center gap-3 text-xs">
              <button className="text-blue-700" onClick={()=>setOpenReplyForm(!openReplyForm)}>Reply</button>
              {replies.length > 0 && (
                <button className="text-blue-700" onClick={()=>setShowReplies(!showReplies)}>
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
                  <button className="px-3 py-1.5 rounded-md bg-blue-600 text-white" onClick={()=>postReply(c.id, replyTextLocal, setReplyTextLocal, setOpenReplyForm, replyAnon)}>Reply</button>
                </div>
              </div>
            )}
            {showReplies && replies.length > 0 && (
              <div className="mt-3 space-y-3">
                {replies.slice(0, replyVisibleCount).map(rc => (
                  <CommentItem key={rc.id} c={rc} depth={depth+1} />
                ))}
                {replyVisibleCount < replies.length && (
                  <button className="text-blue-700 text-xs" onClick={()=>setReplyVisibleCount(replyVisibleCount + pageSize)}>Show more replies</button>
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
          <form onSubmit={postComment} className="space-y-2 border rounded-md p-3 mt-2">
            <div className="flex items-center gap-2">
              <img src={anonComment ? anonymousAvatar() : (user?.profileImageUrl || avatarFor(user?.fullName || user?.email))} alt="" className="w-8 h-8 rounded-full object-cover" />
              <input
                className="flex-1 border rounded-md px-3 py-2"
                placeholder="Write a comment..."
                value={text}
                onChange={(e)=>setText(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1">
                  <input type="checkbox" checked={anonComment} onChange={(e)=>setAnonComment(e.target.checked)} />
                  Anonymous
                </label>
              </div>
              <button disabled={!user} className={`px-3 py-1.5 rounded-md ${!user ? 'bg-blue-300 cursor-not-allowed text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>{user ? 'Comment' : 'Log in to comment'}</button>
            </div>
          </form>

          <div className="mt-4 space-y-3">
            {topLevel.length === 0 && (
              <div className="text-sm text-gray-600">No comments yet.</div>
            )}
            {topLevel.slice(0, visibleCount).map(c => (
              <CommentItem key={c.id} c={c} />
            ))}
            {visibleCount < topLevel.length && (
              <button className="text-blue-700 text-sm" onClick={()=>setVisibleCount(visibleCount + pageSize)}>Show more comments</button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
