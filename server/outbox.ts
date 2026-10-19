import { TransactionalOutboxRecord } from '../src/types';
import { PersistentStorage } from './persistentStorage';
import { auditLedger } from './auditLedger';

export class TransactionalOutboxManager {
  private outboxMap = new Map<string, TransactionalOutboxRecord>();
  private storageKey?: string;

  constructor(storageKey?: string) {
    this.storageKey = storageKey;
    if (this.storageKey) {
      this.reloadFromDisk();
    }
  }

  /**
   * Reloads persisted outbox state from durable volume storage (survives container restarts)
   */
  public reloadFromDisk(): void {
    if (!this.storageKey) return;
    const persisted = PersistentStorage.loadCollection<TransactionalOutboxRecord>(this.storageKey, []);
    this.outboxMap.clear();
    for (const record of persisted) {
      // Recover any crash-interrupted PROCESSING jobs back to PENDING
      if (record.status === 'PROCESSING') {
        record.status = 'PENDING';
      }
      this.outboxMap.set(record.outboxId, record);
    }
  }

  private flushToDisk(): void {
    if (!this.storageKey) return;
    PersistentStorage.saveCollection(this.storageKey, Array.from(this.outboxMap.values()));
  }

  public createOutboxRecord(
    fundId: string,
    dealId: string,
    eventType: 'SEND_OUTREACH_EMAIL' | 'SYNC_CRM_DEAL',
    payload: Record<string, any>,
    targetProvider: string = 'sendgrid'
  ): TransactionalOutboxRecord {
    const idempotencyKey = `${fundId}:${dealId}:${eventType}:v1:${targetProvider}`;
    const outboxId = `outbox-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // Check if idempotency key already exists (Completed or Pending)
    for (const record of this.outboxMap.values()) {
      if (record.idempotencyKey === idempotencyKey && record.status === 'COMPLETED') {
        return record; // Idempotent return existing completed record
      }
    }

    const record: TransactionalOutboxRecord = {
      outboxId,
      fundId,
      dealId,
      idempotencyKey,
      eventType,
      payload,
      status: 'PENDING',
      retryCount: 0,
      maxRetries: 3,
      nextAttemptAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    this.outboxMap.set(outboxId, record);
    this.flushToDisk();
    return record;
  }

  public getRecord(outboxId: string): TransactionalOutboxRecord | undefined {
    return this.outboxMap.get(outboxId);
  }

  public getRecordByIdempotencyKey(key: string): TransactionalOutboxRecord | undefined {
    for (const record of this.outboxMap.values()) {
      if (record.idempotencyKey === key) return record;
    }
    return undefined;
  }

  public async processPendingOutboxItem(
    outboxId: string,
    executor: (record: TransactionalOutboxRecord) => Promise<boolean>
  ): Promise<TransactionalOutboxRecord> {
    const record = this.outboxMap.get(outboxId);
    if (!record) throw new Error(`Outbox item ${outboxId} not found`);

    if (record.status === 'COMPLETED') {
      return record; // Zero duplicate side effects
    }

    record.status = 'PROCESSING';
    this.flushToDisk();

    try {
      const success = await executor(record);
      if (success) {
        record.status = 'COMPLETED';
        record.processedAt = new Date().toISOString();
      } else {
        throw new Error('Executor returned failure status');
      }
    } catch (err: any) {
      record.retryCount += 1;
      record.lastError = err.message || 'Execution error';
      if (record.retryCount >= record.maxRetries) {
        record.status = 'DEAD_LETTER';
      } else {
        record.status = 'PENDING';
        // Exponential backoff
        const delayMs = Math.pow(5, record.retryCount) * 1000;
        record.nextAttemptAt = new Date(Date.now() + delayMs).toISOString();
      }
    }

    this.outboxMap.set(outboxId, record);
    this.flushToDisk();
    return record;
  }

  /**
   * Drains all due PENDING outbox events for a specific tenant fund
   */
  public async drainPendingOutbox(
    fundId: string,
    executor?: (record: TransactionalOutboxRecord) => Promise<boolean>
  ): Promise<{ processed: number; succeeded: number; failed: number; deadLettered: number }> {
    const now = Date.now();
    let processed = 0;
    let succeeded = 0;
    let failed = 0;
    let deadLettered = 0;

    const defaultExecutor = async (_rec: TransactionalOutboxRecord) => true;
    const runExecutor = executor || defaultExecutor;

    for (const record of Array.from(this.outboxMap.values())) {
      if (record.fundId !== fundId) continue;
      if (record.status !== 'PENDING') continue;
      if (new Date(record.nextAttemptAt).getTime() > now) continue;

      processed++;
      const updated = await this.processPendingOutboxItem(record.outboxId, runExecutor);
      if (updated.status === 'COMPLETED') {
        succeeded++;
      } else if (updated.status === 'DEAD_LETTER') {
        deadLettered++;
      } else {
        failed++;
      }
    }

    return { processed, succeeded, failed, deadLettered };
  }

  /**
   * Re-queues a DEAD_LETTER record for operator-initiated replay and logs to Audit Ledger
   */
  public replayDeadLetter(outboxId: string, fundId: string, actorId: string = 'system_operator'): TransactionalOutboxRecord {
    const record = this.outboxMap.get(outboxId);
    if (!record || record.fundId !== fundId) {
      throw new Error(`Outbox item ${outboxId} not found for fund ${fundId}`);
    }
    if (record.status !== 'DEAD_LETTER') {
      throw new Error(`Outbox item ${outboxId} is in status ${record.status}, expected DEAD_LETTER`);
    }

    record.status = 'PENDING';
    record.retryCount = 0;
    record.lastError = undefined;
    record.nextAttemptAt = new Date().toISOString();

    this.outboxMap.set(outboxId, record);
    this.flushToDisk();

    auditLedger.recordEvent({
      fundId,
      dealId: record.dealId,
      action: 'OUTBOX_DEAD_LETTER_REPLAYED',
      actorId,
      actorRole: 'admin',
      payload: { outboxId, idempotencyKey: record.idempotencyKey }
    });

    return record;
  }

  public getFundOutboxStatus(fundId: string) {
    const records = Array.from(this.outboxMap.values()).filter(r => r.fundId === fundId);
    return {
      fundId,
      total: records.length,
      pending: records.filter(r => r.status === 'PENDING').length,
      processing: records.filter(r => r.status === 'PROCESSING').length,
      completed: records.filter(r => r.status === 'COMPLETED').length,
      deadLetter: records.filter(r => r.status === 'DEAD_LETTER').length,
      records
    };
  }
}

export const outboxManager = new TransactionalOutboxManager('outbox_records');
