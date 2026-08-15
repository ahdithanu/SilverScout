import { Lead } from '../types';

export interface GeoCoordinates {
  lat: number;
  lng: number;
}

export const CITY_COORDINATES: Record<string, GeoCoordinates> = {
  'Sacramento, CA': { lat: 38.5816, lng: -121.4944 },
  'Modesto, CA': { lat: 37.6391, lng: -120.9969 },
  'Fresno, CA': { lat: 36.7468, lng: -119.7726 },
  'Bakersfield, CA': { lat: 35.3733, lng: -119.0187 },
  'Roseville, CA': { lat: 38.7525, lng: -121.2880 },
  'Stockton, CA': { lat: 37.9577, lng: -121.2908 },
  'Redding, CA': { lat: 40.5865, lng: -122.3917 }
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

export function getLeadCoordinates(lead: Lead): GeoCoordinates {
  // Use city coordinate match or hash fallback for California locations
  for (const city of Object.keys(CITY_COORDINATES)) {
    if (lead.location.toLowerCase().includes(city.split(',')[0].toLowerCase())) {
      return CITY_COORDINATES[city];
    }
  }
  // Fallback lat/lng generated deterministically from location string
  const hash = lead.location.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const lat = 37.5 + ((hash % 100) / 50);
  const lng = -121.0 - ((hash % 80) / 40);
  return { lat, lng };
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
  const hubCoords = CITY_COORDINATES[hubCity] || CITY_COORDINATES['Sacramento, CA'];

  return leads.filter(lead => {
    const leadCoords = getLeadCoordinates(lead);
    const dist = calculateHaversineDistanceMiles(hubCoords.lat, hubCoords.lng, leadCoords.lat, leadCoords.lng);
    return dist <= radiusMiles;
  });
}

export function optimizeScoutDrivingRoute(targetLeads: Lead[], hubCity: string): OptimizedRouteItinerary {
  const hubCoords = CITY_COORDINATES[hubCity] || CITY_COORDINATES['Sacramento, CA'];
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
