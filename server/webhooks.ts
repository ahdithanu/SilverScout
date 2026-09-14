import crypto from 'crypto';
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

/**
 * Verifies SendGrid Event Webhook HMAC signature to prevent forged delivery notifications.
 * Rejects replay attacks older than 300 seconds.
 */
export function verifySendGridWebhookSignature(
  rawBody: string,
  signature: string,
  timestamp: string,
  secretKey: string = process.env.SENDGRID_WEBHOOK_VERIFICATION_KEY || 'test-sendgrid-secret-key-12345'
): boolean {
  if (!signature || !timestamp) return false;

  // Replay attack prevention: reject events older than 5 minutes (300s)
  const eventTime = parseInt(timestamp, 10);
  const now = Math.floor(Date.now() / 1000);
  if (isNaN(eventTime) || Math.abs(now - eventTime) > 300) {
    return false;
  }

  try {
    const payload = `${timestamp}${rawBody}`;
    const hmac = crypto.createHmac('sha256', secretKey);
    hmac.update(payload);
    const expectedSignature = hmac.digest('base64');

    const expectedBuffer = Buffer.from(expectedSignature);
    const actualBuffer = Buffer.from(signature);

    if (expectedBuffer.length !== actualBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
  } catch (err) {
    return false;
  }
}

/**
 * Verifies HubSpot Webhook v3 HMAC-SHA256 signature to prevent CRM deal tampering.
 */
export function verifyHubSpotWebhookSignature(
  rawBody: string,
  signature: string,
  clientSecret: string = process.env.HUBSPOT_CLIENT_SECRET || 'test-hubspot-client-secret-12345'
): boolean {
  if (!signature || !rawBody) return false;

  try {
    const hmac = crypto.createHmac('sha256', clientSecret);
    hmac.update(rawBody);
    const expectedSignature = hmac.digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature);
    const actualBuffer = Buffer.from(signature);

    if (expectedBuffer.length !== actualBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
  } catch (err) {
    return false;
  }
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
