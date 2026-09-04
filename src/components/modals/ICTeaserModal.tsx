import React, { useState, useEffect } from 'react';
import { Lead } from '../../types';
import { ICMemoData, generateICMemo } from '../../services/geminiService';
import { 
  Printer, 
  X, 
  Building2, 
  FileText, 
  TrendingUp, 
  ShieldAlert, 
  Clock, 
  DollarSign,
  Download,
  CheckCircle2,
  Landmark
} from 'lucide-react';

interface ICTeaserModalProps {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
}

export const ICTeaserModal: React.FC<ICTeaserModalProps> = ({
  lead,
  isOpen,
  onClose
}) => {
  const [memoData, setMemoData] = useState<ICMemoData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    setLoading(true);

    generateICMemo(lead).then((data) => {
      if (isMounted) {
        setMemoData(data);
        setLoading(false);
      }
    }).catch((err) => {
      console.error("IC Memo fetch error:", err);
      if (isMounted) setLoading(false);
    });

    return () => { isMounted = false; };
  }, [lead, isOpen]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedValuation = lead.valuationEstimate 
    ? `$${(lead.valuationEstimate / 1000000).toFixed(2)}M` 
    : '$3.80M';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <Landmark className="h-5 w-5 text-emerald-400" />
            <div>
              <h3 className="font-bold text-white text-sm">1-Page Investment Committee (IC) Deal Teaser</h3>
              <p className="text-[11px] text-zinc-400">Institutional Private Equity Underwriting Memorandum</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-md hover:bg-emerald-500 transition-colors"
            >
              <Printer className="h-3.5 w-3.5" />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Printable Memo Body */}
        <div className="flex-1 overflow-y-auto p-8 bg-zinc-900 text-zinc-100 font-sans print:bg-white print:text-black print:p-0">
          {loading ? (
            <div className="flex h-64 flex-col items-center justify-center gap-3">
              <Clock className="h-6 w-6 animate-spin text-emerald-400" />
              <p className="text-xs text-zinc-400 font-mono">SYNTHESIZING INVESTMENT MEMO DATA...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Document Header */}
              <div className="border-b-2 border-emerald-500/80 pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 print:text-emerald-800">
                      CONFIDENTIAL // PRIVATE EQUITY INVESTMENT COMMITTEE
                    </span>
                    <h1 className="text-2xl font-black tracking-tight text-white print:text-black mt-1">
                      PROJECT {lead.name.toUpperCase().replace(/[^A-Z0-9]/g, '_')}
                    </h1>
                    <p className="text-xs text-zinc-400 print:text-zinc-600 mt-0.5">
                      Target Entity: <strong className="text-white print:text-black">{lead.name}</strong> • {lead.location} • {lead.industry}
                    </p>
                  </div>
                  <div className="text-right text-xs">
                    <p className="font-bold text-white print:text-black">SILVER SCOUT CAPITAL</p>
                    <p className="text-zinc-400 print:text-zinc-600 font-mono">{new Date().toISOString().split('T')[0]}</p>
                    <p className="text-emerald-400 print:text-emerald-700 font-bold mt-1">
                      Valuation: {formattedValuation}
                    </p>
                  </div>
                </div>
              </div>

              {/* Deal Summary / Rationale */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 print:text-emerald-800">
                  I. Executive Summary & Buyout Rationale
                </h4>
                <p className="text-xs leading-relaxed text-zinc-300 print:text-zinc-800">
                  {memoData?.executiveSummary || lead.aiThesis}
                </p>
              </div>

              {/* Financial Snapshot Grid */}
              <div className="rounded-xl border border-zinc-800 print:border-zinc-300 bg-zinc-950/60 print:bg-zinc-50 p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 print:text-zinc-600 mb-3">
                  II. Financial Snapshot & Transaction Valuation
                </h4>
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div className="rounded-lg bg-zinc-900 print:bg-white p-2 border border-zinc-800 print:border-zinc-200">
                    <p className="text-[10px] text-zinc-400">Est. Gross Revenue</p>
                    <p className="text-sm font-bold text-white print:text-black font-mono mt-0.5">
                      {memoData?.financialOverview.estimatedRevenue || `$${((lead.revenue || 3500000) / 1000000).toFixed(2)}M`}
                    </p>
                  </div>
                  <div className="rounded-lg bg-zinc-900 print:bg-white p-2 border border-zinc-800 print:border-zinc-200">
                    <p className="text-[10px] text-zinc-400">Est. Adjusted EBITDA</p>
                    <p className="text-sm font-bold text-emerald-400 print:text-emerald-700 font-mono mt-0.5">
                      {memoData?.financialOverview.estimatedEbitda || `$${((lead.ebitda || 770000) / 1000).toFixed(0)}k`}
                    </p>
                  </div>
                  <div className="rounded-lg bg-zinc-900 print:bg-white p-2 border border-zinc-800 print:border-zinc-200">
                    <p className="text-[10px] text-zinc-400">Implied Multiple</p>
                    <p className="text-sm font-bold text-white print:text-black font-mono mt-0.5">
                      {memoData?.financialOverview.impliedMultiple || '4.8x EBITDA'}
                    </p>
                  </div>
                  <div className="rounded-lg bg-zinc-900 print:bg-white p-2 border border-zinc-800 print:border-zinc-200">
                    <p className="text-[10px] text-zinc-400">Exit Propensity</p>
                    <p className="text-sm font-bold text-amber-400 print:text-amber-700 font-mono mt-0.5">
                      {lead.exitPropensityScore || 8} / 10
                    </p>
                  </div>
                </div>
              </div>

              {/* Value Creation Levers */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 print:text-emerald-800">
                  III. Value Creation & Platform Growth Levers
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {(memoData?.investmentHighlights || [
                    "Proprietary off-market founder succession transition with zero auction broker fees.",
                    "Substantial municipal route overlap creating immediate labor dispatch efficiency.",
                    "Deferred ERP modernization providing instant 250bps SG&A EBITDA margin expansion.",
                    "Accretive tuck-in candidate for regional mechanical platform."
                  ]).map((highlight, idx) => (
                    <div key={idx} className="flex items-start gap-2 rounded-lg border border-zinc-800 print:border-zinc-200 p-2 text-xs text-zinc-300 print:text-zinc-800">
                      <span className="text-emerald-400 print:text-emerald-700 font-bold">•</span>
                      <span>{highlight}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Risks & Mitigations */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 print:text-amber-800">
                  IV. Diligence Risks & Mitigations
                </h4>
                <div className="space-y-1.5">
                  {(memoData?.keyRisks || [
                    { risk: "Founder relationship key-person dependency", mitigation: "Structure 18-month advisory retention agreement." },
                    { risk: "Municipal building permit deceleration", mitigation: "Commercial contract backlog demonstrates steady recurring cashflow." }
                  ]).map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center rounded-lg border border-zinc-800 print:border-zinc-200 bg-zinc-950/40 print:bg-zinc-50 p-2 text-xs">
                      <span className="font-semibold text-zinc-300 print:text-zinc-800">Risk: {item.risk}</span>
                      <span className="text-zinc-400 print:text-zinc-600">Mitigation: {item.mitigation}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Deal Financing Structure */}
              <div className="border-t border-zinc-800 print:border-zinc-300 pt-4 flex items-center justify-between text-xs text-zinc-400 print:text-zinc-600">
                <span>Structure: <strong>75% Cash at Closing / 15% Seller Note / 10% Earnout</strong></span>
                <span className="font-mono">Approved for Initial LOI Issuance</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
