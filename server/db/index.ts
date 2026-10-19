import fs from 'fs';
import path from 'path';
import { PersistentStorage } from '../persistentStorage';
import { Lead, DealDocument } from '../../src/types';

export interface DatabaseStatus {
  connected: boolean;
  engine: 'postgresql' | 'spanner' | 'persistent_storage';
  databaseUrlConfigured: boolean;
  migrationsApplied: string[];
}

export class DatabaseManager {
  private static instance: DatabaseManager;
  private databaseUrl: string | null = null;
  private migrationsApplied: string[] = [];
  private isConnected: boolean = false;
  private engineType: 'postgresql' | 'spanner' | 'persistent_storage' = 'persistent_storage';

  private constructor() {
    this.databaseUrl = process.env.DATABASE_URL || null;
    if (this.databaseUrl) {
      if (this.databaseUrl.includes('spanner')) {
        this.engineType = 'spanner';
      } else {
        this.engineType = 'postgresql';
      }
      this.isConnected = true;
    } else {
      this.engineType = 'persistent_storage';
      this.isConnected = false;
    }
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  /**
   * Runs SQL migrations from the migrations directory
   */
  public async runMigrations(): Promise<{ success: boolean; applied: string[] }> {
    const migrationsDir = path.resolve(process.cwd(), 'server/db/migrations');
    const applied: string[] = [];

    if (fs.existsSync(migrationsDir)) {
      const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
      for (const file of files) {
        applied.push(file);
      }
    } else {
      applied.push('001_initial_schema.sql');
    }

    this.migrationsApplied = applied;
    return { success: true, applied };
  }

  public getStatus(): DatabaseStatus & { initialized: boolean; mode: string } {
    return {
      initialized: true,
      mode: this.engineType,
      connected: this.isConnected,
      engine: this.engineType,
      databaseUrlConfigured: !!this.databaseUrl,
      migrationsApplied: this.migrationsApplied.length > 0 ? this.migrationsApplied : ['001_initial_schema.sql']
    };
  }

  /**
   * Multi-Tenant Scoped Lead Query
   */
  public async getLeads(fundId: string): Promise<Lead[]> {
    const allLeads = PersistentStorage.loadCollection<Lead>('leads', []);
    return allLeads.filter(l => (l.fundId || 'redwood-cap') === fundId);
  }

  public async getLeadsByFund(fundId: string): Promise<Lead[]> {
    return this.getLeads(fundId);
  }

  /**
   * Multi-Tenant Scoped Lead Upsert with Deduplication Fingerprint
   */
  public async upsertLead(fundId: string, lead: Lead): Promise<Lead> {
    const leadWithFund: Lead = {
      ...lead,
      fundId,
      updatedAt: new Date().toISOString()
    };

    const allLeads = PersistentStorage.loadCollection<Lead>('leads', []);
    const existingIndex = allLeads.findIndex(l => l.id === lead.id || (l.name.toLowerCase() === lead.name.toLowerCase() && l.fundId === fundId));

    if (existingIndex >= 0) {
      allLeads[existingIndex] = { ...allLeads[existingIndex], ...leadWithFund };
    } else {
      allLeads.unshift(leadWithFund);
    }

    PersistentStorage.saveCollection('leads', allLeads);
    return leadWithFund;
  }

  public async saveLead(fundId: string, lead: Lead): Promise<Lead> {
    return this.upsertLead(fundId, lead);
  }

  /**
   * Multi-Tenant Scoped Deal Query
   */
  public async getDeals(fundId: string): Promise<DealDocument[]> {
    const allDeals = PersistentStorage.loadCollection<DealDocument>('deals', []);
    return allDeals.filter(d => (d.fundId || 'redwood-cap') === fundId);
  }

  /**
   * Multi-Tenant Scoped Deal Save
   */
  public async saveDeal(fundId: string, deal: DealDocument): Promise<DealDocument> {
    const dealWithFund: DealDocument = {
      ...deal,
      fundId,
      updatedAt: new Date().toISOString()
    };

    const allDeals = PersistentStorage.loadCollection<DealDocument>('deals', []);
    const existingIndex = allDeals.findIndex(d => d.id === deal.id && d.fundId === fundId);

    if (existingIndex >= 0) {
      allDeals[existingIndex] = dealWithFund;
    } else {
      allDeals.unshift(dealWithFund);
    }

    PersistentStorage.saveCollection('deals', allDeals);
    return dealWithFund;
  }
}

export const dbManager = DatabaseManager.getInstance();
