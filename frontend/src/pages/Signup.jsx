import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const navigate = useNavigate();
  const { signup, loading, user } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [barangayId, setBarangayId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const name = fullName.trim();
    const mail = email.trim();
    if (name.length < 2) { setError('Full name must be at least 2 characters.'); return; }
    if (!/.+@.+\..+/.test(mail)) { setError('Please enter a valid email address.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    const brgyId = barangayId ? Number(barangayId) : undefined;
    if (barangayId && (!Number.isInteger(brgyId) || brgyId <= 0)) { setError('Barangay ID must be a positive integer.'); return; }
    const res = await signup(name, mail, password, brgyId);
    if (!res.ok) { setError(res.error || 'Sign up failed'); return; }
    navigate('/');
  };

  const disabled = loading || !fullName.trim() || !email.trim() || !password || password.length < 8;

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Sign up</h1>
      {error && <div className="mb-3 text-sm text-red-600">{error}</div>}
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="block text-sm text-gray-700">Full name</label>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full border rounded-md px-3 py-2" placeholder="Juan Dela Cruz" required />
        </div>
        <div>
          <label className="block text-sm text-gray-700">Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="w-full border rounded-md px-3 py-2" placeholder="you@example.com" required />
        </div>
        <div>
          <label className="block text-sm text-gray-700">Password</label>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="w-full border rounded-md px-3 py-2" placeholder="Create a password" required minLength={8} />
        </div>
        <div>
          <label className="block text-sm text-gray-700">Barangay ID (optional)</label>
          <input value={barangayId} onChange={(e) => setBarangayId(e.target.value)} type="number" min={1} className="w-full border rounded-md px-3 py-2" placeholder="e.g. 1" />
        </div>
        <button disabled={disabled} className={`w-full text-white py-2 rounded-md ${disabled ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>
    </div>
  );
}
