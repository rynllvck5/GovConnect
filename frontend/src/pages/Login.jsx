import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  const onSubmit = (e) => {
    e.preventDefault();
    navigate('/');
  };
  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Log in</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="block text-sm text-gray-700">Email</label>
          <input className="w-full border rounded-md px-3 py-2" placeholder="you@example.com" />
        </div>
        <div>
          <label className="block text-sm text-gray-700">Password</label>
          <input type="password" className="w-full border rounded-md px-3 py-2" placeholder="••••••••" />
        </div>
        <button className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700">Log in</button>
      </form>
      <div className="text-sm text-gray-600 mt-3">Don't have an account? <Link to="/signup" className="text-blue-700">Sign up</Link></div>
    </div>
  );
}
