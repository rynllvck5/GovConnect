import React from 'react';
import forms from '../data/forms';

export default function Forms() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-semibold mb-4">Downloadable Forms</h1>
      <p className="text-gray-600 mb-4">Download and print the forms. Submit them to the relevant office as described in the Services page. Files are placeholders for this prototype.</p>
      <div className="divide-y border rounded-md">
        {forms.map((f) => (
          <div key={f.id} className="p-4 flex items-center justify-between">
            <div>
              <div className="font-medium">{f.title}</div>
              <div className="text-sm text-gray-600">{f.description}</div>
            </div>
            <a className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700" href={f.path} download>
              Download
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
