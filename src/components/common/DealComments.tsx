import React, { useState } from 'react';
import { MessageSquare, Send, UserCheck, ShieldAlert } from 'lucide-react';
import { Lead, DealComment, UserProfile } from '../../types';
import { Button } from '../../App';

interface DealCommentsProps {
  lead: Lead;
  profile: UserProfile | null;
  onAddComment: (leadId: string, commentText: string) => void;
}

export const DealComments: React.FC<DealCommentsProps> = ({ lead, profile, onAddComment }) => {
  const [newComment, setNewComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    onAddComment(lead.id, newComment.trim());
    setNewComment('');
  };

  const comments = lead.comments || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-emerald-600" />
          Internal Investment Team Discussion ({comments.length})
        </h4>
        <span className="text-[10px] text-zinc-400 font-medium">Confidential Partner & Analyst Notes</span>
      </div>

      {/* Comment Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={`Add internal deal note as ${profile?.displayName || 'User'} (${profile?.role || 'analyst'})...`}
          className="flex-1 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
        />
        <Button type="submit" variant="primary" size="sm" className="gap-1 bg-emerald-600 text-white" disabled={!newComment.trim()}>
          <Send className="h-3 w-3" />
          Post
        </Button>
      </form>

      {/* Discussion List */}
      <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
        {comments.length === 0 ? (
          <p className="text-xs text-zinc-400 italic py-2">No internal deal notes yet. Be the first partner or analyst to leave feedback on {lead.name}.</p>
        ) : (
          comments.map(c => (
            <div key={c.id} className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-zinc-900">{c.userName}</span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-emerald-100 text-emerald-800">
                    {c.userRole}
                  </span>
                </div>
                <span className="text-[10px] text-zinc-400">{new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <p className="text-xs text-zinc-700 font-medium leading-relaxed">{c.text}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
