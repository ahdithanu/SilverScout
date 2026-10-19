import { Lead } from '../types';

export const CITY_COORDINATES_MAP: Record<string, { x: number; y: number }> = {
  'stockton, ca': { x: 44, y: 42 },
  'manteca, ca': { x: 46, y: 44 },
  'san jose, ca': { x: 38, y: 56 },
  'sacramento, ca': { x: 42, y: 34 },
  'fresno, ca': { x: 58, y: 64 },
  'san francisco, ca': { x: 32, y: 48 },
  'oakland, ca': { x: 34, y: 46 },
  'los angeles, ca': { x: 72, y: 82 },
  'san diego, ca': { x: 80, y: 92 },
  'modesto, ca': { x: 48, y: 46 },
  'bakersfield, ca': { x: 64, y: 74 },
  'palo alto, ca': { x: 36, y: 52 },
  'austin, tx': { x: 60, y: 70 },
  'dallas, tx': { x: 62, y: 55 },
  'phoenix, az': { x: 35, y: 68 }
};

export function getLeadCoordinates(location: string, id: string): { x: number; y: number } {
  const locLower = (location || '').toLowerCase().trim();
  if (CITY_COORDINATES_MAP[locLower]) {
    return CITY_COORDINATES_MAP[locLower];
  }
  const matchedKey = Object.keys(CITY_COORDINATES_MAP).find(k => {
    const cityNameOnly = k.split(',')[0].trim();
    return locLower.includes(cityNameOnly) || cityNameOnly.includes(locLower);
  });
  if (matchedKey) {
    return CITY_COORDINATES_MAP[matchedKey];
  }
  let hash = 0;
  for (let i = 0; i < (id + location).length; i++) {
    hash = ((hash << 5) - hash) + (id + location).charCodeAt(i);
    hash |= 0;
  }
  const posX = 15 + Math.abs(hash % 70);
  const posY = 15 + Math.abs((hash >> 3) % 70);
  return { x: posX, y: posY };
}

export const SAMPLE_CSV_TEMPLATE = `Business Name,Industry,Location,Revenue,EBITDA,Permit Drop,Owner Name,Tags
Valley HVAC & Sheet Metal,HVAC,Modesto CA,4500000,900000,45,Robert Miller,family-owned;hvac
Gold Country Plumbing,Plumbing,Sacramento CA,3200000,640000,35,David Vance,commercial;high-growth
Pacific Tool & Die,Manufacturing,Stockton CA,5800000,1100000,50,Arthur Pendelton,manufacturing;legacy
Bay Area Electrical Services,Electrical,Oakland CA,2900000,580000,20,Carlos Mendez,residential`;

