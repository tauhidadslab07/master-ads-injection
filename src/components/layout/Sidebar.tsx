'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/lib/context/app-context';
import { 
  Zap, 
  Layers, 
  Target, 
  Calendar, 
  FolderKanban, 
  BarChart3, 
  FileText, 
  Database, 
  Users, 
  ShieldAlert,
  Flame,
  CheckCircle2
} from 'lucide-react';

interface SidebarProps {
  onOpenTeamModal: () => void;
  onOpenBatchModal: () => void;
  onOpenNichesModal?: () => void;
}

export function Sidebar({ onOpenTeamModal, onOpenBatchModal, onOpenNichesModal }: SidebarProps) {
  const pathname = usePathname();
  const { leads, retroactiveDuplicates, currentUser, selectedNiche, setIsNichesModalOpen } = useApp();

  const isLeader = currentUser.role === 'team_leader';
  const isDeputy = currentUser.is_deputy;

  // Counters
  const todayDueCount = leads.filter(l => l.stage === 'contacted' || l.stage === 'approved').length;
  const pipelineCount = leads.filter(l => ['audit', 'sales_pipeline'].includes(l.stage)).length;
  const duplicateCount = retroactiveDuplicates.length;

  return (
    <aside className="hidden lg:flex w-64 bg-slate-950 border-r border-slate-800/80 flex-col shrink-0 min-h-screen text-xs select-none">
      
      {/* Brand Header */}
      <div className="h-16 flex items-center px-5 space-x-3 border-b border-slate-850">
        <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-md shadow-emerald-950/40">
          <Zap className="w-5 h-5 fill-emerald-400 stroke-emerald-950" />
        </div>
        <div>
          <span className="font-black text-sm tracking-wide text-white block leading-tight">
            MASTER ADS
          </span>
          <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest block">
            INJECTION ENGINE
          </span>
        </div>
      </div>

      {/* Nav List */}
      <div className="flex-1 py-4 px-3 space-y-6 overflow-y-auto">
        
        {/* WORKSPACES Section */}
        <div className="space-y-1">
          <p className="px-3 text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-2">
            Workspaces
          </p>

          {/* Today's Work */}
          <Link
            href="/"
            className={`flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold transition-all ${
              pathname === '/'
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 shadow-md shadow-emerald-950/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/80'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>Today's Work</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-900/60 text-emerald-300">
                {todayDueCount}
              </span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400">
                1
              </span>
            </div>
          </Link>

          {/* Leads Outreach Pool */}
          <Link
            href="/outreach-pool"
            className={`flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold transition-all ${
              pathname === '/outreach-pool'
                ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-700/60 shadow-md shadow-cyan-950/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/80'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <Target className="w-4 h-4 text-cyan-400" />
              <span>Outreach Pool</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-900/60 text-cyan-300">
                {leads.filter(l => !['sales_pipeline', 'closed_won', 'closed_lost'].includes(l.stage)).length}
              </span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400">
                H
              </span>
            </div>
          </Link>

          {/* Leads Pipeline */}
          <Link
            href="/sales-pipeline"
            className={`flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold transition-all ${
              pathname === '/sales-pipeline'
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 shadow-md shadow-emerald-950/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/80'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Sales Pipeline</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-900/60 text-emerald-300">
                {pipelineCount}
              </span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400">
                C
              </span>
            </div>
          </Link>

          {/* Niches / Categories Button */}
          <button
            type="button"
            onClick={onOpenNichesModal || (() => setIsNichesModalOpen(true))}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all active:scale-98 ${
              selectedNiche !== 'all'
                ? 'bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/80'
            }`}
            title="Inspect Ad Niches & Segmentation Deck"
          >
            <div className="flex items-center space-x-2.5">
              <FolderKanban className={`w-4 h-4 ${selectedNiche !== 'all' ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span>Ad Niches</span>
            </div>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-900/50 text-emerald-400 border border-emerald-800/60">
              4 N
            </span>
          </button>

          {/* Intelligent Ad Audits */}
          <button
            type="button"
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900/80 transition-colors"
          >
            <div className="flex items-center space-x-2.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>Ad Audits Deck</span>
            </div>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400">
              {leads.filter(l => l.stage === 'audit').length}
            </span>
          </button>

          {/* Performance Analytics */}
          <button
            type="button"
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900/80 transition-colors"
          >
            <div className="flex items-center space-x-2.5">
              <BarChart3 className="w-4 h-4 text-slate-400" />
              <span>Analytics & ROAS</span>
            </div>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400">
              5
            </span>
          </button>

        </div>

        {/* OPERATIONS Section */}
        <div className="space-y-1">
          <p className="px-3 text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-2">
            Operations
          </p>

          {/* Cadence Scripts */}
          <button
            type="button"
            onClick={onOpenBatchModal}
            className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900/80 transition-colors"
          >
            <FileText className="w-4 h-4 text-cyan-400" />
            <span>Cadence Scripts</span>
          </button>

          {/* Backup & Export */}
          <button
            type="button"
            className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900/80 transition-colors"
          >
            <Database className="w-4 h-4 text-amber-400" />
            <span>Backup & Sync</span>
          </button>

          {/* Team & Access */}
          <button
            type="button"
            onClick={onOpenTeamModal}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900/80 transition-colors"
          >
            <div className="flex items-center space-x-2.5">
              <Users className="w-4 h-4 text-rose-400" />
              <span>Team & Access</span>
            </div>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-rose-950 border border-rose-800 text-rose-300">
              {isLeader ? 'ADMIN' : isDeputy ? 'DEPUTY' : 'TEAM'}
            </span>
          </button>

        </div>

      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-850 bg-slate-950/70 text-[11px] text-slate-500">
        <div className="flex items-center justify-between">
          <span>Active Hunter:</span>
          <strong className="text-slate-300">{currentUser.full_name.split(' ')[0]}</strong>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span>Streak:</span>
          <span className="text-amber-400 font-bold">🔥 {currentUser.consecutive_approvals} streak</span>
        </div>
      </div>

    </aside>
  );
}
