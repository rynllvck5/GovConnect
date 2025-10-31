const USER_KEY = 'forum:user';

export function getCurrentUser() {
  try {
    const s = localStorage.getItem(USER_KEY);
    if (s) return JSON.parse(s);
  } catch {}
  return null;
}

export function setCurrentUser(user) {
  try { localStorage.setItem(USER_KEY, JSON.stringify(user)); } catch {}
}

export function ensureUser() {
  let u = getCurrentUser();
  if (!u) {
    u = {
      name: 'You',
      avatar: avatarFor('You')
    };
    setCurrentUser(u);
  }
  return u;
}

export function avatarFor(name) {
  const key = encodeURIComponent(name || 'anon');
  // Placeholder avatar provider
  return `https://i.pravatar.cc/100?u=${key}`;
}

export function anonymousAvatar() {
  // Default anonymous avatar placeholder
  return 'https://i.pravatar.cc/100?img=5';
}

export function generateAnonymousName() {
  // e.g., Anonymous-7F3A
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `Anonymous-${suffix}`;
}
