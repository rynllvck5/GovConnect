import React from 'react';
import { useParams, Link } from 'react-router-dom';
import tourism from '../data/tourism';
import Comments from '../components/Comments';

const getCollection = (category) => {
  if (category === 'spots') return tourism.spots;
  if (category === 'products') return tourism.products;
  if (category === 'heritage') return tourism.heritage;
  return [];
};

export default function TourismDetail() {
  const { category, slug } = useParams();
  const coll = getCollection(category);
  const item = coll.find(x => x.slug === slug);
  if (!item) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="text-xl font-semibold mb-2">Item not found</div>
        <Link to="/tourism" className="text-blue-700 hover:underline">Back to Tourism</Link>
      </div>
    );
  }
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/tourism" className="text-blue-700 hover:underline text-sm">← Back to Tourism</Link>
      <article className="mt-3 border rounded-md overflow-hidden bg-white">
        {item.images?.[0] && <img src={item.images[0]} alt="" className="w-full h-56 object-cover" />}
        <div className="p-4">
          <h1 className="text-2xl font-semibold">{item.name}</h1>
          <div className="text-sm text-gray-600">{item.location}</div>
          <p className="text-sm text-gray-700 mt-2">{item.details || item.description}</p>
        </div>
      </article>
      <Comments threadId={`tourism:${category}:${item.slug}`} title="Discussions & Inquiries" />
    </div>
  );
}
