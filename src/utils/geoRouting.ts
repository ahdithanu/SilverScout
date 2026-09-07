import { Lead } from '../types';

export interface GeoCoordinates {
  lat: number;
  lng: number;
}

// Comprehensive nationwide US metropolitan hubs across all 50 states and economic regions
export const CITY_COORDINATES: Record<string, GeoCoordinates> = {
  // California
  'Sacramento, CA': { lat: 38.5816, lng: -121.4944 },
  'Modesto, CA': { lat: 37.6391, lng: -120.9969 },
  'Fresno, CA': { lat: 36.7468, lng: -119.7726 },
  'Bakersfield, CA': { lat: 35.3733, lng: -119.0187 },
  'Roseville, CA': { lat: 38.7525, lng: -121.2880 },
  'Stockton, CA': { lat: 37.9577, lng: -121.2908 },
  'Redding, CA': { lat: 40.5865, lng: -122.3917 },
  'Los Angeles, CA': { lat: 34.0522, lng: -118.2437 },
  'San Francisco, CA': { lat: 37.7749, lng: -122.4194 },
  'San Diego, CA': { lat: 32.7157, lng: -117.1611 },
  'San Jose, CA': { lat: 37.3382, lng: -121.8863 },
  'Oakland, CA': { lat: 37.8044, lng: -122.2712 },
  'Anaheim, CA': { lat: 33.8366, lng: -117.9143 },
  'Riverside, CA': { lat: 33.9806, lng: -117.3755 },
  'Long Beach, CA': { lat: 33.7701, lng: -118.1937 },
  'Irvine, CA': { lat: 33.6846, lng: -117.8265 },

  // Texas
  'Dallas, TX': { lat: 32.7767, lng: -96.7970 },
  'Fort Worth, TX': { lat: 32.7555, lng: -97.3308 },
  'Houston, TX': { lat: 29.7604, lng: -95.3698 },
  'Austin, TX': { lat: 30.2672, lng: -97.7431 },
  'San Antonio, TX': { lat: 29.4241, lng: -98.4936 },
  'El Paso, TX': { lat: 31.7619, lng: -106.4850 },
  'Arlington, TX': { lat: 32.7357, lng: -97.1081 },
  'Plano, TX': { lat: 33.0198, lng: -96.6989 },
  'Lubbock, TX': { lat: 33.5779, lng: -101.8552 },
  'Corpus Christi, TX': { lat: 27.8006, lng: -97.3964 },

  // Southeast & Florida
  'Atlanta, GA': { lat: 33.7490, lng: -84.3880 },
  'Savannah, GA': { lat: 32.0809, lng: -81.0912 },
  'Augusta, GA': { lat: 33.4735, lng: -82.0105 },
  'Miami, FL': { lat: 25.7617, lng: -80.1918 },
  'Orlando, FL': { lat: 28.5383, lng: -81.3792 },
  'Tampa, FL': { lat: 27.9506, lng: -82.4572 },
  'St. Petersburg, FL': { lat: 27.7676, lng: -82.6403 },
  'Clearwater, FL': { lat: 27.9659, lng: -82.8001 },
  'Jacksonville, FL': { lat: 30.3322, lng: -81.6557 },
  'Fort Lauderdale, FL': { lat: 26.1224, lng: -80.1373 },
  'West Palm Beach, FL': { lat: 26.7153, lng: -80.0534 },
  'Charlotte, NC': { lat: 35.2271, lng: -80.8431 },
  'Raleigh, NC': { lat: 35.7796, lng: -78.6382 },
  'Greensboro, NC': { lat: 36.0726, lng: -79.7920 },
  'Durham, NC': { lat: 35.9940, lng: -78.8986 },
  'Nashville, TN': { lat: 36.1627, lng: -86.7816 },
  'Memphis, TN': { lat: 35.1495, lng: -90.0490 },
  'Knoxville, TN': { lat: 35.9606, lng: -83.9207 },
  'Chattanooga, TN': { lat: 35.0456, lng: -85.3097 },
  'Birmingham, AL': { lat: 33.5186, lng: -86.8104 },
  'Huntsville, AL': { lat: 34.7304, lng: -86.5861 },
  'Charleston, SC': { lat: 32.7765, lng: -79.9311 },
  'Columbia, SC': { lat: 34.0007, lng: -81.0348 },
  'Greenville, SC': { lat: 34.8526, lng: -82.3940 },
  'Richmond, VA': { lat: 37.5407, lng: -77.4360 },
  'Virginia Beach, VA': { lat: 36.8529, lng: -75.9780 },
  'Louisville, KY': { lat: 38.2527, lng: -85.7585 },
  'Lexington, KY': { lat: 38.0406, lng: -84.5037 },
  'New Orleans, LA': { lat: 29.9511, lng: -90.0715 },
  'Baton Rouge, LA': { lat: 30.4515, lng: -91.1871 },

  // Southwest & Mountain
  'Phoenix, AZ': { lat: 33.4484, lng: -112.0740 },
  'Tucson, AZ': { lat: 32.2226, lng: -110.9747 },
  'Mesa, AZ': { lat: 33.4152, lng: -111.8315 },
  'Scottsdale, AZ': { lat: 33.4942, lng: -111.9261 },
  'Denver, CO': { lat: 39.7392, lng: -104.9903 },
  'Colorado Springs, CO': { lat: 38.8339, lng: -104.8214 },
  'Fort Collins, CO': { lat: 40.5853, lng: -105.0844 },
  'Salt Lake City, UT': { lat: 40.7608, lng: -111.8910 },
  'Provo, UT': { lat: 40.2338, lng: -111.6585 },
  'Las Vegas, NV': { lat: 36.1699, lng: -115.1398 },
  'Reno, NV': { lat: 39.5296, lng: -119.8138 },
  'Albuquerque, NM': { lat: 35.0844, lng: -106.6504 },
  'Santa Fe, NM': { lat: 35.6870, lng: -105.9378 },
  'Boise, ID': { lat: 43.6150, lng: -116.2023 },

  // Midwest
  'Chicago, IL': { lat: 41.8781, lng: -87.6298 },
  'Naperville, IL': { lat: 41.7508, lng: -88.1535 },
  'Peoria, IL': { lat: 40.6936, lng: -89.5890 },
  'Indianapolis, IN': { lat: 39.7684, lng: -86.1581 },
  'Fort Wayne, IN': { lat: 41.0793, lng: -85.1394 },
  'Columbus, OH': { lat: 39.9612, lng: -82.9988 },
  'Cleveland, OH': { lat: 41.4993, lng: -81.6944 },
  'Cincinnati, OH': { lat: 39.1031, lng: -84.5120 },
  'Detroit, MI': { lat: 42.3314, lng: -83.0458 },
  'Grand Rapids, MI': { lat: 42.9634, lng: -85.6681 },
  'Minneapolis, MN': { lat: 44.9778, lng: -93.2650 },
  'St. Paul, MN': { lat: 44.9537, lng: -93.0900 },
  'St. Louis, MO': { lat: 38.6270, lng: -90.1994 },
  'Kansas City, MO': { lat: 39.0997, lng: -94.5786 },
  'Milwaukee, WI': { lat: 43.0389, lng: -87.9065 },
  'Madison, WI': { lat: 43.0731, lng: -89.4012 },
  'Omaha, NE': { lat: 41.2565, lng: -95.9345 },
  'Des Moines, IA': { lat: 41.5868, lng: -93.6250 },
  'Oklahoma City, OK': { lat: 35.4676, lng: -97.5164 },
  'Tulsa, OK': { lat: 36.1540, lng: -95.9928 },
  'Wichita, KS': { lat: 37.6872, lng: -97.3301 },

  // Northeast & Mid-Atlantic
  'New York, NY': { lat: 40.7128, lng: -74.0060 },
  'Philadelphia, PA': { lat: 39.9526, lng: -75.1652 },
  'Pittsburgh, PA': { lat: 40.4406, lng: -79.9959 },
  'Boston, MA': { lat: 42.3601, lng: -71.0589 },
  'Washington, DC': { lat: 38.9072, lng: -77.0369 },
  'Baltimore, MD': { lat: 39.2904, lng: -76.6122 },
  'Newark, NJ': { lat: 40.7357, lng: -74.1724 },
  'Buffalo, NY': { lat: 42.8864, lng: -78.8784 },
  'Hartford, CT': { lat: 41.7658, lng: -72.6734 },
  'Providence, RI': { lat: 41.8240, lng: -71.4128 },

  // Pacific Northwest
  'Seattle, WA': { lat: 47.6062, lng: -122.3321 },
  'Tacoma, WA': { lat: 47.2529, lng: -122.4443 },
  'Spokane, WA': { lat: 47.6588, lng: -117.4260 },
  'Portland, OR': { lat: 45.5152, lng: -122.6784 },
  'Eugene, OR': { lat: 44.0521, lng: -123.0868 },
  'Anchorage, AK': { lat: 61.2181, lng: -149.9003 },
  'Honolulu, HI': { lat: 21.3069, lng: -157.8583 }
};

