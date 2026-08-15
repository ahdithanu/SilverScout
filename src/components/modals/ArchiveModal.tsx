import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lead } from '../../types';
import { Button } from '../../App';

interface ArchiveModalProps {
  lead: Lead | null;
  onClose: () => void;
  onConfirm: (reason: string, notes: string) => Promise<void>;
}

export const ArchiveModal: React.FC<ArchiveModalProps> = ({ lead, onClose, onConfirm }) => {
  const [archiveReason, setArchiveReason] = useState<string>('Not a fit');
  const [archiveNotes, setArchiveNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!lead) return null;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm(archiveReason, archiveNotes);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-label="Archive Target Lead">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-zinc-100 space-y-4"
        >
          <div>
            <h3 className="text-xl font-bold text-zinc-900">Archive Target Lead</h3>
            <p className="text-xs text-zinc-500 mt-1">Select a reason for archiving {lead.name}.</p>
          </div>

          <div className="space-y-3">
            {['Not a fit', 'Contacted Unsuccessfully', 'Inactive', 'Other'].map((reason) => (
              <label key={reason} className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 cursor-pointer hover:bg-zinc-50 transition-colors">
                <span className="text-sm font-medium text-zinc-800">{reason}</span>
                <input
                  type="radio"
                  name="archiveReason"
                  value={reason}
                  checked={archiveReason === reason}
                  onChange={(e) => setArchiveReason(e.target.value)}
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-zinc-300"
                />
              </label>
            ))}
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">Additional Archive Notes (Optional)</label>
            <textarea
              value={archiveNotes}
              onChange={(e) => setArchiveNotes(e.target.value)}
              placeholder="e.g. Valuation expectations were 8.0x EBITDA, beyond our threshold..."
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs focus:border-red-500 focus:outline-none"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="danger" className="flex-1" onClick={handleConfirm} disabled={isSubmitting}>
              {isSubmitting ? 'Archiving...' : 'Confirm Archive'}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
