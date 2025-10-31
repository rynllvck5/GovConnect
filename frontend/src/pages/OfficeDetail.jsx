import React from 'react';
import { useParams, Link } from 'react-router-dom';
import offices from '../data/offices';

export default function OfficeDetail() {
  const { slug } = useParams();
  const office = offices.find(o => o.slug === slug);
  if (!office) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="text-xl font-semibold mb-2">Office not found</div>
        <Link to="/government#offices" className="text-blue-700 hover:underline">Back to Offices</Link>
      </div>
    );
  }
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(office.mapQuery || office.location)}&output=embed`;
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/government#offices" className="text-blue-700 hover:underline text-sm">← Back to Offices</Link>
      <article className="mt-3 border rounded-md overflow-hidden bg-white">
        {office.images?.[0] && <img src={office.images[0]} alt="" className="w-full h-56 object-cover" />}
        <div className="p-4 space-y-2">
          <h1 className="text-2xl font-semibold">{office.name}</h1>
          <div className="text-sm text-gray-700 flex items-center gap-2">
            <img src={`https://i.pravatar.cc/80?u=${encodeURIComponent(office.head || office.name)}`} alt="" className="w-8 h-8 rounded-full object-cover" />
            <span>Head: {office.head || '—'}</span>
          </div>
          <div className="text-sm text-gray-700">Location: {office.location}</div>
          <div className="text-sm text-gray-700">Contact: {office.contact}</div>
          {office.description && <p className="text-sm text-gray-700 mt-2">{office.description}</p>}
          <div className="mt-3">
            <div className="text-sm font-medium mb-1">Map</div>
            <div className="w-full h-64 border rounded-md overflow-hidden">
              <iframe title="map" src={mapSrc} width="100%" height="100%" style={{ border: 0 }} loading="lazy" allowFullScreen></iframe>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
