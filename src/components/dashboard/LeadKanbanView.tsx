import React from 'react';
import { Building2 } from 'lucide-react';
import { Lead, LeadStatus } from '../../types';
import { Card, Badge, formatStatusLabel } from '../../App';

interface LeadKanbanViewProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
  onUpdateStatus: (id: string, status: LeadStatus) => Promise<void>;
}

const KANBAN_COLUMNS: { id: LeadStatus; title: string; color: string }[] = [
  { id: 'new', title: 'New Target', color: 'border-zinc-300' },
  { id: 'qualified', title: 'Qualified', color: 'border-emerald-400' },
  { id: 'outreach_triggered', title: 'Outreach Triggered', color: 'border-blue-400' },
  { id: 'in_loi', title: 'Under LOI', color: 'border-amber-400' },
  { id: 'archived', title: 'Archived', color: 'border-red-300' }
];

export const LeadKanbanView: React.FC<LeadKanbanViewProps> = ({ leads, onSelectLead, onUpdateStatus }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
      {KANBAN_COLUMNS.map(col => {
        const colLeads = leads.filter(l => l.status === col.id);

        return (
          <div
            key={col.id}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const leadId = e.dataTransfer.getData('leadId');
              if (leadId) onUpdateStatus(leadId, col.id);
            }}
            className="flex flex-col rounded-2xl bg-zinc-100/70 p-3 min-h-[600px] border border-zinc-200"
          >
            <div className="flex items-center justify-between px-2 py-1 mb-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-700">{col.title}</span>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-200 text-[10px] font-bold text-zinc-700">
                {colLeads.length}
              </span>
            </div>

            <div className="space-y-3 flex-1">
              {colLeads.map(lead => (
                <div
                  key={lead.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('leadId', lead.id)}
                  onClick={() => onSelectLead(lead)}
                  className="cursor-pointer"
                >
                  <Card className={`p-4 hover:shadow-md transition-all border-l-4 ${col.color}`}>
                    <div className="flex items-start justify-between">
                      <h5 className="font-bold text-xs text-zinc-900 line-clamp-1">{lead.name}</h5>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                        {lead.exitPropensityScore}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-1">{lead.industry} • {lead.location}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-xs font-extrabold text-zinc-900">${(lead.valuationEstimate || 0).toLocaleString()}</p>
                      {lead.lastOutreachOutcome && (
                        <span className="text-[9px] font-bold text-zinc-600 bg-zinc-100 px-1.5 py-0.5 rounded capitalize">
                          {lead.lastOutreachOutcome.replace(/_/g, ' ')}
                        </span>
                      )}
                    </div>
                    {lead.nextFollowUpDate && (
                      <div className={`mt-2 flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold border ${
                        new Date(lead.nextFollowUpDate) < new Date()
                          ? 'border-red-200 bg-red-50 text-red-700'
                          : 'border-indigo-100 bg-indigo-50 text-indigo-700'
                      }`}>
                        <span>⏰ Follow-up: {new Date(lead.nextFollowUpDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                      </div>
                    )}
                  </Card>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
