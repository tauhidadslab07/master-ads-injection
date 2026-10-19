'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/context/app-context';
import { Lead, TeamMember, OutreachChannel } from '@/types/crm';
import { soundEngine } from '@/lib/audio-chime';
import { 
  Crown, 
  Users, 
  Flame, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  MessageSquare, 
  Mail, 
  ExternalLink, 
  Send, 
  Sparkles, 
  Eye, 
  TrendingUp, 
  Award, 
  Bell, 
  Scale, 
  FileText, 
  Check, 
  X, 
  ArrowRight, 
  RefreshCw,
  UserCheck,
  ShieldAlert,
  ChevronRight,
  Database
} from 'lucide-react';

interface LeaderMonitoringDashboardProps {
  onInspectMember: (memberId: string) => void;
  inspectedMemberId: string;
}

export function LeaderMonitoringDashboard({ 
  onInspectMember, 
  inspectedMemberId 
}: LeaderMonitoringDashboardProps) {
  const { 
    leads, 
    currentUser, 
    teamMembers, 
    activities, 
    mistakes, 
    assignLead, 
    bulkAssignLead, 
    assignAuditor, 
    passAudit, 
    addActivityNote 
  } = useApp();

  // Toast / notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Ping Modal state
  const [pingTargetMember, setPingTargetMember] = useState<TeamMember | null>(null);
  const [pingMessageText, setPingMessageText] = useState('');
  const [isUrgentPing, setIsUrgentPing] = useState(true);

  // Rebalance Modal state
  const [isRebalanceModalOpen, setIsRebalanceModalOpen] = useState(false);
  const [rebalanceFromMemberId, setRebalanceFromMemberId] = useState('');
  const [rebalanceToMemberId, setRebalanceToMemberId] = useState('');
  const [rebalanceCount, setRebalanceCount] = useState(3);

  // EOD Report Modal state
  const [isEODModalOpen, setIsEODModalOpen] = useState(false);

  // Re-assign auditor quick dropdown state
  const [reassignLeadId, setReassignLeadId] = useState<string | null>(null);

  // Auto clear toast
  React.useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Helper to check if an audit is overdue (> 48 hours / 2 days)
  const isAuditOverdue = (l: Lead) => {
    if (l.stage !== 'audit') return false;
    const assignedTime = l.audit_assigned_at || l.updated_at || l.created_at;
    return assignedTime ? (Date.now() - new Date(assignedTime).getTime()) >= 48 * 3600 * 1000 : false;
  };

  // 1. Overdue Audits across the entire team (> 2 days)
  const allOverdueAudits = useMemo(() => {
    return leads.filter(l => l.stage === 'audit' && isAuditOverdue(l));
  }, [leads]);

  // 2. Unassigned Raw Leads in Lead Store
  const unassignedStoreLeads = useMemo(() => {
    return leads.filter(l => l.stage === 'lead_added');
  }, [leads]);

  // 3. Stalled / Overdue Follow-ups in Cadence
  const stalledFollowUps = useMemo(() => {
    return leads.filter(l => (l.stage === 'contacted' || l.stage === 'replied') && l.cadence_step >= 1 && l.last_client_reaction === 'unseen');
  }, [leads]);

  // 4. Team-wide Daily Velocity Totals
  const todayOutreachCount = useMemo(() => {
    return activities.filter(a => a.activity_type === 'cadence_advance' || a.activity_type === 'status_change').length;
  }, [activities]);

  const todayFirstMessages = useMemo(() => {
    return leads.filter(l => (l.stage === 'contacted' || l.stage === 'replied') && l.cadence_step === 0).length;
  }, [leads]);

  const clientRepliedCount = useMemo(() => {
    return leads.filter(l => l.last_client_reaction === 'replied' || l.last_client_reaction === 'interested' || l.stage === 'replied').length;
  }, [leads]);

  // 5. Member statistics mapping
  const memberStats = useMemo(() => {
    return teamMembers.map(member => {
      const assignedLeads = leads.filter(l => l.current_assignee_id === member.id && !l.is_dnc);
      const auditLeads = leads.filter(l => l.auditor_id === member.id && l.stage === 'audit');
      const overdueAudits = auditLeads.filter(isAuditOverdue);
      const huntedLeads = leads.filter(l => l.original_hunter_id === member.id);
      
      const outreachSent = activities.filter(a => a.author_id === member.id && (a.activity_type === 'cadence_advance' || a.activity_type === 'status_change')).length;
      const missedFU = assignedLeads.filter(l => l.cadence_step >= 1 && l.last_client_reaction === 'unseen').length;
      
      const totalDue = Math.max(1, assignedLeads.length);
      const rawRate = Math.round(((totalDue - missedFU) / totalDue) * 100);
      const successRate = overdueAudits.length > 0 ? Math.min(65, rawRate) : Math.max(60, Math.min(100, rawRate));

      let healthStatus: 'green' | 'yellow' | 'red' = 'green';
      if (overdueAudits.length > 0 || successRate < 75) {
        healthStatus = 'red';
      } else if (successRate < 90) {
        healthStatus = 'yellow';
      }

      return {
        member,
        assignedCount: assignedLeads.length,
        auditCount: auditLeads.length,
        overdueAuditCount: overdueAudits.length,
        huntedCount: huntedLeads.length,
        outreachSent,
        missedFU,
        successRate,
        healthStatus
      };
    });
  }, [teamMembers, leads, activities]);

  // Top performer of the day
  const topPerformer = useMemo(() => {
    if (memberStats.length === 0) return null;
    return [...memberStats].sort((a, b) => (b.outreachSent + b.huntedCount) - (a.outreachSent + a.huntedCount))[0];
  }, [memberStats]);

  // Send Ping Action
  const handleSendPing = () => {
    if (!pingTargetMember) return;
    const msg = pingMessageText.trim() || (isUrgentPing 
      ? 'টিম লিডার রিমাইন্ডার: আপনার দায়িত্বে থাকা পেন্ডিং কাজ/অডিট অবিলম্বে সম্পন্ন করুন!'
      : 'টিম লিডার বার্তা: আপনার আজকের অগ্রগতি আপডেট করুন।');

    addActivityNote('general', `🔔 [LEADER PING to @${pingTargetMember.username}]: ${msg}`, [pingTargetMember.id], 'note');
    soundEngine.playMentionChime();
    setToastMessage(`🔔 ${pingTargetMember.full_name}-কে সফলভাবে নোটিফিকেশন পিং পাঠানো হয়েছে!`);
    setPingTargetMember(null);
    setPingMessageText('');
  };

  // Rebalance Action
  const handleConfirmRebalance = () => {
    if (!rebalanceFromMemberId || !rebalanceToMemberId || rebalanceFromMemberId === rebalanceToMemberId) {
      setToastMessage('⚠️ অনুগ্রহ করে দুটি ভিন্ন মেম্বার নির্বাচন করুন!');
      soundEngine.playWarningChime();
      return;
    }

    const fromMember = teamMembers.find(m => m.id === rebalanceFromMemberId);
    const toMember = teamMembers.find(m => m.id === rebalanceToMemberId);
    const candidateLeads = leads.filter(l => l.current_assignee_id === rebalanceFromMemberId && (l.stage === 'contacted' || l.stage === 'replied'));

    if (candidateLeads.length === 0) {
      setToastMessage(`⚠️ ${fromMember?.full_name}-এর কাছে রি-অ্যাসাইন করার মতো কোনো রানিং লিড নেই!`);
      soundEngine.playWarningChime();
      return;
    }

    const leadsToMove = candidateLeads.slice(0, rebalanceCount);
    const leadIds = leadsToMove.map(l => l.id);

    bulkAssignLead(leadIds, rebalanceToMemberId, 'whatsapp');
    soundEngine.playSuccessChime();
    
    setToastMessage(`⚖️ সফলভাবে ${leadIds.length}টি লিড ${fromMember?.full_name} থেকে ${toMember?.full_name}-এর কাছে স্থানান্তর করা হয়েছে!`);
    setIsRebalanceModalOpen(false);
  };

  return (
    <div className="space-y-6">

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 p-4 rounded-2xl bg-cyan-950/95 border-2 border-cyan-400 text-cyan-200 text-xs font-bold shadow-2xl backdrop-blur-md flex items-center space-x-3 animate-in fade-in slide-in-from-top-4">
          <Sparkles className="w-5 h-5 text-cyan-400 shrink-0" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="p-1 rounded-lg hover:bg-cyan-900 text-cyan-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. EXECUTIVE COMMAND HEADER */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-amber-950/40 via-slate-900/90 to-slate-900/90 border-2 border-amber-500/60 shadow-2xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-amber-500/30 pb-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border-2 border-amber-500/50 flex items-center justify-center text-amber-300 shadow-lg shadow-amber-950/50">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center space-x-2.5">
                <span>টিম লিডার কমান্ড ও লাইভ মনিটরিং সেন্টার</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500 text-slate-950 shadow-sm">
                  Executive Suite
                </span>
              </h1>
              <p className="text-xs text-amber-200/80">
                টিমের সদস্যদের কাজের অগ্রগতি, ২ দিন পার হওয়া অডিট, আউটরিচ ভলিউম ও বটলনেক রিয়েল-টাইম পর্যবেক্ষণ করুন।
              </p>
            </div>
          </div>

          {/* Leader Global Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsRebalanceModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-amber-500 border border-amber-500/50 hover:border-amber-400 text-amber-300 hover:text-slate-950 font-bold text-xs flex items-center space-x-1.5 transition-all active:scale-95 shadow-md"
            >
              <Scale className="w-4 h-4" />
              <span>⚖️ কাজের সুষম বণ্টন (Rebalance)</span>
            </button>

            <button
              type="button"
              onClick={() => setIsEODModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center space-x-1.5 transition-all active:scale-95 shadow-lg shadow-amber-500/20"
            >
              <Award className="w-4 h-4" />
              <span>📋 দিনশেষের রিপোর্ট (EOD Summary)</span>
            </button>
          </div>
        </div>

        {/* 2. REAL-TIME SNAPSHOT COUNTERS */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Active Members */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">সক্রিয় মেম্বার</span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-xl font-black text-white">
                {teamMembers.filter(m => !m.on_leave).length}
              </span>
              <span className="text-xs text-slate-500 font-bold">/ {teamMembers.length} জন</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-medium">🟢 ফুল টিম সক্রিয়</span>
          </div>

          {/* Overdue Audits (> 2 Days) */}
          <div className={`p-3.5 rounded-2xl border space-y-1 ${
            allOverdueAudits.length > 0 
              ? 'bg-rose-950/50 border-rose-500 text-rose-300 ring-1 ring-rose-500/40 animate-pulse' 
              : 'bg-slate-950/80 border-slate-800 text-slate-300'
          }`}>
            <span className="text-[10px] font-black uppercase tracking-wider block text-rose-400">২ দিন পার অডিট</span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-xl font-black text-white">{allOverdueAudits.length}</span>
              <span className="text-xs text-rose-300 font-bold">টি লিড</span>
            </div>
            <span className="text-[10px] font-bold">
              {allOverdueAudits.length > 0 ? '🔴 অবিলম্বে অ্যাকশন নিন' : '✓ কোনো বকেয়া নেই'}
            </span>
          </div>

          {/* 1st Message Outreach */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">১ম মেসেজ কিউ</span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-xl font-black text-emerald-400">{todayFirstMessages}</span>
              <span className="text-xs text-slate-500 font-bold">টি</span>
            </div>
            <span className="text-[10px] text-emerald-500 font-medium">⚡ Step 0 Contacts</span>
          </div>

          {/* Cadence Follow-ups */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">মোট ফলো-আপ (FU 1-5)</span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-xl font-black text-cyan-400">
                {leads.filter(l => l.stage === 'contacted' && l.cadence_step >= 1 && l.cadence_step <= 5).length}
              </span>
              <span className="text-xs text-slate-500 font-bold">টি রানিং</span>
            </div>
            <span className="text-[10px] text-cyan-400 font-medium">📨 ক্যাডেন্স প্রসেসিং</span>
          </div>

          {/* Client Responses */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ক্লায়েন্ট রেসপন্স</span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-xl font-black text-amber-300">{clientRepliedCount}</span>
              <span className="text-xs text-slate-500 font-bold">টি রিপ্লাই</span>
            </div>
            <span className="text-[10px] text-amber-400 font-medium">💬 Hot / Warm Leads</span>
          </div>

          {/* Unassigned in Lead Store */}
          <Link
            href="/lead-store"
            className="p-3.5 rounded-2xl bg-slate-950/80 border border-cyan-500/40 hover:border-cyan-400 hover:bg-cyan-950/20 transition-all space-y-1 block group"
          >
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider flex items-center justify-between">
              <span>লিড স্টোরে জমা</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-xl font-black text-cyan-300">{unassignedStoreLeads.length}</span>
              <span className="text-xs text-slate-500 font-bold">টি কাঁচা লিড</span>
            </div>
            <span className="text-[10px] text-cyan-400/90 font-bold">অডিটে এসাইন করুন →</span>
          </Link>
        </div>
      </div>

      {/* 3. BOTTLE-NECK & RED-FLAG ALERT CENTER (When audits > 2 days exist) */}
      {allOverdueAudits.length > 0 && (
        <div className="p-5 sm:p-6 rounded-3xl bg-rose-950/30 border-2 border-rose-500 shadow-2xl space-y-4 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rose-500/30 pb-3.5">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-rose-600/30 border border-rose-500 flex items-center justify-center text-rose-300">
                <AlertTriangle className="w-5 h-5 text-rose-400 animate-bounce" />
              </div>
              <div>
                <h2 className="text-base font-black text-white flex items-center space-x-2">
                  <span>🔴 ২ দিন পার হওয়া অডিট বটলনেক সেন্টার (Overdue Audits Command)</span>
                  <span className="px-2 py-0.5 rounded-full bg-rose-500 text-slate-950 font-black text-xs">
                    {allOverdueAudits.length}টি পেন্ডিং
                  </span>
                </h2>
                <p className="text-xs text-rose-200/90">
                  নিচের লিডগুলো অডিটে পাঠানোর পর ২ দিন পেরিয়ে গেছে। মেম্বারকে পিং পাঠান, রি-এসাইন করুন বা লিডার হিসেবে সরাসরি অডিট পাস করুন।
                </p>
              </div>
            </div>

            <Link
              href="/audited-leads"
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center space-x-1 transition-all self-start sm:self-auto"
            >
              <span>2. Audited Leads ভিউ →</span>
            </Link>
          </div>

          {/* Overdue Audit Cards List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {allOverdueAudits.map(lead => {
              const auditor = teamMembers.find(m => m.id === (lead.auditor_id || lead.current_assignee_id));
              const assignedDaysAgo = lead.audit_assigned_at 
                ? Math.floor((Date.now() - new Date(lead.audit_assigned_at).getTime()) / (24 * 3600 * 1000))
                : 2;

              return (
                <div 
                  key={lead.id}
                  className="p-4 rounded-2xl bg-slate-950/90 border border-rose-500/60 shadow-md space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-extrabold text-sm text-white block">{lead.company_name}</span>
                      <span className="text-[11px] text-slate-400">Phone: {lead.phone}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-rose-500 text-slate-950 font-black text-[10px] shrink-0">
                      🔴 {assignedDaysAgo}+ দিন ওভারডিউ
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-xs text-rose-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block">দায়িত্বপ্রাপ্ত অডিটর:</span>
                      <strong className="text-white">{auditor?.full_name || 'Assigned Member'}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (auditor) {
                          setPingTargetMember(auditor);
                          setPingMessageText(`জরুরি রিমাইন্ডার: "${lead.company_name}" লিডটির অডিট ২ দিন পার হয়ে গেছে। দ্রুত অডিট সম্পন্ন করুন!`);
                          setIsUrgentPing(true);
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] flex items-center space-x-1"
                      title="অডিটরকে রিমাইন্ডার পিং পাঠান"
                    >
                      <Bell className="w-3 h-3" />
                      <span>পিং পাঠান</span>
                    </button>
                  </div>

                  {/* Leader 1-Click Fast Actions */}
                  <div className="flex items-center justify-between pt-1 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        passAudit(lead.id);
                        soundEngine.playSuccessChime();
                        setToastMessage(`✓ "${lead.company_name}" অডিট সরাসরি লিডার কর্তৃক সফলভাবে অনুমোদন করা হয়েছে!`);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md"
                    >
                      ✓ লিডার হিসেবে পাস করুন
                    </button>

                    <select
                      defaultValue=""
                      onChange={(e) => {
                        if (e.target.value) {
                          assignAuditor(lead.id, e.target.value);
                          const newAuditor = teamMembers.find(m => m.id === e.target.value);
                          soundEngine.playSuccessChime();
                          setToastMessage(`🔄 "${lead.company_name}" সফলভাবে ${newAuditor?.full_name}-কে রি-এসাইন করা হয়েছে!`);
                          e.target.value = '';
                        }
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 text-[11px] font-bold focus:outline-none"
                    >
                      <option value="" disabled>🔄 রি-এসাইন...</option>
                      {teamMembers.map(m => (
                        <option key={m.id} value={m.id}>{m.full_name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. LIVE TEAM PULSE & MEMBER WORKLOAD BOARD */}
      <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="space-y-0.5">
            <h2 className="text-base font-black text-white flex items-center space-x-2">
              <Users className="w-5 h-5 text-cyan-400" />
              <span>টিম মেম্বার লাইভ পালস ও ওয়ার্কলোড বোর্ড (Live Team Workload & Health)</span>
            </h2>
            <p className="text-xs text-slate-400">
              প্রত্যেক মেম্বারের প্রাত্যহিক প্রগ্রেস, কাজের গতি ও স্বাস্থ্য স্কোর লাইভ মনিটর করুন। এক ক্লিকে পিং পাঠান বা স্ক্রিন পর্যবেক্ষণ করুন।
            </p>
          </div>

          <div className="text-xs text-slate-400 font-medium">
            মোট সদস্য: <strong className="text-white">{teamMembers.length} জন</strong>
          </div>
        </div>

        {/* Member Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {memberStats.map(({ 
            member, 
            assignedCount, 
            auditCount, 
            overdueAuditCount, 
            huntedCount, 
            outreachSent, 
            successRate, 
            healthStatus 
          }) => {
            const isInspecting = inspectedMemberId === member.id;

            return (
              <div 
                key={member.id}
                className={`p-4 rounded-2xl border transition-all space-y-3 ${
                  healthStatus === 'red'
                    ? 'bg-rose-950/20 border-rose-500/60 ring-1 ring-rose-500/40 shadow-lg'
                    : isInspecting
                      ? 'bg-cyan-950/30 border-cyan-500 ring-2 ring-cyan-500/40 shadow-md'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Header: Avatar, Name, Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-cyan-300 text-sm">
                      {member.full_name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-white flex items-center space-x-1.5">
                        <span>{member.full_name}</span>
                        {member.role === 'team_leader' && <span>👑</span>}
                      </h3>
                      <p className="text-[10px] text-slate-400">@{member.username}</p>
                    </div>
                  </div>

                  {/* Health status badge */}
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                    healthStatus === 'green'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                      : healthStatus === 'yellow'
                        ? 'bg-amber-950 text-amber-300 border-amber-500/50'
                        : 'bg-rose-950 text-rose-300 border-rose-500/80 animate-pulse'
                  }`}>
                    {healthStatus === 'green' ? '🟢 90%+' : healthStatus === 'yellow' ? '🟡 80%' : '🔴 Alert'}
                  </span>
                </div>

                {/* Overdue Warning Tag if applicable */}
                {overdueAuditCount > 0 && (
                  <div className="px-2.5 py-1 rounded-xl bg-rose-950/90 border border-rose-500 text-rose-200 text-[10px] font-black flex items-center space-x-1 animate-pulse">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>🔴 {overdueAuditCount}টি অডিট ২ দিন পার (ইনকমপ্লিট)</span>
                  </div>
                )}

                {/* Workload Stats Bar */}
                <div className="grid grid-cols-3 gap-1.5 p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-center text-xs">
                  <div>
                    <span className="text-[9px] text-slate-500 font-bold block">OUTREACH</span>
                    <span className="font-black text-white">{outreachSent}</span>
                    <span className="text-[9px] text-slate-500 block">/ 25</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 font-bold block">HUNTED</span>
                    <span className="font-black text-white">{huntedCount}</span>
                    <span className="text-[9px] text-slate-500 block">/ 20</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 font-bold block">AUDIT</span>
                    <span className={`font-black ${overdueAuditCount > 0 ? 'text-rose-400' : 'text-amber-400'}`}>
                      {auditCount}
                    </span>
                    <span className="text-[9px] text-slate-500 block">pending</span>
                  </div>
                </div>

                {/* Leader Actions on Member */}
                <div className="flex items-center space-x-2 pt-1 border-t border-slate-900 text-xs">
                  {/* Ping Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setPingTargetMember(member);
                      setPingMessageText(overdueAuditCount > 0 
                        ? `জরুরি সতর্কবার্তা: আপনার ${overdueAuditCount}টি অডিট কাজ ২ দিন পার হয়ে গেছে। আজকেই সম্পন্ন করুন!`
                        : `টিম লিডার রিমাইন্ডার: আপনার আজকের আউটরিচ টার্গেট কতদূর সম্পন্ন হলো?`);
                      setIsUrgentPing(overdueAuditCount > 0);
                    }}
                    className="flex-1 py-1.5 rounded-xl bg-slate-900 hover:bg-cyan-500 hover:text-slate-950 text-cyan-300 border border-slate-800 hover:border-cyan-400 font-bold text-xs flex items-center justify-center space-x-1 transition-all active:scale-95"
                    title="মেম্বারকে ইনস্ট্যান্ট নোটিফিকেশন পিং পাঠান"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>পিং পাঠান</span>
                  </button>

                  {/* Inspect Screen Button */}
                  <button
                    type="button"
                    onClick={() => onInspectMember(member.id)}
                    className={`py-1.5 px-3 rounded-xl font-bold text-xs flex items-center space-x-1 transition-all active:scale-95 ${
                      isInspecting
                        ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                    }`}
                    title="এই মেম্বারের স্ক্রিন লাইভ দেখুন"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{isInspecting ? 'Viewing' : 'Inspect'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================================= */}
      {/* MODAL 1: SEND INSTANT PING / NUDGE TO MEMBER */}
      {/* ========================================================================================= */}
      {pingTargetMember && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in"
          onClick={() => setPingTargetMember(null)}
        >
          <div 
            className="w-full max-w-md bg-slate-900 border border-cyan-500/50 rounded-3xl p-6 space-y-4 text-xs shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-cyan-400">
                <Bell className="w-5 h-5" />
                <h3 className="text-sm font-black text-white">
                  মেম্বারকে লাইভ রিমাইন্ডার পিং পাঠান
                </h3>
              </div>
              <button onClick={() => setPingTargetMember(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-300">
              প্রাপক মেম্বার: <strong className="text-white">{pingTargetMember.full_name}</strong> (@{pingTargetMember.username})
            </p>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">রিমাইন্ডার বা নির্দেশের টেক্সট:</label>
              <textarea
                value={pingMessageText}
                onChange={(e) => setPingMessageText(e.target.value)}
                rows={3}
                placeholder="মেম্বারের ড্যাশবোর্ডে যে বার্তাটি অডিও নোটিফিকেশনসহ পপ-আপ করবে..."
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Quick preset chips */}
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 font-bold">রেডিমেড প্রম্পট:</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setPingMessageText('🔴 সতর্কতা: আপনার অডিট কাজ ২ দিন পার হয়ে গেছে! অবিলম্বে অডিট সম্পন্ন করুন।')}
                  className="px-2 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 text-[10px] border border-slate-800"
                >
                  🔴 অডিট ২ দিন পার
                </button>
                <button
                  type="button"
                  onClick={() => setPingMessageText('⚡ রিমাইন্ডার: আজকের নির্ধারিত আউটরিচ ও মেসেজিং টার্গেট দ্রুত সম্পন্ন করুন।')}
                  className="px-2 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 text-[10px] border border-slate-800"
                >
                  ⚡ টার্গেট পূরণ
                </button>
                <button
                  type="button"
                  onClick={() => setPingMessageText('🔥 হট লিড: ক্লায়েন্ট রিপ্লাই দিয়েছে, দ্রুত ফলো-আপ মেসেজ দিন!')}
                  className="px-2 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 text-[10px] border border-slate-800"
                >
                  🔥 ক্লায়েন্ট রিপ্লাই
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setPingTargetMember(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendPing}
                className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black shadow-lg shadow-cyan-500/25 active:scale-95 transition-all flex items-center space-x-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>পিং পাঠান (Send Alert)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================================= */}
      {/* MODAL 2: WORKLOAD REBALANCER (TRANSFER LEADS) */}
      {/* ========================================================================================= */}
      {isRebalanceModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in"
          onClick={() => setIsRebalanceModalOpen(false)}
        >
          <div 
            className="w-full max-w-lg bg-slate-900 border border-amber-500/50 rounded-3xl p-6 space-y-4 text-xs shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-amber-400">
                <Scale className="w-5 h-5" />
                <h3 className="text-sm font-black text-white">কাজের সুষম বণ্টন (Workload Rebalancer)</h3>
              </div>
              <button onClick={() => setIsRebalanceModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-300 leading-relaxed">
              একজন মেম্বারের অতিরিক্ত কাজের চাপ বা ছুটির কারণে তার রানিং লিডগুলো ফ্রি থাকা অন্য মেম্বারের কাছে তাৎক্ষণিকভাবে হস্তান্তর করুন।
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">কার কাছ থেকে লিড নেবেন (From):</label>
                <select
                  value={rebalanceFromMemberId}
                  onChange={(e) => setRebalanceFromMemberId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500 font-bold"
                >
                  <option value="">মেম্বার নির্বাচন করুন...</option>
                  {teamMembers.map(m => {
                    const count = leads.filter(l => l.current_assignee_id === m.id && l.stage === 'contacted').length;
                    return (
                      <option key={m.id} value={m.id}>
                        {m.full_name} ({count} active leads)
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">কাকে দায়িত্ব দেবেন (To):</label>
                <select
                  value={rebalanceToMemberId}
                  onChange={(e) => setRebalanceToMemberId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500 font-bold"
                >
                  <option value="">মেম্বার নির্বাচন করুন...</option>
                  {teamMembers.map(m => (
                    <option key={m.id} value={m.id}>{m.full_name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">কতটি লিড হস্তান্তর করবেন (Count):</label>
              <input
                type="number"
                min={1}
                max={20}
                value={rebalanceCount}
                onChange={(e) => setRebalanceCount(parseInt(e.target.value) || 1)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsRebalanceModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRebalance}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-500/25 active:scale-95 transition-all flex items-center space-x-1.5"
              >
                <Scale className="w-3.5 h-3.5" />
                <span>নিশ্চিত ও হস্তান্তর করুন</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================================= */}
      {/* MODAL 3: END-OF-DAY (EOD) SUMMARY REPORT */}
      {/* ========================================================================================= */}
      {isEODModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in"
          onClick={() => setIsEODModalOpen(false)}
        >
          <div 
            className="w-full max-w-lg bg-slate-900 border border-amber-500/60 rounded-3xl p-6 space-y-4 text-xs shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-amber-400">
                <Award className="w-5 h-5" />
                <h3 className="text-sm font-black text-white">দিনশেষের টিম রিপোর্ট (Today&apos;s EOD Summary)</h3>
              </div>
              <button onClick={() => setIsEODModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Top Performer Card */}
            {topPerformer && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/50 to-slate-900 border border-amber-500/60 flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 font-black text-xl flex items-center justify-center shadow-lg shadow-amber-500/30">
                  👑
                </div>
                <div>
                  <span className="text-[10px] font-black text-amber-300 uppercase tracking-wider block">Top Performer of the Day</span>
                  <h4 className="text-base font-black text-white">{topPerformer.member.full_name}</h4>
                  <p className="text-xs text-slate-300">
                    আজকের স্কোর: <strong>{topPerformer.outreachSent}টি মেসেজ</strong> ও <strong>{topPerformer.huntedCount}টি লিড</strong> সংগ্রহ!
                  </p>
                </div>
              </div>
            )}

            {/* Stats Breakdown */}
            <div className="space-y-2 pt-2">
              <span className="font-bold text-slate-300 block">টিমের সামগ্রিক অগ্রগতি:</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5">
                  <span className="text-[10px] text-slate-400">আজকের মোট মেসেজ</span>
                  <p className="text-lg font-black text-emerald-400">{todayOutreachCount}টি</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5">
                  <span className="text-[10px] text-slate-400">ক্লায়েন্টদের মোট রেসপন্স</span>
                  <p className="text-lg font-black text-amber-300">{clientRepliedCount}টি</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5">
                  <span className="text-[10px] text-slate-400">২ দিন পার অডিট (বকেয়া)</span>
                  <p className="text-lg font-black text-rose-400">{allOverdueAudits.length}টি</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5">
                  <span className="text-[10px] text-slate-400">সক্রিয় পাইপলাইন ভ্যালু</span>
                  <p className="text-lg font-black text-cyan-400">
                    ৳{leads.filter(l => l.stage === 'contacted' || l.stage === 'replied').reduce((sum, l) => sum + (l.deal_value || 0), 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsEODModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-md"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
