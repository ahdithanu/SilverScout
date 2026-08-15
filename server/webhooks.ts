import { outboxManager } from './outbox';
import { auditLedger } from './auditLedger';

export interface SendGridWebhookEvent {
  event: 'delivered' | 'opened' | 'clicked' | 'bounced' | 'spamreport';
  email: string;
  timestamp: number;
  idempotencyKey?: string;
  sg_message_id?: string;
}

export interface HubSpotWebhookEvent {
  eventId: string;
  subscriptionType: string;
  objectId: number;
  propertyName: string;
  propertyValue: string;
  changeSource: string;
}

export function processSendGridWebhookEvent(event: SendGridWebhookEvent): { success: boolean; eventProcessed: string } {
  const idempotencyKey = event.idempotencyKey || `sendgrid-msg-${event.sg_message_id || Date.now()}`;
  
  // Record audit entry in SHA-256 provenance chain
  auditLedger.recordEvent('redwood-cap', 'deal-101', `OUTREACH_EMAIL_${event.event.toUpperCase()}`, 'sendgrid-webhook', 'system', {
    email: event.email,
    event: event.event,
    timestamp: event.timestamp
  });

  if (event.idempotencyKey) {
    const outboxItem = outboxManager.getRecordByIdempotencyKey(event.idempotencyKey);
    if (outboxItem) {
      outboxItem.lastError = `SendGrid Event: ${event.event}`;
      if (event.event === 'delivered' || event.event === 'opened' || event.event === 'clicked') {
        outboxItem.status = 'COMPLETED';
      } else if (event.event === 'bounced' || event.event === 'spamreport') {
        outboxItem.status = 'DEAD_LETTER';
      }
    }
  }

  return {
    success: true,
    eventProcessed: `Processed SendGrid ${event.event} for ${event.email}`
  };
}

export function processHubSpotWebhookEvent(event: HubSpotWebhookEvent): { success: boolean; dealUpdated: string } {
  auditLedger.recordEvent('redwood-cap', `deal-${event.objectId}`, 'HUBSPOT_CRM_MUTATION', 'hubspot-webhook', 'system', {
    propertyName: event.propertyName,
    propertyValue: event.propertyValue,
    eventId: event.eventId
  });

  return {
    success: true,
    dealUpdated: `Updated deal ${event.objectId} property ${event.propertyName} to '${event.propertyValue}'`
  };
}
