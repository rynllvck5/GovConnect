import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Signup() {
  const navigate = useNavigate();
  const onSubmit = (e) => {
    e.preventDefault();
    navigate('/');
  };
  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Sign up</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="block text-sm text-gray-700">Full name</label>
          <input className="w-full border rounded-md px-3 py-2" placeholder="Juan Dela Cruz" />
        </div>
        <div>
          <label className="block text-sm text-gray-700">Email</label>
          <input className="w-full border rounded-md px-3 py-2" placeholder="you@example.com" />
        </div>
        <div>
          <label className="block text-sm text-gray-700">Password</label>
          <input type="password" className="w-full border rounded-md px-3 py-2" placeholder="Create a password" />
        </div>
        <button className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700">Create account</button>
      </form>
    </div>
  );
}
