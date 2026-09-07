import React, { useState } from 'react';
import { 
  X, 
  Phone, 
  Mail, 
  MapPin, 
  Send, 
  Linkedin, 
  MessageSquare, 
  Calendar, 
  User, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Building2,
  Sparkles
} from 'lucide-react';
import { Lead, OutreachChannel, OutreachOutcome, ActivityLog } from '../../types';

interface LogTouchpointModalProps {
  isOpen: boolean;
  lead: Lead;
  userName: string;
  userId: string;
  onClose: () => void;
  onSaveTouchpoint: (touchpoint: Partial<ActivityLog>, shouldAdvanceStage: boolean) => Promise<void> | void;
}

const CHANNELS: { id: OutreachChannel; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'phone_call', label: 'Phone Call', icon: Phone },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'in_person_visit', label: 'Site Visit', icon: MapPin },
  { id: 'direct_mail', label: 'Direct Mail', icon: Send },
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { id: 'other', label: 'Other', icon: MessageSquare }
];

const OUTCOMES: { id: OutreachOutcome; label: string; badgeColor: string }[] = [
  { id: 'spoke_with_owner', label: 'Spoke with Owner', badgeColor: 'border-emerald-500 bg-emerald-50 text-emerald-800' },
  { id: 'scheduled_call', label: 'Meeting / Call Scheduled', badgeColor: 'border-blue-500 bg-blue-50 text-blue-800' },
  { id: 'replied_interested', label: 'Replied Interested', badgeColor: 'border-teal-500 bg-teal-50 text-teal-800' },
  { id: 'sent_teaser', label: 'Sent Deal Teaser / NDA', badgeColor: 'border-indigo-500 bg-indigo-50 text-indigo-800' },
  { id: 'left_voicemail', label: 'Left Voicemail', badgeColor: 'border-amber-500 bg-amber-50 text-amber-800' },
  { id: 'gatekeeper_blocked', label: 'Gatekeeper Blocked', badgeColor: 'border-orange-500 bg-orange-50 text-orange-800' },
  { id: 'in_person_meeting', label: 'Site Visit Completed', badgeColor: 'border-purple-500 bg-purple-50 text-purple-800' },
  { id: 'follow_up_required', label: 'Follow-Up Required', badgeColor: 'border-cyan-500 bg-cyan-50 text-cyan-800' },
  { id: 'not_interested', label: 'Not Selling / Pass', badgeColor: 'border-rose-500 bg-rose-50 text-rose-800' }
];

const QUICK_SNIPPETS = [
  'Spoke with founder; open to discussing recapitalization and exit options.',
  'Left voicemail and followed up with introduction email.',
  'Gatekeeper requested investment overview and acquisition criteria by email.',
  'Discussed permit volume trends; founder confirmed retirement timeline within 1-2 years.',
  'Conducted in-person facility tour and met with primary operations manager.'
];

