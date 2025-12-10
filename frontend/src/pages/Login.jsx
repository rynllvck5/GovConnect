import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login, loading, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError('Please enter your email and password.');
      return;
    }
    const emailOk = /.+@.+\..+/.test(trimmedEmail);
    if (!emailOk) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    const res = await login(trimmedEmail, password);
    if (!res.ok) {
      setError(res.error || 'Invalid email or password');
      return;
    }
    navigate('/');
  };

  const disabled = loading || !email.trim() || !password;

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Log in</h1>
      {error && <div className="mb-3 text-sm text-red-600">{error}</div>}
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="block text-sm text-gray-700">Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            className="w-full border rounded-md px-3 py-2"
            placeholder="you@example.com"
            required
          />
        </div>
        <div>
          <label className="block text-sm text-gray-700">Password</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            className="w-full border rounded-md px-3 py-2"
            placeholder="••••••••"
            required
            minLength={8}
          />
        </div>
        <button disabled={disabled} className={`w-full text-white py-2 rounded-md ${disabled ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
          {loading ? 'Logging in...' : 'Log in'}
        </button>
      </form>
      <div className="text-sm text-gray-600 mt-3">Don't have an account? <Link to="/signup" className="text-blue-700">Sign up</Link></div>
    </div>
  );
}
