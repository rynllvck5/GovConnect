import React from 'react';
import { useParams, Link } from 'react-router-dom';
import barangays from '../data/barangays';
import tourism from '../data/tourism';

function resolveTourism(slugs, coll) {
  if (!Array.isArray(slugs) || slugs.length === 0) return [];
  return coll.filter(x => slugs.includes(x.slug));
}

export default function BarangayDetail() {
  const { slug } = useParams();
  const b = barangays.find(x => x.slug === slug);
  if (!b) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="text-xl font-semibold mb-2">Barangay not found</div>
        <Link to="/government#barangays" className="text-blue-700 hover:underline">Back to Barangays</Link>
      </div>
    );
  }

  const spots = resolveTourism(b.tourismSpots, tourism.spots);
  const products = resolveTourism(b.products, tourism.products);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Link to="/government#barangays" className="text-blue-700 hover:underline text-sm">← Back to Barangays</Link>
      <article className="border rounded-md overflow-hidden bg-white">
        {b.images?.[0] && <img src={b.images[0]} alt="" className="w-full h-56 object-cover" />}
        <div className="p-4 space-y-2">
          <h1 className="text-2xl font-semibold">{b.name}</h1>
          <p className="text-sm text-gray-700">{b.description}</p>
          <div className="text-sm text-gray-700">Population: {b.population}</div>
        </div>
      </article>

      <section>
        <h2 className="font-semibold mb-2">Officials</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {b.officials.map((o, i) => (
            <div key={i} className="border rounded-md p-3 text-sm bg-white flex items-center gap-3">
              <img src={`https://i.pravatar.cc/96?u=${encodeURIComponent(o.name || o.role || ('official-'+i))}`} alt="" className="w-10 h-10 rounded-full object-cover" />
              <div>
                <div className="font-medium">{o.name || '—'}</div>
                <div className="text-gray-600">{o.role || '—'}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {Array.isArray(b.achievements) && b.achievements.length > 0 && (
        <section>
          <h2 className="font-semibold mb-2">Awards & Achievements</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {b.achievements.map((a, i) => (
              <details key={i} className="border rounded-md overflow-hidden bg-white">
                <summary className="p-3 cursor-pointer text-sm font-medium flex items-center justify-between">
                  <span>{a}</span>
                  <span className="text-gray-500">›</span>
                </summary>
                <div className="p-3 space-y-2 text-sm text-gray-700">
                  <div>This is a placeholder preview. Click to view basic documentation for this achievement.</div>
                  <div className="grid grid-cols-2 gap-2">
                    <img src={`https://picsum.photos/seed/brgy-cert-${i}/640/360`} alt="" className="w-full h-24 object-cover rounded" />
                    <img src={`https://picsum.photos/seed/brgy-trophy-${i}/640/360`} alt="" className="w-full h-24 object-cover rounded" />
                  </div>
                </div>
              </details>
            ))}
          </div>
        </section>
      )}

      {(spots.length > 0 || products.length > 0) && (
        <section>
          <h2 className="font-semibold mb-2">What to see & buy</h2>
          {spots.length > 0 && (
            <div className="mb-4">
              <div className="text-sm font-medium mb-1">Nearby Tourist Spots</div>
              <div className="grid sm:grid-cols-2 gap-3">
                {spots.map(s => (
                  <Link key={s.slug} to={`/tourism/spots/${s.slug}`} className="border rounded-md overflow-hidden bg-white hover:border-blue-400">
                    {s.images?.[0] && <img src={s.images[0]} alt="" className="w-full h-28 object-cover" />}
                    <div className="p-3 text-sm">
                      <div className="font-medium">{s.name}</div>
                      <div className="text-gray-600">{s.location}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
          {products.length > 0 && (
            <div>
              <div className="text-sm font-medium mb-1">Local Products</div>
              <div className="grid sm:grid-cols-2 gap-3">
                {products.map(s => (
                  <Link key={s.slug} to={`/tourism/products/${s.slug}`} className="border rounded-md overflow-hidden bg-white hover:border-blue-400">
                    {s.images?.[0] && <img src={s.images[0]} alt="" className="w-full h-28 object-cover" />}
                    <div className="p-3 text-sm">
                      <div className="font-medium">{s.name}</div>
                      <div className="text-gray-600">{s.location}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