export const LogTouchpointModal: React.FC<LogTouchpointModalProps> = ({
  isOpen,
  lead,
  userName,
  userId,
  onClose,
  onSaveTouchpoint
}) => {
  const defaultContact = lead.agentName && !lead.isCorporateAgent 
    ? lead.agentName 
    : (lead.businessProfile?.ownerTitle ? `Owner / Principal` : 'Business Owner');

  const [channel, setChannel] = useState<OutreachChannel>('phone_call');
  const [outcome, setOutcome] = useState<OutreachOutcome>('spoke_with_owner');
  const [contactPerson, setContactPerson] = useState<string>(defaultContact);
  const [notes, setNotes] = useState<string>('');
  const [followUpDate, setFollowUpDate] = useState<string>('');
  const [shouldAdvanceStage, setShouldAdvanceStage] = useState<boolean>(lead.status === 'new');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleQuickSnippet = (snippet: string) => {
    setNotes(prev => prev ? `${prev} ${snippet}` : snippet);
  };

  const handleSetQuickFollowUp = (daysAhead: number) => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysAhead);
    setFollowUpDate(targetDate.toISOString().split('T')[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const selectedOutcomeObj = OUTCOMES.find(o => o.id === outcome);
      const outcomeLabel = selectedOutcomeObj ? selectedOutcomeObj.label : outcome;
      const selectedChannelObj = CHANNELS.find(c => c.id === channel);
      const channelLabel = selectedChannelObj ? selectedChannelObj.label : channel;

      const newLog: Partial<ActivityLog> = {
        id: `activity_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toISOString(),
        userId,
        userName,
        action: `Outreach: ${channelLabel} (${outcomeLabel})`,
        details: notes || `Logged ${channelLabel} touchpoint with ${contactPerson || 'prospect'}.`,
        channel,
        outcome,
        notes,
        followUpDate: followUpDate || undefined,
        contactPerson: contactPerson || undefined
      };

      await onSaveTouchpoint(newLog, shouldAdvanceStage);
      onClose();
    } catch (err) {
      console.error('Failed to save touchpoint:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-zinc-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 bg-linear-to-r from-zinc-50 to-white px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
              <Phone className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900">
                Log Outreach Touchpoint
              </h3>
              <p className="text-xs text-zinc-500">
                {lead.name} • {lead.location} ({lead.industry})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Channel Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-2">
              1. Outreach Channel
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {CHANNELS.map(c => {
                const Icon = c.icon;
                const isSelected = channel === c.id;
                return (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => setChannel(c.id)}
                    className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-2.5 text-xs font-semibold transition-all ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/80 text-emerald-900 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isSelected ? 'text-emerald-600' : 'text-zinc-400'}`} />
                    <span className="text-[11px] leading-tight text-center">{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Outcome Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-2">
              2. Touchpoint Outcome
            </label>
            <div className="flex flex-wrap gap-2">
              {OUTCOMES.map(o => {
                const isSelected = outcome === o.id;
                return (
                  <button
                    type="button"
                    key={o.id}
                    onClick={() => setOutcome(o.id)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                      isSelected
                        ? `${o.badgeColor} ring-2 ring-emerald-400/30 shadow-xs scale-102`
                        : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 hover:border-zinc-300'
                    }`}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Contact Person */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1.5">
                Contact Person / Title
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="e.g. John Doe (Owner / CEO)"
                  className="w-full rounded-xl border border-zinc-200 pl-9 pr-3 py-2 text-xs font-medium text-zinc-800 placeholder-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            {/* Next Follow-Up Date */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1.5">
                Schedule Follow-Up Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 pl-9 pr-3 py-2 text-xs font-medium text-zinc-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              {/* Quick Date Presets */}
              <div className="flex gap-1.5 mt-1.5">
                <button
                  type="button"
                  onClick={() => handleSetQuickFollowUp(2)}
                  className="text-[10px] font-semibold text-zinc-500 hover:text-emerald-700 bg-zinc-100 px-2 py-0.5 rounded"
                >
                  +2 Days
                </button>
                <button
                  type="button"
                  onClick={() => handleSetQuickFollowUp(7)}
                  className="text-[10px] font-semibold text-zinc-500 hover:text-emerald-700 bg-zinc-100 px-2 py-0.5 rounded"
                >
                  +1 Week
                </button>
                <button
                  type="button"
                  onClick={() => handleSetQuickFollowUp(14)}
                  className="text-[10px] font-semibold text-zinc-500 hover:text-emerald-700 bg-zinc-100 px-2 py-0.5 rounded"
                >
                  +2 Weeks
                </button>
                <button
                  type="button"
                  onClick={() => handleSetQuickFollowUp(30)}
                  className="text-[10px] font-semibold text-zinc-500 hover:text-emerald-700 bg-zinc-100 px-2 py-0.5 rounded"
                >
                  +1 Month
                </button>
              </div>
            </div>
          </div>

          {/* Notes & Quick Presets */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                Call / Touchpoint Notes
              </label>
              <span className="text-[10px] text-zinc-400">Click presets below to autofill</span>
            </div>

            {/* Quick Snippet Chips */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {QUICK_SNIPPETS.map((snippet, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => handleQuickSnippet(snippet)}
                  className="text-[10px] font-medium text-zinc-600 hover:text-emerald-800 bg-zinc-100 hover:bg-emerald-50 border border-zinc-200 hover:border-emerald-200 px-2 py-1 rounded-lg transition-colors text-left"
                >
                  + {snippet.slice(0, 42)}...
                </button>
              ))}
            </div>

            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter specific conversation notes, owner retirement plans, operational observations, or next action items..."
              className="w-full rounded-xl border border-zinc-200 p-3 text-xs text-zinc-800 placeholder-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {/* Pipeline Stage Advancement */}
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Sparkles className="h-4 w-4 text-emerald-600" />
              <div>
                <p className="text-xs font-bold text-emerald-900">
                  Advance Deal Pipeline Stage
                </p>
                <p className="text-[10px] text-emerald-700">
                  Update status from <span className="font-semibold">{lead.status}</span> to <span className="font-semibold">outreach_triggered</span>
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={shouldAdvanceStage}
                onChange={(e) => setShouldAdvanceStage(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-zinc-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? (
                <span>Saving...</span>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Save Outreach Touchpoint</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
