'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/lib/context/app-context';
import { Lead, ClientReaction, CADENCE_STEPS } from '@/types/crm';
import { formatDistanceToNow } from 'date-fns';
import { getWhatsAppUrl } from '@/lib/phone-utils';
import { 
  X, 
  Building2, 
  User, 
  Phone, 
  Mail, 
  Globe, 
  Send, 
  AtSign, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ShieldAlert, 
  MessageSquare, 
  ExternalLink, 
  Lock, 
  RotateCcw, 
  Zap, 
  Award,
  ChevronRight,
  TrendingUp,
  Clock
} from 'lucide-react';

export function LeadDetailsDrawer() {
  const { 
    selectedLead, 
    isLeadDrawerOpen, 
    setIsLeadDrawerOpen, 
    currentUser, 
    teamMembers, 
    activities, 
    approveLead, 
    rejectLead, 
    advanceCadence, 
    updateClientReaction, 
    markAsDnc, 
    triggerAudit, 
    transferToSalesPipeline, 
    recycleLead, 
    addActivityNote 
  } = useApp();

  const [noteText, setNoteText] = useState('');
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [selectedCloserId, setSelectedCloserId] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [dncReason, setDncReason] = useState('');
  const [isDncModalOpen, setIsDncModalOpen] = useState(false);
  const [cadenceError, setCadenceError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!isLeadDrawerOpen || !selectedLead) return null;

  const lead = selectedLead;
  const isLeader = currentUser.role === 'team_leader';
  const isDeputy = currentUser.is_deputy;
  const canApprove = isLeader || isDeputy;

  // Closers list for sales pipeline handover
  const closers = teamMembers.filter(m => m.role === 'sales_closer' && m.is_active);

  // Chronological Activity Notes for this lead, sorted reverse-chronologically (Newest first)
  const leadActivities = activities
    .filter(a => a.lead_id === lead.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Smart @mention suggestions: prioritize the original hunter first
  const mentionSuggestions = useMemo(() => {
    return [...teamMembers].sort((a, b) => {
      if (a.id === lead.original_hunter_id) return -1;
      if (b.id === lead.original_hunter_id) return 1;
      return 0;
    }).filter(m => (m.full_name || '').toLowerCase().includes(mentionFilter.toLowerCase()));
  }, [teamMembers, lead.original_hunter_id, mentionFilter]);

  // Clickable preset chips for 1-click posting
  const presetChips = [
    '💬 WhatsApp Replied',
    '📞 Call Not Received',
    '💰 Asking for Price',
    '⏳ Follow-up in 3 Days'
  ];

  const handlePostPresetChip = (chip: string) => {
    addActivityNote(lead.id, chip, [], 'note');
    if (chip.includes('Replied')) {
      updateClientReaction(lead.id, 'replied');
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNoteText(val);

    const lastWord = val.split(/\s+/).pop() || '';
    if (lastWord.startsWith('@')) {
      setShowMentionMenu(true);
      setMentionFilter(lastWord.slice(1));
    } else {
      setShowMentionMenu(false);
    }
  };

  const handleInsertMention = (member: (typeof teamMembers)[0]) => {
    const words = noteText.split(/\s+/);
    words.pop(); // remove partial mention
    words.push(`@${member.full_name}`);
    setNoteText(words.join(' ') + ' ');
    setShowMentionMenu(false);
  };

  const handlePostNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    // Detect mentioned members
    const mentionedIds = teamMembers
      .filter(m => noteText.includes(`@${m.full_name}`))
      .map(m => m.id);

    addActivityNote(lead.id, noteText.trim(), mentionedIds, 'note');
    setNoteText('');
    setShowMentionMenu(false);
  };

  const handleAdvanceCadence = () => {
    setCadenceError(null);
    const res = advanceCadence(lead.id);
    if (!res.success && res.error) {
      setCadenceError(res.error);
    }
  };

  const handleConfirmReject = () => {
    if (!rejectReason.trim()) return;
    rejectLead(lead.id, rejectReason.trim());
    setIsRejectModalOpen(false);
    setRejectReason('');
  };

  const handleConfirmDnc = () => {
    markAsDnc(lead.id, dncReason || 'Customer requested Do Not Contact');
    setIsDncModalOpen(false);
    setDncReason('');
  };

  const hunterWaUrl = lead.hunter?.phone ? getWhatsAppUrl(lead.hunter.phone, `Hi ${lead.hunter.full_name}, regarding lead ${lead.company_name}: `) : '#';
  const leadWaUrl = lead.phone ? getWhatsAppUrl(lead.phone, `Hi ${lead.contact_name}, this is ${currentUser.full_name} from Master Ads Injection. Regarding your ad strategy for ${lead.company_name}: `) : '#';

  return (
    <div 
      className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={() => setIsLeadDrawerOpen(false)}
    >
      <div 
        className="absolute inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10 w-full sm:w-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full sm:w-screen sm:max-w-xl bg-slate-900 border-l border-slate-700/80 shadow-2xl flex flex-col h-full">
          
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-wide">
                  {lead.company_name}
                </h2>
                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-slate-400">{lead.contact_name}</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-emerald-400 font-semibold">${lead.deal_value?.toLocaleString()}/mo</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsLeadDrawerOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* DNC Hard-Lock Red Banner */}
          {lead.is_dnc && (
            <div className="p-3 bg-rose-950/90 border-b border-rose-500 text-rose-200 text-xs flex items-center justify-between animate-pulse">
              <div className="flex items-center space-x-2">
                <Lock className="w-4 h-4 text-rose-400 shrink-0" />
                <span>
                  <strong>🚫 DO NOT CONTACT HARD-LOCKED:</strong> All dispatches, WhatsApp links, and emails are disabled permanently.
                </span>
              </div>
            </div>
          )}

          {/* Drawer Body Scroll Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-300">
            
            {/* PERMANENT HUNTER ATTRIBUTION BADGE */}
            <div className="p-3 rounded-xl bg-slate-950 border border-cyan-900/60 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-full bg-cyan-950 border border-cyan-700/60 flex items-center justify-center text-xs font-bold text-cyan-300">
                  {lead.hunter?.full_name?.charAt(0) || 'H'}
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-cyan-400">
                    Permanent Hunter Attribution
                  </p>
                  <p className="text-xs font-semibold text-slate-200">
                    👤 Collected By: <strong>{lead.hunter?.full_name || 'Hunter'}</strong>
                  </p>
                </div>
              </div>

              {lead.hunter?.phone && (
                <a
                  href={hunterWaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900/80 border border-emerald-600/60 text-emerald-300 font-semibold text-[11px] flex items-center space-x-1.5 transition-colors"
                >
                  <span>💬 WhatsApp Hunter</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {/* Stage & Cadence Progression Panel */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200 text-xs flex items-center space-x-1.5">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  <span>5-Step Cadence Engine</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-950 text-cyan-300 border border-cyan-800">
                  Stage: {(lead.stage || 'lead_added').replace('_', ' ')}
                </span>
              </div>

              {/* 5-Step Visual Progression Steps */}
              <div className="grid grid-cols-5 gap-1.5 pt-1">
                {CADENCE_STEPS.map((s) => {
                  const isDone = lead.cadence_step > s.step;
                  const isCurrent = lead.cadence_step === s.step;
                  return (
                    <div
                      key={s.step}
                      className={`p-2 rounded-lg text-center border transition-all ${
                        isDone
                          ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                          : isCurrent
                          ? 'bg-cyan-950/80 border-cyan-400 text-white shadow-md shadow-cyan-500/20 ring-1 ring-cyan-400'
                          : 'bg-slate-900/40 border-slate-800 text-slate-500'
                      }`}
                    >
                      <p className="text-[10px] font-bold">{s.dayLabel}</p>
                      <p className="text-[9px] uppercase font-semibold mt-0.5">{s.channel}</p>
                    </div>
                  );
                })}
              </div>

              {/* Client Reaction Selector & Mistake Guard Alert */}
              <div className="pt-2 border-t border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-slate-400">
                    Logged Client Reaction:
                  </label>
                  <span className="text-[11px] font-bold text-cyan-300 uppercase">
                    [{lead.last_client_reaction}]
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {(['unseen', 'seen', 'replied', 'interested', 'not_interested'] as ClientReaction[]).map((rx) => (
                    <button
                      key={rx}
                      type="button"
                      onClick={() => updateClientReaction(lead.id, rx)}
                      className={`px-2 py-1 rounded text-[10px] font-semibold uppercase transition-all ${
                        lead.last_client_reaction === rx
                          ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                          : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {rx}
                    </button>
                  ))}
                </div>

                {/* Cadence Advance Mistake Guard Warning */}
                {cadenceError && (
                  <div className="p-2.5 rounded-lg bg-rose-950/80 border border-rose-500/60 text-rose-200 text-xs flex items-start space-x-2 animate-in fade-in">
                    <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                    <span>{cadenceError}</span>
                  </div>
                )}

                <div className="flex items-center space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={handleAdvanceCadence}
                    disabled={lead.is_dnc}
                    className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-md shadow-cyan-600/20 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center space-x-1.5 transition-all"
                  >
                    <span>Advance Cadence (Step {lead.cadence_step + 1})</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Direct Channel Outreach Buttons (WhatsApp / Mailto with DNC lock) */}
            <div className="grid grid-cols-2 gap-3">
              <a
                href={lead.is_dnc ? undefined : leadWaUrl}
                target={lead.is_dnc ? undefined : '_blank'}
                rel="noopener noreferrer"
                onClick={(e) => lead.is_dnc && e.preventDefault()}
                className={`py-2.5 px-3 rounded-xl border flex items-center justify-center space-x-2 font-bold transition-all ${
                  lead.is_dnc
                    ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                    : 'bg-emerald-950/80 border-emerald-600/70 hover:bg-emerald-900/80 text-emerald-300 shadow-md shadow-emerald-950/50'
                }`}
              >
                <span>💬 WhatsApp Lead</span>
                {lead.is_dnc && <Lock className="w-3.5 h-3.5 text-rose-400" />}
              </a>

              <a
                href={lead.is_dnc ? undefined : `mailto:${lead.email}?subject=Master Ads Strategy for ${encodeURIComponent(lead.company_name)}`}
                onClick={(e) => lead.is_dnc && e.preventDefault()}
                className={`py-2.5 px-3 rounded-xl border flex items-center justify-center space-x-2 font-bold transition-all ${
                  lead.is_dnc
                    ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                    : 'bg-cyan-950/80 border-cyan-600/70 hover:bg-cyan-900/80 text-cyan-300 shadow-md shadow-cyan-950/50'
                }`}
              >
                <span>📧 Email Lead</span>
                {lead.is_dnc && <Lock className="w-3.5 h-3.5 text-rose-400" />}
              </a>
            </div>

            {/* Approval Gate Actions (Leader & Deputy only) */}
            {lead.stage === 'pending_approval' && (
              <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-600/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-300 text-xs flex items-center space-x-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    <span>Pending Approval Queue</span>
                  </span>
                  {lead.is_audit_sample && (
                    <span className="text-[10px] font-bold bg-purple-950/80 text-purple-300 border border-purple-600/50 px-2 py-0.5 rounded">
                      🎲 10% Quality Audit Sample
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  {canApprove 
                    ? 'Review lead data before approving into active cadence outreach.'
                    : 'Awaiting Team Leader or Deputy review.'}
                </p>

                {canApprove && (
                  <div className="flex items-center space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => approveLead(lead.id)}
                      className="flex-1 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
                    >
                      ✓ Approve Lead
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsRejectModalOpen(true)}
                      className="flex-1 py-2 px-3 rounded-xl bg-rose-950 hover:bg-rose-900 border border-rose-600/60 text-rose-200 font-bold text-xs transition-colors"
                    >
                      ✕ Reject with Reason
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Replied -> Trigger Audit Bridge */}
            {lead.stage === 'replied' && (
              <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-500/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-300 text-xs flex items-center space-x-1.5">
                    <Award className="w-4 h-4 text-purple-400" />
                    <span>Prospect Replied! Ready for Audit</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Trigger an ad audit task to assemble competitor injection teardown decks.
                </p>
                <button
                  type="button"
                  onClick={() => triggerAudit(lead.id)}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-purple-600/30 transition-all active:scale-95"
                >
                  🎯 Trigger Ad Audit Deck
                </button>
              </div>
            )}

            {/* Audit / Replied -> Handover to Sales Pipeline */}
            {(lead.stage === 'audit' || lead.stage === 'replied') && (
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-600/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-300 text-xs flex items-center space-x-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span>Transfer to Sales Pipeline</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Hand over qualified audit lead to a Sales Closer. Original hunter attribution remains permanently locked.
                </p>

                <div className="flex items-center space-x-2">
                  <select
                    value={selectedCloserId}
                    onChange={(e) => setSelectedCloserId(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:outline-none"
                  >
                    <option value="">Select Sales Closer...</option>
                    {closers.map(c => (
                      <option key={c.id} value={c.id}>{c.full_name} ({c.role})</option>
                    ))}
                  </select>

                  <button
                    type="button"
                    disabled={!selectedCloserId}
                    onClick={() => transferToSalesPipeline(lead.id, selectedCloserId)}
                    className="py-2 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
                  >
                    🚀 Transfer
                  </button>
                </div>
              </div>
            )}

            {/* 30-Day Recycle Pool action (allowed once only) */}
            {lead.stage === 'recycle_pool' && (
              <div className="p-4 rounded-xl bg-sky-950/40 border border-sky-500/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sky-300 text-xs flex items-center space-x-1.5">
                    <RotateCcw className="w-4 h-4 text-sky-400" />
                    <span>30-Day Cold Lead Recycle Pool</span>
                  </span>
                  <span className="text-[10px] font-bold text-sky-400">
                    Cycle: {lead.recycled_count}/1
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Re-assign to a fresh hunter and restart cadence from Day 0. (Permitted 1 time only).
                </p>
                <button
                  type="button"
                  onClick={() => recycleLead(lead.id)}
                  className="w-full py-2 px-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition-all active:scale-95"
                >
                  ♻️ Recycle Lead to Day 0
                </button>
              </div>
            )}

            {/* DNC Hard-Lock Button */}
            {!lead.is_dnc && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setIsDncModalOpen(true)}
                  className="w-full py-2 px-3 rounded-xl bg-slate-950 border border-rose-900/60 hover:bg-rose-950/40 text-rose-400 font-semibold text-xs transition-colors flex items-center justify-center space-x-1.5"
                >
                  <Lock className="w-3.5 h-3.5 text-rose-500" />
                  <span>Mark as "Do Not Contact" (DNC Hard-Lock)</span>
                </button>
              </div>
            )}

            {/* ACTIVITY TIMELINE & REVERSE-CHRONOLOGICAL NOTES */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-200 flex items-center space-x-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Activity Timeline & Notes ({leadActivities.length})</span>
                </h3>
                <span className="text-[10px] text-slate-500">Sorted Newest First</span>
              </div>

              {/* 1-Click Preset Chips */}
              <div>
                <p className="text-[10px] font-semibold text-slate-400 mb-1.5">1-Click Quick Note Chips:</p>
                <div className="flex flex-wrap gap-1.5">
                  {presetChips.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => handlePostPresetChip(chip)}
                      className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700/80 text-[11px] font-medium text-slate-300 hover:text-white transition-colors"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Add Note Form with Smart @Mention Autocomplete */}
              <form onSubmit={handlePostNote} className="relative space-y-2 pt-1">
                <div className="relative">
                  <textarea
                    rows={3}
                    value={noteText}
                    onChange={handleTextChange}
                    placeholder="Type a note or use @ to mention team members..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 text-slate-200 placeholder-slate-500 text-xs focus:outline-none"
                  />

                  {/* @Mention Autocomplete Popover */}
                  {showMentionMenu && mentionSuggestions.length > 0 && (
                    <div className="absolute bottom-full left-0 mb-1 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1 z-30 max-h-48 overflow-y-auto">
                      <p className="text-[10px] uppercase font-bold text-slate-500 px-2 py-1">Mention Member</p>
                      {mentionSuggestions.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => handleInsertMention(m)}
                          className="w-full text-left p-1.5 rounded-lg hover:bg-slate-800 flex items-center justify-between text-xs transition-colors"
                        >
                          <span className="font-semibold text-slate-200">{m.full_name}</span>
                          <span className="text-[10px] text-cyan-400 capitalize">
                            {m.id === lead.original_hunter_id ? '⭐ Original Hunter' : (m.role || '').replace('_', ' ')}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setNoteText(prev => prev + '@');
                      setShowMentionMenu(true);
                    }}
                    className="text-[11px] text-slate-400 hover:text-cyan-400 flex items-center space-x-1"
                  >
                    <AtSign className="w-3 h-3" />
                    <span>Mention Hunter</span>
                  </button>

                  <button
                    type="submit"
                    disabled={!noteText.trim()}
                    className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-bold text-xs flex items-center space-x-1 transition-all"
                  >
                    <Send className="w-3 h-3" />
                    <span>Post Note</span>
                  </button>
                </div>
              </form>

              {/* Notes List (Reverse-Chronological) */}
              <div className="space-y-2.5 pt-2">
                {leadActivities.map((act) => {
                  const author = teamMembers.find(m => m.id === act.author_id);
                  let timeAgo = 'Just now';
                  if (mounted) {
                    try {
                      timeAgo = formatDistanceToNow(new Date(act.created_at), { addSuffix: true });
                    } catch {}
                  }

                  return (
                    <div 
                      key={act.id} 
                      className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-white">
                            {author?.full_name || 'System'}
                          </span>
                          <span className="text-slate-500 text-[10px]">
                            ({author?.role?.replace('_', ' ') || 'auto'})
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{timeAgo}</span>
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                        {act.content}
                      </p>
                    </div>
                  );
                })}
              </div>

            </div>

          </div>

        </div>
      </div>

      {/* Reject Modal */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <XCircle className="w-4 h-4 text-rose-400" />
              <span>Reject Lead & Return to Hunter</span>
            </h3>
            <p className="text-xs text-slate-400">
              Provide feedback for the hunter. Rejection resets the hunter's consecutive approval streak.
            </p>
            <textarea
              rows={3}
              required
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Brand currently running under $5k/mo on Meta Ads, does not meet our minimum threshold."
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-rose-500 text-slate-200 text-xs focus:outline-none"
            />
            <div className="flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={!rejectReason.trim()}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-bold text-xs"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DNC Hard-Lock Reason Modal */}
      {isDncModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-rose-600/70 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-rose-300 flex items-center space-x-2">
              <Lock className="w-4 h-4 text-rose-500" />
              <span>Activate Do Not Contact (DNC Hard-Lock)</span>
            </h3>
            <p className="text-xs text-slate-400">
              This lead will be permanently locked. All WhatsApp click-to-chat links, mailto dispatches, and bulk outreach will be disabled. Excluded from Recycle Pool permanently.
            </p>
            <textarea
              rows={2}
              value={dncReason}
              onChange={(e) => setDncReason(e.target.value)}
              placeholder="Reason for DNC (e.g. Client explicitly requested opt-out under TCPA)..."
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none"
            />
            <div className="flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsDncModalOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDnc}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
              >
                Permanently Lock Lead (DNC)
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
