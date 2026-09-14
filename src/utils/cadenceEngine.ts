import { Lead, CadenceDefinition, CadenceState, CadenceStepConfig, OutreachChannel } from '../types';

export const CADENCE_PRESETS: CadenceDefinition[] = [
  {
    id: 'classic_4_touch',
    name: 'Classic 4-Touch PE Search Cadence (14 Days)',
    description: 'Standard institutional deal origination cadence combining cold email, introductory phone call, physical Golden Letter, and partner follow-up.',
    totalDays: 14,
    steps: [
      {
        stepNumber: 1,
        delayDays: 0,
        channel: 'email',
        title: 'Personalized Founder Cold Email',
        description: 'Discreet acquisition inquiry emphasizing legacy, employee continuity, and quiet retirement timeline.',
        suggestedTemplateKey: 'succession_legacy'
      },
      {
        stepNumber: 2,
        delayDays: 3,
        channel: 'phone_call',
        title: 'Introductory Founder Phone Call',
        description: 'Brief phone call to owner; leave voicemail if not reached.'
      },
      {
        stepNumber: 3,
        delayDays: 7,
        channel: 'direct_mail',
        title: 'Physical Golden Letter (Direct Mail)',
        description: 'Formal 8.5"x11" PE acquisition inquiry letter delivered to business address.'
      },
      {
        stepNumber: 4,
        delayDays: 14,
        channel: 'phone_call',
        title: 'Partner Executive Follow-Up',
        description: 'Senior partner call or local scout site visit to discuss valuation.'
      }
    ]
  },
  {
    id: 'velocity_trade',
    name: 'High-Velocity Trade Sourcing (7 Days)',
    description: 'Aggressive 7-day multi-channel sprint for high exit-propensity targets and active permit contraction signals.',
    totalDays: 7,
    steps: [
      {
        stepNumber: 1,
        delayDays: 0,
        channel: 'phone_call',
        title: 'Direct Owner Phone Outreach',
        description: 'Direct call to principal regarding recent permit activity and recapitalization.'
      },
      {
        stepNumber: 2,
        delayDays: 2,
        channel: 'email',
        title: 'Direct Cash Acquisition Email',
        description: 'Follow-up email outlining cash purchase terms and zero broker fees.',
        suggestedTemplateKey: 'direct_acquisition'
      },
      {
        stepNumber: 3,
        delayDays: 5,
        channel: 'direct_mail',
        title: 'Physical Golden Letter',
        description: 'Confidential direct cash offer letter sent via postal mail.'
      },
      {
        stepNumber: 4,
        delayDays: 7,
        channel: 'in_person_visit',
        title: 'Deal Scout Facility Visit',
        description: 'On-site facility visit or discreet commercial inspection.'
      }
    ]
  },
  {
    id: 'founder_nurture',
    name: 'Founder Retirement Long-Term Nurture (30 Days)',
    description: 'Low-pressure relationship nurturing for high-valuation businesses with 1-2 year retirement horizons.',
    totalDays: 30,
    steps: [
      {
        stepNumber: 1,
        delayDays: 0,
        channel: 'email',
        title: 'Introduction & Thesis Share',
        description: 'Initial introduction and overview of fund investment criteria.',
        suggestedTemplateKey: 'growth_recap'
      },
      {
        stepNumber: 2,
        delayDays: 7,
        channel: 'direct_mail',
        title: 'Executive Letter of Interest',
        description: 'Formal investment philosophy letterhead sent via mail.'
      },
      {
        stepNumber: 3,
        delayDays: 14,
        channel: 'phone_call',
        title: 'Informal Check-in Call',
        description: 'Follow-up check-in to answer questions about the letter.'
      },
      {
        stepNumber: 4,
        delayDays: 30,
        channel: 'email',
        title: 'Market Valuation & Trend Update',
        description: 'Quarterly valuation benchmarks and commercial trade insights update.'
      }
    ]
  }
];

export const getCadencePreset = (cadenceId: string): CadenceDefinition | undefined => {
  return CADENCE_PRESETS.find(c => c.id === cadenceId) || CADENCE_PRESETS[0];
};

/**
 * Calculates a future ISO date based on an anchor date and days offset
 */
export const calculateDueDate = (anchorDate: Date, delayDays: number): string => {
  const d = new Date(anchorDate);
  d.setDate(d.getDate() + delayDays);
  return d.toISOString();
};

/**
 * Enrolls a lead in a multi-touch cadence sequence
 */
export const enrollLeadInCadence = (
  lead: Lead,
  cadenceId: string,
  startDateStr?: string
): Lead => {
  const cadence = getCadencePreset(cadenceId) || CADENCE_PRESETS[0];
  const anchorDate = startDateStr ? new Date(startDateStr) : new Date();
  const firstStep = cadence.steps[0];

  const cadenceState: CadenceState = {
    id: cadence.id,
    name: cadence.name,
    enrolledAt: anchorDate.toISOString(),
    status: 'active',
    currentStepIndex: 0,
    totalSteps: cadence.steps.length,
    nextStepDueDate: calculateDueDate(anchorDate, firstStep.delayDays),
    nextStepChannel: firstStep.channel,
    nextStepTitle: firstStep.title,
    completedSteps: []
  };

  return {
    ...lead,
    cadenceState,
    nextFollowUpDate: cadenceState.nextStepDueDate,
    lastOutreachChannel: firstStep.channel,
    status: lead.status === 'new' ? 'outreach_triggered' : lead.status,
    currentState: lead.status === 'new' ? 'OUTREACH_TRIGGERED' : lead.currentState,
    updatedAt: new Date().toISOString()
  };
};

