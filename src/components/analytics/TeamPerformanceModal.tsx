'use client';

import React, { useMemo } from 'react';
import { useApp } from '@/lib/context/app-context';
import { 
  BarChart3, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  User, 
  TrendingUp, 
  Award, 
  ShieldAlert,
  Flame,
  Zap,
  Target
} from 'lucide-react';

interface TeamPerformanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TeamPerformanceModal({ isOpen, onClose }: TeamPerformanceModalProps) {
  const { teamMembers, leads, activities, mistakes, currentUser, setCurrentUser, setSelectedLead, setIsLeadDrawerOpen } = useApp();

  // Metrics for each member
  const memberMetrics = useMemo(() => {
    return teamMembers.map((member) => {
      // 1. Leads assigned to this member
      const assignedLeads = leads.filter(l => l.current_assignee_id === member.id && !l.is_dnc);

      // 2. Tasks Due Today (leads in active cadence requiring messages/follow-ups)
      const activeCadenceLeads = assignedLeads.filter(l => l.stage === 'contacted');
      const tasksDueToday = Math.max(activeCadenceLeads.length, 5); // baseline minimum daily task load

      // 3. Completed Today (cadence advances or status updates logged by this member)
      const memberActivities = activities.filter(a => a.author_id === member.id);
      const completedToday = memberActivities.filter(a => a.activity_type === 'cadence_advance' || a.activity_type === 'status_change').length;

      // 4. Failed / Missed Tasks (cadence step >= 1 with unseen client reaction or overdue)
      const failedOrOverdueLeads = activeCadenceLeads.filter(l => l.cadence_step >= 1 && l.last_client_reaction === 'unseen');
      const failedCount = failedOrOverdueLeads.length;

      // 5. Completion Percentage
      const completionRate = Math.min(100, Math.round(((completedToday + (tasksDueToday - failedCount)) / (tasksDueToday * 1.5)) * 100));

      // 6. Mistakes logged for this member
      const memberMistakes = mistakes.filter(m => m.member_id === member.id);

      // 7. Status Category
      let status: 'crushing' | 'on_track' | 'needs_attention';
      if (failedCount === 0 && completionRate >= 80) {
        status = 'crushing';
      } else if (failedCount <= 1 && completionRate >= 50) {
        status = 'on_track';
      } else {
        status = 'needs_attention';
      }

      return {
        member,
        assignedCount: assignedLeads.length,
        tasksDueToday,
        completedToday,
        failedCount,
        failedLeads: failedOrOverdueLeads,
        completionRate,
        mistakesCount: memberMistakes.length,
        mistakes: memberMistakes,
        status
      };
    }).sort((a, b) => b.completionRate - a.completionRate);
  }, [teamMembers, leads, activities, mistakes]);

  // Overall Team Summary
  const teamTotalAssigned = leads.filter(l => l.current_assignee_id && !l.is_dnc).length;
  const teamTotalFailed = memberMetrics.reduce((acc, m) => acc + m.failedCount, 0);
  const teamAverageRate = Math.round(memberMetrics.reduce((acc, m) => acc + m.completionRate, 0) / (memberMetrics.length || 1));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        className="w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide flex items-center space-x-2">
                <span>Team Performance & Daily Accountability</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-950 text-cyan-300 border border-cyan-800">
                  Live Transparency
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Daily task completion rates, missed follow-ups analysis, and mistake tracking for all 8 members
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 scrollbar-thin">
          
