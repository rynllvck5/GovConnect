import React from 'react';
import news from '../data/news';
import { Link } from 'react-router-dom';

export default function News() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-semibold mb-4">Features & Announcements</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {news.map(n => (
          <article key={n.id} className="border rounded-md overflow-hidden bg-white flex flex-col">
            {n.image && <img src={n.image} alt="" className="w-full h-40 object-cover" />}
            <div className="p-4 flex-1 flex flex-col">
              <div className="text-xs text-gray-500">{n.date}</div>
              <h2 className="font-semibold">{n.title}</h2>
              <p className="text-sm text-gray-700 mt-1">{n.summary}</p>
              <div className="mt-auto pt-3">
                <Link to={`/news/${n.slug}`} className="text-blue-700 hover:underline">Read more & comment</Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
