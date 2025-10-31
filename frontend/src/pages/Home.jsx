import React from 'react';
import { Link } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import news from '../data/news';
import projects from '../data/projects';

export default function Home() {
  return (
    <div>
      <section className="bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-3xl sm:text-4xl font-bold">Municipality of Caba, La Union</h1>
          <p className="mt-2 text-blue-100 max-w-2xl">Prototype portal for services and tourism. Explore services, download forms, and learn about ongoing projects.</p>
          <div className="mt-6"><SearchBar /></div>
          <div className="mt-6 flex gap-3">
            <Link to="/services" className="bg-white text-blue-700 px-4 py-2 rounded-md font-medium hover:bg-blue-50">Browse Services</Link>
            <Link to="/forms" className="border border-white px-4 py-2 rounded-md hover:bg-blue-700">Download Forms</Link>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Featured News & Events</h2>
          <div className="space-y-3">
            {news.slice(0,3).map((n) => (
              <Link key={n.id} to={`/news/${n.slug}`} className="block p-4 border rounded-md hover:border-blue-400">
                <div className="text-sm text-gray-500">{n.date}</div>
                <div className="font-medium">{n.title}</div>
                <div className="text-sm text-gray-600">{n.summary}</div>
              </Link>
            ))}
          </div>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-4">Recent Projects</h2>
          <div className="overflow-x-auto border rounded-md">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-2">Project</th>
                  <th className="text-left p-2">Budget</th>
                  <th className="text-left p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {projects.slice(0,5).map(p => (
                  <tr key={p.id} className="border-t">
                    <td className="p-2">{p.title}</td>
                    <td className="p-2">₱{p.budget.toLocaleString()}</td>
                    <td className="p-2"><span className={`px-2 py-1 rounded text-xs ${p.status === 'Ongoing' ? 'bg-yellow-100 text-yellow-800' : p.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{p.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3"><Link className="text-blue-700 hover:underline" to="/projects">View all projects</Link></div>
        </div>
      </section>
    </div>
  );
}
