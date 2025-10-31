import React, { useState } from 'react';

export default function SearchBar({ placeholder = 'Search services, offices, news (coming soon)...' }) {
  const [q, setQ] = useState('');
  const onSubmit = (e) => {
    e.preventDefault();
    window.alert('Search is coming soon in the full system. This is a prototype.');
  };
  return (
    <form onSubmit={onSubmit} className="w-full max-w-2xl mx-auto">
      <div className="flex">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="flex-1 border border-gray-300 rounded-l-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={placeholder}
        />
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700">Search</button>
      </div>
    </form>
  );
}
