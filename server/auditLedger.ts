import crypto from 'node:crypto';

export interface AuditLedgerBlock {
  blockIndex: number;
  previousHash: string;
  currentHash: string;
  fundId: string;
  dealId: string;
  action: string;
  actorId: string;
  actorRole: string;
  payloadHash: string;
  timestamp: string;
}

export class AuditProvenanceLedger {
  private chain: AuditLedgerBlock[] = [];

  constructor() {
    // Genesis Block
    const genesisTimestamp = new Date('2026-01-01T00:00:00.000Z').toISOString();
    const genesisHash = this.computeHash(0, '0'.repeat(64), 'GENESIS_BLOCK', 'system', 'system', 'system', genesisTimestamp);
    this.chain.push({
      blockIndex: 0,
      previousHash: '0'.repeat(64),
      currentHash: genesisHash,
      fundId: 'system',
      dealId: 'system',
      action: 'GENESIS',
      actorId: 'system',
      actorRole: 'system',
      payloadHash: 'system',
      timestamp: genesisTimestamp
    });
  }

  private computeHash(
    index: number,
    previousHash: string,
    action: string,
    fundId: string,
    dealId: string,
    actorId: string,
    timestamp: string,
    payloadHash: string = ''
  ): string {
    const raw = `${index}:${previousHash}:${action}:${fundId}:${dealId}:${actorId}:${timestamp}:${payloadHash}`;
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  public recordEvent(
    fundIdOrOpts: string | { fundId: string; dealId?: string; targetId?: string; action: string; actorId: string; actorRole?: string; payload?: Record<string, any> },
    dealId?: string,
    action?: string,
    actorId?: string,
    actorRole?: string,
    payload?: Record<string, any>
  ): AuditLedgerBlock {
    let fId: string;
    let dId: string;
    let act: string;
    let aId: string;
    let aRole: string;
    let pLoad: Record<string, any>;

    if (typeof fundIdOrOpts === 'object') {
      fId = fundIdOrOpts.fundId;
      dId = fundIdOrOpts.dealId || fundIdOrOpts.targetId || 'global';
      act = fundIdOrOpts.action;
      aId = fundIdOrOpts.actorId;
      aRole = fundIdOrOpts.actorRole || 'system';
      pLoad = fundIdOrOpts.payload || {};
    } else {
      fId = fundIdOrOpts;
      dId = dealId || 'global';
      act = action || 'UNKNOWN_ACTION';
      aId = actorId || 'system';
      aRole = actorRole || 'system';
      pLoad = payload || {};
    }

    const previousBlock = this.chain[this.chain.length - 1];
    const blockIndex = previousBlock.blockIndex + 1;
    const timestamp = new Date().toISOString();
    const payloadHash = crypto.createHash('sha256').update(JSON.stringify(pLoad)).digest('hex');
    
    const currentHash = this.computeHash(
      blockIndex,
      previousBlock.currentHash,
      act,
      fId,
      dId,
      aId,
      timestamp,
      payloadHash
    );

    const block: AuditLedgerBlock = {
      blockIndex,
      previousHash: previousBlock.currentHash,
      currentHash,
      fundId: fId,
      dealId: dId,
      action: act,
      actorId: aId,
      actorRole: aRole,
      payloadHash,
      timestamp
    };

    this.chain.push(block);
    return block;
  }

  public getChain(): AuditLedgerBlock[] {
    return [...this.chain];
  }

  public getChainForDeal(fundId: string, dealId: string): AuditLedgerBlock[] {
    return this.chain.filter(b => b.fundId === fundId && b.dealId === dealId);
  }

  public verifyChainIntegrity(): { valid: boolean; brokenBlockIndex?: number } {
    for (let i = 1; i < this.chain.length; i++) {
      const current = this.chain[i];
      const previous = this.chain[i - 1];

      if (current.previousHash !== previous.currentHash) {
        return { valid: false, brokenBlockIndex: i };
      }

      const expectedHash = this.computeHash(
        current.blockIndex,
        current.previousHash,
        current.action,
        current.fundId,
        current.dealId,
        current.actorId,
        current.timestamp,
        current.payloadHash
      );

      if (current.currentHash !== expectedHash) {
        return { valid: false, brokenBlockIndex: i };
      }
    }
    return { valid: true };
  }
}

export const auditLedger = new AuditProvenanceLedger();
