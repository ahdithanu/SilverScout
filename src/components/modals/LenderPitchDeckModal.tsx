import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Printer, TrendingUp, Award, DollarSign, Building2, CheckCircle2 } from 'lucide-react';
import { Lead } from '../../types';
import { Button, Card, Badge } from '../../App';
import { getIndustryBenchmark, calculateLeadPercentiles } from '../../utils/benchmarks';
import { calculateLBOMetrics } from '../../utils/lboMath';

interface LenderPitchDeckModalProps {
  lead: Lead | null;
  onClose: () => void;
}

export const LenderPitchDeckModal: React.FC<LenderPitchDeckModalProps> = ({ lead, onClose }) => {
  if (!lead) return null;

  const benchmark = getIndustryBenchmark(lead.industry);
  const percentiles = calculateLeadPercentiles(lead);

  const val = lead.valuationEstimate || 3500000;
  const lbo = calculateLBOMetrics({
    purchasePrice: val,
    seniorDebtPercent: 60,
    interestRate: 8,
    holdYears: 5,
    exitMultiple: 5.5,
    revenueGrowth: 5,
    ebitda: lead.ebitda || Math.round(val * 0.2),
    addBacksTotal: 150000
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto print:p-0 print:bg-white print:static" role="dialog" aria-modal="true" aria-label="LP & Lender Executive Deal Memo">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full max-w-4xl rounded-2xl bg-white p-8 shadow-2xl border border-zinc-200 my-8 print:shadow-none print:border-none print:max-w-none print:p-0 print:my-0 space-y-6"
        >
          {/* Header Actions (Hidden when printing) */}
          <div className="flex items-center justify-between border-b border-zinc-200 pb-4 print:hidden">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <div>
                <h3 className="font-extrabold text-lg text-zinc-900">LP & Senior Lender Executive Presentation Memo</h3>
                <p className="text-xs text-zinc-500">Confidential Debt Underwriting & LP Investment Brief • {lead.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => window.print()}>
                <Printer className="h-3.5 w-3.5" />
                Print Executive Memo (PDF)
              </Button>
              <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700 font-bold px-2 text-sm">
                ✕
              </button>
            </div>
          </div>

          {/* Deal Overview Banner */}
          <div className="rounded-xl bg-zinc-900 text-white p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-400">{lead.industry}</span>
                <span className="text-xs text-zinc-400">• {lead.location}</span>
              </div>
              <h2 className="text-2xl font-black text-white mt-1">{lead.name}</h2>
              <p className="text-xs text-zinc-400 mt-0.5">Primary Contact: {lead.agentName || 'Business Owner'} • Reg Year: {new Date(lead.registrationDate).getFullYear()}</p>
            </div>

            <div className="flex items-center gap-4 text-right">
              <div>
                <p className="text-[10px] uppercase font-bold text-zinc-400">Enterprise Value</p>
                <p className="text-2xl font-black text-white">${val.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-zinc-400">Deal Health Score</p>
                <p className="text-2xl font-black text-emerald-400">{percentiles.overallHealthScore} / 100</p>
              </div>
            </div>
          </div>

          {/* Percentile Ranking Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 bg-emerald-50/50 border-emerald-200">
              <p className="text-[10px] uppercase font-bold text-emerald-800">EBITDA Margin Percentile</p>
              <p className="text-xl font-extrabold text-emerald-900 mt-1">{percentiles.marginPercentile}th Percentile</p>
              <p className="text-[10px] text-emerald-700 mt-0.5">
                {percentiles.isOutperformingMargin ? 'Outperforming' : 'Lagging'} sector baseline of {benchmark.avgProfitMargin}%
              </p>
            </Card>

            <Card className="p-4 bg-blue-50/50 border-blue-200">
              <p className="text-[10px] uppercase font-bold text-blue-800">Exit Propensity Score</p>
              <p className="text-xl font-extrabold text-blue-900 mt-1">{lead.exitPropensityScore} / 10 ({percentiles.propensityPercentile}th %ile)</p>
              <p className="text-[10px] text-blue-700 mt-0.5">Permit Volume Drop: {lead.permitDrop}% in 2026</p>
            </Card>

            <Card className="p-4 bg-amber-50/50 border-amber-200">
              <p className="text-[10px] uppercase font-bold text-amber-800">Year 1 DSCR Coverage</p>
              <p className="text-xl font-extrabold text-amber-900 mt-1">{lbo.dscrYear1}x DSCR</p>
              <p className="text-[10px] text-amber-700 mt-0.5">Senior Debt LTV: 60% (${lbo.seniorDebtAmount.toLocaleString()})</p>
            </Card>
          </div>

          {/* LBO Returns & Debt Tranches Table */}
          <div className="border border-zinc-200 rounded-xl overflow-hidden">
            <div className="bg-zinc-50 px-4 py-2 border-b border-zinc-200 flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700">Lender & LP Returns Underwriting</h4>
              <span className="text-xs font-extrabold text-emerald-700">Projected 5-Yr IRR: {lbo.irr}%</span>
            </div>
            <table className="w-full text-xs text-left">
              <thead className="bg-zinc-100/50 text-zinc-500 font-bold uppercase text-[9px]">
                <tr>
                  <th className="p-3">Financial Metric</th>
                  <th className="p-3">Target Value</th>
                  <th className="p-3">Industry Baseline ({benchmark.industry})</th>
                  <th className="p-3">Variance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-medium text-zinc-800">
                <tr>
                  <td className="p-3">Adjusted EBITDA (w/ SDE Add-backs)</td>
                  <td className="p-3 font-bold">${lbo.adjustedEbitda.toLocaleString()}</td>
                  <td className="p-3 text-zinc-500">Sector Avg: ${Math.round(val * 0.18).toLocaleString()}</td>
                  <td className="p-3 font-bold text-emerald-600">Above Average</td>
                </tr>
                <tr>
                  <td className="p-3">Senior Debt Tranche (SBA 7a / Direct)</td>
                  <td className="p-3 font-bold text-blue-600">${lbo.seniorDebtAmount.toLocaleString()}</td>
                  <td className="p-3 text-zinc-500">60% LTV Threshold</td>
                  <td className="p-3 text-zinc-700">Fully Covered</td>
                </tr>
                <tr>
                  <td className="p-3">Sponsor Equity Requirement</td>
                  <td className="p-3 font-bold text-emerald-600">${lbo.sponsorEquity.toLocaleString()}</td>
                  <td className="p-3 text-zinc-500">40% Sponsor Check</td>
                  <td className="p-3 font-bold text-amber-600">{lbo.moic}x MOIC</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* AI Acquisition Thesis Summary */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700">Underwriting & Acquisition Thesis</h4>
            <p className="text-xs text-zinc-800 leading-relaxed font-mono">{lead.aiThesis}</p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
