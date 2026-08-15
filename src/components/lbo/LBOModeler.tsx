import React, { useState, useMemo } from 'react';
import { Calculator, Plus, Trash2, TrendingUp, DollarSign } from 'lucide-react';
import { Card, Button } from '../../App';
import { calculateLBOMetrics } from '../../utils/lboMath';

interface LBOModelerProps {
  selectedLeadValuation?: number;
  selectedLeadName?: string;
  selectedLeadEbitda?: number;
}

export const LBOModeler: React.FC<LBOModelerProps> = ({
  selectedLeadValuation = 3500000,
  selectedLeadName = 'Sample HVAC Enterprise',
  selectedLeadEbitda = 700000
}) => {
  const [purchasePrice, setPurchasePrice] = useState<number>(selectedLeadValuation);
  const [seniorDebtPercent, setSeniorDebtPercent] = useState<number>(60);
  const [interestRate, setInterestRate] = useState<number>(8.0);
  const [holdYears, setHoldYears] = useState<number>(5);
  const [exitMultiple, setExitMultiple] = useState<number>(5.5);
  const [revenueGrowth, setRevenueGrowth] = useState<number>(5.0);

  const [addBacksList, setAddBacksList] = useState<{ id: string; name: string; amount: number }[]>([
    { id: '1', name: "Owner Discretionary Salary", amount: 150000 },
    { id: '2', name: "Personal Automobile & Travel", amount: 25000 },
    { id: '3', name: "One-time Legal & Advisory Fees", amount: 35000 }
  ]);

  const [newAddBackName, setNewAddBackName] = useState('');
  const [newAddBackAmount, setNewAddBackAmount] = useState('');

  const addBacksTotal = useMemo(() => {
    return addBacksList.reduce((acc, curr) => acc + curr.amount, 0);
  }, [addBacksList]);

  const lboResults = useMemo(() => {
    return calculateLBOMetrics({
      purchasePrice,
      seniorDebtPercent,
      interestRate,
      holdYears,
      exitMultiple,
      revenueGrowth,
      ebitda: selectedLeadEbitda,
      addBacksTotal
    });
  }, [purchasePrice, seniorDebtPercent, interestRate, holdYears, exitMultiple, revenueGrowth, selectedLeadEbitda, addBacksTotal]);

  const handleAddAddBack = () => {
    if (!newAddBackName || !newAddBackAmount) return;
    setAddBacksList(prev => [
      ...prev,
      { id: Date.now().toString(), name: newAddBackName, amount: parseFloat(newAddBackAmount) || 0 }
    ]);
    setNewAddBackName('');
    setNewAddBackAmount('');
  };

  const handleRemoveAddBack = (id: string) => {
    setAddBacksList(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
        <div>
          <h3 className="text-xl font-bold text-zinc-900">LBO Returns Modeler & SDE Add-backs</h3>
          <p className="text-xs text-zinc-500">Leveraged Buyout Debt Tranches, Debt Service Coverage (DSCR), & MOIC / IRR Calculations for {selectedLeadName}</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 text-emerald-800 text-xs font-bold">
          <TrendingUp className="h-4 w-4" />
          <span>Projected IRR: {lboResults.irr}%</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Output Metrics Column */}
        <Card className="p-6 space-y-4 bg-zinc-900 text-white">
          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">LBO Returns Summary</h4>

          <div className="space-y-3 pt-2">
            <div>
              <p className="text-[10px] uppercase text-zinc-400">Adjusted EBITDA (w/ Add-backs)</p>
              <p className="text-xl font-extrabold text-white">${lboResults.adjustedEbitda.toLocaleString()}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[10px] uppercase text-zinc-400">Senior Debt ({seniorDebtPercent}%)</p>
                <p className="text-sm font-bold text-blue-400">${lboResults.seniorDebtAmount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-zinc-400">Sponsor Equity Check</p>
                <p className="text-sm font-bold text-emerald-400">${lboResults.sponsorEquity.toLocaleString()}</p>
              </div>
            </div>
            <div className="border-t border-zinc-800 pt-3 grid grid-cols-2 gap-2">
              <div>
                <p className="text-[10px] uppercase text-zinc-400">Exit Equity ({holdYears} yrs)</p>
                <p className="text-sm font-bold text-white">${lboResults.exitSponsorEquity.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-zinc-400">Exit MOIC Multiple</p>
                <p className="text-base font-extrabold text-amber-400">{lboResults.moic}x MOIC</p>
              </div>
            </div>
            <div className="border-t border-zinc-800 pt-3 flex items-center justify-between text-xs">
              <span className="text-zinc-400">Year 1 DSCR Coverage:</span>
              <span className={`font-bold ${lboResults.dscrYear1 >= 1.25 ? 'text-emerald-400' : 'text-red-400'}`}>
                {lboResults.dscrYear1}x
              </span>
            </div>
          </div>
        </Card>

        {/* Inputs Sliders */}
        <Card className="p-6 space-y-4 col-span-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">Deal Structure Inputs</h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Purchase Price ($)</label>
              <input
                type="number"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(parseFloat(e.target.value) || 0)}
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 px-3 text-sm font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Senior Debt LTV ({seniorDebtPercent}%)</label>
              <input
                type="range"
                min="0"
                max="80"
                value={seniorDebtPercent}
                onChange={(e) => setSeniorDebtPercent(parseFloat(e.target.value))}
                className="w-full accent-emerald-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Debt Interest Rate ({interestRate}%)</label>
              <input
                type="number"
                step="0.5"
                value={interestRate}
                onChange={(e) => setInterestRate(parseFloat(e.target.value) || 0)}
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 px-3 text-sm font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Hold Period ({holdYears} Years)</label>
              <input
                type="number"
                min="1"
                max="10"
                value={holdYears}
                onChange={(e) => setHoldYears(parseInt(e.target.value) || 1)}
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 px-3 text-sm font-semibold"
              />
            </div>
          </div>

          {/* SDE Add-backs Manager */}
          <div className="pt-4 border-t border-zinc-200">
            <div className="flex items-center justify-between mb-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-700">SDE Add-backs (${addBacksTotal.toLocaleString()})</h5>
            </div>

            <div className="flex gap-2 mb-3">
              <input
                type="text"
                placeholder="Add-back Description (e.g. Owner Personal Auto)"
                value={newAddBackName}
                onChange={(e) => setNewAddBackName(e.target.value)}
                className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 py-1.5 px-3 text-xs"
              />
              <input
                type="number"
                placeholder="Amount ($)"
                value={newAddBackAmount}
                onChange={(e) => setNewAddBackAmount(e.target.value)}
                className="w-32 rounded-lg border border-zinc-200 bg-zinc-50 py-1.5 px-3 text-xs"
              />
              <Button size="sm" onClick={handleAddAddBack} className="gap-1 text-xs">
                <Plus className="h-3.5 w-3.5" /> Add
              </Button>
            </div>

            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {addBacksList.map(ab => (
                <div key={ab.id} className="flex items-center justify-between p-2 rounded-lg bg-zinc-50 border border-zinc-200 text-xs">
                  <span className="font-semibold text-zinc-800">{ab.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-extrabold text-emerald-600">+${ab.amount.toLocaleString()}</span>
                    <button onClick={() => handleRemoveAddBack(ab.id)} className="text-zinc-400 hover:text-red-500">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
