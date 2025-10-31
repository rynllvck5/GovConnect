import React, { useMemo, useState } from 'react';
import { ensureUser } from '../utils/user';
import { getEngagedThreads } from '../utils/engagements';

const STORAGE_KEY = 'forum:posts';

function loadPosts() {
  try { const s = localStorage.getItem(STORAGE_KEY); return s ? JSON.parse(s) : []; } catch { return []; }
}

export default function Profile() {
  const user = ensureUser();
  const [tab, setTab] = useState('mine'); // 'mine' | 'engaged'
  const posts = loadPosts();

  const mine = useMemo(() => posts.filter(p => p.author === user.name), [posts, user.name]);

  const engagedPosts = useMemo(() => {
    const threads = getEngagedThreads(user.name) || [];
    const postIds = threads
      .filter(t => typeof t === 'string' && t.startsWith('comments:forum:post:'))
      .map(t => t.replace('comments:forum:post:', ''));
    const set = new Set(postIds);
    return posts.filter(p => set.has(p.id) && p.author !== user.name);
  }, [posts, user.name]);

  const list = tab === 'mine' ? mine : engagedPosts;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{user.name}'s Profile</h1>
        <div className="flex items-center gap-2 text-sm">
          <button className={`px-3 py-1 rounded ${tab==='mine'?'bg-blue-600 text-white':'border'}`} onClick={()=>setTab('mine')}>My Posts</button>
          <button className={`px-3 py-1 rounded ${tab==='engaged'?'bg-blue-600 text-white':'border'}`} onClick={()=>setTab('engaged')}>Engaged</button>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {list.length === 0 && (
          <div className="text-sm text-gray-600">No posts to show.</div>
        )}
        {list.map(p => (
          <article key={p.id} className="border rounded-md p-4 bg-white">
            <div className="text-xs text-gray-500">{new Date(p.ts).toLocaleString()} • {p.category}{p.location?` • ${p.location}`:''}</div>
            <h2 className="font-semibold">{p.title}</h2>
            <div className="text-sm text-gray-600">By {p.author}</div>
            <p className="text-sm text-gray-800 mt-2">{p.message}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
