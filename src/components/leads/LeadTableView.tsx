'use client';

import React, { useState, useEffect } from 'react';
import { Lead, CADENCE_STEPS, ClientReaction } from '@/types/crm';
import { useApp } from '@/lib/context/app-context';
import { getWhatsAppUrl } from '@/lib/phone-utils';
import { soundEngine } from '@/lib/audio-chime';
import { detectCountryFromPhone, getCountryLocalTime, COUNTRY_CODES } from '@/lib/country-codes';
import { 
  Check, 
  MessageSquare, 
  Mail, 
  Shield, 
  Clock, 
  Calendar, 
  ChevronDown, 
  Zap, 
  Flame, 
  Lock
} from 'lucide-react';

interface LeadTableViewProps {
  leads: Lead[];
  onOpenDetails: (lead: Lead) => void;
  duplicateLeadIds?: Set<string>;
}

export function LeadTableView({ leads, onOpenDetails, duplicateLeadIds }: LeadTableViewProps) {
  const { advanceCadence, updateClientReaction, updateLead } = useApp();

  // Guard against SSR hydration mismatches for local clock
  const [mounted, setMounted] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleAdvance = (e: React.MouseEvent, leadId: string) => {
    e.stopPropagation();
    advanceCadence(leadId);
    soundEngine.playSuccessChime();
  };

  const handleReactionChange = (e: React.ChangeEvent<HTMLSelectElement>, leadId: string) => {
    e.stopPropagation();
    const newReaction = e.target.value as ClientReaction;
    updateClientReaction(leadId, newReaction);
  };

  const handleToggleDnc = (e: React.MouseEvent, lead: Lead) => {
    e.stopPropagation();
    const newDnc = !lead.is_dnc;
    updateLead(lead.id, {
      is_dnc: newDnc,
      dnc_reason: newDnc ? 'Marked DNC via Table Action' : undefined
    });
    soundEngine.playWarningChime();
  };

  const handleSchedulePrompt = (e: React.MouseEvent, lead: Lead) => {
    e.stopPropagation();
    onOpenDetails(lead);
  };

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-slate-800 bg-[#0c1017] shadow-2xl">
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        <table className="w-full text-left border-collapse min-w-[960px]">
          {/* Table Header */}
          <thead>
            <tr className="border-b border-slate-800/90 bg-slate-950/70 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              <th className="py-4 px-5">LEAD & COMPANY</th>
              <th className="py-4 px-4">COUNTRY & FLAG</th>
              <th className="py-4 px-4">WHATSAPP CLICK-TO-CHAT</th>
              <th className="py-4 px-4">CADENCE STAGE</th>
              <th className="py-4 px-4">MESSAGE STATUS</th>
              <th className="py-4 px-4">PIPELINE STATUS</th>
              <th className="py-4 px-5 text-right">ACTIONS</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-800/60 text-xs">
            {leads.map((lead) => {
              // 1. Country & Timezone
              const country = (lead.phone ? detectCountryFromPhone(lead.phone) : null) || COUNTRY_CODES[0];
              const { timeString, isBusinessHours } = mounted 
                ? getCountryLocalTime(country.code) 
                : { timeString: '1:34 PM', isBusinessHours: true };

              // 2. Cadence Info
              const currentStep = lead.cadence_step ?? 0;
              const nextStep = currentStep + 1;
              const currentCadenceLabel = currentStep === 0 
                ? 'Day 0 Pitch' 
                : currentStep === 1 
                ? 'Follow-up 1' 
                : currentStep === 2 
                ? 'Follow-up 2' 
                : currentStep === 3 
                ? 'Follow-up 3' 
                : 'Final Break-up';

              const nextStepButtonLabel = nextStep <= 3 
                ? `Message Sent → FU ${nextStep}` 
                : 'Message Sent → Completed';

              // Previous message label
              const lastMsgLabel = currentStep > 0 ? `Follow-up ${currentStep}` : 'Day 0 Pitch';

              // 3. WhatsApp URL
              const waPitchMessage = `Hi, regarding your brand ${lead.company_name}: We noticed your ads are scaling and prepared a creative inject tear-sheet. Open to a 2-min review?`;
              const waUrl = lead.phone ? getWhatsAppUrl(lead.phone, waPitchMessage) : '#';

              // 4. Formatted Display Phone & Company
              const displayCompany = lead.company_name || 'Brand Lead';
              const phoneSuffix = lead.phone && lead.phone.length > 4 ? lead.phone.slice(-4) : '';
              const isDuplicate = duplicateLeadIds?.has(lead.id);

              return (
                <tr 
                  key={lead.id}
                  onClick={() => onOpenDetails(lead)}
                  className={`group hover:bg-slate-900/50 transition-colors cursor-pointer ${
                    lead.is_dnc ? 'bg-rose-950/10' : ''
                  }`}
                >
                  {/* 1. LEAD & COMPANY */}
                  <td className="py-4 px-5 align-middle">
                    <div className="space-y-1.5">
                      <div className="font-bold text-white text-sm group-hover:text-emerald-400 transition-colors line-clamp-1">
                        {displayCompany} {phoneSuffix ? <span className="font-mono text-xs text-slate-400 font-semibold">(+{country.dial_code.replace('+', '')} {phoneSuffix})</span> : null}
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#0d2218] border border-emerald-500/40 text-emerald-300">
                          Website Developer
                        </span>
                        {isDuplicate && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-950/80 border border-amber-500 text-amber-300">
                            ⚠️ Duplicate
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-400 flex items-center space-x-1 font-mono">
                        <span>🗓️</span>
                        <span>{lead.created_at ? lead.created_at.slice(0, 10) : '2026-10-16'}</span>
                      </div>
                    </div>
                  </td>

                  {/* 2. COUNTRY & FLAG */}
                  <td className="py-4 px-4 align-middle">
                    <div className="space-y-1.5">
                      {/* Country badge */}
                      <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-[#0a1f18] border border-emerald-500/50 text-emerald-300 text-[11px] font-bold">
                        <span className="font-extrabold text-emerald-400">{country.code}</span>
                        <span>{country.name}</span>
                      </div>

                      {/* Live Local Time */}
                      <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-[#0a1f18] border border-emerald-500/40 text-emerald-300 text-[11px] font-mono font-semibold">
                        <Clock className="w-3 h-3 text-emerald-400" />
                        <span>{timeString}</span>
                        <span 
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            isBusinessHours ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                          }`} 
                          title={isBusinessHours ? 'Business Hours Active' : 'Outside Business Hours'}
                        />
                      </div>

                      {/* Lead Warmth */}
                      <div>
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-[#081f26] border border-cyan-500/50 text-cyan-300 text-[11px] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                          <Zap className="w-3 h-3 text-cyan-300 fill-cyan-300" />
                          <span>Warm Lead</span>
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* 3. WHATSAPP CLICK-TO-CHAT */}
                  <td className="py-4 px-4 align-middle">
                    {lead.phone ? (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          e.stopPropagation();
                          soundEngine.playMentionChime();
                        }}
                        className="inline-flex items-center justify-between space-x-2.5 px-3 py-2 rounded-xl bg-[#081813] border border-emerald-500/40 hover:border-emerald-400 hover:bg-[#0d261e] transition-all group/wa text-xs font-mono font-bold text-emerald-300 shadow-sm"
                        title="Click to open WhatsApp chat with pre-filled pitch"
                      >
                        <span className="text-[11px] font-bold text-emerald-400">{country.code}</span>
                        <span className="tracking-wide">{lead.phone}</span>
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-400 group-hover/wa:scale-110 transition-transform" />
                      </a>
                    ) : (
                      <a
                        href={`mailto:${lead.email}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center justify-between space-x-2 px-3 py-2 rounded-xl bg-[#091522] border border-cyan-500/40 hover:border-cyan-400 text-xs text-cyan-300 font-mono font-bold transition-all"
                      >
                        <span className="truncate max-w-[140px]">{lead.email}</span>
                        <Mail className="w-3.5 h-3.5 text-cyan-400" />
                      </a>
                    )}
                  </td>

                  {/* 4. CADENCE STAGE */}
                  <td className="py-4 px-4 align-middle">
                    <div className="space-y-1.5">
                      {/* Current Stage Pill */}
                      <span className="inline-block px-3 py-1 rounded-lg bg-slate-900 border border-slate-700/80 text-slate-200 text-xs font-bold">
                        {currentCadenceLabel}
                      </span>

                      {/* Advance Button */}
                      <div>
                        <button
                          type="button"
                          onClick={(e) => handleAdvance(e, lead.id)}
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md shadow-emerald-950/40 active:scale-95 transition-all"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>{nextStepButtonLabel}</span>
                        </button>
                      </div>
                    </div>
                  </td>

                  {/* 5. MESSAGE STATUS */}
                  <td className="py-4 px-4 align-middle">
                    <div className="space-y-1">
                      <div className="relative inline-block">
                        <select
                          value={lead.last_client_reaction || 'unseen'}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => handleReactionChange(e, lead.id)}
                          className="px-3 py-1.5 pr-8 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-200 text-xs font-bold appearance-none cursor-pointer focus:outline-none focus:border-emerald-500"
                        >
                          <option value="unseen">⏳ Unseen</option>
                          <option value="seen">👀 Seen</option>
                          <option value="replied">💬 Replied</option>
                          <option value="interested">🔥 Interested</option>
                          <option value="not_interested">❌ Not Interested</option>
                          <option value="objection">⚠️ Objection</option>
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>

                      <p className="text-[10px] text-slate-500 font-medium">
                        Last Msg ({lastMsgLabel})
                      </p>
                    </div>
                  </td>

                  {/* 6. PIPELINE STATUS */}
                  <td className="py-4 px-4 align-middle">
                    {lead.is_dnc ? (
                      <span className="inline-block px-3 py-1 rounded-full text-[11px] font-black bg-rose-950/80 border border-rose-500/60 text-rose-300 uppercase tracking-wider">
                        🚫 DNC
                      </span>
                    ) : lead.stage === 'closed_won' ? (
                      <span className="inline-block px-3 py-1 rounded-full text-[11px] font-black bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 uppercase tracking-wider">
                        🏆 WON
                      </span>
                    ) : lead.stage === 'pending_approval' ? (
                      <span className="inline-block px-3 py-1 rounded-full text-[11px] font-black bg-amber-950/80 border border-amber-500/60 text-amber-300 uppercase tracking-wider animate-pulse">
                        ⏳ PENDING
                      </span>
                    ) : lead.stage === 'cold' ? (
                      <span className="inline-block px-3 py-1 rounded-full text-[11px] font-black bg-slate-800 border border-slate-700 text-slate-400 uppercase tracking-wider">
                        COLD
                      </span>
                    ) : (
                      <span className="inline-block px-3 py-1 rounded-full text-[11px] font-black bg-[#0a1f18] border border-emerald-500/60 text-emerald-400 uppercase tracking-wider">
                        ACTIVE
                      </span>
                    )}
                  </td>

                  {/* 7. ACTIONS */}
                  <td className="py-4 px-5 align-middle text-right">
                    <div className="flex items-center justify-end space-x-2">
                      {/* Shield Button */}
                      <button
                        type="button"
                        onClick={(e) => handleToggleDnc(e, lead)}
                        title={lead.is_dnc ? 'Remove DNC Lock' : 'Mark Do Not Contact (DNC)'}
                        className={`p-2 rounded-xl border transition-all ${
                          lead.is_dnc 
                            ? 'bg-rose-500/20 border-rose-500 text-rose-300' 
                            : 'bg-amber-500/10 border-amber-500/40 text-amber-400 hover:bg-amber-500/25'
                        }`}
                      >
                        <Shield className="w-3.5 h-3.5" />
                      </button>

                      {/* Clock Button (Timeline Drawer) */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenDetails(lead);
                        }}
                        title="View Activity Timeline & Notes"
                        className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/40 text-purple-400 hover:bg-purple-500/25 transition-all"
                      >
                        <Clock className="w-3.5 h-3.5" />
                      </button>

                      {/* Calendar Button (Schedule / Follow-up) */}
                      <button
                        type="button"
                        onClick={(e) => handleSchedulePrompt(e, lead)}
                        title="Schedule Follow-up Reminder"
                        className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/25 transition-all"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
