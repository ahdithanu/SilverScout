import React, { useState } from 'react';
import { ActivityLog, OutreachChannel, OutreachOutcome } from '../../types';
import { 
  Clock, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Send, 
  Linkedin, 
  MessageSquare, 
  Calendar, 
  Plus, 
  CheckCircle2, 
  AlertCircle,
  Clock4,
  Tag
} from 'lucide-react';

interface ActivityTimelineProps {
  logs?: ActivityLog[];
  onOpenLogTouchpoint?: () => void;
}

const getChannelIcon = (channel?: OutreachChannel) => {
  switch (channel) {
    case 'phone_call':
      return <Phone className="h-3.5 w-3.5 text-emerald-600" />;
    case 'email':
      return <Mail className="h-3.5 w-3.5 text-blue-600" />;
    case 'in_person_visit':
      return <MapPin className="h-3.5 w-3.5 text-purple-600" />;
    case 'direct_mail':
      return <Send className="h-3.5 w-3.5 text-indigo-600" />;
    case 'linkedin':
      return <Linkedin className="h-3.5 w-3.5 text-[#0077b5]" />;
    default:
      return <MessageSquare className="h-3.5 w-3.5 text-zinc-500" />;
  }
};

const getOutcomeBadge = (outcome?: OutreachOutcome) => {
  switch (outcome) {
    case 'spoke_with_owner':
      return { label: 'Spoke with Owner', style: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
    case 'scheduled_call':
      return { label: 'Meeting Scheduled', style: 'bg-blue-100 text-blue-800 border-blue-300' };
    case 'replied_interested':
      return { label: 'Replied Interested', style: 'bg-teal-100 text-teal-800 border-teal-300' };
    case 'sent_teaser':
      return { label: 'Teaser / NDA Sent', style: 'bg-indigo-100 text-indigo-800 border-indigo-300' };
    case 'left_voicemail':
      return { label: 'Left Voicemail', style: 'bg-amber-100 text-amber-800 border-amber-300' };
    case 'gatekeeper_blocked':
      return { label: 'Gatekeeper Blocked', style: 'bg-orange-100 text-orange-800 border-orange-300' };
    case 'in_person_meeting':
      return { label: 'Site Visit Completed', style: 'bg-purple-100 text-purple-800 border-purple-300' };
    case 'follow_up_required':
      return { label: 'Follow-Up Needed', style: 'bg-cyan-100 text-cyan-800 border-cyan-300' };
    case 'not_interested':
      return { label: 'Not Selling', style: 'bg-rose-100 text-rose-800 border-rose-300' };
    default:
      return outcome 
        ? { label: outcome.replace(/_/g, ' '), style: 'bg-zinc-100 text-zinc-700 border-zinc-300' } 
        : null;
  }
};

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ logs = [], onOpenLogTouchpoint }) => {
  const [filter, setFilter] = useState<'all' | 'outreach' | 'audit'>('all');

  const filteredLogs = logs.filter(log => {
    if (filter === 'outreach') return !!log.channel || !!log.outcome;
    if (filter === 'audit') return !log.channel && !log.outcome;
    return true;
  });

  const outreachCount = logs.filter(l => !!l.channel || !!l.outcome).length;

  return (
    <div className="space-y-4">
      {/* Timeline Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 pb-2.5">
        <div className="flex items-center gap-2">
          <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-700">
            Outreach & Activity Timeline
          </h5>
          <span className="flex h-4.5 items-center justify-center rounded-full bg-zinc-100 px-2 text-[10px] font-bold text-zinc-600">
            {logs.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter Chips */}
          <div className="flex rounded-lg bg-zinc-100 p-0.5 text-[11px] font-semibold text-zinc-600">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`rounded-md px-2 py-0.5 transition-all ${
                filter === 'all' ? 'bg-white text-zinc-900 shadow-2xs font-bold' : 'hover:text-zinc-900'
              }`}
            >
              All ({logs.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('outreach')}
              className={`rounded-md px-2 py-0.5 transition-all ${
                filter === 'outreach' ? 'bg-white text-zinc-900 shadow-2xs font-bold' : 'hover:text-zinc-900'
              }`}
            >
              Outreach ({outreachCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter('audit')}
              className={`rounded-md px-2 py-0.5 transition-all ${
                filter === 'audit' ? 'bg-white text-zinc-900 shadow-2xs font-bold' : 'hover:text-zinc-900'
              }`}
            >
              System ({logs.length - outreachCount})
            </button>
          </div>

          {onOpenLogTouchpoint && (
            <button
              type="button"
              onClick={onOpenLogTouchpoint}
              className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white shadow-2xs hover:bg-emerald-700 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Log Touchpoint</span>
            </button>
          )}
        </div>
      </div>

      {filteredLogs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 p-6 text-center">
          <p className="text-xs text-zinc-400 italic">No activity recorded for this view.</p>
          {onOpenLogTouchpoint && (
            <button
              onClick={onOpenLogTouchpoint}
              className="mt-2 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
            >
              + Record the first outreach touchpoint
            </button>
          )}
        </div>
      ) : (
        <div className="relative border-l-2 border-zinc-200 pl-4 space-y-4">
          {filteredLogs.map((log) => {
            const isOutreach = !!log.channel || !!log.outcome;
            const outcomeBadge = getOutcomeBadge(log.outcome);
            const isFollowUpOverdue = log.followUpDate ? new Date(log.followUpDate) < new Date() : false;

            return (
              <div key={log.id} className="relative group">
                {/* Node marker */}
                <div 
                  className={`absolute -left-[22px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-white shadow-2xs ${
                    isOutreach ? 'bg-emerald-600 text-white' : 'bg-zinc-400 text-white'
                  }`}
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-white" />
                </div>

                {/* Card Container */}
                <div className={`rounded-xl border p-3.5 transition-all shadow-2xs ${
                  isOutreach 
                    ? 'border-emerald-100 bg-linear-to-b from-emerald-50/20 to-white hover:border-emerald-200' 
                    : 'border-zinc-100 bg-white hover:border-zinc-200'
                }`}>
                  {/* Top row: Action & Timestamp */}
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <div className="flex items-center gap-2">
                      {isOutreach && (
                        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-zinc-100">
                          {getChannelIcon(log.channel)}
                        </div>
                      )}
                      <span className="text-xs font-bold text-zinc-900">
                        {log.action}
                      </span>
                      {outcomeBadge && (
                        <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold ${outcomeBadge.style}`}>
                          {outcomeBadge.label}
                        </span>
                      )}
                    </div>
                    <span className="flex items-center gap-1 text-[10px] text-zinc-400 font-medium">
                      <Clock className="h-3 w-3" />
                      {new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Metadata: User & Contact Person */}
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-zinc-600">
                    <span className="flex items-center gap-1 font-medium">
                      <User className="h-3 w-3 text-zinc-400" />
                      {log.userName}
                    </span>
                    {log.contactPerson && (
                      <span className="flex items-center gap-1 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-700">
                        <Tag className="h-2.5 w-2.5 text-zinc-500" />
                        Target Contact: {log.contactPerson}
                      </span>
                    )}
                  </div>

                  {/* Notes / Details */}
                  {(log.notes || log.details) && (
                    <div className="mt-2 rounded-lg bg-zinc-50 p-2.5 text-xs text-zinc-700 border border-zinc-100">
                      <p className="whitespace-pre-line leading-relaxed">{log.notes || log.details}</p>
                    </div>
                  )}

                  {/* Follow-Up Scheduled Alert */}
                  {log.followUpDate && (
                    <div className={`mt-2 flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-semibold border ${
                      isFollowUpOverdue 
                        ? 'border-red-200 bg-red-50 text-red-800' 
                        : 'border-indigo-100 bg-indigo-50/70 text-indigo-900'
                    }`}>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-indigo-600" />
                        <span>Next Scheduled Follow-Up:</span>
                        <span className="font-bold underline">
                          {new Date(log.followUpDate).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      {isFollowUpOverdue ? (
                        <span className="text-[10px] font-bold text-red-600 uppercase tracking-wide">
                          Overdue
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wide">
                          Scheduled
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
