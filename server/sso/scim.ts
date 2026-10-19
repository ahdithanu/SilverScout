import crypto from 'node:crypto';
import { UserRole } from '../../src/types';
import { auditLedger } from '../auditLedger';

export interface SCIMUser {
  id: string;
  externalId?: string;
  userName: string;
  name: {
    formatted: string;
    familyName?: string;
    givenName?: string;
  };
  emails: Array<{ value: string; primary: boolean }>;
  roles: Array<{ value: UserRole }>;
  active: boolean;
  meta: {
    resourceType: 'User';
    created: string;
    lastModified: string;
  };
}

const DEFAULT_SCIM_TOKEN = process.env.SCIM_BEARER_TOKEN || 'scim-enterprise-zero-trust-secret-key-32ch';

export class SCIMProvisioningManager {
  private static instance: SCIMProvisioningManager;
  private users: Map<string, SCIMUser> = new Map();

  private constructor() {
    // Seed default Redwood Capital users
    this.seedUser('redwood-cap', {
      id: 'scim_usr_1',
      userName: 'partner@redwood-cap.com',
      name: { formatted: 'Managing Partner', givenName: 'Managing', familyName: 'Partner' },
      emails: [{ value: 'partner@redwood-cap.com', primary: true }],
      roles: [{ value: 'partner' }],
      active: true,
      meta: {
        resourceType: 'User',
        created: new Date().toISOString(),
        lastModified: new Date().toISOString()
      }
    });

    this.seedUser('redwood-cap', {
      id: 'scim_usr_2',
      userName: 'associate@redwood-cap.com',
      name: { formatted: 'Investment Associate', givenName: 'Investment', familyName: 'Associate' },
      emails: [{ value: 'associate@redwood-cap.com', primary: true }],
      roles: [{ value: 'associate' }],
      active: true,
      meta: {
        resourceType: 'User',
        created: new Date().toISOString(),
        lastModified: new Date().toISOString()
      }
    });
  }

  public static getInstance(): SCIMProvisioningManager {
    if (!SCIMProvisioningManager.instance) {
      SCIMProvisioningManager.instance = new SCIMProvisioningManager();
    }
    return SCIMProvisioningManager.instance;
  }

  private userKey(fundId: string, id: string): string {
    return `${fundId}:${id}`;
  }

  private seedUser(fundId: string, user: SCIMUser): void {
    this.users.set(this.userKey(fundId, user.id), user);
  }

  /**
   * Verifies SCIM 2.0 Authorization Header
   */
  public verifyAuthorization(authHeader?: string): boolean {
    if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
    const token = authHeader.substring(7).trim();
    return token === DEFAULT_SCIM_TOKEN;
  }

  /**
   * SCIM 2.0: List Users (RFC 7644 section 3.4.2)
   */
  public listUsers(fundId: string, startIndex: number = 1, count: number = 50): {
    schemas: string[];
    totalResults: number;
    startIndex: number;
    itemsPerPage: number;
    Resources: SCIMUser[];
  } {
    const fundUsers = Array.from(this.users.entries())
      .filter(([k]) => k.startsWith(`${fundId}:`))
      .map(([, u]) => u);

    const start = Math.max(0, startIndex - 1);
    const paginated = fundUsers.slice(start, start + count);

    return {
      schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
      totalResults: fundUsers.length,
      startIndex,
      itemsPerPage: paginated.length,
      Resources: paginated
    };
  }

  /**
   * SCIM 2.0: Get User by ID (RFC 7644 section 3.4.1)
   */
  public getUser(fundId: string, id: string): SCIMUser | null {
    return this.users.get(this.userKey(fundId, id)) || null;
  }

  /**
   * SCIM 2.0: Create / Provision User (RFC 7644 section 3.3)
   */
  public createUser(fundId: string, payload: any): SCIMUser {
    const id = payload.id || `scim_usr_${crypto.randomBytes(6).toString('hex')}`;
    const email = payload.userName || (payload.emails && payload.emails[0]?.value) || `user_${id}@${fundId}.com`;
    const role: UserRole = (payload.roles && payload.roles[0]?.value) || 'analyst';

    const newUser: SCIMUser = {
      id,
      externalId: payload.externalId,
      userName: email,
      name: {
        formatted: payload.name?.formatted || payload.displayName || email.split('@')[0],
        givenName: payload.name?.givenName,
        familyName: payload.name?.familyName
      },
      emails: [{ value: email, primary: true }],
      roles: [{ value: role }],
      active: payload.active !== false,
      meta: {
        resourceType: 'User',
        created: new Date().toISOString(),
        lastModified: new Date().toISOString()
      }
    };

    this.users.set(this.userKey(fundId, id), newUser);

    auditLedger.recordEvent({
      action: 'SCIM_USER_PROVISIONED',
      actorId: 'scim-directory-sync',
      targetId: id,
      fundId,
      payload: { userName: email, role, active: newUser.active }
    });

    return newUser;
  }

  /**
   * SCIM 2.0: Update User (RFC 7644 section 3.5.1)
   */
  public updateUser(fundId: string, id: string, payload: any): SCIMUser {
    const existing = this.getUser(fundId, id);
    if (!existing) {
      throw new Error(`User ${id} not found`);
    }

    const updatedRole: UserRole = (payload.roles && payload.roles[0]?.value) || existing.roles[0]?.value || 'analyst';
    const updated: SCIMUser = {
      ...existing,
      active: typeof payload.active === 'boolean' ? payload.active : existing.active,
      roles: [{ value: updatedRole }],
      meta: {
        ...existing.meta,
        lastModified: new Date().toISOString()
      }
    };

    this.users.set(this.userKey(fundId, id), updated);

    auditLedger.recordEvent({
      action: 'SCIM_USER_UPDATED',
      actorId: 'scim-directory-sync',
      targetId: id,
      fundId,
      payload: { active: updated.active, role: updatedRole }
    });

    return updated;
  }

  /**
   * SCIM 2.0: De-provision / Delete User (RFC 7644 section 3.6)
   */
  public deleteUser(fundId: string, id: string): boolean {
    const key = this.userKey(fundId, id);
    const existing = this.users.get(key);
    if (!existing) return false;

    this.users.delete(key);

    auditLedger.recordEvent({
      action: 'SCIM_USER_DEPROVISIONED',
      actorId: 'scim-directory-sync',
      targetId: id,
      fundId,
      payload: { deletedUserId: id, userName: existing.userName }
    });

    return true;
  }
}

export const scimManager = SCIMProvisioningManager.getInstance();
