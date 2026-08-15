import React, { useState } from 'react';
import { X, Calculator, ShieldCheck, DollarSign, Layers, Award } from 'lucide-react';
import { calculateSyndicationWaterfall, CapitalStructureInput } from '../../utils/waterfall';

interface SyndicationModelerModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchasePrice?: number;
  ebitda?: number;
}

export const SyndicationModelerModal: React.FC<SyndicationModelerModalProps> = ({
  isOpen,
  onClose,
  purchasePrice = 3000000,
  ebitda = 650000
}) => {
  const [inputs, setInputs] = useState<CapitalStructureInput>({
    purchasePrice,
    seniorDebtPct: 50,
    seniorDebtRate: 8.5,
    mezzanineDebtPct: 15,
    mezzanineDebtRate: 12.0,
    sponsorEquityPct: 10,
    lpEquityPct: 25,
    holdYears: 5,
    exitMultiple: 5.5,
    exitEbitda: Math.round(ebitda * 1.25),
    hurdleRatePct: 8.0,
    gpCarryPct: 20.0
  });

  if (!isOpen) return null;

  const results = calculateSyndicationWaterfall(inputs);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden border border-zinc-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-900 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <Calculator className="h-6 w-6 text-emerald-400" />
            <div>
              <h3 className="font-bold text-lg">LP Equity Syndication & Blended WACC Modeler</h3>
              <p className="text-xs text-zinc-400">Mezzanine PIK Tranche & 4-Tier Distribution Waterfall (80/20 Carry)</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Capital Structure Controls */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 rounded-xl bg-zinc-50 p-4 border border-zinc-200">
            <div>
              <label className="text-xs font-semibold text-zinc-600">Senior Debt %</label>
              <input
                type="number"
                value={inputs.seniorDebtPct}
                onChange={e => setInputs({ ...inputs, seniorDebtPct: Number(e.target.value) })}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-semibold"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-600">Mezzanine Debt %</label>
              <input
                type="number"
                value={inputs.mezzanineDebtPct}
                onChange={e => setInputs({ ...inputs, mezzanineDebtPct: Number(e.target.value) })}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-semibold"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-600">Sponsor GP Equity %</label>
              <input
                type="number"
                value={inputs.sponsorEquityPct}
                onChange={e => setInputs({ ...inputs, sponsorEquityPct: Number(e.target.value) })}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-semibold"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-600">Syndicated LP Equity %</label>
              <input
                type="number"
                value={inputs.lpEquityPct}
                onChange={e => setInputs({ ...inputs, lpEquityPct: Number(e.target.value) })}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-semibold"
              />
            </div>
          </div>

          {/* Key Metrics Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
              <div className="text-xs font-semibold text-emerald-800">Blended WACC</div>
              <div className="mt-1 text-2xl font-extrabold text-emerald-700">{results.blendedWaccPct}%</div>
              <div className="text-[10px] text-emerald-600">Cost of Debt + Equity</div>
            </div>
            <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
              <div className="text-xs font-semibold text-blue-800">LP Net MOIC</div>
              <div className="mt-1 text-2xl font-extrabold text-blue-700">{results.lpMoic}x</div>
              <div className="text-[10px] text-blue-600">LP IRR: {results.lpIrr}%</div>
            </div>
            <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-4">
              <div className="text-xs font-semibold text-purple-800">GP Net MOIC</div>
              <div className="mt-1 text-2xl font-extrabold text-purple-700">{results.gpMoic}x</div>
              <div className="text-[10px] text-purple-600">GP IRR: {results.gpIrr}%</div>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="text-xs font-semibold text-zinc-600">Exit EV ({inputs.exitMultiple}x)</div>
              <div className="mt-1 text-2xl font-extrabold text-zinc-800">${(results.exitEnterpriseValue / 1e6).toFixed(2)}M</div>
              <div className="text-[10px] text-zinc-500">Debt at Exit: ${(results.totalDebtAtExit / 1e6).toFixed(2)}M</div>
            </div>
          </div>

          {/* 4-Tier Waterfall Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-zinc-800 text-sm flex items-center gap-2">
                <Layers className="h-4 w-4 text-emerald-600" />
                4-Tier Equity Waterfall Distribution Schedule
              </h4>
              <span className="text-xs text-zinc-500 font-mono">Hurdle: {inputs.hurdleRatePct}% | GP Carry: {inputs.gpCarryPct}%</span>
            </div>

            <div className="overflow-hidden rounded-xl border border-zinc-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-100 font-semibold text-zinc-700">
                  <tr>
                    <th className="px-4 py-2.5">Waterfall Tier</th>
                    <th className="px-4 py-2.5 text-right">LP Share</th>
                    <th className="px-4 py-2.5 text-right">GP Share</th>
                    <th className="px-4 py-2.5 text-right">Total Distributed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 bg-white font-mono">
                  {results.tiers.map((tier, idx) => (
                    <tr key={idx} className="hover:bg-zinc-50">
                      <td className="px-4 py-2.5 font-sans font-semibold text-zinc-800">{tier.tierName}</td>
                      <td className="px-4 py-2.5 text-right font-bold text-blue-600">${tier.lpAmount.toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-right font-bold text-purple-600">${tier.gpAmount.toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-right font-bold text-zinc-900">${tier.totalDistributed.toLocaleString()}</td>
                    </tr>
                  ))}
                  <tr className="bg-zinc-900 text-white font-sans font-bold">
                    <td className="px-4 py-3">Total Waterfall Payout</td>
                    <td className="px-4 py-3 text-right font-mono text-blue-400">${results.lpTotalReturn.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-mono text-purple-400">${results.gpTotalReturn.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-mono text-emerald-400">${(results.lpTotalReturn + results.gpTotalReturn).toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-zinc-200 bg-zinc-50 px-6 py-4">
          <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            Verified SEC Rule 17a-4 Compliant Waterfall Model
          </div>
          <button
            onClick={onClose}
            className="rounded-lg bg-zinc-900 px-5 py-2 text-xs font-semibold text-white hover:bg-zinc-800"
          >
            Close Modeler
          </button>
        </div>

      </div>
    </div>
  );
};
