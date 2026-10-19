import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { FileCheck2, Printer, Copy, Clock, Sparkles } from 'lucide-react';
import { Lead } from '../../types';
import { LOITerms } from '../../services/geminiService';
import { Button } from '../common/DesignSystem';

interface LOIGeneratorModalProps {
  lead: Lead | null;
  loiTerms: LOITerms;
  setLoiTerms: React.Dispatch<React.SetStateAction<LOITerms>>;
  generatedLOIDoc: { title: string; loiBody: string } | null;
  setGeneratedLOIDoc: (doc: { title: string; loiBody: string } | null) => void;
  isGeneratingLOI: boolean;
  copiedField: string | null;
  onCopyText: (text: string, field: string) => void;
  onGenerateLOI: () => void;
  onSaveAndMoveToLOI: (leadId: string) => Promise<void>;
  onClose: () => void;
}

export const LOIGeneratorModal: React.FC<LOIGeneratorModalProps> = ({
  lead,
  loiTerms,
  setLoiTerms,
  generatedLOIDoc,
  setGeneratedLOIDoc,
  isGeneratingLOI,
  copiedField,
  onCopyText,
  onGenerateLOI,
  onSaveAndMoveToLOI,
  onClose
}) => {
  return (
    <AnimatePresence>
      {lead && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto print:p-0 print:bg-white print:static"
          role="dialog"
          aria-modal="true"
          aria-label="M&A Acquisition Letter of Intent Generator"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative w-full max-w-4xl rounded-2xl bg-white p-8 shadow-2xl border border-zinc-200 my-8 print:shadow-none print:border-none print:max-w-none print:p-0 print:my-0"
          >
            <div className="flex items-center justify-between border-b border-zinc-200 pb-4 mb-6 print:hidden">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                  <FileCheck2 className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="font-extrabold text-lg text-zinc-900">
                    M&A Acquisition Letter of Intent (LOI) Generator
                  </h3>
                  <p className="text-xs text-zinc-500">Draft Non-Binding Acquisition Offer • {lead.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {generatedLOIDoc && (
                  <>
                    <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => window.print()}>
                      <Printer className="h-3.5 w-3.5 text-zinc-600" />
                      Print / Export PDF
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 text-xs"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedLOIDoc.loiBody);
                        onCopyText(generatedLOIDoc.loiBody, 'loi');
                      }}
                    >
                      <Copy className="h-3.5 w-3.5 text-zinc-600" />
                      {copiedField === 'loi' ? 'Copied LOI!' : 'Copy LOI Text'}
                    </Button>
                  </>
                )}

                <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700 text-sm font-bold px-2">
                  ✕
                </button>
              </div>
            </div>

            {!generatedLOIDoc ? (
              <div className="space-y-6">
                <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 text-xs text-amber-900 leading-relaxed">
                  <p className="font-bold">Configure Acquisition Offer Terms for {lead.name}</p>
                  <p className="text-amber-800/80">
                    Customize purchase price, upfront cash split, seller note financing, earnouts, and exclusivity
                    period before generating the formal non-binding LOI document.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-500 uppercase tracking-wider text-[10px]">
                      Total Purchase Price ($)
                    </label>
                    <input
                      type="number"
                      value={loiTerms.purchasePrice}
                      onChange={(e) =>
                        setLoiTerms((prev) => ({ ...prev, purchasePrice: parseFloat(e.target.value) || 0 }))
                      }
                      className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 px-3 text-sm font-bold focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-zinc-500 uppercase tracking-wider text-[10px]">
                      Upfront Cash ($)
                    </label>
                    <input
                      type="number"
                      value={loiTerms.upfrontCash}
                      onChange={(e) =>
                        setLoiTerms((prev) => ({ ...prev, upfrontCash: parseFloat(e.target.value) || 0 }))
                      }
                      className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 px-3 text-sm font-bold focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-zinc-500 uppercase tracking-wider text-[10px]">
                      Seller Note ($)
                    </label>
                    <input
                      type="number"
                      value={loiTerms.sellerNote}
                      onChange={(e) =>
                        setLoiTerms((prev) => ({ ...prev, sellerNote: parseFloat(e.target.value) || 0 }))
                      }
                      className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 px-3 text-sm font-bold focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-zinc-500 uppercase tracking-wider text-[10px]">
                      Contingent Earnout ($)
                    </label>
                    <input
                      type="number"
                      value={loiTerms.earnoutAmount}
                      onChange={(e) =>
                        setLoiTerms((prev) => ({ ...prev, earnoutAmount: parseFloat(e.target.value) || 0 }))
                      }
                      className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 px-3 text-sm font-bold focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-zinc-500 uppercase tracking-wider text-[10px]">
                      Rollover Equity (%)
                    </label>
                    <input
                      type="number"
                      value={loiTerms.rolloverEquityPercent}
                      onChange={(e) =>
                        setLoiTerms((prev) => ({ ...prev, rolloverEquityPercent: parseFloat(e.target.value) || 0 }))
                      }
                      className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 px-3 text-sm font-bold focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-zinc-500 uppercase tracking-wider text-[10px]">
                      Working Capital Peg ($)
                    </label>
                    <input
                      type="number"
                      value={loiTerms.workingCapitalPeg}
                      onChange={(e) =>
                        setLoiTerms((prev) => ({ ...prev, workingCapitalPeg: parseFloat(e.target.value) || 0 }))
                      }
                      className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 px-3 text-sm font-bold focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <Button
                  onClick={onGenerateLOI}
                  disabled={isGeneratingLOI}
                  className="w-full py-4 gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm"
                >
                  {isGeneratingLOI ? (
                    <>
                      <Clock className="h-4 w-4 animate-spin" />
                      Generating Legal LOI Document with Gemini...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Draft Formal Non-Binding LOI Document
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
                  <h2 className="text-xl font-bold text-zinc-900">{generatedLOIDoc.title}</h2>
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => setGeneratedLOIDoc(null)}
                    className="text-xs text-amber-700 border-amber-200"
                  >
                    Edit Offer Terms
                  </Button>
                </div>

                <div className="prose prose-sm max-w-none rounded-xl border border-zinc-200 bg-zinc-50/50 p-6 text-zinc-800 font-mono text-xs leading-relaxed max-h-[500px] overflow-y-auto">
                  <ReactMarkdown>{generatedLOIDoc.loiBody}</ReactMarkdown>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="primary"
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-bold"
                    onClick={async () => {
                      await onSaveAndMoveToLOI(lead.id);
                    }}
                  >
                    <FileCheck2 className="h-4 w-4" />
                    Save LOI & Move Target to "Under LOI" Stage
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
