import React, { useState } from 'react';
import { 
  Repeat, 
  CheckCircle2, 
  Clock, 
  Play, 
  Pause, 
  Mail, 
  Phone, 
  Send, 
  MapPin, 
  Zap, 
  Check, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { Lead, OutreachChannel } from '../../types';
import { 
  CADENCE_PRESETS, 
  getCadencePreset, 
  isCadenceStepDue 
} from '../../utils/cadenceEngine';

interface CadenceStepperCardProps {
  lead: Lead;
  onEnroll: (cadenceId: string) => Promise<void> | void;
  onAdvanceStep: () => Promise<void> | void;
  onPauseToggle: () => Promise<void> | void;
  onMarkReplied: () => Promise<void> | void;
  onExecuteStep: (channel: OutreachChannel, suggestedTemplateKey?: string) => void;
}

const getChannelIcon = (channel: OutreachChannel) => {
  switch (channel) {
    case 'email':
      return <Mail className="h-4 w-4" />;
    case 'phone_call':
      return <Phone className="h-4 w-4" />;
    case 'direct_mail':
      return <Send className="h-4 w-4" />;
    case 'in_person_visit':
      return <MapPin className="h-4 w-4" />;
    default:
      return <Repeat className="h-4 w-4" />;
  }
};

export const CadenceStepperCard: React.FC<CadenceStepperCardProps> = ({
  lead,
  onEnroll,
  onAdvanceStep,
  onPauseToggle,
  onMarkReplied,
  onExecuteStep
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('classic_4_touch');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const cadenceState = lead.cadenceState;
  const isEnrolled = !!cadenceState;
  const definition = cadenceState ? getCadencePreset(cadenceState.id) : getCadencePreset(selectedPresetId);
  const steps = definition?.steps || [];

  const handleEnrollClick = async () => {
    setIsProcessing(true);
    try {
      await onEnroll(selectedPresetId);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAdvanceClick = async () => {
    setIsProcessing(true);
    try {
      await onAdvanceStep();
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePauseToggleClick = async () => {
    setIsProcessing(true);
    try {
      await onPauseToggle();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRepliedClick = async () => {
    setIsProcessing(true);
    try {
      await onMarkReplied();
    } finally {
      setIsProcessing(false);
    }
  };

  // If not yet enrolled in any cadence
  if (!isEnrolled) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-linear-to-b from-indigo-50/40 via-white to-white p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
              <Repeat className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900">
                Multi-Touch Outreach Cadence
              </h4>
              <p className="text-[10px] text-zinc-500">
                Enroll this target in a standardized institutional acquisition sequence
              </p>
            </div>
          </div>
          <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-[10px] font-bold text-zinc-600">
            Unenrolled
          </span>
        </div>

        <div className="mt-4 space-y-3">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600">
            Select Cadence Strategy
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {CADENCE_PRESETS.map((preset) => {
              const isSelected = selectedPresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setSelectedPresetId(preset.id)}
                  className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/70 shadow-2xs ring-2 ring-indigo-500/20'
                      : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50'
                  }`}
                >
                  <span className={`text-xs font-bold ${isSelected ? 'text-indigo-950' : 'text-zinc-800'}`}>
                    {preset.name}
                  </span>
                  <span className="mt-1 text-[10px] text-zinc-500 leading-snug">
                    {preset.description}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Auto-schedules Email, Call, and Direct Mail Golden Letter touchpoints</span>
            </div>
            <button
              type="button"
              onClick={handleEnrollClick}
              disabled={isProcessing}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              <Zap className="h-3.5 w-3.5" />
              <span>{isProcessing ? 'Enrolling...' : 'Start Outreach Cadence'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active / Paused / Completed / Replied Cadence State
  const currentStep = steps[cadenceState.currentStepIndex] || steps[0];
  const isOverdue = isCadenceStepDue(lead);
  const formattedDueDate = cadenceState.nextStepDueDate 
    ? new Date(cadenceState.nextStepDueDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
    : 'None';

  return (
    <div className="rounded-2xl border border-zinc-200 bg-linear-to-b from-indigo-50/30 via-white to-white p-5 shadow-xs">
      {/* Cadence Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
            <Repeat className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-zinc-900">
                {cadenceState.name}
              </h4>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                cadenceState.status === 'active' 
                  ? 'bg-emerald-100 text-emerald-800'
                  : cadenceState.status === 'paused'
                  ? 'bg-amber-100 text-amber-800'
                  : cadenceState.status === 'replied'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {cadenceState.status.toUpperCase()}
              </span>
            </div>
            <p className="text-[10px] text-zinc-500">
              Enrolled: {new Date(cadenceState.enrolledAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} • {cadenceState.completedSteps.length} of {cadenceState.totalSteps} steps completed
            </p>
          </div>
        </div>

        {/* Top Control Buttons */}
        <div className="flex items-center gap-1.5">
          {cadenceState.status !== 'completed' && cadenceState.status !== 'replied' && (
            <>
              <button
                type="button"
                onClick={handlePauseToggleClick}
                disabled={isProcessing}
                className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
                title={cadenceState.status === 'active' ? 'Pause Cadence' : 'Resume Cadence'}
              >
                {cadenceState.status === 'active' ? (
                  <>
                    <Pause className="h-3 w-3 text-amber-600" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3 w-3 text-emerald-600" />
                    <span>Resume</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleRepliedClick}
                disabled={isProcessing}
                className="flex items-center gap-1 rounded-lg border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-800 hover:bg-purple-100 transition-colors"
                title="Mark cadence as replied/converted and halt further automated steps"
              >
                <Check className="h-3 w-3 text-purple-600" />
                <span>Founder Replied</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Visual Stepper Timeline */}
      <div className="mt-5">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
          {steps.map((step, idx) => {
            const isCompleted = cadenceState.completedSteps.some(s => s.stepIndex === idx);
            const isCurrent = cadenceState.status === 'active' && cadenceState.currentStepIndex === idx && !isCompleted;
            const isPending = !isCompleted && !isCurrent;

            return (
              <div
                key={step.stepNumber}
                className={`relative rounded-xl border p-3 transition-all ${
                  isCompleted
                    ? 'border-emerald-200 bg-emerald-50/50 text-emerald-900'
                    : isCurrent
                    ? 'border-indigo-500 bg-indigo-50/80 ring-2 ring-indigo-400/30 text-indigo-950 shadow-2xs'
                    : 'border-zinc-200 bg-zinc-50/60 text-zinc-500'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <div className={`flex h-6 w-6 items-center justify-center rounded-lg ${
                      isCompleted 
                        ? 'bg-emerald-600 text-white' 
                        : isCurrent
                        ? 'bg-indigo-600 text-white'
                        : 'bg-zinc-200 text-zinc-500'
                    }`}>
                      {getChannelIcon(step.channel)}
                    </div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider">
                      Day {step.delayDays}
                    </span>
                  </div>

                  {isCompleted ? (
                    <span className="flex items-center gap-0.5 rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800">
                      <Check className="h-2.5 w-2.5" />
                      Done
                    </span>
                  ) : isCurrent ? (
                    <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                      isOverdue ? 'bg-red-100 text-red-800' : 'bg-indigo-100 text-indigo-800'
                    }`}>
                      {isOverdue ? 'Due Now' : 'Current'}
                    </span>
                  ) : (
                    <span className="text-[9px] font-medium text-zinc-400">
                      Step {step.stepNumber}
                    </span>
                  )}
                </div>

                <p className="text-xs font-bold leading-tight line-clamp-1">
                  {step.title}
                </p>
                <p className="text-[10px] text-inherit opacity-80 mt-1 line-clamp-2 leading-relaxed">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Footer for Current Step */}
      {cadenceState.status === 'active' && currentStep && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-100 bg-linear-to-r from-indigo-50/70 to-white p-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-2xs">
              {getChannelIcon(currentStep.channel)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-900">
                  Next Step: {currentStep.title}
                </span>
                <span className={`rounded px-1.5 py-0.2 text-[10px] font-bold ${
                  isOverdue ? 'bg-red-100 text-red-800' : 'bg-indigo-100 text-indigo-800'
                }`}>
                  Due: {formattedDueDate}
                </span>
              </div>
              <p className="text-[10px] text-zinc-500">
                Click "Execute Step" to automatically launch the pre-populated outreach tool
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAdvanceClick}
              disabled={isProcessing}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
              title="Manually skip or advance to the next step"
            >
              Skip Step
            </button>

            <button
              type="button"
              onClick={() => onExecuteStep(currentStep.channel, currentStep.suggestedTemplateKey)}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition-colors"
            >
              <Zap className="h-3.5 w-3.5" />
              <span>⚡ Execute Step {cadenceState.currentStepIndex + 1} ({currentStep.channel.replace(/_/g, ' ')})</span>
            </button>
          </div>
        </div>
      )}

      {/* Replied / Completed State Banner */}
      {cadenceState.status === 'replied' && (
        <div className="mt-4 rounded-xl border border-purple-200 bg-purple-50 p-3 flex items-center justify-between text-xs text-purple-900">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-purple-600" />
            <span>
              Founder has responded. Automated cadence sequence is halted and target is qualified.
            </span>
          </div>
        </div>
      )}

      {cadenceState.status === 'completed' && (
        <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-3 flex items-center justify-between text-xs text-blue-900">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-blue-600" />
            <span>
              All {cadenceState.totalSteps} steps in this cadence have been executed.
            </span>
          </div>
          <button
            type="button"
            onClick={() => onEnroll('velocity_trade')}
            className="text-xs font-bold text-blue-700 hover:underline"
          >
            Start Follow-Up Sprint
          </button>
        </div>
      )}
    </div>
  );
};
