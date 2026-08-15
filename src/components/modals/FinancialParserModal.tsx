import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileUp, Sparkles, Plus, CheckCircle2 } from 'lucide-react';
import { ExtractedFinancials, Button } from '../../App';

interface FinancialParserModalProps {
  show: boolean;
  onClose: () => void;
  isParsing: boolean;
  extractedDocData: ExtractedFinancials | null;
  onFileUpload: (file: File) => void;
  onApplyExtracted: () => void;
}

export const FinancialParserModal: React.FC<FinancialParserModalProps> = ({
  show,
  onClose,
  isParsing,
  extractedDocData,
  onFileUpload,
  onApplyExtracted
}) => {
  if (!show) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto" role="dialog" aria-modal="true" aria-label="AI Quality of Earnings & P&L Document Parser">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full max-w-2xl rounded-2xl bg-white p-8 shadow-2xl border border-zinc-200"
        >
          <div className="flex items-center justify-between border-b border-zinc-200 pb-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                <FileUp className="h-4 w-4" />
              </span>
              <div>
                <h3 className="font-extrabold text-lg text-zinc-900">AI Quality of Earnings & P&L Document Parser</h3>
                <p className="text-xs text-zinc-500">Extract Revenue, EBITDA & SDE Add-backs from PDF/Image P&Ls</p>
              </div>
            </div>

            <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700 text-sm font-bold px-2">
              ✕
            </button>
          </div>

          {!extractedDocData ? (
            <div className="space-y-6">
              <div className="rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50/50 p-8 text-center hover:border-blue-500 transition-colors cursor-pointer relative">
                <input
                  type="file"
                  accept="image/*,application/pdf,text/plain"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onFileUpload(file);
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center gap-2">
                  <FileUp className="h-10 w-10 text-blue-600" />
                  <p className="text-sm font-bold text-zinc-800">Upload Income Statement, P&L, or Tax Return</p>
                  <p className="text-xs text-zinc-500">Supports PDF, PNG, JPG, or TXT documents</p>
                </div>
              </div>

              {isParsing && (
                <div className="flex items-center justify-center gap-3 py-4 text-xs font-semibold text-blue-700">
                  <Sparkles className="h-4 w-4 animate-spin" />
                  Analyzing document OCR structure with Gemini 2.5...
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4 bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                <div>
                  <p className="text-[10px] uppercase font-bold text-zinc-400">Extracted Revenue</p>
                  <p className="text-base font-extrabold text-zinc-900">${(extractedDocData.revenue || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-zinc-400">Extracted EBITDA</p>
                  <p className="text-base font-extrabold text-emerald-600">${(extractedDocData.ebitda || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-zinc-400">Margin</p>
                  <p className="text-base font-extrabold text-zinc-900">{(extractedDocData.profitMargin || 0).toFixed(1)}%</p>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Identified SDE Add-backs</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {extractedDocData.suggestedAddBacks?.map((ab, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-white border border-zinc-200 rounded-lg text-xs">
                      <span className="font-semibold text-zinc-800">{ab.name}</span>
                      <span className="font-bold text-emerald-600">+${ab.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2" onClick={onApplyExtracted}>
                  <CheckCircle2 className="h-4 w-4" />
                  Apply Financials & Add-backs to Lead Model
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
