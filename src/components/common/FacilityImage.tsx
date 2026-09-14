import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  ExternalLink, 
  Satellite, 
  Eye, 
  Compass, 
  ShieldCheck, 
  Globe, 
  Truck, 
  Layers, 
  CheckCircle2,
  AlertTriangle 
} from 'lucide-react';
import { Lead } from '../../types';
import { resolveFacilityImagery, FacilityImagery } from '../../utils/facilityImageResolver';

interface FacilityImageProps {
  lead: Lead;
  className?: string;
}

export const FacilityImage: React.FC<FacilityImageProps> = ({ lead, className = '' }) => {
  const [activeTab, setActiveTab] = useState<'street' | 'satellite' | 'blueprint'>('street');
  const [streetImgError, setStreetImgError] = useState(false);
  const [satImgError, setSatImgError] = useState(false);
  const [faviconError, setFaviconError] = useState(false);

  const imagery: FacilityImagery = resolveFacilityImagery(lead);
  const badge = imagery.facilityBadge;

  return (
    <div className={`overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xs ${className}`}>
      {/* Top Bar: Brand Logo & Verified Coordinates Header */}
      <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/70 px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          {imagery.brandFaviconUrl && !faviconError ? (
            <img
              src={imagery.brandFaviconUrl}
              alt={`${lead.name} Verified Logo`}
              className="h-6 w-6 rounded-md object-contain bg-white p-0.5 border border-zinc-200 shadow-2xs"
              onError={() => setFaviconError(true)}
            />
          ) : (
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-zinc-200 text-zinc-600 text-xs font-bold">
              <Building2 className="h-3.5 w-3.5" />
            </div>
          )}

          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-zinc-900 leading-none">{lead.name}</span>
              {imagery.domain && (
                <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 flex items-center gap-0.5">
                  <Globe className="h-2.5 w-2.5" />
                  {imagery.domain}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-[10px] text-zinc-500 mt-0.5">
              <MapPin className="h-2.5 w-2.5 text-red-500" />
              <span>{lead.address || lead.businessProfile?.streetAddress || lead.location}</span>
              <span className="font-mono text-[9px] text-zinc-400">
                ({imagery.coordinates.lat.toFixed(4)}, {imagery.coordinates.lng.toFixed(4)})
              </span>
            </div>
          </div>
        </div>

        {/* View Mode Navigation Tabs */}
        <div className="flex items-center bg-zinc-200/80 p-0.5 rounded-lg text-[11px] font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('street')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
              activeTab === 'street'
                ? 'bg-white text-zinc-900 shadow-2xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <Eye className="h-3 w-3 text-blue-600" />
            <span>Storefront</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('satellite')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
              activeTab === 'satellite'
                ? 'bg-white text-zinc-900 shadow-2xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <Satellite className="h-3 w-3 text-emerald-600" />
            <span>Aerial Yard</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('blueprint')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
              activeTab === 'blueprint'
                ? 'bg-white text-zinc-900 shadow-2xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <Layers className="h-3 w-3 text-purple-600" />
            <span>Facility Specs</span>
          </button>
        </div>
      </div>

      {/* Main Visual Display Area */}
      <div className="relative min-h-[200px] max-h-[260px] bg-zinc-900 flex items-center justify-center overflow-hidden">
        {/* TAB 1: Street View Storefront */}
        {activeTab === 'street' && (
          imagery.streetViewUrl && !streetImgError ? (
            <img
              src={imagery.streetViewUrl}
              alt={`Physical facility view of ${lead.name}`}
              className="w-full h-full object-cover"
              onError={() => setStreetImgError(true)}
            />
          ) : (
            <div className="w-full h-full p-6 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex flex-col justify-between text-white">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Verified Commercial Location
                  </span>
                  <span className="text-[10px] font-mono bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded border border-zinc-700">
                    {badge.naicsCode}
                  </span>
                </div>
                <h4 className="text-base font-extrabold text-white mt-1.5">{badge.tradeName}</h4>
                <p className="text-xs text-zinc-300 mt-0.5">{badge.facilityType}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 my-2">
                {badge.keyFeatures.slice(0, 2).map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 text-[11px] text-zinc-200 bg-zinc-800/80 px-2.5 py-1.5 rounded-lg border border-zinc-700">
                    <CheckCircle2 className="h-3 w-3 text-emerald-400 flex-shrink-0" />
                    <span className="truncate">{feat}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-zinc-700/60">
                <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-red-400" />
                  Exact Street Address Grounded
                </span>
                <a
                  href={imagery.streetViewPanoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-400 hover:text-blue-300 bg-blue-950/60 px-2.5 py-1 rounded-md border border-blue-800/60 transition-colors"
                >
                  <Compass className="h-3.5 w-3.5" />
                  Open 360° Street View
                  <ExternalLink className="h-2.5 w-2.5 ml-0.5" />
                </a>
              </div>
            </div>
          )
        )}

        {/* TAB 2: Aerial Satellite View */}
        {activeTab === 'satellite' && (
          imagery.satelliteMapUrl && !satImgError ? (
            <img
              src={imagery.satelliteMapUrl}
              alt={`Satellite aerial yard view of ${lead.name}`}
              className="w-full h-full object-cover"
              onError={() => setSatImgError(true)}
            />
          ) : (
            <div className="w-full h-full p-6 bg-gradient-to-br from-zinc-950 via-slate-900 to-zinc-900 flex flex-col justify-between text-white">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-400 flex items-center gap-1">
                    <Satellite className="h-3.5 w-3.5" />
                    High-Resolution Aerial Footprint
                  </span>
                  <span className="text-[10px] font-bold bg-blue-900/60 text-blue-200 px-2 py-0.5 rounded border border-blue-700/50">
                    Lot & Fleet Assessment
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white mt-1.5">Commercial Property Footprint & Acreage</h4>
                <p className="text-xs text-zinc-300 mt-0.5">
                  Inspect commercial warehouse roofline, service van parking capacity, and material yard perimeter.
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                <span className="text-[10px] text-zinc-400 font-mono">
                  Target Coords: {imagery.coordinates.lat.toFixed(4)}° N, {Math.abs(imagery.coordinates.lng).toFixed(4)}° W
                </span>
                <a
                  href={imagery.googleMapsPlaceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-800/60 transition-colors"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  Inspect Satellite on Google Maps
                  <ExternalLink className="h-2.5 w-2.5 ml-0.5" />
                </a>
              </div>
            </div>
          )
        )}

        {/* TAB 3: Blueprint / Trade Facility Specification */}
        {activeTab === 'blueprint' && (
          <div className="w-full h-full p-5 bg-zinc-950 text-white flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-purple-400 animate-pulse"></span>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-purple-400">
                    Trade Facility Blueprint
                  </span>
                </div>
                <span className="text-[10px] font-mono text-zinc-400">{badge.naicsCode}</span>
              </div>
              <h4 className="text-sm font-bold text-zinc-100">{badge.tradeName}</h4>
              <p className="text-[11px] text-zinc-400">{badge.facilityType}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 my-1">
              {badge.keyFeatures.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-[10px] text-zinc-300 bg-zinc-900/90 p-1.5 rounded border border-zinc-800">
                  <CheckCircle2 className="h-3 w-3 text-purple-400 flex-shrink-0" />
                  <span className="truncate">{feat}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1 border-t border-zinc-800">
              <span className="flex items-center gap-1">
                <Truck className="h-3 w-3 text-zinc-500" />
                Fleet Staging & Logistics Profile
              </span>
              <span className="text-emerald-400 font-semibold">Zero Generic Stock Assets</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer Banner: Anti-Stock Integrity Guarantee */}
      <div className="flex items-center justify-between bg-zinc-50 px-3.5 py-1.5 border-t border-zinc-100 text-[10px] text-zinc-500">
        <span className="flex items-center gap-1 font-medium text-zinc-700">
          <ShieldCheck className="h-3 w-3 text-emerald-600 flex-shrink-0" />
          Authentic Physical Sourcing: Grounded in geographic coordinates & registered domain
        </span>
        <a
          href={imagery.googleMapsPlaceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold text-blue-600 hover:text-blue-800 flex items-center gap-0.5"
        >
          Google Maps
          <ExternalLink className="h-2.5 w-2.5" />
        </a>
      </div>
    </div>
  );
};
