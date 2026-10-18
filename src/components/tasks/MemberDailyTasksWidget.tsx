'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/context/app-context';
import { DailyTask, DailyTaskStatus } from '@/types/crm';
import { 
  ClipboardList, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Check, 
  ChevronRight, 
  MessageSquare,
  Sparkles,
  Zap
} from 'lucide-react';

export function MemberDailyTasksWidget() {
  const { currentUser, dailyTasks, updateDailyTaskStatus } = useApp();

  // Tasks assigned to this specific member
  const myTasks = dailyTasks.filter(t => t.assigned_member_ids.includes(currentUser.id));

  // State for active task note modal / input
  const [activeTaskForNote, setActiveTaskForNote] = useState<string | null>(null);
  const [completionNote, setCompletionNote] = useState('');
  const [progressCount, setProgressCount] = useState<number | undefined>(undefined);

  if (myTasks.length === 0) {
    return null; // No tasks assigned to this user, don't clutter
  }

  const handleStartWork = (taskId: string) => {
    updateDailyTaskStatus(taskId, currentUser.id, 'in_progress', 'কাজ শুরু করা হয়েছে');
  };

  const handleOpenCompleteModal = (task: DailyTask) => {
    const currentStatus = task.assignee_statuses[currentUser.id];
    setActiveTaskForNote(task.id);
    setCompletionNote(currentStatus?.completion_note || '');
    setProgressCount(currentStatus?.progress_count || task.target_count || undefined);
  };

  const handleSaveCompletion = (taskId: string) => {
    updateDailyTaskStatus(
      taskId, 
      currentUser.id, 
      'completed', 
      completionNote.trim() || 'কাজ সম্পন্ন হয়েছে', 
      progressCount
    );
    setActiveTaskForNote(null);
    setCompletionNote('');
  };

  return (
    <div className="p-5 rounded-3xl bg-gradient-to-r from-slate-900 via-cyan-950/20 to-slate-900 border border-cyan-500/40 shadow-2xl shadow-cyan-950/20 space-y-4">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shadow-md shadow-cyan-950/30">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-black text-white tracking-wide">
                টিম লিডার প্রদত্ত আজকের কাজ (Daily Assigned Tasks)
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-950 text-cyan-300 border border-cyan-700">
                {myTasks.length} টি টাস্ক
              </span>
            </div>
            <p className="text-xs text-slate-400">
              টিম লিডার তৌহিদ আপনাকে আজকের জন্য যে কাজগুলো দিয়েছেন তা সম্পন্ন করে এখানে স্ট্যাটাস আপডেট করুন।
            </p>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        {myTasks.map(task => {
          const myStatusObj = task.assignee_statuses[currentUser.id] || { member_id: currentUser.id, status: 'pending' };
          const status = myStatusObj.status;

          const isCompleted = status === 'completed';
          const isInProgress = status === 'in_progress';
          const isPending = status === 'pending';

          const priorityBadge: Record<string, { label: string; color: string }> = {
            urgent: { label: '🔴 জরুরি', color: 'bg-rose-950 text-rose-300 border-rose-800' },
            high: { label: '🟠 উচ্চ', color: 'bg-amber-950 text-amber-300 border-amber-800' },
            normal: { label: '🔵 স্বাভাবিক', color: 'bg-cyan-950 text-cyan-300 border-cyan-800' },
            low: { label: '⚪ সাধারণ', color: 'bg-slate-800 text-slate-400 border-slate-700' }
          };

          return (
            <div
              key={task.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                isCompleted
                  ? 'bg-emerald-950/25 border-emerald-500/60 shadow-md shadow-emerald-950/20'
                  : isInProgress
                  ? 'bg-cyan-950/30 border-cyan-500/50 shadow-md shadow-cyan-950/20'
                  : 'bg-slate-950/70 border-slate-800'
              }`}
            >
              {/* Task Title & Badges */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${priorityBadge[task.priority]?.color || 'bg-slate-800 text-slate-300'}`}>
                    {priorityBadge[task.priority]?.label}
                  </span>

                  {/* Status Badge */}
                  {isCompleted && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-950 text-emerald-300 border border-emerald-600 flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>কাজ সম্পন্ন (Completed)</span>
                    </span>
                  )}
                  {isInProgress && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-950 text-amber-300 border border-amber-600 flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-amber-400" />
                      <span>চলমান (In Progress)</span>
                    </span>
                  )}
                  {isPending && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 text-slate-400 border border-slate-800">
                      ⏳ অপেক্ষমান (Pending)
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-white leading-snug">
                  {task.title}
                </h3>

                {task.description && (
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {task.description}
                  </p>
                )}

                {task.target_count && (
                  <div className="flex items-center space-x-2 text-xs text-cyan-400 font-bold pt-0.5">
                    <Zap className="w-3.5 h-3.5" />
                    <span>টার্গেট: {task.target_count} টি কাজ</span>
                  </div>
                )}

                {/* Member completion note if present */}
                {myStatusObj.completion_note && (
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 space-y-0.5">
                    <p className="text-[10px] text-slate-400 font-bold">আপনার নোট / আপডেট:</p>
                    <p className="italic">&quot;{myStatusObj.completion_note}&quot;</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <span className="text-[10px] text-slate-500 font-mono">
                  {task.target_date}
                </span>

                <div className="flex items-center space-x-2">
                  {!isCompleted && isPending && (
                    <button
                      onClick={() => handleStartWork(task.id)}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold transition-all"
                    >
                      🔄 কাজ শুরু করুন
                    </button>
                  )}

                  {!isCompleted ? (
                    <button
                      onClick={() => handleOpenCompleteModal(task)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black shadow-md shadow-emerald-500/20 transition-all flex items-center space-x-1"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>কাজ সম্পন্ন মার্ক করুন</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleOpenCompleteModal(task)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
                    >
                      নোট এডিট করুন
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Completion Modal / Quick Prompt */}
      {activeTaskForNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
          <div 
            className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  কাজ সম্পন্ন ও আপডেট সেভ করুন
                </h3>
                <p className="text-xs text-slate-400">
                  টিম লিডার তৌহিদের কাছে এই আপডেটটি সিঙ্ক হবে
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  কাজের ফলাফল বা মন্তব্য (Completion Note)
                </label>
                <textarea
                  value={completionNote}
                  onChange={(e) => setCompletionNote(e.target.value)}
                  placeholder="e.g. আজকের ২০টি লিড স্টোরে আপলোড সম্পন্ন হয়েছে..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-medium"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  সম্পন্ন সংখ্যা (যদি প্রযোজ্য হয়)
                </label>
                <input
                  type="number"
                  value={progressCount ?? ''}
                  onChange={(e) => setProgressCount(Number(e.target.value))}
                  placeholder="e.g. 20"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTaskForNote(null)}
                className="px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={() => handleSaveCompletion(activeTaskForNote)}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/20"
              >
                CRM-এ আপডেট সেভ করুন
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
