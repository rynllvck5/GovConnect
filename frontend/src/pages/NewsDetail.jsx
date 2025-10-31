import React from 'react';
import { useParams, Link } from 'react-router-dom';
import news from '../data/news';
import Comments from '../components/Comments';

export default function NewsDetail() {
  const { slug } = useParams();
  const n = news.find(x => x.slug === slug);
  if (!n) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="text-xl font-semibold mb-2">Post not found</div>
        <Link to="/news" className="text-blue-700 hover:underline">Back to Features</Link>
      </div>
    );
  }
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/news" className="text-blue-700 hover:underline text-sm">← Back to Features</Link>
      <article className="mt-3 border rounded-md overflow-hidden bg-white">
        {n.image && <img src={n.image} alt="" className="w-full h-56 object-cover" />}
        <div className="p-4">
          <div className="text-xs text-gray-500">{n.date}</div>
          <h1 className="text-2xl font-semibold">{n.title}</h1>
          {n.body && <p className="text-sm text-gray-700 mt-2">{n.body}</p>}
        </div>
      </article>
      <Comments threadId={`news:${n.slug}`} />
    </div>
  );
}
