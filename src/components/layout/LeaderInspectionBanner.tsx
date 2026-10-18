'use client';

import React from 'react';
import { useApp } from '@/lib/context/app-context';
import { Crown, ArrowLeft, Zap, UserCheck, Shield } from 'lucide-react';

export function LeaderInspectionBanner() {
  const { currentUser, leaderSession, teamMembers, inspectMember, exitInspection } = useApp();

  // Show only if Team Leader session is active AND inspecting someone other than the leader
  if (!leaderSession || currentUser.id === leaderSession.id) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-cyan-950 border-b border-amber-500/50 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 shadow-lg shadow-amber-950/20 z-40 sticky top-0">
      
      {/* Left indicator */}
      <div className="flex items-center space-x-2.5">
        <div className="p-1 rounded-lg bg-amber-500/20 border border-amber-400 text-amber-300 animate-pulse">
          <Crown className="w-4 h-4" />
        </div>
        <div>
          <span className="font-black text-amber-300 uppercase tracking-wider text-[11px] mr-1.5">
            টিম লিডার ইনস্পেকশন মোড (Team Leader Mode)
          </span>
          <span className="text-slate-300">
            আপনি বর্তমানে <strong className="text-white underline decoration-amber-400 decoration-2 underline-offset-2">{currentUser.full_name}</strong> এর ড্যাশবোর্ড ও প্রোফাইল পর্যবেক্ষণ করছেন
          </span>
        </div>
      </div>

      {/* Middle: Quick Jump to any other member */}
      <div className="hidden lg:flex items-center space-x-1.5 overflow-x-auto py-0.5">
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center space-x-1 mr-1">
          <Zap className="w-3 h-3 text-cyan-400" />
          <span>Quick Go:</span>
        </span>
        {teamMembers
          .filter(m => m.id !== leaderSession.id)
          .map(m => (
            <button
              key={m.id}
              onClick={() => inspectMember(m)}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                m.id === currentUser.id
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'bg-slate-900/90 text-slate-300 border border-slate-700 hover:border-amber-400 hover:text-white'
              }`}
            >
              {m.full_name}
            </button>
          ))}
      </div>

      {/* Right: Return to Leader Profile */}
      <div className="flex items-center space-x-2">
        <button
          onClick={exitInspection}
          className="flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 transition-all active:scale-95"
        >
          <ArrowLeft className="w-3.5 h-3.5 stroke-[3]" />
          <span>তৌহিদ (Team Leader)-এ ফিরে যান</span>
        </button>
      </div>

    </div>
  );
}
