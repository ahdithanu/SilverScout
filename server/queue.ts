export interface QueueJob<T = any> {
  id: string;
  type: 'ic-memo' | 'loi' | 'digital-scan' | 'pl-parser';
  payload: T;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: any;
  error?: string;
  createdAt: string;
  completedAt?: string;
  retries: number;
}

export class TaskQueueManager {
  private jobs: Map<string, QueueJob> = new Map();
  private maxConcurrency: number;

  constructor(maxConcurrency = 50) {
    this.maxConcurrency = maxConcurrency;
  }

  enqueue<T>(type: QueueJob['type'], payload: T): QueueJob<T> {
    const id = `job-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const job: QueueJob<T> = {
      id,
      type,
      payload,
      status: 'pending',
      createdAt: new Date().toISOString(),
      retries: 0
    };
    this.jobs.set(id, job);
    return job;
  }

  getJob(id: string): QueueJob | undefined {
    return this.jobs.get(id);
  }

  updateJobStatus(id: string, status: QueueJob['status'], result?: any, error?: string) {
    const job = this.jobs.get(id);
    if (!job) return;

    job.status = status;
    if (result !== undefined) job.result = result;
    if (error !== undefined) job.error = error;
    if (status === 'completed' || status === 'failed') {
      job.completedAt = new Date().toISOString();
    }
  }

  getQueueStats() {
    let pending = 0;
    let processing = 0;
    let completed = 0;
    let failed = 0;

    for (const job of this.jobs.values()) {
      if (job.status === 'pending') pending++;
      else if (job.status === 'processing') processing++;
      else if (job.status === 'completed') completed++;
      else if (job.status === 'failed') failed++;
    }

    return { total: this.jobs.size, pending, processing, completed, failed };
  }
}

export const aiQueue = new TaskQueueManager(100);
