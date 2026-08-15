import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileCheck2, Sparkles, Printer, CheckCircle, ShieldAlert } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Lead, UserRole, LOITerms } from '../../types';
import { Button } from '../../App';
import { canApproveLOI } from '../../utils/rbac';

interface LOIGeneratorModalProps {
  lead: Lead | null;
  loiTerms: LOITerms;
  setLoiTerms: React.Dispatch<React.SetStateAction<LOITerms>>;
  isGenerating: boolean;
  generatedLOIDoc: { title: string; loiBody: string } | null;
  onGenerateDoc: () => Promise<void>;
  onClose: () => void;
  onApproveAndSave: () => Promise<void>;
  userRole: UserRole;
}

export const LOIGeneratorModal: React.FC<LOIGeneratorModalProps> = ({
  lead,
  loiTerms,
  setLoiTerms,
  isGenerating,
  generatedLOIDoc,
  onGenerateDoc,
  onClose,
  onApproveAndSave,
  userRole
}) => {
  if (!lead) return null;

  const isPartner = canApproveLOI(userRole);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto print:p-0 print:bg-white print:static" role="dialog" aria-modal="true" aria-label="M&A Acquisition Letter of Intent Generator">
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
                <h3 className="font-extrabold text-lg text-zinc-900">M&A Acquisition Letter of Intent (LOI) Generator</h3>
                <p className="text-xs text-zinc-500">Draft Non-Binding Acquisition Offer • {lead.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {generatedLOIDoc && (
                <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => window.print()}>
                  <Printer className="h-3.5 w-3.5" />
                  Print / Save PDF
                </Button>
              )}
              <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700 font-bold px-2 text-sm">
                ✕
              </button>
            </div>
          </div>

          {!generatedLOIDoc ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Purchase Price ($)</label>
                  <input
                    type="number"
                    value={loiTerms.purchasePrice}
                    onChange={(e) => setLoiTerms(prev => ({ ...prev, purchasePrice: parseFloat(e.target.value) || 0 }))}
                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 px-3 text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Upfront Cash ($)</label>
                  <input
                    type="number"
                    value={loiTerms.upfrontCash}
                    onChange={(e) => setLoiTerms(prev => ({ ...prev, upfrontCash: parseFloat(e.target.value) || 0 }))}
                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 px-3 text-sm font-semibold text-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Seller Subordinated Note ($)</label>
                  <input
                    type="number"
                    value={loiTerms.sellerNote}
                    onChange={(e) => setLoiTerms(prev => ({ ...prev, sellerNote: parseFloat(e.target.value) || 0 }))}
                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 px-3 text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Earnout Amount ($)</label>
                  <input
                    type="number"
                    value={loiTerms.earnoutAmount}
                    onChange={(e) => setLoiTerms(prev => ({ ...prev, earnoutAmount: parseFloat(e.target.value) || 0 }))}
                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 px-3 text-sm font-semibold text-amber-600"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-200">
                <Button
                  className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white gap-2 font-bold"
                  onClick={onGenerateDoc}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Sparkles className="h-4 w-4 animate-spin" />
                      Generating Non-Binding LOI Document...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Draft Formal Non-Binding LOI Document
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
                <h2 className="text-xl font-bold text-zinc-900">{generatedLOIDoc.title}</h2>
              </div>

              <div className="prose prose-sm max-w-none rounded-xl border border-zinc-200 bg-zinc-50/50 p-6 text-zinc-800 font-mono text-xs leading-relaxed max-h-[500px] overflow-y-auto">
                <ReactMarkdown>{generatedLOIDoc.loiBody}</ReactMarkdown>
              </div>

              <div className="flex gap-3 pt-2">
                {!isPartner ? (
                  <div className="w-full flex items-center justify-between rounded-xl bg-amber-50 p-4 border border-amber-200 text-amber-900 text-xs">
                    <div className="flex items-center gap-2 font-semibold">
                      <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0" />
                      <span>Analyst Draft Mode: Partner approval required to issue LOI and transition lead stage to "Under LOI".</span>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="primary"
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-bold"
                    onClick={onApproveAndSave}
                  >
                    <CheckCircle className="h-4 w-4" />
                    Approve LOI & Move Target to "Under LOI" Stage
                  </Button>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
