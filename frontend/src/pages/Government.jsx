import React, { useState } from 'react';
import officials from '../data/officials';
import offices from '../data/offices';
import barangays from '../data/barangays';
import awards from '../data/awards';
import { Link } from 'react-router-dom';

export default function Government() {
  const [selectedAward, setSelectedAward] = useState(null);
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      <section id="officials">
        <h2 className="text-xl font-semibold mb-3">Municipal Officials</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {officials.map((o)=> (
            <div key={o.position} className="border rounded-md p-4 bg-white flex items-center gap-3">
              <img src={`https://i.pravatar.cc/96?u=${encodeURIComponent(o.position)}`} alt="" className="w-14 h-14 rounded-full object-cover" />
              <div>
                <div className="font-medium">{o.name || '—'}</div>
                <div className="text-sm text-gray-600">{o.position}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="offices">
        <h2 className="text-xl font-semibold mb-3">Municipal Offices</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {offices.map((ofc)=> (
            <Link to={`/government/offices/${ofc.slug}`} key={ofc.slug} className="border rounded-md overflow-hidden hover:border-blue-400 bg-white">
              {ofc.images?.[0] && <img src={ofc.images[0]} alt="" className="w-full h-28 object-cover" />}
              <div className="p-4">
                <div className="font-medium">{ofc.name}</div>
                <div className="flex items-center gap-2 mt-1">
                  <img src={`https://i.pravatar.cc/64?u=${encodeURIComponent(ofc.head || ofc.name)}`} alt="" className="w-6 h-6 rounded-full object-cover" />
                  <div className="text-sm text-gray-600">Head: {ofc.head || '—'}</div>
                </div>
                <div className="text-sm text-gray-600">Location: {ofc.location}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section id="barangays">
        <h2 className="text-xl font-semibold mb-3">Barangays</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
          {barangays.map((b)=> (
            <Link to={`/government/barangays/${b.slug}`} key={b.slug} className="border rounded-md p-3 text-sm hover:border-blue-400 bg-white">
              {b.name}
            </Link>
          ))}
        </div>
      </section>

      <section id="awards">
        <h2 className="text-xl font-semibold mb-3">Awards & Achievements</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {awards.map((a,idx)=> (
            <button key={idx} onClick={()=>setSelectedAward({ title: a })} className="text-left border rounded-md overflow-hidden bg-white hover:border-blue-400">
              <img src={`https://picsum.photos/seed/award-${idx}/480/240`} alt="" className="w-full h-28 object-cover" />
              <div className="p-3">
                <div className="font-medium text-sm">{a}</div>
                <div className="text-xs text-gray-600 mt-1">Click to view certificate and details</div>
              </div>
            </button>
          ))}
        </div>
        <dialog open={!!selectedAward} className="rounded-lg p-0 w-full max-w-2xl">
          {selectedAward && (
            <div>
              <div className="flex justify-between items-center px-4 py-3 border-b">
                <div className="font-semibold">{selectedAward.title}</div>
                <button className="text-gray-600" onClick={()=>setSelectedAward(null)}>✕</button>
              </div>
              <div className="p-4 space-y-3">
                <div className="text-sm text-gray-700">This section will display the official documentation, certificate scans, and a short description for the award.</div>
                <div className="grid grid-cols-2 gap-2">
                  <img src="https://picsum.photos/seed/cert1/640/360" alt="" className="w-full h-32 object-cover rounded" />
                  <img src="https://picsum.photos/seed/cert2/640/360" alt="" className="w-full h-32 object-cover rounded" />
                </div>
              </div>
            </div>
          )}
        </dialog>
      </section>
    </div>
  );
}
