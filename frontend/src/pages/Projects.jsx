import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import projectsData from '../data/projects';

export default function Projects() {
  const [status, setStatus] = useState('All');
  const list = projectsData.filter(p => status === 'All' ? true : p.status === status);
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-semibold mb-4">Projects</h1>
      <div className="flex items-center gap-2 mb-6">
        <label className="text-sm text-gray-600">Filter by status:</label>
        <select value={status} onChange={(e)=>setStatus(e.target.value)} className="border rounded-md px-2 py-1">
          <option>All</option>
          <option>Planned</option>
          <option>Ongoing</option>
          <option>Completed</option>
        </select>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {list.map(p => (
          <article key={p.id} className="border rounded-md overflow-hidden bg-white flex flex-col">
            {p.image && (
              <img src={p.image} alt="" className="w-full h-40 object-cover" />
            )}
            <div className="p-4 flex-1 flex flex-col">
              <div className="text-xs text-gray-500">{p.department}</div>
              <h2 className="font-semibold">{p.title}</h2>
              {p.description && <p className="text-sm text-gray-700 mt-1">{p.description}</p>}
              <div className="mt-auto pt-3 flex items-center justify-between text-sm">
                <div>₱{p.budget.toLocaleString()}</div>
                <span className={`px-2 py-1 rounded text-xs ${p.status === 'Ongoing' ? 'bg-yellow-100 text-yellow-800' : p.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{p.status}</span>
              </div>
              <div className="mt-3">
                <Link to={`/projects/${p.slug}`} className="text-blue-700 hover:underline">View details</Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
