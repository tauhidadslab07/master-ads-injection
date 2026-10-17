'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/lib/context/app-context';
import { Lead, ClientReaction, CADENCE_STEPS } from '@/types/crm';
import { getWhatsAppUrl } from '@/lib/phone-utils';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Zap, 
  MessageCircle, 
  Mail, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Lock,
  Keyboard,
  Building2,
  DollarSign
} from 'lucide-react';

export function OutreachFocusMode() {
  const { 
    leads, 
    channelFilter, 
    setChannelFilter, 
    isFocusModeOpen, 
    setIsFocusModeOpen, 
    currentUser, 
    advanceCadence, 
    updateClientReaction 
  } = useApp();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [cadenceError, setCadenceError] = useState<string | null>(null);

  // Filter leads eligible for outreach (approved or contacted, not DNC, not closed)
  const outreachLeads = useMemo(() => {
    return leads.filter(l => {
      if (l.is_dnc) return false;
      if (l.stage === 'closed_won' || l.stage === 'closed_lost' || l.stage === 'archived') return false;
      if (channelFilter === 'whatsapp' && l.channel !== 'whatsapp') return false;
      if (channelFilter === 'email' && l.channel !== 'email') return false;
      return true;
    });
  }, [leads, channelFilter]);

  // Reset index if out of bounds
  useEffect(() => {
    if (currentIndex >= outreachLeads.length && outreachLeads.length > 0) {
      setCurrentIndex(0);
    }
  }, [outreachLeads.length, currentIndex]);

  const currentLead: Lead | undefined = outreachLeads[currentIndex];

  // Keyboard navigation shortcuts
  useEffect(() => {
    if (!isFocusModeOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setCurrentIndex(prev => (prev + 1) % Math.max(1, outreachLeads.length));
        setCadenceError(null);
      } else if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setCurrentIndex(prev => (prev - 1 + outreachLeads.length) % Math.max(1, outreachLeads.length));
        setCadenceError(null);
      } else if (e.key === 'Escape') {
        setIsFocusModeOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFocusModeOpen, outreachLeads.length, setIsFocusModeOpen]);

  if (!isFocusModeOpen) return null;

  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % outreachLeads.length);
    setCadenceError(null);
  };

  const handlePrev = () => {
    setCurrentIndex(prev => (prev - 1 + outreachLeads.length) % outreachLeads.length);
    setCadenceError(null);
  };

  const handleAdvance = () => {
    if (!currentLead) return;
    setCadenceError(null);
    const res = advanceCadence(currentLead.id);
    if (!res.success && res.error) {
      setCadenceError(res.error);
    } else {
      // Auto advance to next lead on success
      handleNext();
    }
  };

  const waMessage = currentLead 
    ? `Hey ${currentLead.contact_name}, noticed ${currentLead.company_name} is actively scaling Meta Ads. We built a creative inject tear-sheet for your product category showing 3 competitor ad leaks. Would you be open to reviewing it?` 
    : '';

  const waUrl = currentLead ? getWhatsAppUrl(currentLead.phone, waMessage) : '#';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-lg animate-in fade-in duration-150">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Zap className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  Outreach Focus Mode
                </h2>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                  {outreachLeads.length > 0 ? `${currentIndex + 1} of ${outreachLeads.length}` : '0 Leads'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Distraction-free high-velocity outreach pipeline
              </p>
            </div>
          </div>

          {/* Channel Filter Pills Synchronized */}
          <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setChannelFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                channelFilter === 'all' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setChannelFilter('whatsapp')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors ${
                channelFilter === 'whatsapp' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageCircle className="w-3 h-3" />
              <span>WhatsApp</span>
            </button>
            <button
              onClick={() => setChannelFilter('email')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors ${
                channelFilter === 'email' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Mail className="w-3 h-3" />
              <span>Email</span>
            </button>
          </div>

          <button
            onClick={() => setIsFocusModeOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        {outreachLeads.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-white mb-1">Queue Completed!</h3>
            <p className="text-xs">No pending leads matching the current channel filter.</p>
          </div>
        ) : currentLead && (
          <div className="p-6 overflow-y-auto space-y-5">
            
            {/* Lead Primary Card */}
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800/80 shadow-inner space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-xl font-black text-white tracking-wide">
                    {currentLead.company_name}
                  </h3>
                  <p className="text-sm text-cyan-300 font-medium">
                    {currentLead.contact_name}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-900 border border-slate-700 text-slate-300">
                    Step {currentLead.cadence_step}: {CADENCE_STEPS[currentLead.cadence_step]?.dayLabel || 'Day 0'}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-700/60">
                    ${currentLead.deal_value?.toLocaleString()}/mo
                  </span>
                </div>
              </div>

              {/* Contact Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-slate-300 border-t border-slate-900">
                <div>
                  <span className="text-slate-500 block mb-0.5">Phone (E.164):</span>
                  <strong className="text-white font-mono">{currentLead.phone}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">Email:</span>
                  <strong className="text-white font-mono">{currentLead.email}</strong>
                </div>
              </div>

              {/* Hunter Attribution */}
              <div className="pt-2 text-xs text-slate-400 flex items-center justify-between border-t border-slate-900">
                <span>👤 Hunter: <strong className="text-slate-200">{currentLead.hunter?.full_name || 'Hunter'}</strong></span>
                <span className="text-[11px] text-slate-500">Channel: <strong className="capitalize text-cyan-400">{currentLead.channel}</strong></span>
              </div>
            </div>

            {/* Outreach Action Trigger */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-300 block">
                1-Click Direct Outreach:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/30 active:scale-95 transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Launch WhatsApp Direct Hook</span>
                </a>

                <a
                  href={`mailto:${currentLead.email}?subject=Master Ads Strategy for ${encodeURIComponent(currentLead.company_name)}&body=${encodeURIComponent(waMessage)}`}
                  className="py-3 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center space-x-2 transition-colors"
                >
                  <Mail className="w-4 h-4 text-cyan-400" />
                  <span>Launch Email Direct Hook</span>
                </a>
              </div>
            </div>

            {/* Client Reaction Selector */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">Log Client Reaction:</span>
                <span className="font-bold text-cyan-400 uppercase">[{currentLead.last_client_reaction}]</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {(['unseen', 'seen', 'replied', 'interested', 'not_interested'] as ClientReaction[]).map((rx) => (
                  <button
                    key={rx}
                    type="button"
                    onClick={() => updateClientReaction(currentLead.id, rx)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase transition-all ${
                      currentLead.last_client_reaction === rx
                        ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {rx}
                  </button>
                ))}
              </div>
            </div>

            {/* Mistake Guard Alert */}
            {cadenceError && (
              <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/60 text-rose-200 text-xs flex items-start space-x-2 animate-in fade-in">
                <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span>{cadenceError}</span>
              </div>
            )}

            {/* Next / Advance Controls */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
                  title="Previous Lead (P / Left Arrow)"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
                  title="Next Lead (N / Right Arrow)"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleAdvance}
                className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/30 active:scale-95 transition-all flex items-center space-x-1.5"
              >
                <span>Advance Cadence & Next</span>
                <ChevronRight className="w-4 h-4 stroke-[3]" />
              </button>
            </div>

            {/* Keyboard Shortcuts Hint */}
            <div className="text-[11px] text-slate-500 flex items-center justify-center space-x-4 pt-2">
              <span className="flex items-center space-x-1">
                <Keyboard className="w-3.5 h-3.5 text-slate-600" />
                <span>Shortcuts:</span>
              </span>
              <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">N</kbd> Next</span>
              <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">P</kbd> Prev</span>
              <span><kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">Esc</kbd> Exit</span>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
