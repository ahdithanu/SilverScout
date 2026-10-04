import React, { useState } from 'react';
import { Lead } from '../../types';
import { 
  SAMPLE_MARKETPLACE_LISTINGS, 
  computeListingSignals, 
  deAnonymizeBlindListing 
} from '../../services/listingIngestionService';
import { ContinuousIngestionScheduler, IngestionDelta } from '../../utils/continuousIngestionScheduler';
import { 
  Store, 
  TrendingDown, 
  Clock, 
  CheckCircle2, 
  ExternalLink, 
  Building2, 
  SearchCheck, 
  Layers, 
  ArrowRight,
  ShieldCheck,
  DollarSign,
  RefreshCw,
  Sparkles,
  Zap,
  Activity
} from 'lucide-react';

interface ListingAggregatorCardProps {
  existingLeads: Lead[];
  onIngestListings: (newLeads: Lead[]) => void;
}

export const ListingAggregatorCard: React.FC<ListingAggregatorCardProps> = ({
  existingLeads,
  onIngestListings
}) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'trades' | 'property_management' | 'multifamily'>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>(
    SAMPLE_MARKETPLACE_LISTINGS.map((_, i) => `sample-${i}`)
  );
  const [isIngesting, setIsIngesting] = useState(false);
  const [successCount, setSuccessCount] = useState<number | null>(null);
  const [scheduler] = useState<ContinuousIngestionScheduler>(() => new ContinuousIngestionScheduler());
  const [lastSweepResult, setLastSweepResult] = useState<any | null>(null);
  const [isSweepingFeeds, setIsSweepingFeeds] = useState(false);

  const handleTriggerMultiDailySweep = () => {
    setIsSweepingFeeds(true);
    setTimeout(() => {
      const result = scheduler.executeSweep(existingLeads, SAMPLE_MARKETPLACE_LISTINGS);
      setLastSweepResult(result);
      if (result.newListingsCreated.length > 0) {
        onIngestListings(result.newListingsCreated);
      }
      setIsSweepingFeeds(false);
    }, 500);
  };

  const filteredListings = SAMPLE_MARKETPLACE_LISTINGS.filter(item => {
    if (activeCategory === 'all') return true;
    if (activeCategory === 'property_management') return item.industry === 'Property Management';
    if (activeCategory === 'multifamily') return item.industry === 'Multifamily Real Estate';
    return item.industry !== 'Property Management' && item.industry !== 'Multifamily Real Estate';
  });

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleIngest = () => {
    setIsIngesting(true);

    const leadsToIngest: Lead[] = SAMPLE_MARKETPLACE_LISTINGS
      .filter((_, idx) => selectedIds.includes(`sample-${idx}`))
      .map((item, idx) => {
        const id = `listing-${Date.now()}-${idx}`;
        const listing = item.listingDetails!;
        const signals = computeListingSignals(
          listing.askingPrice || 3500000,
          listing.cashFlowOrSde || 800000,
          listing.daysOnMarket || 60,
          listing.priceDropPct || 0,
          item.industry === 'Multifamily Real Estate' ? 8.5 : item.industry === 'Property Management' ? 5.0 : 4.5
        );

        // Run De-Anonymization against existing off-market registry leads
        const deAnon = deAnonymizeBlindListing({
          industry: item.industry || 'HVAC',
          location: item.location || 'Central Valley, CA',
          revenue: item.revenue,
          cashFlow: listing.cashFlowOrSde
        }, existingLeads);

        const isRealEstate = item.industry === 'Multifamily Real Estate';
        const isPM = item.industry === 'Property Management';

        const customTags = ['On-Market Listing', listing.sourcePlatform, `DOM ${listing.daysOnMarket}d`];
        if (isRealEstate && listing.unitsCount) customTags.push(`${listing.unitsCount} Units`, `${listing.capRatePct}% Cap Rate`);
        if (isPM && listing.doorsUnderManagement) customTags.push(`${listing.doorsUnderManagement} Doors Managed`);

        return {
          id,
          fundId: 'redwood-cap',
          name: item.name || 'Confidential Asset',
          industry: item.industry || 'Industrial Services',
          location: item.location || 'Central Valley, CA',
          registrationDate: '2010-03-15T00:00:00.000Z',
          agentName: listing.brokerName || 'Licensed Intermediary',
          isCorporateAgent: true,
          permitVolume2023_2025: 42,
          permitVolume2026: 25,
          permitDrop: 40,
          lastDigitalPostDate: 'Active on M&A Marketplace',
          reviewVelocity: 0.5,
          exitPropensityScore: signals.compositePropensityScore,
          aiThesis: `On-Market Listing sourced from ${listing.sourcePlatform}. Asking $${((listing.askingPrice || 0)/1000000).toFixed(2)}M (${signals.askingMultiple}x ${isRealEstate ? 'NOI' : 'SDE'}). Days on Market: ${listing.daysOnMarket}d with ${listing.priceDropPct}% price drop. ${isRealEstate ? `Features ${listing.unitsCount} units at ${listing.occupancyRatePct}% in-place occupancy (${listing.capRatePct}% cap rate).` : ''} ${isPM ? `Manages ${listing.doorsUnderManagement} units with high recurring fee retention.` : ''} ${deAnon.matchedLead ? `De-anonymized match: ${deAnon.matchedLead.name} (${deAnon.confidenceScore}% conf).` : ''}`,
          valuationEstimate: item.valuationEstimate || 3800000,
          status: 'qualified',
          revenue: item.revenue,
          ebitda: item.ebitda,
          profitMargin: Math.round(((item.ebitda || 700000) / (item.revenue || 3500000)) * 100),
          dealSourceChannel: 'ON_MARKET_LISTING',
          listingDetails: {
            ...listing,
            matchedEntityId: deAnon.matchedLead?.id,
            matchConfidence: deAnon.confidenceScore
          },
          tags: customTags,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: `${listing.sourcePlatform} Connector`
        };
      });

    onIngestListings(leadsToIngest);
    setSuccessCount(leadsToIngest.length);
    setIsIngesting(false);
  };

  return (
    <div className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
            <Store className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-base font-bold text-zinc-900">Commercial M&A & Real Estate Listing Aggregator</h4>
              <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-800">
                Multi-Asset
              </span>
            </div>
            <p className="text-xs text-zinc-500">Live feeds from Crexi, LoopNet, BizBuySell, Axial & Commercial Broker Networks.</p>
          </div>
        </div>

        <button
          onClick={handleIngest}
          disabled={isIngesting || selectedIds.length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-purple-700 hover:shadow-lg disabled:opacity-50"
        >
          <Layers className="h-4 w-4" />
          {isIngesting ? 'Ingesting Feeds...' : `Ingest ${selectedIds.length} Selected Deals`}
        </button>
      </div>

      {/* Multi-Daily Continuous Ingestion Status Banner */}
      <div className="rounded-xl border border-purple-200 bg-gradient-to-r from-purple-50/80 via-white to-indigo-50/80 p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600 text-white shadow-xs">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-900">Multi-Daily Continuous Ingestion Engine</span>
                <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  Active Polling (4x Daily)
                </span>
              </div>
              <p className="text-[11px] text-zinc-500">
                Continuous sweeps on Crexi (every 4h), BizBuySell (every 4h), LoopNet (2x daily) & Axial (hourly) with Change Data Capture (CDC).
              </p>
            </div>
          </div>

          <button
            onClick={handleTriggerMultiDailySweep}
            disabled={isSweepingFeeds}
            className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-purple-700 transition-colors disabled:opacity-50 whitespace-nowrap self-start sm:self-auto cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSweepingFeeds ? 'animate-spin' : ''}`} />
            {isSweepingFeeds ? 'Sweeping Multi-Daily Feeds...' : 'Run Scheduled Sweep Now'}
          </button>
        </div>

        {/* Feed Source Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-purple-100/60">
          {scheduler.getFeeds().map(feed => (
            <div key={feed.id} className="rounded-lg bg-white/80 border border-purple-100 p-2 text-[11px]">
              <div className="flex items-center justify-between font-bold text-zinc-800">
                <span>{feed.platform}</span>
                <span className="text-[9px] uppercase tracking-wider text-purple-700 font-extrabold bg-purple-50 px-1.5 py-0.5 rounded">
                  {feed.frequency.replace('_', ' ')}
                </span>
              </div>
              <div className="text-[10px] text-zinc-400 mt-0.5 flex items-center justify-between">
                <span>Interval: {feed.pollIntervalHours}h</span>
                <span className="text-emerald-600 font-semibold">~{feed.averageNewPerSweep} listings/sweep</span>
              </div>
            </div>
          ))}
        </div>

        {/* Last Sweep Delta Report (if ran) */}
        {lastSweepResult && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-3 text-xs space-y-1">
            <div className="flex items-center justify-between font-bold text-emerald-900">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Sweep Completed: {lastSweepResult.newListingsCreated.length} New Properties Ingested, {lastSweepResult.duplicatesSuppressed} Duplicates Suppressed
              </span>
              <span className="text-[10px] text-emerald-700 font-mono">Next automated sweep: in 4 hours</span>
            </div>
            {lastSweepResult.deltasDetected.length > 0 && (
              <div className="pt-1">
                {lastSweepResult.deltasDetected.map((d: IngestionDelta, i: number) => (
                  <p key={i} className="text-[11px] text-emerald-800">
                    ⚡ <strong>Change Detected:</strong> {d.narrative}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-zinc-400 font-medium text-[11px]">Filter Category:</span>
          {[
            { id: 'all', label: `All Deals (${SAMPLE_MARKETPLACE_LISTINGS.length})` },
            { id: 'trades', label: 'Trade SMBs (4)' },
            { id: 'property_management', label: 'Property Management (2)' },
            { id: 'multifamily', label: 'Multifamily Real Estate (2)' }
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              className={`rounded-lg px-2.5 py-1 font-bold transition-all text-[11px] ${
                activeCategory === cat.id
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            if (selectedIds.length === SAMPLE_MARKETPLACE_LISTINGS.length) {
              setSelectedIds([]);
            } else {
              setSelectedIds(SAMPLE_MARKETPLACE_LISTINGS.map((_, i) => `sample-${i}`));
            }
          }}
          className="text-[11px] font-bold text-purple-700 hover:underline"
        >
          {selectedIds.length === SAMPLE_MARKETPLACE_LISTINGS.length ? 'Deselect All' : 'Select All Deals'}
        </button>
      </div>

      {successCount !== null && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-medium text-emerald-800">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>Successfully ingested <strong>{successCount} listings</strong> across trade SMBs, property managers, and multifamily portfolios into your active pipeline!</span>
        </div>
      )}

      {/* Feed Cards */}
      <div className="grid gap-3 sm:grid-cols-2">
        {filteredListings.map((item) => {
          const originalIdx = SAMPLE_MARKETPLACE_LISTINGS.indexOf(item);
          const id = `sample-${originalIdx}`;
          const isSelected = selectedIds.includes(id);
          const listing = item.listingDetails!;
          const isRealEstate = item.industry === 'Multifamily Real Estate';
          const isPM = item.industry === 'Property Management';

          const signals = computeListingSignals(
            listing.askingPrice || 3500000,
            listing.cashFlowOrSde || 800000,
            listing.daysOnMarket || 60,
            listing.priceDropPct || 0,
            isRealEstate ? 8.5 : isPM ? 5.0 : 4.5
          );

          return (
            <div
              key={id}
              onClick={() => toggleSelect(id)}
              className={`group relative cursor-pointer rounded-xl border p-4 transition-all ${
                isSelected 
                  ? 'border-purple-300 bg-purple-50/30 ring-1 ring-purple-400' 
                  : 'border-zinc-200 bg-zinc-50/50 hover:border-zinc-300'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-1.5 mb-1">
                    <span className="rounded-md bg-zinc-900 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">
                      {listing.sourcePlatform}
                    </span>
                    {isRealEstate && (
                      <span className="rounded-md bg-blue-100 text-blue-800 px-2 py-0.5 text-[9px] font-bold">
                        Multifamily Asset
                      </span>
                    )}
                    {isPM && (
                      <span className="rounded-md bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[9px] font-bold">
                        Property Mgmt
                      </span>
                    )}
                    {listing.isBlindTeaser && (
                      <span className="rounded-md bg-amber-100 text-amber-800 px-2 py-0.5 text-[9px] font-bold">
                        Blind Teaser
                      </span>
                    )}
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {listing.listingId}
                    </span>
                  </div>
                  <h5 className="font-bold text-xs text-zinc-900 line-clamp-1">{item.name}</h5>
                  <p className="text-[10px] text-zinc-500">{item.industry} • {item.location}</p>
                </div>

                <input 
                  type="checkbox" 
                  checked={isSelected} 
                  onChange={() => {}} 
                  className="h-4 w-4 rounded border-zinc-300 text-purple-600 focus:ring-purple-500 cursor-pointer mt-0.5"
                />
              </div>

              {/* Real Estate / PM Special Metrics Banner */}
              {(isRealEstate || isPM) && (
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px]">
                  {isRealEstate && listing.unitsCount && (
                    <span className="rounded-md bg-blue-50 text-blue-700 px-2 py-0.5 font-bold border border-blue-200">
                      🏢 {listing.unitsCount} Units ({listing.occupancyRatePct}% Occ)
                    </span>
                  )}
                  {isRealEstate && listing.capRatePct && (
                    <span className="rounded-md bg-emerald-50 text-emerald-700 px-2 py-0.5 font-bold border border-emerald-200">
                      📊 {listing.capRatePct}% In-Place Cap Rate
                    </span>
                  )}
                  {isPM && listing.doorsUnderManagement && (
                    <span className="rounded-md bg-emerald-50 text-emerald-700 px-2 py-0.5 font-bold border border-emerald-200">
                      🚪 {listing.doorsUnderManagement.toLocaleString()} Managed Doors
                    </span>
                  )}
                </div>
              )}

              {/* Teaser summary */}
              <p className="mt-2 text-[10px] text-zinc-600 line-clamp-2 leading-relaxed italic bg-white/70 p-2 rounded-lg border border-zinc-100">
                "{listing.teaserSummary}"
              </p>

              {/* Signals Grid */}
              <div className="mt-3 grid grid-cols-3 gap-2 border-t border-zinc-100 pt-2.5 text-center">
                <div className="bg-white rounded-lg p-1.5 border border-zinc-100">
                  <p className="text-[8px] uppercase text-zinc-400 font-bold">Asking Price</p>
                  <p className="text-xs font-bold text-zinc-800">${((listing.askingPrice || 0) / 1000000).toFixed(2)}M</p>
                  <span className="text-[9px] text-purple-600 font-mono font-bold">
                    {signals.askingMultiple}x {isRealEstate ? 'NOI' : 'SDE'}
                  </span>
                </div>

                <div className="bg-white rounded-lg p-1.5 border border-zinc-100">
                  <p className="text-[8px] uppercase text-zinc-400 font-bold">Days on Market</p>
                  <p className={`text-xs font-bold ${listing.daysOnMarket && listing.daysOnMarket >= 120 ? 'text-amber-600' : 'text-zinc-800'}`}>
                    {listing.daysOnMarket}d
                  </p>
                  <span className="text-[9px] text-zinc-500">Fatigue: {signals.domFatigueScore}x</span>
                </div>

                <div className="bg-white rounded-lg p-1.5 border border-zinc-100">
                  <p className="text-[8px] uppercase text-zinc-400 font-bold">{isRealEstate ? 'In-Place NOI' : 'Price Cut'}</p>
                  <p className={`text-xs font-bold ${isRealEstate ? 'text-emerald-600' : (listing.priceDropPct || 0) > 0 ? 'text-red-600' : 'text-zinc-400'}`}>
                    {isRealEstate && listing.inPlaceNoi ? `$${((listing.inPlaceNoi)/1000).toFixed(0)}k` : (listing.priceDropPct || 0) > 0 ? `-${listing.priceDropPct}%` : 'Firm'}
                  </p>
                  <span className="text-[9px] text-emerald-600 font-bold">Score {signals.compositePropensityScore}</span>
                </div>
              </div>

              {/* Broker Footer */}
              <div className="mt-2.5 flex items-center justify-between text-[9px] text-zinc-400">
                <span className="truncate">Broker: {listing.brokerName} ({listing.brokerFirm})</span>
                <span className="text-purple-600 font-medium flex items-center gap-0.5">
                  View Teaser <ArrowRight className="h-2.5 w-2.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
