import React from 'react';
import { Lead, DealStage, UserRole } from '../../types';
import { 
  Building2, 
  ArrowRight, 
  ShieldCheck, 
  ChevronRight, 
  CheckCircle2, 
  AlertTriangle,
  Clock,
  TrendingUp,
  Flame,
  FileText
} from 'lucide-react';

interface PipelineKanbanProps {
  leads: Lead[];
  userRole: UserRole;
  onSelectLead: (lead: Lead) => void;
  onAdvanceLeadStage: (leadId: string, currentStage: DealStage, nextStage: DealStage) => void;
}

const STAGES: { id: DealStage; label: string; color: string; bg: string }[] = [
  { id: 'INGESTED', label: '1. Ingested Targets', color: 'border-zinc-700', bg: 'bg-zinc-900/40' },
  { id: 'ENRICHED', label: '2. Enriched & Scored', color: 'border-blue-800', bg: 'bg-blue-950/20' },
  { id: 'APPROVED', label: '3. Partner Approved', color: 'border-emerald-800', bg: 'bg-emerald-950/20' },
  { id: 'LOI_DRAFTED', label: '4. LOI Outbound', color: 'border-purple-800', bg: 'bg-purple-950/20' },
  { id: 'UNDER_EXCLUSIVITY', label: '5. Under Exclusivity', color: 'border-amber-800', bg: 'bg-amber-950/20' }
];

export const PipelineKanban: React.FC<PipelineKanbanProps> = ({
  leads,
  userRole,
  onSelectLead,
  onAdvanceLeadStage
}) => {
  // Normalize lead stage
  const getLeadStage = (lead: Lead): DealStage => {
    if (lead.currentState) return lead.currentState;
    if (lead.status === 'under_contract') return 'UNDER_EXCLUSIVITY';
    if (lead.status === 'in_loi') return 'LOI_DRAFTED';
    if (lead.status === 'qualified') return 'APPROVED';
    if (lead.exitPropensityScore && lead.exitPropensityScore > 0) return 'ENRICHED';
    return 'INGESTED';
  };

  const getNextStage = (current: DealStage): DealStage | null => {
    switch (current) {
      case 'INGESTED': return 'ENRICHED';
      case 'ENRICHED': return 'APPROVED';
      case 'APPROVED': return 'LOI_DRAFTED';
      case 'LOI_DRAFTED': return 'UNDER_EXCLUSIVITY';
      default: return null;
    }
  };

  return (
    <div className="flex h-full w-full gap-4 overflow-x-auto p-4 pb-8">
      {STAGES.map((stage) => {
        const stageLeads = leads.filter(l => getLeadStage(l) === stage.id);
        const totalValuation = stageLeads.reduce((acc, l) => acc + (l.valuationEstimate || 0), 0);

        return (
          <div 
            key={stage.id}
            className={`flex w-80 flex-shrink-0 flex-col rounded-2xl border ${stage.color} ${stage.bg} p-3 shadow-xl backdrop-blur-sm`}
          >
            {/* Stage Header */}
            <div className="mb-3 flex items-center justify-between border-b border-zinc-800/80 pb-2 px-1">
              <div>
                <h3 className="text-xs font-bold text-white tracking-wide uppercase">{stage.label}</h3>
                <span className="text-[10px] text-zinc-400 font-mono">
                  ${(totalValuation / 1000000).toFixed(1)}M Pipeline
                </span>
              </div>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-800 text-[11px] font-bold text-zinc-300">
                {stageLeads.length}
              </span>
            </div>

            {/* Stage Cards Container */}
            <div className="flex-1 space-y-2.5 overflow-y-auto pr-1">
              {stageLeads.length === 0 ? (
                <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-zinc-800 text-xs text-zinc-500">
                  No deals in this stage
                </div>
              ) : (
                stageLeads.map((lead) => {
                  const currentStage = getLeadStage(lead);
                  const nextStage = getNextStage(currentStage);

                  return (
                    <div
                      key={lead.id}
                      onClick={() => onSelectLead(lead)}
                      className="group relative rounded-xl border border-zinc-800/90 bg-zinc-900/90 p-3.5 shadow-md hover:border-zinc-700 hover:bg-zinc-850 cursor-pointer transition-all space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-sm text-white group-hover:text-emerald-400 transition-colors line-clamp-1">
                          {lead.name}
                        </h4>
                        {lead.exitPropensityScore && lead.exitPropensityScore >= 8 && (
                          <span className="flex items-center gap-1 rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/20">
                            <Flame className="h-3 w-3" />
                            {lead.exitPropensityScore}/10
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-zinc-400">
                        <span className="truncate">{lead.industry}</span>
                        <span>•</span>
                        <span className="truncate">{lead.location}</span>
                      </div>

                      {/* Financials & Permit Indicators */}
                      <div className="flex items-center justify-between pt-1 text-[11px]">
                        <span className="font-mono font-bold text-emerald-400">
                          ${((lead.valuationEstimate || 3500000) / 1000000).toFixed(2)}M
                        </span>
                        {lead.permitDrop !== undefined && (
                          <span className="font-medium text-red-400">
                            -{lead.permitDrop}% permits
                          </span>
                        )}
                      </div>

                      {/* Advance Stage Action Button */}
                      {nextStage && (
                        <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
                          <span className="text-[10px] text-zinc-500 truncate">
                            Owner: {lead.agentName || 'Founder'}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onAdvanceLeadStage(lead.id, currentStage, nextStage);
                            }}
                            className="flex items-center gap-1 rounded-md bg-zinc-800 hover:bg-emerald-600 px-2 py-1 text-[10px] font-bold text-zinc-200 hover:text-white transition-colors"
                          >
                            Advance
                            <ChevronRight className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
