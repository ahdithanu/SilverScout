import React, { useState, useMemo } from 'react';
import { Lead } from '../../types';
import { 
  getLeadCoordinates, 
  optimizeScoutDrivingRoute, 
  OptimizedRouteItinerary, 
  CITY_COORDINATES 
} from '../../utils/geoRouting';
import { 
  MapPin, 
  Navigation, 
  Compass, 
  Route, 
  Clock, 
  Building2, 
  ExternalLink, 
  ChevronRight,
  Flame,
  CheckCircle2,
  Calendar
} from 'lucide-react';

interface TerritoryMapProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
}

export const TerritoryMap: React.FC<TerritoryMapProps> = ({
  leads,
  onSelectLead
}) => {
  const [selectedHub, setSelectedHub] = useState<string>('Stockton, CA');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [itinerary, setItinerary] = useState<OptimizedRouteItinerary | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Calculate coordinates for all leads
  const mappedLeads = useMemo(() => {
    return leads.map(lead => ({
      lead,
      coords: getLeadCoordinates(lead)
    }));
  }, [leads]);

  // Compute map bounds to fit all coordinates
  const bounds = useMemo(() => {
    if (mappedLeads.length === 0) {
      return { minLat: 36.5, maxLat: 39.0, minLng: -122.5, maxLng: -119.5 };
    }
    const lats = mappedLeads.map(m => m.coords.lat);
    const lngs = mappedLeads.map(m => m.coords.lng);
    return {
      minLat: Math.min(...lats) - 0.2,
      maxLat: Math.max(...lats) + 0.2,
      minLng: Math.min(...lngs) - 0.2,
      maxLng: Math.max(...lngs) + 0.2
    };
  }, [mappedLeads]);

  // Projection helper: maps lat/lng to SVG percentage (0-100%)
  const project = (lat: number, lng: number) => {
    const x = ((lng - bounds.minLng) / Math.max(0.1, bounds.maxLng - bounds.minLng)) * 100;
    // Invert latitude for screen coordinates (north is up)
    const y = 100 - (((lat - bounds.minLat) / Math.max(0.1, bounds.maxLat - bounds.minLat)) * 100);
    return { x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) };
  };

  const handleGenerateItinerary = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      // Pick top 5 leads with highest exit propensity or closest distance
      const topTargets = [...leads]
        .sort((a, b) => (b.exitPropensityScore || 0) - (a.exitPropensityScore || 0))
        .slice(0, 5);

      const route = optimizeScoutDrivingRoute(topTargets, selectedHub);
      setItinerary(route);
      setIsOptimizing(false);
    }, 400);
  };

  return (
    <div className="flex h-full flex-col bg-zinc-950 text-white overflow-hidden">
      {/* Top Territory Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-zinc-800 bg-zinc-900/50 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
            <Compass className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-white">Territory Deal Scout Radar</h2>
            <p className="text-xs text-zinc-400">Geospatial cluster mapping & optimized traveling-salesman site visit itineraries</p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-zinc-400">Departure Hub:</span>
            <select
              value={selectedHub}
              onChange={(e) => setSelectedHub(e.target.value)}
              className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 font-semibold text-white focus:outline-none"
            >
              {Object.keys(CITY_COORDINATES).map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleGenerateItinerary}
            disabled={isOptimizing || leads.length === 0}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-1.5 font-bold text-white shadow-lg hover:bg-emerald-500 disabled:opacity-50 transition-colors"
          >
            <Route className="h-3.5 w-3.5" />
            {isOptimizing ? 'Computing Route...' : 'Optimize Scout Itinerary'}
          </button>
        </div>
      </div>

      {/* Main Split: Territory Map SVG & Itinerary Panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Territory Radar SVG Map */}
        <div className="relative flex-1 bg-zinc-950 p-6 overflow-hidden flex items-center justify-center">
          {/* Subtle Radar Concentric Rings */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
            <div className="h-96 w-96 rounded-full border border-emerald-500/40"></div>
            <div className="absolute h-[500px] w-[500px] rounded-full border border-emerald-500/20"></div>
            <div className="absolute h-[680px] w-[680px] rounded-full border border-zinc-800"></div>
          </div>

          {/* Map Surface SVG */}
          <svg className="h-full w-full max-h-[600px] max-w-[800px] rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-4 shadow-2xl backdrop-blur-sm">
            {/* Route Connector Lines if Itinerary exists */}
            {itinerary && itinerary.stops.length > 1 && (
              <g>
                {itinerary.stops.map((stop, idx) => {
                  if (idx === 0) return null;
                  const prev = itinerary.stops[idx - 1];
                  const p1 = project(prev.coordinates.lat, prev.coordinates.lng);
                  const p2 = project(stop.coordinates.lat, stop.coordinates.lng);

                  return (
                    <line
                      key={idx}
                      x1={`${p1.x}%`}
                      y1={`${p1.y}%`}
                      x2={`${p2.x}%`}
                      y2={`${p2.y}%`}
                      stroke="#10b981"
                      strokeWidth="2.5"
                      strokeDasharray="6 4"
                      className="opacity-80"
                    />
                  );
                })}
              </g>
            )}

            {/* Entity Pin Nodes */}
            {mappedLeads.map(({ lead, coords }) => {
              const pt = project(coords.lat, coords.lng);
              const isHigh = (lead.exitPropensityScore || 0) >= 8;
              const isMed = (lead.exitPropensityScore || 0) >= 5;
              const isSelected = selectedLead?.id === lead.id;

              const pinColor = isHigh ? '#10b981' : isMed ? '#f59e0b' : '#71717a';

              // Check if lead is in the current route itinerary
              const routeStop = itinerary?.stops.find(s => s.lead.id === lead.id);

              return (
                <g
                  key={lead.id}
                  transform={`translate(${pt.x * 7.5 + 20}, ${pt.y * 5.2 + 20})`}
                  onClick={() => setSelectedLead(lead)}
                  className="cursor-pointer transition-transform hover:scale-125"
                >
                  {/* Ping Ring for High Propensity */}
                  {isHigh && (
                    <circle
                      r="16"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="1.5"
                      className="animate-ping opacity-30"
                    />
                  )}

                  {/* Outer Pin Circle */}
                  <circle
                    r={isSelected ? "14" : "10"}
                    fill="#09090b"
                    stroke={pinColor}
                    strokeWidth={isSelected ? "3" : "2"}
                  />

                  {/* Inner Pin / Route Stop Number */}
                  {routeStop ? (
                    <text
                      textAnchor="middle"
                      dy="3.5"
                      fill="#10b981"
                      fontSize="10"
                      fontWeight="bold"
                    >
                      {routeStop.stopNumber}
                    </text>
                  ) : (
                    <circle
                      r="4"
                      fill={pinColor}
                    />
                  )}

                  {/* Label on Hover / Selected */}
                  {(isSelected || isHigh) && (
                    <text
                      y="-16"
                      textAnchor="middle"
                      fill="#e4e4e7"
                      fontSize="10"
                      fontWeight="bold"
                      className="pointer-events-none drop-shadow-md select-none"
                    >
                      {lead.name.length > 18 ? `${lead.name.substring(0, 16)}...` : lead.name}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Map Legend */}
          <div className="absolute bottom-10 left-10 flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/90 px-4 py-2 text-xs shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400"></span>
              <span className="text-zinc-300">High Propensity (8-10)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400"></span>
              <span className="text-zinc-300">Moderate (5-7)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-zinc-500"></span>
              <span className="text-zinc-400">Baseline (&lt;5)</span>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Optimized Route Itinerary & Lead Inspector */}
        <div className="w-96 border-l border-zinc-800 bg-zinc-900/70 p-6 flex flex-col justify-between overflow-y-auto backdrop-blur-sm">
          <div className="space-y-6">
            {/* Itinerary Summary Card */}
            {itinerary ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Navigation className="h-4 w-4 text-emerald-400" />
                    <h3 className="font-bold text-white text-sm">Optimized Site Visit Itinerary</h3>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                    {itinerary.stops.length} Stops
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-center text-xs">
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
                    <p className="text-zinc-400">Total Distance</p>
                    <p className="text-base font-bold text-white font-mono mt-0.5">{itinerary.totalDistanceMiles} Miles</p>
                  </div>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
                    <p className="text-zinc-400">Est. Drive Time</p>
                    <p className="text-base font-bold text-emerald-400 font-mono mt-0.5">{itinerary.estimatedDriveMinutes} Mins</p>
                  </div>
                </div>

                {/* Sequence Stops List */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Driving Sequence</span>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {itinerary.stops.map((stop) => (
                      <div
                        key={stop.stopNumber}
                        onClick={() => setSelectedLead(stop.lead)}
                        className={`flex items-start gap-3 rounded-xl border p-3 text-xs transition-all cursor-pointer ${
                          selectedLead?.id === stop.lead.id
                            ? 'border-emerald-500/50 bg-emerald-950/20'
                            : 'border-zinc-800 bg-zinc-950/60 hover:border-zinc-700'
                        }`}
                      >
                        <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-[11px] font-bold text-emerald-400 border border-emerald-500/40">
                          {stop.stopNumber}
                        </span>
                        <div className="flex-1 truncate">
                          <p className="font-bold text-white truncate">{stop.lead.name}</p>
                          <p className="text-[10px] text-zinc-400 truncate">{stop.lead.location} • {stop.lead.industry}</p>
                          <span className="text-[10px] text-emerald-400 font-mono mt-0.5 block">
                            +{stop.distanceFromPreviousMiles} mi from prev
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Google Maps External Route Link */}
                <a
                  href={itinerary.googleMapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-xs font-bold text-white hover:bg-zinc-700 transition-colors shadow-lg"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Launch Turn-by-Turn in Google Maps
                </a>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-8 rounded-2xl border border-dashed border-zinc-800 space-y-3">
                <Route className="h-8 w-8 text-zinc-600" />
                <div>
                  <h4 className="font-bold text-zinc-300 text-sm">No Itinerary Generated Yet</h4>
                  <p className="text-xs text-zinc-500 mt-1">
                    Click "Optimize Scout Itinerary" above to calculate the most efficient route between targets.
                  </p>
                </div>
              </div>
            )}

            {/* Selected Lead Mini-Inspector */}
            {selectedLead && (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Selected Target</span>
                  <button onClick={() => setSelectedLead(null)} className="text-zinc-500 hover:text-white text-xs">✕</button>
                </div>
                <h4 className="font-bold text-white text-sm">{selectedLead.name}</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-zinc-400">Location: <span className="text-white">{selectedLead.location}</span></div>
                  <div className="text-zinc-400">Propensity: <span className="font-bold text-amber-400">{selectedLead.exitPropensityScore}/10</span></div>
                </div>
                <button
                  onClick={() => onSelectLead(selectedLead)}
                  className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-zinc-800 hover:bg-emerald-600 py-2 text-xs font-bold text-zinc-200 hover:text-white transition-colors"
                >
                  Open Deal Room Details →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
