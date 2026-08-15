import React, { useState, useMemo } from 'react';
import { Send, Mail, Copy, Sparkles, Check, ShieldAlert } from 'lucide-react';
import { Lead, UserRole } from '../../types';
import { Card, Button } from '../../App';
import { canTriggerBatchOutreach } from '../../utils/rbac';

interface OutreachCenterProps {
  leads: Lead[];
  isBatchTriggering: boolean;
  onBatchTrigger: (pendingLeads: Lead[]) => Promise<void>;
  userRole: UserRole;
  onGenerateLetter: (lead: Lead, template: string) => Promise<{ subject: string; letterBody: string }>;
}

export const OutreachCenter: React.FC<OutreachCenterProps> = ({
  leads,
  isBatchTriggering,
  onBatchTrigger,
  userRole,
  onGenerateLetter
}) => {
  const [outreachFilter, setOutreachFilter] = useState<'all' | 'pending' | 'triggered'>('all');
  const [selectedOutreachLeadId, setSelectedOutreachLeadId] = useState<string | null>(null);
  const [template, setTemplate] = useState<'direct_acquisition' | 'confidential_inquiry' | 'strategic_partnership'>('direct_acquisition');
  const [generatedSubject, setGeneratedSubject] = useState('');
  const [generatedBody, setGeneratedBody] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const canTrigger = canTriggerBatchOutreach(userRole);

  const pendingLeads = useMemo(() => {
    return leads.filter(l => l.status === 'qualified' || ((l.exitPropensityScore || 0) >= 8 && l.status !== 'outreach_triggered' && l.status !== 'archived'));
  }, [leads]);

  const outreachQueue = useMemo(() => {
    return leads.filter(l => {
      if (l.status === 'archived') return false;
      if (outreachFilter === 'pending') return l.status === 'qualified' || ((l.exitPropensityScore || 0) >= 8 && l.status !== 'outreach_triggered');
      if (outreachFilter === 'triggered') return l.status === 'outreach_triggered';
      return true;
    });
  }, [leads, outreachFilter]);

  const selectedLead = useMemo(() => {
    return leads.find(l => l.id === selectedOutreachLeadId) || outreachQueue[0] || null;
  }, [leads, selectedOutreachLeadId, outreachQueue]);

  const handleGenerate = async (lead?: Lead) => {
    const target = lead || selectedLead;
    if (!target) return;
    setIsGenerating(true);
    try {
      const res = await onGenerateLetter(target, template);
      setGeneratedSubject(res.subject);
      setGeneratedBody(res.letterBody);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
        <div>
          <h3 className="text-xl font-bold text-zinc-900">Outreach Center & Cold Email Engine</h3>
          <p className="text-xs text-zinc-500">Automated Direct Mail & Email Sequences for Off-Market Business Owners</p>
        </div>

        <div className="flex items-center gap-3">
          {!canTrigger ? (
            <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-1.5 border border-amber-200 text-amber-900 text-xs font-semibold">
              <ShieldAlert className="h-4 w-4 text-amber-600" />
              <span>Associate+ required for Batch Trigger</span>
            </div>
          ) : (
            <Button
              variant="primary"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 text-xs"
              onClick={() => onBatchTrigger(pendingLeads)}
              disabled={isBatchTriggering || pendingLeads.length === 0}
            >
              <Send className="h-4 w-4" />
              Batch Trigger Outreach ({pendingLeads.length})
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Lead Selection Queue */}
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Outreach Queue ({outreachQueue.length})</h4>
            <div className="flex gap-1">
              {(['all', 'pending', 'triggered'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setOutreachFilter(f)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize ${
                    outreachFilter === f ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {outreachQueue.map(lead => (
              <div
                key={lead.id}
                onClick={() => {
                  setSelectedOutreachLeadId(lead.id);
                  handleGenerate(lead);
                }}
                className={`p-3 rounded-xl border cursor-pointer transition-all text-xs ${
                  selectedLead?.id === lead.id
                    ? 'border-emerald-500 bg-emerald-50/50 shadow-xs'
                    : 'border-zinc-200 bg-white hover:border-zinc-300'
                }`}
              >
                <div className="flex items-center justify-between font-bold text-zinc-900">
                  <span className="truncate">{lead.name}</span>
                  <span className="text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded text-[10px]">
                    {lead.exitPropensityScore}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500 mt-0.5">{lead.location} • {lead.industry}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Letter Generator & Preview */}
        {selectedLead && (
          <Card className="p-6 col-span-2 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h4 className="font-bold text-sm text-zinc-900">Personalized Acquisition Pitch • {selectedLead.name}</h4>
                <p className="text-xs text-zinc-500">Target Owner: {selectedLead.agentName || 'Business Owner'}</p>
              </div>
              <Button size="sm" onClick={() => handleGenerate(selectedLead)} disabled={isGenerating} className="gap-1 text-xs">
                <Sparkles className="h-3.5 w-3.5" /> Regenerate
              </Button>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-zinc-700">Subject Line</label>
                  <button onClick={() => handleCopy(generatedSubject, 'subject')} className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1 font-semibold">
                    {copiedField === 'subject' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copiedField === 'subject' ? 'Copied' : 'Copy Subject'}
                  </button>
                </div>
                <input
                  type="text"
                  value={generatedSubject}
                  onChange={(e) => setGeneratedSubject(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 px-3 text-xs font-medium"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-zinc-700">Letter Body</label>
                  <button onClick={() => handleCopy(generatedBody, 'body')} className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1 font-semibold">
                    {copiedField === 'body' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copiedField === 'body' ? 'Copied' : 'Copy Body'}
                  </button>
                </div>
                <textarea
                  value={generatedBody}
                  onChange={(e) => setGeneratedBody(e.target.value)}
                  rows={10}
                  className="w-full rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs font-mono leading-relaxed"
                />
              </div>

              {/* CRM & Direct Email Dispatch Action Bar */}
              <div className="flex items-center gap-3 pt-2">
                <Button
                  variant="primary"
                  className="flex-1 py-2.5 gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                  onClick={async () => {
                    if (!selectedLead) return;
                    try {
                      const res = await fetch('/api/outreach/send-email', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          toEmail: 'owner@' + selectedLead.name.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com',
                          recipientName: selectedLead.agentName || 'Owner',
                          subject: generatedSubject || `Acquisition Inquiry for ${selectedLead.name}`,
                          body: generatedBody,
                          leadId: selectedLead.id
                        })
                      });
                      const data = await res.json();
                      alert(`Email Dispatch Result: ${data.success ? 'Success (Msg ID: ' + data.messageId + ')' : 'Failed: ' + data.error}`);
                    } catch (err: any) {
                      alert(`SendGrid Dispatch Error: ${err.message}`);
                    }
                  }}
                >
                  <Mail className="h-4 w-4" />
                  Dispatch Email via SendGrid
                </Button>

                <Button
                  variant="outline"
                  className="py-2.5 gap-2 text-xs font-bold border-zinc-300"
                  onClick={async () => {
                    if (!selectedLead) return;
                    try {
                      const { syncLeadToCRM } = await import('../../utils/crmSync');
                      const res = await syncLeadToCRM(selectedLead, 'hubspot');
                      alert(`HubSpot CRM Sync: ${res.message}`);
                    } catch (err: any) {
                      alert(`CRM Sync Error: ${err.message}`);
                    }
                  }}
                >
                  <Send className="h-4 w-4 text-emerald-600" />
                  Push Deal to HubSpot CRM
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