// State centroids for resolving non-listed cities to their proper state bounds
export const US_STATE_CENTROIDS: Record<string, { lat: number; lng: number; name: string }> = {
  AL: { lat: 32.806671, lng: -86.79113, name: 'Alabama' },
  AK: { lat: 61.370716, lng: -152.404419, name: 'Alaska' },
  AZ: { lat: 33.729759, lng: -111.431221, name: 'Arizona' },
  AR: { lat: 34.969704, lng: -92.373123, name: 'Arkansas' },
  CA: { lat: 36.116203, lng: -119.681564, name: 'California' },
  CO: { lat: 39.059811, lng: -105.311104, name: 'Colorado' },
  CT: { lat: 41.597782, lng: -72.755371, name: 'Connecticut' },
  DE: { lat: 39.318523, lng: -75.507141, name: 'Delaware' },
  FL: { lat: 27.766279, lng: -81.686783, name: 'Florida' },
  GA: { lat: 33.040619, lng: -83.643074, name: 'Georgia' },
  HI: { lat: 21.094318, lng: -157.498337, name: 'Hawaii' },
  ID: { lat: 44.240459, lng: -114.478828, name: 'Idaho' },
  IL: { lat: 40.349457, lng: -88.986137, name: 'Illinois' },
  IN: { lat: 39.849426, lng: -86.258278, name: 'Indiana' },
  IA: { lat: 42.011539, lng: -93.210526, name: 'Iowa' },
  KS: { lat: 38.5266, lng: -96.726486, name: 'Kansas' },
  KY: { lat: 37.66814, lng: -84.670067, name: 'Kentucky' },
  LA: { lat: 31.169546, lng: -91.867805, name: 'Louisiana' },
  ME: { lat: 44.693947, lng: -69.381927, name: 'Maine' },
  MD: { lat: 39.063946, lng: -76.802101, name: 'Maryland' },
  MA: { lat: 42.230171, lng: -71.530106, name: 'Massachusetts' },
  MI: { lat: 43.326618, lng: -84.536095, name: 'Michigan' },
  MN: { lat: 45.694454, lng: -93.900192, name: 'Minnesota' },
  MS: { lat: 32.741646, lng: -89.678696, name: 'Mississippi' },
  MO: { lat: 38.456085, lng: -92.288368, name: 'Missouri' },
  MT: { lat: 46.921925, lng: -110.454353, name: 'Montana' },
  NE: { lat: 41.12537, lng: -98.268082, name: 'Nebraska' },
  NV: { lat: 38.313515, lng: -117.055374, name: 'Nevada' },
  NH: { lat: 43.452492, lng: -71.563896, name: 'New Hampshire' },
  NJ: { lat: 40.298904, lng: -74.521011, name: 'New Jersey' },
  NM: { lat: 34.840515, lng: -106.248482, name: 'New Mexico' },
  NY: { lat: 42.165726, lng: -74.948051, name: 'New York' },
  NC: { lat: 35.630066, lng: -79.806419, name: 'North Carolina' },
  ND: { lat: 47.528912, lng: -99.784012, name: 'North Dakota' },
  OH: { lat: 40.388783, lng: -82.764915, name: 'Ohio' },
  OK: { lat: 35.565342, lng: -96.928917, name: 'Oklahoma' },
  OR: { lat: 44.572021, lng: -122.070938, name: 'Oregon' },
  PA: { lat: 40.590752, lng: -77.209755, name: 'Pennsylvania' },
  RI: { lat: 41.680893, lng: -71.51178, name: 'Rhode Island' },
  SC: { lat: 33.856892, lng: -80.945007, name: 'South Carolina' },
  SD: { lat: 44.299782, lng: -99.438828, name: 'South Dakota' },
  TN: { lat: 35.747845, lng: -86.692345, name: 'Tennessee' },
  TX: { lat: 31.054487, lng: -97.563461, name: 'Texas' },
  UT: { lat: 40.150032, lng: -111.862434, name: 'Utah' },
  VT: { lat: 44.045876, lng: -72.710686, name: 'Vermont' },
  VA: { lat: 37.769337, lng: -78.169968, name: 'Virginia' },
  WA: { lat: 47.400902, lng: -121.490494, name: 'Washington' },
  WV: { lat: 38.491226, lng: -80.954453, name: 'West Virginia' },
  WI: { lat: 44.268543, lng: -89.616508, name: 'Wisconsin' },
  WY: { lat: 42.755966, lng: -107.30249, name: 'Wyoming' }
};

