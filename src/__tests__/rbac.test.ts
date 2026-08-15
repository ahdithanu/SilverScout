import { describe, it, expect } from 'vitest';
import { canApproveLOI, canTriggerBatchOutreach, canEditValuationParameters } from '../utils/rbac';

describe('RBAC Authorization Rules', () => {
  it('allows partners and admins to approve LOIs', () => {
    expect(canApproveLOI('admin')).toBe(true);
    expect(canApproveLOI('partner')).toBe(true);
    expect(canApproveLOI('associate')).toBe(false);
    expect(canApproveLOI('analyst')).toBe(false);
  });

  it('allows associates, partners, and admins to trigger batch outreach', () => {
    expect(canTriggerBatchOutreach('admin')).toBe(true);
    expect(canTriggerBatchOutreach('partner')).toBe(true);
    expect(canTriggerBatchOutreach('associate')).toBe(true);
    expect(canTriggerBatchOutreach('analyst')).toBe(false);
  });

  it('restricts valuation parameters editing to partners and admins', () => {
    expect(canEditValuationParameters('admin')).toBe(true);
    expect(canEditValuationParameters('partner')).toBe(true);
    expect(canEditValuationParameters('associate')).toBe(false);
    expect(canEditValuationParameters('analyst')).toBe(false);
  });
});
