import React from 'react';

export default function About() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <h1 className="text-2xl font-semibold">About Caba</h1>
      <section>
        <h2 className="font-semibold mb-1">Municipal Profile</h2>
        <p className="text-gray-700 text-sm">Caba is a coastal municipality in the province of La Union, Philippines. This prototype summarizes key information for UI purposes.</p>
      </section>
      <section>
        <h2 className="font-semibold mb-1">Vision and Mission</h2>
        <p className="text-gray-700 text-sm">Vision: A resilient, inclusive, and progressive Caba.
        Mission: Deliver efficient public service, promote sustainable development, and uphold transparency and good governance.</p>
      </section>
      <section>
        <h2 className="font-semibold mb-1">General Information</h2>
        <ul className="list-disc ml-5 text-sm text-gray-700">
          <li>Province: La Union</li>
          <li>Region: Ilocos Region (Region I)</li>
          <li>Population: —</li>
          <li>Land Area: —</li>
        </ul>
      </section>
      <section>
        <h2 className="font-semibold mb-1">Quality Policy</h2>
        <p className="text-gray-700 text-sm">We commit to continuous improvement, citizen-centered services, and adherence to legal and regulatory requirements.</p>
      </section>
    </div>
  );
}
