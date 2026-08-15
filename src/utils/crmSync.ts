import { Lead } from '../types';

export interface HubSpotDealPayload {
  properties: {
    dealname: string;
    pipeline: string;
    dealstage: string;
    amount: string;
    industry: string;
    location: string;
    owner_name: string;
    exit_propensity_score: string;
    permit_drop_pct: string;
    valuation_estimate: string;
  };
}

export interface CRMSyncResult {
  success: boolean;
  crmType: 'hubspot' | 'salesforce';
  dealId: string;
  syncedAt: string;
  message: string;
}

export function formatHubSpotDealPayload(lead: Lead): HubSpotDealPayload {
  const stageMap: Record<string, string> = {
    new: 'appointmentscheduled',
    analyzing: 'qualifiedtobuy',
    qualified: 'presentationconfigured',
    outreach_triggered: 'decisionmakerboughtin',
    loi_submitted: 'contractsent',
    under_contract: 'closedwon',
    archived: 'closedlost'
  };

  return {
    properties: {
      dealname: `${lead.name} (${lead.industry})`,
      pipeline: 'default',
      dealstage: stageMap[lead.status] || 'appointmentscheduled',
      amount: String(lead.valuationEstimate || lead.revenue || 3500000),
      industry: lead.industry,
      location: lead.location,
      owner_name: lead.agentName || 'Owner',
      exit_propensity_score: String(lead.exitPropensityScore || 5),
      permit_drop_pct: String(lead.permitDrop || 0),
      valuation_estimate: String(lead.valuationEstimate || 3500000)
    }
  };
}

export async function syncLeadToCRM(lead: Lead, crmType: 'hubspot' | 'salesforce' = 'hubspot'): Promise<CRMSyncResult> {
  const payload = formatHubSpotDealPayload(lead);
  
  // Simulated Webhook Endpoint Sync
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        success: true,
        crmType,
        dealId: `${crmType.toUpperCase()}-DEAL-${Date.now()}`,
        syncedAt: new Date().toISOString(),
        message: `Successfully pushed '${lead.name}' deal into ${crmType === 'hubspot' ? 'HubSpot CRM' : 'Salesforce'}`
      });
    }, 450);
  });
}
