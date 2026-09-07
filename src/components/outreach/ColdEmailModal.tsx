import React, { useState, useEffect } from 'react';
import { 
  X, 
  Mail, 
  Copy, 
  Check, 
  ExternalLink, 
  Sparkles, 
  Send, 
  User, 
  Building2, 
  FileText,
  CheckCircle2
} from 'lucide-react';
import { Lead, ActivityLog } from '../../types';

interface ColdEmailModalProps {
  isOpen: boolean;
  lead: Lead;
  senderName: string;
  senderTitle?: string;
  fundName?: string;
  onClose: () => void;
  onLogTouchpoint: (touchpoint: Partial<ActivityLog>, shouldAdvanceStage: boolean) => Promise<void> | void;
}

type TemplateKey = 'succession_legacy' | 'growth_recap' | 'direct_acquisition';

interface EmailTemplate {
  name: string;
  badge: string;
  subject: string;
  generateBody: (lead: Lead, senderName: string, senderTitle: string, fundName: string) => string;
}

const EMAIL_TEMPLATES: Record<TemplateKey, EmailTemplate> = {
  succession_legacy: {
    name: 'Founder Succession & Legacy',
    badge: 'Retirement / Transition',
    subject: 'Confidential inquiry regarding {company_name} — succession & next chapter',
    generateBody: (lead, senderName, senderTitle, fundName) => {
      const contact = lead.agentName && !lead.isCorporateAgent ? lead.agentName : 'Founder / Owner';
      const city = lead.location.split(',')[0].trim();
      const years = lead.businessProfile?.yearEstablished 
        ? `over ${new Date().getFullYear() - lead.businessProfile.yearEstablished} years` 
        : 'decades';

      return `Hi ${contact},

I hope you're having a productive week.

I'm reaching out directly from ${fundName}. We are an active private investment group focused on partnering with and acquiring premier ${lead.industry.toLowerCase()} businesses across ${city} and surrounding markets.

We've followed ${lead.name}'s track record for some time, particularly your reputation for technical craftsmanship and the business you've built over ${years}.

We specialize in founder succession and recapitalizations. When owners explore their next chapter, our priority is always:
1. Preserving your company brand and community reputation
2. Taking great care of your existing technicians and management team
3. Providing a clean, flexible cash transaction with no broker fees or prolonged financing delays

If you have ever considered what a succession plan or liquidity event could look like for ${lead.name}, I would welcome a 10-minute confidential introductory conversation.

Do you have any availability for a brief call this Thursday or Friday?

Best regards,

${senderName}
${senderTitle}
${fundName}`;
    }
  },

  growth_recap: {
    name: 'Growth Recapitalization',
    badge: 'Chips Off Table / Capital Partner',
    subject: 'Partnership & growth capital discussion for {company_name}',
    generateBody: (lead, senderName, senderTitle, fundName) => {
      const contact = lead.agentName && !lead.isCorporateAgent ? lead.agentName : 'Founder / Owner';

      return `Hi ${contact},

I lead deal sourcing at ${fundName}. We invest in leading operators in the commercial ${lead.industry.toLowerCase()} space who are looking to scale their service footprint.

We've been impressed by ${lead.name}'s operational consistency and market reputation. We frequently partner with strong founders who want to take meaningful chips off the table while retaining equity upside and operational leadership as we expand the platform.

Unlike traditional institutional funds, we bring dedicated growth capital, strategic fleet financing, and institutional recruiting support so you can focus on what you do best.

Would you be open to an introductory conversation to explore whether a strategic partnership makes sense?

Respectfully,

${senderName}
${senderTitle}
${fundName}`;
    }
  },

  direct_acquisition: {
    name: 'Direct Trade Acquisition',
    badge: 'Clean Cash Offer / Synergies',
    subject: 'Direct acquisition interest: {company_name}',
    generateBody: (lead, senderName, senderTitle, fundName) => {
      const contact = lead.agentName && !lead.isCorporateAgent ? lead.agentName : 'Business Owner';
      const city = lead.location.split(',')[0].trim();

      return `Hi ${contact},

My name is ${senderName} with ${fundName}. We are currently expanding our regional footprint in ${city} and are actively seeking to acquire well-established ${lead.industry.toLowerCase()} companies.

We are direct private buyers with committed capital. Because we are not brokers, there are no commissions, and our process is structured to be discrete, fast, and respectful of your day-to-day operations.

We can close transactions with substantial cash at closing, flexible seller rollover options, and tailored transition timelines that fit your personal schedule.

If you have considered selling or exploring a valuation for ${lead.name} in the next 12-24 months, let's connect for a brief 10-minute chat.

Are you available for a quick introductory phone call early next week?

Sincerely,

${senderName}
${senderTitle}
${fundName}`;
    }
  }
};

