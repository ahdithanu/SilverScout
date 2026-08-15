import React from 'react';
import { Users, Eye } from 'lucide-react';
import { UserProfile } from '../../types';

interface PresenceAvatarsProps {
  viewers: UserProfile[];
}

export const PresenceAvatars: React.FC<PresenceAvatarsProps> = ({ viewers }) => {
  if (!viewers || viewers.length === 0) return null;

  const roleColors: Record<string, string> = {
    admin: 'bg-red-500 text-white ring-red-300',
    partner: 'bg-emerald-600 text-white ring-emerald-300',
    associate: 'bg-blue-600 text-white ring-blue-300',
    analyst: 'bg-zinc-600 text-white ring-zinc-300'
  };

  return (
    <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 px-3 py-1.5 rounded-full text-xs" title="Live deal team members active on this platform">
      <Eye className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />
      <span className="text-[11px] font-bold text-zinc-600">Active Team:</span>
      <div className="flex -space-x-2 overflow-hidden">
        {viewers.map((viewer, idx) => (
          <div
            key={viewer.uid || idx}
            className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black ring-2 uppercase ${roleColors[viewer.role] || roleColors.analyst}`}
            title={`${viewer.displayName} (${viewer.role.toUpperCase()}) - Active Now`}
          >
            {viewer.displayName ? viewer.displayName.substring(0, 2) : 'US'}
          </div>
        ))}
      </div>
    </div>
  );
};
