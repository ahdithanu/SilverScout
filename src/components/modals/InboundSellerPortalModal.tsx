import React, { useState } from 'react';
import { Lead } from '../../types';
import { 
  transformInboundSubmissionToLead, 
  InboundSubmissionPayload 
} from '../../services/inboundIntakeService';
import { 
  X, 
  Send, 
  CheckCircle2, 
  Building2, 
  DollarSign, 
  Clock, 
  HeartHandshake, 
  ShieldCheck, 
  Sparkles,
  User,
  Mail,
  Phone,
  FileText
} from 'lucide-react';

interface InboundSellerPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitLead: (newLead: Lead) => void;
}

export const InboundSellerPortalModal: React.FC<InboundSellerPortalModalProps> = ({
  isOpen,
  onClose,
  onSubmitLead
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Form State
  const [businessName, setBusinessName] = useState('');
  const [industry, setIndustry] = useState('HVAC');
  const [location, setLocation] = useState('');
  const [revenue, setRevenue] = useState('');
  const [ebitda, setEbitda] = useState('');
  const [establishedYear, setEstablishedYear] = useState('');
  
  const [founderName, setFounderName] = useState('');
  const [founderEmail, setFounderEmail] = useState('');
  const [founderPhone, setFounderPhone] = useState('');
  
  const [targetTimeline, setTargetTimeline] = useState<InboundSubmissionPayload['targetTimeline']>('IMMEDIATE_0_3M');
  const [saleReason, setSaleReason] = useState<InboundSubmissionPayload['saleReason']>('RETIREMENT');
  const [sellerExpectedValuation, setSellerExpectedValuation] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleFillSample = () => {
    setBusinessName('Central Valley Refrigeration & Cold Storage Inc.');
    setIndustry('HVAC');
    setLocation('Modesto, CA');
    setRevenue('4200000');
    setEbitda('850000');
    setEstablishedYear('2001');
    setFounderName('Gary Higgins');
    setFounderEmail('gary@cvrefrigeration.com');
    setFounderPhone('(209) 555-0144');
    setTargetTimeline('IMMEDIATE_0_3M');
    setSaleReason('RETIREMENT');
    setSellerExpectedValuation('3800000');
    setNotes('Founder actively planning succession to retire to Lake Tahoe. Desires clean cash buyout with ethical operational continuity for long-standing technicians.');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload: InboundSubmissionPayload = {
      businessName: businessName || 'Confidential Inbound Target',
      industry,
      location: location || 'California, US',
      revenue: Number(revenue) || 3500000,
      ebitda: Number(ebitda) || 750000,
      establishedYear: Number(establishedYear) || 2005,
      founderName: founderName || 'Confidential Founder',
      founderEmail: founderEmail || 'seller@confidential.com',
      founderPhone,
      targetTimeline,
      saleReason,
      sellerExpectedValuation: Number(sellerExpectedValuation) || undefined,
      notes
    };

    const lead = transformInboundSubmissionToLead(payload, 'search-fund-alpha');
    onSubmitLead(lead);
    setIsSubmitted(true);
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setStep(1);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white p-8 shadow-2xl border border-zinc-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <HeartHandshake className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-zinc-900">Sell-Side Founder Intake Portal</h3>
              <p className="text-xs text-zinc-500">Confidential valuation request & acquisition expression of interest.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleFillSample}
              className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-colors"
            >
              Autofill Sample Founder
            </button>
            <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 p-1">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {isSubmitted ? (
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h4 className="text-xl font-bold text-zinc-900">Inbound Valuation Submission Ingested!</h4>
            <p className="text-sm text-zinc-600 max-w-md mx-auto">
              <strong>{businessName}</strong> has been ingested into your live Deal Pipeline as an 
              <span className="text-emerald-700 font-bold ml-1">INBOUND_INTEREST</span> target with calculated seller urgency scoring.
            </p>
            <div className="pt-4">
              <button
                onClick={handleReset}
                className="rounded-xl bg-zinc-900 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-zinc-800"
              >
                Return to Pipeline Dashboard
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step Indicators */}
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 text-xs font-bold text-zinc-500">
              <span className={step >= 1 ? 'text-emerald-700 font-black' : ''}>1. Business Profile</span>
              <span className={step >= 2 ? 'text-emerald-700 font-black' : ''}>2. Exit Urgency & Motivation</span>
              <span className={step >= 3 ? 'text-emerald-700 font-black' : ''}>3. Founder & Terms</span>
            </div>

            {/* STEP 1: Business Profile */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-700">Business / Operating Entity Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Apex Mechanical Services"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-700">Trade Vertical</label>
                    <select
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="HVAC">HVAC & Mechanical</option>
                      <option value="Plumbing">Commercial Plumbing</option>
                      <option value="Electrical">Industrial Electrical</option>
                      <option value="Manufacturing">Precision Manufacturing / CNC</option>
                      <option value="Roofing">Commercial Roofing</option>
                      <option value="Solar">Solar & Energy Storage</option>
                      <option value="Landscaping">Commercial Landscaping</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-700">Primary Metro / Location</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Stockton, CA"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-700">Year Founded</label>
                    <input
                      type="number"
                      placeholder="e.g. 2002"
                      value={establishedYear}
                      onChange={(e) => setEstablishedYear(e.target.value)}
                      className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-700">Annual Revenue ($)</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 4500000"
                      value={revenue}
                      onChange={(e) => setRevenue(e.target.value)}
                      className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-700">Clean EBITDA / Cash Flow ($)</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 950000"
                      value={ebitda}
                      onChange={(e) => setEbitda(e.target.value)}
                      className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                  >
                    Next: Exit Urgency
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Exit Motivation & Urgency */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-700">Target Transaction Timeline</label>
                    <select
                      value={targetTimeline}
                      onChange={(e) => setTargetTimeline(e.target.value as any)}
                      className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="IMMEDIATE_0_3M">Immediate (0 - 3 Months)</option>
                      <option value="SHORT_3_6M">Near-Term (3 - 6 Months)</option>
                      <option value="MEDIUM_6_12M">Medium-Term (6 - 12 Months)</option>
                      <option value="EXPLORING">Exploring Options / Unhurried</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-700">Primary Reason for Sale</label>
                    <select
                      value={saleReason}
                      onChange={(e) => setSaleReason(e.target.value as any)}
                      className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="RETIREMENT">Founder Retirement</option>
                      <option value="BURNOUT_HEALTH">Operational Burnout / Health</option>
                      <option value="PARTNERSHIP_SPLIT">Partnership Dissolution</option>
                      <option value="GROWTH_RECAP">Growth Equity Recapitalization</option>
                      <option value="OTHER">Other Strategic Motivation</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700">Founder Expected Valuation ($)</label>
                  <input
                    type="number"
                    placeholder="e.g. 4000000 (Optional)"
                    value={sellerExpectedValuation}
                    onChange={(e) => setSellerExpectedValuation(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-zinc-400">Our engine compares this against standard 4.5x - 5.5x trade multiples to gauge close likelihood.</p>
                </div>

                <div className="flex justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="rounded-xl border border-zinc-300 px-5 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-50"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                  >
                    Next: Contact & Submission
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Contact & Submission */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-700">Managing Principal / Founder Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Arthur Pendelton"
                      value={founderName}
                      onChange={(e) => setFounderName(e.target.value)}
                      className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-700">Confidential Direct Email</label>
                    <input
                      type="email"
                      required
                      placeholder="founder@company.com"
                      value={founderEmail}
                      onChange={(e) => setFounderEmail(e.target.value)}
                      className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700">Direct Phone (Optional)</label>
                  <input
                    type="tel"
                    placeholder="(555) 000-0000"
                    value={founderPhone}
                    onChange={(e) => setFounderPhone(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700">Confidential Succession Notes</label>
                  <textarea
                    rows={3}
                    placeholder="Specific requests regarding post-closing transition, key staff retention, or real estate lease..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 p-2.5 text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="flex justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="rounded-xl border border-zinc-300 px-5 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-50"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700"
                  >
                    <Send className="h-4 w-4" />
                    Submit Inbound Deal to Pipeline
                  </button>
                </div>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};
