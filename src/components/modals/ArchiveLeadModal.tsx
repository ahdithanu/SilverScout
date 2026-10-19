import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lead } from '../../types';
import { Button } from '../common/DesignSystem';

interface ArchiveLeadModalProps {
  lead: Lead | null;
  archiveReason: string;
  setArchiveReason: (reason: string) => void;
  archiveNotes: string;
  setArchiveNotes: (notes: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export const ArchiveLeadModal: React.FC<ArchiveLeadModalProps> = ({
  lead,
  archiveReason,
  setArchiveReason,
  archiveNotes,
  setArchiveNotes,
  onClose,
  onConfirm
}) => {
  return (
    <AnimatePresence>
      {lead && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Archive Target Lead"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-zinc-100"
          >
            <h3 className="text-xl font-bold text-zinc-900">Archive Target Lead</h3>
            <p className="text-xs text-zinc-500 mt-1">Select a reason for archiving {lead.name}.</p>

            <div className="mt-6 space-y-3">
              {['Not a fit', 'Contacted Unsuccessfully', 'Inactive', 'Other'].map((reason) => (
                <label
                  key={reason}
                  className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 cursor-pointer hover:bg-zinc-50 transition-colors"
                >
                  <span className="text-sm font-medium">{reason}</span>
                  <input
                    type="radio"
                    name="archiveReason"
                    value={reason}
                    checked={archiveReason === reason}
                    onChange={(e) => setArchiveReason(e.target.value)}
                    className="h-4 w-4 border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                  />
                </label>
              ))}
            </div>

            <div className="mt-6">
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Additional Context (Optional)
              </label>
              <textarea
                value={archiveNotes}
                onChange={(e) => setArchiveNotes(e.target.value)}
                placeholder="Add more details about why this lead is being archived..."
                className="w-full rounded-xl border border-zinc-200 p-4 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                rows={3}
              />
            </div>

            <div className="mt-8 flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button variant="danger" className="flex-1" onClick={onConfirm}>
                Confirm Archive
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