export function calculateHaversineDistanceMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8; // Radius of Earth in miles
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

/**
 * Flexible, resilient location resolver that parses:
 * 1. Direct city matches in CITY_COORDINATES
 * 2. Case-insensitive and normalized city & state matches
 * 3. City name prefix or substring match
 * 4. State identification (e.g. "Tyler, TX" places within Texas)
 * 5. Deterministic hash placement within the target state or national boundary
 */
export function resolveLocationCoordinates(locationStr: string): GeoCoordinates {
  if (!locationStr) {
    return { lat: 39.8283, lng: -98.5795 }; // US Geographic Center
  }

  const clean = locationStr.trim();
  const lower = clean.toLowerCase();
  const normalized = lower.replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

  // 1. Exact match against CITY_COORDINATES keys
  for (const [cityKey, coords] of Object.entries(CITY_COORDINATES)) {
    const keyLower = cityKey.toLowerCase();
    const keyNorm = keyLower.replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
    if (lower === keyLower || normalized === keyNorm) {
      return coords;
    }
  }

  // 2. Direct city name match (e.g. "tampa" -> 'Tampa, FL', "dallas" -> 'Dallas, TX')
  for (const [cityKey, coords] of Object.entries(CITY_COORDINATES)) {
    const cityNameOnly = cityKey.split(',')[0].trim().toLowerCase();
    if (lower === cityNameOnly || normalized === cityNameOnly) {
      return coords;
    }
  }

  // 3. Substring match if input includes city name AND state
  for (const [cityKey, coords] of Object.entries(CITY_COORDINATES)) {
    const cityNameOnly = cityKey.split(',')[0].trim().toLowerCase();
    const stateOnly = cityKey.split(',')[1]?.trim().toLowerCase() || '';
    if (lower.includes(cityNameOnly) && (stateOnly ? lower.includes(stateOnly) : true)) {
      return coords;
    }
  }

  // 4. City name substring match
  for (const [cityKey, coords] of Object.entries(CITY_COORDINATES)) {
    const cityNameOnly = cityKey.split(',')[0].trim().toLowerCase();
    if (lower.includes(cityNameOnly)) {
      return coords;
    }
  }

  // 5. State code extraction (e.g. "FL", "TX", "CA", "Tyler TX")
  const stateCodeMatch = clean.match(/\b([A-Za-z]{2})\b/);
  if (stateCodeMatch) {
    const code = stateCodeMatch[1].toUpperCase();
    if (US_STATE_CENTROIDS[code]) {
      const state = US_STATE_CENTROIDS[code];
      const hash = clean.split('').reduce((acc, char, i) => acc + char.charCodeAt(0) * (i + 1), 0);
      const latOffset = ((hash % 100) - 50) / 75;
      const lngOffset = (((hash * 7) % 100) - 50) / 75;
      return {
        lat: Number((state.lat + latOffset).toFixed(4)),
        lng: Number((state.lng + lngOffset).toFixed(4))
      };
    }
  }

  // 6. State full name extraction (e.g. "Dallas Texas", "Tampa Florida")
  for (const [code, state] of Object.entries(US_STATE_CENTROIDS)) {
    if (lower.includes(state.name.toLowerCase())) {
      const hash = clean.split('').reduce((acc, char, i) => acc + char.charCodeAt(0) * (i + 1), 0);
      const latOffset = ((hash % 100) - 50) / 75;
      const lngOffset = (((hash * 7) % 100) - 50) / 75;
      return {
        lat: Number((state.lat + latOffset).toFixed(4)),
        lng: Number((state.lng + lngOffset).toFixed(4))
      };
    }
  }

  // 7. Fallback deterministic placement within continental US
  const hash = clean.split('').reduce((acc, char, i) => acc + char.charCodeAt(0) * (i + 1), 0);
  const lat = 32.0 + ((hash % 140) / 10);
  const lng = -118.0 + ((hash % 420) / 10);
  return {
    lat: Number(lat.toFixed(4)),
    lng: Number(lng.toFixed(4))
  };
}

