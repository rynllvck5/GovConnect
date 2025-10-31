import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">CA</div>
              <div className="font-semibold">Municipality of Caba</div>
            </div>
            <p className="text-sm text-gray-600">Province of La Union, Philippines</p>
            <p className="text-sm text-gray-600 mt-2">This is a prototype UI. Data and features are placeholders.</p>
          </div>
          <div>
            <div className="font-semibold mb-2">Quick Links</div>
            <ul className="space-y-1 text-sm">
              <li><Link className="text-gray-700 hover:text-blue-700" to="/services">Services</Link></li>
              <li><Link className="text-gray-700 hover:text-blue-700" to="/forms">Forms</Link></li>
              <li><Link className="text-gray-700 hover:text-blue-700" to="/projects">Projects</Link></li>
              <li><Link className="text-gray-700 hover:text-blue-700" to="/news">Features</Link></li>
            </ul>
          </div>
          <div>
            <div className="font-semibold mb-2">Government</div>
            <ul className="space-y-1 text-sm">
              <li><Link className="text-gray-700 hover:text-blue-700" to="/government#officials">Officials</Link></li>
              <li><Link className="text-gray-700 hover:text-blue-700" to="/government#offices">Offices</Link></li>
              <li><Link className="text-gray-700 hover:text-blue-700" to="/government#barangays">Barangays</Link></li>
            </ul>
          </div>
          <div>
            <div className="font-semibold mb-2">Contact</div>
            <p className="text-sm text-gray-600">Municipal Hall, Caba, La Union</p>
            <p className="text-sm text-gray-600">Tel: (072) 000-0000</p>
            <p className="text-sm text-gray-600">Email: info@caba.gov.ph</p>
          </div>
        </div>
        <div className="border-t mt-8 pt-4 text-xs text-gray-500">© {new Date().getFullYear()} Municipality of Caba, La Union. Prototype site.</div>
      </div>
    </footer>
  );
}
