import { TransactionalOutboxRecord } from '../src/types';

export class TransactionalOutboxManager {
  private outboxMap = new Map<string, TransactionalOutboxRecord>();

  public createOutboxRecord(
    fundId: string,
    dealId: string,
    eventType: 'SEND_OUTREACH_EMAIL' | 'SYNC_CRM_DEAL',
    payload: Record<string, any>,
    targetProvider: string = 'sendgrid'
  ): TransactionalOutboxRecord {
    const idempotencyKey = `${fundId}:${dealId}:${eventType}:v1:${targetProvider}`;
    const outboxId = `outbox-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // Check if idempotency key already exists
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
    return record;
  }
}

export const outboxManager = new TransactionalOutboxManager();
