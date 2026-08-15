import { UserRole } from '../types';

export function canApproveLOI(role: UserRole): boolean {
  return role === 'admin' || role === 'partner';
}

export function canTriggerBatchOutreach(role: UserRole): boolean {
  return role === 'admin' || role === 'partner' || role === 'associate';
}

export function canEditValuationParameters(role: UserRole): boolean {
  return role === 'admin' || role === 'partner';
}

export function getRoleBadgeVariant(role: UserRole): 'success' | 'info' | 'warning' | 'default' {
  switch (role) {
    case 'admin':
    case 'partner':
      return 'success';
    case 'associate':
      return 'info';
    case 'analyst':
      return 'warning';
    default:
      return 'default';
  }
}
