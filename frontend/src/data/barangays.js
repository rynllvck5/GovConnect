const make = (name) => ({
  slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  name,
  description: 'Information placeholder for this barangay. Replace with official profile, history, and key data.',
  population: '—',
  officials: [
    { role: 'Punong Barangay', name: '—' },
    { role: 'Barangay Kagawad', name: '—' },
    { role: 'Barangay Kagawad', name: '—' },
    { role: 'Barangay Kagawad', name: '—' },
    { role: 'Barangay Kagawad', name: '—' },
    { role: 'Barangay Kagawad', name: '—' },
    { role: 'Barangay Kagawad', name: '—' },
    { role: 'SK Chairperson', name: '—' }
  ],
  achievements: [],
  images: ['https://picsum.photos/seed/' + name.toLowerCase().split(' ')[0] + '/960/540'],
  tourismSpots: [], // slugs of tourism.spots
  products: [] // slugs of tourism.products
});

const barangays = [
  make('Acatio'),
  make('Bato'),
  make('Bucarot'),
  make('Calzada'),
  make('Gana'),
  make('Gupac'),
  make('Las-ud'),
  make('Namonitan'),
  make('Palintucang'),
  make('Rabanal'),
  make('San Cornelio'),
  make('San Jose'),
  make('San Julian'),
  make('San Roque'),
  make('Santa Rita'),
  make('Santo Niño'),
  make('Sioasio East'),
  make('Sioasio West'),
  make('Sobredillo'),
  make('Taberna')
];

export default barangays;