export function createSampleDemoLeads(creatorId: string): Partial<Lead>[] {
  return [
    {
      name: "Manteca HVAC Solutions",
      industry: "HVAC & Mechanical",
      location: "Manteca, CA",
      address: "1140 Industrial Park Dr, Manteca, CA 95337",
      phone: "(209) 823-1490",
      email: "contact@mantecahvac.com",
      website: "https://www.mantecahvac.com",
      registrationDate: "2002-05-14",
      agentName: "Robert Miller",
      isCorporateAgent: false,
      permitVolume2023_2025: 45,
      permitVolume2026: 12,
      permitDrop: 73,
      lastDigitalPostDate: "2023-11-20",
      reviewVelocity: 0.2,
      revenue: 3400000,
      ebitda: 748000,
      profitMargin: 22,
      valuationEstimate: 3366000,
      exitPropensityScore: 8.8,
      fundId: 'redwood-cap',
      dealSourceChannel: 'OFF_MARKET_SCOUT',
      status: 'qualified',
      businessProfile: {
        streetAddress: "1140 Industrial Park Dr, Manteca, CA 95337",
        phone: "(209) 823-1490",
        email: "contact@mantecahvac.com",
        website: "https://www.mantecahvac.com",
        ownerTitle: "Founder & President",
        employeeCount: 22,
        yearEstablished: 2002,
        entityType: "S-Corporation",
        facilitySqFt: 14000,
        fleetSize: 14,
        coreServices: ['Commercial HVAC Installation', 'Preventative Maintenance (PMA)', 'Industrial Controls', '24/7 Mechanical Dispatch'],
        googleRating: 4.7,
        totalReviews: 64,
        licenseNumber: "CA-LIC#819204",
        bbbRating: "A+",
        businessDescription: "Full-service commercial HVAC contractor with 24 years operating history in San Joaquin County, specializing in commercial rooftop retrofits and institutional maintenance contracts."
      },
      socialLinks: {
        website: "https://www.mantecahvac.com",
        linkedin: "https://www.linkedin.com/company/manteca-hvac",
        twitter: "https://twitter.com/mantecahvac"
      },
      tags: ['Off-Market', 'Permit Contraction', 'Retirement Candidate', '22 Staff'],
      aiThesis: "Proprietary acquisition target in Manteca, CA. 24 years operating history under founder Robert Miller. 73% permit contraction signals urgent owner fatigue; clean 22% EBITDA makes this an ideal tuck-in candidate.",
      aiStrengths: ['24-year continuous municipal brand presence', 'Clean 22% EBITDA margin ($748k clean cash flow)', 'Zero active digital ad spend or marketing', 'Owned 14,000 sq ft warehouse facility & 14-van fleet'],
      aiWeaknesses: ['73% permit contraction indicating operational deceleration', 'High founder key-man reliance'],
      createdAt: new Date().toISOString(),
      createdBy: creatorId
    },
    {
      name: "San Jose Precision Plumbing",
      industry: "Commercial Plumbing",
      location: "San Jose, CA",
      address: "2250 Junction Ave, San Jose, CA 95131",
      phone: "(408) 432-8810",
      email: "info@sanjoseplumbing.com",
      website: "https://www.sanjoseplumbing.com",
      registrationDate: "1998-03-22",
      agentName: "Law Offices of Smith & Co",
      isCorporateAgent: true,
      permitVolume2023_2025: 120,
      permitVolume2026: 115,
      permitDrop: 4,
      lastDigitalPostDate: "2026-03-01",
      reviewVelocity: 4.5,
      revenue: 6800000,
      ebitda: 1428000,
      profitMargin: 21,
      valuationEstimate: 6426000,
      exitPropensityScore: 5.2,
      fundId: 'redwood-cap',
      dealSourceChannel: 'OFF_MARKET_SCOUT',
      status: 'new',
      businessProfile: {
        streetAddress: "2250 Junction Ave, San Jose, CA 95131",
        phone: "(408) 432-8810",
        email: "info@sanjoseplumbing.com",
        website: "https://www.sanjoseplumbing.com",
        ownerTitle: "Managing Principal",
        employeeCount: 42,
        yearEstablished: 1998,
        entityType: "C-Corporation",
        facilitySqFt: 18500,
        fleetSize: 24,
        coreServices: ['Commercial Plumbing Systems', 'Industrial Hydronic Boilers', 'Backflow Prevention & Jetting', 'Underground Utilities'],
        googleRating: 4.8,
        totalReviews: 142,
        licenseNumber: "CA-LIC#749210",
        bbbRating: "A+",
        businessDescription: "Silicon Valley commercial plumbing firm with extensive high-density residential and tech campus piping contracts across Santa Clara County."
      },
      socialLinks: {
        website: "https://www.sanjoseplumbing.com",
        linkedin: "https://www.linkedin.com/company/sj-precision-plumbing"
      },
      tags: ['Off-Market', 'Corporate Agent', 'Stable Volume', '42 Staff'],
      aiThesis: "Corporate-managed plumbing operation with stable permit flow and active modern marketing. Low seller fatigue; candidate for secondary consolidation at market multiple.",
      aiStrengths: ['High revenue scale ($6.8M) with stable commercial accounts', 'Strong digital presence with 4.5 reviews/month', 'Modern 24-vehicle fleet with computerized dispatch'],
      aiWeaknesses: ['Corporate agent with institutional ownership structure', 'Low exit urgency; minimal discount opportunity'],
      createdAt: new Date().toISOString(),
      createdBy: creatorId
    },
    {
      name: "Central Valley Tool & Die",
      industry: "Precision Machining",
      location: "Stockton, CA",
      address: "3480 E Fremont St, Stockton, CA 95205",
      phone: "(209) 948-2200",
      email: "admin@centralvalleytool.com",
      website: "https://www.centralvalleytool.com",
      registrationDate: "1985-08-10",
      agentName: "Gary Thompson",
      isCorporateAgent: false,
      permitVolume2023_2025: 30,
      permitVolume2026: 5,
      permitDrop: 83,
      lastDigitalPostDate: "2021-05-12",
      reviewVelocity: 0.1,
      revenue: 4200000,
      ebitda: 1008000,
      profitMargin: 24,
      valuationEstimate: 4536000,
      exitPropensityScore: 9.4,
      fundId: 'redwood-cap',
      dealSourceChannel: 'OFF_MARKET_SCOUT',
      status: 'qualified',
      businessProfile: {
        streetAddress: "3480 E Fremont St, Stockton, CA 95205",
        phone: "(209) 948-2200",
        email: "admin@centralvalleytool.com",
        website: "https://www.centralvalleytool.com",
        ownerTitle: "Founder & Master Machinist",
        employeeCount: 28,
        yearEstablished: 1985,
        entityType: "S-Corporation",
        facilitySqFt: 24000,
        fleetSize: 6,
        coreServices: ['5-Axis CNC Precision Machining', 'Tool & Die Fabrication', 'AS9100 Aerospace Tooling', 'Heavy Stamping Dies'],
        googleRating: 4.6,
        totalReviews: 38,
        licenseNumber: "CA-LIC#691823",
        bbbRating: "A+",
        businessDescription: "High-precision tool, die, and CNC machine shop serving agricultural and industrial equipment manufacturing throughout Northern California for over four decades."
      },
      socialLinks: {
        website: "https://www.centralvalleytool.com",
        linkedin: "https://www.linkedin.com/company/cv-tool-die"
      },
      tags: ['Off-Market', 'Critical Fatigue', 'Single Owner', '28 Staff'],
      aiThesis: "Critical off-market machining candidate in Stockton, CA. 41 years in operation. 83% drop in commercial activity with dormant digital presence (last post 2021). High probability of founder retirement without internal successor.",
      aiStrengths: ['41-year defense/aerospace supply history', 'Superior 24% EBITDA margin ($1.01M cash flow)', 'Defensible proprietary tooling and 24,000 sq ft facility'],
      aiWeaknesses: ['Severe 83% permit and activity drop', 'Owner is sole point of contact for customer accounts'],
      createdAt: new Date().toISOString(),
      createdBy: creatorId
    }
  ];
}
