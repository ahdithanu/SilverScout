import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  Copy, 
  Check, 
  Building2, 
  MapPin, 
  Send, 
  CheckCircle2, 
  ShieldCheck, 
  Phone,
  Mail,
  Calendar,
  Sparkles
} from 'lucide-react';
import { Lead, ActivityLog } from '../../types';

interface DirectMailLetterModalProps {
  isOpen: boolean;
  lead: Lead;
  fundName?: string;
  fundAddress?: string;
  senderName: string;
  senderTitle?: string;
  senderPhone?: string;
  senderEmail?: string;
  onClose: () => void;
  onLogTouchpoint: (touchpoint: Partial<ActivityLog>, shouldAdvanceStage: boolean) => Promise<void> | void;
}

type LetterTone = 'legacy_succession' | 'cash_speed' | 'regional_platform';

interface LetterToneConfig {
  name: string;
  tagline: string;
  subjectLine: string;
  generateParagraphs: (lead: Lead) => string[];
}

const TONES: Record<LetterTone, LetterToneConfig> = {
  legacy_succession: {
    name: 'Founder Succession & Legacy',
    tagline: 'Emphasizes reputation, staff continuity & quiet transition',
    subjectLine: 'CONFIDENTIAL: Acquisition Inquiry & Succession Planning',
    generateParagraphs: (lead) => {
      const city = lead.location.split(',')[0].trim();
      const years = lead.businessProfile?.yearEstablished 
        ? `${new Date().getFullYear() - lead.businessProfile.yearEstablished} years` 
        : 'many years';

      return [
        `I am writing to you directly regarding your business, ${lead.name}. Our private investment firm has long admired the quality, reliability, and community standing your company has established in ${city} over the past ${years}.`,
        `We are direct private investors seeking to acquire and partner with exceptional, profitable ${lead.industry.toLowerCase()} businesses. We are not business brokers or intermediaries looking to list your company. Our goal is to make a direct, long-term equity investment in an established operation with a proud track record.`,
        `We recognize that for many business owners, contemplating an eventual succession or retirement is one of the most important decisions of a lifetime. When we invest in a company, our absolute priorities are:`,
        `• Preserving your brand name, heritage, and standing in ${city}\n• Providing long-term job security and career growth for your dedicated technicians, managers, and staff\n• Structuring a flexible, customized transaction that allows you to step away on your timeline while maximizing cash at closing with no broker commissions`,
        `If you have ever considered what the next chapter for ${lead.name} could look like—whether in the immediate future or over the next two to three years—I would appreciate the privilege of an informal, strictly confidential conversation.`,
        `I will follow up by telephone in the coming days, but please feel free to reach out directly to my confidential cell phone or personal email below.`
      ];
    }
  },

  cash_speed: {
    name: 'Confidential Direct Cash Offer',
    tagline: 'Clean transaction, committed capital & zero commissions',
    subjectLine: 'CONFIDENTIAL: Direct Acquisition Interest & Cash Purchase',
    generateParagraphs: (lead) => {
      const city = lead.location.split(',')[0].trim();

      return [
        `I am writing to express our direct interest in acquiring ${lead.name}. We are an active private investment partnership with fully committed equity capital actively acquiring premier ${lead.industry.toLowerCase()} contractors in ${city}.`,
        `Because we are direct principal buyers rather than brokers or intermediaries, there are zero brokerage fees or marketing commissions deducted from your transaction proceeds. Furthermore, all discussions and shared information remain strictly confidential, ensuring zero disruption to your daily operations, employees, or customer accounts.`,
        `Our transaction criteria emphasize speed and certainty:\n• Significant cash paid at closing with flexible rollover equity if desired\n• Expeditious diligence timeline (30 to 45 days from non-binding LOI)\n• Tailored consulting or advisory agreements based on your personal preferences`,
        `If you are interested in exploring the enterprise valuation of ${lead.name} in today's favorable acquisition market, I invite you to connect with me directly for a confidential introductory discussion.`
      ];
    }
  },

  regional_platform: {
    name: 'Regional Platform Partnership',
    tagline: 'Scale synergies, fleet investment & management support',
    subjectLine: 'CONFIDENTIAL: Strategic Trade Partnership Opportunity',
    generateParagraphs: (lead) => {
      const city = lead.location.split(',')[0].trim();

      return [
        `Our investment team is currently assembling a premier regional commercial ${lead.industry.toLowerCase()} platform across the market. Based on your strong permit volume history and exemplary customer reputation in ${city}, ${lead.name} represents our ideal cornerstone partner.`,
        `We provide partner companies with institutional financial resources, fleet purchasing power, modernized dispatch technology, and centralized administrative support—allowing local operators to dominate their service territory without administrative bottlenecks.`,
        `We frequently structure transactions that allow founders to achieve significant personal liquidity while retaining an active leadership role and substantial equity upside in the combined platform company.`,
        `I would welcome the opportunity to discuss our platform thesis with you in confidence and share how similar founders have successfully partnered with our team.`
      ];
    }
  }
};

