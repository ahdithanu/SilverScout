import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Printer, Copy, Clock } from 'lucide-react';
import { Lead } from '../../types';
import { ICMemoData } from '../../services/geminiService';
import { Button } from '../common/DesignSystem';

interface ICMemoDetailModalProps {
  lead: Lead | null;
  icMemoData: ICMemoData | null;
  isGeneratingICMemo: boolean;
  copiedField: string | null;
  onCopyText: (text: string, field: string) => void;
  onClose: () => void;
}

export const ICMemoDetailModal: React.FC<ICMemoDetailModalProps> = ({
  lead,
  icMemoData,
  isGeneratingICMemo,
  copiedField,
  onCopyText,
  onClose
}) => {
  return (
    <AnimatePresence>
      {lead && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto print:p-0 print:bg-white print:static"
          role="dialog"
          aria-modal="true"
          aria-label="Investment Committee Deal Teaser"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative w-full max-w-4xl rounded-2xl bg-white p-8 shadow-2xl border border-zinc-200 my-8 print:shadow-none print:border-none print:max-w-none print:p-0 print:my-0"
          >
            <div className="flex items-center justify-between border-b border-zinc-200 pb-4 mb-6 print:hidden">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                  <FileText className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="font-extrabold text-lg text-zinc-900">Investment Committee (IC) Deal Teaser</h3>
                  <p className="text-xs text-zinc-500">Confidential M&A Acquisition Brief • {lead.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => window.print()}>
                  <Printer className="h-3.5 w-3.5 text-zinc-600" />
                  Print / Export PDF
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 text-xs"
                  onClick={() => {
                    if (!icMemoData) return;
                    const markdown = `# INVESTMENT COMMITTEE MEMORANDUM\n**TARGET:** ${lead.name}\n**INDUSTRY:** ${lead.industry}\n**VALUATION EST:** $${(lead.valuationEstimate || 0).toLocaleString()}\n\n## DEAL SUMMARY\n${icMemoData.dealSummary}\n\n## EXECUTIVE SUMMARY\n${icMemoData.executiveSummary}\n\n## INVESTMENT HIGHLIGHTS\n${icMemoData.investmentHighlights.map((h) => `- ${h}`).join('\n')}\n\n## KEY RISKS & MITIGATION\n${icMemoData.keyRisks.map((r) => `- **Risk:** ${r.risk}\n  **Mitigation:** ${r.mitigation}`).join('\n')}`;
                    navigator.clipboard.writeText(markdown);
                    onCopyText(markdown, 'icmemo');
                  }}
                >
                  <Copy className="h-3.5 w-3.5 text-zinc-600" />
                  {copiedField === 'icmemo' ? 'Copied Markdown!' : 'Copy Markdown'}
                </Button>

                <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700 text-sm font-bold px-2">
                  ✕
                </button>
              </div>
            </div>

            {isGeneratingICMemo ? (
              <div className="py-20 text-center space-y-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                  <Clock className="h-6 w-6 animate-spin" />
                </div>
                <h4 className="font-bold text-zinc-900 text-lg">Synthesizing Investment Committee Memo...</h4>
                <p className="text-xs text-zinc-500 max-w-md mx-auto leading-relaxed">
                  Gemini is structuring financial models, valuation multiples, risk mitigations, and transaction terms for{' '}
                  <strong>{lead.name}</strong>.
                </p>
              </div>
            ) : icMemoData ? (
              <div className="space-y-6 text-zinc-800 text-xs leading-relaxed font-sans">
                <div className="flex items-center justify-between border-b-2 border-zinc-900 pb-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      STRICTLY CONFIDENTIAL
                    </span>
                    <h1 className="text-2xl font-black text-zinc-900 mt-1">{lead.name}</h1>
                    <p className="text-xs text-zinc-500 font-medium">
                      {lead.industry} • {lead.location} • Owner: {lead.agentName || 'Individual Owner'}
                    </p>
                  </div>

                  <div className="text-right space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Exit Propensity</p>
                    <div className="inline-flex items-center gap-1 bg-zinc-900 text-white font-black px-3 py-1 rounded-xl text-base">
                      <span>{lead.exitPropensityScore || '?'}/10</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
                  <h5 className="font-bold text-emerald-900 text-xs uppercase tracking-wider mb-1">Deal Overview</h5>
                  <p className="text-xs text-emerald-950 font-medium leading-relaxed">{icMemoData.dealSummary}</p>
                </div>

                <div className="space-y-2">
                  <h5 className="font-bold text-zinc-900 uppercase tracking-wider text-[11px] border-b border-zinc-200 pb-1">
                    1. Investment Rationale & Thesis
                  </h5>
                  <p className="text-xs text-zinc-700 leading-relaxed">{icMemoData.executiveSummary}</p>
                </div>

                <div className="grid grid-cols-4 gap-3 border border-zinc-200 rounded-xl p-4 bg-zinc-50/50">
                  <div>
                    <p className="text-[9px] uppercase font-bold text-zinc-400">Est. Revenue</p>
                    <p className="text-sm font-black text-zinc-900">{icMemoData.financialOverview.estimatedRevenue}</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase font-bold text-zinc-400">Est. EBITDA</p>
                    <p className="text-sm font-black text-zinc-900">{icMemoData.financialOverview.estimatedEbitda}</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase font-bold text-zinc-400">Implied Multiple</p>
                    <p className="text-sm font-black text-emerald-600">{icMemoData.financialOverview.impliedMultiple}</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase font-bold text-zinc-400">Valuation Range</p>
                    <p className="text-sm font-black text-zinc-900">{icMemoData.financialOverview.valuationRange}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <h5 className="font-bold text-zinc-900 uppercase tracking-wider text-[11px] border-b border-zinc-200 pb-1">
                      2. Value Creation & Key Highlights
                    </h5>
                    <ul className="space-y-1.5 list-disc pl-4 text-xs text-zinc-700">
                      {icMemoData.investmentHighlights.map((hl, i) => (
                        <li key={i}>{hl}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h5 className="font-bold text-zinc-900 uppercase tracking-wider text-[11px] border-b border-zinc-200 pb-1">
                      3. Red Flag Risks & Mitigations
                    </h5>
                    <div className="space-y-2">
                      {icMemoData.keyRisks.map((rk, i) => (
                        <div key={i} className="rounded-lg border border-red-100 bg-red-50/30 p-2 text-xs">
                          <p className="font-bold text-red-900">Risk: {rk.risk}</p>
                          <p className="text-zinc-600 text-[11px]">Mitigation: {rk.mitigation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-zinc-200">
                  <h5 className="font-bold text-zinc-900 uppercase tracking-wider text-[11px]">
                    4. Proposed Transaction Terms
                  </h5>
                  <div className="grid grid-cols-4 gap-3 bg-zinc-900 text-white rounded-xl p-3 text-center">
                    <div>
                      <p className="text-[9px] uppercase text-zinc-400">Offer Price</p>
                      <p className="text-xs font-bold text-emerald-400">{icMemoData.dealStructure.recommendedPrice}</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase text-zinc-400">Upfront Cash</p>
                      <p className="text-xs font-bold text-white">{icMemoData.dealStructure.upfrontCash}</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase text-zinc-400">Seller Note</p>
                      <p className="text-xs font-bold text-white">{icMemoData.dealStructure.sellerNote}</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase text-zinc-400">Earnout Terms</p>
                      <p className="text-xs font-bold text-amber-400">{icMemoData.dealStructure.earnout}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-2 border-t border-zinc-100">
                    <span className="font-bold text-zinc-700">Immediate Action Steps:</span>
                    <span>{icMemoData.nextSteps.join(' • ')}</span>
                  </div>
                </div>
              </div>
            ) : null}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
