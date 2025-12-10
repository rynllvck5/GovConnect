import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { API_BASE } from '../config';
import { getToken, setToken, clearAuth, getUser, setUser } from '../utils/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(getToken());
  const [user, setUserState] = useState(getUser());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadMe() {
      if (!token) return;
      try {
        const r = await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (r.ok) {
          const me = await r.json();
          setUser(me);
          setUserState(me);
        } else {
          clearAuth();
          setTokenState(null);
          setUserState(null);
        }
      } catch {
        clearAuth();
        setTokenState(null);
        setUserState(null);
      }
    }
    loadMe();
  }, [token]);

  async function login(email, password) {
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!r.ok) return { ok: false, error: 'Invalid email or password' };
      const { token: t } = await r.json();
      setToken(t);
      setTokenState(t);
      const meRes = await fetch(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${t}` } });
      if (!meRes.ok) return { ok: false, error: 'Failed to load session' };
      const me = await meRes.json();
      setUser(me);
      setUserState(me);
      return { ok: true };
    } catch {
      return { ok: false, error: 'Network error' };
    } finally {
      setLoading(false);
    }
  }

  async function signup(fullName, email, password, barangayId) {
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password, barangayId }),
      });
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        return { ok: false, error: e.error || 'Sign up failed' };
      }
      const { token: t } = await r.json();
      setToken(t);
      setTokenState(t);
      const meRes = await fetch(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${t}` } });
      if (!meRes.ok) return { ok: false, error: 'Failed to load session' };
      const me = await meRes.json();
      setUser(me);
      setUserState(me);
      return { ok: true };
    } catch {
      return { ok: false, error: 'Network error' };
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    clearAuth();
    setTokenState(null);
    setUserState(null);
  }

  const value = useMemo(() => ({ token, user, loading, login, signup, logout }), [token, user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
