export class TaskQueueManager {
  constructor(maxConcurrency = 50) {
    this.jobs = new Map();
    this.maxConcurrency = maxConcurrency;
  }

  enqueue(type, payload) {
    const id = `job-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const job = {
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

  getJob(id) {
    return this.jobs.get(id);
  }

  updateJobStatus(id, status, result, error) {
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
