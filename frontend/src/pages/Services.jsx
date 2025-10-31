import React, { useState } from 'react';
import services from '../data/services';

export default function Services() {
  const [query, setQuery] = useState('');
  const offices = Array.from(new Set(services.map(s => s.office))).sort();
  const [office, setOffice] = useState('All');
  const filtered = services
    .filter(s => s.title.toLowerCase().includes(query.toLowerCase()))
    .filter(s => office === 'All' || s.office === office);
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-semibold mb-4">Government Services</h1>
      <div className="flex flex-col md:flex-row md:items-center gap-2 mb-4">
        <input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search services..." className="flex-1 border rounded-md px-3 py-2" />
        <select value={office} onChange={(e)=>setOffice(e.target.value)} className="md:w-64 border rounded-md px-3 py-2">
          <option>All</option>
          {offices.map(o => (<option key={o}>{o}</option>))}
        </select>
        <button onClick={()=>{ setQuery(''); setOffice('All'); }} className="px-3 py-2 border rounded-md">Clear</button>
      </div>
      <div className="columns-1 md:columns-2 gap-x-4">
        {filtered.map((svc) => (
          <div key={svc.slug} className="mb-4 break-inside-avoid" style={{ breakInside: 'avoid' }}>
          <details className="w-full border rounded-md p-4 bg-white">
            <summary className="font-medium cursor-pointer flex items-center justify-between">
              <span>{svc.title} <span className="text-sm text-gray-500">— {svc.office}</span></span>
              <span className="text-gray-500">›</span>
            </summary>
            <div className="mt-3 text-sm text-gray-700">
              <p className="mb-2">{svc.description}</p>
              <div className="mb-2"><span className="font-medium">Office:</span> {svc.office} — Head: {svc.head} — Location: {svc.location} — Contact: {svc.contact}</div>
              <div className="mb-2">
                <div className="font-medium">Requirements</div>
                <ul className="list-disc ml-5">
                  {svc.requirements.map((r,i)=>(<li key={i}>{r}</li>))}
                </ul>
              </div>
              {svc.files && svc.files.length > 0 && (
                <div className="mb-2">
                  <div className="font-medium">Downloadable Forms</div>
                  <ul className="list-disc ml-5">
                    {svc.files.map((f, i) => (
                      <li key={i}><a className="text-blue-700 hover:underline" href={f.path} download>{f.label}</a></li>
                    ))}
                  </ul>
                </div>
              )}
              <div>
                <div className="font-medium">Step-by-step Process</div>
                <ol className="list-decimal ml-5">
                  {svc.steps.map((st,i)=>(<li key={i}>{st}</li>))}
                </ol>
              </div>
            </div>
          </details>
          </div>
        ))}
      </div>
    </div>
  );
}