          {/* Top 3 High-Level Metric Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                <Target className="w-3.5 h-3.5 text-cyan-400" />
                <span>Overall Team Velocity</span>
              </span>
              <div className="mt-2 flex items-baseline space-x-2">
                <span className="text-2xl font-black text-white">{teamAverageRate}%</span>
                <span className="text-xs text-emerald-400 font-bold">Daily Avg</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Based on task volume across all active outreach reps.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Total Active In-Cadence</span>
              </span>
              <div className="mt-2 flex items-baseline space-x-2">
                <span className="text-2xl font-black text-cyan-300">{teamTotalAssigned}</span>
                <span className="text-xs text-slate-400 font-semibold">Leads</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Assigned leads currently in 1st message or follow-ups.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>Missed / Failed Follow-ups</span>
              </span>
              <div className="mt-2 flex items-baseline space-x-2">
                <span className="text-2xl font-black text-rose-400">{teamTotalFailed}</span>
                <span className="text-xs text-rose-300/80 font-bold">Due & Unsent</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Follow-ups due today where prospect status is unverified.</p>
            </div>
          </div>

          {/* Members Accountability Leaderboard Table */}
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/70">
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
                <Award className="w-4 h-4 text-amber-400" />
                <span>Individual Member Task Completion & Accountability</span>
              </h3>
              <span className="text-[11px] text-slate-400">
                Sorted by completion percentage
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] font-black uppercase text-slate-400 bg-slate-950">
                    <th className="py-3 px-4">Member</th>
                    <th className="py-3 px-3">Role</th>
                    <th className="py-3 px-3 text-center">Assigned</th>
                    <th className="py-3 px-3 text-center">Tasks Due</th>
                    <th className="py-3 px-3 text-center">Done Today</th>
                    <th className="py-3 px-3 text-center">Failed / Missed</th>
                    <th className="py-3 px-3">Daily Progress</th>
                    <th className="py-3 px-3 text-center">Mistakes</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {memberMetrics.map(({ member, assignedCount, tasksDueToday, completedToday, failedCount, completionRate, mistakesCount, status }, idx) => (
                    <tr 
                      key={member.id} 
                      className={`hover:bg-slate-900/60 transition-colors ${
                        member.id === currentUser.id ? 'bg-cyan-950/20' : ''
                      }`}
                    >
                      {/* Member Info */}
                      <td className="py-3 px-4 font-bold text-white flex items-center space-x-2">
                        <span className="text-slate-500 font-mono text-[10px] w-4">#{idx + 1}</span>
                        <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-cyan-300">
                          {member.full_name.charAt(0)}
                        </div>
                        <div>
                          <p className="flex items-center space-x-1">
                            <span>{member.full_name}</span>
                            {member.role === 'team_leader' && <span className="text-amber-400">👑</span>}
                            {member.id === currentUser.id && (
                              <span className="text-[9px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-1 rounded">You</span>
                            )}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono">@{member.username}</p>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3 px-3 text-slate-400 capitalize">
                        {member.role === 'team_leader' ? 'Leader' : 'Outreach Rep'}
                      </td>

                      {/* Assigned Leads */}
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-200">
                        {assignedCount}
                      </td>

                      {/* Tasks Due Today */}
                      <td className="py-3 px-3 text-center font-mono text-slate-400">
                        {tasksDueToday}
                      </td>

                      {/* Completed Today */}
                      <td className="py-3 px-3 text-center font-mono font-bold text-emerald-400">
                        {completedToday}
                      </td>

                      {/* Failed / Missed Tasks */}
                      <td className="py-3 px-3 text-center font-mono font-bold">
                        {failedCount > 0 ? (
                          <span className="text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/80">
                            {failedCount} missed
                          </span>
                        ) : (
                          <span className="text-emerald-400">0</span>
                        )}
                      </td>

                      {/* Progress Bar */}
                      <td className="py-3 px-3 min-w-[130px]">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-bold">
                            <span className={completionRate >= 80 ? 'text-emerald-400' : completionRate >= 50 ? 'text-amber-400' : 'text-rose-400'}>
                              {completionRate}%
                            </span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-300 ${
                                completionRate >= 80 
                                  ? 'bg-emerald-400' 
                                  : completionRate >= 50 
                                  ? 'bg-amber-400' 
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${completionRate}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Mistakes Count */}
                      <td className="py-3 px-3 text-center">
                        {mistakesCount > 0 ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-950 text-amber-300 border border-amber-700">
                            {mistakesCount}
                          </span>
                        ) : (
                          <span className="text-slate-600 text-[10px]">None</span>
                        )}
                      </td>

                      {/* Accountability Status */}
                      <td className="py-3 px-4 text-right">
                        {status === 'crushing' ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-950/90 text-emerald-300 border border-emerald-600/70">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>100% On-Time</span>
                          </span>
                        ) : status === 'on_track' ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-950/80 text-amber-300 border border-amber-600/60">
                            <Clock className="w-3 h-3 text-amber-400" />
                            <span>In Progress</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-950 text-rose-300 border border-rose-600 animate-pulse">
                            <AlertTriangle className="w-3 h-3 text-rose-400" />
                            <span>Failed Tasks</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Missed Work & Diagnostics Alert Box */}
          {teamTotalFailed > 0 && (
            <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/80 space-y-2">
              <div className="flex items-center space-x-2 text-rose-300 font-bold text-xs">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>⚠️ Missed Follow-ups Diagnostic & Remediation Queue</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                The following tasks were scheduled for follow-up but have not yet been marked completed or have unverified responses:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {memberMetrics.flatMap(m => m.failedLeads.map(lead => ({ lead, member: m.member }))).map(({ lead, member }) => (
                  <div 
                    key={lead.id}
                    onClick={() => {
                      setSelectedLead(lead);
                      setIsLeadDrawerOpen(true);
                      onClose();
                    }}
                    className="p-2.5 rounded-lg bg-slate-900 border border-rose-900/60 hover:border-rose-500 cursor-pointer transition-all flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-white text-xs truncate max-w-[200px]">{lead.company_name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        Assigned: <strong>{member.full_name}</strong> • Follow-up {lead.cadence_step}
                      </p>
                    </div>
                    <span className="text-[10px] text-cyan-300 font-bold hover:underline">
                      Open Lead →
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
