import React from 'react';
import { ActivityLog } from '../../types';
import { Clock, User } from 'lucide-react';

interface ActivityTimelineProps {
  logs?: ActivityLog[];
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ logs = [] }) => {
  if (logs.length === 0) {
    return (
      <p className="text-xs text-zinc-400 italic py-2">No activity recorded yet.</p>
    );
  }

  return (
    <div className="space-y-3">
      <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Deal Activity Audit Log</h5>
      <div className="relative border-l-2 border-zinc-200 pl-4 space-y-3">
        {logs.map((log) => (
          <div key={log.id} className="relative group">
            <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-white" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-800">{log.action}</span>
              <span className="flex items-center gap-1 text-[10px] text-zinc-400">
                <Clock className="h-3 w-3" />
                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-zinc-500 mt-0.5">
              <User className="h-3 w-3" />
              <span>{log.userName}</span>
              {log.details && <span className="text-zinc-400">• {log.details}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
