'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/lib/context/app-context';
import { Lead } from '@/types/crm';
import { getWhatsAppUrl } from '@/lib/phone-utils';
import { soundEngine } from '@/lib/audio-chime';
import { detectCountryFromPhone, getCountryLocalTime, COUNTRY_CODES } from '@/lib/country-codes';
import { 
  Sparkles, 
  Clock, 
  MessageSquare, 
  Phone, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronRight,
  ExternalLink,
  RotateCcw,
  UserCheck,
  X
} from 'lucide-react';

export function DailyCallbackAlertBanner() {
  const { 
    leads, 
    currentUser, 
    advanceCadence, 
    clearScheduledCallback, 
    setSelectedLead, 
    setIsLeadDrawerOpen 
  } = useApp();

  const [todayStr, setTodayStr] = useState<string>('2026-10-18');
  const [mounted, setMounted] = useState(false);
  const [dismissedLeadIds, setDismissedLeadIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setMounted(true);
    const now = new Date().toISOString().split('T')[0];
    setTodayStr(now);
  }, []);

  // Filter callbacks:
  // Either assigned to currentUser (or all if team leader), not DNC, has callback date <= today or within 24 hours
  const dueCallbacks = useMemo(() => {
    return leads.filter(l => {
      if (l.is_dnc) return false;
      if (!l.scheduled_callback_date) return false;
      if (dismissedLeadIds.has(l.id)) return false;

      // If regular member, prioritize their assigned leads
      const isLeader = currentUser.role === 'team_leader';
      if (!isLeader && l.current_assignee_id && l.current_assignee_id !== currentUser.id) {
        return false;
      }

      // Check if due today or past due
      return l.scheduled_callback_date <= todayStr;
    });
  }, [leads, todayStr, dismissedLeadIds, currentUser]);

  // Play chime once if there are due callbacks
  useEffect(() => {
    if (mounted && dueCallbacks.length > 0) {
      soundEngine.playMentionChime();
    }
  }, [mounted, dueCallbacks.length]);

  if (!mounted || dueCallbacks.length === 0) return null;

  return (
    <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/70 border-2 border-amber-500/80 shadow-2xl shadow-amber-950/40 text-xs space-y-3.5 animate-in fade-in slide-in-from-top-3 duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/60 text-amber-300 flex items-center justify-center shadow-lg shadow-amber-950/40 shrink-0">
            <Sparkles className="w-5 h-5 animate-pulse text-amber-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm sm:text-base font-black text-white tracking-wide">
                🌟 আজকের নির্ধারিত কলব্যাক অ্যালার্ট (Daily Priority Callbacks)
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 shadow-sm">
                {dueCallbacks.length} Due Today
              </span>
            </div>
            <p className="text-[11px] text-amber-200/80 mt-0.5">
              এই ক্লায়েন্টগুলো আগে ট্রাভেলিং বা ব্যস্ত থাকার কারণে আজ যোগাযোগ করতে বলেছিল — অবিলম্বে নক দিন!
            </p>
          </div>
        </div>

        <span className="text-[10px] text-amber-400 font-bold bg-amber-950 px-2.5 py-1 rounded-full border border-amber-600 self-start sm:self-auto font-mono">
          📅 Target Date: {todayStr}
        </span>
      </div>

      {/* List of Callback Lead Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        {dueCallbacks.map(lead => {
          const country = (lead.phone ? detectCountryFromPhone(lead.phone) : null) || COUNTRY_CODES[0];
          const { timeString } = getCountryLocalTime(country.code);
          const currentStep = lead.cadence_step ?? 0;

          // Dedicated callback WhatsApp message mentioning their scheduled request
          const callbackMsg = `Hi ${lead.contact_name}, this is ${currentUser.full_name} regarding ${lead.company_name}. As requested, following up with you today — are you free for a quick 2-min review?`;
          const waUrl = lead.phone ? getWhatsAppUrl(lead.phone, callbackMsg) : '#';

          return (
            <div 
              key={lead.id}
              className="p-3.5 rounded-2xl bg-slate-950/90 border border-amber-500/40 hover:border-amber-400/80 transition-all flex flex-col justify-between space-y-2.5 shadow-md"
            >
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 
                      onClick={() => {
                        setSelectedLead(lead);
                        setIsLeadDrawerOpen(true);
                      }}
                      className="font-bold text-white text-sm hover:text-amber-400 transition-colors cursor-pointer flex items-center space-x-1.5"
                    >
                      <span>{lead.company_name}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                    </h3>
                    <div className="flex items-center space-x-2 text-[10px] text-slate-400 pt-0.5">
                      <span>👤 {lead.contact_name}</span>
                      <span>•</span>
                      <span className="font-mono text-emerald-400">{country.code} • {timeString}</span>
                    </div>
                  </div>

                  {/* Scheduled date pill */}
                  <div className="text-right shrink-0">
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-amber-950 border border-amber-500 text-amber-300">
                      Due: {lead.scheduled_callback_date}
                    </span>
                  </div>
                </div>

                {/* Reason note strip */}
                {lead.scheduled_callback_reason && (
                  <div className="p-2 rounded-xl bg-amber-950/40 border border-amber-500/30 text-[11px] text-amber-200/90">
                    <span className="font-bold text-amber-300">Reason:</span> {lead.scheduled_callback_reason}
                  </div>
                )}
              </div>

              {/* Actions Toolbar */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-900">
                {/* 1-Click WhatsApp Button */}
                {lead.phone ? (
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => soundEngine.playMentionChime()}
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-500/20 active:scale-95 transition-all text-center"
                  >
                    <MessageSquare className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>WhatsApp Callback</span>
                  </a>
                ) : (
                  <a
                    href={`mailto:${lead.email}`}
                    className="flex-1 py-2 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5"
                  >
                    <span>Send Email Callback</span>
                  </a>
                )}

                {/* Mark Contacted & Clear Callback button */}
                <button
                  type="button"
                  onClick={() => {
                    clearScheduledCallback(lead.id);
                    soundEngine.playSuccessChime();
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-bold text-xs transition-colors flex items-center space-x-1"
                  title="Mark callback contacted and remove alert"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>✓ Contacted</span>
                </button>

                {/* Dismiss button */}
                <button
                  type="button"
                  onClick={() => setDismissedLeadIds(prev => new Set([...prev, lead.id]))}
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-slate-900 transition-colors"
                  title="Dismiss alert for now"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
