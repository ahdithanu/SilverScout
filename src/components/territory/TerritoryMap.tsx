import React, { useState, useMemo, useEffect } from 'react';
import { Lead } from '../../types';
import { 
  getLeadCoordinates, 
  optimizeScoutDrivingRoute, 
  OptimizedRouteItinerary, 
  CITY_COORDINATES,
  resolveLocationCoordinates,
  detectDominantCityHub,
  extractAvailableHubs,
  calculateHaversineDistanceMiles
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
  Calendar,
  Search,
  SlidersHorizontal,
  Target,
  LocateFixed,
  RotateCcw,
  Sparkles,
  Map as MapIcon
} from 'lucide-react';

interface TerritoryMapProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
  onScanCity?: (cityName: string) => Promise<void>;
  isScanningCity?: boolean;
  searchQuery?: string;
}

export const TerritoryMap: React.FC<TerritoryMapProps> = ({
  leads,
  onSelectLead,
  onScanCity,
  isScanningCity = false,
  searchQuery = ''
}) => {
  // Dynamically default hub to the city with highest lead density, or Dallas, TX
  const [selectedHub, setSelectedHub] = useState<string>(() => detectDominantCityHub(leads));
  const [locationInput, setLocationInput] = useState<string>(selectedHub);
  const [radiusMiles, setRadiusMiles] = useState<number>(100); // 25, 50, 100, 250, or Infinity
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [itinerary, setItinerary] = useState<OptimizedRouteItinerary | null>(null);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);

  // Extract all distinct active market cities from currently loaded leads
  const activeLeadMarkets = useMemo(() => {
    return extractAvailableHubs(leads);
  }, [leads]);

  // Keep location input text in sync when selectedHub changes
  useEffect(() => {
    setLocationInput(selectedHub);
  }, [selectedHub]);

  // Re-evaluate dominant hub if leads change and current hub has zero leads within radius
  useEffect(() => {
    if (leads.length > 0) {
      const activeHubs = extractAvailableHubs(leads);
      const hubCoords = resolveLocationCoordinates(selectedHub);
      const hasNearbyLead = leads.some(l => {
        const c = getLeadCoordinates(l);
        return calculateHaversineDistanceMiles(hubCoords.lat, hubCoords.lng, c.lat, c.lng) <= 150;
      });

      if (!hasNearbyLead && activeHubs.length > 0) {
        setSelectedHub(activeHubs[0].name);
        setLocationInput(activeHubs[0].name);
      }
    }
  }, [leads]);

  // Sync with global header search query if user typed a location
  useEffect(() => {
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.trim();
      const matchingMarket = activeLeadMarkets.find(m => m.name.toLowerCase().includes(q.toLowerCase()));
      if (matchingMarket) {
        setSelectedHub(matchingMarket.name);
        setLocationInput(matchingMarket.name);
      } else {
        setSelectedHub(q);
        setLocationInput(q);
      }
      setItinerary(null);
    }
  }, [searchQuery, activeLeadMarkets]);

  // Coordinates of the selected hub
  const hubCoords = useMemo(() => {
    return resolveLocationCoordinates(selectedHub);
  }, [selectedHub]);

  // Filter leads based on distance radius from the active hub
  const leadsWithDistance = useMemo(() => {
    return leads.map(lead => {
      const coords = getLeadCoordinates(lead);
      const dist = calculateHaversineDistanceMiles(hubCoords.lat, hubCoords.lng, coords.lat, coords.lng);
      return {
        lead,
        coords,
        distanceMiles: dist
      };
    });
  }, [leads, hubCoords]);

  const filteredLeads = useMemo(() => {
    if (radiusMiles === Infinity) {
      return leadsWithDistance;
    }
    return leadsWithDistance.filter(item => item.distanceMiles <= radiusMiles);
  }, [leadsWithDistance, radiusMiles]);

  // Compute map bounds to fit both the departure hub AND all filtered leads
  const bounds = useMemo(() => {
    const allLats = [hubCoords.lat, ...filteredLeads.map(m => m.coords.lat)];
    const allLngs = [hubCoords.lng, ...filteredLeads.map(m => m.coords.lng)];

    if (allLats.length === 1) {
      // Only hub exists
      return {
        minLat: hubCoords.lat - 0.5,
        maxLat: hubCoords.lat + 0.5,
        minLng: hubCoords.lng - 0.5,
        maxLng: hubCoords.lng + 0.5
      };
    }

    const minLat = Math.min(...allLats);
    const maxLat = Math.max(...allLats);
    const minLng = Math.min(...allLngs);
    const maxLng = Math.max(...allLngs);

    const latSpan = Math.max(0.2, maxLat - minLat);
    const lngSpan = Math.max(0.2, maxLng - minLng);

    return {
      minLat: minLat - latSpan * 0.15,
      maxLat: maxLat + latSpan * 0.15,
      minLng: minLng - lngSpan * 0.15,
      maxLng: maxLng + lngSpan * 0.15
    };
  }, [hubCoords, filteredLeads]);

  // Unified SVG Coordinate Projection: maps lat/lng into SVG viewport (800 x 500)
  const project = (lat: number, lng: number) => {
    const width = 800;
    const height = 500;
    const paddingX = 50;
    const paddingY = 40;

    const availableW = width - paddingX * 2;
    const availableH = height - paddingY * 2;

    const lngSpan = Math.max(0.01, bounds.maxLng - bounds.minLng);
    const latSpan = Math.max(0.01, bounds.maxLat - bounds.minLat);

    const xRatio = (lng - bounds.minLng) / lngSpan;
    const yRatio = (lat - bounds.minLat) / latSpan;

    const x = paddingX + xRatio * availableW;
    // Invert latitude: north is up (SVG 0 is top)
    const y = paddingY + (1 - yRatio) * availableH;

    return {
      x: Math.max(paddingX, Math.min(width - paddingX, x)),
      y: Math.max(paddingY, Math.min(height - paddingY, y))
    };
  };

  const hubSvgPt = useMemo(() => {
    return project(hubCoords.lat, hubCoords.lng);
  }, [hubCoords, bounds]);

  const handleApplyLocation = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = locationInput.trim();
    if (!clean) return;
    setSelectedHub(clean);
    setItinerary(null);
  };

  const handleScoutCurrentLocation = async (targetCity?: string) => {
    const city = targetCity || selectedHub || locationInput;
    if (!city.trim() || !onScanCity) return;
    try {
      await onScanCity(city.trim());
      setSelectedHub(city.trim());
      setLocationInput(city.trim());
      setItinerary(null);
    } catch (err) {
      console.error("Failed to scout location:", err);
    }
  };

  const handleGenerateItinerary = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      // Pick top targets within radius sorted by exit propensity
      const candidateLeads = (filteredLeads.length > 0 ? filteredLeads : leadsWithDistance)
        .map(item => item.lead)
        .sort((a, b) => (b.exitPropensityScore || 0) - (a.exitPropensityScore || 0))
        .slice(0, 6);

      const route = optimizeScoutDrivingRoute(candidateLeads, selectedHub);
      setItinerary(route);
      setIsOptimizing(false);
    }, 400);
  };

  return (
    <div className="flex h-full flex-col bg-zinc-950 text-white rounded-2xl border border-zinc-800/80 shadow-2xl overflow-hidden">
      {/* Top Territory Command Header */}
      <div className="flex flex-col gap-4 border-b border-zinc-800 bg-zinc-900/60 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight text-white">Territory Deal Scout Radar</h2>
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                  Dynamic Multi-Market
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Geospatial cluster mapping & optimized traveling-salesman site visit itineraries
              </p>
            </div>
          </div>

          {/* Location & Departure Hub Controls */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            {/* Direct City Search & Set Input */}
            <form onSubmit={handleApplyLocation} className="flex items-center gap-1.5">
              <div className="relative">
                <MapPin className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  placeholder="Enter any US city (e.g. Tampa, FL, Dallas, TX)..."
                  className="w-56 rounded-lg border border-zinc-700 bg-zinc-900 py-1.5 pl-8 pr-3 text-xs font-semibold text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-sm"
                />
              </div>
              <button
                type="submit"
                className="rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-1.5 font-bold text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors"
                title="Map this location and center radar"
              >
                Set Hub
              </button>
            </form>

            {/* Quick Hub Dropdown Selector */}
            <select
              value={selectedHub}
              onChange={(e) => {
                setSelectedHub(e.target.value);
                setLocationInput(e.target.value);
                setItinerary(null);
              }}
              className="rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 font-medium text-xs text-zinc-300 focus:outline-none focus:border-emerald-500"
            >
              {activeLeadMarkets.length > 0 && (
                <optgroup label="📍 Active Markets With Leads">
                  {activeLeadMarkets.map(m => (
                    <option key={m.name} value={m.name}>
                      {m.name} ({m.count} {m.count === 1 ? 'target' : 'targets'})
                    </option>
                  ))}
                </optgroup>
              )}

              <optgroup label="🇺🇸 Nationwide Metropolitan Hubs">
                {Object.keys(CITY_COORDINATES).map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </optgroup>
            </select>

            {/* 1-Click City Scanner Button */}
            {onScanCity && (
              <button
                onClick={() => handleScoutCurrentLocation()}
                disabled={isScanningCity}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 font-bold text-white shadow-md hover:bg-emerald-500 disabled:opacity-50 transition-colors"
                title={`Scan and ingest high-propensity off-market businesses in ${selectedHub}`}
              >
                {isScanningCity ? <Clock className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                {isScanningCity ? 'Scouting Deals...' : `⚡ Scout Deals in ${selectedHub.split(',')[0]}`}
              </button>
            )}

            <button
              onClick={handleGenerateItinerary}
              disabled={isOptimizing || leads.length === 0}
              className="flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-1.5 font-bold text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50 transition-colors"
            >
              <Route className="h-3.5 w-3.5" />
              {isOptimizing ? 'Computing Route...' : 'Optimize Scout Itinerary'}
            </button>
          </div>
        </div>

        {/* Dynamic Quick Market Chips & Radius Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-800/60 text-xs">
          {/* Active Lead Markets Quick Jump */}
          <div className="flex items-center gap-2 overflow-x-auto py-0.5">
            <span className="text-zinc-500 text-[11px] font-medium whitespace-nowrap">Active Markets:</span>
            {activeLeadMarkets.length > 0 ? (
              activeLeadMarkets.slice(0, 6).map(m => {
                const isActive = selectedHub.toLowerCase().includes(m.name.split(',')[0].toLowerCase());
                return (
                  <button
                    key={m.name}
                    onClick={() => {
                      setSelectedHub(m.name);
                      setLocationInput(m.name);
                      setItinerary(null);
                    }}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all whitespace-nowrap flex items-center gap-1 ${
                      isActive 
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                        : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-700 hover:text-white'
                    }`}
                  >
                    <span>{m.name.split(',')[0]}</span>
                    <span className="rounded-full bg-zinc-800 px-1.5 py-0.2 text-[9px] text-zinc-400">{m.count}</span>
                  </button>
                );
              })
            ) : (
              <span className="text-zinc-500 text-[11px] italic">No active city clusters yet</span>
            )}
          </div>

          {/* Radius Filter Pills */}
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500 text-[11px] font-medium flex items-center gap-1">
              <SlidersHorizontal className="h-3 w-3" />
              Radius:
            </span>
            {[
              { label: '25 mi', value: 25 },
              { label: '50 mi', value: 50 },
              { label: '100 mi', value: 100 },
              { label: '250 mi', value: 250 },
              { label: 'Nationwide', value: Infinity }
            ].map(r => (
              <button
                key={r.label}
                onClick={() => setRadiusMiles(r.value)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-colors ${
                  radiusMiles === r.value
                    ? 'bg-zinc-200 text-zinc-950 shadow-sm'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Split: Territory Map SVG & Itinerary Panel */}
      <div className="flex flex-1 flex-col lg:flex-row overflow-hidden min-h-[540px]">
        {/* Territory Radar SVG Map */}
        <div className="relative flex-1 bg-zinc-950 p-4 lg:p-6 overflow-hidden flex flex-col items-center justify-center">
          {/* Radar Status Overlay Banner */}
          <div className="absolute top-6 left-6 z-10 flex items-center gap-2.5 rounded-xl border border-zinc-800 bg-zinc-900/90 px-3.5 py-2 text-xs shadow-xl backdrop-blur-md">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-zinc-300">
              Showing <strong className="text-white">{filteredLeads.length}</strong> of{' '}
              <strong className="text-white">{leads.length}</strong> targets
              {radiusMiles !== Infinity && (
                <> within <strong className="text-emerald-400">{radiusMiles} miles</strong> of {selectedHub.split(',')[0]}</>
              )}
            </span>
          </div>

          {/* Recenter / Reset Controls */}
          <div className="absolute top-6 right-6 z-10 flex items-center gap-2">
            <button
              onClick={() => {
                if (activeLeadMarkets.length > 0) {
                  setSelectedHub(activeLeadMarkets[0].name);
                }
                setRadiusMiles(Infinity);
              }}
              title="Show all targets nationwide"
              className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900/90 px-2.5 py-1.5 text-xs text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors shadow-lg backdrop-blur-md"
            >
              <RotateCcw className="h-3 w-3" />
              Fit All Targets
            </button>
          </div>

          {/* Interactive Scalable SVG Radar Surface */}
          <svg 
            viewBox="0 0 800 500" 
            className="w-full h-full max-h-[520px] rounded-2xl border border-zinc-800/80 bg-zinc-900/20 shadow-2xl backdrop-blur-sm select-none"
          >
            <defs>
              {/* Radial Radar Glow Gradient */}
              <radialGradient id="radarPulse" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
                <stop offset="50%" stopColor="#10b981" stopOpacity="0.05" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
              </radialGradient>

              {/* Grid Background Pattern */}
              <pattern id="radarGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#27272a" strokeWidth="0.5" strokeOpacity="0.4" />
              </pattern>
            </defs>

            {/* Background Grid */}
            <rect width="800" height="500" fill="url(#radarGrid)" />

            {/* Radar Concentric Rings Centered on Departure Hub */}
            <g transform={`translate(${hubSvgPt.x}, ${hubSvgPt.y})`}>
              <circle r="220" fill="url(#radarPulse)" />
              <circle r="70" fill="none" stroke="#10b981" strokeWidth="1" strokeDasharray="3 3" strokeOpacity="0.25" />
              <circle r="140" fill="none" stroke="#10b981" strokeWidth="1" strokeDasharray="4 4" strokeOpacity="0.2" />
              <circle r="220" fill="none" stroke="#3f3f46" strokeWidth="1" strokeDasharray="5 5" strokeOpacity="0.3" />
              <line x1="-250" y1="0" x2="250" y2="0" stroke="#27272a" strokeWidth="1" strokeDasharray="2 4" />
              <line x1="0" y1="-250" x2="0" y2="250" stroke="#27272a" strokeWidth="1" strokeDasharray="2 4" />
            </g>

            {/* Route Connector Lines if Itinerary Exists */}
            {itinerary && itinerary.stops.length > 0 && (
              <g>
                {itinerary.stops.map((stop, idx) => {
                  const startPt = idx === 0 ? hubSvgPt : project(itinerary.stops[idx - 1].coordinates.lat, itinerary.stops[idx - 1].coordinates.lng);
                  const endPt = project(stop.coordinates.lat, stop.coordinates.lng);

                  return (
                    <g key={`route-leg-${idx}`}>
                      <line
                        x1={startPt.x}
                        y1={startPt.y}
                        x2={endPt.x}
                        y2={endPt.y}
                        stroke="#10b981"
                        strokeWidth="2.5"
                        strokeDasharray="6 4"
                        strokeOpacity="0.85"
                      />
                      {/* Midpoint distance label */}
                      <circle
                        cx={(startPt.x + endPt.x) / 2}
                        cy={(startPt.y + endPt.y) / 2}
                        r="9"
                        fill="#09090b"
                        stroke="#10b981"
                        strokeWidth="1"
                      />
                      <text
                        x={(startPt.x + endPt.x) / 2}
                        y={(startPt.y + endPt.y) / 2}
                        textAnchor="middle"
                        dy="3"
                        fill="#34d399"
                        fontSize="8"
                        fontWeight="bold"
                      >
                        {Math.round(stop.distanceFromPreviousMiles)}m
                      </text>
                    </g>
                  );
                })}
              </g>
            )}

            {/* Departure Hub Beacon Node */}
            <g transform={`translate(${hubSvgPt.x}, ${hubSvgPt.y})`} className="cursor-default">
              <circle r="18" fill="#3b82f6" fillOpacity="0.15" className="animate-ping" />
              <circle r="12" fill="#09090b" stroke="#3b82f6" strokeWidth="2.5" />
              <circle r="4" fill="#60a5fa" />
              <text
                y="-18"
                textAnchor="middle"
                fill="#93c5fd"
                fontSize="10"
                fontWeight="bold"
                className="drop-shadow-md select-none"
              >
                HUB: {selectedHub.split(',')[0]}
              </text>
            </g>

            {/* Target Lead Pin Nodes */}
            {filteredLeads.map(({ lead, coords }) => {
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
                  transform={`translate(${pt.x}, ${pt.y})`}
                  onClick={() => setSelectedLead(lead)}
                  className="cursor-pointer transition-all hover:scale-125 group"
                >
                  {/* Ping Ring for High Propensity Targets */}
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

                  {/* Label */}
                  <text
                    y="-16"
                    textAnchor="middle"
                    fill={isSelected ? "#10b981" : "#e4e4e7"}
                    fontSize="10"
                    fontWeight="bold"
                    className="drop-shadow-md select-none opacity-80 group-hover:opacity-100"
                  >
                    {lead.name.length > 18 ? `${lead.name.substring(0, 16)}...` : lead.name}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Zero Leads Within Radius Fallback Banner */}
          {filteredLeads.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center p-6 bg-zinc-950/75 backdrop-blur-sm">
              <div className="max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-center space-y-4 shadow-2xl">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                  <Target className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-base">No Targets Within {radiusMiles} Miles</h4>
                  <p className="text-xs text-zinc-400 mt-1">
                    No leads are currently located within {radiusMiles} miles of <strong>{selectedHub}</strong>. 
                    {leads.length > 0 && ` We found ${leads.length} total targets across other regions (${activeLeadMarkets.map(m => m.name.split(',')[0]).slice(0, 3).join(', ')}).`}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                  {onScanCity && (
                    <button
                      onClick={() => handleScoutCurrentLocation(selectedHub)}
                      disabled={isScanningCity}
                      className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 shadow-md transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isScanningCity ? <Clock className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                      {isScanningCity ? `Scouting ${selectedHub}...` : `⚡ Scout Deals in ${selectedHub.split(',')[0]}`}
                    </button>
                  )}
                  {leads.length > 0 && (
                    <button
                      onClick={() => setRadiusMiles(Infinity)}
                      className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-bold text-zinc-200 hover:text-white transition-colors"
                    >
                      Show Nationwide Targets ({leads.length})
                    </button>
                  )}
                  {activeLeadMarkets.length > 0 && (
                    <button
                      onClick={() => {
                        setSelectedHub(activeLeadMarkets[0].name);
                        setLocationInput(activeLeadMarkets[0].name);
                        setRadiusMiles(100);
                      }}
                      className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-bold text-zinc-200 hover:text-white transition-colors"
                    >
                      Jump to {activeLeadMarkets[0].name.split(',')[0]} ({activeLeadMarkets[0].count})
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Map Legend */}
          <div className="absolute bottom-6 left-6 flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/90 px-4 py-2 text-xs shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-400"></span>
              <span className="text-zinc-300">Departure Hub</span>
            </div>
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
        <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-zinc-800 bg-zinc-900/70 p-6 flex flex-col justify-between overflow-y-auto backdrop-blur-sm">
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
                            +{stop.distanceFromPreviousMiles} mi from prev stop
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
              <div className="space-y-4">
                <div className="flex flex-col items-center justify-center text-center p-6 rounded-2xl border border-dashed border-zinc-800 space-y-3">
                  <Route className="h-8 w-8 text-zinc-600" />
                  <div>
                    <h4 className="font-bold text-zinc-300 text-sm">No Itinerary Generated Yet</h4>
                    <p className="text-xs text-zinc-500 mt-1">
                      Click "Optimize Scout Itinerary" above to calculate the most efficient route between targets.
                    </p>
                  </div>
                  <button
                    onClick={handleGenerateItinerary}
                    disabled={isOptimizing || filteredLeads.length === 0}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 font-bold text-white shadow-lg hover:bg-emerald-500 disabled:opacity-50 transition-colors text-xs"
                  >
                    <Route className="h-3.5 w-3.5" />
                    Calculate Optimal Itinerary
                  </button>
                </div>

                {/* Nearby Targets Preview */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                      Nearby Targets ({filteredLeads.length})
                    </span>
                  </div>
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {filteredLeads.slice(0, 5).map(({ lead, distanceMiles }) => (
                      <div
                        key={lead.id}
                        onClick={() => setSelectedLead(lead)}
                        className={`flex items-center justify-between rounded-xl border p-2.5 text-xs cursor-pointer transition-colors ${
                          selectedLead?.id === lead.id
                            ? 'border-emerald-500/50 bg-emerald-950/20'
                            : 'border-zinc-800/80 bg-zinc-950/40 hover:border-zinc-700'
                        }`}
                      >
                        <div className="truncate mr-2">
                          <p className="font-bold text-white truncate">{lead.name}</p>
                          <p className="text-[10px] text-zinc-400 truncate">{lead.location}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="text-[10px] font-bold text-emerald-400">{distanceMiles} mi</span>
                          <p className="text-[9px] text-zinc-500">Score {lead.exitPropensityScore}/10</p>
                        </div>
                      </div>
                    ))}
                  </div>
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
                  <div className="text-zinc-400">Location: <span className="text-white block truncate">{selectedLead.location}</span></div>
                  <div className="text-zinc-400">Propensity: <span className="font-bold text-amber-400 block">{selectedLead.exitPropensityScore}/10</span></div>
                  <div className="text-zinc-400">Industry: <span className="text-white block truncate">{selectedLead.industry}</span></div>
                  <div className="text-zinc-400">Status: <span className="text-emerald-400 block capitalize">{selectedLead.status}</span></div>
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

