'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  AlertTriangle,
  FileText,
  UserCheck,
  CheckCircle2,
  X,
  Sparkles,
  Lock
} from 'lucide-react';

interface LeadTableViewProps {
  leads: Lead[];
  onOpenDetails: (lead: Lead) => void;
  duplicateLeadIds?: Set<string>;
  showAssigneeSelector?: boolean;
}

export function LeadTableView({ 
  leads, 
  onOpenDetails, 
  duplicateLeadIds,
  showAssigneeSelector = true 
}: LeadTableViewProps) {
  const { 
    advanceCadence, 
    updateClientReaction, 
    updateLead, 
    assignLead, 
    passAudit,
    sendToAudit,
    addActivityNote, 
    activities, 
    teamMembers, 
    currentUser 
  } = useApp();

  // Guard against SSR hydration mismatches for live clock
  const [mounted, setMounted] = useState(false);
  const [, setTick] = useState(0);

  // Status check & Stage advance modal state
  const [statusModalLead, setStatusModalLead] = useState<Lead | null>(null);
  const [selectedReaction, setSelectedReaction] = useState<ClientReaction>('seen');
  const [stageNote, setStageNote] = useState('');

  // Quick note modal state
  const [noteModalLead, setNoteModalLead] = useState<Lead | null>(null);
  const [quickNoteText, setQuickNoteText] = useState('');

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Map latest notes by leadId
  const latestNotesByLeadId = useMemo(() => {
    const map = new Map<string, string>();
    activities.forEach(act => {
      if (act.activity_type === 'note' && !map.has(act.lead_id)) {
        map.set(act.lead_id, act.content);
      }
    });
    return map;
  }, [activities]);

  // Click advance button
  const handleAdvanceClick = (e: React.MouseEvent, lead: Lead) => {
    e.stopPropagation();

    const currentStep = lead.cadence_step ?? 0;

    // If advancing from Step 1 onwards, last message status must NOT be 'unseen'
    if (currentStep >= 1 && (!lead.last_client_reaction || lead.last_client_reaction === 'unseen')) {
      // Trigger the mandatory status modal
      soundEngine.playWarningChime();
      setStatusModalLead(lead);
      setSelectedReaction('seen');
      setStageNote('');
      return;
    }

    // If Step 0, advance immediately to FU 1
    const res = advanceCadence(lead.id);
    if (!res.success && res.error) {
      soundEngine.playWarningChime();
      setStatusModalLead(lead);
      setSelectedReaction('seen');
      setStageNote('');
    }
  };

  // Confirm status and advance
  const handleConfirmAdvanceWithStatus = () => {
    if (!statusModalLead) return;

    advanceCadence(statusModalLead.id, selectedReaction, stageNote.trim() || undefined);
    setStatusModalLead(null);
    setStageNote('');
  };

  // Submit quick note
  const handleSaveQuickNote = () => {
    if (!noteModalLead || !quickNoteText.trim()) return;

    addActivityNote(
      noteModalLead.id,
      `📝 ${quickNoteText.trim()}`,
      [],
      'note'
    );
    soundEngine.playSuccessChime();
    setNoteModalLead(null);
    setQuickNoteText('');
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

  // Sequential Button Labels based on Cadence Step
  const getButtonDetails = (step: number) => {
    switch (step) {
      case 0:
        return {
          label: '✓ 1st Message Sent → Ready for FU 1',
          bg: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black',
          isDone: false
        };
      case 1:
        return {
          label: '✓ 1st Follow-up Sent → Ready for FU 2',
          bg: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black',
          isDone: false
        };
      case 2:
        return {
          label: '✓ 2nd Follow-up Sent → Ready for FU 3',
          bg: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black',
          isDone: false
        };
      case 3:
        return {
          label: '✓ 3rd Follow-up Sent → Ready for FU 4',
          bg: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black',
          isDone: false
        };
      case 4:
        return {
          label: '✓ 4th Follow-up Sent → Ready for FU 5',
          bg: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black',
          isDone: false
        };
      case 5:
        return {
          label: '✓ 5th Follow-up Sent → All Done',
          bg: 'bg-teal-500 hover:bg-teal-400 text-slate-950 font-black',
          isDone: false
        };
      default:
        return {
          label: '🎉 All Done',
          bg: 'bg-slate-800 text-slate-400 cursor-default font-bold border border-slate-700',
          isDone: true
        };
    }
  };

  const getStepPillLabel = (step: number) => {
    switch (step) {
      case 0: return '1st Message';
      case 1: return '1st Follow-up (FU 1)';
      case 2: return '2nd Follow-up (FU 2)';
      case 3: return '3rd Follow-up (FU 3)';
      case 4: return '4th Follow-up (FU 4)';
      case 5: return '5th Follow-up (FU 5)';
      default: return '🎉 All Done';
    }
  };

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-slate-800 bg-[#0c1017] shadow-2xl relative">
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        <table className="w-full text-left border-collapse min-w-[1020px]">
          {/* Table Header */}
          <thead>
            <tr className="border-b border-slate-800/90 bg-slate-950/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              <th className="py-4 px-5">LEAD & COMPANY</th>
              <th className="py-4 px-4">COUNTRY & FLAG</th>
              <th className="py-4 px-4">WHATSAPP CLICK-TO-CHAT</th>
              <th className="py-4 px-4">CADENCE STAGE</th>
              <th className="py-4 px-4">MESSAGE STATUS</th>
              <th className="py-4 px-4">PIPELINE & ASSIGNEE</th>
              <th className="py-4 px-5 text-right">ACTIONS</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-800/60 text-xs">
            {leads.map((lead) => {
              // Country & Timezone
              const country = (lead.phone ? detectCountryFromPhone(lead.phone) : null) || COUNTRY_CODES[0];
              const { timeString, isBusinessHours } = mounted 
                ? getCountryLocalTime(country.code) 
                : { timeString: '1:34 PM', isBusinessHours: true };

              // Cadence Info
              const currentStep = lead.cadence_step ?? 0;
              const buttonDetails = getButtonDetails(currentStep);
              const stepPill = getStepPillLabel(currentStep);

              // Previous message label
              const lastMsgLabel = currentStep > 0 
                ? (currentStep === 1 ? '1st Message' : `Follow-up ${currentStep - 1}`)
                : 'Initial';

              // WhatsApp URL
              const waPitchMessage = `Hi, regarding your brand ${lead.company_name}: We noticed your ads are scaling and prepared a creative inject tear-sheet. Open to a 2-min review?`;
              const waUrl = lead.phone ? getWhatsAppUrl(lead.phone, waPitchMessage) : '#';

              // Display details
              const displayCompany = lead.company_name || 'Brand Lead';
              const phoneSuffix = lead.phone && lead.phone.length > 4 ? lead.phone.slice(-4) : '';
              const isDuplicate = duplicateLeadIds?.has(lead.id);

              // Latest note for this lead
              const latestNote = latestNotesByLeadId.get(lead.id);

              // Assignee details
              const assignee = teamMembers.find(m => m.id === lead.current_assignee_id);
              const isLeaderOrDeputy = currentUser.role === 'team_leader' || currentUser.is_deputy;

              return (
                <tr 
                  key={lead.id}
                  onClick={() => onOpenDetails(lead)}
                  className={`group hover:bg-slate-900/50 transition-colors cursor-pointer ${
                    lead.is_dnc ? 'bg-rose-950/10' : ''
                  }`}
                >
                  {/* 1. LEAD & COMPANY */}
                  <td className="py-4 px-5 align-middle max-w-[240px]">
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

                      {/* LATEST NOTE DISPLAYED AT THE FRONT (Chronological Top) */}
                      {latestNote && (
                        <div 
                          className="flex items-center space-x-1 text-[11px] text-amber-300/90 bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 rounded-md truncate max-w-full"
                          title={latestNote}
                        >
                          <FileText className="w-3 h-3 text-amber-400 shrink-0" />
                          <span className="truncate">
                            <strong className="text-amber-200">Note:</strong> {latestNote.replace(/^📝\s*(Stage Note \(Step \d\):|Initial Context Note:)?\s*/, '')}
                          </span>
                        </div>
                      )}

                      <div className="text-[11px] text-slate-400 flex items-center justify-between font-mono pt-0.5">
                        <span className="flex items-center space-x-1">
                          <span>🗓️</span>
                          <span>{lead.created_at ? lead.created_at.slice(0, 10) : '2026-10-18'}</span>
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setNoteModalLead(lead);
                            setQuickNoteText('');
                          }}
                          className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold hover:underline"
                        >
                          + Add Note
                        </button>
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

                  {/* 4. CADENCE STAGE & DYNAMIC ACTION BUTTON */}
                  <td className="py-4 px-4 align-middle">
                    <div className="space-y-1.5">
                      {lead.stage === 'lead_added' ? (
                        <>
                          <span className="inline-block px-3 py-1 rounded-lg bg-blue-950/80 border border-blue-600/60 text-blue-300 text-xs font-bold">
                            📥 1. RAW OUTREACH
                          </span>
                          <div className="flex items-center space-x-1.5 pt-0.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                passAudit(lead.id);
                              }}
                              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md active:scale-95 transition-all"
                              title="Directly verify and pass audit"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>✓ Pass Audit</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                sendToAudit(lead.id);
                              }}
                              className="inline-flex items-center space-x-1 px-2 py-1.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold border border-slate-700 active:scale-95 transition-all"
                              title="Queue for quality audit review"
                            >
                              <span>Send to Audit</span>
                            </button>
                          </div>
                        </>
                      ) : lead.stage === 'audit' || lead.stage === 'pending_approval' ? (
                        <>
                          <span className="inline-block px-3 py-1 rounded-lg bg-amber-950/80 border border-amber-600/60 text-amber-300 text-xs font-bold animate-pulse">
                            🔍 2. IN AUDIT STAGE
                          </span>
                          <div className="pt-0.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                passAudit(lead.id);
                              }}
                              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md active:scale-95 transition-all"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>✓ Pass Audit → Audited</span>
                            </button>
                          </div>
                        </>
                      ) : lead.stage === 'audited' || (lead.stage === 'approved' && !lead.current_assignee_id) ? (
                        <>
                          <span className="inline-block px-3 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-xs font-bold">
                            ✅ 3. AUDITED (READY TO ASSIGN)
                          </span>
                          <div className="pt-0.5">
                            <span className="inline-flex items-center space-x-1 text-[11px] text-cyan-300 font-bold bg-cyan-950/60 px-2 py-1 rounded-lg border border-cyan-700/60">
                              <span>👉 Select Member in Next Column</span>
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Current Cadence Stage Pill */}
                          <span className="inline-block px-3 py-1 rounded-lg bg-slate-900 border border-slate-700/80 text-slate-200 text-xs font-bold">
                            {stepPill}
                          </span>

                          {/* Sequential Advance Button */}
                          <div>
                            <button
                              type="button"
                              disabled={buttonDetails.isDone}
                              onClick={(e) => handleAdvanceClick(e, lead)}
                              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs shadow-md active:scale-95 transition-all ${buttonDetails.bg}`}
                            >
                              {!buttonDetails.isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              <span>{buttonDetails.label}</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </td>

                  {/* 5. MESSAGE STATUS (Mandatory for next stage) */}
                  <td className="py-4 px-4 align-middle">
                    {lead.stage === 'lead_added' || lead.stage === 'audit' || lead.stage === 'pending_approval' || lead.stage === 'audited' ? (
                      <div className="text-[11px] text-slate-500 italic">
                        Awaiting Cadence
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="relative inline-block">
                          <select
                            value={lead.last_client_reaction || 'unseen'}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => handleReactionChange(e, lead.id)}
                            className={`px-3 py-1.5 pr-8 rounded-xl bg-slate-900 border text-xs font-bold appearance-none cursor-pointer focus:outline-none ${
                              lead.last_client_reaction === 'unseen' && currentStep >= 1
                                ? 'border-amber-500/80 text-amber-300 ring-1 ring-amber-500/40 bg-amber-950/40'
                                : 'border-slate-700 hover:border-slate-600 text-slate-200'
                            }`}
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

                        {lead.last_client_reaction === 'unseen' && currentStep >= 1 ? (
                          <p className="text-[10px] text-amber-400 font-bold flex items-center space-x-1">
                            <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                            <span>Update status before FU!</span>
                          </p>
                        ) : (
                          <p className="text-[10px] text-slate-500 font-medium">
                            Last Msg ({lastMsgLabel})
                          </p>
                        )}
                      </div>
                    )}
                  </td>

                  {/* 6. PIPELINE STATUS & TEAM LEADER ASSIGNEE */}
                  <td className="py-4 px-4 align-middle">
                    <div className="space-y-1.5">
                      {/* Pipeline Stage Badge */}
                      {lead.is_dnc ? (
                        <span className="inline-block px-3 py-1 rounded-full text-[11px] font-black bg-rose-950/80 border border-rose-500/60 text-rose-300 uppercase tracking-wider">
                          🚫 DNC
                        </span>
                      ) : lead.cadence_step >= 6 || lead.stage === 'all_done' ? (
                        <span className="inline-block px-3 py-1 rounded-full text-[11px] font-black bg-purple-950/80 border border-purple-500/60 text-purple-300 uppercase tracking-wider">
                          🎉 ALL DONE
                        </span>
                      ) : lead.stage === 'lead_added' ? (
                        <span className="inline-block px-3 py-1 rounded-full text-[11px] font-black bg-blue-950/80 border border-blue-500/60 text-blue-300 uppercase tracking-wider">
                          📥 RAW LEAD
                        </span>
                      ) : lead.stage === 'audit' || lead.stage === 'pending_approval' ? (
                        <span className="inline-block px-3 py-1 rounded-full text-[11px] font-black bg-amber-950/80 border border-amber-500/60 text-amber-300 uppercase tracking-wider animate-pulse">
                          🔍 AUDIT PENDING
                        </span>
                      ) : lead.stage === 'audited' || (lead.stage === 'approved' && !lead.current_assignee_id) ? (
                        <span className="inline-block px-3 py-1 rounded-full text-[11px] font-black bg-cyan-950/80 border border-cyan-400 text-cyan-300 uppercase tracking-wider animate-pulse">
                          ✅ AUDITED (UNASSIGNED)
                        </span>
                      ) : (
                        <span className="inline-block px-3 py-1 rounded-full text-[11px] font-black bg-[#0a1f18] border border-emerald-500/60 text-emerald-400 uppercase tracking-wider">
                          ACTIVE CADENCE
                        </span>
                      )}

                      {/* Team Leader Assign Dropdown or Assignee Badge */}
                      {showAssigneeSelector && (lead.stage === 'audited' || !lead.current_assignee_id || isLeaderOrDeputy) ? (
                        <div className="relative" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={lead.current_assignee_id || ''}
                            onChange={(e) => assignLead(lead.id, e.target.value)}
                            className={`w-full px-2 py-1 pr-6 rounded-lg text-[11px] font-bold appearance-none focus:outline-none transition-all ${
                              lead.stage === 'audited' || !lead.current_assignee_id
                                ? 'bg-cyan-950 border-2 border-cyan-400 text-cyan-200 ring-2 ring-cyan-500/40'
                                : 'bg-slate-900 border border-slate-700 hover:border-cyan-500 text-cyan-300'
                            }`}
                          >
                            <option value="">👤 Select Member to Assign...</option>
                            {teamMembers.map(m => (
                              <option key={m.id} value={m.id}>
                                {m.full_name} ({m.role.replace('_', ' ')})
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-3 h-3 text-cyan-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      ) : assignee ? (
                        <div className="text-[10px] text-slate-300 flex items-center space-x-1.5 font-bold bg-slate-900 px-2 py-1 rounded-md border border-slate-800">
                          <UserCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span className="truncate">{assignee.full_name}</span>
                        </div>
                      ) : null}
                    </div>
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
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenDetails(lead);
                        }}
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

      {/* MANDATORY STATUS UPDATE WARNING MODAL */}
      {statusModalLead && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in"
          onClick={() => setStatusModalLead(null)}
        >
          <div 
            className="w-full max-w-md bg-slate-900 border border-amber-500/60 rounded-2xl shadow-2xl p-6 space-y-4 text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2.5 text-amber-400">
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/40">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Last Message Status Required</h3>
                  <p className="text-[11px] text-slate-400">
                    Lead: <strong className="text-white">{statusModalLead.company_name}</strong>
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setStatusModalLead(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-300 leading-relaxed">
              ⚠️ You cannot advance to the next follow-up without recording what happened to the previous message. Please select the client reaction:
            </p>

            {/* Quick Status Pill Selection */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { val: 'seen', label: '👀 Seen' },
                { val: 'replied', label: '💬 Replied' },
                { val: 'interested', label: '🔥 Interested' },
                { val: 'not_interested', label: '❌ Not Interested' },
                { val: 'objection', label: '⚠️ Objection' },
              ].map(opt => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setSelectedReaction(opt.val as ClientReaction)}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left flex items-center justify-between ${
                    selectedReaction === opt.val
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-1 ring-amber-500/40'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span>{opt.label}</span>
                  {selectedReaction === opt.val && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                </button>
              ))}
            </div>

            {/* Optional Stage Note */}
            <div>
              <label className="font-semibold text-slate-300 block mb-1.5">
                📝 Add Stage Note (Optional):
              </label>
              <textarea
                rows={2}
                value={stageNote}
                onChange={(e) => setStageNote(e.target.value)}
                placeholder="Write any note about this follow-up (e.g. Sent video breakdown, asked about budget)..."
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 text-slate-200 text-xs focus:outline-none"
              />
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end space-x-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setStatusModalLead(null)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAdvanceWithStatus}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
              >
                Confirm Status & Advance →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK ADD NOTE MODAL */}
      {noteModalLead && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in"
          onClick={() => setNoteModalLead(null)}
        >
          <div 
            className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4 text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2 text-emerald-400">
                <FileText className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Add Stage Note</h3>
              </div>
              <button 
                onClick={() => setNoteModalLead(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-400 text-xs">
              Lead: <strong className="text-white">{noteModalLead.company_name}</strong>
            </p>

            <textarea
              rows={3}
              autoFocus
              value={quickNoteText}
              onChange={(e) => setQuickNoteText(e.target.value)}
              placeholder="Write note here (e.g. Sourced from TikTok ads, replied saying to text next Tuesday, scaling $20k)..."
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 text-slate-200 text-xs focus:outline-none"
            />

            <div className="flex items-center justify-end space-x-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setNoteModalLead(null)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveQuickNote}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
