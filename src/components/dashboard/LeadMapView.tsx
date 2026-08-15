import React, { useState, useMemo } from 'react';
import { MapPin, Navigation, ExternalLink, Compass } from 'lucide-react';
import { Lead } from '../../types';
import { Badge, Button, formatStatusLabel } from '../../App';
import { filterLeadsByRadius, optimizeScoutDrivingRoute, OptimizedRouteItinerary, CITY_COORDINATES } from '../../utils/geoRouting';

interface LeadMapViewProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
}

export const LeadMapView: React.FC<LeadMapViewProps> = ({ leads, onSelectLead }) => {
  const [mapSelectedLead, setMapSelectedLead] = useState<Lead | null>(null);
  const [hubCity, setHubCity] = useState<string>('Sacramento, CA');
  const [radiusMiles, setRadiusMiles] = useState<number>(50);
  const [itinerary, setItinerary] = useState<OptimizedRouteItinerary | null>(null);

  const filteredLeads = useMemo(() => {
    return filterLeadsByRadius(leads, hubCity, radiusMiles);
  }, [leads, hubCity, radiusMiles]);

  const handleGenerateRoute = () => {
    const route = optimizeScoutDrivingRoute(filteredLeads, hubCity);
    setItinerary(route);
  };

  return (
    <div className="space-y-6">
      {/* Map Control Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-900 text-white p-4 rounded-xl border border-zinc-800">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
            <Compass className="h-4 w-4" />
          </span>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Deal Scout Radius & Route Optimizer</h4>
            <p className="text-[10px] text-zinc-400">Filter Target Deals by Geographic Radius & Generate Driving Itineraries</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <select
            value={hubCity}
            onChange={(e) => setHubCity(e.target.value)}
            className="rounded-lg border border-zinc-700 bg-zinc-800 py-1.5 px-3 text-xs font-bold text-white focus:border-emerald-500 focus:outline-none"
          >
            {Object.keys(CITY_COORDINATES).map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>

          <div className="flex items-center gap-2 bg-zinc-800 border border-zinc-700 px-3 py-1.5 rounded-lg text-xs">
            <span className="text-zinc-400 font-bold">Radius:</span>
            <input
              type="range"
              min="5"
              max="100"
              value={radiusMiles}
              onChange={(e) => setRadiusMiles(Number(e.target.value))}
              className="w-24 accent-emerald-500"
            />
            <span className="font-extrabold text-emerald-400 min-w-10">{radiusMiles} mi</span>
          </div>

          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1 text-xs"
            onClick={handleGenerateRoute}
            disabled={filteredLeads.length === 0}
          >
            <Navigation className="h-3.5 w-3.5" />
            Generate Scout Driving Itinerary ({filteredLeads.length})
          </Button>
        </div>
      </div>

      {/* Main Map Canvas */}
      <div className="relative w-full h-[550px] rounded-2xl border border-zinc-200 bg-zinc-950 overflow-hidden shadow-inner flex flex-col justify-between p-6">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2 bg-zinc-900/90 border border-zinc-800 backdrop-blur-md px-3 py-1.5 rounded-xl text-white">
            <MapPin className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider">{hubCity} • {radiusMiles} Mile Radius ({filteredLeads.length} Targets)</span>
          </div>
        </div>

        {/* Pin Layout */}
        <div className="relative w-full h-full my-4">
          {filteredLeads.map((lead, idx) => {
            const top = `${20 + ((idx * 17) % 65)}%`;
            const left = `${15 + ((idx * 23) % 70)}%`;
            const isHot = lead.exitPropensityScore >= 8;

            return (
              <div
                key={lead.id}
                style={{ top, left }}
                onClick={() => {
                  setMapSelectedLead(lead);
                  onSelectLead(lead);
                }}
                className="absolute cursor-pointer transition-transform hover:scale-125 z-10 group"
              >
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold shadow-lg border backdrop-blur-md ${
                  isHot ? "bg-emerald-950/90 text-emerald-300 border-emerald-500 animate-pulse" : "bg-zinc-900/90 text-zinc-300 border-zinc-700"
                }`}>
                  <MapPin className={`h-3 w-3 ${isHot ? "text-emerald-400" : "text-blue-400"}`} />
                  {lead.name.split(' ')[0]} ({lead.exitPropensityScore || '?'})
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Optimized Itinerary Card */}
      {itinerary && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-emerald-200 pb-3">
            <div>
              <h4 className="font-extrabold text-sm text-emerald-950">Deal Scout Multi-Stop Driving Itinerary</h4>
              <p className="text-xs text-emerald-700">Origin: {hubCity} • Total Distance: {itinerary.totalDistanceMiles} miles • Est Drive: {itinerary.estimatedDriveMinutes} mins</p>
            </div>
            <a
              href={itinerary.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-colors shadow-sm"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open in Google Maps Navigation
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {itinerary.stops.map(stop => (
              <div key={stop.stopNumber} className="bg-white border border-emerald-200 rounded-lg p-3 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white text-[10px] font-black">
                    #{stop.stopNumber}
                  </span>
                  <span className="text-[10px] font-bold text-zinc-400">+{stop.distanceFromPreviousMiles} mi</span>
                </div>
                <h5 className="font-bold text-zinc-900">{stop.lead.name}</h5>
                <p className="text-[10px] text-zinc-500">{stop.lead.industry} • {stop.lead.location}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
