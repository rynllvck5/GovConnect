const KEY = 'notifications:v1';

function loadAll() {
  try {
    const s = localStorage.getItem(KEY);
    return s ? JSON.parse(s) : {};
  } catch {
    return {};
  }
}

function saveAll(obj) {
  try { localStorage.setItem(KEY, JSON.stringify(obj)); } catch {}
}

export function addNotification(toName, notif) {
  const all = loadAll();
  const name = toName || 'You';
  if (!all[name]) all[name] = [];
  all[name].unshift({ id: Date.now().toString(), read: false, ts: Date.now(), ...notif });
  saveAll(all);
}

export function getNotifications(forName) {
  const all = loadAll();
  return all[forName || 'You'] || [];
}

export function markAllRead(forName) {
  const all = loadAll();
  const name = forName || 'You';
  if (!all[name]) return;
  all[name] = all[name].map(n => ({ ...n, read: true }));
  saveAll(all);
}

export function unreadCount(forName) {
  return getNotifications(forName).filter(n => !n.read).length;
}
