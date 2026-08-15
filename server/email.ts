import dotenv from 'dotenv';

dotenv.config();

export interface EmailPayload {
  toEmail: string;
  recipientName: string;
  subject: string;
  body: string;
  leadId: string;
  senderName?: string;
}

export interface EmailDispatchResult {
  success: boolean;
  messageId?: string;
  error?: string;
  timestamp: string;
  provider: 'sendgrid' | 'simulated';
}

export async function sendOutreachEmail(payload: EmailPayload): Promise<EmailDispatchResult> {
  const sendgridApiKey = process.env.SENDGRID_API_KEY;

  if (sendgridApiKey) {
    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sendgridApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personalizations: [{
            to: [{ email: payload.toEmail, name: payload.recipientName }]
          }],
          from: { email: process.env.SENDGRID_FROM_EMAIL || 'outreach@silverscout.ai', name: payload.senderName || 'Silver Scout Partners' },
          subject: payload.subject,
          content: [{ type: 'text/plain', value: payload.body }]
        })
      });

      if (response.ok) {
        return {
          success: true,
          messageId: `sg-${Date.now()}`,
          timestamp: new Date().toISOString(),
          provider: 'sendgrid'
        };
      } else {
        const errText = await response.text();
        return {
          success: false,
          error: `SendGrid API Error: ${errText}`,
          timestamp: new Date().toISOString(),
          provider: 'sendgrid'
        };
      }
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Network error connecting to SendGrid API',
        timestamp: new Date().toISOString(),
        provider: 'sendgrid'
      };
    }
  }

  // Simulated Dispatcher when SENDGRID_API_KEY is not set
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        success: true,
        messageId: `sim-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toISOString(),
        provider: 'simulated'
      });
    }, 400);
  });
}
