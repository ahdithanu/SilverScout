import React, { useState } from 'react';
import { Lead } from '../../types';
import { 
  SAMPLE_MARKETPLACE_LISTINGS, 
  computeListingSignals, 
  deAnonymizeBlindListing 
} from '../../services/listingIngestionService';
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
  DollarSign
} from 'lucide-react';

interface ListingAggregatorCardProps {
  existingLeads: Lead[];
  onIngestListings: (newLeads: Lead[]) => void;
}

export const ListingAggregatorCard: React.FC<ListingAggregatorCardProps> = ({
  existingLeads,
  onIngestListings
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(
    SAMPLE_MARKETPLACE_LISTINGS.map((_, i) => `sample-${i}`)
  );
  const [isIngesting, setIsIngesting] = useState(false);
  const [successCount, setSuccessCount] = useState<number | null>(null);

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
          4.5
        );

        // Run De-Anonymization against existing off-market registry leads
        const deAnon = deAnonymizeBlindListing({
          industry: item.industry || 'HVAC',
          location: item.location || 'Central Valley, CA',
          revenue: item.revenue,
          cashFlow: listing.cashFlowOrSde
        }, existingLeads);

        return {
          id,
          fundId: 'search-fund-alpha',
          name: item.name || 'Confidential Trade Target',
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
          aiThesis: `On-Market Listing sourced from ${listing.sourcePlatform}. Asking $${((listing.askingPrice || 0)/1000000).toFixed(2)}M (${signals.askingMultiple}x SDE). Days on Market: ${listing.daysOnMarket}d with ${listing.priceDropPct}% price drop. ${deAnon.matchedLead ? `De-anonymized match: ${deAnon.matchedLead.name} (${deAnon.confidenceScore}% conf).` : ''}`,
          valuationEstimate: item.valuationEstimate || 3800000,
          status: 'qualified',
          currentState: 'ENRICHED',
          revenue: item.revenue,
          ebitda: item.ebitda,
          profitMargin: Math.round(((item.ebitda || 700000) / (item.revenue || 3500000)) * 100),
          dealSourceChannel: 'ON_MARKET_LISTING',
          listingDetails: {
            ...listing,
            matchedEntityId: deAnon.matchedLead?.id,
            matchConfidence: deAnon.confidenceScore
          },
          tags: ['On-Market Listing', listing.sourcePlatform, `DOM ${listing.daysOnMarket}d`],
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
            <h4 className="text-base font-bold text-zinc-900">On-Market Business Listing Aggregator</h4>
            <p className="text-xs text-zinc-500">Live connectors for BizBuySell, Axial, BusinessesForSale & Broker CIMs.</p>
          </div>
        </div>

        <button
          onClick={handleIngest}
          disabled={isIngesting || selectedIds.length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-purple-700 hover:shadow-lg disabled:opacity-50"
        >
          <Layers className="h-4 w-4" />
          {isIngesting ? 'Ingesting Feeds...' : `Ingest ${selectedIds.length} Selected Listings`}
        </button>
      </div>

      {successCount !== null && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-medium text-emerald-800">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>Successfully ingested <strong>{successCount} on-market deals</strong> with DOM fatigue and valuation spread signals into your active pipeline!</span>
        </div>
      )}

      {/* Feed Cards */}
      <div className="grid gap-3 sm:grid-cols-2">
        {SAMPLE_MARKETPLACE_LISTINGS.map((item, idx) => {
          const id = `sample-${idx}`;
          const isSelected = selectedIds.includes(id);
          const listing = item.listingDetails!;
          const signals = computeListingSignals(
            listing.askingPrice || 3500000,
            listing.cashFlowOrSde || 800000,
            listing.daysOnMarket || 60,
            listing.priceDropPct || 0,
            4.5
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
                  <div className="flex items-center gap-2 mb-1">
                    <span className="rounded-md bg-zinc-900 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">
                      {listing.sourcePlatform}
                    </span>
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

              {/* Teaser summary */}
              <p className="mt-2 text-[10px] text-zinc-600 line-clamp-2 leading-relaxed italic bg-white/70 p-2 rounded-lg border border-zinc-100">
                "{listing.teaserSummary}"
              </p>

              {/* Signals Grid */}
              <div className="mt-3 grid grid-cols-3 gap-2 border-t border-zinc-100 pt-2.5 text-center">
                <div className="bg-white rounded-lg p-1.5 border border-zinc-100">
                  <p className="text-[8px] uppercase text-zinc-400 font-bold">Asking Price</p>
                  <p className="text-xs font-bold text-zinc-800">${((listing.askingPrice || 0) / 1000000).toFixed(2)}M</p>
                  <span className="text-[9px] text-purple-600 font-mono font-bold">{signals.askingMultiple}x SDE</span>
                </div>

                <div className="bg-white rounded-lg p-1.5 border border-zinc-100">
                  <p className="text-[8px] uppercase text-zinc-400 font-bold">Days on Market</p>
                  <p className={`text-xs font-bold ${listing.daysOnMarket && listing.daysOnMarket >= 120 ? 'text-amber-600' : 'text-zinc-800'}`}>
                    {listing.daysOnMarket}d
                  </p>
                  <span className="text-[9px] text-zinc-500">Fatigue: {signals.domFatigueScore}x</span>
                </div>

                <div className="bg-white rounded-lg p-1.5 border border-zinc-100">
                  <p className="text-[8px] uppercase text-zinc-400 font-bold">Price Cut</p>
                  <p className={`text-xs font-bold ${(listing.priceDropPct || 0) > 0 ? 'text-red-600' : 'text-zinc-400'}`}>
                    {(listing.priceDropPct || 0) > 0 ? `-${listing.priceDropPct}%` : 'Firm'}
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
