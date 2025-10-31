import React from 'react';
import { NavLink, Link } from 'react-router-dom';

const navLinkClass = ({ isActive }) =>
  `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:text-blue-700 hover:bg-blue-50'}`;

export default function Header() {
  return (
    <header className="bg-white shadow sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">CA</div>
              <div className="leading-tight">
                <div className="font-semibold text-gray-900">Municipality of Caba</div>
                <div className="text-xs text-gray-500">La Union</div>
              </div>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            <NavLink to="/" className={navLinkClass} end>Home</NavLink>
            <NavLink to="/services" className={navLinkClass}>Services</NavLink>
            <NavLink to="/forms" className={navLinkClass}>Forms</NavLink>
            <NavLink to="/government" className={navLinkClass}>Government</NavLink>
            <NavLink to="/tourism" className={navLinkClass}>Tourism</NavLink>
            <NavLink to="/projects" className={navLinkClass}>Projects</NavLink>
            <NavLink to="/news" className={navLinkClass}>Features</NavLink>
            <NavLink to="/forum" className={navLinkClass}>Forum</NavLink>
            <NavLink to="/about" className={navLinkClass}>About</NavLink>
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <Link to="/login" className="text-sm text-gray-700 hover:text-blue-700">Log in</Link>
            <Link to="/signup" className="text-sm bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700">Sign up</Link>
          </div>

          <div className="md:hidden">
            {/* Minimal mobile menu placeholder for prototype */}
            <details>
              <summary className="px-3 py-2 border rounded-md text-sm text-gray-700">Menu</summary>
              <div className="mt-2 flex flex-col gap-1 p-2 bg-white border rounded-md">
                <NavLink to="/" className={navLinkClass} end>Home</NavLink>
                <NavLink to="/services" className={navLinkClass}>Services</NavLink>
                <NavLink to="/forms" className={navLinkClass}>Forms</NavLink>
                <NavLink to="/government" className={navLinkClass}>Government</NavLink>
                <NavLink to="/tourism" className={navLinkClass}>Tourism</NavLink>
                <NavLink to="/projects" className={navLinkClass}>Projects</NavLink>
                <NavLink to="/news" className={navLinkClass}>Features</NavLink>
              <NavLink to="/forum" className={navLinkClass}>Forum</NavLink>
              <NavLink to="/about" className={navLinkClass}>About</NavLink>
                <Link to="/login" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-700 hover:bg-blue-50">Log in</Link>
                <Link to="/signup" className="px-3 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700">Sign up</Link>
              </div>
            </details>
          </div>
      </div>
      </div>
    </header>
  );
}
