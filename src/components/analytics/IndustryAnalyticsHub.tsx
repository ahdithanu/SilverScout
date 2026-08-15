import React, { useMemo } from 'react';
import { BarChart3, TrendingUp, ShieldAlert, Award, Layers, Sparkles } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar,
  Legend
} from 'recharts';
import { Lead } from '../../types';
import { Card, Badge } from '../../App';
import { TRADE_BENCHMARKS, getIndustryBenchmark, calculateLeadPercentiles } from '../../utils/benchmarks';

interface IndustryAnalyticsHubProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
}

export const IndustryAnalyticsHub: React.FC<IndustryAnalyticsHubProps> = ({ leads, onSelectLead }) => {
  // Aggregate stats per trade sector
  const sectorComparisonData = useMemo(() => {
    return Object.values(TRADE_BENCHMARKS).map(bm => {
      const sectorLeads = leads.filter(l => l.industry.toLowerCase().includes(bm.industry.toLowerCase()));
      const targetCount = sectorLeads.length;
      const avgPropensity = targetCount > 0
        ? Number((sectorLeads.reduce((acc, l) => acc + (l.exitPropensityScore || 0), 0) / targetCount).toFixed(1))
        : bm.avgPropensityScore;

      return {
        trade: bm.industry,
        benchmarkMargin: bm.avgProfitMargin,
        benchmarkMultiple: bm.avgEvEbitdaMultiple,
        targetCount,
        avgPropensity
      };
    });
  }, [leads]);

  // Radar chart metrics comparing fund pipeline average vs industry benchmarks
  const radarData = useMemo(() => {
    const totalLeads = leads.length || 1;
    const avgMargin = leads.reduce((acc, l) => acc + (l.profitMargin || 20), 0) / totalLeads;
    const avgPropensity = (leads.reduce((acc, l) => acc + (l.exitPropensityScore || 5), 0) / totalLeads) * 10;
    const avgPermitDrop = leads.reduce((acc, l) => acc + (l.permitDrop || 20), 0) / totalLeads;

    return [
      { metric: 'EBITDA Margin', Pipeline: Math.round(avgMargin * 4), Benchmark: 80 },
      { metric: 'Propensity Score', Pipeline: Math.round(avgPropensity), Benchmark: 70 },
      { metric: 'Permit Drop Risk', Pipeline: Math.round(avgPermitDrop * 2), Benchmark: 50 },
      { metric: 'Valuation Multiple', Pipeline: 75, Benchmark: 65 },
      { metric: 'Off-Market Fit', Pipeline: 88, Benchmark: 60 }
    ];
  }, [leads]);

  // Outperforming leads leaderboard
  const topRankedLeads = useMemo(() => {
    return leads
      .map(lead => ({
        lead,
        percentiles: calculateLeadPercentiles(lead)
      }))
      .sort((a, b) => b.percentiles.overallHealthScore - a.percentiles.overallHealthScore)
      .slice(0, 5);
  }, [leads]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
        <div>
          <h3 className="text-xl font-bold text-zinc-900">Macro Industry Benchmarking & Sector Analytics</h3>
          <p className="text-xs text-zinc-500">Cross-Trade Sector Performance Metrics, EBITDA Margin Distributions, & Percentile Leaderboards</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-xl text-xs font-bold">
          <Award className="h-4 w-4" />
          <span>{leads.length} Sourced Deal Targets Analyzed</span>
        </div>
      </div>

      {/* Sector Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {Object.values(TRADE_BENCHMARKS).slice(0, 4).map(bm => (
          <Card key={bm.industry} className="p-4 space-y-2 border-l-4 border-l-emerald-500">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase text-zinc-800">{bm.industry}</span>
              <span className="text-[10px] font-bold text-zinc-400">{bm.sampleCount} Market Sample</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div>
                <p className="text-[9px] uppercase text-zinc-400">Avg Margin</p>
                <p className="font-extrabold text-zinc-900">{bm.avgProfitMargin}%</p>
              </div>
              <div>
                <p className="text-[9px] uppercase text-zinc-400">Avg EV/EBITDA</p>
                <p className="font-extrabold text-emerald-600">{bm.avgEvEbitdaMultiple}x</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-emerald-600" />
            Trade Sector Margin & Propensity Comparison
          </h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sectorComparisonData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="trade" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Bar dataKey="benchmarkMargin" name="Benchmark Margin %" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="avgPropensity" name="Pipeline Avg Propensity" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
            <Layers className="h-4 w-4 text-emerald-600" />
            Pipeline Health vs Macro Sector Baselines
          </h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart outerRadius={80} data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 9 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8 }} />
                <Radar name="Sourced Pipeline" dataKey="Pipeline" stroke="#10b981" fill="#10b981" fillOpacity={0.4} />
                <Radar name="Sector Benchmark" dataKey="Benchmark" stroke="#9ca3af" fill="#9ca3af" fillOpacity={0.2} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Top Percentile Outperformers Leaderboard */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-600" />
            Top Sourced Targets by Overall Deal Health Percentile
          </h4>
        </div>

        <div className="divide-y divide-zinc-100">
          {topRankedLeads.map(({ lead, percentiles }, rank) => (
            <div
              key={lead.id}
              onClick={() => onSelectLead(lead)}
              className="flex items-center justify-between py-3 hover:bg-zinc-50 px-2 rounded-lg transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-xs font-black">
                  #{rank + 1}
                </span>
                <div>
                  <h5 className="font-bold text-xs text-zinc-900">{lead.name}</h5>
                  <p className="text-[10px] text-zinc-500">{lead.industry} • {lead.location}</p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-[9px] uppercase font-bold text-zinc-400">Margin Percentile</p>
                  <span className="text-xs font-extrabold text-emerald-600">{percentiles.marginPercentile}th %ile</span>
                </div>
                <div className="text-right">
                  <p className="text-[9px] uppercase font-bold text-zinc-400">Exit Propensity</p>
                  <span className="text-xs font-extrabold text-blue-600">{percentiles.propensityPercentile}th %ile</span>
                </div>
                <div className="text-right min-w-20">
                  <p className="text-[9px] uppercase font-bold text-zinc-400">Deal Health Score</p>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-black bg-emerald-600 text-white">
                    {percentiles.overallHealthScore} / 100
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
