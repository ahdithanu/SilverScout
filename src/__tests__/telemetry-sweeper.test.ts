import test from 'node:test';
import assert from 'node:assert/strict';
import { Lead } from '../types';

interface AgentExecutionStep {
  stageId: 'scout' | 'permit' | 'ghost' | 'underwriter';
  agentName: string;
  action: string;
  latencyMs: number;
}

function simulateMultiAgentSweep(leads: Lead[]): {
  steps: AgentExecutionStep[];
  scoredCount: number;
  highPropensityCount: number;
  totalLatencyMs: number;
  telemetryLogs: string[];
} {
  const steps: AgentExecutionStep[] = [];
  const telemetryLogs: string[] = [];
  let highPropensity = 0;

  for (let i = 0; i < leads.length; i++) {
    const lead = leads[i];
    
    // Stage 1: Scout Agent
    steps.push({
      stageId: 'scout',
      agentName: 'ScoutAgent',
      action: `Scanned Secretary of State vintage for ${lead.name}`,
      latencyMs: 45
    });
    telemetryLogs.push(`[ScoutAgent] Verified registration for ${lead.name} (${lead.registrationDate})`);

    // Stage 2: Permit Auditor
    const permitDrop = lead.permitDrop || 0;
    steps.push({
      stageId: 'permit',
      agentName: 'PermitAuditor',
      action: `Calculated 3-year permit contraction: ${permitDrop}%`,
      latencyMs: 35
    });
    if (permitDrop >= 30) {
      telemetryLogs.push(`[PermitAuditor] ALERT: Permit contraction ${permitDrop}% triggers owner fatigue`);
    }

    // Stage 3: Ghost Hunter
    steps.push({
      stageId: 'ghost',
      agentName: 'GhostHunter',
      action: `Scanned digital reviews (${lead.reviewVelocity}/mo) and social cadence`,
      latencyMs: 25
    });
    telemetryLogs.push(`[GhostHunter] Digital presence audited: review velocity ${lead.reviewVelocity}/mo`);

    // Stage 4: PE Underwriter
    const score = lead.exitPropensityScore || 8.0;
    if (score >= 8) highPropensity++;
    steps.push({
      stageId: 'underwriter',
      agentName: 'PEUnderwriter',
      action: `Generated investment thesis and modeled 4.5x EBITDA multiple`,
      latencyMs: 65
    });
    telemetryLogs.push(`[PEUnderwriter] Exit Propensity Score: ${score}/10. Valuation: $${((lead.valuationEstimate || 3000000) / 1000000).toFixed(2)}M`);
  }

  const totalLatencyMs = steps.reduce((sum, s) => sum + s.latencyMs, 0);

  return {
    steps,
    scoredCount: leads.length,
    highPropensityCount: highPropensity,
    totalLatencyMs,
    telemetryLogs
  };
}

test('Multi-Agent Deal Intelligence Sweeper Engine', async (t) => {
  const mockLeads: Lead[] = [
    {
      id: 'lead-1',
      fundId: 'redwood-cap',
      name: 'Stockton Heating, Air & Controls',
      industry: 'HVAC & Mechanical',
      location: 'Stockton, CA',
      registrationDate: '1982-01-14',
      agentName: 'Thomas Miller',
      isCorporateAgent: false,
      permitVolume2023_2025: 58,
      permitVolume2026: 16,
      permitDrop: 72,
      lastDigitalPostDate: '2021-01-12',
      reviewVelocity: 0.1,
      revenue: 3800000,
      ebitda: 836000,
      profitMargin: 22,
      valuationEstimate: 3762000,
      exitPropensityScore: 9.6,
      status: 'qualified',
      aiThesis: 'High-margin HVAC platform candidate',
      dealSourceChannel: 'OFF_MARKET_SCOUT'
    },
    {
      id: 'lead-2',
      fundId: 'redwood-cap',
      name: 'San Jose Commercial Plumbing',
      industry: 'Commercial Plumbing',
      location: 'San Jose, CA',
      registrationDate: '2001-03-22',
      agentName: 'Law Corp',
      isCorporateAgent: true,
      permitVolume2023_2025: 120,
      permitVolume2026: 110,
      permitDrop: 8,
      lastDigitalPostDate: '2026-03-01',
      reviewVelocity: 3.5,
      revenue: 5500000,
      ebitda: 1100000,
      profitMargin: 20,
      valuationEstimate: 4950000,
      exitPropensityScore: 5.4,
      status: 'new',
      aiThesis: 'Stable corporate plumbing operation',
      dealSourceChannel: 'OFF_MARKET_SCOUT'
    }
  ];

  await t.test('executes all 4 autonomous agent stages in correct sequence', () => {
    const sweep = simulateMultiAgentSweep(mockLeads);
    assert.equal(sweep.scoredCount, 2);
    assert.equal(sweep.steps.length, 8); // 4 stages * 2 leads
    assert.equal(sweep.steps[0].stageId, 'scout');
    assert.equal(sweep.steps[1].stageId, 'permit');
    assert.equal(sweep.steps[2].stageId, 'ghost');
    assert.equal(sweep.steps[3].stageId, 'underwriter');
  });

  await t.test('identifies high-propensity acquisition target with permit contraction alert', () => {
    const sweep = simulateMultiAgentSweep(mockLeads);
    assert.equal(sweep.highPropensityCount, 1);
    const alertLogs = sweep.telemetryLogs.filter(l => l.includes('ALERT: Permit contraction'));
    assert.ok(alertLogs.length >= 1);
    assert.ok(alertLogs[0].includes('72%'));
  });

  await t.test('computes predictable distributed telemetry latency metrics', () => {
    const sweep = simulateMultiAgentSweep(mockLeads);
    assert.ok(sweep.totalLatencyMs > 0);
    assert.equal(sweep.totalLatencyMs, (45 + 35 + 25 + 65) * 2);
  });
});
