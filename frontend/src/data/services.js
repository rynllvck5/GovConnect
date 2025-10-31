const services = [
  {
    slug: 'executive-services',
    title: 'Executive Services',
    description: 'Services under the Office of the Municipal Mayor, including executive orders and special programs.',
    office: 'Office of the Municipal Mayor',
    head: 'Municipal Mayor',
    location: 'Municipal Hall, Ground Floor',
    contact: '(072) 000-0000',
    requirements: ['Valid ID', 'Duly accomplished request form (if applicable)'],
    files: [
      // No specific downloadable form for prototype
    ],
    steps: [
      'Proceed to the Office of the Municipal Mayor information desk.',
      'State the purpose of your request.',
      'Submit requirements (if any) for validation.',
      'Receive schedule or document as applicable.'
    ]
  },
  {
    slug: 'legislative-services',
    title: 'Legislative Services',
    description: 'Access to municipal ordinances and resolutions, and requests to the Sangguniang Bayan.',
    office: 'Sangguniang Bayan Office',
    head: 'Vice Mayor',
    location: 'Municipal Hall, 2nd Floor',
    contact: '(072) 000-0001',
    requirements: ['Request letter (if applicable)'],
    files: [],
    steps: ['Go to the SB Secretariat.', 'Submit request or inquiry.', 'Wait for advice on retrieval or processing.']
  },
  {
    slug: 'social-welfare',
    title: 'Social Welfare Services',
    description: 'Assistance programs, senior citizen and PWD services, and emergency aid.',
    office: 'MSWD Office',
    head: 'MSWD Officer',
    location: 'Municipal Hall, Ground Floor',
    contact: '(072) 000-0002',
    requirements: ['Barangay certification', 'Valid ID', 'MSWD intake form'],
    files: [
      { label: 'MSWD Intake Form', path: '/forms/MSWD_Intake_Form.txt' }
    ],
    steps: ['Proceed to MSWD desk.', 'Interview and validation.', 'Receive assistance schedule or referral.']
  },
  {
    slug: 'civil-registry',
    title: 'Civil Registry Services',
    description: 'Birth, marriage, death registration and issuance of certified copies.',
    office: 'Office of the Municipal Civil Registrar',
    head: 'Municipal Civil Registrar',
    location: 'Municipal Hall, Ground Floor',
    contact: '(072) 000-0003',
    requirements: ['Accomplished application form', 'Valid ID', 'Supporting documents'],
    files: [
      { label: 'Birth Certificate Request Form', path: '/forms/Birth_Certificate_Request.txt' }
    ],
    steps: ['Secure and fill out the form.', 'Submit documents for verification.', 'Pay fees at the cashier (if applicable).', 'Claim the document as scheduled.']
  },
  {
    slug: 'agriculture',
    title: 'Agriculture Services',
    description: 'Farmer assistance, agri inputs, and technical services.',
    office: 'Municipal Agriculture Office',
    head: 'Municipal Agriculturist',
    location: 'Municipal Hall, Annex',
    contact: '(072) 000-0004',
    requirements: ['Valid ID', 'Barangay certification (if required)'],
    files: [],
    steps: ['Proceed to MAO.', 'Present requirements.', 'Schedule field visit or receive inputs per program guidelines.']
  },
  {
    slug: 'health',
    title: 'Health Services',
    description: 'Primary healthcare, immunization, and public health programs.',
    office: 'Rural Health Unit',
    head: 'Municipal Health Officer',
    location: 'RHU Building',
    contact: '(072) 000-0005',
    requirements: ['Health card (if any)', 'Valid ID'],
    files: [],
    steps: ['Register at RHU front desk.', 'Consultation/Service.', 'Receive medicine or schedule follow-up.']
  },
  {
    slug: 'human-resource',
    title: 'Human Resource Services',
    description: 'Employment records, clearances, and HR-related certifications.',
    office: 'Human Resource Management Office',
    head: 'HRMO Head',
    location: 'Municipal Hall, 2nd Floor',
    contact: '(072) 000-0006',
    requirements: ['Request form', 'Valid ID'],
    files: [],
    steps: ['Proceed to HRMO.', 'Submit requirements.', 'Receive schedule for release.']
  },
  {
    slug: 'bpls',
    title: 'Business Permit & Licensing',
    description: 'Application and renewal of business permits.',
    office: 'Business Permits and Licensing Office',
    head: 'BPLO Head',
    location: 'Municipal Hall, Ground Floor',
    contact: '(072) 000-0007',
    requirements: ['Accomplished application form', 'DTI/SEC registration', 'Barangay clearance'],
    files: [
      { label: 'Business Permit Application Form', path: '/forms/Business_Permit_Application.txt' },
      { label: 'Barangay Clearance Form', path: '/forms/Barangay_Clearance.txt' }
    ],
    steps: ['Secure and fill out the BPLS form.', 'Submit requirements for evaluation.', 'Pay fees at the cashier.', 'Claim the permit.']
  },
  {
    slug: 'general-services',
    title: 'General Services',
    description: 'Building maintenance, supply management, and other logistical services.',
    office: 'General Services Office',
    head: 'GSO Head',
    location: 'Municipal Hall, Annex',
    contact: '(072) 000-0008',
    requirements: ['Request slip', 'Valid ID'],
    files: [],
    steps: ['Proceed to GSO counter.', 'Submit request.', 'Wait for schedule/approval.']
  }
];

export default services;