export const ColdEmailModal: React.FC<ColdEmailModalProps> = ({
  isOpen,
  lead,
  senderName,
  senderTitle = 'Managing Director / Deal Scout',
  fundName = 'SilverScout Capital Partners',
  onClose,
  onLogTouchpoint
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateKey>('succession_legacy');
  const [recipientEmail, setRecipientEmail] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [body, setBody] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [isLogging, setIsLogging] = useState<boolean>(false);
  const [loggedSuccess, setLoggedSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (lead) {
      const email = lead.email || lead.businessProfile?.email || '';
      setRecipientEmail(email);

      const template = EMAIL_TEMPLATES[selectedTemplate];
      const initialSubject = template.subject.replace('{company_name}', lead.name);
      setSubject(initialSubject);

      const initialBody = template.generateBody(lead, senderName, senderTitle, fundName);
      setBody(initialBody);
    }
  }, [lead, selectedTemplate, senderName, senderTitle, fundName]);

  if (!isOpen) return null;

  const handleTemplateChange = (key: TemplateKey) => {
    setSelectedTemplate(key);
    const template = EMAIL_TEMPLATES[key];
    setSubject(template.subject.replace('{company_name}', lead.name));
    setBody(template.generateBody(lead, senderName, senderTitle, fundName));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleLaunchMailto = () => {
    const mailtoUrl = `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl, '_blank');
  };

  const handleLogEmailTouchpoint = async () => {
    setIsLogging(true);
    try {
      const touchpoint: Partial<ActivityLog> = {
        id: `activity_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toISOString(),
        action: `Outreach: Email (Sent Deal Teaser / NDA)`,
        channel: 'email',
        outcome: 'sent_teaser',
        contactPerson: recipientEmail || lead.agentName || 'Founder',
        notes: `Sent personalized cold outreach email using template "${EMAIL_TEMPLATES[selectedTemplate].name}". Subject: "${subject}"`,
        details: `Dispatched cold email to ${recipientEmail || 'founder'} with customized acquisition thesis.`
      };

      await onLogTouchpoint(touchpoint, true);
      setLoggedSuccess(true);
      setTimeout(() => {
        setLoggedSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Failed to log email touchpoint:', err);
    } finally {
      setIsLogging(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-zinc-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 bg-linear-to-r from-blue-50/50 via-white to-white px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-zinc-900">
                  Cold Email 1-Click Launch
                </h3>
                <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                  PE Outreach
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                Target: <span className="font-semibold text-zinc-700">{lead.name}</span> • {lead.location}
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

        <div className="p-6 space-y-5">
          {/* Template Tabs */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
              Select Acquisition Email Strategy
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {(Object.keys(EMAIL_TEMPLATES) as TemplateKey[]).map((key) => {
                const t = EMAIL_TEMPLATES[key];
                const isSelected = selectedTemplate === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleTemplateChange(key)}
                    className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 shadow-xs ring-2 ring-blue-500/20'
                        : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50'
                    }`}
                  >
                    <span className={`text-xs font-bold ${isSelected ? 'text-blue-900' : 'text-zinc-800'}`}>
                      {t.name}
                    </span>
                    <span className="mt-0.5 text-[10px] text-zinc-500 font-medium">
                      {t.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recipient & Subject */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1">
                Recipient Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="e.g. founder@company.com"
                  className="w-full rounded-xl border border-zinc-200 pl-9 pr-3 py-2 text-xs font-medium text-zinc-800 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                  Subject Line
                </label>
                {lead.suggestedSubjectLines && lead.suggestedSubjectLines.length > 0 && (
                  <span className="text-[10px] text-zinc-400">AI Suggested Lines Available</span>
                )}
              </div>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />

              {/* Suggested AI Subject Lines */}
              {lead.suggestedSubjectLines && lead.suggestedSubjectLines.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {lead.suggestedSubjectLines.map((subj, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSubject(subj)}
                      className="rounded bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600 hover:bg-blue-50 hover:text-blue-800 hover:border-blue-200 border border-transparent transition-colors text-left"
                    >
                      Use: "{subj.length > 45 ? subj.substring(0, 45) + '...' : subj}"
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Email Body */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1">
              Personalized Email Body
            </label>
            <textarea
              rows={11}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 p-3 text-xs font-mono leading-relaxed text-zinc-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-100">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors shadow-2xs"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-zinc-500" />
                    <span>Copy Full Email</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleLaunchMailto}
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition-colors"
                title="Launch in your native email client (Gmail, Outlook, Apple Mail)"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Open in Email Client (mailto:)</span>
              </button>

              <button
                type="button"
                onClick={handleLogEmailTouchpoint}
                disabled={isLogging || loggedSuccess}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                {loggedSuccess ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Logged to Timeline!</span>
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    <span>{isLogging ? 'Logging...' : 'Mark as Sent & Log Touchpoint'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
