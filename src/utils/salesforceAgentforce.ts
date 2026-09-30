import crypto from 'crypto';
import { Lead } from '../types';

/**
 * Salesforce Data Cloud DMO (Data Model Object) Schema Definitions
 * Enables Zero-Copy federated data access without duplicating CRM records.
 */
export interface SalesforceDataCloudLeadDMO {
  Id: string;
  DataSource: 'SilverScout_Proprietary_Radar';
  UnifiedIndividualId: string;
  CompanyName__c: string;
  IndustryCode__c: string;
  LocationCityState__c: string;
  ExitPropensityIndex__c: number; // 1-10
  PermitDropPercentage__c: number;
  EstimatedEnterpriseValue__c: number;
  CurrentDealStage__c: string;
  LastDigitalPostDate__c: string;
  IdentifiedOwnerName__c: string;
  VerifiedBusinessPhone__c?: string;
  PhysicalStorefrontAddress__c?: string;
  IngestionTimestamp: string;
}

/**
 * Salesforce Agentforce Action Schema
 * Defines declarative Actions callable by Agentforce autonomous agents via APEX / Flow.
 */
export interface AgentforceActionDefinition {
  actionName: string;
  actionType: 'APEX' | 'AUTOLAUNCHED_FLOW' | 'EXTERNAL_REST';
  topic: string;
  description: string;
  inputParameters: Record<string, { type: string; required: boolean; description: string }>;
  outputParameters: Record<string, { type: string; description: string }>;
}

export interface AgentforceTopicConfiguration {
  topicName: string;
  classification: string;
  systemPromptInstruction: string;
  supportedActions: AgentforceActionDefinition[];
}

export class SalesforceAgentforceConnector {
  /**
   * Transforms a SilverScout Lead into a standard Salesforce Data Cloud DMO record
   */
  public static mapLeadToDataCloudDMO(lead: Lead): SalesforceDataCloudLeadDMO {
    return {
      Id: `SFDC-DMO-${lead.id}`,
      DataSource: 'SilverScout_Proprietary_Radar',
      UnifiedIndividualId: `UI-${crypto.createHash('sha256').update(lead.agentName || lead.name).digest('hex').substring(0, 16)}`,
      CompanyName__c: lead.name,
      IndustryCode__c: lead.industry,
      LocationCityState__c: lead.location,
      ExitPropensityIndex__c: lead.exitPropensityScore,
      PermitDropPercentage__c: lead.permitDrop,
      EstimatedEnterpriseValue__c: lead.valuationEstimate,
      CurrentDealStage__c: lead.status,
      LastDigitalPostDate__c: lead.lastDigitalPostDate,
      IdentifiedOwnerName__c: lead.agentName || 'Owner',
      VerifiedBusinessPhone__c: lead.phone || lead.businessProfile?.phone,
      PhysicalStorefrontAddress__c: lead.address || lead.businessProfile?.streetAddress,
      IngestionTimestamp: new Date().toISOString()
    };
  }

  /**
   * Generates the Agentforce Topic configuration for Search Fund M&A Sourcing
   */
  public static getAgentforceTopicConfig(): AgentforceTopicConfiguration {
    return {
      topicName: 'SMB_Succession_Acquisition',
      classification: 'Private_Equity_Deal_Origination',
      systemPromptInstruction: `You are an institutional Private Equity Agentforce Assistant specialized in SMB acquisitions.
When a user asks to underwrite a contractor, calculate purchase multiples, or generate an LOI, invoke the appropriate Action.
Always verify that the target has positive adjusted EBITDA before suggesting an LOI.`,
      supportedActions: [
        {
          actionName: 'calculate_lbo_returns',
          actionType: 'APEX',
          topic: 'SMB_Succession_Acquisition',
          description: 'Calculates senior debt tranches, sponsor equity, MOIC, and IRR based on purchase price and EBITDA.',
          inputParameters: {
            purchasePrice: { type: 'Currency', required: true, description: 'Total acquisition cost' },
            ebitda: { type: 'Currency', required: true, description: 'Trailing 12-month EBITDA' },
            seniorDebtPercent: { type: 'Percent', required: false, description: 'Senior debt percentage (default 60%)' }
          },
          outputParameters: {
            seniorDebtAmount: { type: 'Currency', description: 'Total debt funded' },
            sponsorEquity: { type: 'Currency', description: 'Total equity required' },
            moic: { type: 'Double', description: 'Multiple on Invested Capital over 5 years' },
            irr: { type: 'Percent', description: 'Internal Rate of Return' }
          }
        },
        {
          actionName: 'generate_confidential_loi',
          actionType: 'AUTOLAUNCHED_FLOW',
          topic: 'SMB_Succession_Acquisition',
          description: 'Auto-launches a Salesforce Flow to generate and save a non-binding acquisition Letter of Intent.',
          inputParameters: {
            leadId: { type: 'String', required: true, description: 'Salesforce Lead / Opportunity record ID' },
            purchasePrice: { type: 'Currency', required: true, description: 'Proposed valuation' },
            sellerNotePercent: { type: 'Percent', required: false, description: 'Seller financing percentage' }
          },
          outputParameters: {
            documentId: { type: 'String', description: 'ContentDocumentId of the generated PDF LOI' },
            flowExecutionStatus: { type: 'String', description: 'SUCCESS or PENDING_APPROVAL' }
          }
        }
      ]
    };
  }

  /**
   * Validates inbound Salesforce Flow Webhook HMAC-SHA256 signature
   */
  public static verifySalesforceWebhookSignature(
    rawPayload: string,
    signatureHeader: string,
    sharedSecret = process.env.SALESFORCE_WEBHOOK_SECRET || 'sfdc_test_webhook_secret_12345'
  ): boolean {
    if (!rawPayload || !signatureHeader) return false;

    try {
      const hmac = crypto.createHmac('sha256', sharedSecret);
      hmac.update(rawPayload);
      const expectedSignature = hmac.digest('hex');

      const expectedBuffer = Buffer.from(expectedSignature);
      const actualBuffer = Buffer.from(signatureHeader);

      if (expectedBuffer.length !== actualBuffer.length) return false;
      return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
    } catch {
      return false;
    }
  }
}
