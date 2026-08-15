import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Printer, Sparkles } from 'lucide-react';
import { Lead } from '../../types';
import { Button, ICMemoData } from '../../App';

interface ICMemoModalProps {
  lead: Lead | null;
  icMemoData: ICMemoData | null;
  isGenerating: boolean;
  onClose: () => void;
}

export const ICMemoModal: React.FC<ICMemoModalProps> = ({ lead, icMemoData, isGenerating, onClose }) => {
  if (!lead) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto print:p-0 print:bg-white print:static" role="dialog" aria-modal="true" aria-label="Investment Committee Deal Teaser">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full max-w-4xl rounded-2xl bg-white p-8 shadow-2xl border border-zinc-200 my-8 print:shadow-none print:border-none print:max-w-none print:p-0 print:my-0"
        >
          {/* Header Actions */}
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
                <Printer className="h-3.5 w-3.5" />
                Print / Save PDF
              </Button>
              <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700 font-bold px-2 text-sm">
                ✕
              </button>
            </div>
          </div>

          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Sparkles className="h-10 w-10 text-emerald-600 animate-spin" />
              <p className="text-sm font-semibold text-zinc-700">Synthesizing Investment Thesis & Financials with Gemini...</p>
            </div>
          ) : icMemoData ? (
            <div className="space-y-6">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-1">Executive Executive Summary</h4>
                <p className="text-xs leading-relaxed text-emerald-950">{icMemoData.dealSummary}</p>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">Key Investment Thesis Pillars</h4>
                <div className="grid gap-2 sm:grid-cols-2">
                  {icMemoData.investmentThesis.map((pillar, idx) => (
                    <div key={idx} className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-3 text-xs text-zinc-800 flex items-start gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">{idx + 1}</span>
                      <span>{pillar}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">Key Risks & Proposed Mitigants</h4>
                <div className="space-y-2">
                  {icMemoData.keyRisksAndMitigants.map((rm, idx) => (
                    <div key={idx} className="rounded-lg border border-zinc-200 p-3 text-xs grid grid-cols-1 md:grid-cols-2 gap-2 bg-white">
                      <div>
                        <span className="font-semibold text-red-600">Risk: </span>
                        <span className="text-zinc-700">{rm.risk}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-emerald-700">Mitigant: </span>
                        <span className="text-zinc-700">{rm.mitigant}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl bg-zinc-900 p-4 text-white space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">Proposed Deal Structure</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
                  <div>
                    <p className="text-[9px] uppercase text-zinc-400">Purchase Price</p>
                    <p className="text-xs font-bold text-white">{icMemoData.dealStructure.purchasePrice}</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase text-zinc-400">Upfront Cash</p>
                    <p className="text-xs font-bold text-emerald-400">{icMemoData.dealStructure.upfrontCash}</p>
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
              </div>
            </div>
          ) : null}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
