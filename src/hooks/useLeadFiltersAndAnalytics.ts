import { useMemo } from 'react';
import { Lead } from '../types';
import { getDueCadenceTasks, isCadenceStepDue } from '../utils/cadenceEngine';

export interface LeadFilterCriteria {
  leads: Lead[];
  searchQuery: string;
  minScore: number;
  maxScore: number;
  minPermitDrop: number;
  regYear: string;
  tagSearch: string;
  dashboardChannelFilter: 'all' | 'off_market' | 'on_market' | 'inbound';
  cadenceTasksDueOnly: boolean;
}

export function useLeadFiltersAndAnalytics({
  leads,
  searchQuery,
  minScore,
  maxScore,
  minPermitDrop,
  regYear,
  tagSearch,
  dashboardChannelFilter,
  cadenceTasksDueOnly
}: LeadFilterCriteria) {
  const dueCadenceTasks = useMemo(() => {
    return getDueCadenceTasks(leads);
  }, [leads]);

  const filteredLeads = useMemo(() => {
    return leads.filter(l => {
      const matchesSearch =
        l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.location.toLowerCase().includes(searchQuery.toLowerCase());

      const score = l.exitPropensityScore || 0;
      const matchesScore = score >= minScore && score <= maxScore;
      const matchesPermitDrop = (l.permitDrop || 0) >= minPermitDrop;

      const matchesYear =
        regYear === '' || (l.registrationDate && l.registrationDate.startsWith(regYear));

      const matchesTags =
        tagSearch === '' ||
        (l.tags || []).some(t => t.toLowerCase().includes(tagSearch.toLowerCase()));

      let matchesChannel = true;
      if (dashboardChannelFilter === 'off_market') {
        matchesChannel = !l.dealSourceChannel || l.dealSourceChannel === 'OFF_MARKET_SCOUT';
      } else if (dashboardChannelFilter === 'on_market') {
        matchesChannel = l.dealSourceChannel === 'ON_MARKET_LISTING';
      } else if (dashboardChannelFilter === 'inbound') {
        matchesChannel = l.dealSourceChannel === 'INBOUND_INTEREST';
      }

      const matchesCadenceDue = !cadenceTasksDueOnly || isCadenceStepDue(l);

      return (
        matchesSearch &&
        matchesScore &&
        matchesPermitDrop &&
        matchesYear &&
        matchesTags &&
        matchesChannel &&
        matchesCadenceDue
      );
    });
  }, [
    leads,
    searchQuery,
    minScore,
    maxScore,
    minPermitDrop,
    regYear,
    tagSearch,
    dashboardChannelFilter,
    cadenceTasksDueOnly
  ]);

  const stats = useMemo(() => {
    const highPropensity = leads.filter(l => (l.exitPropensityScore || 0) >= 8).length;
    const pendingOutreach = leads.filter(l => l.status === 'qualified').length;
    const totalValuation = leads.reduce((acc, l) => acc + (l.valuationEstimate || 0), 0);
    return { highPropensity, pendingOutreach, totalValuation };
  }, [leads]);

  const chartData = useMemo(() => {
    const industryMap: Record<string, number> = {};
    leads.forEach(l => {
      if (l.valuationEstimate) {
        industryMap[l.industry] = (industryMap[l.industry] || 0) + l.valuationEstimate;
      }
    });
    const valuationByIndustry = Object.entries(industryMap).map(([name, value]) => ({ name, value }));

    const statusMap: Record<string, number> = {};
    leads.forEach(l => {
      statusMap[l.status] = (statusMap[l.status] || 0) + 1;
    });
    const statusDistribution = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

    const correlationData = leads
      .filter(l => l.exitPropensityScore)
      .map(l => ({
        x: l.permitDrop,
        y: l.exitPropensityScore,
        name: l.name
      }));

    const trendMap: Record<string, Record<string, number>> = {};
    leads.forEach(l => {
      if (l.createdAt) {
        const date = new Date(l.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (!trendMap[date]) {
          trendMap[date] = { new: 0, qualified: 0, outreach_triggered: 0, archived: 0 };
        }
        trendMap[date][l.status] = (trendMap[date][l.status] || 0) + 1;
      }
    });
    const statusTrend = Object.entries(trendMap)
      .map(([date, counts]) => ({ date, ...counts }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return { valuationByIndustry, statusDistribution, correlationData, statusTrend };
  }, [leads]);

  const availableYears = useMemo(() => {
    const years = new Set<string>();
    leads.forEach(l => {
      if (l.registrationDate && typeof l.registrationDate === 'string') {
        const year = l.registrationDate.split('-')[0];
        if (year && year.length === 4) years.add(year);
      }
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [leads]);

  return {
    dueCadenceTasks,
    filteredLeads,
    stats,
    chartData,
    availableYears
  };
}
