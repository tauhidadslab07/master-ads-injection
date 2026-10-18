'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/context/app-context';
import { DailyTask, DailyTaskCategory, DailyTaskPriority, DailyTaskStatus } from '@/types/crm';
import { 
  Crown, 
  Plus, 
  CheckSquare, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  Target, 
  Sparkles, 
  Trash2, 
  ArrowLeft, 
  Filter, 
  Calendar, 
  FileText, 
  MessageSquare, 
  Zap, 
  Lock,
  X,
  ChevronRight,
  TrendingUp,
  UserCheck
} from 'lucide-react';

export default function LeaderTasksPage() {
  const { 
    currentUser, 
    leaderSession, 
    teamMembers, 
    dailyTasks, 
    createDailyTask, 
    updateDailyTaskStatus, 
    deleteDailyTask 
  } = useApp();

  const isLeader = currentUser.role === 'team_leader' || !!leaderSession;

  // Filter states
  const [todayStr, setTodayStr] = useState<string>('2026-10-18');
  const [filterDate, setFilterDate] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<DailyTaskCategory>('lead_hunting');
  const [priority, setPriority] = useState<DailyTaskPriority>('high');
  const [targetCount, setTargetCount] = useState<number>(20);
  const [targetDate, setTargetDate] = useState<string>('2026-10-18');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  // Sync today's date safely on client mount
  React.useEffect(() => {
    const now = new Date().toISOString().split('T')[0];
    setTodayStr(now);
    setTargetDate(now);
  }, []);

  // Available sales team members to assign (excluding team leader himself)
  const assignableMembers = useMemo(() => {
    return teamMembers.filter(m => m.role !== 'team_leader');
  }, [teamMembers]);

  // Handle select all / clear all members
  const handleSelectAllMembers = () => {
    if (selectedMemberIds.length === assignableMembers.length) {
      setSelectedMemberIds([]);
    } else {
      setSelectedMemberIds(assignableMembers.map(m => m.id));
    }
  };

  const handleToggleMember = (id: string) => {
    setSelectedMemberIds(prev => 
      prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]
    );
  };

  // Submit new task
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('অনুগ্রহ করে টাস্কের শিরোনাম (Title) লিখুন।');
      return;
    }
    if (selectedMemberIds.length === 0) {
      setFormError('কমপক্ষে একজন মেম্বারকে সিলেক্ট করুন।');
      return;
    }

    const leaderId = leaderSession?.id || currentUser.id || 'usr-tauhid';

    createDailyTask({
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      priority,
      target_count: targetCount > 0 ? targetCount : undefined,
      target_date: targetDate,
      assigned_by_id: leaderId,
      assigned_member_ids: selectedMemberIds
    });

    // Reset and close
    setTitle('');
    setDescription('');
    setSelectedMemberIds([]);
    setFormError(null);
    setIsModalOpen(false);
  };

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return dailyTasks.filter(t => {
      if (filterDate === 'today' && t.target_date !== todayStr) return false;
      if (filterCategory !== 'all' && t.category !== filterCategory) return false;
      if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
      return true;
    });
  }, [dailyTasks, filterDate, filterCategory, filterPriority, todayStr]);

  // Overall statistics
  const totalTasks = dailyTasks.length;
  let totalDispatchedSlots = 0;
  let totalCompletedSlots = 0;
  let totalInProgressSlots = 0;
  let totalPendingSlots = 0;

  dailyTasks.forEach(task => {
    task.assigned_member_ids.forEach(mId => {
      totalDispatchedSlots++;
      const st = task.assignee_statuses[mId]?.status || 'pending';
      if (st === 'completed') totalCompletedSlots++;
      else if (st === 'in_progress') totalInProgressSlots++;
      else totalPendingSlots++;
    });
  });

  const overallCompletionRate = totalDispatchedSlots > 0 
    ? Math.round((totalCompletedSlots / totalDispatchedSlots) * 100) 
    : 0;

  // Non-leader Access Guard
  if (!isLeader) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-white">
            টিম লিডার এক্সেস প্রয়োজন (Team Leader Only)
          </h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            শুধুমাত্র টিম লিডার তৌহিদ মেম্বারদের জন্য ডেইলি টাস্ক তৈরি ও পরিচালনা করতে পারেন। আপনার জন্য নির্ধারিত কাজ দেখতে অনুগ্রহ করে হোম ড্যাশবোর্ডে ফিরে যান।
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 hover:bg-cyan-400 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>হোম ড্যাশবোর্ডে ফিরে যান (Today&apos;s Work)</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const categoryLabels: Record<DailyTaskCategory, { label: string; icon: string; color: string }> = {
    lead_hunting: { label: 'নতুন লিড হান্টিং', icon: '📥', color: 'text-blue-400 bg-blue-950/60 border-blue-700/60' },
    cadence_followup: { label: 'ফলো-আপ ও মেসেজিং', icon: '💬', color: 'text-emerald-400 bg-emerald-950/60 border-emerald-700/60' },
    quality_audit: { label: 'কোয়ালিটি অডিট', icon: '🔍', color: 'text-purple-400 bg-purple-950/60 border-purple-700/60' },
    closing_call: { label: 'ক্লোজিং কল', icon: '📞', color: 'text-amber-400 bg-amber-950/60 border-amber-700/60' },
    custom_goal: { label: 'কাস্টম ডেইলি গোল', icon: '🎯', color: 'text-cyan-400 bg-cyan-950/60 border-cyan-700/60' }
  };

  const priorityLabels: Record<DailyTaskPriority, { label: string; color: string }> = {
    urgent: { label: 'জরুরি (Urgent)', color: 'bg-rose-950 text-rose-300 border-rose-700' },
    high: { label: 'উচ্চ (High)', color: 'bg-amber-950 text-amber-300 border-amber-700' },
    normal: { label: 'স্বাভাবিক (Normal)', color: 'bg-cyan-950 text-cyan-300 border-cyan-700' },
    low: { label: 'সাধারণ (Low)', color: 'bg-slate-800 text-slate-400 border-slate-700' }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* 1. Header Banner */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-400 flex items-center justify-center shadow-lg shadow-amber-950/30">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-black text-white tracking-wide">
                  Daily Task Dispatcher (টিম লিডার টাস্ক বোর্ড)
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-950 text-amber-300 border border-amber-800">
                  Tauhid Super-Admin
                </span>
              </div>
              <p className="text-xs text-slate-400">
                টিম মেম্বারদের জন্য আজকের কাজ নির্ধারণ করুন, এক বা একাধিক ব্যক্তিকে একসাথে এসাইন করুন এবং রিয়েল-টাইমে কাজের আপডেট পর্যবেক্ষণ করুন।
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-emerald-500 text-slate-950 font-black text-xs shadow-xl shadow-cyan-500/20 hover:opacity-95 transition-opacity active:scale-[0.98] self-start md:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>+ নতুন ডেইলি টাস্ক দিন (Create Task)</span>
        </button>
      </div>

      {/* 2. KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Tasks */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>মোট টাস্ক</span>
            <CheckSquare className="w-4 h-4 text-cyan-400" />
          </p>
          <p className="text-2xl font-black text-white">{totalTasks}</p>
          <p className="text-[10px] text-slate-400">অ্যাসাইন করা কাজের মোট তালিকা</p>
        </div>

        {/* Multi-Member Dispatched Count */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>মেম্বার অ্যাসাইনমেন্ট</span>
            <Users className="w-4 h-4 text-purple-400" />
          </p>
          <p className="text-2xl font-black text-purple-300">{totalDispatchedSlots}</p>
          <p className="text-[10px] text-slate-400">মেম্বারদের ড্যাশবোর্ডে লাইভ স্লট</p>
        </div>

        {/* Completed Progress % */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>সম্পন্ন হার (Rate)</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </p>
          <p className="text-2xl font-black text-emerald-400">{overallCompletionRate}%</p>
          <p className="text-[10px] text-emerald-400/80 font-bold">
            {totalCompletedSlots} / {totalDispatchedSlots} টি স্লট সম্পন্ন
          </p>
        </div>

        {/* Pending / In-Progress */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>চলতি / অপেক্ষমান</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </p>
          <p className="text-2xl font-black text-amber-300">
            {totalInProgressSlots + totalPendingSlots}
          </p>
          <p className="text-[10px] text-amber-400/80">
            {totalInProgressSlots} টি চলছে • {totalPendingSlots} টি অপেক্ষমান
          </p>
        </div>
      </div>

      {/* 3. Filters & Controls */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-bold flex items-center space-x-1 mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>ফিল্টার:</span>
          </span>

          {/* Date Filter */}
          <select
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500 font-medium"
          >
            <option value="all">সকল তারিখের কাজ</option>
            <option value="today">শুধুমাত্র আজকের কাজ ({todayStr})</option>
          </select>

          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500 font-medium"
          >
            <option value="all">সকল ক্যাটাগরি</option>
            <option value="lead_hunting">📥 লিড হান্টিং</option>
            <option value="cadence_followup">💬 ফলো-আপ মেসেজিং</option>
            <option value="quality_audit">🔍 কোয়ালিটি অডিট</option>
            <option value="closing_call">📞 ক্লোজিং কল</option>
            <option value="custom_goal">🎯 কাস্টম গোল</option>
          </select>

          {/* Priority Filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500 font-medium"
          >
            <option value="all">সকল প্রায়োরিটি</option>
            <option value="urgent">🔴 জরুরি (Urgent)</option>
            <option value="high">🟠 উচ্চ (High)</option>
            <option value="normal">🔵 স্বাভাবিক (Normal)</option>
            <option value="low">⚪ সাধারণ (Low)</option>
          </select>
        </div>

        <span className="text-xs text-slate-400">
          প্রদর্শিত হচ্ছে: <strong className="text-white">{filteredTasks.length}</strong> টি টাস্ক
        </span>
      </div>

      {/* 4. Task Cards List */}
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <div className="p-12 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-3">
            <CheckSquare className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-sm font-bold text-white">কোনো টাস্ক পাওয়া যায়নি</p>
            <p className="text-xs text-slate-400">
              নতুন টাস্ক তৈরি করতে উপরের &quot;+ নতুন ডেইলি টাস্ক দিন&quot; বাটনে ক্লিক করুন।
            </p>
          </div>
        ) : (
          filteredTasks.map(task => {
            const cat = categoryLabels[task.category];
            const pri = priorityLabels[task.priority];

            // Calculate progress for this task
            const memberCount = task.assigned_member_ids.length;
            const completedCount = task.assigned_member_ids.filter(
              mId => task.assignee_statuses[mId]?.status === 'completed'
            ).length;
            const inProgressCount = task.assigned_member_ids.filter(
              mId => task.assignee_statuses[mId]?.status === 'in_progress'
            ).length;

            const progressPct = memberCount > 0 ? Math.round((completedCount / memberCount) * 100) : 0;

            return (
              <div 
                key={task.id}
                className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4 transition-all hover:border-slate-700"
              >
                {/* Task Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border flex items-center space-x-1 ${cat.color}`}>
                        <span>{cat.icon}</span>
                        <span>{cat.label}</span>
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${pri.color}`}>
                        {pri.label}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono text-slate-400 bg-slate-950 border border-slate-800 flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>{task.target_date}</span>
                      </span>
                      {task.target_count && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-cyan-300 bg-cyan-950/70 border border-cyan-800">
                          🎯 টার্গেট: {task.target_count} টি
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-white tracking-wide">
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
                        {task.description}
                      </p>
                    )}
                  </div>

                  {/* Right: Delete & Overall Progress */}
                  <div className="flex items-center space-x-3 self-end sm:self-auto">
                    <div className="text-right">
                      <p className="text-xs font-bold text-white">
                        {completedCount} / {memberCount} জন সম্পন্ন করেছেন
                      </p>
                      <p className="text-[10px] text-emerald-400 font-bold">
                        {progressPct}% Completed
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm('আপনি কি এই টাস্কটি মুছে ফেলতে চান?')) {
                          deleteDailyTask(task.id);
                        }
                      }}
                      className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-900 transition-colors"
                      title="টাস্ক মুছুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>

                {/* Multi-Member Live Status Breakdown */}
                <div className="pt-2 border-t border-slate-800/80">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center space-x-1">
                    <Users className="w-3.5 h-3.5 text-cyan-400" />
                    <span>অ্যাসাইন করা মেম্বারদের লাইভ স্ট্যাটাস ({memberCount} জন):</span>
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {task.assigned_member_ids.map(mId => {
                      const member = teamMembers.find(m => m.id === mId);
                      const st = task.assignee_statuses[mId] || { member_id: mId, status: 'pending' };
                      
                      let badge = (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-950 text-slate-400 border border-slate-800">
                          ⏳ অপেক্ষমান (Pending)
                        </span>
                      );

                      if (st.status === 'completed') {
                        badge = (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-950 text-emerald-300 border border-emerald-700 flex items-center space-x-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>সম্পন্ন (Completed)</span>
                          </span>
                        );
                      } else if (st.status === 'in_progress') {
                        badge = (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-700 flex items-center space-x-1">
                            <Clock className="w-3 h-3 text-amber-400" />
                            <span>কাজ চলছে (In Progress)</span>
                          </span>
                        );
                      }

                      return (
                        <div 
                          key={mId}
                          className={`p-3 rounded-2xl border text-xs flex flex-col justify-between space-y-1.5 ${
                            st.status === 'completed'
                              ? 'bg-emerald-950/20 border-emerald-800/60'
                              : st.status === 'in_progress'
                              ? 'bg-amber-950/20 border-amber-800/60'
                              : 'bg-slate-950/60 border-slate-800/80'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white text-[11px]">
                                {member?.full_name.charAt(0) || 'M'}
                              </div>
                              <div>
                                <p className="font-bold text-white text-xs leading-tight">
                                  {member?.full_name || 'Member'}
                                </p>
                                <p className="text-[10px] text-slate-500 font-mono">
                                  @{member?.username || mId}
                                </p>
                              </div>
                            </div>
                            {badge}
                          </div>

                          {/* Member note or completion details */}
                          {st.completion_note && (
                            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
                              <span className="text-slate-400 font-bold">মেম্বারের নোট:</span> &quot;{st.completion_note}&quot;
                            </div>
                          )}

                          {/* Quick Leader Action to toggle status */}
                          <div className="flex items-center justify-end space-x-1.5 pt-1 border-t border-slate-800/50">
                            {st.status !== 'completed' && (
                              <button
                                onClick={() => updateDailyTaskStatus(task.id, mId, 'completed', 'লিডার কর্তৃক সম্পন্ন মার্ক করা হয়েছে')}
                                className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 hover:underline"
                              >
                                ✓ সম্পন্ন মার্ক করুন
                              </button>
                            )}
                            {st.status === 'completed' && (
                              <button
                                onClick={() => updateDailyTaskStatus(task.id, mId, 'in_progress', '')}
                                className="text-[10px] font-bold text-amber-400 hover:text-amber-300 hover:underline"
                              >
                                🔄 পুনরায় চালু করুন
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* 5. Create Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div 
            className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/15 border border-cyan-500/40 text-cyan-400">
                  <Plus className="w-5 h-5 stroke-[3]" />
                </div>
                <div>
                  <h2 className="text-base font-black text-white">
                    নতুন ডেইলি টাস্ক তৈরি করুন (Create Daily Task)
                  </h2>
                  <p className="text-xs text-slate-400">
                    আজকের কাজের বিস্তারিত বিবরণ দিন এবং এক বা একাধিক মেম্বারকে অ্যাসাইন করুন
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateTask} className="p-6 space-y-4 overflow-y-auto">
              {/* Task Title */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  টাস্কের শিরোনাম (Task Title) *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setFormError(null);
                  }}
                  placeholder="e.g. আজকে ২০টি নতুন ই-কমার্স ব্র্যান্ড হান্ট করতে হবে"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-medium"
                  autoFocus
                />
              </div>

              {/* Category, Priority & Target Count */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Category */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    কাজের ধরণ (Category)
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as DailyTaskCategory)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500 font-medium"
                  >
                    <option value="lead_hunting">📥 নতুন লিড হান্টিং</option>
                    <option value="cadence_followup">💬 ফলো-আপ মেসেজিং</option>
                    <option value="quality_audit">🔍 কোয়ালিটি অডিট</option>
                    <option value="closing_call">📞 ক্লায়েন্ট ক্লোজিং কল</option>
                    <option value="custom_goal">🎯 কাস্টম গোল</option>
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    প্রায়োরিটি (Priority)
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as DailyTaskPriority)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500 font-medium"
                  >
                    <option value="urgent">🔴 জরুরি (Urgent)</option>
                    <option value="high">🟠 উচ্চ (High)</option>
                    <option value="normal">🔵 স্বাভাবিক (Normal)</option>
                    <option value="low">⚪ সাধারণ (Low)</option>
                  </select>
                </div>

                {/* Target Count */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    টার্গেট সংখ্যা (Target Count)
                  </label>
                  <input
                    type="number"
                    value={targetCount}
                    onChange={(e) => setTargetCount(Number(e.target.value))}
                    min={1}
                    max={100}
                    placeholder="e.g. 20"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-medium"
                  />
                </div>
              </div>

              {/* Target Date */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  টার্গেট তারিখ (Target Date)
                </label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500 font-medium"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  কাজের নির্দেশনা / নোট (Instructions / Description)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="মেম্বারদের জন্য কোনো বিশেষ নিয়ম বা নির্দেশনা থাকলে এখানে লিখুন..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-medium"
                />
              </div>

              {/* Multi-Member Assignment Section */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-white flex items-center space-x-1.5">
                    <Users className="w-3.5 h-3.5 text-cyan-400" />
                    <span>এক বা একাধিক মেম্বার নির্বাচন করুন (Multi-Assignee) *</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleSelectAllMembers}
                    className="text-[11px] font-bold text-cyan-400 hover:underline"
                  >
                    {selectedMemberIds.length === assignableMembers.length 
                      ? 'সকল সিলেক্ট বাতিল করুন' 
                      : '✓ পুরো সেলস টিমকে একসাথে সিলেক্ট করুন'}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400">
                  নির্বাচিত প্রত্যেকের নিজস্ব ড্যাশবোর্ডে আজকের কাজ হিসেবে এটি যুক্ত হবে:
                </p>

                {/* Member Checkbox Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                  {assignableMembers.map(m => {
                    const isSelected = selectedMemberIds.includes(m.id);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleToggleMember(m.id)}
                        className={`p-2.5 rounded-xl border text-left text-xs font-bold flex items-center justify-between transition-all ${
                          isSelected
                            ? 'bg-cyan-950 border-cyan-400 text-cyan-200 shadow-md shadow-cyan-950/50'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="truncate">
                          <p className="truncate text-white">{m.full_name}</p>
                          <p className="text-[10px] text-slate-500 font-mono">@{m.username}</p>
                        </div>
                        {isSelected ? (
                          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                        ) : (
                          <span className="w-4 h-4 rounded-full border border-slate-700 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500 text-rose-300 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold transition-colors"
                >
                  বাতিল (Cancel)
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-emerald-500 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/20 hover:opacity-95 transition-opacity active:scale-[0.98] flex items-center space-x-2"
                >
                  <Zap className="w-4 h-4 fill-slate-950" />
                  <span>টাস্ক ডিসপ্যাচ করুন ({selectedMemberIds.length} জন)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
