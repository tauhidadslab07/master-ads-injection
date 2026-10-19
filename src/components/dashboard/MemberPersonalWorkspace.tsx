'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/context/app-context';
import { Lead, TeamMember, ClientReaction, CADENCE_STEPS, OutreachChannel } from '@/types/crm';
import { getWhatsAppUrl } from '@/lib/phone-utils';
import { soundEngine } from '@/lib/audio-chime';
import { detectCountryFromPhone, getCountryLocalTime } from '@/lib/country-codes';
import { 
  Zap, 
  Flame, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  MessageSquare, 
  Mail, 
  ExternalLink, 
  Copy, 
  Check, 
  Target, 
  Sparkles, 
  Send, 
  ShieldAlert, 
  Users, 
  Award, 
  Calendar, 
  Lock, 
  ArrowRight, 
  FileText, 
  X, 
  Bell, 
  Volume2, 
  RefreshCw, 
  TrendingUp,
  AlertCircle,
  PhoneCall,
  Crown,
  Eye,
  Edit3,
  ThumbsUp,
  ThumbsDown,
  UserCheck
} from 'lucide-react';

export function MemberPersonalWorkspace() {
  const { 
    leads, 
    currentUser, 
    teamMembers, 
    activities, 
    mistakes, 
    dailyTasks,
    advanceCadence, 
    updateClientReaction, 
    setSelectedLead, 
    setIsLeadDrawerOpen, 
    setIsFocusModeOpen,
    triggerEmergencyLeave,
    updateMemberLeaveSchedule,
    submitBatchToLeader,
    resubmitRejectedLead,
    passAudit,
    assignLead
  } = useApp();

  // Sales dispatch state for Team Leader
  const [workspaceSalesChannels, setWorkspaceSalesChannels] = useState<Record<string, OutreachChannel>>({});
  const [dispatchNotice, setDispatchNotice] = useState<string | null>(null);

  // Audited leads waiting for Sales Dispatch (Team Leader view)
  const readyForSalesLeads = useMemo(() => {
    return leads.filter(l => l.stage === 'audited');
  }, [leads]);

  // If leader, allow inspecting any member's personal workspace
  const [inspectedMemberId, setInspectedMemberId] = useState<string>(currentUser.id);

  // Sync inspectedMemberId if currentUser changes
  useEffect(() => {
    setInspectedMemberId(currentUser.id);
  }, [currentUser.id]);

  const activeMember: TeamMember = useMemo(() => {
    return teamMembers.find(m => m.id === inspectedMemberId) || currentUser;
  }, [teamMembers, inspectedMemberId, currentUser]);

  // Section 1 Queue Tab
  const [activeQueueTab, setActiveQueueTab] = useState<'next_best' | 'overdue' | 'pending_audits'>('next_best');
  
  // Copy to clipboard state
  const [copiedPhoneId, setCopiedPhoneId] = useState<string | null>(null);

  // Batch submit modal state
  const [isBatchSubmitModalOpen, setIsBatchSubmitModalOpen] = useState(false);
  const [batchSubmitNote, setBatchSubmitNote] = useState('');
  const [batchSubmittedNotice, setBatchSubmittedNotice] = useState<string | null>(null);

  // Emergency leave modal state
  const [isEmergencyLeaveModalOpen, setIsEmergencyLeaveModalOpen] = useState(false);
  const [emergencyLeaveNotice, setEmergencyLeaveNotice] = useState<string | null>(null);

  // Planned leave schedule inputs
  const [leaveStartDate, setLeaveStartDate] = useState(activeMember.leave_start_date || '');
  const [leaveEndDate, setLeaveEndDate] = useState(activeMember.leave_end_date || '');
  const [isOnLeaveToggle, setIsOnLeaveToggle] = useState(activeMember.on_leave || false);
  const [leaveSaveSuccess, setLeaveSaveSuccess] = useState(false);

  // Revision modal state (Section 4)
  const [revisionLead, setRevisionLead] = useState<Lead | null>(null);
  const [revisedPhone, setRevisedPhone] = useState('');
  const [revisedEmail, setRevisedEmail] = useState('');
  const [revisedNotes, setRevisedNotes] = useState('');

  // Daily target goals (customizable or defaults)
  const outreachTarget = 25;
  const huntingTarget = 20;

  // Track copy
  const handleCopyPhone = (leadId: string, phone: string) => {
    if (!phone) return;
    navigator.clipboard.writeText(phone);
    setCopiedPhoneId(leadId);
    soundEngine.playSuccessChime();
    setTimeout(() => setCopiedPhoneId(null), 2000);
  };

  // 1. Leads assigned to the active member
  const memberAssignedLeads = useMemo(() => {
    return leads.filter(l => l.current_assignee_id === activeMember.id && !l.is_dnc);
  }, [leads, activeMember.id]);

  // 2. Leads audited / waiting for audit by active member
  const memberAuditLeads = useMemo(() => {
    return leads.filter(l => l.auditor_id === activeMember.id && l.stage === 'audit');
  }, [leads, activeMember.id]);

  // 3. Leads originally hunted by active member
  const memberHuntedLeads = useMemo(() => {
    return leads.filter(l => l.original_hunter_id === activeMember.id);
  }, [leads, activeMember.id]);

  // Section 1 Queues:
  // a) Recommended Next Best Action
  // Criteria: Client is in business hours, OR prospect previously replied/interested, OR scheduled callback today
  const recommendedLeads = useMemo(() => {
    return memberAssignedLeads.filter(l => {
      if (l.stage === 'all_done' || l.stage === 'closed_won' || l.stage === 'closed_lost') return false;

      // Has prospect replied or interested?
      const isEngaged = l.last_client_reaction === 'replied' || l.last_client_reaction === 'interested' || l.stage === 'replied';

      // Is client in business hours?
      const country = detectCountryFromPhone(l.phone || l.phone_e164 || '');
      const { isBusinessHours } = country ? getCountryLocalTime(country.code) : { isBusinessHours: true };

      // Scheduled callback today
      const todayStr = new Date().toISOString().slice(0, 10);
      const isCallbackToday = l.scheduled_callback_date === todayStr;

      return isEngaged || isBusinessHours || isCallbackToday;
    });
  }, [memberAssignedLeads]);

  // b) Overdue Follow-ups
  // Criteria: in cadence step >= 1 with last status unseen or due
  const overdueLeads = useMemo(() => {
    return memberAssignedLeads.filter(l => {
      if (l.stage === 'all_done' || l.stage === 'closed_won' || l.stage === 'closed_lost') return false;
      return l.cadence_step >= 1 && l.last_client_reaction === 'unseen';
    });
  }, [memberAssignedLeads]);

  // c) Pending Audits & Tasks
  const pendingMemberTasks = useMemo(() => {
    return dailyTasks.filter(t => {
      const status = t.assignee_statuses[activeMember.id]?.status || 'pending';
      return t.assigned_member_ids.includes(activeMember.id) && status !== 'completed';
    });
  }, [dailyTasks, activeMember.id]);

  // Section 2: Progress Calculations
  const outreachCompletedCount = useMemo(() => {
    return activities.filter(a => a.author_id === activeMember.id && (a.activity_type === 'cadence_advance' || a.activity_type === 'status_change')).length;
  }, [activities, activeMember.id]);

  const leadsHuntedCount = useMemo(() => {
    return memberHuntedLeads.length;
  }, [memberHuntedLeads]);

  const outreachProgressPercent = Math.min(100, Math.round((outreachCompletedCount / outreachTarget) * 100));
  const huntingProgressPercent = Math.min(100, Math.round((leadsHuntedCount / huntingTarget) * 100));

  // Section 3: Performance & Traffic Light Score
  const successRate = useMemo(() => {
    const totalDue = Math.max(1, memberAssignedLeads.length);
    const overdueCount = overdueLeads.length;
    const rate = Math.round(((totalDue - overdueCount) / totalDue) * 100);
    return Math.max(60, Math.min(100, rate));
  }, [memberAssignedLeads.length, overdueLeads.length]);

  const trafficLight = useMemo(() => {
    if (successRate >= 90) {
      return {
        color: 'green',
        badgeClass: 'bg-emerald-950 text-emerald-300 border-emerald-500/60',
        dotClass: 'bg-emerald-400',
        text: '🟢 Green (৯০%+): গ্রেট পারফরম্যান্স! আপনি টপ স্পিডে অন-টাইম কাজ সম্পন্ন করছেন।',
        shortText: 'Great Performance'
      };
    } else if (successRate >= 76) {
      return {
        color: 'yellow',
        badgeClass: 'bg-amber-950 text-amber-300 border-amber-500/60',
        dotClass: 'bg-amber-400',
        text: '🟡 Yellow (৭৬% – ৯০%): আরও উন্নতি প্রয়োজন। বকেয়া ফলো-আপগুলো দ্রুত সম্পন্ন করুন।',
        shortText: 'Needs Improvement'
      };
    } else {
      return {
        color: 'red',
        badgeClass: 'bg-rose-950 text-rose-300 border-rose-500/60',
        dotClass: 'bg-rose-400',
        text: '🔴 Red (< ৭৫%): সতর্কতা সংকেত! বকেয়া লিডগুলোতে দ্রুত মেসেজ পাঠানো প্রয়োজন।',
        shortText: 'Warning Alert'
      };
    }
  }, [successRate]);

  // Section 4: Private Mistake & Quality Tracker
  const memberRejectedLeads = useMemo(() => {
    return leads.filter(l => l.original_hunter_id === activeMember.id && !!l.rejection_reason);
  }, [leads, activeMember.id]);

  const memberMistakesList = useMemo(() => {
    return mistakes.filter(m => m.member_id === activeMember.id);
  }, [mistakes, activeMember.id]);

  // Section 5: Priority Notifications & Mentions Feed
  const memberMentionsFeed = useMemo(() => {
    return activities.filter(a => {
      const isMentioned = a.mentions?.includes(activeMember.id);
      const isLeaderRemark = a.author_id === 'usr-tauhid' && a.author_id !== activeMember.id;
      return isMentioned || isLeaderRemark;
    }).slice(0, 10);
  }, [activities, activeMember.id]);

  // Quick reaction handler
  const handleQuickReaction = (leadId: string, reaction: ClientReaction) => {
    updateClientReaction(leadId, reaction);
    soundEngine.playSuccessChime();
  };

  // Quick advance cadence
  const handleQuickAdvance = (leadId: string) => {
    const res = advanceCadence(leadId);
    if (res.success) {
      soundEngine.playSuccessChime();
    }
  };

  // Batch submit action
  const handleConfirmBatchSubmit = () => {
    const res = submitBatchToLeader(batchSubmitNote.trim() || undefined);
    setBatchSubmittedNotice(res.message);
    setIsBatchSubmitModalOpen(false);
    setBatchSubmitNote('');
    setTimeout(() => setBatchSubmittedNotice(null), 6000);
  };

  // Emergency leave action
  const handleConfirmEmergencyLeave = async () => {
    const res = await triggerEmergencyLeave(activeMember.id);
    if (res.success) {
      setEmergencyLeaveNotice(`🚨 ইমার্জেন্সি লিভ সক্রিয় হয়েছে! আপনার ${res.reassignedCount}টি রানিং লিড সক্রিয় মেম্বারদের মাঝে সমানভাবে বণ্টন করা হয়েছে।`);
    }
    setIsEmergencyLeaveModalOpen(false);
    setTimeout(() => setEmergencyLeaveNotice(null), 7000);
  };

  // Planned leave save
  const handleSaveLeaveSchedule = () => {
    updateMemberLeaveSchedule(activeMember.id, leaveStartDate, leaveEndDate, isOnLeaveToggle);
    setLeaveSaveSuccess(true);
    setTimeout(() => setLeaveSaveSuccess(false), 4000);
  };

  // Resubmit revision
  const handleResubmitRevision = () => {
    if (!revisionLead) return;
    resubmitRejectedLead(revisionLead.id, {
      phone: revisedPhone.trim() || revisionLead.phone,
      email: revisedEmail.trim() || revisionLead.email
    });
    setRevisionLead(null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">

      {/* TOP NOTIFICATIONS / BANNERS */}
      {dispatchNotice && (
        <div className="p-4 rounded-2xl bg-emerald-950/95 border-2 border-emerald-400 text-emerald-200 text-xs font-bold shadow-2xl flex items-center justify-between animate-in fade-in">
          <div className="flex items-center space-x-2.5">
            <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{dispatchNotice}</span>
          </div>
          <button onClick={() => setDispatchNotice(null)} className="p-1 text-emerald-300 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {batchSubmittedNotice && (
        <div className="p-4 rounded-2xl bg-emerald-950/90 border-2 border-emerald-400 text-emerald-200 text-xs font-bold shadow-2xl flex items-center justify-between animate-in fade-in">
          <div className="flex items-center space-x-2.5">
            <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{batchSubmittedNotice}</span>
          </div>
          <button onClick={() => setBatchSubmittedNotice(null)} className="p-1 text-emerald-300 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {emergencyLeaveNotice && (
        <div className="p-4 rounded-2xl bg-rose-950/90 border-2 border-rose-400 text-rose-200 text-xs font-bold shadow-2xl flex items-center justify-between animate-in fade-in">
          <div className="flex items-center space-x-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{emergencyLeaveNotice}</span>
          </div>
          <button onClick={() => setEmergencyLeaveNotice(null)} className="p-1 text-rose-300 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* LEADER INSPECTION SELECTOR (Only shown if current logged in user is Leader) */}
      {currentUser.role === 'team_leader' && (
        <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/50 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <Crown className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-amber-200">টিম লিডার মোড:</span>
            <span className="text-slate-300">যেকোনো মেম্বারের ব্যক্তিগত ড্যাশবোর্ড লাইভ পর্যবেক্ষণ করুন:</span>
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={inspectedMemberId}
              onChange={(e) => setInspectedMemberId(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-amber-500/60 font-bold text-white text-xs focus:outline-none"
            >
              {teamMembers.map(m => (
                <option key={m.id} value={m.id}>
                  {m.role === 'team_leader' ? '👑' : '👤'} {m.full_name} ({m.role}) {m.id === currentUser.id ? '(My Workspace)' : ''}
                </option>
              ))}
            </select>

            {inspectedMemberId !== currentUser.id && (
              <button
                type="button"
                onClick={() => setInspectedMemberId(currentUser.id)}
                className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs"
              >
                Reset to Me
              </button>
            )}
          </div>
        </div>
      )}

      {/* WORKSPACE HEADER BAR */}
      <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-slate-800 border-2 border-cyan-500/50 overflow-hidden flex items-center justify-center text-xl font-black text-cyan-300 shadow-lg shadow-cyan-950/40">
              {activeMember.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={activeMember.avatar_url} alt={activeMember.full_name} className="w-full h-full object-cover" />
              ) : (
                activeMember.full_name.charAt(0)
              )}
            </div>
            <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 ${
              activeMember.on_leave ? 'bg-rose-500' : 'bg-emerald-500'
            }`} />
          </div>

          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {activeMember.full_name} এর ব্যক্তিগত ড্যাশবোর্ড
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                activeMember.role === 'team_leader'
                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                  : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
              }`}>
                {activeMember.role === 'team_leader' ? '👑 Leader' : 'Specialist'}
              </span>
            </div>

            <p className="text-xs text-slate-400 flex items-center space-x-2">
              <span>@{activeMember.username}</span>
              <span>•</span>
              <span className="text-amber-400 font-bold flex items-center">
                <Flame className="w-3.5 h-3.5 mr-0.5" />
                {activeMember.consecutive_approvals}-Day Streak
              </span>
              <span>•</span>
              <span className="text-slate-300 font-medium">
                {activeMember.on_leave ? '🔴 ছুটিতে আছেন' : '🟢 কাজে সক্রিয়'}
              </span>
            </p>
          </div>
        </div>

        {/* Action Buttons: Launch Focus Mode & Emergency Leave */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsFocusModeOpen(true)}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 hover:opacity-95 text-slate-950 font-black text-xs shadow-xl shadow-cyan-500/25 flex items-center space-x-2 active:scale-95 transition-all"
          >
            <Zap className="w-4 h-4 fill-slate-950 stroke-none" />
            <span>Launch Focus Mode (ফুল-স্ক্রিন মোড)</span>
          </button>

          <button
            type="button"
            onClick={() => setIsEmergencyLeaveModalOpen(true)}
            className="px-4 py-3 rounded-2xl bg-rose-500/15 hover:bg-rose-500 border border-rose-500/40 hover:border-rose-400 text-rose-300 hover:text-slate-950 font-bold text-xs flex items-center space-x-1.5 transition-all shadow-md"
            title="জরুরি ছুটি চালু করুন"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Emergency Leave</span>
          </button>
        </div>
      </div>

      {/* ========================================================================================= */}
      {/* 🚀 LEADER DASHBOARD EXCLUSIVE: অডিট সম্পন্ন লিডসমূহ (সেলস টিমে পাঠানোর জন্য প্রস্তুত) */}
      {/* Consistent Unified Emerald Green Color Scheme matching /audited-leads Ready for Sales */}
      {/* ========================================================================================= */}
      {currentUser.role === 'team_leader' && (
        <div className="p-5 sm:p-6 rounded-3xl bg-emerald-950/25 border-2 border-emerald-500/60 shadow-2xl shadow-emerald-950/40 space-y-4 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-800/60 pb-3.5">
            <div className="space-y-1">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-300 shadow-md">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-white flex items-center space-x-2">
                    <span>🚀 অডিট সম্পন্ন লিডসমূহ (Ready for Sales Dispatch)</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-500 text-slate-950 shadow-sm">
                      {readyForSalesLeads.length} টি প্রস্তুত
                    </span>
                  </h2>
                  <p className="text-xs text-emerald-200/80">
                    অডিটর কর্তৃক অডিট সম্পন্ন হওয়া লিড। নিচের মেম্বার বাটনে ক্লিক করে সাথে সাথে WhatsApp বা Email মেসেজ পাঠানোর দায়িত্ব দিন।
                  </p>
                </div>
              </div>
            </div>

            {/* Link to full Audited Leads page */}
            <Link
              href="/audited-leads"
              className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-emerald-900/70 hover:bg-emerald-800 border border-emerald-500/60 text-emerald-200 font-bold text-xs flex items-center space-x-1.5 transition-all group shadow-sm"
            >
              <span>2. Audited Leads View ({readyForSalesLeads.length})</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Leads List or Empty State */}
          {readyForSalesLeads.length === 0 ? (
            <div className="p-6 text-center rounded-2xl bg-emerald-950/40 border border-emerald-900/60 space-y-1">
              <p className="text-xs font-bold text-emerald-300">✓ কোনো পেন্ডিং অডিটেড লিড নেই</p>
              <p className="text-[11px] text-slate-400">
                অডিটর কোনো লিডের অডিট সম্পন্ন করলে সেলস টিমে পাঠানোর জন্য এখানে শো করবে।
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {readyForSalesLeads.map(lead => {
                const country = (lead.phone ? detectCountryFromPhone(lead.phone) : null);
                const { timeString, isBusinessHours } = country ? getCountryLocalTime(country.code) : { timeString: '1:34 PM', isBusinessHours: true };
                const channel = workspaceSalesChannels[lead.id] || lead.channel || 'whatsapp';
                const auditor = teamMembers.find(m => m.id === (lead.auditor_id || lead.current_assignee_id));
                const approver = teamMembers.find(m => m.id === lead.approved_by);

                return (
                  <div 
                    key={lead.id}
                    className="p-4 rounded-2xl bg-emerald-950/30 hover:bg-emerald-950/50 border-l-4 border-l-emerald-500 border border-emerald-800/60 shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all"
                  >
                    {/* Left: Company & Meta */}
                    <div className="space-y-1.5 min-w-[260px]">
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-sm text-white">{lead.company_name}</span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-900/80 text-emerald-300 border border-emerald-600/60">
                          ✓ Verified Audited
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                        {lead.website && (
                          <a 
                            href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                            target="_blank" 
                            rel="noreferrer"
                            className="text-[11px] text-slate-400 hover:text-emerald-300 inline-flex items-center space-x-1"
                          >
                            <span className="truncate max-w-[150px]">{lead.website.replace(/^https?:\/\//, '')}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                        {country && (
                          <span className="text-[11px] text-slate-400 font-mono flex items-center space-x-1">
                            <span>{country.flag} {country.name}</span>
                            <span>•</span>
                            <Clock className="w-3 h-3 text-emerald-400 inline" />
                            <span>{timeString}</span>
                            <span className={`w-1.5 h-1.5 rounded-full ${isBusinessHours ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                          </span>
                        )}
                        <span className="text-[11px] text-emerald-400/90 font-medium">
                          Auditor: {approver?.full_name || auditor?.full_name || 'Verified'}
                        </span>
                      </div>
                    </div>

                    {/* Right: Channel Switcher & 1-Click Member Dispatch Chips */}
                    <div className="flex flex-wrap items-center gap-2.5">
                      {/* Channel Switcher */}
                      <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
                        <button
                          type="button"
                          onClick={() => setWorkspaceSalesChannels(prev => ({ ...prev, [lead.id]: 'whatsapp' }))}
                          className={`px-2.5 py-1 rounded-lg flex items-center space-x-1 transition-all ${
                            channel === 'whatsapp'
                              ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>WA 💬</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setWorkspaceSalesChannels(prev => ({ ...prev, [lead.id]: 'email' }))}
                          className={`px-2.5 py-1 rounded-lg flex items-center space-x-1 transition-all ${
                            channel === 'email'
                              ? 'bg-cyan-500 text-slate-950 font-black shadow-sm'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <Mail className="w-3 h-3" />
                          <span>Email ✉️</span>
                        </button>
                      </div>

                      {/* Member 1-Click Buttons */}
                      <span className="text-[11px] font-bold text-slate-400 shrink-0">সেলস মেম্বার পাঠান:</span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {teamMembers.map(m => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => {
                              assignLead(lead.id, m.id, channel);
                              setDispatchNotice(`🚀 "${lead.company_name}" সফলভাবে ${m.full_name}-কে ${channel.toUpperCase()} মেসেজিংয়ের জন্য এসাইন করা হয়েছে!`);
                              soundEngine.playSuccessChime();
                              setTimeout(() => setDispatchNotice(null), 5000);
                            }}
                            className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-emerald-500 text-slate-200 hover:text-slate-950 border border-slate-700/80 hover:border-emerald-400 text-xs font-bold flex items-center space-x-1 transition-all shadow-sm active:scale-95 group"
                            title={`${m.full_name} (${m.role}) কে সরাসরি এসাইন করতে ক্লিক করুন`}
                          >
                            <span className="text-[11px]">{m.role === 'team_leader' ? '👑' : '👤'}</span>
                            <span className="font-extrabold">{m.full_name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================================= */}
      {/* ২. দৈনিক লক্ষ্যমাত্রা ও প্রগ্রেস বার (Daily Target & Progress Bar) */}
      {/* ========================================================================================= */}
      <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="space-y-0.5">
            <h2 className="text-sm font-black text-white flex items-center space-x-2">
              <Target className="w-4 h-4 text-emerald-400" />
              <span>২. দৈনিক লক্ষ্যমাত্রা ও প্রগ্রেস বার (Daily Target & Progress)</span>
            </h2>
            <p className="text-xs text-slate-400">
              আজকের নির্ধারিত লক্ষ্য কতটুকু অর্জিত হয়েছে তা লাইভ ট্র্যাক করুন।
            </p>
          </div>

          {/* Mark Batch Complete & Submit to Leader button */}
          <button
            type="button"
            onClick={() => setIsBatchSubmitModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center space-x-1.5 self-start sm:self-auto"
          >
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            <span>Mark Batch Complete & Submit to Leader</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Progress 1: Outreach Sent */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/90 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300 flex items-center space-x-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>Outreach Sent (মেসেজ পাঠানো):</span>
              </span>
              <span className="font-black text-white font-mono">
                {outreachCompletedCount} / {outreachTarget} ({outreachProgressPercent}%)
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                style={{ width: `${outreachProgressPercent}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400">
              {outreachTarget - outreachCompletedCount > 0 
                ? `আজকের লক্ষ্য পূরণ করতে আরও ${outreachTarget - outreachCompletedCount}টি মেসেজ প্রয়োজন।`
                : '🎯 অভিনন্দন! মেসেজিং টার্গেট সম্পূর্ণ অর্জিত হয়েছে।'}
            </p>
          </div>

          {/* Progress 2: Leads Hunted */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/90 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300 flex items-center space-x-1.5">
                <Flame className="w-3.5 h-3.5 text-cyan-400" />
                <span>Leads Collected (হান্টকৃত লিড):</span>
              </span>
              <span className="font-black text-white font-mono">
                {leadsHuntedCount} / {huntingTarget} ({huntingProgressPercent}%)
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-400 rounded-full transition-all duration-500"
                style={{ width: `${huntingProgressPercent}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400">
              {huntingTarget - leadsHuntedCount > 0
                ? `আজকের লক্ষ্য পূরণ করতে আরও ${huntingTarget - leadsHuntedCount}টি লিড সংগ্রহ করতে হবে।`
                : '🔥 চমৎকার! আজকের হান্টিং টার্গেট সম্পূর্ণ অর্জিত হয়েছে।'}
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================================= */}
      {/* ৩. ব্যক্তিগত পারফরম্যান্স ও ট্রাফিক লাইট স্কোর (My Performance & Health) */}
      {/* ========================================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Real-time Success Rate */}
        <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-lg flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-300 shrink-0 font-black">
            <TrendingUp className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Success Rate</span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-black text-white">{successRate}%</span>
              <span className="text-xs text-emerald-400 font-bold">On-time</span>
            </div>
            <span className="text-[10px] text-slate-400">অন-টাইম এক্সিকিউশন রেট</span>
          </div>
        </div>

        {/* Traffic Light Score Badge */}
        <div className={`p-4 rounded-3xl border shadow-lg flex items-center space-x-3.5 ${trafficLight.badgeClass}`}>
          <div className={`w-3.5 h-3.5 rounded-full animate-ping shrink-0 ${trafficLight.dotClass}`} />
          <div className="min-w-0">
            <span className="text-[11px] font-black uppercase tracking-wider block">Health & Quality Badge</span>
            <p className="text-xs font-bold truncate">{trafficLight.shortText}</p>
            <p className="text-[10px] opacity-80 truncate">{trafficLight.text}</p>
          </div>
        </div>

        {/* Leaderboard Position & Points */}
        <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-lg flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-950/80 border border-amber-500/50 flex items-center justify-center text-amber-300 shrink-0 font-black">
            <Award className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Team Leaderboard</span>
            <div className="flex items-baseline space-x-2">
              <span className="text-xl font-black text-amber-300">
                Rank #{activeMember.rank || 2}
              </span>
              <span className="text-xs font-bold text-slate-300 font-mono">
                {activeMember.points || 420} pts
              </span>
            </div>
            <span className="text-[10px] text-amber-400/90 font-bold">
              ★ {activeMember.consecutive_approvals} Approval Streak
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================================= */}
      {/* ১. দৈনিক অ্যাকশন ও প্রায়োরিটি কিউ (My Action Queue / Today's Focus) */}
      {/* ========================================================================================= */}
      <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div className="space-y-0.5">
            <h2 className="text-base font-black text-white flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span>১. দৈনিক অ্যাকশন ও প্রায়োরিটি কিউ (My Action Queue / Today&apos;s Focus)</span>
            </h2>
            <p className="text-xs text-slate-400">
              পুরো পাইপলাইন না ঘেঁটে সরাসরি আজ যে লিডগুলোতে অ্যাকশন নেওয়া প্রয়োজন সেগুলোতে কাজ শুরু করুন।
            </p>
          </div>

          {/* Launch Focus Mode Pill */}
          <button
            type="button"
            onClick={() => setIsFocusModeOpen(true)}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs shadow-md shadow-cyan-500/20 flex items-center space-x-1.5 active:scale-95 transition-all self-start sm:self-auto"
          >
            <Zap className="w-3.5 h-3.5 fill-slate-950" />
            <span>Launch Focus Mode</span>
          </button>
        </div>

        {/* 3 Intelligent Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={() => setActiveQueueTab('next_best')}
            className={`p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between ${
              activeQueueTab === 'next_best'
                ? 'bg-emerald-950/50 border-emerald-500 text-white shadow-lg ring-1 ring-emerald-500/40'
                : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div>
              <p className="text-xs font-black">🎯 Recommended Next Best Action</p>
              <p className="text-[10px] text-slate-400">ক্লায়েন্টের দেশে এখন অফিস চলছে বা রিপ্লাই এসেছে</p>
            </div>
            <span className={`px-2.5 py-1 rounded-xl text-xs font-black ml-2 ${
              activeQueueTab === 'next_best' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-900 text-emerald-400'
            }`}>
              {recommendedLeads.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveQueueTab('overdue')}
            className={`p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between ${
              activeQueueTab === 'overdue'
                ? 'bg-rose-950/50 border-rose-500 text-white shadow-lg ring-1 ring-rose-500/40'
                : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div>
              <p className="text-xs font-black">⏰ Overdue Follow-ups</p>
              <p className="text-[10px] text-slate-400">যেসব ফলো-আপ সময়মতো পাঠানো হয়নি</p>
            </div>
            <span className={`px-2.5 py-1 rounded-xl text-xs font-black ml-2 ${
              activeQueueTab === 'overdue' ? 'bg-rose-500 text-slate-950' : 'bg-slate-900 text-rose-400'
            }`}>
              {overdueLeads.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveQueueTab('pending_audits')}
            className={`p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between ${
              activeQueueTab === 'pending_audits'
                ? 'bg-amber-950/50 border-amber-500 text-white shadow-lg ring-1 ring-amber-500/40'
                : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div>
              <p className="text-xs font-black">🔍 Pending Audits & Tasks</p>
              <p className="text-[10px] text-slate-400">অডিট বা লিডারের অ্যাসাইন করা কাজ</p>
            </div>
            <span className={`px-2.5 py-1 rounded-xl text-xs font-black ml-2 ${
              activeQueueTab === 'pending_audits' ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-amber-400'
            }`}>
              {memberAuditLeads.length + pendingMemberTasks.length}
            </span>
          </button>
        </div>

        {/* Action Queue Cards Feed */}
        <div className="space-y-3 pt-2">
          {activeQueueTab === 'next_best' && (
            recommendedLeads.length === 0 ? (
              <div className="p-8 text-center bg-slate-950 rounded-2xl border border-slate-800 text-slate-400 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="font-bold text-white">চমৎকার! বর্তমান অগ্রাধিকার তালিকায় কোনো লিড পেন্ডিং নেই।</p>
                <p className="text-[11px]">অন্য কিউ চেক করুন অথবা নতুন লিডে মেসেজ পাঠান।</p>
              </div>
            ) : (
              recommendedLeads.map(lead => {
                const country = detectCountryFromPhone(lead.phone || lead.phone_e164 || '');
                const { timeString, isBusinessHours } = country ? getCountryLocalTime(country.code) : { timeString: '', isBusinessHours: true };
                const waUrl = getWhatsAppUrl(lead.phone || '', `Hi ${lead.contact_name}, regarding your ads for ${lead.company_name}...`);

                return (
                  <div key={lead.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-cyan-500/60 transition-all space-y-3 shadow-md">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-black text-white">{lead.company_name}</span>
                          <span className="text-xs text-slate-400">({lead.contact_name})</span>
                          {lead.last_client_reaction === 'replied' && (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-black">
                              💬 Replied
                            </span>
                          )}
                          {lead.last_client_reaction === 'interested' && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-black">
                              🔥 Interested
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {lead.website || 'No website provided'} • Step {lead.cadence_step} ({CADENCE_STEPS[lead.cadence_step]?.dayLabel})
                        </p>
                      </div>

                      {/* Local Time & Office Hour Badge */}
                      <div className="flex items-center space-x-2 shrink-0">
                        {country && (
                          <span className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border flex items-center space-x-1 ${
                            isBusinessHours 
                              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60' 
                              : 'bg-slate-900 text-slate-400 border-slate-800'
                          }`}>
                            <span>{country.flag}</span>
                            <span>{timeString}</span>
                            <span className="font-extrabold">{isBusinessHours ? '🟢 Office Hours' : '🌙 Off-hours'}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Contact & 1-Tap Action Row */}
                    <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-900 text-xs">
                      {/* Left: 1-Tap Copy & Send */}
                      <div className="flex items-center space-x-2">
                        {lead.phone ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleCopyPhone(lead.id, lead.phone)}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-mono text-xs flex items-center space-x-1 transition-colors"
                              title="নম্বর কপি করুন"
                            >
                              {copiedPhoneId === lead.id ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  <span className="text-emerald-400 font-bold">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{lead.phone}</span>
                                </>
                              )}
                            </button>

                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center space-x-1 shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
                            </a>
                          </>
                        ) : (
                          <a
                            href={`mailto:${lead.email}`}
                            className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs flex items-center space-x-1 shadow-md active:scale-95 transition-all"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            <span>Send Email</span>
                          </a>
                        )}
                      </div>

                      {/* Right: Quick Action Chips (রেডিমেড স্ট্যাটাস চিপস) */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] text-slate-400 font-bold mr-1">রেসপন্স:</span>
                        <button
                          type="button"
                          onClick={() => handleQuickReaction(lead.id, 'replied')}
                          className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                            lead.last_client_reaction === 'replied'
                              ? 'bg-emerald-500 text-slate-950 font-black'
                              : 'bg-slate-900 hover:bg-emerald-950 hover:text-emerald-300 text-slate-300 border border-slate-800'
                          }`}
                        >
                          💬 Replied
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickReaction(lead.id, 'seen')}
                          className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                            lead.last_client_reaction === 'seen'
                              ? 'bg-cyan-500 text-slate-950 font-black'
                              : 'bg-slate-900 hover:bg-cyan-950 hover:text-cyan-300 text-slate-300 border border-slate-800'
                          }`}
                        >
                          👀 Seen
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickReaction(lead.id, 'not_interested')}
                          className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                            lead.last_client_reaction === 'not_interested'
                              ? 'bg-rose-500 text-slate-950 font-black'
                              : 'bg-slate-900 hover:bg-rose-950 hover:text-rose-300 text-slate-300 border border-slate-800'
                          }`}
                        >
                          📞 No Answer
                        </button>

                        <button
                          type="button"
                          onClick={() => handleQuickAdvance(lead.id)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] flex items-center space-x-1 ml-1"
                          title="পরবর্তী ধাপে এগিয়ে নিন"
                        >
                          <span>Next Step →</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )
          )}

          {activeQueueTab === 'overdue' && (
            overdueLeads.length === 0 ? (
              <div className="p-8 text-center bg-slate-950 rounded-2xl border border-slate-800 text-slate-400 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="font-bold text-white">কোনো বকেয়া ফলো-আপ নেই!</p>
                <p className="text-[11px]">আপনার সমস্ত নির্ধারিত মেসেজ সময়মতো সম্পন্ন হয়েছে।</p>
              </div>
            ) : (
              overdueLeads.map(lead => (
                <div key={lead.id} className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-black text-white">{lead.company_name}</span>
                        <span className="px-2 py-0.5 rounded-full bg-rose-500 text-slate-950 font-black text-[10px]">
                          ⏰ বকেয়া ফলো-আপ
                        </span>
                      </div>
                      <p className="text-xs text-rose-300 font-medium">
                        Step {lead.cadence_step} ফলো-আপ গতকাল পাঠানোর কথা ছিল।
                      </p>
                    </div>

                    <a
                      href={getWhatsAppUrl(lead.phone || '', `Hi ${lead.contact_name}, following up on our previous note...`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-black text-xs flex items-center space-x-1 shadow-md shadow-rose-500/20 active:scale-95"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Send Follow-up Now</span>
                    </a>
                  </div>
                </div>
              ))
            )
          )}

          {activeQueueTab === 'pending_audits' && (
            <div className="space-y-3">
              {/* Daily Tasks assigned by leader */}
              {pendingMemberTasks.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-amber-300 flex items-center space-x-1.5">
                    <Target className="w-3.5 h-3.5" />
                    <span>টিম লিডারের নির্দেশিত টাস্ক ({pendingMemberTasks.length}):</span>
                  </h4>
                  {pendingMemberTasks.map(task => (
                    <div key={task.id} className="p-3.5 rounded-2xl bg-slate-950 border border-amber-500/40 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-white">{task.title}</p>
                        <p className="text-[11px] text-slate-400">{task.description}</p>
                      </div>
                      <span className="px-2 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase">
                        {task.priority}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Pending Audits assigned to member */}
              {memberAuditLeads.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-emerald-300 flex items-center space-x-1.5">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>আপনার পেন্ডিং অডিট কিউ ({memberAuditLeads.length}):</span>
                  </h4>
                  {memberAuditLeads.map(lead => (
                    <div key={lead.id} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-white">{lead.company_name}</p>
                        <p className="text-[11px] text-slate-400">Website: {lead.website || 'N/A'}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          passAudit(lead.id);
                          soundEngine.playSuccessChime();
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md"
                      >
                        ✓ Audit Complete
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {pendingMemberTasks.length === 0 && memberAuditLeads.length === 0 && (
                <div className="p-8 text-center bg-slate-950 rounded-2xl border border-slate-800 text-slate-400 text-xs">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <p className="font-bold text-white">বর্তমানে কোনো পেন্ডিং অডিট বা স্পেশাল টাস্ক নেই।</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================================= */}
      {/* ৪. ব্যক্তিগত অডিট ও ভুল সংশোধনের জায়গা (Private Mistake & Quality Tracker) */}
      {/* ========================================================================================= */}
      <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div className="space-y-0.5">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-black text-white">
                ৪. ব্যক্তিগত অডিট ও ভুল সংশোধনের জায়গা (Private Mistake & Quality Tracker)
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold border border-slate-700 flex items-center space-x-1">
                <Lock className="w-3 h-3 text-amber-400" />
                <span>শুধুমাত্র আপনি ও টিম লিডার দৃশ্যমান</span>
              </span>
            </div>
            <p className="text-xs text-slate-400">
              অডিটর কর্তৃক রিজেক্ট করা লিডগুলো সংশোধন করুন এবং ভুল এড়িয়ে চলার গাইডলাইন দেখুন।
            </p>
          </div>
        </div>

        {/* Mistake Counter Warning Banner */}
        <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between ${
          memberMistakesList.length > 0 
            ? 'bg-amber-950/40 border-amber-500/60 text-amber-200' 
            : 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200'
        }`}>
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-black text-sm">
                {memberMistakesList.length > 0 
                  ? `“You skipped status update ${memberMistakesList.length} time(s) this week. Be careful!”`
                  : '“Zero mistakes logged this week! চমৎকার মান বজায় রেখেছেন।”'}
              </p>
              <p className="text-[11px] opacity-80">
                ফলো-আপ পাঠানোর পূর্বে রেসপন্স স্ট্যাটাস (Seen/Replied) রেকর্ড করা বাধ্যতামূলক।
              </p>
            </div>
          </div>
        </div>

        {/* Rejected Leads (Needs Revision) List */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
            <Edit3 className="w-3.5 h-3.5 text-rose-400" />
            <span>সংশোধন প্রয়োজন এমন লিডসমূহ (Needs Revision - {memberRejectedLeads.length}টি):</span>
          </h4>

          {memberRejectedLeads.length === 0 ? (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-400 text-center">
              🎉 কোনো রিজেক্টেড লিড নেই! আপনার সংগৃহীত সমস্ত লিড অনুমোদিত হয়েছে।
            </div>
          ) : (
            memberRejectedLeads.map(lead => (
              <div key={lead.id} className="p-4 rounded-2xl bg-slate-950 border border-rose-500/40 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-sm font-black text-white">{lead.company_name}</span>
                    <span className="text-xs text-slate-400 ml-2">Contact: {lead.contact_name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setRevisionLead(lead);
                      setRevisedPhone(lead.phone || '');
                      setRevisedEmail(lead.email || '');
                      setRevisedNotes('');
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md self-start sm:self-auto flex items-center space-x-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>সংশোধন করে পুনরায় অডিটে পাঠান</span>
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 text-xs text-rose-300">
                  <span className="font-bold text-rose-200 block mb-0.5">অডিটরের ফিডব্যাক / রিজেকশনের কারণ:</span>
                  {lead.rejection_reason}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ========================================================================================= */}
      {/* ৫. জরুরি নোটিফিকেশন ও মেনশন ফিড (Priority Notifications & @Mentions) */}
      {/* ========================================================================================= */}
      <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="space-y-0.5">
            <h3 className="text-sm font-black text-white flex items-center space-x-2">
              <Bell className="w-4 h-4 text-cyan-400" />
              <span>৫. জরুরি নোটিফিকেশন ও মেনশন ফিড (Priority Notifications & @Mentions)</span>
            </h3>
            <p className="text-xs text-slate-400">
              টিম লিডার বা অন্য মেম্বারদের রিমার্কস ও মেনশনসমূহ এখানে সরাসরি দেখতে পাবেন।
            </p>
          </div>

          <button
            type="button"
            onClick={() => soundEngine.playMentionChime()}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center space-x-1"
            title="Preview Alert Sound"
          >
            <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Chime</span>
          </button>
        </div>

        <div className="space-y-2">
          {memberMentionsFeed.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-xs bg-slate-950 rounded-2xl border border-slate-800">
              আপাতত কোনো নতুন নোটিফিকেশন বা মেনশন নেই।
            </div>
          ) : (
            memberMentionsFeed.map(act => (
              <div key={act.id} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-cyan-300">
                      {teamMembers.find(m => m.id === act.author_id)?.full_name || 'System'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {act.created_at ? act.created_at.slice(0, 16).replace('T', ' ') : 'Just now'}
                    </span>
                  </div>
                  <p className="text-slate-200">{act.content}</p>
                </div>

                {act.lead_id && act.lead_id !== 'general' && (
                  <button
                    type="button"
                    onClick={() => {
                      const l = leads.find(item => item.id === act.lead_id);
                      if (l) {
                        setSelectedLead(l);
                        setIsLeadDrawerOpen(true);
                      }
                    }}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-cyan-950 text-cyan-400 hover:text-cyan-300 border border-slate-800 shrink-0"
                    title="View Lead"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* ========================================================================================= */}
      {/* ৬. ব্যক্তিগত ছুটি ও প্রাপ্যতা ব্যবস্থাপনা (My Availability & Leave) */}
      {/* ========================================================================================= */}
      <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        <div className="space-y-0.5 border-b border-slate-800/80 pb-3">
          <h3 className="text-sm font-black text-white flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-purple-400" />
            <span>৬. ব্যক্তিগত ছুটি ও প্রাপ্যতা ব্যবস্থাপনা (My Availability & Leave)</span>
          </h3>
          <p className="text-xs text-slate-400">
            ছুটির তারিখ নির্ধারণ করুন অথবা আকস্মিক প্রয়োজনে ইমার্জেন্সি লিভ সক্রিয় করুন।
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Schedule Planned Leave Form */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
            <span className="font-bold text-slate-200 block">পরিকল্পিত ছুটির তারিখ সেট করুন:</span>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Leave Start Date:</label>
                <input
                  type="date"
                  value={leaveStartDate}
                  onChange={(e) => setLeaveStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Leave End Date:</label>
                <input
                  type="date"
                  value={leaveEndDate}
                  onChange={(e) => setLeaveEndDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isOnLeaveToggle}
                  onChange={(e) => setIsOnLeaveToggle(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-purple-600 focus:ring-0"
                />
                <span className="text-xs text-slate-300 font-medium">বর্তমানে ছুটিতে আছি (Set on Leave)</span>
              </label>

              <button
                type="button"
                onClick={handleSaveLeaveSchedule}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
              >
                Save Schedule
              </button>
            </div>

            {leaveSaveSuccess && (
              <p className="text-[11px] text-emerald-400 font-bold">
                ✓ ছুটির সময়সূচী সফলভাবে সংরক্ষিত হয়েছে!
              </p>
            )}
          </div>

          {/* Emergency Leave Info Card */}
          <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/40 space-y-3 text-xs flex flex-col justify-between">
            <div className="space-y-1.5">
              <span className="font-bold text-rose-300 flex items-center space-x-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>আকস্মিক অসুস্থতা ও জরুরি ছুটি (Emergency Leave):</span>
              </span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                হঠাৎ অসুস্থ বা জরুরি পরিস্থিতিতে এক ক্লিকে Emergency Leave অন করুন। আপনার দায়িত্বে থাকা রানিং লিডগুলো স্বয়ংক্রিয়ভাবে সক্রিয় অন্য মেম্বারদের মাঝে সমানভাবে হস্তান্তর হবে এবং হান্টার হিসেবে আপনার ক্রেডিট সংরক্ষিত থাকবে।
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsEmergencyLeaveModalOpen(true)}
              className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-lg shadow-rose-600/25 active:scale-95 transition-all flex items-center justify-center space-x-2"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>এক ক্লিকে Emergency Leave চালু করুন</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================================= */}
      {/* MODALS */}
      {/* ========================================================================================= */}

      {/* BATCH SUBMIT MODAL */}
      {isBatchSubmitModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in"
          onClick={() => setIsBatchSubmitModalOpen(false)}
        >
          <div 
            className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 space-y-4 text-xs shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
                <h3 className="text-sm font-black text-white">দৈনিক ব্যাচ সাবমিট নিশ্চিত করুন</h3>
              </div>
              <button onClick={() => setIsBatchSubmitModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-300">
              আপনি আজকের মোট <strong>{outreachCompletedCount}টি মেসেজ</strong> এবং <strong>{leadsHuntedCount}টি লিড</strong> সংগ্রহ সম্পন্ন করেছেন। টিম লিডারের কাছে সাবমিট করতে চান?
            </p>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">টিম লিডারের জন্য ঐচ্ছিক মন্তব্য (Optional Note):</label>
              <textarea
                value={batchSubmitNote}
                onChange={(e) => setBatchSubmitNote(e.target.value)}
                rows={3}
                placeholder="আজকের ব্যাচ সম্পর্কে কোনো স্পেশাল রিমার্কস বা আপডেট লিখুন..."
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsBatchSubmitModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBatchSubmit}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
              >
                ✓ হ্যাঁ, লিডারের কাছে সাবমিট করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EMERGENCY LEAVE MODAL */}
      {isEmergencyLeaveModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in"
          onClick={() => setIsEmergencyLeaveModalOpen(false)}
        >
          <div 
            className="w-full max-w-md bg-slate-900 border border-rose-500/60 rounded-3xl p-6 space-y-4 text-xs shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-rose-400">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-sm font-black text-white">Emergency Leave নিশ্চিতকরণ</h3>
              </div>
              <button onClick={() => setIsEmergencyLeaveModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 leading-relaxed">
              ⚠️ <strong>সতর্কতা:</strong> Emergency Leave চালু করলে আপনার দায়িত্বে থাকা تمام ওপেন লিড স্বয়ংক্রিয়ভাবে টিমের অন্য সক্রিয় সদস্যদের মাঝে সমানভাবে বণ্টন হয়ে যাবে। হান্টার হিসেবে আপনার ক্রেডিট অক্ষুণ্ণ থাকবে।
            </div>

            <p className="text-slate-300">
              আপনি কি এখনই Emergency Leave চালু করতে নিশ্চিত?
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsEmergencyLeaveModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmEmergencyLeave}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black shadow-lg shadow-rose-600/30 active:scale-95 transition-all"
              >
                🚨 নিশ্চিত, লিভ চালু করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REVISION EDIT MODAL */}
      {revisionLead && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in"
          onClick={() => setRevisionLead(null)}
        >
          <div 
            className="w-full max-w-md bg-slate-900 border border-amber-500/60 rounded-3xl p-6 space-y-4 text-xs shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-amber-400">
                <Edit3 className="w-5 h-5" />
                <h3 className="text-sm font-black text-white">লিড সংশোধন ও রিসাবমিট</h3>
              </div>
              <button onClick={() => setRevisionLead(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-300">
              কোম্পানি: <strong className="text-white">{revisionLead.company_name}</strong>
            </p>

            <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 text-rose-300">
              <strong>রিজেকশনের কারণ:</strong> {revisionLead.rejection_reason}
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">সংশোধিত WhatsApp / Phone:</label>
                <input
                  type="text"
                  value={revisedPhone}
                  onChange={(e) => setRevisedPhone(e.target.value)}
                  placeholder="+14155550199"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">সংশোধিত Business Email:</label>
                <input
                  type="email"
                  value={revisedEmail}
                  onChange={(e) => setRevisedEmail(e.target.value)}
                  placeholder="contact@company.com"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setRevisionLead(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResubmitRevision}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
              >
                ✓ সংশোধন করে অডিটে পাঠান
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
