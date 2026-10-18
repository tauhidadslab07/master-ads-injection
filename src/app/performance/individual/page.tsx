'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/context/app-context';
import { 
  User, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Calendar, 
  TrendingUp, 
  Flame, 
  Zap, 
  Target, 
  ShieldAlert, 
  BarChart3, 
  Award, 
  ArrowRight,
  MessageSquare,
  Mail,
  Lock,
  Check,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

export default function IndividualPerformancePage() {
  const { teamMembers, leads, activities, mistakes, currentUser, leaderSession, dailyTasks } = useApp();

  const isLeader = currentUser.role === 'team_leader' || !!leaderSession;

  // Active member being inspected (defaults to logged-in user or first member)
  const [selectedMemberId, setSelectedMemberId] = useState<string>(currentUser.id);

  // If user is not leader, enforce viewing only their own profile
  const effectiveMemberId = isLeader ? selectedMemberId : currentUser.id;

  const selectedMember = useMemo(() => {
    return teamMembers.find(m => m.id === effectiveMemberId) || currentUser || teamMembers[0];
  }, [teamMembers, effectiveMemberId, currentUser]);

  // 1. Leads Hunted (Collected) by this member
  const huntedLeads = useMemo(() => {
    return leads.filter(l => l.original_hunter_id === selectedMember.id);
  }, [leads, selectedMember.id]);

  // 2. Leads Currently Assigned to this member for Sales Outreach
  const assignedLeads = useMemo(() => {
    return leads.filter(l => l.current_assignee_id === selectedMember.id && !l.is_dnc);
  }, [leads, selectedMember.id]);

  // Daily Tasks assigned by Team Leader
  const memberDailyTasks = useMemo(() => {
    return dailyTasks.filter(t => t.assigned_member_ids.includes(selectedMember.id));
  }, [dailyTasks, selectedMember.id]);

  const memberDailyCompletedCount = useMemo(() => {
    return memberDailyTasks.filter(t => t.assignee_statuses[selectedMember.id]?.status === 'completed').length;
  }, [memberDailyTasks, selectedMember.id]);

  // 3. Member Activities & Stage Messaging
  const memberActivities = useMemo(() => {
    return activities.filter(a => a.author_id === selectedMember.id);
  }, [activities, selectedMember.id]);

  // Messages sent at each stage
  const initialSentCount = assignedLeads.filter(l => l.cadence_step >= 1).length;
  const fu1SentCount = assignedLeads.filter(l => l.cadence_step >= 2).length;
  const fu2SentCount = assignedLeads.filter(l => l.cadence_step >= 3).length;
  const fu3SentCount = assignedLeads.filter(l => l.cadence_step >= 4).length;
  const fu4SentCount = assignedLeads.filter(l => l.cadence_step >= 5).length;
  const fu5SentCount = assignedLeads.filter(l => l.cadence_step >= 6 || l.stage === 'all_done').length;

  const totalStageMessagesSent = initialSentCount + fu1SentCount + fu2SentCount + fu3SentCount + fu4SentCount + fu5SentCount;

  // 4. Missed Tasks / Bottlenecks per stage
  const missedInitialCount = assignedLeads.filter(l => l.cadence_step === 0 && l.stage === 'contacted').length;
  const missedFu1Count = assignedLeads.filter(l => l.cadence_step === 1 && l.last_client_reaction === 'unseen').length;
  const missedFu2Count = assignedLeads.filter(l => l.cadence_step === 2 && l.last_client_reaction === 'unseen').length;
  const missedFu3Count = assignedLeads.filter(l => l.cadence_step === 3 && l.last_client_reaction === 'unseen').length;
  const missedFu4Count = assignedLeads.filter(l => l.cadence_step === 4 && l.last_client_reaction === 'unseen').length;
  const missedFu5Count = assignedLeads.filter(l => l.cadence_step === 5 && l.last_client_reaction === 'unseen').length;

  const totalMissedFollowUps = missedInitialCount + missedFu1Count + missedFu2Count + missedFu3Count + missedFu4Count + missedFu5Count;

  // 5. Deadline Misses (Tasks due today that were delayed or overdue)
  const deadlineMissedLeads = useMemo(() => {
    return assignedLeads.filter(l => {
      // If cadence step >= 1 but status is unseen or delayed over 24 hours
      return (l.cadence_step >= 1 && l.last_client_reaction === 'unseen') || (l.cadence_step === 0 && l.stage === 'contacted');
    });
  }, [assignedLeads]);

  const deadlineMissCount = deadlineMissedLeads.length;

  // 6. Task Completion Rate %
  const tasksDue = Math.max(assignedLeads.length, 5);
  const tasksDone = Math.max(0, tasksDue - totalMissedFollowUps);
  const completionRate = Math.min(100, Math.round((tasksDone / tasksDue) * 100));

  // 7. Mistakes logged for this member
  const memberMistakes = useMemo(() => {
    return mistakes.filter(m => m.member_id === selectedMember.id);
  }, [mistakes, selectedMember.id]);

  // Stage work list
  const stageBreakdown = [
    {
      title: '📥 Lead Collection (Hunted)',
      description: 'নতুন লিড কালেক্ট ও স্টোরে আপলোড করা',
      completed: huntedLeads.length,
      target: 10,
      missed: 0,
      status: huntedLeads.length >= 5 ? 'On Track' : 'Needs Focus',
      color: 'border-blue-500/40 bg-blue-950/30 text-blue-300'
    },
    {
      title: '✉️ Step 0: Initial Outreach',
      description: 'অ্যাসাইন হওয়া লিডে ১ম মেসেজ পাঠানো',
      completed: initialSentCount,
      target: assignedLeads.length,
      missed: missedInitialCount,
      status: missedInitialCount === 0 ? 'Completed' : `${missedInitialCount} Pending`,
      color: 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300'
    },
    {
      title: '🔄 Step 1: 1st Follow-up',
      description: '১ম ফলো-আপ মেসেজ ও স্ট্যাটাস যাচাই',
      completed: fu1SentCount,
      target: initialSentCount,
      missed: missedFu1Count,
      status: missedFu1Count === 0 ? 'Clean' : `${missedFu1Count} Overdue`,
      color: 'border-cyan-500/40 bg-cyan-950/30 text-cyan-300'
    },
    {
      title: '🔄 Step 2: 2nd Follow-up',
      description: '২য় ফলো-আপ মেসেজ পাঠানো',
      completed: fu2SentCount,
      target: fu1SentCount,
      missed: missedFu2Count,
      status: missedFu2Count === 0 ? 'Clean' : `${missedFu2Count} Overdue`,
      color: 'border-purple-500/40 bg-purple-950/30 text-purple-300'
    },
    {
      title: '🔄 Step 3: 3rd Follow-up',
      description: '৩য় ফলো-আপ মেসেজ পাঠানো',
      completed: fu3SentCount,
      target: fu2SentCount,
      missed: missedFu3Count,
      status: missedFu3Count === 0 ? 'Clean' : `${missedFu3Count} Overdue`,
      color: 'border-amber-500/40 bg-amber-950/30 text-amber-300'
    },
    {
      title: '🔄 Step 4: 4th Follow-up',
      description: '৪র্থ ফলো-আপ মেসেজ পাঠানো',
      completed: fu4SentCount,
      target: fu3SentCount,
      missed: missedFu4Count,
      status: missedFu4Count === 0 ? 'Clean' : `${missedFu4Count} Overdue`,
      color: 'border-orange-500/40 bg-orange-950/30 text-orange-300'
    },
    {
      title: '🔄 Step 5: 5th Follow-up',
      description: '৫ম ফলো-আপ ও অল ডান সম্পন্ন',
      completed: fu5SentCount,
      target: fu4SentCount,
      missed: missedFu5Count,
      status: missedFu5Count === 0 ? 'Clean' : `${missedFu5Count} Overdue`,
      color: 'border-rose-500/40 bg-rose-950/30 text-rose-300'
    },
    {
      title: '💬 Client Status Verification',
      description: 'Seen/Unseen/Replied স্ট্যাটাস আপডেট',
      completed: assignedLeads.filter(l => l.last_client_reaction !== 'unseen').length,
      target: assignedLeads.length,
      missed: totalMissedFollowUps,
      status: totalMissedFollowUps === 0 ? 'Verified' : `${totalMissedFollowUps} Unverified`,
      color: 'border-teal-500/40 bg-teal-950/30 text-teal-300'
    }
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto text-xs">
      
      {/* 1. Header Banner */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-purple-500/15 border border-purple-500/40 text-purple-400">
              <User className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-black text-white tracking-wide">
                  Individual Performance (ইন্ডিভিজুয়াল পারফরমেন্স)
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-950 border border-purple-500/60 text-purple-300">
                  {selectedMember.full_name}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                প্রত্যেক মেম্বারের কাজ, কালেক্ট করা লিড, বিভিন্ন স্টেজের মেসেজ এবং ডেডলাইন মিস সংক্রান্ত লাইভ মনিটরিং।
              </p>
            </div>
          </div>
        </div>

        {/* Link to Team Performance */}
        <Link
          href="/performance/team"
          className="px-3.5 py-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900/80 border border-emerald-600/50 text-emerald-300 font-bold text-xs flex items-center space-x-1.5 transition-all self-start md:self-auto"
        >
          <span>Team Performance (টিম পারফরমেন্স)</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* 2. Interactive Member Selector Pills (Team Leader Exclusive or View Self) */}
      <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 px-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
            <span>👤 Select Team Member to Inspect:</span>
            {isLeader && (
              <span className="text-[10px] text-cyan-400 font-bold bg-cyan-950/80 border border-cyan-800/80 px-2 py-0.5 rounded-full">
                👑 Team Leader Access
              </span>
            )}
          </p>
          {!isLeader && (
            <span className="text-[10px] text-amber-400 font-bold bg-amber-950/70 border border-amber-800/80 px-2 py-0.5 rounded-full flex items-center space-x-1 self-start sm:self-auto">
              <Lock className="w-3 h-3 text-amber-400" />
              <span>শুধুমাত্র টিম লিডার সকল মেম্বারের প্রোফাইল সুইচ করতে পারেন</span>
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {teamMembers.map(m => {
            const isSelected = m.id === selectedMember.id;
            const isTL = m.role === 'team_leader';
            const canClick = isLeader || m.id === currentUser.id;
            return (
              <button
                key={m.id}
                type="button"
                disabled={!canClick}
                onClick={() => canClick && setSelectedMemberId(m.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all ${
                  isSelected
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 ring-2 ring-purple-400'
                    : canClick
                    ? 'bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-600 cursor-pointer'
                    : 'bg-slate-950/30 border border-slate-900 text-slate-600 cursor-not-allowed opacity-50'
                }`}
              >
                <span>{m.full_name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-black ${
                  isSelected ? 'bg-purple-950 text-purple-200' : 'bg-slate-900 text-slate-500'
                }`}>
                  {isTL ? 'TL' : 'Outreach'}
                </span>
                {!canClick && <Lock className="w-3 h-3 text-slate-600 ml-1" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Member Scorecard Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* Task Completion Rate */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <p className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
            <span>Completion Rate</span>
            <Target className="w-3.5 h-3.5 text-cyan-400" />
          </p>
          <p className="text-2xl font-black text-white">{completionRate}%</p>
          <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden mt-1">
            <div 
              className={`h-full rounded-full ${
                completionRate >= 80 ? 'bg-emerald-400' : completionRate >= 50 ? 'bg-amber-400' : 'bg-rose-400'
              }`}
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>

        {/* Leads Collected (Hunted) */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <p className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
            <span>Leads Hunted</span>
            <Flame className="w-3.5 h-3.5 text-amber-400" />
          </p>
          <p className="text-2xl font-black text-amber-300">{huntedLeads.length}</p>
          <p className="text-[10px] text-slate-500 font-medium">📥 Sourced & uploaded</p>
        </div>

        {/* Total Stage Messages Executed */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <p className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
            <span>Stage Messages</span>
            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
          </p>
          <p className="text-2xl font-black text-emerald-300">{totalStageMessagesSent}</p>
          <p className="text-[10px] text-emerald-500/80 font-medium">Initial + Follow-ups</p>
        </div>

        {/* Missed Stage Tasks */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <p className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
            <span>Missed Works</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          </p>
          <p className="text-2xl font-black text-amber-400">{totalMissedFollowUps}</p>
          <p className="text-[10px] text-amber-500/80 font-medium">⚠️ Stage tasks missed</p>
        </div>

        {/* Deadline Misses */}
        <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-600/40 space-y-1">
          <p className="text-[11px] font-semibold text-rose-300 flex items-center justify-between">
            <span>Deadline Misses</span>
            <Clock className="w-3.5 h-3.5 text-rose-400" />
          </p>
          <p className="text-2xl font-black text-rose-400">{deadlineMissCount}</p>
          <p className="text-[10px] text-rose-300/80 font-bold">⏰ Delayed / Not done</p>
        </div>
      </div>

      {/* 4. Stage-by-Stage Work Breakdown (প্রত্যেকটি স্টেজের কাজ এক একটি ওয়ার্ক হিসাবে) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center space-x-2">
            <Zap className="w-4 h-4 text-purple-400" />
            <span>Stage-by-Stage Work Breakdown (প্রতিটি স্টেজের কাজের হিসেব)</span>
          </h2>
          <span className="text-[11px] text-slate-400 font-medium">
            Single Tasks, Sourcing & Cadence Progression
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {stageBreakdown.map((stage, idx) => (
            <div 
              key={idx}
              className={`p-3.5 rounded-2xl border space-y-2 transition-all ${stage.color}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-white text-xs">{stage.title}</h3>
                  <p className="text-[10px] text-slate-400">{stage.description}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                  stage.missed > 0 ? 'bg-amber-950 border-amber-600 text-amber-300' : 'bg-emerald-950 border-emerald-600 text-emerald-300'
                }`}>
                  {stage.status}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                <span className="text-[11px] text-slate-300">
                  Executed: <strong>{stage.completed}</strong>
                </span>
                {stage.missed > 0 ? (
                  <span className="text-[11px] font-bold text-amber-400 flex items-center space-x-1">
                    <span>Missed: {stage.missed}</span>
                  </span>
                ) : (
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center space-x-1">
                    <Check className="w-3 h-3 stroke-[3]" />
                    <span>On Schedule</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Deadline Misses & Work Delay Tracker (ডেডলাইন মিস ড্যাশবোর্ড) */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Deadline Miss & Overdue Work Tracker (ডেডলাইন মিস ট্র্যাকার)
              </h3>
              <p className="text-[11px] text-slate-400">
                যেসব কাজের ডেডলাইন মিস হয়েছে বা আজ দেওয়ার কথা থাকলেও এখনও সম্পন্ন হয়নি।
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-950 border border-rose-500 text-rose-300">
            {deadlineMissCount} Deadline Flag(s)
          </span>
        </div>

        {deadlineMissedLeads.length === 0 ? (
          <div className="p-6 rounded-xl bg-slate-950/60 border border-dashed border-emerald-800/40 text-center space-y-1">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
            <p className="font-bold text-slate-200">No Deadline Misses!</p>
            <p className="text-slate-500 text-[11px]">
              {selectedMember.full_name} is completing all daily outreach and follow-up deadlines on time.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-800 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[650px]">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <th className="py-2.5 px-3">LEAD COMPANY</th>
                  <th className="py-2.5 px-3">REQUIRED STAGE WORK</th>
                  <th className="py-2.5 px-3">DEADLINE STATUS</th>
                  <th className="py-2.5 px-3">LAST REACTION</th>
                  <th className="py-2.5 px-3 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {deadlineMissedLeads.map(lead => (
                  <tr key={lead.id} className="hover:bg-slate-950/40 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-white">
                      {lead.company_name}
                    </td>
                    <td className="py-2.5 px-3 text-cyan-300 font-semibold">
                      {lead.cadence_step === 0 ? 'Send Initial Message' : `Send Follow-up ${lead.cadence_step}`}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-rose-950 border border-rose-600 text-rose-300 text-[10px] font-bold animate-pulse">
                        <Clock className="w-3 h-3" />
                        <span>Deadline Missed (Overdue)</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-amber-300 font-bold uppercase font-mono">
                      [{lead.last_client_reaction}]
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Link
                        href="/"
                        className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[10px] transition-colors"
                      >
                        Execute in Today's Work →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5.5 Leader Assigned Daily Tasks Section */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Target className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">
              টিম লিডার নির্ধারিত ডেইলি টাস্ক ({selectedMember.full_name})
            </h3>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
            {memberDailyCompletedCount} / {memberDailyTasks.length} সম্পন্ন
          </span>
        </div>

        {memberDailyTasks.length === 0 ? (
          <p className="text-slate-500 text-[11px] italic">
            এই মেম্বারের জন্য বর্তমানে কোনো বিশেষ ডেইলি টাস্ক নির্ধারিত নেই।
          </p>
        ) : (
          <div className="space-y-2">
            {memberDailyTasks.map(t => {
              const mySt = t.assignee_statuses[selectedMember.id] || { status: 'pending' };
              return (
                <div key={t.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white">{t.title}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 uppercase font-bold">{t.priority}</span>
                    </div>
                    {mySt.completion_note && (
                      <p className="text-[11px] text-slate-400 mt-0.5 italic">মেম্বারের নোট: &quot;{mySt.completion_note}&quot;</p>
                    )}
                  </div>
                  <div>
                    {mySt.status === 'completed' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-950 text-emerald-300 border border-emerald-800">
                        ✅ সম্পন্ন
                      </span>
                    ) : mySt.status === 'in_progress' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                        🔄 চলছে
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 text-slate-400 border border-slate-800">
                        ⏳ অপেক্ষমান
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 6. Logged Mistakes & Accountability Alerts */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">
              Mistake Guard History for {selectedMember.full_name} ({memberMistakes.length})
            </h3>
          </div>
        </div>

        {memberMistakes.length === 0 ? (
          <p className="text-slate-500 text-[11px] italic">
            Zero procedural mistakes logged. Follow-up safeguards have been maintained flawlessly.
          </p>
        ) : (
          <div className="space-y-2">
            {memberMistakes.map(m => (
              <div 
                key={m.id}
                className="p-3 rounded-xl bg-slate-950 border border-amber-500/30 text-[11px] space-y-1"
              >
                <div className="flex items-center justify-between text-amber-300 font-bold">
                  <span>⚠️ {m.mistake_type.replace(/_/g, ' ')}</span>
                  <span className="text-slate-500 font-mono text-[10px]">{m.created_at.slice(0, 16).replace('T', ' ')}</span>
                </div>
                <p className="text-slate-300">{m.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
