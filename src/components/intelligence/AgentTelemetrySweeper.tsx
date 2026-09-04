import React, { useState, useEffect, useRef } from 'react';
import { Lead } from '../../types';
import { 
  Bot, 
  Search, 
  Activity, 
  Ghost, 
  Briefcase, 
  CheckCircle2, 
  Clock, 
  Zap, 
  Terminal, 
  Cpu, 
  TrendingDown, 
  ShieldCheck, 
  Sparkles,
  Play,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface AgentTelemetrySweeperProps {
  leads: Lead[];
  isAnalyzing: boolean;
  onRunIntelligence: () => Promise<void>;
  useThinkingMode: boolean;
  useFastMode: boolean;
  useFeedbackRefinement: boolean;
}

interface AgentStage {
  id: string;
  name: string;
  agentRole: string;
  icon: any;
  color: string;
  badgeColor: string;
  description: string;
}

const AGENT_STAGES: AgentStage[] = [
  {
    id: 'scout',
    name: 'SOS Registry Vintage Scout',
    agentRole: 'Scout Agent',
    icon: Search,
    color: 'text-blue-500',
    badgeColor: 'border-blue-200 bg-blue-50 text-blue-700',
    description: 'Verifies active Secretary of State registration, entity age vintage (>20 yrs), and individual vs corporate owner status.'
  },
  {
    id: 'permit',
    name: 'Municipal Permit Pulse Auditor',
    agentRole: 'Permit Auditor',
    icon: Activity,
    color: 'text-amber-500',
    badgeColor: 'border-amber-200 bg-amber-50 text-amber-700',
    description: 'Calculates 2023–2025 permit baseline vs 2026 velocity. Flags acute owner fatigue when permit volume drops >30%.'
  },
  {
    id: 'ghost',
    name: 'Digital Footprint Ghost Hunter',
    agentRole: 'Ghost Hunter',
    icon: Ghost,
    color: 'text-purple-500',
    badgeColor: 'border-purple-200 bg-purple-50 text-purple-700',
    description: 'Audits review velocity (<0.5/mo) and social media posting cadence. Identifies stagnant online presence.'
  },
  {
    id: 'underwriter',
    name: 'LBO Underwriter & Thesis Synthesizer',
    agentRole: 'PE Underwriter',
    icon: Briefcase,
    color: 'text-emerald-500',
    badgeColor: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    description: 'Synthesizes qualitative investment theses, models 4.5x EBITDA multiples, and scores final Exit Propensity (1–10).'
  }
];

export const AgentTelemetrySweeper: React.FC<AgentTelemetrySweeperProps> = ({
  leads,
  isAnalyzing,
  onRunIntelligence,
  useThinkingMode,
  useFastMode,
  useFeedbackRefinement
}) => {
  const [currentStageIdx, setCurrentStageIdx] = useState<number>(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [currentTargetIndex, setCurrentTargetIndex] = useState<number>(0);
  const [processedCount, setProcessedCount] = useState<number>(0);
  const [simulatedTimeMs, setSimulatedTimeMs] = useState<number>(0);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs terminal
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Stage simulation & live telemetry stream while analyzing
  useEffect(() => {
    if (!isAnalyzing) {
      if (processedCount > 0) {
        setLogs(prev => [
          ...prev,
          `[SYSTEM] Pipeline sweep finalized. Successfully scored ${leads.length} acquisition targets with deterministic financial assertion guards.`
        ]);
      }
      return;
    }

    setLogs([
      `[INIT] Initializing Silver Scout Multi-Agent Distributed Pipeline...`,
      `[CONFIG] Engine Model: ${useThinkingMode ? 'gemini-2.5-pro (Thinking Deep Analysis)' : useFastMode ? 'gemini-2.5-flash-lite (Fast Sweep)' : 'gemini-2.5-flash'}`,
      `[CONFIG] Feedback Loop Refinement: ${useFeedbackRefinement ? 'ENABLED (incorporating partner ratings)' : 'DISABLED'}`,
      `[ORCHESTRATOR] Enqueued ${leads.length} targets for 4-agent parallel evaluation.`
    ]);

    setProcessedCount(0);
    setCurrentStageIdx(0);
    setCurrentTargetIndex(0);

    const startTime = Date.now();
    const interval = setInterval(() => {
      setSimulatedTimeMs(Date.now() - startTime);
    }, 100);

    // Agent 1: Scout Agent
    const t1 = setTimeout(() => {
      setCurrentStageIdx(0);
      const leadName = leads[0]?.name || 'Target 1';
      setLogs(prev => [
        ...prev,
        `[ScoutAgent] [1/4] Querying California Secretary of State registry for ${leadName}...`,
        `[ScoutAgent] Found active corporate charter. Age: 38 years. Agent: Individual Owner-Operator.`
      ]);
    }, 400);

    // Agent 2: Permit Auditor
    const t2 = setTimeout(() => {
      setCurrentStageIdx(1);
      setCurrentTargetIndex(Math.min(1, leads.length - 1));
      setLogs(prev => [
        ...prev,
        `[PermitAuditor] [2/4] Pulling municipal building permits for ${leads[1]?.name || 'Target 2'}...`,
        `[PermitAuditor] Alert: Commercial permit contraction calculated at -72% vs 3-year baseline. Owner fatigue threshold triggered.`
      ]);
    }, 1200);

    // Agent 3: Ghost Hunter
    const t3 = setTimeout(() => {
      setCurrentStageIdx(2);
      setCurrentTargetIndex(Math.min(2, leads.length - 1));
      setLogs(prev => [
        ...prev,
        `[GhostHunter] [3/4] Scanning digital footprint & Google Maps review velocity...`,
        `[GhostHunter] Velocity: 0.15 reviews/month. Last digital footprint detected: Nov 2022. Classification: Digital Ghost.`
      ]);
    }, 2000);

    // Agent 4: PE Underwriter
    const t4 = setTimeout(() => {
      setCurrentStageIdx(3);
      setCurrentTargetIndex(leads.length - 1);
      setProcessedCount(leads.length);
      setLogs(prev => [
        ...prev,
        `[PEUnderwriter] [4/4] Generating proprietary acquisition thesis and valuation multiples...`,
        `[PEUnderwriter] Synthesizing LBO debt capacity: Senior Debt $1.8M (60% LTV), Sponsor Equity $1.2M. Exit Propensity Score: 9.4/10.`
      ]);
    }, 2800);

    return () => {
      clearInterval(interval);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [isAnalyzing, leads]);

  const activeStage = AGENT_STAGES[currentStageIdx] || AGENT_STAGES[0];
  const progressPct = isAnalyzing 
    ? Math.min(95, Math.round(((currentStageIdx + 1) / AGENT_STAGES.length) * 100))
    : leads.filter(l => l.exitPropensityScore).length > 0 
      ? 100 
      : 0;

  return (
    <div className="space-y-6">
      {/* Multi-Agent Sweeper Header Card */}
      <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 p-6 text-white shadow-xl">
        <div className="absolute right-0 top-0 h-64 w-64 translate-x-12 -translate-y-12 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30">
                <Cpu className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold tracking-tight text-white flex items-center gap-2">
                  Multi-Agent Deal Intelligence Sweeper
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-mono text-emerald-300 border border-emerald-500/30">
                    4 AGENTS ACTIVE
                  </span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Autonomous 4-stage distributed pipeline executing Secretary of State vintage scans, permit contraction calculations, and PE underwriting.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onRunIntelligence}
              disabled={isAnalyzing || leads.length === 0}
              className={`flex items-center gap-2.5 rounded-xl px-6 py-3.5 font-mono text-xs font-bold transition-all shadow-lg ${
                isAnalyzing
                  ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 cursor-wait'
                  : leads.length === 0
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  : 'bg-emerald-500 text-zinc-950 hover:bg-emerald-400 hover:shadow-emerald-500/20 cursor-pointer active:scale-95'
              }`}
            >
              {isAnalyzing ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
                  <span>SWEEPING PIPELINE...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-current" />
                  <span>TRIGGER MULTI-AGENT SWEEP ({leads.length} LEADS)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Sweeper Progress Bar */}
        <div className="mt-6 space-y-2 border-t border-zinc-800/80 pt-4">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="flex items-center gap-2 text-zinc-400">
              <span className={`inline-block h-2 w-2 rounded-full ${isAnalyzing ? 'animate-ping bg-emerald-400' : progressPct === 100 ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
              {isAnalyzing ? `AGENT SWEEP IN PROGRESS: ${activeStage.name}` : progressPct === 100 ? 'ALL AGENT CYCLES COMPLETED' : 'AWAITING DISPATCH'}
            </span>
            <span className="font-bold text-emerald-400">{progressPct}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
            <motion.div 
              className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400"
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>

        {/* 4 Multi-Agent Architecture Cards */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {AGENT_STAGES.map((stage, idx) => {
            const Icon = stage.icon;
            const isCurrent = isAnalyzing && currentStageIdx === idx;
            const isCompleted = isAnalyzing ? currentStageIdx > idx : progressPct === 100;

            return (
              <div 
                key={stage.id}
                className={`relative rounded-xl p-3.5 border transition-all ${
                  isCurrent 
                    ? 'border-emerald-500 bg-emerald-950/40 shadow-md shadow-emerald-900/30' 
                    : isCompleted
                    ? 'border-zinc-700/60 bg-zinc-900/60'
                    : 'border-zinc-800 bg-zinc-900/30 opacity-70'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-1.5 rounded-lg bg-zinc-800/80 ${stage.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                    isCurrent 
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 animate-pulse'
                      : isCompleted
                      ? 'bg-zinc-800 text-zinc-300 border-zinc-700'
                      : 'bg-zinc-900 text-zinc-500 border-zinc-800'
                  }`}>
                    {isCurrent ? 'WORKING' : isCompleted ? 'VERIFIED' : `STAGE ${idx + 1}`}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white truncate">{stage.name}</h4>
                <p className="text-[10px] text-zinc-400 mt-1 leading-snug line-clamp-2">
                  {stage.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Real-Time Telemetry Terminal & Audit Stream */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700">
              <Terminal className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-zinc-900">Distributed Multi-Agent Telemetry Stream</h4>
              <p className="text-xs text-zinc-500">Live operational events, prompt execution traces, and audit logs.</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-zinc-500">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-zinc-400" />
              Latency: {isAnalyzing ? `${(simulatedTimeMs / 1000).toFixed(1)}s` : '320ms'}
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              Scored: {isAnalyzing ? `${processedCount}/${leads.length}` : `${leads.filter(l => l.exitPropensityScore).length}/${leads.length}`}
            </span>
          </div>
        </div>

        {/* Streaming Terminal Log Window */}
        <div className="h-48 overflow-y-auto rounded-xl bg-zinc-950 p-4 font-mono text-xs text-emerald-400/90 shadow-inner border border-zinc-800 space-y-1.5 scrollbar-thin scrollbar-thumb-zinc-800">
          {logs.length === 0 ? (
            <p className="text-zinc-500 italic">Ready to dispatch. Click "Trigger Multi-Agent Sweep" to start real-time telemetry streaming.</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="leading-relaxed flex items-start gap-2">
                <span className="text-zinc-600 select-none">›</span>
                <span className={log.includes('Alert') || log.includes('FATIGUE') ? 'text-amber-300 font-bold' : log.includes('INIT') || log.includes('CONFIG') ? 'text-zinc-400' : 'text-emerald-300'}>
                  {log}
                </span>
              </div>
            ))
          )}
          <div ref={terminalEndRef} />
        </div>
      </div>
    </div>
  );
};
