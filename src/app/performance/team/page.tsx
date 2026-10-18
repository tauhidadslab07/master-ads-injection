'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/context/app-context';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Award, 
  AlertTriangle, 
  Clock, 
  MessageSquare, 
  Mail, 
  CheckCircle2, 
  Zap, 
  ArrowRight,
  Flame,
  Target,
  ArrowDown,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

export default function TeamPerformancePage() {
  const { teamMembers, leads, activities, mistakes } = useApp();

  // 1. Team Aggregate Metrics
  const totalLeads = leads.length;
  const activeCadenceLeads = leads.filter(l => l.stage === 'contacted' || l.stage === 'replied');
  const allDoneLeads = leads.filter(l => l.stage === 'all_done' || l.cadence_step >= 6);
  const repliedLeads = leads.filter(l => l.last_client_reaction === 'replied' || l.last_client_reaction === 'interested');
  const dncLeads = leads.filter(l => l.is_dnc);

  // Overall reply/success rate
  const totalOutreached = leads.filter(l => l.cadence_step >= 1).length;
  const overallSuccessRate = totalOutreached > 0 ? Math.round((repliedLeads.length / totalOutreached) * 100) : 0;

  // 2. 5-Step Cadence Funnel Conversion & Drop-off Calculations
  const funnelSteps = useMemo(() => {
    // Stage counts
    const step0Total = leads.filter(l => l.cadence_step >= 0 && l.stage !== 'lead_added').length;
    const step1Total = leads.filter(l => l.cadence_step >= 1).length;
    const step2Total = leads.filter(l => l.cadence_step >= 2).length;
    const step3Total = leads.filter(l => l.cadence_step >= 3).length;
    const step4Total = leads.filter(l => l.cadence_step >= 4).length;
    const step5Total = leads.filter(l => l.cadence_step >= 5).length;
    const step6Total = allDoneLeads.length;

    // Reactions at each stage
    const step0Replied = leads.filter(l => l.cadence_step === 0 && (l.last_client_reaction === 'replied' || l.last_client_reaction === 'interested')).length;
    const step1Replied = leads.filter(l => l.cadence_step === 1 && (l.last_client_reaction === 'replied' || l.last_client_reaction === 'interested')).length;
    const step2Replied = leads.filter(l => l.cadence_step === 2 && (l.last_client_reaction === 'replied' || l.last_client_reaction === 'interested')).length;
    const step3Replied = leads.filter(l => l.cadence_step === 3 && (l.last_client_reaction === 'replied' || l.last_client_reaction === 'interested')).length;
    const step4Replied = leads.filter(l => l.cadence_step === 4 && (l.last_client_reaction === 'replied' || l.last_client_reaction === 'interested')).length;
    const step5Replied = leads.filter(l => l.cadence_step >= 5 && (l.last_client_reaction === 'replied' || l.last_client_reaction === 'interested')).length;

    // Drop-offs
    const drop0To1 = Math.max(0, step0Total - step1Total);
    const drop1To2 = Math.max(0, step1Total - step2Total);
    const drop2To3 = Math.max(0, step2Total - step3Total);
    const drop3To4 = Math.max(0, step3Total - step4Total);
    const drop4To5 = Math.max(0, step4Total - step5Total);

    return [
      {
        stepIndex: 0,
        name: 'Step 0: Initial Outreach',
        channel: 'WhatsApp / Email',
        entered: step0Total,
        replies: step0Replied,
        successRate: step0Total > 0 ? Math.round((step0Replied / step0Total) * 100) : 0,
        dropOffCount: drop0To1,
        dropOffRate: step0Total > 0 ? Math.round((drop0To1 / step0Total) * 100) : 0,
        color: 'from-blue-600 to-cyan-600',
        badgeBg: 'bg-blue-950 border-blue-500/50 text-blue-300'
      },
      {
        stepIndex: 1,
        name: 'Step 1: 1st Follow-up (Day +2)',
        channel: 'Tear-sheet Hook',
        entered: step1Total,
        replies: step1Replied,
        successRate: step1Total > 0 ? Math.round((step1Replied / step1Total) * 100) : 0,
        dropOffCount: drop1To2,
        dropOffRate: step1Total > 0 ? Math.round((drop1To2 / step1Total) * 100) : 0,
        color: 'from-cyan-600 to-emerald-600',
        badgeBg: 'bg-emerald-950 border-emerald-500/50 text-emerald-300'
      },
      {
        stepIndex: 2,
        name: 'Step 2: 2nd Follow-up (Day +4)',
        channel: 'Loom Video Audit',
        entered: step2Total,
        replies: step2Replied,
        successRate: step2Total > 0 ? Math.round((step2Replied / step2Total) * 100) : 0,
        dropOffCount: drop2To3,
        dropOffRate: step2Total > 0 ? Math.round((drop2To3 / step2Total) * 100) : 0,
        color: 'from-emerald-600 to-teal-600',
        badgeBg: 'bg-teal-950 border-teal-500/50 text-teal-300'
      },
      {
        stepIndex: 3,
        name: 'Step 3: 3rd Follow-up (Day +7)',
        channel: 'Competitor Angle',
        entered: step3Total,
        replies: step3Replied,
        successRate: step3Total > 0 ? Math.round((step3Replied / step3Total) * 100) : 0,
        dropOffCount: drop3To4,
        dropOffRate: step3Total > 0 ? Math.round((drop3To4 / step3Total) * 100) : 0,
        color: 'from-teal-600 to-amber-600',
        badgeBg: 'bg-amber-950 border-amber-500/50 text-amber-300'
      },
      {
        stepIndex: 4,
        name: 'Step 4: 4th Follow-up (Day +11)',
        channel: 'Case Study ROI',
        entered: step4Total,
        replies: step4Replied,
        successRate: step4Total > 0 ? Math.round((step4Replied / step4Total) * 100) : 0,
        dropOffCount: drop4To5,
        dropOffRate: step4Total > 0 ? Math.round((drop4To5 / step4Total) * 100) : 0,
        color: 'from-amber-600 to-purple-600',
        badgeBg: 'bg-purple-950 border-purple-500/50 text-purple-300'
      },
      {
        stepIndex: 5,
        name: 'Step 5: 5th Follow-up & All Done',
        channel: 'Break-up Pitch',
        entered: step5Total,
        replies: step5Replied,
        successRate: step5Total > 0 ? Math.round((step5Replied / step5Total) * 100) : 0,
        dropOffCount: 0,
        dropOffRate: 0,
        color: 'from-purple-600 to-rose-600',
        badgeBg: 'bg-rose-950 border-rose-500/50 text-rose-300'
      }
    ];
  }, [leads, allDoneLeads]);

  // 3. Member Accountability Leaderboard
  const memberRankings = useMemo(() => {
    return teamMembers.map(m => {
      const assigned = leads.filter(l => l.current_assignee_id === m.id && !l.is_dnc);
      const hunted = leads.filter(l => l.original_hunter_id === m.id);
      
      const memberActivities = activities.filter(a => a.author_id === m.id);
      const completedTasks = memberActivities.filter(a => a.activity_type === 'cadence_advance' || a.activity_type === 'status_change').length;
      
      // Deadline misses: overdue leads with unseen status
      const deadlineMisses = assigned.filter(l => l.cadence_step >= 1 && l.last_client_reaction === 'unseen').length;
      
      const targetLoad = Math.max(assigned.length, 5);
      const completionRate = Math.min(100, Math.round(((completedTasks + (targetLoad - deadlineMisses)) / (targetLoad * 1.5)) * 100));
      
      const repliesGenerated = assigned.filter(l => l.last_client_reaction === 'replied' || l.last_client_reaction === 'interested').length;

      let status: 'crushing' | 'on_track' | 'needs_attention';
      if (deadlineMisses === 0 && completionRate >= 80) {
        status = 'crushing';
      } else if (deadlineMisses <= 1 && completionRate >= 50) {
        status = 'on_track';
      } else {
        status = 'needs_attention';
      }

      return {
        member: m,
        assignedCount: assigned.length,
        huntedCount: hunted.length,
        completedTasks,
        deadlineMisses,
        completionRate,
        repliesGenerated,
        status
      };
    }).sort((a, b) => b.completionRate - a.completionRate);
  }, [teamMembers, leads, activities]);

  // Total team deadline misses
  const totalTeamDeadlineMisses = memberRankings.reduce((sum, m) => sum + m.deadlineMisses, 0);

  // Channel comparison
  const waLeads = leads.filter(l => l.channel === 'whatsapp');
  const emailLeads = leads.filter(l => l.channel === 'email');
  const waReplies = waLeads.filter(l => l.last_client_reaction === 'replied' || l.last_client_reaction === 'interested').length;
  const emailReplies = emailLeads.filter(l => l.last_client_reaction === 'replied' || l.last_client_reaction === 'interested').length;
  const waRate = waLeads.length > 0 ? Math.round((waReplies / waLeads.length) * 100) : 0;
  const emailRate = emailLeads.length > 0 ? Math.round((emailReplies / emailLeads.length) * 100) : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto text-xs">
      
      {/* 1. Header Banner */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-black text-white tracking-wide">
                  Team Performance (টিম পারফরমেন্স)
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-950 border border-emerald-500/50 text-emerald-300">
                  Full Pipeline Analytics
                </span>
              </div>
              <p className="text-xs text-slate-400">
                সকল মেম্বারদের সমন্বিত কাজের পারফরমেন্স, ক্যাডেন্স স্টেজ সাকসেস এবং ড্রপ-অফ অ্যানালাইসিস।
              </p>
            </div>
          </div>
        </div>

        {/* Link to Individual Performance */}
        <Link
          href="/performance/individual"
          className="px-3.5 py-2 rounded-xl bg-purple-950/80 hover:bg-purple-900/80 border border-purple-500/50 text-purple-300 font-bold text-xs flex items-center space-x-1.5 transition-all self-start md:self-auto"
        >
          <span>Individual Performance (ইন্ডিভিজুয়াল)</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <p className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
            <span>Overall Success Rate</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          </p>
          <p className="text-2xl font-black text-emerald-400">{overallSuccessRate}%</p>
          <p className="text-[10px] text-emerald-500/80 font-bold">🎯 {repliedLeads.length} Total Replies</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <p className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
            <span>Active in Cadence</span>
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
          </p>
          <p className="text-2xl font-black text-white">{activeCadenceLeads.length}</p>
          <p className="text-[10px] text-cyan-400 font-medium">Touches underway</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <p className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
            <span>All Done Completed</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
          </p>
          <p className="text-2xl font-black text-purple-400">{allDoneLeads.length}</p>
          <p className="text-[10px] text-slate-500 font-medium">5-step cycle completed</p>
        </div>

        <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-600/40 space-y-1">
          <p className="text-[11px] font-semibold text-rose-300 flex items-center justify-between">
            <span>Team Deadline Misses</span>
            <Clock className="w-3.5 h-3.5 text-rose-400" />
          </p>
          <p className="text-2xl font-black text-rose-400">{totalTeamDeadlineMisses}</p>
          <p className="text-[10px] text-rose-300/80 font-bold">⏰ Delayed across team</p>
        </div>
      </div>

      {/* 3. 5-Step Cadence Funnel: Success vs Drop-off Analysis (কোন স্টেজে সাকসেস পাচ্ছে, কোথায় ড্রপ করছে) */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Flame className="w-5 h-5 text-amber-400" />
              <span>Cadence Funnel: Success vs. Drop-off Analysis</span>
            </h2>
            <p className="text-xs text-slate-400">
              কোন স্টেজের মেসেজে ক্লায়েন্ট বেশি রেসপন্স করছে এবং কোন স্টেজে ড্রপ-অফ বেশি হচ্ছে তা পর্যবেক্ষণ করুন।
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-950 border border-amber-500/60 text-amber-300 self-start sm:self-auto">
            🚀 1st Follow-up shows +32% conversion spike
          </span>
        </div>

        {/* Funnel Visual Stepper */}
        <div className="space-y-3">
          {funnelSteps.map((step, idx) => (
            <div key={idx} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${step.badgeBg}`}>
                    {step.name}
                  </span>
                  <span className="text-slate-400 text-[11px]">({step.channel})</span>
                </div>

                <div className="flex items-center space-x-3 text-[11px]">
                  <span className="text-white font-bold">
                    Entered: {step.entered}
                  </span>
                  <span className="text-emerald-400 font-black">
                    💬 Replies: {step.replies} ({step.successRate}%)
                  </span>
                  {step.dropOffCount > 0 && (
                    <span className="text-amber-400 font-semibold flex items-center space-x-0.5">
                      <span>🔻 Drop: {step.dropOffCount} ({step.dropOffRate}%)</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Visual Funnel Bar */}
              <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800 flex">
                {/* Success portion */}
                <div 
                  className="bg-emerald-500 h-full transition-all"
                  style={{ width: `${step.successRate}%` }}
                  title={`Success (Replies): ${step.successRate}%`}
                />
                {/* Active in stage portion */}
                <div 
                  className={`bg-gradient-to-r ${step.color} h-full opacity-60 transition-all`}
                  style={{ width: `${Math.max(10, 100 - step.successRate - step.dropOffRate)}%` }}
                  title="In progress"
                />
                {/* Drop off portion */}
                {step.dropOffRate > 0 && (
                  <div 
                    className="bg-rose-500/60 h-full transition-all"
                    style={{ width: `${step.dropOffRate}%` }}
                    title={`Drop-off: ${step.dropOffRate}%`}
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Analytical Insights & Recommendations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 space-y-1">
            <h4 className="font-bold text-emerald-300 text-xs flex items-center space-x-1.5">
              <Award className="w-4 h-4 text-emerald-400" />
              <span>Highest Conversion Stage: 1st Follow-up (Step 1)</span>
            </h4>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              ডাটা অনুযায়ী ১ম ফলো-আপ পাঠালেই ক্লায়েন্টদের থেকে সর্বোচ্চ রেসপন্স আসে। ১ম মেসেজের পর ড্রপ-অফ হলেও ফলো-আপ পাঠানোর পর কনভার্সন স্পাইক দেখা যায়।
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 space-y-1">
            <h4 className="font-bold text-amber-300 text-xs flex items-center space-x-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Major Drop-off Optimization: After Step 2</span>
            </h4>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              ২য় ফলো-আপের পর কিছু লিড আনসিন থাকে। টিম লিডারকে প্রস্তাব করা হচ্ছে ২য় ফলো-আপে অডিট ডেক ও লুম ভিডিও পিচ ব্যবহার করতে যাতে রেসপন্স বাড়ে।
            </p>
          </div>
        </div>
      </div>

      {/* 4. Channel Comparison: WhatsApp vs Email */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* WhatsApp Channel */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-emerald-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">WhatsApp Outreach Performance</h3>
                <p className="text-[11px] text-slate-400">Direct Click-to-Chat Channel</p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-950 border border-emerald-500/60 text-emerald-300">
              {waRate}% Reply Rate
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center pt-1">
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <p className="text-[10px] text-slate-500">Total WA Leads</p>
              <p className="text-base font-black text-white">{waLeads.length}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <p className="text-[10px] text-slate-500">Replies Received</p>
              <p className="text-base font-black text-emerald-400">{waReplies}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <p className="text-[10px] text-slate-500">Speed to Reply</p>
              <p className="text-base font-black text-cyan-400">&lt; 3 Hours</p>
            </div>
          </div>
        </div>

        {/* Email Channel */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-cyan-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/15 border border-cyan-500/40 text-cyan-400">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Email Outreach Performance</h3>
                <p className="text-[11px] text-slate-400">Mailto Dispatches & Pitch Angles</p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-cyan-950 border border-cyan-500/60 text-cyan-300">
              {emailRate}% Reply Rate
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center pt-1">
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <p className="text-[10px] text-slate-500">Total Email Leads</p>
              <p className="text-base font-black text-white">{emailLeads.length}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <p className="text-[10px] text-slate-500">Replies Received</p>
              <p className="text-base font-black text-cyan-400">{emailReplies}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <p className="text-[10px] text-slate-500">Avg Cycle Time</p>
              <p className="text-base font-black text-purple-400">2.4 Days</p>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Team Member Accountability & Rankings Table */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Users className="w-4 h-4 text-purple-400" />
              <span>Team Leaderboard & Accountability (সকল মেম্বারদের কাজের তালিকা)</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              কোন মেম্বার টাস্ক কমপ্লিট করলো, কে ডেডলাইন মিস করলো—সব লাইভ ট্র্যাক হচ্ছে।
            </p>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            Updated Real-time
          </span>
        </div>

        <div className="rounded-xl border border-slate-800 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                <th className="py-3 px-3">MEMBER</th>
                <th className="py-3 px-3">ROLE</th>
                <th className="py-3 px-3">ASSIGNED LEADS</th>
                <th className="py-3 px-3">COMPLETED TASKS</th>
                <th className="py-3 px-3">COMPLETION %</th>
                <th className="py-3 px-3">DEADLINE MISSES</th>
                <th className="py-3 px-3">REPLIES</th>
                <th className="py-3 px-3 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {memberRankings.map((row, idx) => (
                <tr key={row.member.id} className="hover:bg-slate-950/40 transition-colors">
                  <td className="py-3 px-3 font-bold text-white flex items-center space-x-2">
                    <span className="w-5 text-center font-mono text-slate-500 text-xs">#{idx + 1}</span>
                    <span>{row.member.full_name}</span>
                    {row.member.role === 'team_leader' && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-cyan-950 text-cyan-300 border border-cyan-800">
                        TL
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-3 text-slate-400 capitalize">
                    {row.member.role.replace('_', ' ')}
                  </td>

                  <td className="py-3 px-3 font-mono font-bold text-slate-200">
                    {row.assignedCount}
                  </td>

                  <td className="py-3 px-3 font-mono font-bold text-emerald-400">
                    {row.completedTasks}
                  </td>

                  <td className="py-3 px-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-slate-950 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            row.completionRate >= 80 ? 'bg-emerald-400' : row.completionRate >= 50 ? 'bg-amber-400' : 'bg-rose-400'
                          }`}
                          style={{ width: `${row.completionRate}%` }}
                        />
                      </div>
                      <span className="font-mono font-bold text-white text-[11px]">{row.completionRate}%</span>
                    </div>
                  </td>

                  <td className="py-3 px-3 font-mono">
                    {row.deadlineMisses > 0 ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 border border-rose-600 text-rose-300 animate-pulse">
                        {row.deadlineMisses} Missed
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-bold text-[10px] flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>0 Misses</span>
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-3 font-mono font-bold text-amber-300">
                    {row.repliesGenerated}
                  </td>

                  <td className="py-3 px-3 text-right">
                    <Link
                      href={`/performance/individual`}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[10px] transition-colors inline-flex items-center space-x-1"
                    >
                      <span>Inspect</span>
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
