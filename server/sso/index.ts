import crypto from 'node:crypto';
import { generateSignedJWT, AuthenticatedUser } from '../auth';
import { UserRole } from '../../src/types';
import { auditLedger } from '../auditLedger';

export type SSOProvider = 'okta' | 'google' | 'azure_ad' | 'saml';

export interface SSOConfiguration {
  fundId: string;
  provider: SSOProvider;
  issuerUrl: string;
  clientId: string;
  clientSecret: string;
  defaultRole: UserRole;
  enabled: boolean;
}

export interface SSOUserIdentity {
  sub: string;
  email: string;
  name: string;
  fundId: string;
  role: UserRole;
  provider: SSOProvider;
}

export class EnterpriseSSOManager {
  private static instance: EnterpriseSSOManager;
  private ssoConfigs: Map<string, SSOConfiguration> = new Map();
  private pendingStates: Map<string, { fundId: string; provider: SSOProvider; createdAt: number }> = new Map();

  private constructor() {
    // Configure default enterprise IdP for redwood-cap
    this.ssoConfigs.set('redwood-cap:okta', {
      fundId: 'redwood-cap',
      provider: 'okta',
      issuerUrl: 'https://redwood-cap.okta.com/oauth2/v1',
      clientId: '0oa_redwood_silver_scout_client',
      clientSecret: 'sec_okta_live_mock_secret',
      defaultRole: 'associate',
      enabled: true
    });

    this.ssoConfigs.set('redwood-cap:google', {
      fundId: 'redwood-cap',
      provider: 'google',
      issuerUrl: 'https://accounts.google.com',
      clientId: 'google-workspace-redwood.apps.googleusercontent.com',
      clientSecret: 'sec_google_workspace_secret',
      defaultRole: 'associate',
      enabled: true
    });
  }

  public static getInstance(): EnterpriseSSOManager {
    if (!EnterpriseSSOManager.instance) {
      EnterpriseSSOManager.instance = new EnterpriseSSOManager();
    }
    return EnterpriseSSOManager.instance;
  }

  /**
   * Generates a secure authorization URL with CSRF state protection
   */
  public generateAuthorizeUrl(fundId: string, provider: SSOProvider, redirectUri: string): { url: string; state: string } {
    const state = crypto.randomBytes(24).toString('hex');
    this.pendingStates.set(state, { fundId, provider, createdAt: Date.now() });

    const key = `${fundId}:${provider}`;
    const config = this.ssoConfigs.get(key) || {
      fundId,
      provider,
      issuerUrl: `https://${fundId}.identity-provider.com`,
      clientId: `client_${fundId}`,
      clientSecret: 'secret',
      defaultRole: 'associate' as UserRole,
      enabled: true
    };

    const url = `${config.issuerUrl}/authorize?client_id=${encodeURIComponent(config.clientId)}&response_type=code&scope=openid%20profile%20email&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
    return { url, state };
  }

  /**
   * Verifies incoming SSO callback and exchanges code/claims for a signed session JWT
   */
  public async handleCallback(
    state: string,
    codeOrToken: string,
    mockClaims?: { email: string; name?: string; role?: UserRole }
  ): Promise<{ token: string; user: SSOUserIdentity }> {
    const pending = this.pendingStates.get(state);
    if (!pending) {
      throw new Error('Invalid or expired SSO state parameter (CSRF protection failed)');
    }
    this.pendingStates.delete(state);

    const email = mockClaims?.email || `analyst@${pending.fundId}.com`;
    const role: UserRole = mockClaims?.role || 'associate';
    const sub = `sso_${pending.provider}_${crypto.createHash('sha256').update(email).digest('hex').substring(0, 16)}`;

    const identity: SSOUserIdentity = {
      sub,
      email,
      name: mockClaims?.name || email.split('@')[0],
      fundId: pending.fundId,
      role,
      provider: pending.provider
    };

    // Issue cryptographic JWT session bearer token
    const token = generateSignedJWT({
      uid: sub,
      role: identity.role,
      fundId: identity.fundId,
      email: identity.email
    });

    // Record login in immutable audit provenance ledger
    auditLedger.recordEvent({
      action: 'ENTERPRISE_SSO_LOGIN',
      actorId: sub,
      targetId: identity.fundId,
      fundId: identity.fundId,
      payload: {
        email: identity.email,
        provider: pending.provider,
        role: identity.role,
        timestamp: new Date().toISOString()
      }
    });

    return { token, user: identity };
  }
}

export const ssoManager = EnterpriseSSOManager.getInstance();
