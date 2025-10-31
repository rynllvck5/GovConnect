import React, { useEffect, useMemo, useState } from 'react';
import { avatarFor, ensureUser, anonymousAvatar, generateAnonymousName } from '../utils/user';
import { addNotification } from '../utils/notifications';
import { recordEngagement } from '../utils/engagements';

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
  const storageKey = `comments:${threadId}`;
  const [items, setItems] = useState(() => loadComments(storageKey));
  const [collapsed, setCollapsed] = useState(collapsedByDefault);
  const [text, setText] = useState('');
  // Use separate anonymous toggles for comment form and each reply form
  const [anonComment, setAnonComment] = useState(false);
  const [visibleCount, setVisibleCount] = useState(pageSize);

  useEffect(() => { saveComments(storageKey, items); }, [items]);

  const topLevel = useMemo(() => items.filter(c => !c.parentId).sort((a,b)=> new Date(b.ts)-new Date(a.ts)), [items]);
  const totalCount = items.length;

  const currentUser = ensureUser();

  const postComment = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    const author = anonComment ? generateAnonymousName() : (currentUser?.name || 'User');
    const avatar = anonComment ? anonymousAvatar() : (currentUser?.avatar || avatarFor(author));
    const c = {
      id: Date.now().toString(),
      author,
      user: currentUser?.name || author,
      avatar,
      text: text.trim(),
      ts: new Date().toISOString(),
      parentId: null
    };
    setItems([c, ...items]);
    setText('');
    // Record engagement for current user regardless of anonymity
    recordEngagement(currentUser.name, storageKey);
    // Notify thread owner (e.g., post author) if provided and not the same as commenter
    const targetUser = ownerUser || ownerName;
    if (targetUser && targetUser !== (currentUser?.name || author)) {
      addNotification(targetUser, { type: 'comment', message: `${author} commented on your post`, threadId });
    }
  };

  const postReply = (parentId, replyTextLocal, setReplyTextLocal, setOpenLocal, useAnon) => {
    const txt = (replyTextLocal || '').trim();
    if (!txt) return;
    const author = useAnon ? generateAnonymousName() : (currentUser?.name || 'User');
    const avatar = useAnon ? anonymousAvatar() : (currentUser?.avatar || avatarFor(author));
    const r = {
      id: Date.now().toString(),
      author,
      user: currentUser?.name || author,
      avatar,
      text: txt,
      ts: new Date().toISOString(),
      parentId
    };
    setItems([r, ...items]);
    setReplyTextLocal('');
    setOpenLocal(false);
    recordEngagement(currentUser.name, storageKey);
    const parent = items.find(i => i.id === parentId);
    const parentUser = parent?.user || parent?.author;
    if (parentUser && parentUser !== (currentUser?.name || author)) {
      addNotification(parentUser, { type: 'reply', message: `${author} replied to your comment`, threadId });
    }
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
              <img src={anonComment ? anonymousAvatar() : (currentUser?.avatar || avatarFor(currentUser?.name))} alt="" className="w-8 h-8 rounded-full object-cover" />
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
              <button className="bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700">Comment</button>
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