export function getLeadCoordinates(lead: Lead): GeoCoordinates {
  const baseCoords = resolveLocationCoordinates(lead.location);
  if (!lead.name) return baseCoords;

  // Apply deterministic sub-metro dispersion so multiple businesses in the same city
  // (e.g. 10 businesses in Tampa, FL) are spread 1.5 to 8.5 miles across the metro area
  // instead of stacking on the identical pixel coordinate with '+0 mi from prev'
  const seed = (lead.name + (lead.id || '')).split('').reduce((acc, char, idx) => acc + char.charCodeAt(0) * (idx + 1), 0);
  const angle = (seed % 360) * (Math.PI / 180);
  const distanceMiles = 1.5 + ((seed % 70) / 10); // 1.5 to 8.5 miles
  const latOffset = (distanceMiles / 69.0) * Math.cos(angle);
  const lngOffset = (distanceMiles / (69.0 * Math.cos(Math.max(0.2, baseCoords.lat * (Math.PI / 180))))) * Math.sin(angle);

  return {
    lat: Number((baseCoords.lat + latOffset).toFixed(4)),
    lng: Number((baseCoords.lng + lngOffset).toFixed(4))
  };
}

/**
 * Extracts unique departure hubs from the actual active leads pool,
 * providing real-time, zero-configuration dropdown options based on ingested data.
 */
