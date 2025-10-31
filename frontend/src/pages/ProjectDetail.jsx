import React from 'react';
import { useParams, Link } from 'react-router-dom';
import projects from '../data/projects';

export default function ProjectDetail() {
  const { slug } = useParams();
  const p = projects.find(x => x.slug === slug);
  if (!p) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="text-xl font-semibold mb-2">Project not found</div>
        <Link to="/projects" className="text-blue-700 hover:underline">Back to Projects</Link>
      </div>
    );
  }
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/projects" className="text-blue-700 hover:underline text-sm">← Back to Projects</Link>
      <div className="mt-3 border rounded-md overflow-hidden bg-white">
        {p.image && <img src={p.image} alt="" className="w-full h-56 object-cover" />}
        <div className="p-4">
          <div className="text-xs text-gray-500">{p.department} • {p.startDate} – {p.endDate || '—'}</div>
          <h1 className="text-2xl font-semibold">{p.title}</h1>
          <div className="mt-2 text-sm text-gray-700">{p.description}</div>
          <div className="mt-4 flex items-center gap-4 text-sm">
            <div className="font-medium">Budget:</div>
            <div>₱{p.budget.toLocaleString()}</div>
            <div className="font-medium ml-4">Status:</div>
            <div><span className={`px-2 py-1 rounded text-xs ${p.status === 'Ongoing' ? 'bg-yellow-100 text-yellow-800' : p.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{p.status}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
