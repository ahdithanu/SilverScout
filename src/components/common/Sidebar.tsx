import React from 'react';
import { 
  Zap, 
  LayoutDashboard, 
  Database, 
  BrainCircuit, 
  Calculator, 
  BarChart3,
  Send, 
  Settings, 
  User as UserIcon, 
  LogOut,
  ShieldCheck,
  Activity
} from 'lucide-react';
import { UserProfile, UserRole } from '../../types';
import { cn } from '../../App';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  profile: UserProfile | null;
  logout: () => void;
  onRoleChange?: (newRole: UserRole) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  profile,
  logout
}) => {
  const currentRole = profile?.role || 'analyst';

  return (
    <aside className="flex w-64 flex-col border-r border-zinc-200 bg-white">
      <div className="flex h-16 items-center gap-3 border-b border-zinc-100 px-6">
        <Zap className="h-6 w-6 text-emerald-600" />
        <span className="font-display text-xl font-bold tracking-tight">SILVER SCOUT</span>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            activeTab === 'dashboard' ? "bg-emerald-50 text-emerald-700" : "text-zinc-600 hover:bg-zinc-50"
          )}
        >
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab('ingestion')}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            activeTab === 'ingestion' ? "bg-emerald-50 text-emerald-700" : "text-zinc-600 hover:bg-zinc-50"
          )}
        >
          <Database className="h-4 w-4" />
          Ingestion Pipeline
        </button>
        <button
          onClick={() => setActiveTab('intelligence')}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            activeTab === 'intelligence' ? "bg-emerald-50 text-emerald-700" : "text-zinc-600 hover:bg-zinc-50"
          )}
        >
          <BrainCircuit className="h-4 w-4" />
          AI Intelligence Hub
        </button>
        <button
          onClick={() => setActiveTab('lbo')}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            activeTab === 'lbo' ? "bg-emerald-50 text-emerald-700" : "text-zinc-600 hover:bg-zinc-50"
          )}
        >
          <Calculator className="h-4 w-4" />
          LBO Modeler
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            activeTab === 'analytics' ? "bg-emerald-50 text-emerald-700" : "text-zinc-600 hover:bg-zinc-50"
          )}
        >
          <BarChart3 className="h-4 w-4" />
          Industry Benchmarks
        </button>
        <button
          onClick={() => setActiveTab('outreach')}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            activeTab === 'outreach' ? "bg-emerald-50 text-emerald-700" : "text-zinc-600 hover:bg-zinc-50"
          )}
        >
          <Send className="h-4 w-4" />
          Outreach Trigger
        </button>

        <button
          onClick={() => setActiveTab('operator')}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-colors border border-emerald-200/60",
            activeTab === 'operator' ? "bg-emerald-600 text-white shadow-sm" : "bg-emerald-50/50 text-emerald-800 hover:bg-emerald-100/50"
          )}
        >
          <Activity className="h-4 w-4 text-emerald-600 group-hover:text-emerald-700" />
          Operator Control
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            activeTab === 'settings' ? "bg-emerald-50 text-emerald-700" : "text-zinc-600 hover:bg-zinc-50"
          )}
        >
          <Settings className="h-4 w-4" />
          Settings
        </button>
      </nav>

      {/* Enforced RBAC Status Indicator */}
      <div className="border-t border-zinc-100 p-4 space-y-3">
        <div className="rounded-xl bg-zinc-50 p-3 border border-zinc-200">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-700">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Authenticated Role</span>
          </div>
          <p className="mt-1 font-mono text-xs text-emerald-700 capitalize font-bold">
            {currentRole}
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-lg bg-zinc-50 p-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <UserIcon className="h-4 w-4" />
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-xs font-semibold">{profile?.displayName}</p>
            <p className="truncate text-[10px] text-zinc-500">{profile?.email}</p>
          </div>
          <button onClick={logout} className="text-zinc-400 hover:text-red-500">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
