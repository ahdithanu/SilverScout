import React from 'react';
import { Building2, MapPin, BarChart3, Calendar, Phone, Users, Star, Globe } from 'lucide-react';
import { Lead } from '../../types';
import { Card, Badge, formatStatusLabel } from '../../App';

interface LeadListViewProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
}

export const LeadListView: React.FC<LeadListViewProps> = ({ leads, onSelectLead }) => {
  return (
    <div className="grid gap-4">
      {leads.map((lead) => (
        <Card
          key={lead.id}
          onClick={() => onSelectLead(lead)}
          className={`group relative overflow-hidden transition-all hover:border-emerald-300 ${
            lead.exitPropensityScore >= 8 ? "border-emerald-200 bg-emerald-50/30" : ""
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-zinc-900">{lead.name}</h4>
                  <Badge variant={
                    lead.status === 'qualified' ? 'success' :
                    lead.status === 'archived' ? 'danger' :
                    lead.status === 'outreach_triggered' ? 'info' :
                    lead.status === 'in_loi' ? 'warning' :
                    'default'
                  }>
                    {formatStatusLabel(lead.status)}
                  </Badge>
                  {(lead.website || lead.businessProfile?.website) && (
                    <span className="text-zinc-400 hover:text-emerald-600" title="Has Verified Domain">
                      <Globe className="h-3.5 w-3.5" />
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-1 mt-1">
                  <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                    <span className="flex items-center gap-1 font-medium text-zinc-700">
                      <MapPin className="h-3 w-3 text-red-500" />
                      {lead.address || lead.businessProfile?.streetAddress || lead.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <BarChart3 className="h-3 w-3 text-zinc-400" /> {lead.industry}
                    </span>
                    {(lead.phone || lead.businessProfile?.phone) && (
                      <span className="flex items-center gap-1 font-mono text-zinc-600">
                        <Phone className="h-3 w-3 text-emerald-600" /> {lead.phone || lead.businessProfile?.phone}
                      </span>
                    )}
                    {lead.businessProfile?.employeeCount && (
                      <span className="flex items-center gap-1 text-zinc-600">
                        <Users className="h-3 w-3 text-blue-500" /> {lead.businessProfile.employeeCount} staff
                      </span>
                    )}
                    {lead.businessProfile?.googleRating && (
                      <span className="flex items-center gap-1 font-semibold text-amber-600">
                        <Star className="h-3 w-3 fill-amber-500 text-amber-500" /> {lead.businessProfile.googleRating}
                      </span>
                    )}
                    {lead.nextFollowUpDate && (
                      <span className={`flex items-center gap-1 font-semibold rounded px-1.5 py-0.5 border text-[10px] ${
                        new Date(lead.nextFollowUpDate) < new Date()
                          ? 'border-red-200 bg-red-50 text-red-700'
                          : 'border-indigo-100 bg-indigo-50 text-indigo-700'
                      }`}>
                        <Calendar className="h-3 w-3" />
                        Follow-up: {new Date(lead.nextFollowUpDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                    {lead.lastOutreachOutcome && (
                      <span className="flex items-center gap-1 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-700 font-medium capitalize">
                        {lead.lastOutreachOutcome.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Est. Enterprise Value</p>
                <p className="text-base font-extrabold text-zinc-900">${(lead.valuationEstimate || 0).toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Propensity Score</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  lead.exitPropensityScore >= 8 ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-100 text-zinc-800'
                }`}>
                  {lead.exitPropensityScore} / 10
                </span>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
