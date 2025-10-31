import React from 'react';
import tourism from '../data/tourism';
import { Link } from 'react-router-dom';

export default function Tourism() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-semibold mb-4">Tourism</h1>
      <p className="text-gray-600 mb-6">Discover spots, local products, and heritage sites in Caba.</p>
      <div className="space-y-8">
        <div>
          <h2 className="font-semibold mb-2">Tourist Spots</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tourism.spots.map((s)=> (
              <Link key={s.slug} to={`/tourism/spots/${s.slug}`} className="border rounded-md overflow-hidden hover:border-blue-400 bg-white">
                {s.images?.[0] && <img src={s.images[0]} alt="" className="w-full h-32 object-cover" />}
                <div className="p-4">
                  <div className="font-medium">{s.name}</div>
                  <div className="text-sm text-gray-600">{s.description}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
        <div>
          <h2 className="font-semibold mb-2">Local Products</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tourism.products.map((s)=> (
              <Link key={s.slug} to={`/tourism/products/${s.slug}`} className="border rounded-md overflow-hidden hover:border-blue-400 bg-white">
                {s.images?.[0] && <img src={s.images[0]} alt="" className="w-full h-32 object-cover" />}
                <div className="p-4">
                  <div className="font-medium">{s.name}</div>
                  <div className="text-sm text-gray-600">{s.description}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
        <div>
          <h2 className="font-semibold mb-2">Heritage</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tourism.heritage.map((s)=> (
              <Link key={s.slug} to={`/tourism/heritage/${s.slug}`} className="border rounded-md overflow-hidden hover:border-blue-400 bg-white">
                {s.images?.[0] && <img src={s.images[0]} alt="" className="w-full h-32 object-cover" />}
                <div className="p-4">
                  <div className="font-medium">{s.name}</div>
                  <div className="text-sm text-gray-600">{s.description}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
