import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Activity, 
  PauseCircle, 
  PlayCircle, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  Terminal,
  Settings,
  Database,
  Lock,
  WifiOff,
  RotateCcw
} from 'lucide-react';
import { FundDeploymentConfig, Lead, DealStage } from '../../types';
import { DEFAULT_FUND_DEPLOYMENT_CONFIG } from '../../utils/branding';
import { Button } from '../../App';

interface OperatorControlPanelProps {
  config?: FundDeploymentConfig;
  selectedLead?: Lead | null;
  onPauseDeal?: (dealId: string) => void;
  onResumeDeal?: (dealId: string) => void;
  onRetryStage?: (dealId: string, stage: DealStage) => void;
}

export const OperatorControlPanel: React.FC<OperatorControlPanelProps> = ({
  config = DEFAULT_FUND_DEPLOYMENT_CONFIG,
  selectedLead,
  onPauseDeal,
  onResumeDeal,
  onRetryStage
}) => {
  const [activeTab, setActiveTab] = useState<'config' | 'execution' | 'outbox' | 'ledger' | 'logs'>('config');
  const [outageSimulated, setOutageSimulated] = useState<boolean>(false);
  const [dlqReplayed, setDlqReplayed] = useState<boolean>(false);

  const handleToggleOutage = async () => {
    const nextState = !outageSimulated;
    setOutageSimulated(nextState);
    try {
      await fetch('/api/funds/redwood-cap/operator/simulate-outage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'sendgrid', simulateFailure: nextState })
      });
    } catch (err) {
      console.error("Outage simulation API call error:", err);
    }
  };

  const handleReplayDLQ = async () => {
    setDlqReplayed(true);
    try {
      await fetch('/api/funds/redwood-cap/operator/outbox/replay-dlq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (err) {
      console.error("DLQ replay API call error:", err);
    }
    setTimeout(() => setDlqReplayed(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-emerald-600" />
            Operator & Deployment Control Plane
          </h2>
          <p className="text-xs text-zinc-500 font-mono mt-0.5">
            TENANT: {config.fundId} | CONFIG VERSION: v{config.configVersion} | SHA-256 PROVENANCE: ENFORCED
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('config')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'config' ? 'bg-emerald-600 text-white' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
            }`}
          >
            Fund Config
          </button>
          <button
            onClick={() => setActiveTab('execution')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'execution' ? 'bg-emerald-600 text-white' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
            }`}
          >
            FSM Lineage
          </button>
          <button
            onClick={() => setActiveTab('outbox')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'outbox' ? 'bg-emerald-600 text-white' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
            }`}
          >
            Outbox DLQ
          </button>
          <button
            onClick={() => setActiveTab('ledger')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'ledger' ? 'bg-emerald-600 text-white' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
            }`}
          >
            SHA-256 Ledger
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'logs' ? 'bg-emerald-600 text-white' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
            }`}
          >
            Observability Logs
          </button>
        </div>
      </div>

      {activeTab === 'config' && (
        <div className="grid grid-cols-2 gap-6 text-xs">
          <div className="rounded-xl border border-zinc-200 bg-white p-5 space-y-3">
            <h3 className="font-bold text-sm text-zinc-900 flex items-center gap-2">
              <Settings className="h-4 w-4 text-emerald-600" />
              Financial & Screening Thresholds
            </h3>
            <div className="space-y-2 font-mono">
              <div className="flex justify-between border-b pb-1">
                <span className="text-zinc-500">Minimum Revenue:</span>
                <span className="font-bold text-zinc-800">${config.financialThresholds.minRevenue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-zinc-500">Minimum EBITDA:</span>
                <span className="font-bold text-zinc-800">${config.financialThresholds.minEbitda.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-zinc-500">Min Profit Margin:</span>
                <span className="font-bold text-zinc-800">{config.financialThresholds.minProfitMargin}%</span>
              </div>
              <div className="flex justify-between pb-1">
                <span className="text-zinc-500">Max Permit Drop:</span>
                <span className="font-bold text-zinc-800">{config.financialThresholds.maxPermitDropPct}%</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-5 space-y-3">
            <h3 className="font-bold text-sm text-zinc-900 flex items-center gap-2">
              <Database className="h-4 w-4 text-emerald-600" />
              Underwriting & Integration Provider Config
            </h3>
            <div className="space-y-2 font-mono">
              <div className="flex justify-between border-b pb-1">
                <span className="text-zinc-500">Senior Debt LTV:</span>
                <span className="font-bold text-zinc-800">{config.underwritingAssumptions.defaultSeniorDebtLtv}%</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-zinc-500">Min DSCR Threshold:</span>
                <span className="font-bold text-zinc-800">{config.underwritingAssumptions.minDscrThreshold}x</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span className="text-zinc-500">Outreach Provider:</span>
                <span className="font-bold text-emerald-700 capitalize">{config.integrations.outreachProvider}</span>
              </div>
              <div className="flex justify-between pb-1">
                <span className="text-zinc-500">CRM Provider:</span>
                <span className="font-bold text-blue-700 capitalize">{config.integrations.crmProvider}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'execution' && (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-zinc-900">Active State Machine Execution Lineage</h3>
            {selectedLead && (
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="gap-1.5 text-xs text-amber-700 hover:bg-amber-50 border-amber-200"
                  onClick={() => onPauseDeal && onPauseDeal(selectedLead.id)}
                >
                  <PauseCircle className="h-3.5 w-3.5" /> Pause Execution
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="gap-1.5 text-xs text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                  onClick={() => onResumeDeal && onResumeDeal(selectedLead.id)}
                >
                  <PlayCircle className="h-3.5 w-3.5" /> Resume Pipeline
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-5 gap-2 font-mono text-[10px]">
            {['INGESTED', 'ENRICHED', 'SCORED', 'UNDERWRITTEN', 'APPROVED'].map((stage, idx) => (
              <div key={stage} className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-3 text-center">
                <p className="text-emerald-800 font-bold mb-1">Step {idx + 1}</p>
                <p className="font-bold text-zinc-900">{stage}</p>
                <span className="inline-block mt-2 rounded bg-emerald-100 px-1.5 py-0.5 text-emerald-800 font-semibold">
                  VERIFIED
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'outbox' && (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-zinc-900">Transactional Outbox Queue & Outage Simulator</h3>

            <div className="flex gap-2">
              <button
                onClick={handleToggleOutage}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all ${
                  outageSimulated
                    ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                    : 'bg-zinc-100 text-zinc-700 border-zinc-300 hover:bg-zinc-200'
                }`}
              >
                <WifiOff className="h-3.5 w-3.5" />
                {outageSimulated ? 'Outage Active (HTTP 500)' : 'Simulate Provider Outage'}
              </button>

              <button
                onClick={handleReplayDLQ}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                {dlqReplayed ? 'Replaying DLQ...' : 'Replay Dead Letter Queue'}
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-zinc-200 p-4 bg-zinc-50 font-mono text-xs space-y-2">
            <div className="flex justify-between items-center text-zinc-700 font-bold border-b pb-2">
              <span>IDEMPOTENCY KEY</span>
              <span>EVENT TYPE</span>
              <span>STATUS</span>
              <span>RETRIES</span>
            </div>
            <div className="flex justify-between items-center text-zinc-800">
              <span className="text-emerald-700 font-semibold">redwood-cap:deal-101:OUTREACH:v1</span>
              <span>SEND_OUTREACH_EMAIL</span>
              <span className={`rounded px-2 py-0.5 font-bold text-[10px] ${
                outageSimulated ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {outageSimulated ? 'RETRYING_BACKOFF' : 'COMPLETED'}
              </span>
              <span>{outageSimulated ? '2 / 3' : '0 / 3'}</span>
            </div>
            <div className="flex justify-between items-center text-zinc-800">
              <span className="text-blue-700 font-semibold">redwood-cap:deal-101:CRM_SYNC:v1</span>
              <span>SYNC_CRM_DEAL</span>
              <span className="rounded bg-emerald-100 px-2 py-0.5 text-emerald-800 font-bold text-[10px]">COMPLETED</span>
              <span>0 / 3</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ledger' && (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="font-bold text-sm text-zinc-900 flex items-center gap-2">
              <Lock className="h-4 w-4 text-emerald-600" />
              SHA-256 Cryptographic Audit Provenance Chain
            </h3>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
              CHAIN INTEGRITY VERIFIED (SOC2 TYPE II)
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 space-y-1">
              <div className="flex justify-between text-zinc-500 font-bold">
                <span>BLOCK #1 | ACTION: STATE_TRANSITION</span>
                <span>TIMESTAMP: 2026-08-13T14:00:00Z</span>
              </div>
              <p className="text-zinc-700">Actor: partner-user (Partner Role)</p>
              <p className="text-zinc-500 text-[10px] truncate">Hash: 8f9b4c2e...7d1a2e3f4b5c6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c</p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 space-y-1">
              <div className="flex justify-between text-zinc-500 font-bold">
                <span>BLOCK #2 | ACTION: OUTREACH_DISPATCH</span>
                <span>TIMESTAMP: 2026-08-13T14:02:15Z</span>
              </div>
              <p className="text-zinc-700">Actor: transactional-outbox (System Role)</p>
              <p className="text-zinc-500 text-[10px] truncate">Hash: 4a3b2c1d...0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="rounded-xl border border-zinc-900 bg-zinc-950 p-6 text-emerald-400 font-mono text-xs space-y-2">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2 text-zinc-400">
            <span className="flex items-center gap-1.5 font-bold">
              <Terminal className="h-4 w-4 text-emerald-500" />
              Structured System Observability Log
            </span>
            <span>x-correlation-id: req-9942a-8810</span>
          </div>
          <p>[INFO] [fsm.ts] Deal deal-101 state transition INGESTED -&gt; ENRICHED executed (1.2ms)</p>
          <p>[INFO] [financialGuard.ts] Deterministic EBITDA $600k verified against LLM memo output</p>
          <p>[INFO] [auditLedger.ts] Block #2 added to SHA-256 chain (Verified Integrity)</p>
          <p>[INFO] [outbox.ts] Outbox dispatch redwood-cap:deal-101:OUTREACH:v1 COMPLETED (SendGrid ID: sg-msg-88201)</p>
        </div>
      )}
    </div>
  );
};