export function extractAvailableHubs(leads: Lead[]): Array<{ name: string; count: number }> {
  const hubCounts: Record<string, number> = {};

  leads.forEach(lead => {
    if (!lead.location) return;
    const clean = lead.location.trim();
    let matchedName = clean;
    for (const cityKey of Object.keys(CITY_COORDINATES)) {
      const cityName = cityKey.split(',')[0].toLowerCase();
      if (clean.toLowerCase().includes(cityName)) {
        matchedName = cityKey;
        break;
      }
    }
    hubCounts[matchedName] = (hubCounts[matchedName] || 0) + 1;
  });

  return Object.entries(hubCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Detects the dominant market hub from the active leads pool
 */
export function detectDominantCityHub(leads: Lead[]): string {
  const hubs = extractAvailableHubs(leads);
  if (hubs.length > 0) {
    return hubs[0].name;
  }
  return 'Dallas, TX';
}

export interface ScoutRouteStop {
  stopNumber: number;
  lead: Lead;
  distanceFromPreviousMiles: number;
  coordinates: GeoCoordinates;
}

export interface OptimizedRouteItinerary {
  stops: ScoutRouteStop[];
  totalDistanceMiles: number;
  estimatedDriveMinutes: number;
  googleMapsUrl: string;
}

export function filterLeadsByRadius(leads: Lead[], hubCity: string, radiusMiles: number): Lead[] {
  const hubCoords = resolveLocationCoordinates(hubCity);

  return leads.filter(lead => {
    const leadCoords = getLeadCoordinates(lead);
    const dist = calculateHaversineDistanceMiles(hubCoords.lat, hubCoords.lng, leadCoords.lat, leadCoords.lng);
    return dist <= radiusMiles;
  });
}

export function optimizeScoutDrivingRoute(targetLeads: Lead[], hubCity: string): OptimizedRouteItinerary {
  const hubCoords = resolveLocationCoordinates(hubCity);
  const unvisited = [...targetLeads];
  const stops: ScoutRouteStop[] = [];

  let currentLat = hubCoords.lat;
  let currentLng = hubCoords.lng;
  let totalDistanceMiles = 0;

  while (unvisited.length > 0) {
    let nearestIndex = 0;
    let nearestDist = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const coords = getLeadCoordinates(unvisited[i]);
      const dist = calculateHaversineDistanceMiles(currentLat, currentLng, coords.lat, coords.lng);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestIndex = i;
      }
    }

    const nextLead = unvisited.splice(nearestIndex, 1)[0];
    const nextCoords = getLeadCoordinates(nextLead);

    stops.push({
      stopNumber: stops.length + 1,
      lead: nextLead,
      distanceFromPreviousMiles: nearestDist,
      coordinates: nextCoords
    });

    totalDistanceMiles += nearestDist;
    currentLat = nextCoords.lat;
    currentLng = nextCoords.lng;
  }

  totalDistanceMiles = Number(totalDistanceMiles.toFixed(1));
  const estimatedDriveMinutes = Math.round(totalDistanceMiles * 1.6); // Avg 37.5 mph in local trade regions

  // Build multi-stop Google Maps URL
  const destinationQuery = stops.map(s => encodeURIComponent(`${s.lead.name}, ${s.lead.location}`)).join('/');
  const googleMapsUrl = `https://www.google.com/maps/dir/${encodeURIComponent(hubCity)}/${destinationQuery}`;

  return {
    stops,
    totalDistanceMiles,
    estimatedDriveMinutes,
    googleMapsUrl
  };
}

