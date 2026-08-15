import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Palette, Globe, Mail, Building, CheckCircle2 } from 'lucide-react';
import { FundBrandingConfig, DEFAULT_FUND_BRANDING } from '../../utils/branding';
import { Button } from '../../App';

interface BrandingSettingsModalProps {
  show: boolean;
  onClose: () => void;
  branding: FundBrandingConfig;
  onSaveBranding: (updated: FundBrandingConfig) => void;
}

export const BrandingSettingsModal: React.FC<BrandingSettingsModalProps> = ({
  show,
  onClose,
  branding,
  onSaveBranding
}) => {
  const [form, setForm] = useState<FundBrandingConfig>(branding || DEFAULT_FUND_BRANDING);

  if (!show) return null;

  const handleSave = () => {
    onSaveBranding(form);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto" role="dialog" aria-modal="true" aria-label="White-Label Fund Branding Settings">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full max-w-xl rounded-2xl bg-white p-8 shadow-2xl border border-zinc-200 space-y-6"
        >
          <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                <Palette className="h-4 w-4" />
              </span>
              <div>
                <h3 className="font-extrabold text-lg text-zinc-900">White-Label Fund Branding & Domain</h3>
                <p className="text-xs text-zinc-500">Customize Platform Logo, Brand Palette & LP Pitch Memos</p>
              </div>
            </div>

            <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700 text-sm font-bold px-2">
              ✕
            </button>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-zinc-700 block mb-1">Fund Name</label>
              <input
                type="text"
                value={form.fundName}
                onChange={(e) => setForm({ ...form, fundName: e.target.value })}
                className="w-full rounded-lg border border-zinc-300 bg-white py-2 px-3 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-zinc-700 block mb-1">Fund Tagline & Thesis</label>
              <input
                type="text"
                value={form.fundTagline}
                onChange={(e) => setForm({ ...form, fundTagline: e.target.value })}
                className="w-full rounded-lg border border-zinc-300 bg-white py-2 px-3 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-zinc-700 block mb-1">Primary Color (Hex)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.primaryColorHex}
                    onChange={(e) => setForm({ ...form, primaryColorHex: e.target.value })}
                    className="h-8 w-12 rounded cursor-pointer border border-zinc-300"
                  />
                  <input
                    type="text"
                    value={form.primaryColorHex}
                    onChange={(e) => setForm({ ...form, primaryColorHex: e.target.value })}
                    className="flex-1 rounded-lg border border-zinc-300 py-1.5 px-2 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-zinc-700 block mb-1">Custom Domain</label>
                <input
                  type="text"
                  value={form.customDomain}
                  onChange={(e) => setForm({ ...form, customDomain: e.target.value })}
                  placeholder="scout.yourfund.com"
                  className="w-full rounded-lg border border-zinc-300 bg-white py-2 px-3 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-zinc-700 block mb-1">Acquisitions Contact Email</label>
              <input
                type="email"
                value={form.contactEmail}
                onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                className="w-full rounded-lg border border-zinc-300 bg-white py-2 px-3 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-zinc-100">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2" onClick={handleSave}>
              <CheckCircle2 className="h-4 w-4" /> Save Branding Settings
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
