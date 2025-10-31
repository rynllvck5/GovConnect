const KEY = 'engagements:v1';

function loadAll() {
  try {
    const s = localStorage.getItem(KEY);
    return s ? JSON.parse(s) : {};
  } catch { return {}; }
}

function saveAll(obj) {
  try { localStorage.setItem(KEY, JSON.stringify(obj)); } catch {}
}

export function recordEngagement(userName, threadId) {
  if (!userName || !threadId) return;
  const all = loadAll();
  if (!all[userName]) all[userName] = [];
  if (!all[userName].includes(threadId)) all[userName].push(threadId);
  saveAll(all);
}

export function getEngagedThreads(userName) {
  const all = loadAll();
  return all[userName] || [];
}