/**
 * Advances the cadence to the next step upon executing a touchpoint
 */
export const advanceCadenceStep = (
  lead: Lead,
  activityLogId?: string,
  notes?: string
): Lead => {
  if (!lead.cadenceState || lead.cadenceState.status !== 'active') {
    return lead;
  }

  const cadence = getCadencePreset(lead.cadenceState.id);
  if (!cadence) return lead;

  const currentIdx = lead.cadenceState.currentStepIndex;
  const currentStep = cadence.steps[currentIdx];
  const nowStr = new Date().toISOString();

  const completedStep = {
    stepIndex: currentIdx,
    channel: currentStep.channel,
    completedAt: nowStr,
    activityLogId,
    notes
  };

  const nextIdx = currentIdx + 1;
  const isCompleted = nextIdx >= cadence.steps.length;

  if (isCompleted) {
    return {
      ...lead,
      cadenceState: {
        ...lead.cadenceState,
        status: 'completed',
        currentStepIndex: currentIdx,
        nextStepTitle: 'Cadence Completed',
        completedSteps: [...lead.cadenceState.completedSteps, completedStep]
      },
      updatedAt: nowStr
    };
  }

  const nextStep = cadence.steps[nextIdx];
  const enrolledDate = new Date(lead.cadenceState.enrolledAt);
  const nextDueDate = calculateDueDate(enrolledDate, nextStep.delayDays);

  return {
    ...lead,
    cadenceState: {
      ...lead.cadenceState,
      currentStepIndex: nextIdx,
      nextStepDueDate: nextDueDate,
      nextStepChannel: nextStep.channel,
      nextStepTitle: nextStep.title,
      completedSteps: [...lead.cadenceState.completedSteps, completedStep]
    },
    nextFollowUpDate: nextDueDate,
    updatedAt: nowStr
  };
};

/**
 * Pauses an active cadence
 */
export const pauseCadence = (lead: Lead): Lead => {
  if (!lead.cadenceState) return lead;
  return {
    ...lead,
    cadenceState: {
      ...lead.cadenceState,
      status: 'paused'
    },
    updatedAt: new Date().toISOString()
  };
};

/**
 * Resumes a paused cadence
 */
export const resumeCadence = (lead: Lead): Lead => {
  if (!lead.cadenceState) return lead;
  return {
    ...lead,
    cadenceState: {
      ...lead.cadenceState,
      status: 'active'
    },
    updatedAt: new Date().toISOString()
  };
};

/**
 * Marks a cadence as replied / converted when a founder responds
 */
export const markCadenceReplied = (lead: Lead, notes?: string): Lead => {
  if (!lead.cadenceState) return lead;
  return {
    ...lead,
    cadenceState: {
      ...lead.cadenceState,
      status: 'replied'
    },
    status: lead.status === 'outreach_triggered' ? 'qualified' : lead.status,
    updatedAt: new Date().toISOString()
  };
};

/**
 * Determines if a lead's current cadence step is due or overdue
 */
export const isCadenceStepDue = (lead: Lead, referenceDate: Date = new Date()): boolean => {
  if (!lead.cadenceState || lead.cadenceState.status !== 'active') return false;
  if (!lead.cadenceState.nextStepDueDate) return false;
  
  const dueDate = new Date(lead.cadenceState.nextStepDueDate);
  // Due if on or before today's end of day
  const endOfToday = new Date(referenceDate);
  endOfToday.setHours(23, 59, 59, 999);

  return dueDate <= endOfToday;
};

/**
 * Filters all leads that have an active cadence step due
 */
export const getDueCadenceTasks = (
  leads: Lead[],
  referenceDate: Date = new Date()
): { lead: Lead; step: CadenceStepConfig; isOverdue: boolean }[] => {
  const tasks: { lead: Lead; step: CadenceStepConfig; isOverdue: boolean }[] = [];

  for (const lead of leads) {
    if (lead.cadenceState && lead.cadenceState.status === 'active') {
      const cadence = getCadencePreset(lead.cadenceState.id);
      if (!cadence) continue;

      const currentStep = cadence.steps[lead.cadenceState.currentStepIndex];
      if (!currentStep) continue;

      const dueDate = new Date(lead.cadenceState.nextStepDueDate);
      const now = referenceDate;
      const isDue = isCadenceStepDue(lead, now);

      if (isDue) {
        tasks.push({
          lead,
          step: currentStep,
          isOverdue: dueDate < now
        });
      }
    }
  }

  return tasks;
};