export const DirectMailLetterModal: React.FC<DirectMailLetterModalProps> = ({
  isOpen,
  lead,
  fundName = 'SilverScout Capital Partners, LP',
  fundAddress = '100 Montgomery Street, Suite 2400, San Francisco, CA 94104',
  senderName,
  senderTitle = 'Managing Partner',
  senderPhone = '(415) 890-5520',
  senderEmail = 'acquisitions@silverscout.com',
  onClose,
  onLogTouchpoint
}) => {
  const [tone, setTone] = useState<LetterTone>('legacy_succession');
  const [recipientName, setRecipientName] = useState<string>('');
  const [streetAddress, setStreetAddress] = useState<string>('');
  const [cityStateZip, setCityStateZip] = useState<string>('');
  const [customClosingPhone, setCustomClosingPhone] = useState<string>(senderPhone);
  const [copied, setCopied] = useState<boolean>(false);
  const [isLogging, setIsLogging] = useState<boolean>(false);
  const [loggedSuccess, setLoggedSuccess] = useState<boolean>(false);

  React.useEffect(() => {
    if (lead) {
      setRecipientName(lead.agentName && !lead.isCorporateAgent ? lead.agentName : 'Business Owner & Principal');
      setStreetAddress(lead.address || lead.businessProfile?.streetAddress || '123 Commercial Boulevard');
      const zip = lead.businessProfile?.zipCode ? ` ${lead.businessProfile.zipCode}` : '';
      setCityStateZip(`${lead.location}${zip}`);
      setCustomClosingPhone(senderPhone);
    }
  }, [lead, senderPhone]);

  if (!isOpen) return null;

  const currentToneConfig = TONES[tone];
  const paragraphs = currentToneConfig.generateParagraphs(lead);
  const todayFormatted = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const handlePrint = () => {
    window.print();
  };

  const getFullLetterText = () => {
    return `${fundName.toUpperCase()}
${fundAddress}
Direct: ${customClosingPhone} | Confidential: ${senderEmail}

${todayFormatted}

${recipientName}
${lead.name}
${streetAddress}
${cityStateZip}

RE: ${currentToneConfig.subjectLine}

Dear ${recipientName},

${paragraphs.join('\n\n')}

Respectfully yours,

${senderName}
${senderTitle}
${fundName}
Direct Cell: ${customClosingPhone}
Confidential Email: ${senderEmail}`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getFullLetterText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleLogMailedTouchpoint = async () => {
    setIsLogging(true);
    try {
      const touchpoint: Partial<ActivityLog> = {
        id: `activity_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toISOString(),
        action: `Outreach: Direct Mail (Sent Deal Teaser / NDA)`,
        channel: 'direct_mail',
        outcome: 'sent_teaser',
        contactPerson: `${recipientName} (${lead.name})`,
        notes: `Mailed physical acquisition letter ("${currentToneConfig.name}") to ${streetAddress}, ${cityStateZip}.`,
        details: `Sent 1-page private equity physical acquisition inquiry letter to ${recipientName}.`
      };

      await onLogTouchpoint(touchpoint, true);
      setLoggedSuccess(true);
      setTimeout(() => {
        setLoggedSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Failed to log direct mail touchpoint:', err);
    } finally {
      setIsLogging(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl border border-zinc-200 overflow-hidden my-6 print:shadow-none print:border-none print:max-w-none print:m-0 animate-in fade-in zoom-in-95 duration-150">
        {/* Screen Controls Header (Hidden in Print) */}
        <div className="flex flex-wrap items-center justify-between border-b border-zinc-200 bg-linear-to-r from-amber-50/40 via-white to-white px-6 py-4 print:hidden">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-600 text-white shadow-sm">
              <Printer className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-zinc-900">
                  Direct Mail Acquisition Letter Generator
                </h3>
                <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                  "Golden Letter" (8.5" x 11")
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                Formal private acquisition inquiry formatted for high-response postal mail
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

        {/* Customization Toolbar (Hidden in Print) */}
        <div className="border-b border-zinc-100 bg-zinc-50 p-4 space-y-3 print:hidden">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Letter Strategy:
              </span>
              <div className="flex rounded-lg bg-zinc-200/80 p-0.5 text-xs font-semibold">
                {(Object.keys(TONES) as LetterTone[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTone(t)}
                    className={`rounded-md px-3 py-1 transition-all ${
                      tone === t ? 'bg-white text-zinc-900 shadow-2xs font-bold' : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    {TONES[t].name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors shadow-2xs"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-zinc-500" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-zinc-800 transition-colors"
              >
                <Printer className="h-3.5 w-3.5 text-amber-400" />
                <span>Print / Save as PDF</span>
              </button>

              <button
                type="button"
                onClick={handleLogMailedTouchpoint}
                disabled={isLogging || loggedSuccess}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                {loggedSuccess ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Logged to Timeline!</span>
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    <span>{isLogging ? 'Logging...' : 'Mark as Mailed & Log Touchpoint'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Recipient Address Customizer */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-zinc-200/60 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-0.5">Recipient Name / Title</span>
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs text-zinc-800"
              />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-0.5">Physical Street Address</span>
              <input
                type="text"
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs text-zinc-800"
              />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-0.5">City, State ZIP</span>
              <input
                type="text"
                value={cityStateZip}
                onChange={(e) => setCityStateZip(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs text-zinc-800"
              />
            </div>
          </div>
        </div>

        {/* Printable Physical Letter Canvas */}
        <div className="p-10 sm:p-14 max-w-3xl mx-auto bg-white text-zinc-900 font-serif leading-relaxed text-sm select-text print:p-0 print:m-0 print:max-w-none">
          {/* Letterhead */}
          <div className="border-b-2 border-zinc-900 pb-5 mb-8 text-center sm:text-left flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-black font-sans tracking-tight text-zinc-900">
                {fundName.toUpperCase()}
              </h1>
              <p className="text-[11px] font-sans text-zinc-500 uppercase tracking-widest mt-0.5">
                Private Equity & Growth Investments
              </p>
            </div>
            <div className="text-[11px] font-sans text-zinc-600 sm:text-right space-y-0.5">
              <p>{fundAddress}</p>
              <p>Direct: {customClosingPhone} • Email: {senderEmail}</p>
            </div>
          </div>

          {/* Date */}
          <div className="mb-6 font-sans text-xs font-semibold text-zinc-700">
            {todayFormatted}
          </div>

          {/* Recipient Address Block */}
          <div className="mb-6 font-sans text-xs space-y-0.5 text-zinc-800 font-medium">
            <p className="font-bold text-zinc-900">{recipientName}</p>
            <p>{lead.name}</p>
            <p>{streetAddress}</p>
            <p>{cityStateZip}</p>
          </div>

          {/* Subject Reference */}
          <div className="mb-6 font-sans text-xs font-bold text-zinc-900 uppercase tracking-wide border-l-2 border-amber-600 pl-3">
            RE: {currentToneConfig.subjectLine} — {lead.name}
          </div>

          {/* Salutation */}
          <p className="mb-4">
            Dear {recipientName},
          </p>

          {/* Body Paragraphs */}
          <div className="space-y-4 text-justify leading-relaxed text-[13px] sm:text-sm text-zinc-800">
            {paragraphs.map((p, idx) => (
              <p key={idx} className="whitespace-pre-line">
                {p}
              </p>
            ))}
          </div>

          {/* Closing & Sign-off */}
          <div className="mt-8 pt-4 font-sans text-xs text-zinc-800 space-y-4">
            <p className="font-medium">Respectfully yours,</p>
            
            {/* Signature representation */}
            <div className="py-2">
              <span className="font-serif italic text-lg text-zinc-900 tracking-wide">
                {senderName}
              </span>
            </div>

            <div className="space-y-0.5 text-zinc-700 font-medium">
              <p className="font-bold text-zinc-900">{senderName}</p>
              <p>{senderTitle}</p>
              <p className="font-semibold text-zinc-900">{fundName}</p>
              <p className="text-zinc-600">Confidential Cell: <span className="text-zinc-900 font-bold">{customClosingPhone}</span></p>
              <p className="text-zinc-600">Direct Email: <span className="text-zinc-900 font-bold">{senderEmail}</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
