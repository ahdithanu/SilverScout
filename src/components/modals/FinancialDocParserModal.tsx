import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileUp, UploadCloud, Clock, ShieldCheck, AlertTriangle } from 'lucide-react';
import { ExtractedFinancials, auditCimWithArgon, CimAuditResponse } from '../../services/geminiService';
import { Button } from '../common/DesignSystem';

interface FinancialDocParserModalProps {
  isOpen: boolean;
  targetName?: string;
  fundId?: string;
  extractedDocData: ExtractedFinancials | null;
  setExtractedDocData: (data: ExtractedFinancials | null) => void;
  isParsingDoc: boolean;
  onParseFile: (file: File) => void;
  onApplyExtractedFinancials: () => void;
  onClose: () => void;
}

export const FinancialDocParserModal: React.FC<FinancialDocParserModalProps> = ({
  isOpen,
  targetName = 'Target Acquisition Entity',
  fundId = 'redwood-cap',
  extractedDocData,
  setExtractedDocData,
  isParsingDoc,
  onParseFile,
  onApplyExtractedFinancials,
  onClose
}) => {
  const [argonAudit, setArgonAudit] = useState<{ audit: CimAuditResponse; guardCheck: any } | null>(null);
  const [isAuditingWithArgon, setIsAuditingWithArgon] = useState(false);

  const handleRunArgonAudit = async () => {
    if (!extractedDocData) return;
    setIsAuditingWithArgon(true);
    try {
      const res = await auditCimWithArgon(
        {
          targetName,
          reportedRevenue: extractedDocData.revenue,
          reportedEbitda: extractedDocData.ebitda,
          reportedAddBacks: extractedDocData.suggestedAddBacks
        },
        fundId
      );
      setArgonAudit(res);
    } catch (err) {
      console.error('Argon QofE Audit error:', err);
    } finally {
      setIsAuditingWithArgon(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label="AI Quality of Earnings & P&L Document Parser"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative w-full max-w-2xl rounded-2xl bg-white p-8 shadow-2xl border border-zinc-200 my-8"
          >
            <div className="flex items-center justify-between border-b border-zinc-200 pb-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                  <FileUp className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="font-extrabold text-lg text-zinc-900">
                    AI Quality of Earnings & P&L Document Parser
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Extract Revenue, EBITDA & SDE Add-backs with Gemini 4 Argon Deterministic Guard
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setArgonAudit(null);
                  onClose();
                }}
                className="text-zinc-400 hover:text-zinc-700 text-sm font-bold px-2"
              >
                ✕
              </button>
            </div>

            {!extractedDocData ? (
              <div className="space-y-6">
                <div className="rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50/50 p-8 text-center hover:border-blue-500 transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept="image/*,application/pdf,text/plain"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) onParseFile(file);
                    }}
                    className="hidden"
                    id="financial-doc-upload"
                  />
                  <label htmlFor="financial-doc-upload" className="cursor-pointer space-y-3 block">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                      <UploadCloud className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-800">
                        Click or drag P&L Statement / Tax Return / CIM PDF
                      </p>
                      <p className="text-xs text-zinc-400 mt-1">
                        Supports PDF, PNG, JPG, WEBP, or TXT financial reports
                      </p>
                    </div>
                  </label>
                </div>

                {isParsingDoc && (
                  <div className="flex items-center justify-center gap-3 p-4 bg-blue-50 text-blue-700 rounded-xl text-xs font-semibold">
                    <Clock className="h-4 w-4 animate-spin" />
                    Auditing financial statement with Gemini Multimodal AI...
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
                  <span className="text-xs font-bold text-emerald-900">Multimodal Gemini Extraction Complete</span>
                  <span className="text-[10px] font-black uppercase text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">
                    {extractedDocData.confidenceScore}% Confidence
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200">
                    <span className="text-[9px] font-bold text-zinc-400 uppercase">Extracted Revenue</span>
                    <p className="text-base font-black text-zinc-900">${extractedDocData.revenue.toLocaleString()}</p>
                  </div>
                  <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200">
                    <span className="text-[9px] font-bold text-zinc-400 uppercase">Extracted EBITDA</span>
                    <p className="text-base font-black text-emerald-600">${extractedDocData.ebitda.toLocaleString()}</p>
                  </div>
                  <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200">
                    <span className="text-[9px] font-bold text-zinc-400 uppercase">Profit Margin</span>
                    <p className="text-base font-black text-zinc-900">{extractedDocData.profitMargin}%</p>
                  </div>
                </div>

                {extractedDocData.suggestedAddBacks && extractedDocData.suggestedAddBacks.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      Identified Discretionary SDE Add-Backs
                    </label>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {extractedDocData.suggestedAddBacks.map((ab, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between bg-zinc-50 p-2.5 rounded-lg text-xs border border-zinc-200"
                        >
                          <div>
                            <span className="font-bold text-zinc-800">{ab.name}</span>
                            <p className="text-[10px] text-zinc-500">{ab.rationale}</p>
                          </div>
                          <span className="font-extrabold text-emerald-600">+${ab.amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!argonAudit ? (
                  <Button
                    variant="outline"
                    className="w-full border-emerald-300 bg-emerald-50/50 text-emerald-800 hover:bg-emerald-100 font-bold text-xs gap-2"
                    onClick={handleRunArgonAudit}
                    disabled={isAuditingWithArgon}
                  >
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    {isAuditingWithArgon
                      ? 'Running Gemini 4 Argon QofE & Deterministic Multiple Guard...'
                      : 'Run Gemini 4 Argon QofE & Deterministic Multiple Guard'}
                  </Button>
                ) : (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                        <ShieldCheck className="h-4 w-4 text-emerald-600" />
                        Gemini 4 Argon QofE Audit ({argonAudit.audit.modelUsed})
                      </span>
                      <span className="rounded bg-emerald-100 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-800">
                        GUARD: {argonAudit.guardCheck?.valid ? 'VERIFIED' : 'FLAGGED'}
                      </span>
                    </div>
                    <p className="text-zinc-700 leading-relaxed">{argonAudit.audit.auditSummary}</p>
                    <div className="grid grid-cols-3 gap-2 font-mono text-center bg-white rounded-lg p-2.5 border border-emerald-100">
                      <div>
                        <span className="block text-[9px] text-zinc-400">NORMALIZED EBITDA</span>
                        <span className="font-black text-emerald-700">
                          ${argonAudit.audit.normalizedEbitda.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[9px] text-zinc-400">AUDITED MULTIPLE</span>
                        <span className="font-black text-zinc-900">{argonAudit.audit.adjustedMultiple}x</span>
                      </div>
                      <div>
                        <span className="block text-[9px] text-zinc-400">IMPLIED OFFER</span>
                        <span className="font-black text-blue-700">
                          {argonAudit.audit.dealStructure?.purchasePrice}
                        </span>
                      </div>
                    </div>
                    {argonAudit.audit.riskFlags && argonAudit.audit.riskFlags.length > 0 && (
                      <div className="space-y-1">
                        {argonAudit.audit.riskFlags.map((rf, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-[11px] text-amber-800">
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                            <span>{rf}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setArgonAudit(null);
                      setExtractedDocData(null);
                    }}
                  >
                    Upload Different File
                  </Button>
                  <Button
                    variant="primary"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold"
                    onClick={() => {
                      setArgonAudit(null);
                      onApplyExtractedFinancials();
                    }}
                  >
                    Apply Extracted Financials to Target
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
