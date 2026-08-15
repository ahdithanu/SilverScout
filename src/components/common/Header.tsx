import React from 'react';
import { Search, Filter, Download, Zap } from 'lucide-react';
import { UserRole } from '../../types';

interface HeaderProps {
  activeTab: string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  minScore: number;
  maxScore: number;
  minPermitDrop: number;
  regYear: string;
  handleExportCSV: () => void;
  filteredLeadsCount: number;
  userRole: UserRole;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  searchQuery,
  setSearchQuery,
  showFilters,
  setShowFilters,
  minScore,
  maxScore,
  minPermitDrop,
  regYear,
  handleExportCSV,
  filteredLeadsCount,
  userRole
}) => {
  const filterBadgeCount = [minScore > 0 || maxScore < 10, minPermitDrop > 0, regYear !== ''].filter(Boolean).length;

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-zinc-200 bg-white/80 px-8 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold capitalize">{activeTab.replace('-', ' ')}</h2>
        <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-600 uppercase tracking-wider">
          Role: {userRole}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64 rounded-lg border border-zinc-200 bg-zinc-50 py-1.5 pl-10 pr-4 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <button
          className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
            showFilters ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
          }`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4" />
          Filter
          {filterBadgeCount > 0 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] text-white">
              {filterBadgeCount}
            </span>
          )}
        </button>
        <button
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
          onClick={handleExportCSV}
          disabled={filteredLeadsCount === 0}
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
        <a
          href="/silver_scout_export.zip"
          download="silver_scout_export.zip"
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
        >
          <Download className="h-4 w-4" />
          Download ZIP
        </a>
      </div>
    </header>
  );
};
